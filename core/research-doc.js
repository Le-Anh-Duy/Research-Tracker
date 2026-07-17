const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n)*/;

export function parseResearchDoc(source = '') {
  const match = source.match(FRONTMATTER);
  if (!match) return { metadata: {}, body: source };
  const metadata = {};
  for (const line of match[1].split(/\r?\n/)) {
    const colon = line.indexOf(':');
    if (colon < 1) continue;
    const key = line.slice(0, colon).trim();
    const value = line.slice(colon + 1).trim();
    try { metadata[key] = JSON.parse(value); }
    catch { metadata[key] = value; }
  }
  return { metadata, body: source.slice(match[0].length) };
}

export function formatResearchDoc(metadata, body = '') {
  const lines = Object.entries(metadata)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => `${key}: ${JSON.stringify(value)}`);
  return `---\n${lines.join('\n')}\n---\n\n${body.replace(/^\s*\n/, '')}`;
}

export const wikiLink = (folder, id) => `[[${folder}/${id}]]`;

export function linkedId(value, folder) {
  const match = typeof value === 'string' && value.match(new RegExp(`^\\[\\[${folder}/([\\w-]+)\\]\\]$`));
  return match ? match[1] : '';
}

export const nodeMetadata = (node) => ({ id: node.id, ...node.data });

export function edgeMetadata(edge) {
  const { note, ...data } = edge.data || {};
  return { id: edge.id, ...data, from: wikiLink('nodes', edge.source), to: wikiLink('nodes', edge.target) };
}

export function relationshipError(nodes, edges) {
  const nodeIds = new Set(nodes.map((node) => node.id));
  for (const edge of edges) {
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) return `missing endpoint for ${edge.id}`;
  }
  return '';
}

export const reciprocalError = relationshipError;
