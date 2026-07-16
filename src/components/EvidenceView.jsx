import { evidenceForQuestion } from '../../research-domain.js';

export default function EvidenceView({ graph, questions, onJumpToNode }) {
  return <div className="review-view"><div className="review-inner">
    <header className="screen-header"><div><p className="screen-kicker">RESEARCH NAVIGATOR / EVIDENCE</p><h1>Evidence by research question</h1><p className="screen-lead">Only explicit evidence relationships count here. Objective membership alone never implies a scientific contribution.</p></div></header>
    {questions.map((question) => {
      const evidence = evidenceForQuestion(question.id, graph.nodes, graph.edges);
      return <section className="evidence-card" key={question.id}><div className="evidence-head"><code>{question.id}</code><div><h2>{question.text}</h2><p>{question.objectiveIds?.length ? `Related objectives: ${question.objectiveIds.join(', ')}` : 'Cross-project question'}</p></div><span>{evidence.length} merged</span></div>
        {evidence.length ? evidence.map((node) => <button className="home-row" key={node.id} onClick={() => onJumpToNode(node.id)}><strong>{node.data.title}</strong><small>{node.data.finding || 'evidence'}{node.data.contribution ? ` · ${node.data.contribution}` : ' · contribution note missing'}</small></button>) : <p className="review-empty">No merged evidence yet. Link a result or synthesis with an evidence edge.</p>}
      </section>;
    })}
  </div></div>;
}
