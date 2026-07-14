import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA = path.join(__dirname, 'research_data');
const NODES = path.join(DATA, 'nodes');
const CTX = path.join(DATA, 'context');
const GRAPH = path.join(DATA, 'graph.json');
const CONFIG = path.join(DATA, 'config.json');

fs.mkdirSync(NODES, { recursive: true });
fs.mkdirSync(CTX, { recursive: true });
if (!fs.existsSync(CONFIG)) {
  fs.writeFileSync(CONFIG, JSON.stringify({ ollamaUrl: 'http://localhost:11434', ollamaModel: 'llama3.2' }, null, 2));
}

const LAYERS = { 1: 'layer1_topic.txt', 2: 'layer2_objective.txt', 3: 'layer3_research_question.txt' };
const okId = (id) => typeof id === 'string' && /^[\w-]{1,80}$/.test(id);
const read = (f, fallback = '') => (fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : fallback);

const app = express();
app.use(express.json({ limit: '5mb' }));

app.get('/api/graph', (req, res) => {
  if (!fs.existsSync(GRAPH)) return res.json({ initialized: false });
  res.type('json').send(read(GRAPH));
});

app.put('/api/graph', (req, res) => {
  const { nodes, edges } = req.body || {};
  if (!Array.isArray(nodes) || !Array.isArray(edges)) return res.status(400).json({ error: 'bad graph' });
  fs.writeFileSync(GRAPH, JSON.stringify({ nodes, edges }, null, 2));
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

app.listen(3001, () => console.log('Research Navigator API on http://localhost:3001'));
