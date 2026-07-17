export const NODE_STATUSES = ['active', 'merged', 'dead', 'retired', 'superseded'];
export const NODE_ROLES = ['project', 'objective', 'research-question', 'aspect', 'idea', 'task', 'experiment', 'decision', 'synthesis', 'note'];
export const QUESTION_STATUSES = ['open', 'partial', 'answered'];
export const FINDINGS = ['positive', 'negative', 'neutral'];
export const EDGE_KINDS = ['step', 'depends-on', 'informs', 'evidence', 'resolves'];

export const okId = (id) => typeof id === 'string' && /^[\w-]{1,80}$/.test(id);

const uniqueIds = (items) => {
  const ids = items.map((item) => item?.id);
  return ids.every(okId) && new Set(ids).size === ids.length;
};

const okDate = (value) => value === undefined || (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`)));

export function graphError(graph) {
  if (!Array.isArray(graph?.nodes) || !Array.isArray(graph?.edges)) return 'nodes and edges must be arrays';
  if (!uniqueIds(graph.nodes)) return 'node ids must be unique and match [\\w-]{1,80}';
  const nodeIds = new Set(graph.nodes.map((node) => node.id));
  for (const node of graph.nodes) {
    if (!Number.isFinite(node.position?.x) || !Number.isFinite(node.position?.y)) return `bad position for ${node.id}`;
    if (typeof node.data?.title !== 'string' || !NODE_STATUSES.includes(node.data.status)) return `bad data for ${node.id}`;
    if (node.data.role && !NODE_ROLES.includes(node.data.role)) return `bad role for ${node.id}`;
    if (node.data.objectiveKind && !['research', 'enabling'].includes(node.data.objectiveKind)) return `bad objective kind for ${node.id}`;
    if (node.data.homeAspect && !okId(node.data.homeAspect)) return `bad home aspect for ${node.id}`;
    if (node.data.objectiveId && !okId(node.data.objectiveId)) return `bad objective for ${node.id}`;
    if (node.data.assignees && (!Array.isArray(node.data.assignees) || !node.data.assignees.every(okId))) return `bad assignees for ${node.id}`;
    if (!okDate(node.data.due)) return `bad due date for ${node.id}`;
    if (node.data.priorityRank !== undefined && (!Number.isInteger(node.data.priorityRank) || node.data.priorityRank < 0)) return `bad priority rank for ${node.id}`;
    if (node.data.external !== undefined) {
      if (!node.data.external || typeof node.data.external !== 'object' || Array.isArray(node.data.external)) return `bad external reference for ${node.id}`;
      if (Object.values(node.data.external).some((value) => typeof value !== 'string')) return `bad external reference for ${node.id}`;
      if (node.data.external.artifact && (/^[a-zA-Z]:[\\/]/.test(node.data.external.artifact) || node.data.external.artifact.startsWith('/') || node.data.external.artifact.startsWith('\\\\'))) return `external artifact must be portable for ${node.id}`;
    }
  }
  if (!uniqueIds(graph.edges)) return 'edge ids must be unique and match [\\w-]{1,80}';
  for (const edge of graph.edges) {
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) return `missing endpoint for ${edge.id}`;
    if (!EDGE_KINDS.includes(edge.data?.kind)) return `bad kind for ${edge.id}`;
  }
  return '';
}

export function questionsError(value) {
  if (!Array.isArray(value?.questions)) return 'questions must be an array';
  if (!uniqueIds(value.questions) || value.questions.some((q) => !/^RQ\d+$/.test(q.id))) return 'question ids must be unique RQ<n> values';
  for (const question of value.questions) {
    if (typeof question.text !== 'string') return `bad question ${question.id}`;
    if (question.objectiveIds && (!Array.isArray(question.objectiveIds) || !question.objectiveIds.every(okId))) return `bad objectives for ${question.id}`;
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
      if (typeof milestone.title !== 'string' || !okDate(milestone.deadline)) return `bad milestone ${milestone.id}`;
      if (!Array.isArray(milestone.nodeIds) || !milestone.nodeIds.every(okId)) return `bad nodeIds for ${milestone.id}`;
    }
  }
  return '';
}

export function teamError(value) {
  if (!Array.isArray(value?.members) || !uniqueIds(value.members)) return 'members must have unique valid ids';
  for (const member of value.members) {
    if (typeof member.name !== 'string' || !member.name.trim()) return `bad member ${member.id}`;
    if (member.github !== undefined && typeof member.github !== 'string') return `bad github for ${member.id}`;
  }
  return '';
}
