import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { openapi } from './openapi.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA = path.join(__dirname, 'research_data');
const NODES = path.join(DATA, 'nodes');
const CTX = path.join(DATA, 'context');
const GRAPH = path.join(DATA, 'graph.json');
const TIMELINE = path.join(DATA, 'timeline.json');
const QUESTIONS = path.join(DATA, 'questions.json');
const CONFIG = path.join(DATA, 'config.json');
const REPORTS = path.join(DATA, 'change-reports');

// Re-checked on every /api request, not just at boot — the whole point of
// research_data/ is that users delete it by hand to start a fresh project
// while the server is still running.
function ensureDirs() {
  fs.mkdirSync(NODES, { recursive: true });
  fs.mkdirSync(CTX, { recursive: true });
  fs.mkdirSync(REPORTS, { recursive: true });
  if (!fs.existsSync(CONFIG)) {
    fs.writeFileSync(CONFIG, JSON.stringify({ ollamaUrl: 'http://localhost:11434', ollamaModel: 'llama3.2' }, null, 2));
  }
}
ensureDirs();

const LAYERS = { 1: 'layer1_topic.txt', 2: 'layer2_objective.txt', 3: 'layer3_research_question.txt' };
const okId = (id) => typeof id === 'string' && /^[\w-]{1,80}$/.test(id);
const read = (f, fallback = '') => (fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : fallback);
const normalizeGraph = (graph) => ({
  nodes: Array.isArray(graph?.nodes) ? graph.nodes : [],
  edges: Array.isArray(graph?.edges) ? graph.edges : [],
  revision: Number.isInteger(graph?.revision) ? graph.revision : 0,
});
const readGraph = () => normalizeGraph(JSON.parse(read(GRAPH, '{"nodes":[],"edges":[],"revision":0}')));
const writeGraph = (graph) => {
  const next = { ...normalizeGraph(graph), revision: normalizeGraph(graph).revision + 1 };
  fs.writeFileSync(GRAPH, JSON.stringify(next, null, 2));
  return next;
};
const newId = (prefix) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

const app = express();
app.use(express.json({ limit: '5mb' }));
app.use('/api', (req, res, next) => { ensureDirs(); next(); });

app.get('/api/graph', (req, res) => {
  if (!fs.existsSync(GRAPH)) return res.json({ initialized: false });
  res.json(readGraph());
});

app.put('/api/graph', (req, res) => {
  const { nodes, edges, expectedRevision } = req.body || {};
  if (!Array.isArray(nodes) || !Array.isArray(edges)) return res.status(400).json({ error: 'bad graph' });
  const current = readGraph();
  if (Number.isInteger(expectedRevision) && expectedRevision !== current.revision)
    return res.status(409).json({ error: 'GRAPH_CONFLICT', graph: current });
  const graph = writeGraph({ nodes, edges, revision: current.revision });
  res.json({ ok: true, revision: graph.revision });
});

// Small semantic endpoints for agent-driven experiments. They keep graph and
// Markdown updates together so an agent does not need to edit JSON by hand.
app.get('/api/research/state', (req, res) => {
  res.json({
    graph: readGraph(),
    timeline: fs.existsSync(TIMELINE) ? JSON.parse(read(TIMELINE)) : { months: [] },
    questions: fs.existsSync(QUESTIONS) ? JSON.parse(read(QUESTIONS)) : { questions: [] },
    context: {
      layer1: read(path.join(CTX, LAYERS[1])),
      layer2: read(path.join(CTX, LAYERS[2])),
      layer3: read(path.join(CTX, LAYERS[3])),
    },
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
      status: ['active', 'merged', 'dead'].includes(body.status) ? body.status : 'active',
      outcome: typeof body.outcome === 'string' ? body.outcome : '',
      ...(typeof body.role === 'string' ? { role: body.role } : {}),
      ...(typeof body.kind === 'string' ? { kind: body.kind } : {}),
      ...(body.anchor === true ? { anchor: true } : {}),
      ...(Array.isArray(body.tags) ? { tags: body.tags.filter((t) => typeof t === 'string') } : {}),
      ...(typeof body.exitCriteria === 'string' ? { exitCriteria: body.exitCriteria } : {}),
    },
  };
  graph.nodes.push(node);
  let edge = null;
  if (body.parentId && body.link !== false) {
    edge = { id: newId('e'), source: body.parentId, target: id, data: { kind: 'step' } };
    graph.edges.push(edge);
  }
  writeGraph(graph);
  fs.writeFileSync(path.join(NODES, id + '.md'), typeof body.content === 'string' ? body.content : `# ${title}\n`);
  res.status(201).json({ node, edge, floating: !edge });
});

