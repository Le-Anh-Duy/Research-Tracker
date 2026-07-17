#!/usr/bin/env node
import path from 'node:path';
import readline from 'node:readline';
import { createResearchReader } from '../core/research-context.js';
import { applyResearchOperation, buildProject, buildStateMarkdown, initializeProject, readProject, refreshStateMarkdown, sourceFingerprint } from '../core/research-project.js';

const dataDir = path.resolve(process.env.RESEARCH_DATA_DIR || 'research_data');
const tools = [
  { name: 'research_state', description: 'Read the compact project state and source fingerprint.', inputSchema: { type: 'object', properties: {} } },
  { name: 'research_route', description: 'Find up to five compact project references relevant to a question. Agent-supplied hints improve paraphrase matching.', inputSchema: { type: 'object', required: ['question'], properties: { question: { type: 'string', minLength: 1, maxLength: 1000 }, hints: { type: 'array', maxItems: 8, items: { type: 'string', maxLength: 120 } }, limit: { type: 'integer', minimum: 1, maximum: 5 } }, additionalProperties: false } },
  { name: 'research_context', description: 'Read one routed node, question, month, milestone, or project reference with its focused research context.', inputSchema: { type: 'object', required: ['ref'], properties: { ref: { type: 'string', pattern: '^(node|question|month|milestone|project):' }, via: { type: 'object', maxProperties: 20, additionalProperties: { type: 'string', pattern: '^node:' } } }, additionalProperties: false } },
  { name: 'research_preview', description: 'Preview initialization without writing files.', inputSchema: { type: 'object', additionalProperties: true } },
  { name: 'research_init', description: 'Initialize after the researcher explicitly approves the preview.', inputSchema: { type: 'object', additionalProperties: true } },
  { name: 'research_refresh_state', description: 'Regenerate STATE.md after explicitly approved source edits.', inputSchema: { type: 'object', properties: {} } },
  { name: 'research_apply', description: 'Apply one explicitly approved semantic node or relationship operation.', inputSchema: { type: 'object', additionalProperties: true } },
];
let cached;
const currentReader = () => {
  const project = readProject(dataDir);
  const fingerprint = sourceFingerprint(project);
  if (!cached || cached.fingerprint !== fingerprint) cached = { fingerprint, reader: createResearchReader(project) };
  return cached;
};
const result = (id, value) => process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id, result: value }) + '\n');
const failure = (id, error) => process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id, error: { code: -32000, message: error.message } }) + '\n');

readline.createInterface({ input: process.stdin }).on('line', (line) => {
  let request;
  try {
    request = JSON.parse(line);
    if (request.method === 'initialize') return result(request.id, { protocolVersion: '2025-06-18', capabilities: { tools: {} }, serverInfo: { name: 'research-navigator', version: '0.3.0' } });
    if (request.method === 'notifications/initialized') return;
    if (request.method === 'tools/list') return result(request.id, { tools });
    if (request.method !== 'tools/call') throw new Error(`unsupported method ${request.method}`);
    const name = request.params?.name;
    const input = request.params?.arguments || {};
    let value;
    if (name === 'research_state') { const project = readProject(dataDir); value = { fingerprint: sourceFingerprint(project), state: buildStateMarkdown(project), graph: project.graph, questions: project.questions, timeline: project.timeline, team: project.team }; }
    else if (name === 'research_route') { const current = currentReader(); value = { fingerprint: current.fingerprint, ...current.reader.search(input) }; }
    else if (name === 'research_context') { const current = currentReader(); value = { fingerprint: current.fingerprint, context: current.reader.context(input) }; }
    else if (name === 'research_preview') { const project = buildProject(input); value = { state: buildStateMarkdown(project), graph: project.graph, questions: project.questions, timeline: project.timeline, team: project.team }; }
    else if (name === 'research_init') { const project = initializeProject(dataDir, input); value = { ok: true, fingerprint: sourceFingerprint(project) }; }
    else if (name === 'research_refresh_state') { refreshStateMarkdown(dataDir); value = { ok: true }; }
    else if (name === 'research_apply') { const project = applyResearchOperation(dataDir, input); value = { ok: true, revision: project.graph.revision, fingerprint: sourceFingerprint(project) }; }
    else throw new Error(`unknown tool ${name}`);
    result(request.id, { content: [{ type: 'text', text: JSON.stringify(value, null, 2) }] });
  } catch (error) { failure(request?.id ?? null, error); }
});
