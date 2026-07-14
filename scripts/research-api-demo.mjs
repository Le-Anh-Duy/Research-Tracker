const base = process.env.RESEARCH_API || 'http://localhost:3001';

async function call(path, body) {
  const response = await fetch(base + path, {
    method: body ? 'POST' : 'GET',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await response.json();
  if (!response.ok) throw new Error(`${path}: ${response.status} ${JSON.stringify(data)}`);
  return data;
}

const state = await call('/api/research/state');
const objective = state.graph.nodes.find((node) => node.data.anchor && node.id !== 'n_start');
const rq = state.questions.questions[0]?.id || 'RQ1';
if (!objective) throw new Error('No objective found. Initialize a roadmap first.');

const floating = await call('/api/research/nodes', {
  title: 'Agent demo: floating detector hypothesis',
  role: 'experiment',
  tags: ['agent-demo', 'floating'],
  content: '# Agent demo: floating detector hypothesis\n\nThis node intentionally starts without a link.\n',
});
const branch = await call('/api/research/nodes', {
  title: 'Agent demo: linked baseline check',
  parentId: objective.id,
  role: 'experiment',
  tags: ['agent-demo', 'baseline'],
  content: '# Agent demo: linked baseline check\n\n- [ ] Run the baseline check\n',
});
await call('/api/research/log', { nodeId: branch.node.id, note: 'Agent demo note: baseline output was recorded before changing the intervention.' });
const dead = await call('/api/research/nodes', { title: 'Agent demo: rejected branch', parentId: branch.node.id, role: 'experiment', tags: ['agent-demo', 'dead-end'] });
await call('/api/research/dead-end', { nodeId: dead.node.id, reason: 'Agent demo: rejected because the setup changed two variables at once.' });
const synthesis = await call('/api/research/nodes', {
  title: 'Agent demo: synthesis checkpoint', role: 'synthesis', kind: 'synthesis', tags: ['agent-demo', 'synthesis'],
  content: '# Agent demo: synthesis checkpoint\n\nCompare the floating hypothesis with the linked baseline.\n',
});
await call('/api/research/links', { source: floating.node.id, target: synthesis.node.id, kind: 'merge', note: 'Floating hypothesis reviewed here.' });
await call('/api/research/links', { source: branch.node.id, target: synthesis.node.id, kind: 'merge', note: 'Baseline result reviewed here.' });
await call('/api/research/merge', {
  nodeId: synthesis.node.id,
  title: 'Agent demo synthesis complete',
  outcome: 'Demo only: the baseline is retained and the floating hypothesis is ready for a separate test.',
  rq, finding: 'neutral', contribution: 'Demo only: shows create, branch, log, reject, synthesize, and link actions.',
});
console.log(JSON.stringify({ floating: floating.node.id, branch: branch.node.id, dead: dead.node.id, synthesis: synthesis.node.id }, null, 2));
