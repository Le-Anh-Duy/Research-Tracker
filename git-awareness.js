import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { linkedId, parseResearchDoc } from './research-doc.js';

const git = (repoDir, args, fallback = '') => {
  try { return execFileSync('git', args, { cwd: repoDir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); }
  catch { return fallback; }
};

export function repositoryActivity(repoDir) {
  const status = git(repoDir, ['status', '--porcelain=v1', '--', 'research_data']);
  const log = git(repoDir, ['log', '-n', '20', '--date=short', '--pretty=format:%H%x09%ad%x09%s', '--', 'research_data']);
  const tags = git(repoDir, ['tag', '--list', 'research/checkpoint/*', '--format=%(refname:short)%09%(creatordate:short)%09%(subject)']);
  return {
    changes: status ? status.split(/\r?\n/).map((line) => ({ code: line.slice(0, 2), path: line.slice(3) })) : [],
    commits: log ? log.split(/\r?\n/).map((line) => { const [id, date, ...subject] = line.split('\t'); return { id, date, subject: subject.join('\t') }; }) : [],
    checkpoints: tags ? tags.split(/\r?\n/).map((line) => { const [name, date, ...subject] = line.split('\t'); return { name, date, subject: subject.join('\t') }; }) : [],
  };
}

const safeRef = (value) => typeof value === 'string' && (/^[0-9a-f]{7,40}$/i.test(value) || /^research\/checkpoint\/[\w.-]+$/.test(value));

export function historicalGraph(repoDir, ref) {
  if (!safeRef(ref)) throw new Error('invalid historical reference');
  const show = (file, fallback = '') => git(repoDir, ['show', `${ref}:${file.replaceAll(path.sep, '/')}`], fallback);
  const layout = JSON.parse(show('research_data/graph.json', '{"nodes":[],"revision":0}'));
  const nodeFiles = git(repoDir, ['ls-tree', '-r', '--name-only', ref, '--', 'research_data/nodes']).split(/\r?\n/).filter((file) => file.endsWith('.md'));
  const edgeFiles = git(repoDir, ['ls-tree', '-r', '--name-only', ref, '--', 'research_data/edges']).split(/\r?\n/).filter((file) => file.endsWith('.md'));
  const positions = new Map((layout.nodes || []).map((node) => [node.id, node.position]));
  const nodes = nodeFiles.map((file) => {
    const { metadata } = parseResearchDoc(show(file));
    const { id, from, to, ...data } = metadata;
    return { id, position: positions.get(id) || { x: 0, y: 0 }, data };
  });
  const edges = edgeFiles.map((file) => {
    const { metadata, body } = parseResearchDoc(show(file));
    const { id, from, to, ...data } = metadata;
    return { id, source: linkedId(from, 'nodes'), target: linkedId(to, 'nodes'), data: { ...data, ...(body.trim() ? { note: body.trim() } : {}) } };
  });
  return { nodes, edges, revision: layout.revision || 0, historical: true, ref };
}
