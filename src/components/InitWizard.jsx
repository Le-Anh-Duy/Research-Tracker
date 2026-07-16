import { useState } from 'react';

// The wizard asks; the researcher thinks. No AI here by design.
const STEPS = ['Topic', 'Objectives', 'Questions', 'First aspects', 'Timeline', 'Review'];

export default function InitWizard({ onDone }) {
  const [step, setStep] = useState(0);
  const [topic, setTopic] = useState('');
  const [objectives, setObjectives] = useState(['']);
  const [objectiveKinds, setObjectiveKinds] = useState({});
  const [questions, setQuestions] = useState([{ text: '', obj: -1 }]);
  const [firstAspects, setFirstAspects] = useState({});
  const [exitCriteria, setExitCriteria] = useState({});
  const [months, setMonths] = useState([]);
  const [connectInitialNodes, setConnectInitialNodes] = useState(true);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const cleanObjectives = objectives.map((o) => o.trim()).filter(Boolean);
  const cleanQuestions = questions.filter((q) => q.text.trim());
  const cleanMonths = months
    .map((m) => ({ title: m.title.trim(), milestones: m.milestones.filter((ms) => ms.text.trim()) }))
    .filter((m) => m.title && m.milestones.length > 0);

  const canNext =
    (step === 0 && topic.trim().length > 0) ||
    (step === 1 && cleanObjectives.length > 0) ||
    step === 2 ||
    step === 3 ||
    step === 4 ||
    step === 5;

  const next = () => setStep((s) => s + 1);
  const back = () => setStep((s) => s - 1);

  const create = async () => {
    setCreating(true);
    setCreateError('');
    try {
      await onDone({
        topic: topic.trim(),
        objectives: cleanObjectives,
        objectiveKinds: cleanObjectives.map((_, i) => objectiveKinds[i] || 'research'),
        questions: cleanQuestions.map((q) => ({ text: q.text.trim(), obj: q.obj })),
        firstAspects: cleanObjectives.map((_, i) => firstAspects[i] || ''),
        exitCriteria: cleanObjectives.map((_, i) => exitCriteria[i] || ''),
        months: cleanMonths.map((m) => ({
          title: m.title,
          milestones: m.milestones.map((ms) => ({ text: ms.text.trim(), obj: ms.obj })),
        })),
        connectInitialNodes,
      });
    } catch (error) {
      setCreateError(error.message);
      setCreating(false);
    }
  };

  const setList = (setter) => (i, value) =>
    setter((list) => list.map((item, idx) => (idx === i ? value : item)));
  const setObjective = setList(setObjectives);

  const addMonth = () =>
    setMonths((l) => [...l, { title: `Month ${l.length + 1}`, milestones: [{ text: '', obj: -1 }] }]);
  const removeMonth = (mi) => setMonths((l) => l.filter((_, idx) => idx !== mi));
  const setMonthTitle = (mi, title) =>
    setMonths((l) => l.map((m, idx) => (idx === mi ? { ...m, title } : m)));
  const addMilestone = (mi) =>
    setMonths((l) =>
      l.map((m, idx) => (idx === mi ? { ...m, milestones: [...m.milestones, { text: '', obj: -1 }] } : m))
    );
  const removeMilestone = (mi, msi) =>
    setMonths((l) =>
      l.map((m, idx) => (idx === mi ? { ...m, milestones: m.milestones.filter((_, j) => j !== msi) } : m))
    );
  const setMilestone = (mi, msi, patch) =>
    setMonths((l) =>
      l.map((m, idx) =>
        idx === mi
          ? { ...m, milestones: m.milestones.map((ms, j) => (j === msi ? { ...ms, ...patch } : ms)) }
          : m
      )
    );

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
                  <select value={objectiveKinds[i] || 'research'} onChange={(event) => setObjectiveKinds((current) => ({ ...current, [i]: event.target.value }))}>
                    <option value="research">research</option>
                    <option value="enabling">enabling</option>
                  </select>
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
            <h1>Where does each objective start and stop?</h1>
            <p className="help">
              For each objective: the FIRST concrete task (small enough to begin now), and — just as important — the
              "done when" that stops the trial-and-error loop. Done isn't "beats SOTA"; it's "I have the evidence I
              need to answer the question." Both are optional but the second one saves months.
            </p>
            <div className="wizard-list">
              {cleanObjectives.map((o, i) => (
                <div key={i} className="review-block" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <p className="help" style={{ margin: 0 }}>
                    <strong>O{i + 1}:</strong> {o}
                  </p>
                  <input
                    type="text"
                    value={firstAspects[i] || ''}
                    onChange={(e) => setFirstAspects((t) => ({ ...t, [i]: e.target.value }))}
                    placeholder="First research aspect…"
                  />
                  <input
                    type="text"
                    value={exitCriteria[i] || ''}
                    onChange={(e) => setExitCriteria((c) => ({ ...c, [i]: e.target.value }))}
                    placeholder="Done when… (exit criterion)"
                  />
                </div>
              ))}
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <h1>Roughly, how should this unfold over time?</h1>
            <p className="help">
              Optional. Break the work into months, and each month into ~2-week milestones. This becomes an
              always-visible timeline — milestones aren't checkboxes, they complete automatically once you link
              them to a node and merge it. Leave this empty if you'd rather plan as you go.
            </p>
            <div className="wizard-list">
              {months.map((m, mi) => (
                <div key={mi} className="review-block" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div className="wizard-item">
                    <input type="text" value={m.title} onChange={(e) => setMonthTitle(mi, e.target.value)} />
                    <button className="remove" onClick={() => removeMonth(mi)}>
                      ✕
                    </button>
                  </div>
                  {m.milestones.map((ms, msi) => (
                    <div className="wizard-item" key={msi}>
                      <span className="ordinal">·</span>
                      <input
                        type="text"
                        value={ms.text}
                        onChange={(e) => setMilestone(mi, msi, { text: e.target.value })}
                        placeholder="Milestone for these ~2 weeks…"
                      />
                      <select
                        value={ms.obj}
                        onChange={(e) => setMilestone(mi, msi, { obj: Number(e.target.value) })}
                      >
                        <option value={-1}>general</option>
                        {cleanObjectives.map((_, oi) => (
                          <option key={oi} value={oi}>
                            O{oi + 1}
                          </option>
                        ))}
                      </select>
                      {m.milestones.length > 1 && (
                        <button className="remove" onClick={() => removeMilestone(mi, msi)}>
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                  <button className="btn ghost" onClick={() => addMilestone(mi)}>
                    + Add milestone
                  </button>
                </div>
              ))}
            </div>
            <button className="btn ghost" onClick={addMonth}>
              + Add month
            </button>
          </>
        )}

        {step === 5 && (
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
                    {firstAspects[i]?.trim() && (
                      <span style={{ color: 'var(--ink-soft)' }}> → first aspect: {firstAspects[i]}</span>
                    )}
                    {exitCriteria[i]?.trim() && (
                      <span style={{ color: 'var(--ink-soft)' }}> · done when: {exitCriteria[i]}</span>
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
            {cleanMonths.length > 0 && (
              <div className="review-block">
                <h3>Timeline</h3>
                {cleanMonths.map((m, mi) => (
                  <div key={mi} style={{ marginBottom: 6 }}>
                    <p style={{ margin: '4px 0' }}>
                      <strong>{m.title}</strong>
                    </p>
                    <ul>
                      {m.milestones.map((ms, msi) => (
                        <li key={msi}>
                          {ms.text}
                          {ms.obj >= 0 ? ` (O${ms.obj + 1})` : ''}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
            <label className="wizard-option">
              <input
                type="checkbox"
                checked={connectInitialNodes}
                onChange={(e) => setConnectInitialNodes(e.target.checked)}
              />
              <span>
                Connect initial nodes to the roadmap
                <small>Turn this off to create floating objectives and tasks. You can link them later when the research path becomes clearer.</small>
              </span>
            </label>
            <p className="help">
              This writes plain text files into <code>research_data/</code> — everything stays on your machine, and
              you can edit any of it later.
            </p>
          </>
        )}

        {createError && <p className="form-error">Could not create roadmap: {createError}</p>}
        <div className="wizard-actions">
          {step > 0 && (
            <button className="btn ghost" onClick={back} disabled={creating}>
              ← Back
            </button>
          )}
          <div className="right">
            {step < 5 && (
              <button className="btn primary" onClick={next} disabled={!canNext}>
                Next →
              </button>
            )}
            {step === 5 && (
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
