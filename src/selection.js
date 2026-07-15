export function applySelectionChanges(ids, changes) {
  const next = new Set(ids);
  changes.forEach((change) => change.selected ? next.add(change.id) : next.delete(change.id));
  return [...next];
}

export const detailSelectionForClick = (nodeId, ctrlKey) => ctrlKey ? null : nodeId;
