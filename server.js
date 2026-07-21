import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { openapi } from './core/openapi.js';
import { EDGE_KINDS, FINDINGS, NODE_STATUSES, graphError, okId, questionsError, teamError, timelineError } from './core/contracts.js';
import { edgeMetadata, formatResearchDoc, linkedId, nodeMetadata, parseResearchDoc, reciprocalError } from './core/research-doc.js';
import { applyResearchOperation, buildProject, buildStateMarkdown, initializeProject, readProject, refreshStateMarkdown, sourceFingerprint } from './core/research-project.js';
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { historicalGraph, repositoryActivity } from './core/git-awareness.js';
import { buildPlanExport } from './core/research-export.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA = process.env.RESEARCH_DATA_DIR ? path.resolve(process.env.RESEARCH_DATA_DIR) : path.join(__dirname, 'research_data');
const NODES = path.join(DATA, 'nodes');
const EDGES = path.join(DATA, 'edges');
const CTX = path.join(DATA, 'context');
const GRAPH = path.join(DATA, 'graph.json');
const PROJECT = path.join(DATA, 'PROJECT.md');
const TIMELINE = path.join(DATA, 'timeline.json');
const QUESTIONS = path.join(DATA, 'questions.json');
const TEAM = path.join(DATA, 'team.json');
const CONFIG = path.join(DATA, 'config.json');
const REPORTS = path.join(DATA, 'change-reports');

// Re-checked on every /api request, not just at boot — the whole point of
// research_data/ is that users delete it by hand to start a fresh project
// while the server is still running.
function ensureDirs() {
  fs.mkdirSync(NODES, { recursive: true });
  fs.mkdirSync(EDGES, { recursive: true });
  fs.mkdirSync(CTX, { recursive: true });
  fs.mkdirSync(REPORTS, { recursive: true });
  if (!fs.existsSync(CONFIG)) {
    fs.writeFileSync(CONFIG, JSON.stringify({ ollamaUrl: 'http://localhost:11434', ollamaModel: 'llama3.2' }, null, 2));
  }
}
ensureDirs();

const LAYERS = { 1: 'layer1_topic.txt', 2: 'layer2_objective.txt', 3: 'layer3_research_question.txt' };
const read = (f, fallback = '') => (fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : fallback);
const readDoc = (file) => parseResearchDoc(read(file));
const writeDoc = (file, metadata, body) => fs.writeFileSync(file, formatResearchDoc(metadata, body));
const fileVersion = (content) => createHash('sha256').update(content).digest('hex').slice(0, 16);
const portablePath = (value) => value.split(path.sep).join('/');

function markdownTarget(value) {
  if (typeof value !== 'string' || !value || value.includes('\\')) return null;
  const segments = value.split('/');
  if (segments.some((segment) => !segment || segment === '.' || segment === '..') || path.posix.extname(value).toLowerCase() !== '.md') return null;
  const file = path.resolve(DATA, ...segments);
  const relative = path.relative(DATA, file);
  if (path.isAbsolute(relative) || relative.startsWith('..')) return null;
  return { file, path: portablePath(relative), readOnly: portablePath(relative) === 'STATE.md' };
}

function markdownFilePaths(directory = DATA, prefix = '') {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) return markdownFilePaths(path.join(directory, entry.name), relative);
    return entry.isFile() && entry.name.toLowerCase().endsWith('.md')
      ? [{ path: relative, readOnly: relative === 'STATE.md' }]
      : [];
  }).sort((a, b) => a.path.localeCompare(b.path));
}

