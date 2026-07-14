import { useEffect, useRef, useState } from 'react';
import * as api from '../api';

const NODE_COLORS = ['#d97757', '#176b78', '#4f7a4d', '#9a7d3e', '#8b5e83', '#6f6a60'];

export default function Sidebar({
  node,
  edge,
  nodesById = {},
  questions = [],
  onPatch,
  onPatchEdge,
  onMerge,
  onDelete,
  onDeleteEdge,
  onClose,
}) {
  const [md, setMd] = useState(null);
  const [savedAt, setSavedAt] = useState(null);
  const [tagDraft, setTagDraft] = useState('');
  const timer = useRef(null);
  const mdRef = useRef(null);
  const dirtyRef = useRef(false);

  useEffect(() => {
    if (!node) return;
    api.getNode(node.id).then((r) => {
      setMd(r.content);
      mdRef.current = r.content;
    });
    return () => {
      clearTimeout(timer.current);
      if (dirtyRef.current && mdRef.current != null) api.putNode(node.id, mdRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [node?.id]);

  const isEdge = Boolean(edge);
  const isAnchor = Boolean(node?.data?.anchor);
  const isSynthesis = node?.data?.kind === 'synthesis';
  const tags = node?.data?.tags || [];

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

  const addTag = () => {
    const t = tagDraft.trim();
    if (t && !tags.includes(t)) onPatch({ tags: [...tags, t] });
    setTagDraft('');
  };

  const removeTag = (t) => onPatch({ tags: tags.filter((x) => x !== t) });

  const changeRole = (role) =>
    onPatch({ role: role || undefined, kind: role === 'synthesis' ? 'synthesis' : role === 'module' ? 'module' : 'experiment' });

  const handleDeleteNode = () => {
    if (
      window.confirm(
        `Delete "${node.data.title}"? Its notes are deleted too - this can't be undone.\n\n` +
          'For an abandoned experiment, "Mark dead end" is usually better: it keeps the record instead of erasing it.'
      )
    ) {
      onDelete();
    }
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-head">
        <h2>{isEdge ? 'Link' : isAnchor ? 'Objective' : isSynthesis ? 'Synthesis' : 'Node log'}</h2>
        <button className="sidebar-close" onClick={onClose} title="Close">
          x
        </button>
      </div>

      {isEdge ? (
        <>
          <div className="field">
            <label>Link</label>
            <input
              type="text"
              readOnly
              value={`${nodesById[edge.source]?.data?.title || edge.source} -> ${
                nodesById[edge.target]?.data?.title || edge.target
              }`}
            />
          </div>
          <div className="field">
            <label>Explain this link</label>
            <textarea
              rows={3}
              value={edge.data?.note || ''}
              onChange={(e) => onPatchEdge({ note: e.target.value })}
              placeholder="Why does this link exist? What does it mean?"
            />
          </div>
        </>
      ) : (
        <>
          <div className="field">
            <label>Title</label>
            <input type="text" value={node.data.title} onChange={(e) => onPatch({ title: e.target.value })} />
          </div>

          <div className="field">
            <label>Node color</label>
            <div className="node-color-row">
              {NODE_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={'node-color-swatch' + (node.data.color === color ? ' selected' : '')}
                  style={{ background: color }}
                  aria-label={`Use ${color}`}
                  title={color}
                  onClick={() => onPatch({ color })}
                />
              ))}
              <input
                className="node-color-picker"
                type="color"
                value={node.data.color || '#faf9f5'}
                aria-label="Choose custom node color"
                title="Choose custom color"
                onChange={(e) => onPatch({ color: e.target.value })}
              />
              {node.data.color && (
                <button className="btn ghost node-color-clear" type="button" onClick={() => onPatch({ color: undefined })}>
                  Clear
                </button>
              )}
            </div>
          </div>

          {isAnchor && (
            <div className="field">
              <label>Definition of done - the exit criterion that stops the trial-and-error loop</label>
              <textarea
                rows={2}
                value={node.data.exitCriteria || ''}
                onChange={(e) => onPatch({ exitCriteria: e.target.value })}
                placeholder="e.g. pipeline runs end-to-end, DINO boxes mapped into attention, no crash - not 'beats SOTA'"
              />
              <button
                className={'met-toggle' + (node.data.met ? ' on' : '')}
                onClick={() => onPatch({ met: !node.data.met })}
              >
                {node.data.met ? 'Objective met' : 'Mark objective met'}
              </button>
            </div>
          )}

          {!isAnchor && (
            <div className="field">
              <label>Role</label>
              <select value={node.data.role || (isSynthesis ? 'synthesis' : node.data.kind === 'module' ? 'module' : 'experiment')} onChange={(e) => changeRole(e.target.value)}>
                <option value="experiment">Experiment</option>
                <option value="milestone">Milestone</option>
                <option value="module">Module</option>
                <option value="synthesis">Synthesis</option>
                <option value="decision">Decision</option>
                <option value="literature">Literature</option>
                <option value="analysis">Analysis</option>
              </select>
            </div>
          )}

          <div className="field">
            <label>Tags</label>
            <div className="tag-input-row">
              {tags.map((t) => (
                <span key={t} className="tag-chip">
                  {t}
                  <button onClick={() => removeTag(t)} aria-label={`remove tag ${t}`}>
                    x
                  </button>
                </span>
              ))}
              <input
                type="text"
                value={tagDraft}
                onChange={(e) => setTagDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag();
                  }
                }}
                onBlur={addTag}
                placeholder={tags.length ? 'add another...' : 'e.g. teammate name, add tag...'}
              />
            </div>
          </div>

          {!isAnchor && (
            <div className="field synthesis-field">
              <button
                className={'kind-toggle' + (isSynthesis ? ' on' : '')}
                onClick={() => onPatch({ kind: isSynthesis ? 'experiment' : 'synthesis' })}
                title="Synthesis nodes are for writing analysis that connects evidence to a question, not for running experiments."
              >
                {isSynthesis ? 'Synthesis node' : 'Mark as synthesis node'}
              </button>
              <label>Feeds research question</label>
              <select value={node.data.rq || ''} onChange={(e) => onPatch({ rq: e.target.value || undefined })}>
                <option value="">-- none --</option>
                {questions.map((q) => (
                  <option key={q.id} value={q.id}>
                    {q.id}: {q.text.slice(0, 50)}
                  </option>
                ))}
              </select>
              {node.data.rq && (
                <>
                  <select
                    className="mt-6"
                    value={node.data.finding || 'positive'}
                    onChange={(e) => onPatch({ finding: e.target.value })}
                  >
                    <option value="positive">supports the hypothesis</option>
                    <option value="negative">goes against it</option>
                    <option value="neutral">mixed / inconclusive</option>
                  </select>
                  <input
                    className="mt-6"
                    type="text"
                    value={node.data.contribution || ''}
                    onChange={(e) => onPatch({ contribution: e.target.value })}
                    placeholder="What this says about the question..."
                  />
                </>
              )}
            </div>
          )}

          {node.data.outcome && (
            <div className="field">
              <label>Outcome</label>
              <input type="text" value={node.data.outcome} onChange={(e) => onPatch({ outcome: e.target.value })} />
            </div>
          )}

          <div className="field log-wrap">
            <label>
              {isSynthesis ? 'Analysis' : 'Lab notes'} ({node.id}.md - autosaves)
            </label>
            {md === null ? (
              <div className="save-note">loading...</div>
            ) : (
              <textarea
                className="log"
                value={md}
                onChange={(e) => onMdChange(e.target.value)}
                placeholder={
                  isSynthesis
                    ? 'Write the analysis: what do the linked experiments, together, say about the question?'
                    : 'Raw thoughts, results, failures, links, code snippets...'
                }
              />
            )}
          </div>

          <div className="sidebar-actions">
            {node.data.status === 'active' && (
              <>
                <button className="btn primary" onClick={onMerge}>
                  Merge & summarize
                </button>
                <button className="btn danger" onClick={() => onPatch({ status: 'dead' })}>
                  Mark dead end
                </button>
              </>
            )}
            {node.data.status === 'dead' && (
              <button className="btn" onClick={() => onPatch({ status: 'active' })}>
                Revive branch
              </button>
            )}
            {node.data.status === 'merged' && (
              <button className="btn ghost" onClick={() => onPatch({ status: 'active' })}>
                Reopen
              </button>
            )}
          </div>

          {savedAt && <div className="save-note">saved {savedAt.toLocaleTimeString()}</div>}

          <button className="link-danger" onClick={handleDeleteNode}>
            Delete node...
          </button>
        </>
      )}

      {isEdge && (
        <div className="sidebar-actions">
          <button className="btn primary" onClick={onClose}>
            Keep link
          </button>
          <button className="btn danger" onClick={onDeleteEdge}>
            Delete link
          </button>
        </div>
      )}
    </aside>
  );
}
