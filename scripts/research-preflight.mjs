#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { readProject, sourceFingerprint } from '../research-project.js';
import { parseResearchDoc } from '../research-doc.js';

const args = process.argv.slice(2);
const option = (name) => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
};
try {
  const dataDir = path.resolve(process.env.RESEARCH_DATA_DIR || 'research_data');
  const expectedFingerprint = option('--expected-fingerprint');
  const graphFile = path.join(dataDir, 'graph.json');
  let research = { dataDir, initialized: false };
  if (fs.existsSync(graphFile)) {
    const project = readProject(dataDir);
    const currentFingerprint = sourceFingerprint(project);
    const stateFile = path.join(dataDir, 'STATE.md');
    const stateFingerprint = fs.existsSync(stateFile) ? parseResearchDoc(fs.readFileSync(stateFile, 'utf8')).metadata.fingerprint || null : null;
    research = {
      dataDir,
      initialized: true,
      currentFingerprint,
      stateFingerprint,
      stateStale: stateFingerprint !== currentFingerprint,
      ...(expectedFingerprint ? { expectedFingerprint, changedSinceExpected: expectedFingerprint !== currentFingerprint } : {}),
    };
  }
  process.stdout.write(JSON.stringify({ research }, null, 2) + '\n');
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
}
