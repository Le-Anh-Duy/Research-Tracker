#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { buildPlanExport } from '../core/research-export.js';
import { readProject } from '../core/research-project.js';

const args = process.argv.slice(2);
const option = (name, fallback) => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : fallback;
};
const dataDir = path.resolve(option('--data-dir', process.env.RESEARCH_DATA_DIR || 'research_data'));
const output = path.resolve(option('--output', 'PLAN_EXPORT.md'));

try {
  const content = buildPlanExport(readProject(dataDir));
  fs.writeFileSync(output, content);
  process.stdout.write(JSON.stringify({ ok: true, output, bytes: Buffer.byteLength(content) }, null, 2) + '\n');
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
}
