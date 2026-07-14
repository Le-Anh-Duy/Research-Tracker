import { useState } from 'react';
import { milestoneStatus, monthStatus } from '../timelineStatus';

const DOT = { planned: '○', active: '◐', done: '●', stalled: '!' };

export default function TimelineBar({ months, nodesById, onSelect }) {
  const [openId, setOpenId] = useState(months[0]?.id ?? null);
  const [selectedMilestoneId, setSelectedMilestoneId] = useState(null);
  if (!months.length) return null;

  let firstUnfinishedSeen = false;

  return (
    <div className="timeline-bar">
      {months.map((month) => {
        const status = monthStatus(month, nodesById);
        const isCurrent = status !== 'done' && !firstUnfinishedSeen;
        if (isCurrent) firstUnfinishedSeen = true;
        const behind = status !== 'done' && !isCurrent; // an earlier month is still open
        const done = month.milestones.filter((m) => milestoneStatus(m, nodesById) === 'done').length;

        return (
          <div key={month.id} className={'month-card s-' + status + (behind ? ' behind' : '')}>
            <button className="month-head" onClick={() => setOpenId(openId === month.id ? null : month.id)}>
              <span className="month-title">{month.title}</span>
              <span className="month-frac">
                {done}/{month.milestones.length}
              </span>
            </button>
            {openId === month.id && (
              <div className="milestone-list">
                {month.milestones.map((ms) => {
                  const mStatus = milestoneStatus(ms, nodesById);
                  const linked = (ms.nodeIds || []).length > 0;
                  const selectMilestone = () => {
                    setSelectedMilestoneId(ms.id);
                    if (linked) onSelect(ms.nodeIds[0]);
                  };
                  return (
                    <button
                      key={ms.id}
                      className={'milestone-chip s-' + mStatus + (selectedMilestoneId === ms.id ? ' selected' : '')}
                      title={linked ? 'Jump to linked node' : 'Not started — no node linked yet'}
                      onClick={selectMilestone}
                    >
                      <span className="milestone-dot">{DOT[mStatus]}</span> {ms.title}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
