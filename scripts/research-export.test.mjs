import assert from 'node:assert/strict';
import { buildPlanExport } from '../research-export.js';
import { buildProject } from '../research-project.js';

const project = buildProject({
  topic: 'Synthetic export study',
  objectives: ['Test the method'],
  firstAspects: ['Evaluation'],
  questions: [{ text: 'Does it work?', objectiveIds: ['o1'] }],
  months: [{ title: 'Tháng 7/2026', current: true, milestones: [{ title: 'Run baseline', obj: 0 }] }],
  team: { members: [{ id: 'researcher', name: 'Researcher' }] },
});
const report = buildPlanExport(project);

assert.match(report, /# Research plan export/);
assert.match(report, /### O1: Test the method/);
assert.match(report, /Evaluation/);
assert.match(report, /### RQ1 · open/);
assert.match(report, /```mermaid\ntimeline/);
assert.match(report, /Tháng 7\/2026/);
assert.doesNotMatch(report, /"position"/);

console.log('research export tests passed');
