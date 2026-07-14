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

export function nodeMetadata(node, edges) {
  return {
    id: node.id,
    ...node.data,
    from: edges.filter((edge) => edge.target === node.id).map((edge) => wikiLink('edges', edge.id)),
    to: edges.filter((edge) => edge.source === node.id).map((edge) => wikiLink('edges', edge.id)),
  };
}

export function edgeMetadata(edge) {
  const { note, ...data } = edge.data || {};
  return { id: edge.id, ...data, from: wikiLink('nodes', edge.source), to: wikiLink('nodes', edge.target) };
}

export function reciprocalError(nodes, edges) {
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const edgeById = new Map(edges.map((edge) => [edge.id, edge]));
  for (const edge of edges) {
    const source = nodeById.get(edge.source);
    const target = nodeById.get(edge.target);
    if (!source || !target) return `missing endpoint for ${edge.id}`;
    if (!source.metadata.to?.includes(wikiLink('edges', edge.id))) return `${source.id} does not point to ${edge.id}`;
    if (!target.metadata.from?.includes(wikiLink('edges', edge.id))) return `${target.id} does not point back to ${edge.id}`;
  }
  for (const node of nodes) {
    for (const ref of node.metadata.from || []) {
      const edge = edgeById.get(linkedId(ref, 'edges'));
      if (!edge || edge.target !== node.id) return `${node.id} has invalid incoming link ${ref}`;
    }
    for (const ref of node.metadata.to || []) {
      const edge = edgeById.get(linkedId(ref, 'edges'));
      if (!edge || edge.source !== node.id) return `${node.id} has invalid outgoing link ${ref}`;
    }
  }
  return '';
}
