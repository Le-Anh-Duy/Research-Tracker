import assert from 'node:assert/strict';
import { buildInitialRoadmap, focusState, isEvidenceFor, reconcileQuestionNodes } from '../src/roadmap.js';

const roadmap = buildInitialRoadmap({
  topic: 'Test topic',
  objectives: ['Build framework'],
  questions: [{ text: 'Does it work?', obj: 0 }],
  firstTasks: ['Run baseline'],
  exitCriteria: ['Pipeline runs'],
  months: [{ title: 'Month 1', milestones: [{ text: 'Baseline', obj: 0 }] }],
  connectInitialNodes: false,
});

assert.deepEqual(roadmap.graph.edges, []);
assert.equal(roadmap.graph.nodes.length, 4);
assert.equal(roadmap.graph.nodes.find((node) => node.id === 'n_rq1').data.questionId, 'RQ1');
assert.match(roadmap.files.n_rq1, /Does it work/);
assert.equal(roadmap.files.n_o1_t1.includes('Run baseline'), true);
assert.equal(roadmap.questions[0].id, 'RQ1');
assert.deepEqual(roadmap.timeline.months[0].milestones[0].nodeIds, []);
assert.equal(isEvidenceFor({ data: { status: 'active', rq: 'RQ1' } }, 'RQ1'), false);
assert.equal(isEvidenceFor({ data: { status: 'merged', rq: 'RQ1' } }, 'RQ1'), true);
assert.equal(focusState('n_1', []), '');
assert.equal(focusState('n_1', ['n_1', 'n_2']), 'focused');
assert.equal(focusState('n_3', ['n_1', 'n_2']), 'dimmed');
const reconciled = reconcileQuestionNodes(roadmap.graph, [{ ...roadmap.questions[0], text: 'Updated?' }, { id: 'RQ2', text: 'Why?', obj: -1 }]);
assert.equal(reconciled.nodes.find((node) => node.id === 'n_rq1').data.title, 'RQ1: Updated?');
assert.ok(reconciled.nodes.some((node) => node.id === 'n_rq2'));
assert.ok(!reconcileQuestionNodes(reconciled, [roadmap.questions[0]]).nodes.some((node) => node.id === 'n_rq2'));

console.log('roadmap: all assertions passed');
