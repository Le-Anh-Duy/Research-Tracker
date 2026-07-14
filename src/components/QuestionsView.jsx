import { useEffect, useState } from 'react';
import { isEvidenceFor } from '../roadmap';

// The destination board. Experiments live on the Map; this is where their
// evidence adds up into an answer. Evidence per RQ is DERIVED from nodes
// (any node whose data.rq points here) — never stored twice.

const STATUSES = ['open', 'partial', 'answered'];
const FINDING_LABEL = { positive: '+ supports', negative: '− against', neutral: '~ mixed' };

export default function QuestionsView({ questions, nodes, objectives, onUpdate, onRequestQuestionChange, onRequestQuestionObjectiveChange, onRequestQuestionAdd, onRequestQuestionDelete, onJumpToNode }) {
  const objLines = (objectives || '').split('\n').filter(Boolean);
  const [drafts, setDrafts] = useState({});
  const [newText, setNewText] = useState('');
  const [newObj, setNewObj] = useState(-1);
  useEffect(() => setDrafts(Object.fromEntries(questions.map((q) => [q.id, q.text]))), [questions]);

  const setField = (id, field, value) =>
    onUpdate((qs) => qs.map((q) => (q.id === id ? { ...q, [field]: value } : q)), field === 'status');

  return (
    <div className="qview">
      <div className="qview-inner">
        <p className="qview-lead">
          Your questions are the destination. Each experiment you merge on the Map can point here as evidence —
          this is where you write, in your own words, what that evidence adds up to.
        </p>
        {questions.map((q) => {
          const evidence = nodes.filter((node) => isEvidenceFor(node, q.id));
          return (
            <div key={q.id} className={'q-card s-' + q.status}>
              <div className="q-head">
                <span className="q-id">{q.id}</span>
                <select className="q-objective" value={q.obj} onChange={(e) => onRequestQuestionObjectiveChange(q, Number(e.target.value))} title="Objective this question serves">
                  <option value={-1}>general</option>
                  {objLines.map((_, index) => <option key={index} value={index}>O{index + 1}</option>)}
                </select>
                <select
                  className="q-status"
                  value={q.status}
                  onChange={(e) => setField(q.id, 'status', e.target.value)}
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <button className="q-delete" onClick={() => onRequestQuestionDelete(q)} title="Delete research question">Delete</button>
              </div>

              <textarea
                className="q-text"
                rows={2}
                value={drafts[q.id] ?? q.text}
                onChange={(e) => setDrafts((d) => ({ ...d, [q.id]: e.target.value }))}
                onBlur={() => drafts[q.id] !== q.text && onRequestQuestionChange(q, drafts[q.id], () => setDrafts((d) => ({ ...d, [q.id]: q.text })))}
              />

              <label className="q-label">Current answer — what the evidence so far tells you</label>
              <textarea
                className="q-answer"
                rows={4}
                value={q.answer}
                placeholder="Synthesize here. Even a partial, hedged answer beats an empty box — update it as evidence lands."
                onChange={(e) => setField(q.id, 'answer', e.target.value)}
              />

              <div className="q-evidence">
                <div className="q-label">
                  Evidence ({evidence.length}) — merged experiments pointing at this question
                </div>
                {evidence.length === 0 ? (
                  <div className="q-evidence-empty">
                    None yet. On the Map, merge a branch and set its question to {q.id}.
                  </div>
                ) : (
                  evidence.map((n) => (
                    <button key={n.id} className="q-evidence-row" onClick={() => onJumpToNode(n.id)}>
                      {n.data.finding && (
                        <span className={'finding-badge f-' + n.data.finding}>
                          {FINDING_LABEL[n.data.finding]}
                        </span>
                      )}
                      <span className="q-evidence-title">{n.data.title}</span>
                      {n.data.contribution && <span className="q-evidence-contrib">{n.data.contribution}</span>}
                    </button>
                  ))
                )}
              </div>
            </div>
          );
        })}
        {!questions.length && <div className="qview-empty">Add the first research question below. It can be linked to an objective or kept general.</div>}
        <div className="q-add">
          <input value={newText} onChange={(e) => setNewText(e.target.value)} placeholder="New research question..." />
          <select value={newObj} onChange={(e) => setNewObj(Number(e.target.value))}>
            <option value={-1}>general</option>
            {objLines.map((_, index) => <option key={index} value={index}>O{index + 1}</option>)}
          </select>
          <button className="btn ghost" disabled={!newText.trim()} onClick={() => onRequestQuestionAdd(newText.trim(), newObj, () => setNewText(''))}>Add question</button>
        </div>
      </div>
    </div>
  );
}
