import { milestoneStatus } from '../timelineStatus';
import { evidenceForQuestion, objectiveProgress } from '../../research-domain.js';

export default function ReviewView({ nodes, edges, questions, timeline, onJumpToNode, onOpenCompass, onExportPlan }) {
  const active = nodes.filter((n) => n.data.status === 'active' && !n.data.anchor && n.data.role !== 'note');
  const objectives = nodes.filter((n) => n.data.role === 'objective');
  const gaps = questions.filter((question) => !evidenceForQuestion(question.id, nodes, edges).length);
  const claims = nodes.filter((n) => n.data.status === 'merged' && n.data.rq && !n.data.contribution);
  const milestones = timeline.months.flatMap((month) => month.milestones.map((milestone) => ({
    ...milestone,
    month: month.title,
    status: milestoneStatus(milestone, Object.fromEntries(nodes.map((n) => [n.id, n]))),
  }))).filter((milestone) => milestone.status !== 'done');

  const hasWork = active.length || gaps.length || claims.length || milestones.length || objectives.some((n) => !n.data.met);

  return (
    <div className="review-view">
      <div className="review-inner">
        <header className="screen-header">
          <div>
            <p className="screen-kicker">RESEARCH NAVIGATOR / REVIEW</p>
            <h1>Research review</h1>
            <p className="screen-lead">A short check-in before you decide what to do next.</p>
          </div>
          <button className="btn ghost" onClick={onExportPlan}>Export plan (.md)</button>
        </header>

        {!hasWork && <div className="review-clear">No open gaps detected. Keep recording evidence and revisit this page after the next experiment.</div>}

        <ReviewSection title="Objectives still open" empty="All objective nodes are marked met.">
          {objectives.filter((node) => !node.data.met).map((node) => (
            <ReviewRow key={node.id} onClick={() => onJumpToNode(node.id)}>
              <b>{node.data.title}</b>
              <span>{(() => { const progress = objectiveProgress(node.id, nodes, edges); return `${progress.complete} of ${progress.total} aspects synthesized${progress.readyForReview ? ' · ready for review' : ''}`; })()}</span>
            </ReviewRow>
          ))}
        </ReviewSection>

        <ReviewSection title="Questions without evidence" empty="Every question has at least one linked evidence node.">
          {gaps.map((question) => (
            <ReviewRow key={question.id} onClick={onOpenCompass}>
              <b>{question.id}</b>
              <span>{question.text}</span>
            </ReviewRow>
          ))}
        </ReviewSection>

        <ReviewSection title="Merged evidence needing a contribution" empty="All merged evidence has a contribution note.">
          {claims.map((node) => (
            <ReviewRow key={node.id} onClick={() => onJumpToNode(node.id)}>
              <b>{node.data.title}</b>
              <span>Linked to {node.data.rq}, but its contribution is empty.</span>
            </ReviewRow>
          ))}
        </ReviewSection>

        <ReviewSection title="Open branches" empty="No active branches.">
          {active.map((node) => (
            <ReviewRow key={node.id} onClick={() => onJumpToNode(node.id)}>
              <b>{node.data.title}</b>
              <span>{node.data.outcome || 'Still open: record the result or decide the next action.'}</span>
            </ReviewRow>
          ))}
        </ReviewSection>

        <ReviewSection title="Milestones not finished" empty="All milestones are complete.">
          {milestones.map((milestone) => (
            <ReviewRow key={milestone.id} onClick={() => milestone.nodeIds?.[0] && onJumpToNode(milestone.nodeIds[0])}>
              <b>{milestone.title}</b>
              <span>{milestone.month} · {milestone.nodeIds?.length ? milestone.status : 'No node linked yet'}</span>
            </ReviewRow>
          ))}
        </ReviewSection>
      </div>
    </div>
  );
}

function ReviewSection({ title, empty, children }) {
  const items = Array.isArray(children) ? children.filter(Boolean) : children ? [children] : [];
  return (
    <section className="review-section">
      <div className="review-section-head"><h2>{title}</h2><span>{items.length}</span></div>
      {items.length ? <div className="review-list">{items}</div> : <p className="review-empty">{empty}</p>}
    </section>
  );
}

function ReviewRow({ children, onClick }) {
  return <button className="review-row" onClick={onClick} disabled={!onClick}>{children}</button>;
}
