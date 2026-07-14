import { useEffect, useState } from 'react';
import QuestionsView from './QuestionsView';

export default function CompassView({ context, objectiveNodes, questions, nodes, onSaveTopic, onSaveObjectives, onRequestQuestionChange, onRequestQuestionObjectiveChange, onRequestQuestionAdd, onRequestQuestionDelete, onUpdateQuestions, onJumpToNode }) {
  const [topic, setTopic] = useState(context.layer1);
  const [objectives, setObjectives] = useState(context.layer2);
  const objectiveLines = (context.layer2 || '').split('\n').filter(Boolean);

  useEffect(() => setTopic(context.layer1), [context.layer1]);
  useEffect(() => setObjectives(context.layer2), [context.layer2]);

  return (
    <div className="compass-view">
      <div className="compass-inner">
        <header className="screen-header">
          <div>
            <p className="screen-kicker">RESEARCH NAVIGATOR / COMPASS</p>
            <h1>Research compass</h1>
            <p className="screen-lead">The destination and the conditions that tell you when the work is enough.</p>
          </div>
        </header>

        <section className="compass-block">
          <label className="screen-label">Topic</label>
          <textarea className="compass-topic" rows={2} value={topic} onChange={(e) => setTopic(e.target.value)} onBlur={() => topic !== context.layer1 && onSaveTopic(topic, () => setTopic(context.layer1))} />
        </section>

        <section className="compass-block">
          <label className="screen-label">Objectives and exit criteria</label>
          <textarea className="compass-objectives" rows={Math.max(4, objectiveLines.length + 1)} value={objectives} onChange={(e) => setObjectives(e.target.value)} onBlur={() => objectives !== context.layer2 && onSaveObjectives(objectives, () => setObjectives(context.layer2))} />
          <div className="compass-objective-list">
            {objectiveNodes.map((node, index) => (
              <button className={'compass-objective ' + (node.data.met ? 'met' : '')} key={node.id} onClick={() => onJumpToNode(node.id)}>
                <span>{node.data.met ? 'Done' : 'Open'}</span>
                <strong>{objectiveLines[index] || node.data.title}</strong>
                {node.data.exitCriteria && <small>Done when: {node.data.exitCriteria}</small>}
              </button>
            ))}
          </div>
        </section>

        <section className="compass-questions">
          <div className="compass-section-head">
            <div>
              <label className="screen-label">Research questions</label>
              <p>Questions are the destination. Their answers are built from merged evidence.</p>
            </div>
          </div>
          <QuestionsView
            questions={questions}
            nodes={nodes}
            objectives={context.layer2}
            onRequestQuestionChange={onRequestQuestionChange}
            onRequestQuestionObjectiveChange={onRequestQuestionObjectiveChange}
            onRequestQuestionAdd={onRequestQuestionAdd}
            onRequestQuestionDelete={onRequestQuestionDelete}
            onUpdate={onUpdateQuestions}
            onJumpToNode={onJumpToNode}
          />
        </section>
      </div>
    </div>
  );
}
