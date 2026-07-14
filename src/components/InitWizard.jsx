import { useState } from 'react';

// The wizard asks; the researcher thinks. No AI here by design.
const STEPS = ['Topic', 'Objectives', 'Questions', 'First tasks', 'Review'];

export default function InitWizard({ onDone }) {
  const [step, setStep] = useState(0);
  const [topic, setTopic] = useState('');
  const [objectives, setObjectives] = useState(['']);
  const [questions, setQuestions] = useState([{ text: '', obj: -1 }]);
  const [firstTasks, setFirstTasks] = useState({});
  const [creating, setCreating] = useState(false);

  const cleanObjectives = objectives.map((o) => o.trim()).filter(Boolean);
  const cleanQuestions = questions.filter((q) => q.text.trim());

  const canNext =
    (step === 0 && topic.trim().length > 0) ||
    (step === 1 && cleanObjectives.length > 0) ||
    step === 2 ||
    step === 3 ||
    step === 4;

  const next = () => setStep((s) => s + 1);
  const back = () => setStep((s) => s - 1);

  const create = async () => {
    setCreating(true);
    await onDone({
      topic: topic.trim(),
      objectives: cleanObjectives,
      questions: cleanQuestions.map((q) => ({ text: q.text.trim(), obj: q.obj })),
      firstTasks: cleanObjectives.map((_, i) => firstTasks[i] || ''),
    });
  };

  const setList = (setter) => (i, value) =>
    setter((list) => list.map((item, idx) => (idx === i ? value : item)));
  const setObjective = setList(setObjectives);

  return (
    <div className="wizard">
      <div className="wizard-card">
        <div className="wizard-step">
          Step {step + 1} / {STEPS.length} — {STEPS[step]}
        </div>

        {step === 0 && (
          <>
            <h1>What are you researching?</h1>
            <p className="help">
              One or two sentences. This becomes your Layer 1 compass — it stays on screen at all times, so when you
              get lost in a rabbit hole, this line pulls you back.
            </p>
            <textarea
              rows={3}
              autoFocus
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Explainable visual geolocation via training-free attention intervention…"
            />
          </>
        )}

        {step === 1 && (
          <>
            <h1>What must exist for this to be done?</h1>
            <p className="help">
              List your objectives — the concrete outcomes that define "finished" (usually 2–4). Each objective
              becomes its own lane on the map. If you can't measure it, rewrite it until you can.
            </p>
            <div className="wizard-list">
              {objectives.map((o, i) => (
                <div className="wizard-item" key={i}>
                  <span className="ordinal">O{i + 1}</span>
                  <input
                    type="text"
                    value={o}
                    autoFocus={i === objectives.length - 1}
                    onChange={(e) => setObjective(i, e.target.value)}
                    placeholder="e.g. Build the attention-injection framework on a frozen backbone"
                  />
                  {objectives.length > 1 && (
                    <button
                      className="remove"
                      onClick={() => setObjectives((l) => l.filter((_, idx) => idx !== i))}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button className="btn ghost" onClick={() => setObjectives((l) => [...l, ''])}>
              + Add objective
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <h1>What question does each objective answer?</h1>
            <p className="help">
              Research questions keep experiments honest — every node you create later should serve one of these.
              Link each question to an objective, or leave it general. You can skip this and fill it in later.
            </p>
            <div className="wizard-list">
              {questions.map((q, i) => (
                <div className="wizard-item" key={i}>
                  <span className="ordinal">RQ{i + 1}</span>
                  <input
                    type="text"
                    value={q.text}
                    onChange={(e) =>
                      setQuestions((l) => l.map((it, idx) => (idx === i ? { ...it, text: e.target.value } : it)))
                    }
                    placeholder="e.g. How do explicit local clues affect robustness under domain shift?"
                  />
                  <select
                    value={q.obj}
                    onChange={(e) =>
                      setQuestions((l) =>
                        l.map((it, idx) => (idx === i ? { ...it, obj: Number(e.target.value) } : it))
                      )
                    }
                  >
                    <option value={-1}>general</option>
                    {cleanObjectives.map((_, oi) => (
                      <option key={oi} value={oi}>
                        O{oi + 1}
                      </option>
                    ))}
                  </select>
                  {questions.length > 1 && (
                    <button className="remove" onClick={() => setQuestions((l) => l.filter((_, idx) => idx !== i))}>
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button className="btn ghost" onClick={() => setQuestions((l) => [...l, { text: '', obj: -1 }])}>
              + Add question
            </button>
          </>
        )}

        {step === 3 && (
          <>
            <h1>What can you start this week?</h1>
            <p className="help">
              For each objective, name the first concrete task — something small enough to actually begin (a
              baseline to reproduce, a dataset to download, a paper to dissect). These become your starting nodes.
            </p>
            <div className="wizard-list">
              {cleanObjectives.map((o, i) => (
                <div key={i}>
                  <p className="help" style={{ marginBottom: 4 }}>
                    <strong>O{i + 1}:</strong> {o}
                  </p>
                  <input
                    type="text"
                    value={firstTasks[i] || ''}
                    onChange={(e) => setFirstTasks((t) => ({ ...t, [i]: e.target.value }))}
                    placeholder="First concrete task…"
                  />
                </div>
              ))}
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <h1>Your roadmap</h1>
            <div className="review-block">
              <h3>Topic</h3>
              <p>{topic}</p>
            </div>
            <div className="review-block">
              <h3>Objectives</h3>
              <ul>
                {cleanObjectives.map((o, i) => (
                  <li key={i}>
                    O{i + 1}: {o}
                    {firstTasks[i]?.trim() && (
                      <span style={{ color: 'var(--ink-soft)' }}> → first: {firstTasks[i]}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
            {cleanQuestions.length > 0 && (
              <div className="review-block">
                <h3>Research questions</h3>
                <ul>
                  {cleanQuestions.map((q, i) => (
                    <li key={i}>
                      RQ{i + 1}
                      {q.obj >= 0 ? ` (O${q.obj + 1})` : ''}: {q.text}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <p className="help">
              This writes plain text files into <code>research_data/</code> — everything stays on your machine, and
              you can edit any of it later.
            </p>
          </>
        )}

        <div className="wizard-actions">
          {step > 0 && (
            <button className="btn ghost" onClick={back} disabled={creating}>
              ← Back
            </button>
          )}
          <div className="right">
            {step < 4 && (
              <button className="btn primary" onClick={next} disabled={!canNext}>
                Next →
              </button>
            )}
            {step === 4 && (
              <button className="btn primary" onClick={create} disabled={creating}>
                {creating ? 'Creating…' : 'Create roadmap'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
