const FOLD_ROLES = new Set(['aspect', 'synthesis', 'decision']);
const ROLE_LEVEL = { project: 0, objective: 1, 'research-question': 1, aspect: 2, synthesis: 2, decision: 3, idea: 3, task: 3, experiment: 3, note: 4 };

export const detailLevelForZoom = (zoom) => zoom < 0.55 ? 'overview' : zoom < 0.85 ? 'compact' : 'detail';

export const canFoldNode = (node) => Boolean(node && FOLD_ROLES.has(node.data.role || node.data.kind));

export const nodeImportance = (node) => node?.id === 'n_start' ? 0 : ROLE_LEVEL[node?.data.role || node?.data.kind] ?? (node?.data.anchor ? 1 : 3);

export function classifyGraphEdges(graph) {
  const nodes = new Map(graph.nodes.map((node) => [node.id, node]));
  const dependency = new Map();
  const classification = new Map();
  const reaches = (from, target, seen = new Set()) => {
    if (from === target) return true;
    if (seen.has(from)) return false;
    seen.add(from);
    return [...(dependency.get(from) || [])].some((next) => reaches(next, target, seen));
  };
  [...graph.edges].sort((a, b) => a.id.localeCompare(b.id)).forEach((edge) => {
    const backedge = nodeImportance(nodes.get(edge.source)) > nodeImportance(nodes.get(edge.target));
    const cycle = !backedge && reaches(edge.target, edge.source);
    const contextual = !['step', 'depends-on'].includes(edge.data?.kind);
    const flowKind = contextual || backedge || cycle ? 'reference' : 'dependency';
    if (flowKind === 'dependency') {
      if (!dependency.has(edge.source)) dependency.set(edge.source, new Set());
      dependency.get(edge.source).add(edge.target);
    }
    classification.set(edge.id, { flowKind, flowReason: contextual ? edge.data?.kind : backedge ? 'backedge' : cycle ? 'cycle' : undefined });
  });
  return graph.edges.map((edge) => ({ ...edge, data: { ...edge.data, ...classification.get(edge.id) } }));
}

export function relatedNodeIds(graph, nodeId) {
  const start = graph.nodes.find((node) => node.id === nodeId);
  if (!start || !['objective', 'research-question'].includes(start.data.role)) return [];
  const ids = new Set([nodeId]);
  const edges = classifyGraphEdges(graph).filter((edge) => edge.data.flowKind === 'dependency');
  const stack = start.data.role === 'research-question'
    ? [nodeId, ...graph.edges.filter((edge) => edge.target === nodeId && edge.data?.kind === 'evidence').map((edge) => edge.source)]
    : [nodeId];
  stack.forEach((id) => ids.add(id));
  while (stack.length) {
    const current = stack.pop();
    edges.filter((edge) => edge.source === current).forEach((edge) => {
      const node = graph.nodes.find((item) => item.id === edge.target);
      if (!node || ids.has(node.id) || node.data.anchor) return;
      ids.add(node.id);
      stack.push(node.id);
    });
  }
  return [...ids];
}

export function foldBranchIds(graph, rootId, protectedRoots = []) {
  const root = graph.nodes.find((node) => node.id === rootId);
  if (!canFoldNode(root)) return [];
  const protectedIds = new Set([rootId, ...protectedRoots]);
  const nodes = new Map(graph.nodes.map((node) => [node.id, node]));
  const edges = classifyGraphEdges(graph).filter((edge) => edge.data.flowKind === 'dependency');
  const candidates = new Set();
  const stack = edges.filter((edge) => edge.source === rootId).map((edge) => edge.target);
  while (stack.length) {
    const id = stack.pop();
    const node = nodes.get(id);
    if (!node || node.data.anchor || protectedIds.has(id) || candidates.has(id)) continue;
    candidates.add(id);
    edges.filter((edge) => edge.source === id).forEach((edge) => stack.push(edge.target));
  }
  let changed = true;
  while (changed) {
    changed = false;
    for (const id of candidates) {
      const shared = edges.some((edge) => edge.target === id && edge.source !== rootId && !candidates.has(edge.source));
      if (shared) {
        candidates.delete(id);
        changed = true;
      }
    }
  }
  return [...candidates];
}

export function foldProjection(graph, foldedRootIds, focusedIds = []) {
  const classifiedGraph = { ...graph, edges: classifyGraphEdges(graph) };
  const roots = foldedRootIds.filter((id) => canFoldNode(graph.nodes.find((node) => node.id === id)));
  const focused = new Set(focusedIds);
  const owner = new Map();
  const summaries = {};
  const suspendedRootIds = [];
  roots.forEach((rootId) => {
    const branch = foldBranchIds(classifiedGraph, rootId, roots).filter((id) => !owner.has(id));
    if (branch.some((id) => focused.has(id))) {
      suspendedRootIds.push(rootId);
      return;
    }
    branch.forEach((id) => owner.set(id, rootId));
    if (branch.length) {
      const statuses = { active: 0, merged: 0, dead: 0 };
      branch.forEach((id) => {
        const status = graph.nodes.find((node) => node.id === id)?.data.status;
        if (status in statuses) statuses[status] += 1;
      });
      summaries[rootId] = { total: branch.length, ...statuses };
    }
  });
  const hidden = new Set(owner.keys());
  const edges = classifiedGraph.edges.filter((edge) => !hidden.has(edge.source) && !hidden.has(edge.target));
  const visiblePairs = new Set(edges.map((edge) => `${edge.source}:${edge.target}`));
  const proxy = new Map();
  classifiedGraph.edges.forEach((edge) => {
    const source = owner.get(edge.source) || edge.source;
    const target = owner.get(edge.target) || edge.target;
    if (source === target || visiblePairs.has(`${source}:${target}`) || (!hidden.has(edge.source) && !hidden.has(edge.target))) return;
    const key = `${source}:${target}`;
    const current = proxy.get(key);
    const flowKind = current?.data.flowKind === 'dependency' || edge.data.flowKind === 'dependency' ? 'dependency' : 'reference';
    proxy.set(key, { id: `fold_${source}_${target}`, source, target, data: { kind: 'fold', flowKind, count: (current?.data.count || 0) + 1 } });
  });
  return {
    nodes: graph.nodes.filter((node) => !hidden.has(node.id)),
    edges: [...edges, ...proxy.values()],
    summaries,
    hiddenNodeIds: [...hidden],
    suspendedRootIds,
  };
}
