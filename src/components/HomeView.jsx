import { useEffect, useMemo, useState } from 'react';
import { dueDateWarnings, evidenceForQuestion, objectiveProgress, priorityTasks } from '../../research-domain.js';
import * as api from '../api';

export default function HomeView({ graph, timeline, questions, team, onSaveTeam, onJumpToNode, onOpenReview }) {
  const [name, setName] = useState('');
  const [activity, setActivity] = useState({ changes: [], commits: [] });
  useEffect(() => { api.gitActivity().then(setActivity).catch(() => {}); }, []);
  const priorities = useMemo(() => priorityTasks({ nodes: graph.nodes, edges: graph.edges, timeline }), [graph, timeline]);
  const objectives = graph.nodes.filter((node) => node.data.role === 'objective');
  const warnings = dueDateWarnings(graph.nodes, timeline);
  const current = timeline.months.filter((month) => month.current);
  const gaps = questions.filter((question) => !evidenceForQuestion(question.id, graph.nodes, graph.edges).length);
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
    <header className="screen-header"><div><p className="screen-kicker">RESEARCH NAVIGATOR / HOME</p><h1>Your research, at a glance</h1><p className="screen-lead">A practical next-step view. The Map remains the full memory of the journey.</p></div></header>
    <div className="home-grid">
      <section className="home-card home-wide"><CardHead title="Current priorities" count={priorities.length} />
        {priorities.length ? priorities.map(({ node, reasons }) => <Row key={node.id} onClick={() => onJumpToNode(node.id)} title={node.data.title} detail={reasons.join(' · ')} />) : <Empty>No pinned, due-soon, blocking, or current-milestone task yet.</Empty>}
      </section>
      <section className="home-card"><CardHead title="Objective progress" count={objectives.length} />
        {objectives.map((node) => { const progress = objectiveProgress(node.id, graph.nodes, graph.edges); return <Row key={node.id} onClick={() => onJumpToNode(node.id)} title={node.data.title} detail={`${progress.complete} of ${progress.total} aspects synthesized${progress.readyForReview ? ' · ready for human review' : ''}`} />; })}
      </section>
      <section className="home-card"><CardHead title="Current timeline" count={current.length} />
        {current.length ? current.flatMap((month) => month.milestones.map((milestone) => <Row key={milestone.id} onClick={() => milestone.nodeIds?.[0] && onJumpToNode(milestone.nodeIds[0])} title={milestone.title} detail={`${month.title}${milestone.deadline ? ` · due ${milestone.deadline}` : ''}`} />)) : <Empty>Select a current period when timing becomes useful.</Empty>}
      </section>
      <section className="home-card"><CardHead title="Questions needing evidence" count={gaps.length} />
        {gaps.length ? gaps.map((question) => <Row key={question.id} title={`${question.id}: ${question.text}`} detail="No merged evidence link yet" onClick={onOpenReview} />) : <Empty>Every research question has merged evidence.</Empty>}
      </section>
      <section className="home-card"><CardHead title="Team registry" count={team.members.length} />
        {team.members.map((member) => <div className="team-row" key={member.id}><span>{member.name}</span><code>{member.id}</code><button onClick={() => onSaveTeam({ members: team.members.filter((item) => item.id !== member.id) })}>Remove</button></div>)}
        <div className="team-add"><input value={name} onChange={(event) => setName(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && addMember()} placeholder="Teammate name" /><button className="btn ghost" onClick={addMember}>Add</button></div>
        <p className="home-hint">Informational only. Saving updates <code>team.json</code>; teammates coordinate and read changes through Git.</p>
      </section>
      <section className="home-card"><CardHead title="Recent Git activity" count={activity.changes.length} />
        {activity.changes.slice(0, 4).map((change) => <div className="journey-change" key={change.path}><code>{change.code}</code><span>{change.path}</span></div>)}
        {!activity.changes.length && activity.commits.slice(0, 3).map((commit) => <div className="journey-change" key={commit.id}><code>{commit.id.slice(0, 7)}</code><span>{commit.subject}</span></div>)}
        {!activity.changes.length && !activity.commits.length && <Empty>No tracked research commits yet.</Empty>}
      </section>
      {(warnings.length > 0) && <section className="home-card warning-card"><CardHead title="Schedule warnings" count={warnings.length} />{warnings.map((warning) => <Row key={`${warning.nodeId}-${warning.milestoneId}`} title={graph.nodes.find((node) => node.id === warning.nodeId)?.data.title || warning.nodeId} detail="Task due date is after its milestone deadline" onClick={() => onJumpToNode(warning.nodeId)} />)}</section>}
    </div>
  </div></div>;
}

const CardHead = ({ title, count }) => <div className="home-card-head"><h2>{title}</h2><span>{count}</span></div>;
const Empty = ({ children }) => <p className="home-empty">{children}</p>;
const Row = ({ title, detail, onClick }) => <button className="home-row" onClick={onClick} disabled={!onClick}><strong>{title}</strong><small>{detail}</small></button>;
