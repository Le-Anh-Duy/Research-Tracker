import { useEffect, useState } from 'react';
import * as api from '../api';

export default function MergeModal({ node, questions, onConfirm, onClose }) {
  const [phase, setPhase] = useState('loading'); // loading | ready | manual
  const [title, setTitle] = useState(node.data.title);
  const [outcome, setOutcome] = useState(node.data.outcome || '');
  const [rq, setRq] = useState(node.data.rq || '');
  const [finding, setFinding] = useState(node.data.finding || 'positive');
  const [contribution, setContribution] = useState(node.data.contribution || '');

  useEffect(() => {
    api
      .summarize(node.id)
      .then((r) => {
        setTitle(r.title);
        setOutcome(r.outcome);
        setPhase('ready');
      })
      .catch(() => setPhase('manual'));
  }, [node.id]);

  const submit = () =>
    onConfirm({
      title: title.trim(),
      outcome: outcome.trim(),
      rq: rq || undefined,
      finding: rq ? finding : undefined,
      contribution: rq ? contribution.trim() : undefined,
    });

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Merge branch</h2>
        {phase === 'loading' && <p className="ai-note ai-wait">Asking local AI to summarize the log</p>}
        {phase === 'ready' && <p className="ai-note">Local AI suggested a summary — edit freely, then confirm.</p>}
        {phase === 'manual' && (
          <p className="muted">
            Local AI is offline — no problem. Write the summary yourself: what was this branch, and what did you
            learn?
          </p>
        )}

        {phase !== 'loading' && (
          <>
            <div className="field">
              <label>Title</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
            </div>
            <div className="field">
              <label>Outcome — what was learned or decided</label>
              <textarea rows={2} value={outcome} onChange={(e) => setOutcome(e.target.value)} />
            </div>

            <div className="synthesis-box">
              <div className="synthesis-head">Connect to a research question (optional)</div>
              <p className="muted small">
                This is the moment an experiment becomes an answer. A negative or mixed result counts — it's still
                evidence.
              </p>
              <div className="field">
                <label>Feeds question</label>
                <select value={rq} onChange={(e) => setRq(e.target.value)}>
                  <option value="">— none —</option>
                  {questions.map((q) => (
                    <option key={q.id} value={q.id}>
                      {q.id}: {q.text.slice(0, 60)}
                    </option>
                  ))}
                </select>
              </div>
              {rq && (
                <>
                  <div className="field">
                    <label>This result…</label>
                    <select value={finding} onChange={(e) => setFinding(e.target.value)}>
                      <option value="positive">supports the hypothesis</option>
                      <option value="negative">goes against it</option>
                      <option value="neutral">is mixed / inconclusive</option>
                    </select>
                  </div>
                  <div className="field">
                    <label>What does it say about {rq}?</label>
                    <textarea
                      rows={2}
                      value={contribution}
                      onChange={(e) => setContribution(e.target.value)}
                      placeholder="One line you'll thank yourself for when writing the paper."
                    />
                  </div>
                </>
              )}
            </div>
          </>
        )}

        <div className="modal-actions">
          <button className="btn ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn primary" disabled={phase === 'loading' || !title.trim()} onClick={submit}>
            Confirm merge
          </button>
        </div>
      </div>
    </div>
  );
}
