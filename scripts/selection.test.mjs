import assert from 'node:assert/strict';
import { applySelectionChanges, detailSelectionForClick } from '../src/selection.js';

assert.deepEqual(applySelectionChanges(['a'], [{ id: 'b', selected: true }]).sort(), ['a', 'b']);
assert.deepEqual(applySelectionChanges(['a', 'b'], [{ id: 'a', selected: false }]), ['b']);
assert.equal(detailSelectionForClick('a', false), 'a');
assert.equal(detailSelectionForClick('a', true), null);
console.log('selection: ok');
