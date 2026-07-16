import { useEffect, useState } from 'react';
import * as api from '../api';

export default function JourneyView({ onShowSnapshot }) {
  const [activity, setActivity] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { api.gitActivity().then(setActivity).catch((value) => setError(value.message)); }, []);
  return <div className="review-view"><div className="review-inner">
    <header className="screen-header"><div><p className="screen-kicker">RESEARCH NAVIGATOR / JOURNEY</p><h1>Versioned research journey</h1><p className="screen-lead">Read-only Git history. Looking back never checks out, reverts, commits, pulls, or pushes anything.</p></div></header>
    {error && <p className="form-error">{error}</p>}
    <section className="review-section"><div className="review-section-head"><h2>Uncommitted research changes</h2><span>{activity?.changes.length || 0}</span></div>{activity?.changes.length ? activity.changes.map((change) => <div className="journey-change" key={change.path}><code>{change.code}</code><span>{change.path}</span></div>) : <p className="review-empty">The tracked research state is clean.</p>}</section>
    <section className="review-section"><div className="review-section-head"><h2>Checkpoints</h2><span>{activity?.checkpoints.length || 0}</span></div>{activity?.checkpoints.map((item) => <button className="home-row" key={item.name} onClick={() => onShowSnapshot(item.name)}><strong>{item.name}</strong><small>{item.date} · {item.subject}</small></button>)}</section>
    <section className="review-section"><div className="review-section-head"><h2>Research commits</h2><span>{activity?.commits.length || 0}</span></div>{activity?.commits.map((commit) => <button className="home-row" key={commit.id} onClick={() => onShowSnapshot(commit.id)}><strong>{commit.subject || 'Research update'}</strong><small>{commit.date} · {commit.id.slice(0, 8)}</small></button>)}</section>
  </div></div>;
}