app.post('/api/research/links', (req, res) => {
  const { source, target, kind = 'step', note = '' } = req.body || {};
  const graph = readGraph();
  if (!graph.nodes.some((n) => n.id === source) || !graph.nodes.some((n) => n.id === target))
    return res.status(400).json({ error: 'source or target not found' });
  if (graph.edges.some((e) => e.source === source && e.target === target)) return res.status(409).json({ error: 'link exists' });
  const edge = { id: newId('e'), source, target, data: { kind: kind === 'merge' ? 'merge' : 'step', ...(note ? { note } : {}) } };
  graph.edges.push(edge);
  writeGraph(graph);
  res.status(201).json({ edge });
});

app.post('/api/research/log', (req, res) => {
  const { nodeId, note, date = new Date().toISOString().slice(0, 10) } = req.body || {};
  if (!okId(nodeId) || typeof note !== 'string' || !note.trim()) return res.status(400).json({ error: 'nodeId and note are required' });
  const file = path.join(NODES, nodeId + '.md');
  if (!fs.existsSync(file)) return res.status(404).json({ error: 'node not found' });
  fs.appendFileSync(file, `\n\n## ${date}\n${note.trim()}\n`);
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
    ...(['positive', 'negative', 'neutral'].includes(finding) ? { finding } : {}),
    ...(typeof contribution === 'string' ? { contribution } : {}),
  };
  graph.edges = graph.edges.map((edge) => edge.source === nodeId ? { ...edge, data: { ...edge.data, kind: 'merge' } } : edge);
  writeGraph(graph);
  res.json({ ok: true, node });
});

app.get('/api/openapi.json', (req, res) => res.json({ ...openapi, servers: [{ url: `${req.protocol}://${req.get('host')}`, description: 'Current server' }] }));
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
  if (!Array.isArray(months)) return res.status(400).json({ error: 'bad timeline' });
  fs.writeFileSync(TIMELINE, JSON.stringify({ months }, null, 2));
  res.json({ ok: true });
});

app.get('/api/questions', (req, res) => {
  res.json(fs.existsSync(QUESTIONS) ? JSON.parse(read(QUESTIONS, '{"questions":[]}')) : { questions: [] });
});

app.put('/api/questions', (req, res) => {
  const { questions } = req.body || {};
  if (!Array.isArray(questions)) return res.status(400).json({ error: 'bad questions' });
  fs.writeFileSync(QUESTIONS, JSON.stringify({ questions }, null, 2));
  // Keep the plain-text compass file in sync so the top bar and file-reading
  // skills (research-export) still see current RQ text. questions.json is the
  // source of truth; layer3 is a derived view.
  const line = questions
    .map((q, i) => `RQ${i + 1}${q.obj >= 0 ? ` (O${q.obj + 1})` : ''}: ${q.text}`)
    .join('\n');
  fs.writeFileSync(path.join(CTX, LAYERS[3]), line);
  res.json({ ok: true });
});

app.get('/api/node/:id', (req, res) => {
  if (!okId(req.params.id)) return res.status(400).json({ error: 'bad id' });
  res.json({ content: read(path.join(NODES, req.params.id + '.md')) });
});

app.put('/api/node/:id', (req, res) => {
  if (!okId(req.params.id)) return res.status(400).json({ error: 'bad id' });
  const { content } = req.body || {};
  if (typeof content !== 'string') return res.status(400).json({ error: 'bad content' });
  fs.writeFileSync(path.join(NODES, req.params.id + '.md'), content);
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
  const notes = read(path.join(NODES, nodeId + '.md'));
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

const PORT = Number(process.env.PORT || 3001);
app.listen(PORT, () => console.log(`Research Navigator API on http://localhost:${PORT}`));
