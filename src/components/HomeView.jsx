import { useEffect, useMemo, useState } from 'react';
import { aspectWorkProgress, dueDateWarnings, evidenceForQuestion, objectiveProgress, priorityTasks, reorderPriorityIds } from '../../research-domain.js';
import * as api from '../api';

export default function HomeView({ graph, timeline, questions, team, onSaveTeam, onJumpToNode, onOpenReview, onReorderPriorities }) {
  const [name, setName] = useState('');
  const [draggedPriority, setDraggedPriority] = useState('');
  const [activity, setActivity] = useState({ changes: [], commits: [] });
  useEffect(() => { api.gitActivity().then(setActivity).catch(() => {}); }, []);
  const priorities = useMemo(() => priorityTasks({ nodes: graph.nodes, edges: graph.edges, timeline }), [graph, timeline]);
  const objectives = graph.nodes.filter((node) => node.data.role === 'objective');
  const objectiveStates = objectives.map((node) => ({ node, progress: objectiveProgress(node.id, graph.nodes, graph.edges) }));
  const readyCount = objectiveStates.filter(({ progress }) => progress.readyForReview).length;
  const warnings = dueDateWarnings(graph.nodes, timeline);
  const current = timeline.months.filter((month) => month.current);
  const gaps = questions.filter((question) => !evidenceForQuestion(question.id, graph.nodes, graph.edges).length);
  const pinnedIds = priorities.filter(({ node }) => node.data.pinned).map(({ node }) => node.id);
  const dropPriority = (nodeId) => {
    const next = reorderPriorityIds(pinnedIds, draggedPriority, nodeId);
    if (next !== pinnedIds) onReorderPriorities(next);
    setDraggedPriority('');
  };

  const addMember = async () => {
    const clean = name.trim();
    if (!clean) return;
    const base = clean.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'member';
    let id = base;
    for (let i = 2; team.members.some((member) => member.id === id); i += 1) id = `${base}-${i}`;
    await onSaveTeam({ members: [...team.members, { id, name: clean }] });
    setName('');
  };

  return <div className="home-view"><div className="home-inner">
    <header className="screen-header home-header"><div><p className="screen-kicker">RESEARCH NAVIGATOR / HOME</p><h1>What matters now</h1><p className="screen-lead">Act from a short priority list; use the Map when you need the whole research memory.</p></div><div className="home-status-strip"><Stat value={priorities.length} label="priorities" /><Stat value={readyCount} label="ready for review" /><Stat value={gaps.length} label="evidence gaps" tone={gaps.length ? 'warn' : ''} /></div></header>

    <div className="home-grid">
      <section className="home-card priorities-card"><CardHead eyebrow="PRIORITY" title="Do next" count={priorities.length} />
        {priorities.length ? <div className="priority-list">{priorities.map(({ node, reasons }, index) => {
          const topic = node.data.tags?.[0] || node.data.role;
          const workProgress = node.data.homeAspect ? aspectWorkProgress(node.data.homeAspect, graph.nodes) : null;
          const percent = workProgress?.total ? (workProgress.complete / workProgress.total) * 100 : 0;
          return <div className={`priority-row${draggedPriority === node.id ? ' dragging' : ''}`} key={node.id} onDragOver={(event) => { if (node.data.pinned && draggedPriority) { event.preventDefault(); event.dataTransfer.dropEffect = 'move'; } }} onDrop={() => dropPriority(node.id)}><button className="priority-open" onClick={() => onJumpToNode(node.id)}><span className="priority-rank">{String(index + 1).padStart(2, '0')}</span><span className="priority-copy"><span className="priority-topic"><i style={{ background: node.data.color || 'var(--ink-soft)' }} />{topic}</span><strong>{node.data.title}</strong><small>{[...reasons, node.data.assignees?.join(', ') || 'unassigned'].join(' · ')}</small>{workProgress?.total > 0 && <span className="priority-progress"><i><b style={{ width: `${percent}%` }} /></i><small>{workProgress.complete}/{workProgress.total} merged in aspect</small></span>}</span></button>{node.data.pinned && <span className="priority-grip" draggable="true" onDragStart={(event) => { setDraggedPriority(node.id); event.dataTransfer.effectAllowed = 'move'; }} onDragEnd={() => setDraggedPriority('')} title="Drag to reorder" aria-label={`Drag ${node.data.title} to reorder`}>⋮⋮</span>}</div>;
        })}</div> : <Empty>Pin a task, link work to the current milestone, or add a due date.</Empty>}
      </section>

      {warnings.length > 0 && <section className="home-card home-wide warning-card"><CardHead eyebrow="CHECK" title="Schedule conflicts" count={warnings.length} />{warnings.map((warning) => <Row key={`${warning.nodeId}-${warning.milestoneId}`} title={graph.nodes.find((node) => node.id === warning.nodeId)?.data.title || warning.nodeId} detail="Task due date is later than its milestone deadline" onClick={() => onJumpToNode(warning.nodeId)} />)}</section>}

      <section className="home-card progress-card"><CardHead eyebrow="DIRECTION" title="Objective progress" count={objectives.length} />
        {objectiveStates.map(({ node, progress }) => <button className="objective-progress-row" key={node.id} onClick={() => onJumpToNode(node.id)}><span className={`objective-kind ${node.data.objectiveKind || 'research'}`}>{node.data.objectiveKind || 'research'}</span><strong>{node.data.title}</strong><span className="progress-count">{progress.complete}/{progress.total}</span><span className="progress-track"><i style={{ width: `${progress.total ? (progress.complete / progress.total) * 100 : 0}%` }} /></span><small>{progress.readyForReview ? 'Ready for human review' : 'Aspects synthesized'}</small></button>)}
      </section>

      <section className="home-card timeline-card"><CardHead eyebrow="TIME" title="Current timeline" count={current.length} />
        {current.length ? current.map((month) => <div className="home-period" key={month.id}><h3>{month.title}</h3>{month.milestones.map((milestone) => <Row key={milestone.id} onClick={() => milestone.nodeIds?.[0] && onJumpToNode(milestone.nodeIds[0])} title={milestone.title} detail={milestone.deadline ? `Deadline ${milestone.deadline}` : milestone.nodeIds?.length ? `${milestone.nodeIds.length} linked work item(s)` : 'Planned; no work linked yet'} />)}</div>) : <Empty>Select a current period when timing becomes useful.</Empty>}
      </section>

      <section className="home-card evidence-gap-card"><CardHead eyebrow="EVIDENCE" title="Questions needing evidence" count={gaps.length} />
        {gaps.length ? gaps.map((question) => <button className="question-gap-row" key={question.id} onClick={onOpenReview}><span>{question.id}</span><strong>{question.text}</strong><small>No merged evidence link yet</small></button>) : <Empty>Every research question has merged evidence.</Empty>}
      </section>

      <section className="home-card quiet-card"><CardHead eyebrow="PEOPLE" title="Team registry" count={team.members.length} />
        {team.members.map((member) => <div className="team-row" key={member.id}><span>{member.name}</span><code>{member.id}</code><button onClick={() => onSaveTeam({ members: team.members.filter((item) => item.id !== member.id) })}>Remove</button></div>)}
        <div className="team-add"><input value={name} onChange={(event) => setName(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && addMember()} placeholder="Teammate name" /><button className="btn ghost" onClick={addMember}>Add</button></div><p className="home-hint">Informational only. Git remains the teamwork contract.</p>
      </section>

      <section className="home-card quiet-card"><CardHead eyebrow="VERSION CONTROL" title="Recent Git activity" count={activity.changes.length} />
        {activity.changes.slice(0, 4).map((change) => <div className="journey-change" key={change.path}><code>{change.code}</code><span>{change.path}</span></div>)}
        {!activity.changes.length && activity.commits.slice(0, 3).map((commit) => <div className="journey-change" key={commit.id}><code>{commit.id.slice(0, 7)}</code><span>{commit.subject}</span></div>)}
        {!activity.changes.length && !activity.commits.length && <Empty>No tracked research commits yet.</Empty>}
      </section>
    </div>
  </div></div>;
}

const Stat = ({ value, label, tone = '' }) => <div className={`home-stat ${tone}`}><strong>{value}</strong><span>{label}</span></div>;
const CardHead = ({ eyebrow, title, count }) => <div className="home-card-head"><div><span>{eyebrow}</span><h2>{title}</h2></div><b>{count}</b></div>;
const Empty = ({ children }) => <p className="home-empty">{children}</p>;
const Row = ({ title, detail, onClick }) => <button className="home-row" onClick={onClick} disabled={!onClick}><strong>{title}</strong><small>{detail}</small></button>;
