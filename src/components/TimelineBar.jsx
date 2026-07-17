import { useState } from 'react';
import { milestoneStatus, monthStatus, reorderMilestones } from '../timelineStatus';

const DOT = { planned: '○', active: '◐', done: '●', stalled: '!' };
const id = (prefix) => `${prefix}_${Date.now()}`;

export default function TimelineBar({ months, nodesById, activeMilestoneId, onFocus, onChange }) {
  const [openId, setOpenId] = useState(months[0]?.id ?? null);
  const [collapsed, setCollapsed] = useState(false);
  const [monthDraft, setMonthDraft] = useState(null);
  const [milestoneDraft, setMilestoneDraft] = useState(null);
  const [draggedMilestone, setDraggedMilestone] = useState(null);
  const nodes = Object.values(nodesById).filter((node) => node.id !== 'project');
  const objectives = nodes.filter((node) => node.data.role === 'objective').sort((a, b) => a.position.x - b.position.x);
  let firstUnfinishedSeen = false;

  const saveMonth = async (event) => {
    event.preventDefault();
    const title = monthDraft.title.trim();
    if (!title) return;
    if (monthDraft.id) {
      if (await onChange(months.map((month) => month.id === monthDraft.id ? { ...month, title } : month))) setMonthDraft(null);
      return;
    }
    const monthId = id('m');
    const progressId = id('ms');
    const next = [...months, {
      id: monthId,
      title,
      current: !months.some((month) => month.current),
      milestones: [{ id: progressId, title: 'Review objective and RQ progress', nodeIds: [] }],
    }];
    if (await onChange(next)) {
      setMonthDraft(null);
      setOpenId(monthId);
    }
  };

  const deleteMonth = async (month) => {
    if (!window.confirm(`Delete "${month.title}" and its milestones? Nodes will not be deleted.`)) return;
    if (await onChange(months.filter((item) => item.id !== month.id))) {
      setOpenId((current) => current === month.id ? null : current);
      setMonthDraft(null);
      setMilestoneDraft(null);
    }
  };

  const saveMilestone = async (event) => {
    event.preventDefault();
    const title = milestoneDraft.title.trim();
    if (!title) return;
    const milestone = {
      id: milestoneDraft.id || id('ms'),
      title,
      ...(milestoneDraft.objectiveId ? { objectiveId: milestoneDraft.objectiveId } : {}),
      ...(milestoneDraft.deadline ? { deadline: milestoneDraft.deadline } : {}),
      nodeIds: milestoneDraft.nodeIds,
    };
    const next = months.map((month) => month.id !== milestoneDraft.monthId ? month : {
      ...month,
      milestones: milestoneDraft.id
        ? month.milestones.map((item) => item.id === milestone.id ? milestone : item)
        : [...month.milestones, milestone],
    });
    if (await onChange(next)) setMilestoneDraft(null);
  };

  const deleteMilestone = async (monthId, milestone) => {
    if (!window.confirm(`Delete milestone "${milestone.title}"?`)) return;
    const next = months.map((month) => month.id === monthId
      ? { ...month, milestones: month.milestones.filter((item) => item.id !== milestone.id) }
      : month);
    if (await onChange(next)) setMilestoneDraft(null);
  };

  const editMilestone = (monthId, milestone = null) => setMilestoneDraft({
    monthId,
    id: milestone?.id || null,
    title: milestone?.title || '',
    objectiveId: milestone?.objectiveId || '',
    deadline: milestone?.deadline || '',
    nodeIds: [...(milestone?.nodeIds || [])],
  });

  const dropMilestone = async (month, targetId) => {
    if (draggedMilestone?.monthId !== month.id) return;
    const milestones = reorderMilestones(month.milestones, draggedMilestone.id, targetId);
    if (milestones !== month.milestones) {
      await onChange(months.map((item) => item.id === month.id ? { ...item, milestones } : item));
    }
    setDraggedMilestone(null);
  };

  return (
    <aside className={'timeline-bar' + (collapsed ? ' collapsed' : '')} aria-label="Research timeline">
      <div className="timeline-head">
        {!collapsed && <strong>Timeline</strong>}
        <button
          type="button"
          className="timeline-toggle"
          onClick={() => setCollapsed((value) => !value)}
          aria-label={collapsed ? 'Show timeline' : 'Hide timeline'}
          title={collapsed ? 'Show timeline' : 'Hide timeline'}
        >
          {collapsed ? '›' : '‹'}
        </button>
      </div>

      <button
        type="button"
        className="timeline-add"
        onClick={() => {
          setMonthDraft({ id: null, title: '' });
          setCollapsed(false);
        }}
      >
        <span aria-hidden="true">+</span> {!collapsed && 'Add month'}
      </button>

      {!collapsed && monthDraft && !monthDraft.id && (
        <MonthForm draft={monthDraft} setDraft={setMonthDraft} onSubmit={saveMonth} onCancel={() => setMonthDraft(null)} />
      )}
      {!collapsed && !months.length && !monthDraft && <p className="timeline-empty">No months yet. Add one to start planning.</p>}

      {!collapsed && months.map((month) => {
        const status = monthStatus(month, nodesById);
        const isCurrent = status !== 'done' && !firstUnfinishedSeen;
        if (isCurrent) firstUnfinishedSeen = true;
        const behind = status !== 'done' && !isCurrent;
        const done = month.milestones.filter((milestone) => milestoneStatus(milestone, nodesById) === 'done').length;
        const editingMonth = monthDraft?.id === month.id;

        return (
          <section key={month.id} className={'month-card s-' + status + (behind ? ' behind' : '')}>
            {editingMonth ? (
              <MonthForm draft={monthDraft} setDraft={setMonthDraft} onSubmit={saveMonth} onCancel={() => setMonthDraft(null)} />
            ) : (
              <button type="button" className="month-head" onClick={() => setOpenId(openId === month.id ? null : month.id)}>
                <span className="month-title">{month.title}</span>
                <span className="month-frac">{done}/{month.milestones.length}</span>
              </button>
            )}

            {openId === month.id && !editingMonth && (
              <div className="month-body">
                <div className="milestone-list">
                  {month.milestones.map((milestone) => {
                    const status = milestoneStatus(milestone, nodesById);
                    const linked = milestone.nodeIds.length > 0;
                    return (
                      <div
                        className={'milestone-row s-' + status + (activeMilestoneId === milestone.id ? ' selected' : '') + (draggedMilestone?.id === milestone.id ? ' dragging' : '')}
                        key={milestone.id}
                        onDragOver={(event) => {
                          if (draggedMilestone?.monthId === month.id) {
                            event.preventDefault();
                            event.dataTransfer.dropEffect = 'move';
                          }
                        }}
                        onDrop={() => dropMilestone(month, milestone.id)}
                      >
                        <span
                          className="milestone-grip"
                          draggable="true"
                          onDragStart={(event) => {
                            setDraggedMilestone({ monthId: month.id, id: milestone.id });
                            event.dataTransfer.effectAllowed = 'move';
                          }}
                          onDragEnd={() => setDraggedMilestone(null)}
                          title="Drag to reorder"
                          aria-label={`Drag ${milestone.title} to reorder`}
                        >⋮⋮</span>
                        <span className="milestone-dot" title={status}>{DOT[status]}</span>
                        {linked ? (
                          <button type="button" className="milestone-title" onClick={() => onFocus(milestone)} title={`Focus ${milestone.nodeIds.length} linked node${milestone.nodeIds.length === 1 ? '' : 's'}`}>
                            {milestone.title}
                          </button>
                        ) : (
                          <span className="milestone-title unlinked">{milestone.title}</span>
                        )}
                        <button type="button" className="icon-button" onClick={() => editMilestone(month.id, milestone)} aria-label={`Edit ${milestone.title}`} title="Edit milestone">Edit</button>
                      </div>
                    );
                  })}
                  {!month.milestones.length && <p className="timeline-empty">No milestones yet.</p>}
                </div>

                {milestoneDraft?.monthId === month.id && (
                  <MilestoneForm
                    draft={milestoneDraft}
                    setDraft={setMilestoneDraft}
                    objectives={objectives}
                    nodes={nodes}
                    onSubmit={saveMilestone}
                    onCancel={() => setMilestoneDraft(null)}
                    onDelete={milestoneDraft.id ? () => deleteMilestone(month.id, milestoneDraft) : null}
                  />
                )}

                {!milestoneDraft && (
                  <div className="month-actions">
                    <button type="button" onClick={() => editMilestone(month.id)}>+ Milestone</button>
                    <button type="button" onClick={() => setMonthDraft({ id: month.id, title: month.title })}>Rename</button>
                    <button type="button" className="danger-text" onClick={() => deleteMonth(month)}>Delete</button>
                  </div>
                )}
              </div>
            )}
          </section>
        );
      })}
    </aside>
  );
}

