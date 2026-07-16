#!/usr/bin/env node
import path from 'node:path';
import fs from 'node:fs';
import { applyResearchOperation, buildProject, buildStateMarkdown, initializeProject, readProject, refreshStateMarkdown, sourceFingerprint } from '../research-project.js';
import { parseResearchDoc } from '../research-doc.js';

const args = process.argv.slice(2);
const command = args.shift();
const option = (name, fallback) => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : fallback;
};
const dataDir = path.resolve(option('--data-dir', 'research_data'));
const inputFile = option('--input');
const readInput = () => {
  if (!inputFile) throw new Error('--input <project.json> is required');
  return JSON.parse(fs.readFileSync(path.resolve(inputFile), 'utf8'));
};

try {
  if (command === 'preview') {
    const project = buildProject(readInput());
    process.stdout.write(JSON.stringify({ graph: project.graph, questions: project.questions, timeline: project.timeline, team: project.team, state: buildStateMarkdown(project) }, null, 2) + '\n');
  } else if (command === 'init') {
    const project = initializeProject(dataDir, readInput(), { overwrite: args.includes('--overwrite') });
    process.stdout.write(JSON.stringify({ ok: true, dataDir, fingerprint: sourceFingerprint(project) }, null, 2) + '\n');
  } else if (command === 'state') {
    const project = readProject(dataDir);
    const expected = sourceFingerprint(project);
    const stored = parseResearchDoc(fs.readFileSync(path.join(dataDir, 'STATE.md'), 'utf8')).metadata.fingerprint;
    process.stdout.write(JSON.stringify({ stale: stored !== expected, stored, expected }, null, 2) + '\n');
    if (stored !== expected) process.exitCode = 2;
  } else if (command === 'refresh-state') {
    refreshStateMarkdown(dataDir);
    process.stdout.write(JSON.stringify({ ok: true, dataDir }, null, 2) + '\n');
  } else if (command === 'apply') {
    const project = applyResearchOperation(dataDir, readInput());
    process.stdout.write(JSON.stringify({ ok: true, revision: project.graph.revision, fingerprint: sourceFingerprint(project) }, null, 2) + '\n');
  } else {
    throw new Error('usage: research-cli.mjs <preview|init|state|refresh-state|apply> [--input file] [--data-dir dir]');
  }
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
}
