import { useState } from 'react';
import { milestoneStatus, monthStatus } from '../timelineStatus';

const DOT = { planned: '○', active: '◐', done: '●', stalled: '!' };
const id = (prefix) => `${prefix}_${Date.now()}`;

export default function TimelineBar({ months, nodesById, activeMilestoneId, onFocus, onChange }) {
  const [openId, setOpenId] = useState(months[0]?.id ?? null);
  const [collapsed, setCollapsed] = useState(false);
  const [monthDraft, setMonthDraft] = useState(null);
  const [milestoneDraft, setMilestoneDraft] = useState(null);
  const nodes = Object.values(nodesById).filter((node) => node.id !== 'n_start');
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
      milestones: [{ id: progressId, title: 'Review O1–O3 and RQ1–RQ3 progress', obj: -1, nodeIds: [] }],
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
      obj: Number(milestoneDraft.obj),
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
    obj: milestone?.obj ?? -1,
    nodeIds: [...(milestone?.nodeIds || [])],
  });

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
                      <div className={'milestone-row s-' + status + (activeMilestoneId === milestone.id ? ' selected' : '')} key={milestone.id}>
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
      <select value={draft.obj} onChange={(event) => setDraft({ ...draft, obj: Number(event.target.value) })}>
        <option value={-1}>General</option>
        {objectives.map((objective, index) => <option key={objective.id} value={index}>O{index + 1}: {objective.data.title.replace(/^O\d+:\s*/, '')}</option>)}
      </select>
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
