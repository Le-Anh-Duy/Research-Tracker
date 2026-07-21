import assert from 'node:assert/strict';
import { readRoute, routePath } from '../src/routes.js';

assert.deepEqual(readRoute('/map/task_1'), { view: 'map', nodeId: 'task_1', documentPath: null });
assert.deepEqual(readRoute('/workspace/chat_with_agent_logs/note%20one.md'), { view: 'workspace', nodeId: null, documentPath: 'chat_with_agent_logs/note one.md' });
assert.equal(routePath('workspace', { documentPath: 'nodes/note one.md' }), '/workspace/nodes/note%20one.md');
assert.equal(routePath('review'), '/review');
assert.equal(routePath('missing'), '/');

console.log('routes tests passed');
