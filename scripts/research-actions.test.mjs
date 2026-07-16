import assert from 'node:assert/strict';
import { connectNodes, createNode, setObjectiveMet, transitionNode } from '../research-actions.js';

let graph = {
  nodes: [{ id: 'o1', position: { x: 0, y: 0 }, data: { title: 'Objective', role: 'objective', status: 'active', met: false } }],
  edges: [],
};

graph = createNode(graph, { id: 'a1', position: { x: 0, y: 100 }, data: { title: 'Aspect', role: 'aspect', objectiveId: 'o1', status: 'active' } });
graph = connectNodes(graph, { id: 'e1', source: 'o1', target: 'a1', data: { kind: 'step' } });
assert.equal(graph.nodes.length, 2);
assert.equal(graph.edges.length, 1);
assert.throws(() => transitionNode(graph, 'a1', 'retired', { outcome: 'Out of scope' }), /human approval/);
graph = transitionNode(graph, 'a1', 'retired', { outcome: 'Out of scope', humanApproved: true });
assert.equal(graph.nodes.find((node) => node.id === 'a1').data.status, 'retired');
assert.throws(() => setObjectiveMet(graph, 'o1', true), /human approval/);
graph = setObjectiveMet(graph, 'o1', true, { humanApproved: true });
assert.equal(graph.nodes[0].data.met, true);

console.log('research-actions: all assertions passed');
