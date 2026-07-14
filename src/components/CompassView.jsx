import { useEffect, useState } from 'react';
import QuestionsView from './QuestionsView';

const objectiveText = (value = '') => value.replace(/^O\d+\s*:\s*/, '');

export default function CompassView({
  context,
  objectiveNodes,
  questions,
  nodes,
  onSaveTopic,
  onSaveObjective,
  onAddObjective,
  onRequestQuestionChange,
  onRequestQuestionObjectiveChange,
  onRequestQuestionAdd,
  onRequestQuestionDelete,
  onUpdateQuestions,
  onJumpToNode,
}) {
  const [topic, setTopic] = useState(context.layer1);
  const [objectiveDraft, setObjectiveDraft] = useState(null);
  const [objectiveError, setObjectiveError] = useState('');
  const objectiveLines = (context.layer2 || '').split('\n').filter(Boolean);

  useEffect(() => setTopic(context.layer1), [context.layer1]);

  const openObjective = (node, index) => {
    setObjectiveError('');
    setObjectiveDraft({ id: node.id, title: objectiveText(objectiveLines[index] || node.data.title), exitCriteria: node.data.exitCriteria || '', met: Boolean(node.data.met) });
  };

  const saveObjective = async (event) => {
    event.preventDefault();
    if (!objectiveDraft.title.trim()) return;
    setObjectiveError('');
    try {
      if (objectiveDraft.id) await onSaveObjective(objectiveDraft.id, objectiveDraft);
      else await onAddObjective(objectiveDraft);
      setObjectiveDraft(null);
    } catch (error) {
      setObjectiveError(error.message);
    }
  };

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
          <textarea className="compass-topic" rows={2} value={topic} onChange={(event) => setTopic(event.target.value)} onBlur={() => topic !== context.layer1 && onSaveTopic(topic, () => setTopic(context.layer1))} />
        </section>

        <section className="compass-block">
          <div className="compass-section-head">
            <div>
              <label className="screen-label">Objectives and exit criteria</label>
              <p>Open an objective to inspect or edit it without leaving Compass.</p>
            </div>
            <button className="btn" onClick={() => setObjectiveDraft({ id: null, title: '', exitCriteria: '', met: false })}>Add objective</button>
          </div>
          <div className="compass-objective-list">
            {objectiveNodes.map((node, index) => (
              <button className={'compass-objective ' + (node.data.met ? 'met' : '')} key={node.id} onClick={() => openObjective(node, index)}>
                <span>{node.data.met ? 'Done' : 'Open'}</span>
                <strong>{objectiveLines[index] || node.data.title}</strong>
                <small>{node.data.exitCriteria ? `Done when: ${node.data.exitCriteria}` : 'No exit criterion yet'}</small>
              </button>
            ))}
          </div>
        </section>

        <section className="compass-questions">
          <div className="compass-section-head">
            <div>
              <label className="screen-label">Research questions</label>
              <p>Questions are independent graph anchors. Their answers are built from merged evidence.</p>
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

      {objectiveDraft && (
        <div className="overlay" onClick={() => setObjectiveDraft(null)}>
          <form className="modal objective-modal" onSubmit={saveObjective} onClick={(event) => event.stopPropagation()}>
            <p className="screen-kicker">{objectiveDraft.id ? 'OBJECTIVE DETAILS' : 'NEW OBJECTIVE'}</p>
            <h2>{objectiveDraft.id ? 'Inspect and edit objective' : 'Add objective'}</h2>
            <div className="field">
              <label>Objective</label>
              <textarea autoFocus rows={3} value={objectiveDraft.title} onChange={(event) => setObjectiveDraft({ ...objectiveDraft, title: event.target.value })} />
            </div>
            <div className="field">
              <label>Done when</label>
              <textarea rows={3} value={objectiveDraft.exitCriteria} onChange={(event) => setObjectiveDraft({ ...objectiveDraft, exitCriteria: event.target.value })} placeholder="A falsifiable exit criterion" />
            </div>
            {objectiveDraft.id && (
              <label className="objective-met-check">
                <input type="checkbox" checked={objectiveDraft.met} onChange={(event) => setObjectiveDraft({ ...objectiveDraft, met: event.target.checked })} />
                Exit criterion is satisfied
              </label>
            )}
            {objectiveError && <p className="form-error">Could not save: {objectiveError}</p>}
            <div className="modal-actions">
              {objectiveDraft.id && <button type="button" className="btn ghost" onClick={() => { const id = objectiveDraft.id; setObjectiveDraft(null); onJumpToNode(id); }}>Show on map</button>}
              <button type="button" className="btn ghost" onClick={() => setObjectiveDraft(null)}>Cancel</button>
              <button className="btn primary" disabled={!objectiveDraft.title.trim()}>Save</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
