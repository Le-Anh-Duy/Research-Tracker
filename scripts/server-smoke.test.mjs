import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'research-nav-server-'));
const port = 32000 + Math.floor(Math.random() * 1000);
const server = spawn(process.execPath, ['server.js'], {
  cwd: path.resolve('.'),
  env: { ...process.env, PORT: String(port), RESEARCH_DATA_DIR: dataDir },
  stdio: 'ignore',
});
const request = async (url, options) => {
  const response = await fetch(`http://127.0.0.1:${port}${url}`, options);
  const body = await response.json();
  if (!response.ok) throw new Error(`${response.status}: ${body.error}`);
  return body;
};

try {
  let ready = false;
  for (let attempt = 0; attempt < 100 && !ready; attempt += 1) {
    try { await request('/api/graph'); ready = true; }
    catch { await new Promise((resolve) => setTimeout(resolve, 100)); }
  }
  assert.equal(ready, true, 'server did not start');
  const initialized = await request('/api/research/init', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ topic: 'Synthetic server smoke study', objectives: ['Build workflow'], firstAspects: ['Orientation'], questions: [{ text: 'Is it usable?', obj: 0 }] }),
  });
  assert.equal(initialized.graph.nodes.some((node) => node.data.role === 'aspect'), true);
  const state = await request('/api/research/state');
  assert.equal(state.state.stale, false);
  const exported = await request('/api/research/export');
  assert.equal(exported.filename, 'PLAN_EXPORT.md');
  assert.match(exported.content, /```mermaid\ntimeline/);
  const markdownFiles = await request('/api/research/files');
  assert.equal(markdownFiles.files.some((file) => file.path === 'PROJECT.md'), true);
  assert.equal(markdownFiles.files.find((file) => file.path === 'STATE.md').readOnly, true);
  assert.equal(markdownFiles.files.find((file) => file.path === 'nodes/project.md').title, 'Synthetic server smoke study');
  assert.match(markdownFiles.files.find((file) => file.path.startsWith('edges/')).title, /^step: .+ → .+$/);
  const projectFile = await request('/api/research/file?path=PROJECT.md');
  const updatedProject = `${projectFile.content.trimEnd()}\n\nWorkspace smoke note.\n`;
  await request('/api/research/file?path=PROJECT.md', {
    method: 'PUT', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: updatedProject, expectedVersion: projectFile.version }),
  });
  assert.match((await request('/api/research/file?path=PROJECT.md')).content, /Workspace smoke note/);
  await assert.rejects(() => request('/api/research/file?path=PROJECT.md', {
    method: 'PUT', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: 'stale write', expectedVersion: projectFile.version }),
  }), /409: Markdown file changed elsewhere/);
  await assert.rejects(() => request('/api/research/file?path=..%2Foutside.md'), /400: bad Markdown path/);
  await assert.rejects(() => request('/api/research/file?path=STATE.md', {
    method: 'PUT', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: 'no', expectedVersion: 'no' }),
  }), /403: STATE.md is generated and read-only/);
  await request('/api/team', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ members: [{ id: 'teammate', name: 'Teammate' }] }) });
  assert.equal((await request('/api/team')).members[0].id, 'teammate');
  const activity = await request('/api/git/activity');
  assert.ok(Array.isArray(activity.commits));
} finally {
  server.kill();
  fs.rmSync(dataDir, { recursive: true, force: true });
}

console.log('server smoke test passed');
