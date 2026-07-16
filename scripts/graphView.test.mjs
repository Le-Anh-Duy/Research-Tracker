import assert from 'node:assert/strict';
import { canFoldNode, classifyGraphEdges, detailLevelForZoom, foldBranchIds, foldProjection, nodeImportance, relatedNodeIds } from '../src/graphView.js';

const node = (id, role, extra = {}) => ({ id, position: { x: 0, y: 0 }, data: { title: id, role, status: 'active', ...extra } });
const edge = (source, target) => ({ id: `${source}_${target}`, source, target, data: { kind: 'step' } });
const graph = {
  nodes: [node('o', 'objective', { anchor: true }), node('a', 'experiment'), node('b', 'experiment', { status: 'merged', rq: 'RQ1' }), node('x', 'work'), node('s', 'synthesis'), node('rq', 'research-question', { anchor: true, questionId: 'RQ1' })],
  edges: [edge('o', 's'), edge('o', 'a'), edge('s', 'a'), edge('s', 'b'), edge('a', 'x'), edge('x', 'a'), edge('b', 's'), { ...edge('b', 'rq'), data: { kind: 'evidence' } }],
};

assert.equal(detailLevelForZoom(0.4), 'overview');
assert.equal(detailLevelForZoom(0.7), 'compact');
assert.equal(detailLevelForZoom(1), 'detail');
assert.equal(canFoldNode(graph.nodes.find((item) => item.id === 's')), true);
assert.ok(nodeImportance(graph.nodes.find((item) => item.id === 'o')) < nodeImportance(graph.nodes.find((item) => item.id === 'b')));
const classified = classifyGraphEdges(graph);
assert.equal(classified.find((item) => item.id === 'b_s').data.flowReason, 'backedge');
assert.equal(classified.find((item) => item.id === 'x_a').data.flowReason, 'cycle');
assert.deepEqual(
  Object.fromEntries(classifyGraphEdges({ ...graph, edges: [...graph.edges].reverse() }).map((item) => [item.id, item.data.flowKind])),
  Object.fromEntries(classified.map((item) => [item.id, item.data.flowKind]))
);
assert.deepEqual(new Set(relatedNodeIds(graph, 'o')), new Set(['o', 'a', 'b', 'x', 's']));
assert.deepEqual(new Set(relatedNodeIds(graph, 'rq')), new Set(['rq', 'b']));
assert.deepEqual(foldBranchIds(graph, 's'), ['b']);
const folded = foldProjection(graph, ['s']);
assert.equal(folded.hiddenNodeIds.includes('b'), true);
assert.deepEqual(folded.summaries.s, { total: 1, active: 0, merged: 1, dead: 0 });
assert.ok(folded.edges.some((item) => item.source === 's' && item.target === 'rq' && item.data.kind === 'fold'));
assert.deepEqual(foldProjection(graph, ['s'], ['b']).hiddenNodeIds, []);
const deduped = foldProjection({ ...graph, edges: [...graph.edges, edge('s', 'rq')] }, ['s']);
assert.equal(deduped.edges.filter((item) => item.source === 's' && item.target === 'rq').length, 1);
assert.equal(graph.edges.some((item) => item.data.flowKind), false);
console.log('graph view: ok');
