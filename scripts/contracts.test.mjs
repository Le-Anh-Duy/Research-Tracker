import assert from 'node:assert/strict';
import { graphError, questionsError, teamError, timelineError } from '../contracts.js';

const graph = {
  nodes: [{ id: 'n_1', position: { x: 0, y: 0 }, data: { title: 'Test', status: 'active', outcome: '' } }],
  edges: [],
};
assert.equal(graphError(graph), '');
assert.match(graphError({ ...graph, nodes: [...graph.nodes, graph.nodes[0]] }), /node ids/);
assert.match(graphError({ ...graph, edges: [{ id: 'e_1', source: 'n_1', target: 'missing', data: { kind: 'step' } }] }), /endpoint/);

assert.equal(questionsError({ questions: [{ id: 'RQ1', text: 'Why?', objectiveIds: ['o1'], status: 'open', answer: '' }] }), '');
assert.match(questionsError({ questions: [{ id: 'Q1', text: 'Why?', objectiveIds: [], status: 'open', answer: '' }] }), /RQ<n>/);

assert.equal(timelineError({ months: [{ id: 'm_1', title: 'Month 1', milestones: [{ id: 'm_1_ms_1', title: 'Run', deadline: '2026-07-31', nodeIds: ['n_1'] }] }] }), '');
assert.match(timelineError({ months: [{ id: 'm_1', title: 'Month 1', milestones: [{ id: 'bad id', title: 'Run', nodeIds: [] }] }] }), /milestone ids/);
assert.equal(teamError({ members: [{ id: 'duy', name: 'Duy', github: 'duyla' }] }), '');
assert.match(teamError({ members: [{ id: 'bad id', name: 'Duy' }] }), /members/);

console.log('contracts: all assertions passed');