function MonthForm({ draft, setDraft, onSubmit, onCancel }) {
  return (
    <form className="timeline-form" onSubmit={onSubmit}>
      <label>Month name</label>
      <input autoFocus type="text" value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} placeholder="e.g. July 2026 — Baseline" />
      <div className="form-actions">
        <button className="btn primary" disabled={!draft.title.trim()}>Save</button>
        <button type="button" className="btn ghost" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}

function MilestoneForm({ draft, setDraft, objectives, nodes, onSubmit, onCancel, onDelete }) {
  const addNode = (nodeId) => {
    if (nodeId && !draft.nodeIds.includes(nodeId)) setDraft({ ...draft, nodeIds: [...draft.nodeIds, nodeId] });
  };
  return (
    <form className="timeline-form milestone-form" onSubmit={onSubmit}>
      <label>Milestone</label>
      <input autoFocus type="text" value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} placeholder="Concrete result for this period" />
      <label>Objective</label>
      <select value={draft.objectiveId} onChange={(event) => setDraft({ ...draft, objectiveId: event.target.value })}>
        <option value="">General</option>
        {objectives.map((objective) => <option key={objective.id} value={objective.id}>{objective.data.title}</option>)}
      </select>
      <label>Deadline (optional)</label>
      <input type="date" value={draft.deadline} onChange={(event) => setDraft({ ...draft, deadline: event.target.value })} />
      <label>Linked work</label>
      <select value="" onChange={(event) => addNode(event.target.value)}>
        <option value="">Link a node…</option>
        {nodes.filter((node) => !draft.nodeIds.includes(node.id)).map((node) => <option key={node.id} value={node.id}>{node.data.title}</option>)}
      </select>
      <div className="linked-node-list">
        {draft.nodeIds.map((nodeId) => (
          <span className="linked-node" key={nodeId}>
            {nodes.find((node) => node.id === nodeId)?.data.title || nodeId}
            <button type="button" onClick={() => setDraft({ ...draft, nodeIds: draft.nodeIds.filter((id) => id !== nodeId) })} aria-label={`Unlink ${nodeId}`}>×</button>
          </span>
        ))}
        {!draft.nodeIds.length && <small>No node linked; milestone stays planned.</small>}
      </div>
      <div className="form-actions">
        <button className="btn primary" disabled={!draft.title.trim()}>Save</button>
        <button type="button" className="btn ghost" onClick={onCancel}>Cancel</button>
        {onDelete && <button type="button" className="btn danger" onClick={onDelete}>Delete</button>}
      </div>
    </form>
  );
}
