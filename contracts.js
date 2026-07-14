export const NODE_STATUSES = ['active', 'merged', 'dead'];
export const QUESTION_STATUSES = ['open', 'partial', 'answered'];
export const FINDINGS = ['positive', 'negative', 'neutral'];
export const EDGE_KINDS = ['step', 'merge'];

export const okId = (id) => typeof id === 'string' && /^[\w-]{1,80}$/.test(id);

const uniqueIds = (items) => {
  const ids = items.map((item) => item?.id);
  return ids.every(okId) && new Set(ids).size === ids.length;
};

export function graphError(graph) {
  if (!Array.isArray(graph?.nodes) || !Array.isArray(graph?.edges)) return 'nodes and edges must be arrays';
  if (!uniqueIds(graph.nodes)) return 'node ids must be unique and match [\\w-]{1,80}';
  const nodeIds = new Set(graph.nodes.map((node) => node.id));
  for (const node of graph.nodes) {
    if (!Number.isFinite(node.position?.x) || !Number.isFinite(node.position?.y)) return `bad position for ${node.id}`;
    if (typeof node.data?.title !== 'string' || !NODE_STATUSES.includes(node.data.status)) return `bad data for ${node.id}`;
  }
  if (!uniqueIds(graph.edges)) return 'edge ids must be unique and match [\\w-]{1,80}';
  for (const edge of graph.edges) {
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) return `missing endpoint for ${edge.id}`;
    if (edge.data?.kind && !EDGE_KINDS.includes(edge.data.kind)) return `bad kind for ${edge.id}`;
  }
  return '';
}

export function questionsError(value) {
  if (!Array.isArray(value?.questions)) return 'questions must be an array';
  if (!uniqueIds(value.questions) || value.questions.some((q) => !/^RQ\d+$/.test(q.id))) return 'question ids must be unique RQ<n> values';
  for (const question of value.questions) {
    if (typeof question.text !== 'string' || !Number.isInteger(question.obj) || question.obj < -1) return `bad question ${question.id}`;
    if (!QUESTION_STATUSES.includes(question.status) || typeof question.answer !== 'string') return `bad state for ${question.id}`;
  }
  return '';
}

export function timelineError(value) {
  if (!Array.isArray(value?.months)) return 'months must be an array';
  if (!uniqueIds(value.months)) return 'month ids must be unique and valid';
  const milestones = value.months.flatMap((month) => Array.isArray(month.milestones) ? month.milestones : []);
  if (!uniqueIds(milestones)) return 'milestone ids must be unique and valid';
  for (const month of value.months) {
    if (typeof month.title !== 'string' || !Array.isArray(month.milestones)) return `bad month ${month.id}`;
    for (const milestone of month.milestones) {
      if (typeof milestone.title !== 'string' || !Number.isInteger(milestone.obj) || milestone.obj < -1) return `bad milestone ${milestone.id}`;
      if (!Array.isArray(milestone.nodeIds) || !milestone.nodeIds.every(okId)) return `bad nodeIds for ${milestone.id}`;
    }
  }
  return '';
}
