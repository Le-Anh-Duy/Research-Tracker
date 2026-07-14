import { useEffect, useRef, useState } from 'react';
import * as api from '../api';

export default function Sidebar({ node, onPatch, onMerge, onClose }) {
  const [md, setMd] = useState(null); // null until loaded
  const [savedAt, setSavedAt] = useState(null);
  const timer = useRef(null);
  const mdRef = useRef(null);
  const dirtyRef = useRef(false);

  useEffect(() => {
    api.getNode(node.id).then((r) => {
      setMd(r.content);
      mdRef.current = r.content;
    });
    // Flush pending edits when the sidebar unmounts / switches node.
    return () => {
      clearTimeout(timer.current);
      if (dirtyRef.current && mdRef.current != null) api.putNode(node.id, mdRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // key={node.id} remounts this component per node

  const onMdChange = (value) => {
    setMd(value);
    mdRef.current = value;
    dirtyRef.current = true;
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      api.putNode(node.id, value).then(() => {
        dirtyRef.current = false;
        setSavedAt(new Date());
      });
    }, 1000);
  };

  const { status } = node.data;

  return (
    <aside className="sidebar">
      <div className="sidebar-head">
        <h2>Node log</h2>
        <button className="sidebar-close" onClick={onClose} title="Close">
          ✕
        </button>
      </div>

      <div className="field">
        <label>Title</label>
        <input type="text" value={node.data.title} onChange={(e) => onPatch({ title: e.target.value })} />
      </div>

      {node.data.outcome && (
        <div className="field">
          <label>Outcome</label>
          <input type="text" value={node.data.outcome} onChange={(e) => onPatch({ outcome: e.target.value })} />
        </div>
      )}

      <div className="field log-wrap">
        <label>Lab notes ({node.id}.md — autosaves)</label>
        {md === null ? (
          <div className="save-note">loading…</div>
        ) : (
          <textarea
            className="log"
            value={md}
            onChange={(e) => onMdChange(e.target.value)}
            placeholder={'Raw thoughts, results, failures, links, code snippets…'}
          />
        )}
      </div>

      <div className="sidebar-actions">
        {status === 'active' && (
          <>
            <button className="btn primary" onClick={onMerge}>
              Merge &amp; summarize
            </button>
            <button className="btn danger" onClick={() => onPatch({ status: 'dead' })}>
              Mark dead end
            </button>
          </>
        )}
        {status === 'dead' && (
          <button className="btn" onClick={() => onPatch({ status: 'active' })}>
            Revive branch
          </button>
        )}
        {status === 'merged' && (
          <button className="btn ghost" onClick={() => onPatch({ status: 'active' })}>
            Reopen
          </button>
        )}
      </div>
      {savedAt && <div className="save-note">saved {savedAt.toLocaleTimeString()}</div>}
    </aside>
  );
}
