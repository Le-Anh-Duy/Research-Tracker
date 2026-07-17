import { EDGE_KINDS, NODE_STATUSES, graphError, okId } from './contracts.js';

const checked = (graph) => {
  const error = graphError(graph);
  if (error) throw new Error(error);
  return graph;
};

export function createNode(graph, node) {
  if (!okId(node?.id) || graph.nodes.some((item) => item.id === node.id)) throw new Error('node id must be unique and valid');
  return checked({ ...graph, nodes: [...graph.nodes, node] });
}

export function patchNode(graph, nodeId, patch) {
  if (!graph.nodes.some((node) => node.id === nodeId)) throw new Error(`missing node ${nodeId}`);
  return checked({
    ...graph,
    nodes: graph.nodes.map((node) => node.id === nodeId ? { ...node, data: { ...node.data, ...patch } } : node),
  });
}

export function connectNodes(graph, edge) {
  if (!okId(edge?.id) || graph.edges.some((item) => item.id === edge.id)) throw new Error('edge id must be unique and valid');
  if (!EDGE_KINDS.includes(edge.data?.kind)) throw new Error(`bad kind for ${edge.id}`);
  return checked({ ...graph, edges: [...graph.edges, edge] });
}

export function transitionNode(graph, nodeId, status, { outcome = '', humanApproved = false } = {}) {
  const node = graph.nodes.find((item) => item.id === nodeId);
  if (!node) throw new Error(`missing node ${nodeId}`);
  if (!NODE_STATUSES.includes(status)) throw new Error(`bad status ${status}`);
  if (status === 'retired' && (node.data.role !== 'aspect' || !humanApproved)) throw new Error('retiring an aspect requires human approval');
  if (['merged', 'dead', 'retired', 'superseded'].includes(status) && !outcome.trim()) throw new Error(`${status} requires an outcome`);
  return patchNode(graph, nodeId, { status, outcome: outcome.trim() });
}

export function setObjectiveMet(graph, objectiveId, met, { humanApproved = false } = {}) {
  const node = graph.nodes.find((item) => item.id === objectiveId);
  if (node?.data.role !== 'objective') throw new Error(`missing objective ${objectiveId}`);
  if (!humanApproved) throw new Error('marking an objective requires human approval');
  return patchNode(graph, objectiveId, { met: Boolean(met) });
}
