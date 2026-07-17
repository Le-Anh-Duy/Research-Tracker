// A milestone/month never gets a manual "done" checkbox — status is derived
// from the graph so the timeline can't drift out of sync with actual work.

export function milestoneStatus(milestone, nodesById) {
  const ids = milestone.nodeIds || [];
  if (ids.some((id) => !nodesById[id])) return 'stalled';
  const statuses = ids.map((id) => nodesById[id]?.data?.status);
  if (statuses.length === 0) return 'planned';
  if (statuses.every((s) => s === 'merged')) return 'done';
  if (statuses.every((s) => s === 'dead')) return 'stalled';
  return 'active';
}

export function monthStatus(month, nodesById) {
  const statuses = (month.milestones || []).map((m) => milestoneStatus(m, nodesById));
  if (statuses.length === 0) return 'planned';
  if (statuses.every((s) => s === 'done')) return 'done';
  if (statuses.some((s) => s === 'done' || s === 'active')) return 'active';
  return 'planned';
}

export function reorderMilestones(milestones, draggedId, targetId) {
  const from = milestones.findIndex(({ id }) => id === draggedId);
  const to = milestones.findIndex(({ id }) => id === targetId);
  if (from < 0 || to < 0 || from === to) return milestones;
  const next = [...milestones];
  next.splice(to, 0, next.splice(from, 1)[0]);
  return next;
}
