import { useEffect, useState } from 'react';
import * as api from '../api';

export default function MergeModal({ node, onConfirm, onClose }) {
  const [phase, setPhase] = useState('loading'); // loading | ready | manual
  const [title, setTitle] = useState(node.data.title);
  const [outcome, setOutcome] = useState(node.data.outcome || '');

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
              <textarea rows={3} value={outcome} onChange={(e) => setOutcome(e.target.value)} />
            </div>
          </>
        )}

        <div className="modal-actions">
          <button className="btn ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn primary"
            disabled={phase === 'loading' || !title.trim()}
            onClick={() => onConfirm(title.trim(), outcome.trim())}
          >
            Confirm merge
          </button>
        </div>
      </div>
    </div>
  );
}
