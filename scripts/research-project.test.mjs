import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { applyResearchOperation, buildProject, buildStateMarkdown, initializeProject, readProject, sourceFingerprint } from '../research-project.js';
import { parseResearchDoc } from '../research-doc.js';

const input = {
  topic: 'Synthetic Vietnamese NLP study',
  objectives: ['Build the research workspace', 'Evaluate a classifier'],
  exitCriteria: ['The workflow is usable', 'The evaluation is reproducible'],
  firstAspects: ['Define the workflow', 'Choose evaluation data'],
  questions: [{ text: 'How robust is the classifier?', objectiveIds: ['o2'] }],
  months: [{ title: 'Month 1', current: true, milestones: [{ title: 'Plan the study', deadline: '2026-08-01', obj: 1 }] }],
  team: { members: [{ id: 'duy', name: 'Duy' }] },
};

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'research-nav-'));
try {
  const preview = buildProject(input);
  const initialized = initializeProject(dir, input);
  assert.deepEqual(initialized.graph, preview.graph);
  assert.deepEqual(initialized.questions, preview.questions);
  assert.deepEqual(initialized.timeline, preview.timeline);
  assert.deepEqual(initialized.team, preview.team);
  assert.equal(readProject(dir).graph.edges.length, preview.graph.edges.length);
  assert.ok(fs.existsSync(path.join(dir, 'PROJECT.md')));
  assert.ok(fs.existsSync(path.join(dir, 'STATE.md')));
  assert.match(fs.readFileSync(path.join(dir, 'STATE.md'), 'utf8'), new RegExp(sourceFingerprint(initialized)));
  assert.equal(buildStateMarkdown(initialized), fs.readFileSync(path.join(dir, 'STATE.md'), 'utf8'));
  const cliState = spawnSync(process.execPath, ['scripts/research-cli.mjs', 'state'], {
    cwd: path.resolve('.'),
    env: { ...process.env, RESEARCH_DATA_DIR: dir },
    encoding: 'utf8',
  });
  assert.equal(cliState.status, 0, cliState.stderr);
  assert.equal(JSON.parse(cliState.stdout).stale, false);

  const objective = parseResearchDoc(fs.readFileSync(path.join(dir, 'nodes', 'o1.md'), 'utf8'));
  assert.equal(objective.metadata.role, 'objective');
  assert.equal(objective.metadata.from, undefined);
  assert.equal(objective.metadata.to, undefined);
  const edge = parseResearchDoc(fs.readFileSync(path.join(dir, 'edges', 'e_project_o1.md'), 'utf8'));
  assert.equal(edge.metadata.from, '[[nodes/project]]');
  assert.match(edge.body, /advances the project/);
  assert.throws(() => initializeProject(dir, input), /already initialized/);
  const changed = applyResearchOperation(dir, { type: 'transition', nodeId: 'o1_a1_synthesis', status: 'merged', outcome: 'Workflow evidence synthesized.' });
  assert.equal(changed.graph.nodes.find((node) => node.id === 'o1_a1_synthesis').data.status, 'merged');
  assert.match(fs.readFileSync(path.join(dir, 'STATE.md'), 'utf8'), /1\/1 aspects synthesized/);
  assert.throws(() => applyResearchOperation(dir, { type: 'objective-met', objectiveId: 'o1', met: true }), /human approval/);
} finally {
  fs.rmSync(dir, { recursive: true, force: true });
}

console.log('research project tests passed');