function listMarkdownFiles() {
  const documents = markdownFilePaths().map((file) => {
    const { metadata, body } = parseResearchDoc(read(path.join(DATA, ...file.path.split('/'))));
    return { ...file, metadata, heading: body.match(/^#\s+(.+)$/m)?.[1]?.trim() || '' };
  });
  const nodeTitles = new Map(documents
    .filter((file) => file.path.startsWith('nodes/'))
    .map((file) => [file.metadata.id, file.metadata.title || file.heading || file.metadata.id]));
  return documents.map(({ heading, ...file }) => {
    const from = linkedId(file.metadata.from, 'nodes');
    const to = linkedId(file.metadata.to, 'nodes');
    const edgeTitle = from && to ? `${file.metadata.kind || 'link'}: ${nodeTitles.get(from) || from} → ${nodeTitles.get(to) || to}` : '';
    return { ...file, title: file.metadata.title || edgeTitle || heading || file.path.split('/').at(-1) };
  });
}
const graphLayout = (graph, revision) => ({
  nodes: graph.nodes.map(({ id, position }) => ({ id, position })),
  revision,
});

function persistEntities(graph) {
  const nodeIds = new Set(graph.nodes.map((node) => node.id));
  const edgeIds = new Set(graph.edges.map((edge) => edge.id));
  for (const node of graph.nodes) {
    const file = path.join(NODES, node.id + '.md');
    writeDoc(file, nodeMetadata(node, graph.edges), readDoc(file).body);
  }
  for (const edge of graph.edges) {
    const file = path.join(EDGES, edge.id + '.md');
    const current = readDoc(file);
    const body = typeof edge.data?.note === 'string' ? edge.data.note : current.body;
    writeDoc(file, edgeMetadata(edge), body);
  }
  for (const file of fs.readdirSync(EDGES).filter((name) => name.endsWith('.md'))) {
    if (!edgeIds.has(file.slice(0, -3))) fs.rmSync(path.join(EDGES, file));
  }
  for (const file of fs.readdirSync(NODES).filter((name) => name.endsWith('.md'))) {
    if (!nodeIds.has(file.slice(0, -3))) fs.rmSync(path.join(NODES, file));
  }
}

function hydrateGraph(layout) {
  const documents = (layout.nodes || []).map(({ id, position }) => {
    const { metadata } = readDoc(path.join(NODES, id + '.md'));
    const { id: ignored, from, to, ...data } = metadata;
    return { id, position, metadata, data };
  });
  const edges = fs.readdirSync(EDGES)
    .filter((name) => name.endsWith('.md'))
    .map((name) => {
      const id = name.slice(0, -3);
      const { metadata, body } = readDoc(path.join(EDGES, name));
      const { id: ignored, from, to, ...data } = metadata;
      return {
        id,
        source: linkedId(from, 'nodes'),
        target: linkedId(to, 'nodes'),
        data: { ...data, ...(body.trim() ? { note: body } : {}) },
      };
    });
  const linkError = reciprocalError(documents, edges);
  if (linkError) throw new Error(`BROKEN_RESEARCH_LINK: ${linkError}`);
  const graph = {
    nodes: documents.map(({ id, position, data }) => ({ id, position, data })),
    edges,
    revision: Number.isInteger(layout.revision) ? layout.revision : 0,
  };
  const error = graphError(graph);
  if (error) throw new Error(`BROKEN_RESEARCH_DATA: ${error}`);
  return graph;
}

function readGraph() {
  const stored = JSON.parse(read(GRAPH, '{"nodes":[],"revision":0}'));
  if ((stored.nodes || []).some((node) => node.data) || (stored.edges || []).some((edge) => edge.source)) {
    const legacy = {
      nodes: Array.isArray(stored.nodes) ? stored.nodes : [],
      edges: Array.isArray(stored.edges) ? stored.edges : [],
      revision: Number.isInteger(stored.revision) ? stored.revision : 0,
    };
    persistEntities(legacy);
    fs.writeFileSync(GRAPH, JSON.stringify(graphLayout(legacy, legacy.revision), null, 2));
    return legacy;
  }
  return hydrateGraph(stored);
}

const writeGraph = (graph) => {
  const revision = (Number.isInteger(graph.revision) ? graph.revision : 0) + 1;
  persistEntities(graph);
  fs.writeFileSync(GRAPH, JSON.stringify(graphLayout(graph, revision), null, 2));
  refreshStateMarkdown(DATA);
  return { ...graph, revision };
};
const newId = (prefix) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

const app = express();
app.use(express.json({ limit: '5mb' }));
app.use('/api', (req, res, next) => { ensureDirs(); next(); });

app.get('/api/graph', (req, res) => {
  if (!fs.existsSync(GRAPH)) return res.json({ initialized: false });
  res.json(readGraph());
});

app.post('/api/research/init/preview', (req, res) => {
  const project = buildProject(req.body || {});
  res.json({ graph: project.graph, questions: project.questions, timeline: project.timeline, team: project.team, state: buildStateMarkdown(project) });
});

app.post('/api/research/init', (req, res) => {
  if (fs.existsSync(GRAPH)) return res.status(409).json({ error: 'project is already initialized' });
  const project = initializeProject(DATA, req.body || {});
  res.status(201).json({
    ...project,
    fingerprint: sourceFingerprint(project),
    context: { layer1: read(path.join(CTX, LAYERS[1])), layer2: read(path.join(CTX, LAYERS[2])), layer3: read(path.join(CTX, LAYERS[3])) },
  });
});
app.post('/api/research/apply', (req, res) => res.json(applyResearchOperation(DATA, req.body || {})));
app.get('/api/research/export', (req, res) => res.json({ filename: 'PLAN_EXPORT.md', content: buildPlanExport(readProject(DATA)) }));

app.put('/api/graph', (req, res) => {
  const { nodes, edges, expectedRevision } = req.body || {};
  const error = graphError({ nodes, edges });
  if (error) return res.status(400).json({ error });
  const current = readGraph();
  if (Number.isInteger(expectedRevision) && expectedRevision !== current.revision)
    return res.status(409).json({ error: 'GRAPH_CONFLICT', graph: current });
  const graph = writeGraph({ nodes, edges, revision: current.revision });
  res.json({ ok: true, revision: graph.revision });
});

// Small semantic endpoints for agent-driven experiments. They keep graph and
// Markdown updates together so an agent does not need to edit JSON by hand.
app.get('/api/research/state', (req, res) => {
  const project = readProject(DATA);
  const expectedFingerprint = sourceFingerprint(project);
  const storedFingerprint = parseResearchDoc(read(path.join(DATA, 'STATE.md'))).metadata.fingerprint;
  res.json({
    graph: readGraph(),
    timeline: fs.existsSync(TIMELINE) ? JSON.parse(read(TIMELINE)) : { months: [] },
    questions: fs.existsSync(QUESTIONS) ? JSON.parse(read(QUESTIONS)) : { questions: [] },
    team: fs.existsSync(TEAM) ? JSON.parse(read(TEAM)) : { members: [] },
    context: {
      layer1: read(path.join(CTX, LAYERS[1])),
      layer2: read(path.join(CTX, LAYERS[2])),
      layer3: read(path.join(CTX, LAYERS[3])),
    },
    state: { stale: storedFingerprint !== expectedFingerprint, storedFingerprint, expectedFingerprint },
  });
});

app.post('/api/research/nodes', (req, res) => {
  const body = req.body || {};
  const title = typeof body.title === 'string' && body.title.trim();
  if (!title) return res.status(400).json({ error: 'title is required' });
  const graph = readGraph();
  const id = body.id || newId('n');
  if (!okId(id) || graph.nodes.some((n) => n.id === id)) return res.status(400).json({ error: 'bad or duplicate id' });
  if (body.parentId && !graph.nodes.some((n) => n.id === body.parentId)) return res.status(400).json({ error: 'parent not found' });
  const node = {
    id,
    position: body.position || { x: 80 + graph.nodes.length * 40, y: 420 },
    data: {
      title: title.slice(0, 180),
      status: NODE_STATUSES.includes(body.status) ? body.status : 'active',
      outcome: typeof body.outcome === 'string' ? body.outcome : '',
      ...(typeof body.role === 'string' ? { role: body.role } : {}),
      ...(typeof body.kind === 'string' ? { kind: body.kind } : {}),
      ...(body.anchor === true ? { anchor: true } : {}),
      ...(Array.isArray(body.tags) ? { tags: body.tags.filter((t) => typeof t === 'string') } : {}),
      ...(typeof body.exitCriteria === 'string' ? { exitCriteria: body.exitCriteria } : {}),
      ...(typeof body.objectiveId === 'string' ? { objectiveId: body.objectiveId } : {}),
      ...(typeof body.homeAspect === 'string' ? { homeAspect: body.homeAspect } : {}),
      ...(Array.isArray(body.assignees) ? { assignees: body.assignees } : {}),
      ...(typeof body.due === 'string' ? { due: body.due } : {}),
      ...(body.pinned === true ? { pinned: true } : {}),
      ...(body.external && typeof body.external === 'object' ? { external: body.external } : {}),
    },
  };
  graph.nodes.push(node);
  let edge = null;
  if (body.parentId && body.link !== false) {
    edge = { id: newId('e'), source: body.parentId, target: id, data: { kind: 'step' } };
    graph.edges.push(edge);
  }
  fs.writeFileSync(path.join(NODES, id + '.md'), typeof body.content === 'string' ? body.content : `# ${title}\n`);
  writeGraph(graph);
  res.status(201).json({ node, edge, floating: !edge });
});

app.post('/api/research/links', (req, res) => {
  const { source, target, kind = 'step', note = '' } = req.body || {};
  const graph = readGraph();
  if (!graph.nodes.some((n) => n.id === source) || !graph.nodes.some((n) => n.id === target))
    return res.status(400).json({ error: 'source or target not found' });
  if (graph.edges.some((e) => e.source === source && e.target === target)) return res.status(409).json({ error: 'link exists' });
  if (!EDGE_KINDS.includes(kind)) return res.status(400).json({ error: 'bad relationship kind' });
  const edge = { id: newId('e'), source, target, data: { kind, ...(note ? { note } : {}) } };
  graph.edges.push(edge);
  writeGraph(graph);
  res.status(201).json({ edge });
});

app.post('/api/research/log', (req, res) => {
  const { nodeId, note, date = new Date().toISOString().slice(0, 10) } = req.body || {};
  if (!okId(nodeId) || typeof note !== 'string' || !note.trim()) return res.status(400).json({ error: 'nodeId and note are required' });
  const file = path.join(NODES, nodeId + '.md');
  if (!fs.existsSync(file)) return res.status(404).json({ error: 'node not found' });
  const document = readDoc(file);
  writeDoc(file, document.metadata, `${document.body.trimEnd()}\n\n## ${date}\n${note.trim()}\n`);
  refreshStateMarkdown(DATA);
  res.json({ ok: true, nodeId });
});

app.post('/api/research/dead-end', (req, res) => {
  const { nodeId, reason = '' } = req.body || {};
  const graph = readGraph();
  const node = graph.nodes.find((n) => n.id === nodeId);
  if (!node) return res.status(404).json({ error: 'node not found' });
  node.data.status = 'dead';
  node.data.outcome = reason || node.data.outcome || '';
  writeGraph(graph);
  res.json({ ok: true, node });
});

app.post('/api/research/merge', (req, res) => {
  const { nodeId, title, outcome, rq, finding, contribution } = req.body || {};
  const graph = readGraph();
  const node = graph.nodes.find((n) => n.id === nodeId);
  if (!node) return res.status(404).json({ error: 'node not found' });
  if (rq) {
    const questions = fs.existsSync(QUESTIONS) ? JSON.parse(read(QUESTIONS)).questions || [] : [];
    if (!questions.some((question) => question.id === rq)) return res.status(400).json({ error: 'research question not found' });
  }
  node.data = {
    ...node.data,
    status: 'merged',
    ...(typeof title === 'string' && title.trim() ? { title: title.trim().slice(0, 180) } : {}),
    ...(typeof outcome === 'string' ? { outcome } : {}),
    ...(typeof rq === 'string' && rq ? { rq } : {}),
    ...(FINDINGS.includes(finding) ? { finding } : {}),
    ...(typeof contribution === 'string' ? { contribution } : {}),
  };
  const questionNode = rq && graph.nodes.find((candidate) => candidate.data.questionId === rq);
  if (questionNode && !graph.edges.some((edge) => edge.source === nodeId && edge.target === questionNode.id)) {
    graph.edges.push({ id: newId('e'), source: nodeId, target: questionNode.id, data: { kind: 'evidence', note: contribution || `Evidence for ${rq}` } });
  }
  writeGraph(graph);
  res.json({ ok: true, node });
});

app.get('/api/openapi.json', (req, res) => res.json({ ...openapi, servers: [{ url: `${req.protocol}://${req.get('host')}`, description: 'Current server' }] }));
app.get('/api/git/activity', (req, res) => res.json(repositoryActivity(__dirname)));
app.get('/api/git/snapshot/:ref', (req, res) => res.json(historicalGraph(__dirname, req.params.ref)));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(undefined, {
  explorer: true,
  customSiteTitle: 'Research Navigator API',
  swaggerOptions: { url: '/api/openapi.json' },
}));

app.get('/api/timeline', (req, res) => {
  res.json(fs.existsSync(TIMELINE) ? JSON.parse(read(TIMELINE, '{"months":[]}')) : { months: [] });
});

app.put('/api/timeline', (req, res) => {
  const { months } = req.body || {};
  const error = timelineError({ months });
  if (error) return res.status(400).json({ error });
  fs.writeFileSync(TIMELINE, JSON.stringify({ months }, null, 2));
  refreshStateMarkdown(DATA);
  res.json({ ok: true });
});

app.get('/api/questions', (req, res) => {
  res.json(fs.existsSync(QUESTIONS) ? JSON.parse(read(QUESTIONS, '{"questions":[]}')) : { questions: [] });
});

app.get('/api/team', (req, res) => res.json(fs.existsSync(TEAM) ? JSON.parse(read(TEAM, '{"members":[]}')) : { members: [] }));

app.put('/api/team', (req, res) => {
  const value = { members: req.body?.members };
  const error = teamError(value);
  if (error) return res.status(400).json({ error });
  fs.writeFileSync(TEAM, JSON.stringify(value, null, 2) + '\n');
  refreshStateMarkdown(DATA);
  res.json({ ok: true });
});

app.put('/api/questions', (req, res) => {
  const { questions } = req.body || {};
  const error = questionsError({ questions });
  if (error) return res.status(400).json({ error });
  fs.writeFileSync(QUESTIONS, JSON.stringify({ questions }, null, 2));
  // Keep the plain-text compass file in sync so the top bar and file-reading
  // skills (research-export) still see current RQ text. questions.json is the
  // source of truth; layer3 is a derived view.
  const line = questions
    .map((q) => `${q.id}${q.objectiveIds?.length ? ` (${q.objectiveIds.join(', ')})` : ''}: ${q.text}`)
    .join('\n');
  fs.writeFileSync(path.join(CTX, LAYERS[3]), line);
  refreshStateMarkdown(DATA);
  res.json({ ok: true });
});

app.get('/api/node/:id', (req, res) => {
  if (!okId(req.params.id)) return res.status(400).json({ error: 'bad id' });
  res.json({ content: readDoc(path.join(NODES, req.params.id + '.md')).body });
});

app.get('/api/research/files', (req, res) => {
  res.json({ files: listMarkdownFiles() });
});

app.get('/api/research/file', (req, res) => {
  const target = markdownTarget(req.query.path);
  if (!target) return res.status(400).json({ error: 'bad Markdown path' });
  if (!fs.existsSync(target.file) || !fs.statSync(target.file).isFile()) return res.status(404).json({ error: 'Markdown file not found' });
  const realRelative = path.relative(fs.realpathSync(DATA), fs.realpathSync(target.file));
  if (path.isAbsolute(realRelative) || realRelative.startsWith('..')) return res.status(400).json({ error: 'bad Markdown path' });
  const content = read(target.file);
  res.json({ ...target, file: undefined, content, version: fileVersion(content) });
});

app.put('/api/research/file', (req, res) => {
  const target = markdownTarget(req.query.path);
  if (!target) return res.status(400).json({ error: 'bad Markdown path' });
  if (target.readOnly) return res.status(403).json({ error: 'STATE.md is generated and read-only' });
  if (!fs.existsSync(target.file) || !fs.statSync(target.file).isFile()) return res.status(404).json({ error: 'Markdown file not found' });
  const realRelative = path.relative(fs.realpathSync(DATA), fs.realpathSync(target.file));
  if (path.isAbsolute(realRelative) || realRelative.startsWith('..')) return res.status(400).json({ error: 'bad Markdown path' });
  const { content, expectedVersion } = req.body || {};
  if (typeof content !== 'string' || typeof expectedVersion !== 'string') return res.status(400).json({ error: 'content and expectedVersion are required' });
  const original = read(target.file);
  const currentVersion = fileVersion(original);
  if (expectedVersion !== currentVersion) return res.status(409).json({ error: 'Markdown file changed elsewhere', content: original, version: currentVersion });
  try {
    fs.writeFileSync(target.file, content);
    if (fs.existsSync(GRAPH)) refreshStateMarkdown(DATA);
  } catch (error) {
    fs.writeFileSync(target.file, original);
    if (fs.existsSync(GRAPH)) refreshStateMarkdown(DATA);
    throw error;
  }
  res.json({ ok: true, version: fileVersion(content) });
});

app.put('/api/node/:id', (req, res) => {
  if (!okId(req.params.id)) return res.status(400).json({ error: 'bad id' });
  const { content } = req.body || {};
  if (typeof content !== 'string') return res.status(400).json({ error: 'bad content' });
  const file = path.join(NODES, req.params.id + '.md');
  writeDoc(file, readDoc(file).metadata, content);
  refreshStateMarkdown(DATA);
  res.json({ ok: true });
});

app.delete('/api/node/:id', (req, res) => {
  if (!okId(req.params.id)) return res.status(400).json({ error: 'bad id' });
  fs.rmSync(path.join(NODES, req.params.id + '.md'), { force: true });
  res.json({ ok: true });
});

app.get('/api/context', (req, res) => {
  res.json({
    layer1: read(path.join(CTX, LAYERS[1])),
    layer2: read(path.join(CTX, LAYERS[2])),
    layer3: read(path.join(CTX, LAYERS[3])),
  });
});

app.put('/api/context/:layer', (req, res) => {
  const file = LAYERS[req.params.layer];
  if (!file) return res.status(400).json({ error: 'bad layer' });
  const { content } = req.body || {};
  if (typeof content !== 'string') return res.status(400).json({ error: 'bad content' });
  fs.writeFileSync(path.join(CTX, file), content);
  if (req.params.layer === '1' && fs.existsSync(PROJECT)) {
    const project = readDoc(PROJECT);
    writeDoc(PROJECT, { ...project.metadata, topic: content }, project.body.replace(/^# .*$/m, `# ${content}`));
  }
  if (fs.existsSync(GRAPH)) refreshStateMarkdown(DATA);
  res.json({ ok: true });
});

app.post('/api/change-reports', (req, res) => {
  const { type, title, before = '', after = '', affected = [] } = req.body || {};
  if (!type || !title || !Array.isArray(affected)) return res.status(400).json({ error: 'bad change report' });
  const id = `change_${new Date().toISOString().replace(/[:.]/g, '-')}`;
  const report = `# ${title}\n\n- Type: ${type}\n- Created: ${new Date().toISOString()}\n\n## Before\n${before || '(empty)'}\n\n## Proposed\n${after || '(empty)'}\n\n## Affected records\n${affected.length ? affected.map((item) => `- ${item.id}: ${item.title}`).join('\n') : '- None found'}\n`;
  fs.writeFileSync(path.join(REPORTS, `${id}.md`), report);
  res.status(201).json({ ok: true, id, path: `research_data/change-reports/${id}.md` });
});

app.post('/api/summarize', async (req, res) => {
  const { nodeId } = req.body || {};
  if (!okId(nodeId)) return res.status(400).json({ error: 'bad id' });
  const notes = readDoc(path.join(NODES, nodeId + '.md')).body;
  let cfg = {};
  try { cfg = JSON.parse(read(CONFIG, '{}')); } catch { /* fall back to defaults */ }
  const prompt =
    'You are a research log summarizer. Given the raw lab notes below, reply with ONLY valid JSON: ' +
    '{"title": "<max 8 words>", "outcome": "<max 25 words, what was learned or decided>"}. Notes:\n' + notes;
  try {
    const r = await fetch(`${cfg.ollamaUrl || 'http://localhost:11434'}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: cfg.ollamaModel || 'llama3.2', prompt, stream: false, format: 'json' }),
      signal: AbortSignal.timeout(5000),
    });
    if (!r.ok) throw new Error('ollama ' + r.status);
    const data = await r.json();
    const parsed = JSON.parse(data.response);
    if (!parsed.title) throw new Error('empty summary');
    res.json({ title: String(parsed.title), outcome: String(parsed.outcome || '') });
  } catch {
    res.status(502).json({ error: 'AI_OFFLINE' });
  }
});

// Serve the built frontend in production (npm run build && npm start)
const dist = path.join(__dirname, 'dist');
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) return res.sendFile(path.join(dist, 'index.html'));
    next();
  });
}

app.use((error, req, res, next) => {
  if (!req.path.startsWith('/api')) return next(error);
  res.status(500).json({ error: error.message || 'RESEARCH_DATA_ERROR' });
});

const PORT = Number(process.env.PORT || 3001);
app.listen(PORT, () => console.log(`Research Navigator API on http://localhost:${PORT}`));
