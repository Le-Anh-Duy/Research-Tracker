import assert from 'node:assert/strict';
import { graphError, questionsError, timelineError } from '../contracts.js';

const graph = {
  nodes: [{ id: 'n_1', position: { x: 0, y: 0 }, data: { title: 'Test', status: 'active', outcome: '' } }],
  edges: [],
};
assert.equal(graphError(graph), '');
assert.match(graphError({ ...graph, nodes: [...graph.nodes, graph.nodes[0]] }), /node ids/);
assert.match(graphError({ ...graph, edges: [{ id: 'e_1', source: 'n_1', target: 'missing', data: { kind: 'step' } }] }), /endpoint/);

assert.equal(questionsError({ questions: [{ id: 'RQ1', text: 'Why?', obj: 0, status: 'open', answer: '' }] }), '');
assert.match(questionsError({ questions: [{ id: 'Q1', text: 'Why?', obj: 0, status: 'open', answer: '' }] }), /RQ<n>/);

assert.equal(timelineError({ months: [{ id: 'm_1', title: 'Month 1', milestones: [{ id: 'm_1_ms_1', title: 'Run', obj: 0, nodeIds: ['n_1'] }] }] }), '');
assert.match(timelineError({ months: [{ id: 'm_1', title: 'Month 1', milestones: [{ id: 'bad id', title: 'Run', obj: 0, nodeIds: [] }] }] }), /milestone ids/);

console.log('contracts: all assertions passed');
