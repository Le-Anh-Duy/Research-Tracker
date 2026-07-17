import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createResearchReader } from '../core/research-context.js';
import { buildProject, initializeProject } from '../core/research-project.js';

const input = {
  topic: 'Synthetic visual localization study',
  objectives: ['Define an attention intervention', 'Evaluate robustness'],
  firstAspects: ['Intervention rules', 'Natural domain shift'],
  questions: [{ text: 'How robust is the classifier under natural shift?', objectiveIds: ['o2'] }],
  months: [
    { title: 'Tháng 7/2026', current: true, milestones: [{ title: 'Run the baseline', obj: 0 }] },
    { title: 'Tháng 8/2026', milestones: [{ title: 'Reproduce on cloud notebooks', obj: 1 }] },
  ],
};

const project = buildProject(input);
project.graph.nodes.push(
  { id: 'baseline', position: { x: 0, y: 0 }, data: { title: 'Run GeoCLIP baseline end to end', role: 'task', homeAspect: 'o1_a1', status: 'active', pinned: true } },
  { id: 'cloud', position: { x: 0, y: 0 }, data: { title: 'Run on Colab and Kaggle', role: 'task', homeAspect: 'o2_a1', status: 'active' } },
  { id: 'gallery', position: { x: 0, y: 0 }, data: { title: 'Keep the original gallery fixed', role: 'decision', homeAspect: 'o1_a1', status: 'active' } },
  { id: 'empty-set', position: { x: 0, y: 0 }, data: { title: 'No detection is a valid empty set', role: 'note', homeAspect: 'o1_a1', status: 'active' } },
);
Object.assign(project.documents, {
  baseline: '# Baseline\n\nAccept an image and produce a location prediction.',
  cloud: '# Cloud notebooks\n\nClone once and run on Colab or Kaggle.',
  gallery: '# Gallery decision\n\nDo not retrain the location encoder.',
  'empty-set': '# Empty detection\n\nTreat no detected box as valid output.',
});
project.graph.edges.push(
  { id: 'e_aspect_baseline', source: 'o1_a1', target: 'baseline', data: { kind: 'step' } },
  { id: 'e_aspect_gallery', source: 'o1_a1', target: 'gallery', data: { kind: 'step' } },
  { id: 'e_empty_informs', source: 'empty-set', target: 'o1_a1', data: { kind: 'informs' } },
  { id: 'e_aspect_cloud', source: 'o2_a1', target: 'cloud', data: { kind: 'step' } },
  { id: 'e_synthesis_evidence', source: 'o2_a1_synthesis', target: 'rq_rq1', data: { kind: 'evidence' } },
);
project.graph.nodes.find((node) => node.id === 'o2_a1_synthesis').data.status = 'merged';
project.timeline.months[0].milestones[0].nodeIds = ['baseline'];
project.timeline.months[1].milestones[0].nodeIds = ['cloud'];

const reader = createResearchReader(project);
assert.equal(reader.search({ question: 'GeoCLIP baseline đầu vào đầu ra' }).results[0].ref, 'node:baseline');
assert.equal(reader.search({ question: 'Notebook cloud?', hints: ['Colab', 'Kaggle'] }).results[0].ref, 'node:cloud');
assert.equal(reader.search({ question: 'Tháng 8 phải làm gì?' }).results[0].ref, 'month:m2');
assert.equal(reader.search({ question: 'Euler tour dùng để làm gì?' }).noMatch, true);
assert.equal(reader.search({ question: 'Bây giờ nên làm gì trước?' }).results[0].ref, 'node:baseline');

const baseline = reader.context({ ref: 'node:baseline' });
assert.deepEqual(baseline.spine.map((item) => item.ref), ['node:baseline', 'node:o1_a1', 'node:o1', 'project:main']);
assert.ok(baseline.junctions.find((item) => item.at === 'node:o1_a1').branches.some((item) => item.ref === 'node:empty-set'));
assert.equal(reader.context({ ref: 'question:RQ1' }).evidence[0].ref, 'node:o2_a1_synthesis');
assert.equal(reader.context({ ref: 'milestone:m2_ms1' }).linkedNodes[0].ref, 'node:cloud');
assert.throws(() => reader.context({ ref: 'node:missing' }), /unknown research ref/);

const ambiguous = structuredClone(project);
ambiguous.graph.edges.push({ id: 'e_alt_baseline', source: 'gallery', target: 'baseline', data: { kind: 'step' } });
const selected = createResearchReader(ambiguous).context({ ref: 'node:baseline', via: { 'node:baseline': 'node:o1_a1' } });
assert.equal(selected.spine[1].ref, 'node:o1_a1');
assert.deepEqual(selected.spine[0].alternativeParents, ['node:gallery']);

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'research-context-'));
try {
  initializeProject(dir, input);
  const requests = [
    { jsonrpc: '2.0', id: 1, method: 'initialize', params: {} },
    { jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} },
    { jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'research_route', arguments: { question: 'robust classifier natural shift' } } },
    { jsonrpc: '2.0', id: 4, method: 'tools/call', params: { name: 'research_context', arguments: { ref: 'question:RQ1' } } },
  ];
  const mcp = spawnSync(process.execPath, ['scripts/research-mcp.mjs'], {
    cwd: path.resolve('.'),
    env: { ...process.env, RESEARCH_DATA_DIR: dir },
    input: requests.map((request) => JSON.stringify(request)).join('\n') + '\n',
    encoding: 'utf8',
  });
  assert.equal(mcp.status, 0, mcp.stderr);
  const responses = mcp.stdout.trim().split(/\r?\n/u).map((line) => JSON.parse(line));
  assert.ok(responses.find((response) => response.id === 2).result.tools.some((tool) => tool.name === 'research_route'));
  const routed = JSON.parse(responses.find((response) => response.id === 3).result.content[0].text);
  assert.ok(routed.results.some((result) => result.ref === 'question:RQ1'));
  const context = JSON.parse(responses.find((response) => response.id === 4).result.content[0].text);
  assert.equal(context.context.kind, 'question');

  const preflight = spawnSync(process.execPath, ['scripts/research-preflight.mjs', '--expected-fingerprint', 'old'], {
    cwd: path.resolve('.'),
    env: { ...process.env, RESEARCH_DATA_DIR: dir },
    encoding: 'utf8',
  });
  assert.equal(preflight.status, 0, preflight.stderr);
  assert.equal(JSON.parse(preflight.stdout).research.changedSinceExpected, true);
} finally {
  fs.rmSync(dir, { recursive: true, force: true });
}

console.log('research context tests passed');
