import { aspectProgress, objectiveProgress } from '../../core/research-domain.js';

export default function ObjectivesView({ graph, onJumpToNode }) {
  const objectives = graph.nodes.filter((node) => node.data.role === 'objective');
  const research = objectives.filter((node) => (node.data.objectiveKind || 'research') === 'research');
  const enabling = objectives.filter((node) => node.data.objectiveKind === 'enabling');
  const ideas = graph.nodes.filter((node) => ['idea', 'note'].includes(node.data.role) && !node.data.homeAspect);

  return <div className="review-view"><div className="review-inner objective-inner">
    <header className="screen-header objective-header"><div><p className="screen-kicker">RESEARCH NAVIGATOR / OBJECTIVES</p><h1>From objectives to resolved aspects</h1><p className="screen-lead">Research objectives answer scientific questions. Enabling objectives make that research possible without pretending to be evidence.</p></div><div className="objective-legend"><span className="research">Research</span><span className="enabling">Enabling</span></div></header>

    <ObjectiveGroup label="Research objectives" description="Scientific outcomes evaluated through explicit evidence." objectives={research} graph={graph} onJumpToNode={onJumpToNode} />
    <ObjectiveGroup label="Enabling objectives" description="Infrastructure, repository, and workflow required by the research." objectives={enabling} graph={graph} onJumpToNode={onJumpToNode} />

    <section className="idea-garden"><div><p className="objective-group-kicker">UNPLACED</p><h2>Idea garden</h2><p>Ideas and notes can remain here without affecting progress or evidence.</p></div><div>{ideas.map((idea) => <button className="home-row" key={idea.id} onClick={() => onJumpToNode(idea.id)}><strong>{idea.data.title}</strong><small>{idea.data.role}</small></button>)}{!ideas.length && <p className="review-empty">No unplaced ideas or notes.</p>}</div></section>
  </div></div>;
}

function ObjectiveGroup({ label, description, objectives, graph, onJumpToNode }) {
  if (!objectives.length) return null;
  return <section className="objective-group"><header><div><p className="objective-group-kicker">{label}</p><h2>{label}</h2><p>{description}</p></div><strong>{objectives.length}</strong></header>{objectives.map((objective) => <ObjectiveWorkspace key={objective.id} objective={objective} graph={graph} onJumpToNode={onJumpToNode} />)}</section>;
}

function ObjectiveWorkspace({ objective, graph, onJumpToNode }) {
  const progress = objectiveProgress(objective.id, graph.nodes, graph.edges);
  const aspects = graph.nodes.filter((node) => node.data.role === 'aspect' && node.data.objectiveId === objective.id);
  const percent = progress.total ? (progress.complete / progress.total) * 100 : 0;
  const kind = objective.data.objectiveKind || 'research';

  return <article className={`objective-workspace kind-${kind}`}>
    <button className="objective-title" onClick={() => onJumpToNode(objective.id)}><span className="objective-id">{objective.id.toUpperCase()}</span><span className={`objective-kind ${kind}`}>{kind}</span><strong>{objective.data.title.replace(/^O\d+:\s*/, '')}</strong><span className="objective-total"><b>{progress.complete}</b><i>/ {progress.total}</i><small>aspects synthesized</small></span></button>
    <div className="objective-progress-track"><i style={{ width: `${percent}%` }} /></div>
    <div className="objective-state-line"><span>{objective.data.met ? 'Objective met' : progress.readyForReview ? 'Ready for human review' : 'Research in progress'}</span><small>{objective.data.exitCriteria || 'Exit criterion not recorded'}</small></div>
    <div className="aspect-grid">{aspects.map((aspect) => {
      const state = aspectProgress(aspect.id, graph.nodes, graph.edges);
      const closing = graph.nodes.find((node) => node.id === state.closingSynthesisId);
      const displayState = aspect.data.status === 'retired' ? 'retired' : state.status;
      return <button className={`aspect-card s-${displayState}`} key={aspect.id} onClick={() => onJumpToNode(aspect.id)}><span className="aspect-state"><i />{displayState}</span><strong>{aspect.data.title}</strong><small>{closing ? `Closing synthesis: ${closing.data.title}` : 'Closing synthesis missing'}</small><em>Open on Map to focus or collapse its route →</em></button>;
    })}</div>
    {!aspects.length && <p className="review-empty">No aspects yet. Decompose this objective when its independent problems become clear.</p>}
  </article>;
}
