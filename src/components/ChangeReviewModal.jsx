export default function ChangeReviewModal({ change, onApply, onClose }) {
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal change-review" onClick={(e) => e.stopPropagation()}>
        <p className="screen-kicker">STRUCTURAL CHANGE REVIEW</p>
        <h2>{change.title}</h2>
        <p className="muted">This change can invalidate links, claims, and notes. Review the affected records before applying it.</p>
        <div className="change-diff">
          <div><label>Current</label><pre>{change.before || '(empty)'}</pre></div>
          <div><label>Proposed</label><pre>{change.after || '(empty)'}</pre></div>
        </div>
        <div className="change-impact">
          <label>Affected records ({change.affected.length})</label>
          {change.affected.length ? <ul>{change.affected.map((item) => <li key={item.id}>{item.id}: {item.title}</li>)}</ul> : <p className="muted">No linked notes found.</p>}
        </div>
        {change.blocked && <p className="change-warning">{change.blocked}</p>}
        <div className="modal-actions">
          <button className="btn ghost" onClick={onClose}>Cancel</button>
          <button className="btn primary" onClick={onApply} disabled={change.blocked}>Apply after review</button>
        </div>
      </div>
    </div>
  );
}
