const ACTIONABLE_ROLES = new Set(['task', 'experiment', 'decision', 'synthesis']);

export function indexEdges(edges = []) {
  const incoming = new Map();
  const outgoing = new Map();
  for (const edge of edges) {
    if (!outgoing.has(edge.source)) outgoing.set(edge.source, []);
    if (!incoming.has(edge.target)) incoming.set(edge.target, []);
    outgoing.get(edge.source).push(edge);
    incoming.get(edge.target).push(edge);
  }
  return { incoming, outgoing };
}

export function aspectProgress(aspectId, nodes = [], edges = []) {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const closing = edges.find((edge) => edge.data?.kind === 'resolves' && edge.target === aspectId);
  const synthesis = closing && byId.get(closing.source);
  const status = !synthesis ? 'open'
    : synthesis.data.status === 'merged' ? 'resolved'
      : synthesis.data.status === 'dead' ? 'stalled'
        : 'active';
  return { aspectId, closingSynthesisId: synthesis?.id || null, status };
}

export function objectiveProgress(objectiveId, nodes = [], edges = []) {
  const aspects = nodes
    .filter((node) => node.data?.role === 'aspect' && node.data.objectiveId === objectiveId && node.data.status !== 'retired')
    .map((node) => aspectProgress(node.id, nodes, edges));
  const complete = aspects.filter((aspect) => aspect.status === 'resolved').length;
  return {
    objectiveId,
    complete,
    total: aspects.length,
    readyForReview: aspects.length > 0 && complete === aspects.length,
    aspects,
  };
}

export function evidenceForQuestion(questionId, nodes = [], edges = []) {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const questionIds = new Set(nodes
    .filter((node) => node.data?.role === 'research-question' && node.data.questionId === questionId)
    .map((node) => node.id));
  return edges
    .filter((edge) => edge.data?.kind === 'evidence' && questionIds.has(edge.target))
    .map((edge) => byId.get(edge.source))
    .filter((node) => node?.data?.status === 'merged');
}

function isResolved(node, nodes, edges) {
  if (!node) return false;
  if (node.data?.status === 'merged' || node.data?.met === true) return true;
  if (node.data?.role === 'aspect') return aspectProgress(node.id, nodes, edges).status === 'resolved';
  return false;
}

export function blockedNodeIds(nodes = [], edges = []) {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  return new Set(edges
    .filter((edge) => edge.data?.kind === 'depends-on' && !isResolved(byId.get(edge.source), nodes, edges))
    .map((edge) => edge.target));
}

const validDate = (value) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));

export function dueDateWarnings(nodes = [], timeline = { months: [] }) {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const warnings = [];
  for (const month of timeline.months || []) {
    for (const milestone of month.milestones || []) {
      if (!validDate(milestone.deadline)) continue;
      for (const nodeId of milestone.nodeIds || []) {
        const due = byId.get(nodeId)?.data?.due;
        if (validDate(due) && due > milestone.deadline) warnings.push({ nodeId, milestoneId: milestone.id, code: 'DUE_AFTER_MILESTONE' });
      }
    }
  }
  return warnings;
}

export function priorityTasks({ nodes = [], edges = [], timeline = { months: [] }, now = new Date(), limit = 5 } = {}) {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const currentIds = new Set((timeline.months || [])
    .filter((month) => month.current)
    .flatMap((month) => month.milestones || [])
    .flatMap((milestone) => milestone.nodeIds || []));
  const dependents = new Map();
  edges.filter((edge) => edge.data?.kind === 'depends-on').forEach((edge) => {
    if (!dependents.has(edge.source)) dependents.set(edge.source, []);
    dependents.get(edge.source).push(byId.get(edge.target));
  });
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());

  return nodes
    .filter((node) => ACTIONABLE_ROLES.has(node.data?.role) && node.data.status === 'active')
    .map((node) => {
      const reasons = [];
      let score = 0;
      if (node.data.pinned) { reasons.push('pinned'); score += 1000; }
      if (node.data.priority === 'high') score += 100;
      if (currentIds.has(node.id)) { reasons.push('current milestone'); score += 50; }
      if (validDate(node.data.due)) {
        const days = (Date.parse(`${node.data.due}T00:00:00Z`) - today) / 86400000;
        if (days <= 14) { reasons.push(days < 0 ? 'overdue' : 'due soon'); score += 40; }
      }
      for (const dependent of dependents.get(node.id) || []) {
        if (dependent?.data?.status === 'active') reasons.push(`blocks ${dependent.data.title}`);
      }
      score += (dependents.get(node.id) || []).length * 20;
      return { node, reasons, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.node.id.localeCompare(b.node.id))
    .slice(0, limit)
    .map(({ node, reasons }) => ({ node, reasons }));
}
