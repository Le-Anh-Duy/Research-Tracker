import assert from 'node:assert/strict';
import {
  aspectProgress,
  aspectWorkProgress,
  blockedNodeIds,
  dueDateWarnings,
  evidenceForQuestion,
  indexEdges,
  objectiveProgress,
  priorityTasks,
  reorderPriorityIds,
} from '../core/research-domain.js';

const nodes = [
  { id: 'o1', data: { title: 'Research objective', role: 'objective', status: 'active' } },
  { id: 'a1', data: { title: 'Aspect one', role: 'aspect', objectiveId: 'o1', status: 'active' } },
  { id: 'a2', data: { title: 'Aspect two', role: 'aspect', objectiveId: 'o1', status: 'retired' } },
  { id: 's1', data: { title: 'Closing synthesis', role: 'synthesis', homeAspect: 'a1', status: 'merged' } },
  { id: 'rq1', data: { title: 'Question', role: 'research-question', questionId: 'RQ1', status: 'active' } },
  { id: 't1', data: { title: 'Pinned task', role: 'task', homeAspect: 'a1', status: 'active', pinned: true, due: '2026-07-18' } },
  { id: 't2', data: { title: 'Dependent task', role: 'experiment', homeAspect: 'a1', status: 'active' } },
  { id: 't3', data: { title: 'Pinned first', role: 'task', homeAspect: 'a1', status: 'active', pinned: true, priorityRank: 0 } },
];

const edges = [
  { id: 'e_resolve', source: 's1', target: 'a1', data: { kind: 'resolves' } },
  { id: 'e_evidence', source: 's1', target: 'rq1', data: { kind: 'evidence' } },
  { id: 'e_dependency', source: 't1', target: 't2', data: { kind: 'depends-on' } },
];

const index = indexEdges(edges);
assert.deepEqual(index.outgoing.get('s1').map((edge) => edge.id), ['e_resolve', 'e_evidence']);
assert.deepEqual(index.incoming.get('a1').map((edge) => edge.id), ['e_resolve']);

assert.deepEqual(aspectProgress('a1', nodes, edges), {
  aspectId: 'a1',
  closingSynthesisId: 's1',
  status: 'resolved',
});
assert.deepEqual(aspectWorkProgress('a1', nodes), { complete: 1, total: 4 });
assert.deepEqual(objectiveProgress('o1', nodes, edges), {
  objectiveId: 'o1',
  complete: 1,
  total: 1,
  readyForReview: true,
  aspects: [{ aspectId: 'a1', closingSynthesisId: 's1', status: 'resolved' }],
});
assert.deepEqual(evidenceForQuestion('RQ1', nodes, edges).map((node) => node.id), ['s1']);
assert.deepEqual([...blockedNodeIds(nodes, edges)], ['t2']);

const priorities = priorityTasks({
  nodes,
  edges,
  timeline: { months: [{ id: 'm1', current: true, milestones: [{ id: 'ms1', nodeIds: ['t2'] }] }] },
  now: new Date('2026-07-16T00:00:00Z'),
});
assert.deepEqual(priorities.map(({ node, reasons }) => [node.id, reasons]), [
  ['t3', ['pinned']],
  ['t1', ['pinned', 'due soon', 'blocks Dependent task']],
  ['t2', ['current milestone']],
]);

assert.deepEqual(dueDateWarnings(
  nodes,
  { months: [{ id: 'm1', milestones: [{ id: 'ms1', deadline: '2026-07-17', nodeIds: ['t1'] }] }] },
), [{ nodeId: 't1', milestoneId: 'ms1', code: 'DUE_AFTER_MILESTONE' }]);
assert.deepEqual(reorderPriorityIds(['a', 'b', 'c'], 'c', 'a'), ['c', 'a', 'b']);
assert.equal(reorderPriorityIds(['a', 'b'], 'missing', 'a')[0], 'a');

console.log('research-domain: all assertions passed');
