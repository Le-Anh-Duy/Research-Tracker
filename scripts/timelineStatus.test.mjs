import assert from 'node:assert/strict';
import { milestoneStatus, monthStatus } from '../src/timelineStatus.js';

const nodesById = {
  a: { data: { status: 'merged' } },
  b: { data: { status: 'active' } },
  c: { data: { status: 'dead' } },
};

assert.equal(milestoneStatus({ nodeIds: [] }, nodesById), 'planned');
assert.equal(milestoneStatus({ nodeIds: ['a'] }, nodesById), 'done');
assert.equal(milestoneStatus({ nodeIds: ['a', 'b'] }, nodesById), 'active');
assert.equal(milestoneStatus({ nodeIds: ['c'] }, nodesById), 'stalled');
assert.equal(milestoneStatus({ nodeIds: ['missing'] }, nodesById), 'stalled');

assert.equal(monthStatus({ milestones: [] }, nodesById), 'planned');
assert.equal(monthStatus({ milestones: [{ nodeIds: ['a'] }, { nodeIds: ['a'] }] }, nodesById), 'done');
assert.equal(monthStatus({ milestones: [{ nodeIds: ['a'] }, { nodeIds: [] }] }, nodesById), 'active');
assert.equal(monthStatus({ milestones: [{ nodeIds: [] }, { nodeIds: [] }] }, nodesById), 'planned');

console.log('timelineStatus: all assertions passed');
