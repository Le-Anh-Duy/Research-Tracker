import { aspectProgress, objectiveProgress } from '../../research-domain.js';

export default function ObjectivesView({ graph, onJumpToNode }) {
  const objectives = graph.nodes.filter((node) => node.data.role === 'objective');
  const ideas = graph.nodes.filter((node) => ['idea', 'note'].includes(node.data.role) && !node.data.homeAspect);
  return <div className="review-view"><div className="review-inner objective-inner">
    <header className="screen-header"><div><p className="screen-kicker">RESEARCH NAVIGATOR / OBJECTIVES</p><h1>Objective workspaces</h1><p className="screen-lead">Each objective can end through several independent aspects. Cross-links remain visible on the Map without changing aspect ownership.</p></div></header>
    {objectives.map((objective) => {
      const progress = objectiveProgress(objective.id, graph.nodes, graph.edges);
      const aspects = graph.nodes.filter((node) => node.data.role === 'aspect' && node.data.objectiveId === objective.id);
      return <section className="objective-workspace" key={objective.id}>
        <button className="objective-title" onClick={() => onJumpToNode(objective.id)}><span>{objective.data.objectiveKind || 'research'}</span><strong>{objective.data.title}</strong><small>{progress.complete} of {progress.total} active aspects synthesized{progress.readyForReview ? ' · ready for human review' : ''}</small></button>
        <div className="aspect-grid">{aspects.map((aspect) => { const state = aspectProgress(aspect.id, graph.nodes, graph.edges); const closing = graph.nodes.find((node) => node.id === state.closingSynthesisId); return <button className={`aspect-card s-${state.status}`} key={aspect.id} onClick={() => onJumpToNode(aspect.id)}><span>{aspect.data.status === 'retired' ? 'retired' : state.status}</span><strong>{aspect.data.title}</strong><small>{closing ? `Closes at: ${closing.data.title}` : 'Closing synthesis not designated'}</small></button>; })}</div>
        {!aspects.length && <p className="review-empty">No aspects yet. Add one when the objective is understood well enough to decompose.</p>}
      </section>;
    })}
    <section className="objective-workspace"><div className="objective-title static"><span>unplaced</span><strong>Idea garden</strong><small>Floating capture does not affect evidence or progress.</small></div>{ideas.map((idea) => <button className="home-row" key={idea.id} onClick={() => onJumpToNode(idea.id)}><strong>{idea.data.title}</strong><small>{idea.data.role}</small></button>)}{!ideas.length && <p className="review-empty">No unplaced ideas or notes.</p>}</section>
  </div></div>;
}
