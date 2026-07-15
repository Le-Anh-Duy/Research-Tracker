import assert from 'node:assert/strict';
import { DEFAULT_PREFERENCES, loadPreferences } from '../src/preferences.js';

const storage = (value) => ({ getItem: () => value });
assert.deepEqual(loadPreferences(storage('{broken')), DEFAULT_PREFERENCES);
assert.deepEqual(loadPreferences(storage('{"font":"comic","theme":"dark"}')), { font: 'segoe', theme: 'dark' });
assert.deepEqual(loadPreferences(storage('{"font":"tahoma","theme":"system"}')), { font: 'tahoma', theme: 'system' });
console.log('preferences: ok');
