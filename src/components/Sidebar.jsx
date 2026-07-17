import { useEffect, useRef, useState } from 'react';
import * as api from '../api';

const NODE_COLORS = ['#d97757', '#176b78', '#4f7a4d', '#9a7d3e', '#8b5e83', '#6f6a60'];
const ROLES = [
  ['aspect', 'Aspect'],
  ['idea', 'Idea'],
  ['task', 'Task'],
  ['experiment', 'Experiment'],
  ['decision', 'Decision'],
  ['synthesis', 'Synthesis'],
  ['note', 'Note / dump'],
];

export default function Sidebar({
  node,
  edge,
  nodesById = {},
  questions = [],
  team = { members: [] },
  onPatch,
  onPatchEdge,
  onMerge,
  onDelete,
  onDeleteEdge,
  onClose,
}) {
  const [md, setMd] = useState(null);
  const [savedAt, setSavedAt] = useState(null);
  const [saveError, setSaveError] = useState('');
  const [tagDraft, setTagDraft] = useState('');
  const timer = useRef(null);
  const mdRef = useRef(null);
  const dirtyRef = useRef(false);

  useEffect(() => {
    if (!node) return undefined;
    setMd(null);
    setSaveError('');
    api.getNode(node.id)
      .then((response) => {
        setMd(response.content);
        mdRef.current = response.content;
      })
      .catch((error) => {
        setMd('');
        mdRef.current = '';
        setSaveError(`Could not load notes: ${error.message}`);
      });
    return () => {
      clearTimeout(timer.current);
      if (dirtyRef.current && mdRef.current != null) api.putNode(node.id, mdRef.current);
    };
  }, [node?.id]);

  const isEdge = Boolean(edge);
  const isAnchor = Boolean(node?.data?.anchor);
  const role = node?.data?.role || (node?.data?.kind === 'synthesis' ? 'synthesis' : 'experiment');
  const isSynthesis = role === 'synthesis';
  const isQuestion = role === 'research-question';
  const isObjective = role === 'objective';
  const isActionable = ['task', 'experiment', 'decision', 'synthesis'].includes(role);
  const tags = node?.data?.tags || [];

  const onMdChange = (value) => {
    setMd(value);
    mdRef.current = value;
    dirtyRef.current = true;
    setSaveError('');
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      api.putNode(node.id, value)
        .then(() => {
          dirtyRef.current = false;
          setSavedAt(new Date());
        })
        .catch((error) => setSaveError(`Notes not saved: ${error.message}`));
    }, 1000);
  };

  const addTag = () => {
    const tag = tagDraft.trim();
    if (tag && !tags.includes(tag)) onPatch({ tags: [...tags, tag] });
    setTagDraft('');
  };

  const changeRole = (nextRole) => onPatch({ role: nextRole, kind: nextRole === 'synthesis' ? 'synthesis' : undefined });

  const handleDeleteNode = () => {
    if (window.confirm(`Delete "${node.data.title}" and its notes? Undo is available until this page is reloaded.\n\nUse "Mark dead end" instead when the work was a real attempt.`)) onDelete();
  };

  if (isEdge) {
    return (
      <aside className="sidebar">
        <SidebarHeader title="Link" onClose={onClose} />
        <div className="field">
          <label>Connection</label>
          <input type="text" readOnly value={`${nodesById[edge.source]?.data?.title || edge.source} → ${nodesById[edge.target]?.data?.title || edge.target}`} />
        </div>
        <div className="field">
          <label>Relationship type</label>
          <select value={edge.data?.kind || 'step'} onChange={(event) => onPatchEdge({ kind: event.target.value })}>
            <option value="step">Step in a route</option>
            <option value="depends-on">Blocking prerequisite</option>
            <option value="informs">Non-blocking knowledge</option>
            <option value="evidence">Evidence for a question</option>
            <option value="resolves">Closing synthesis resolves aspect</option>
          </select>
          <small className="field-help">The edge Markdown file owns this meaning and its rationale.</small>
        </div>
        <div className="field log-wrap">
          <label>Why this connection exists</label>
          <textarea rows={5} value={edge.data?.note || ''} onChange={(event) => onPatchEdge({ note: event.target.value })} placeholder="Dependency, evidence flow, or reasoning behind this link…" />
        </div>
        <div className="sidebar-actions">
          <button className="btn primary" onClick={onClose}>Done</button>
          <button className="btn danger" onClick={onDeleteEdge}>Delete link</button>
        </div>
      </aside>
    );
  }

  return (
    <aside className="sidebar">
      <SidebarHeader title={isQuestion ? 'Research question' : isObjective ? 'Objective' : role === 'project' ? 'Project' : isSynthesis ? 'Synthesis' : role === 'aspect' ? 'Aspect' : 'Research work'} onClose={onClose} />

      <div className="field">
        <label>Title</label>
        {isAnchor
          ? <><div className="structural-title">{node.data.title}</div><small className="field-help">Edit this structural anchor in Compass.</small></>
          : <input type="text" value={node.data.title} onChange={(event) => onPatch({ title: event.target.value })} />}
      </div>

      {!isAnchor && (
        <div className="field">
          <label>Type</label>
          <select value={role} onChange={(event) => changeRole(event.target.value)}>
            {!ROLES.some(([value]) => value === role) && <option value={role}>{role} (legacy)</option>}
            {ROLES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </div>
      )}

      {!isAnchor && isActionable && (
        <div className="task-planning">
          <button type="button" className={'pin-button' + (node.data.pinned ? ' on' : '')} onClick={() => onPatch({ pinned: node.data.pinned ? undefined : true, priorityRank: node.data.pinned ? undefined : node.data.priorityRank })}>
            <span aria-hidden="true">{node.data.pinned ? '●' : '○'}</span>
            {node.data.pinned ? 'Pinned on Home' : 'Pin to Home'}
          </button>
          <label><span>Due</span><input type="date" value={node.data.due || ''} onChange={(event) => onPatch({ due: event.target.value || undefined })} /></label>
        </div>
      )}

      {isObjective && (
        <div className="field objective-done">
          <label>Done when</label>
          <textarea rows={2} value={node.data.exitCriteria || ''} onChange={(event) => onPatch({ exitCriteria: event.target.value })} placeholder="A falsifiable exit criterion for this objective" />
          <button className={'met-toggle' + (node.data.met ? ' on' : '')} onClick={() => onPatch({ met: !node.data.met })}>
            {node.data.met ? 'Objective completed' : 'Mark objective completed'}
          </button>
        </div>
      )}

      <div className="field log-wrap">
        <label>{isSynthesis ? 'Synthesis notes' : 'Lab notes'}</label>
        <small className="field-help">Markdown · {node.id}.md · autosaves after 1 second</small>
        {md === null ? (
          <div className="save-note">Loading notes…</div>
        ) : (
          <textarea
            className="log"
            value={md}
            onChange={(event) => onMdChange(event.target.value)}
            placeholder={isSynthesis
              ? 'Compare the linked evidence and record what it says about the research question…'
              : 'Record assumptions, commands, metrics, observations, failures, and next steps…'}
          />
        )}
        {saveError && <div className="save-error">{saveError}</div>}
        {!saveError && savedAt && <div className="save-note">Saved {savedAt.toLocaleTimeString()}</div>}
      </div>

      <div className="sidebar-actions">
        {!isAnchor && node.data.status === 'active' && (
          <>
            <button className="btn primary" onClick={onMerge}>Merge result</button>
            <button className="btn danger" onClick={() => onPatch({ status: 'dead' })}>Mark dead end</button>
          </>
        )}
        {!isAnchor && node.data.status === 'dead' && <button className="btn" onClick={() => onPatch({ status: 'active' })}>Revive branch</button>}
        {!isAnchor && node.data.status === 'merged' && <button className="btn ghost" onClick={() => onPatch({ status: 'active' })}>Reopen</button>}
      </div>

      <details className="sidebar-details" open={Boolean(node.data.rq || tags.length || node.data.color)}>
        <summary>{isAnchor ? 'Metadata & appearance' : 'Evidence, tags & appearance'}</summary>
        <div className="sidebar-details-body">
          <div className="field">
            <label>Topics / tags</label>
            <small className="field-help">The first tag and node color identify this work on Home.</small>
            <div className="tag-input-row">
              {tags.map((tag) => (
                <span key={tag} className="tag-chip">
                  {tag}
                  <button type="button" onClick={() => onPatch({ tags: tags.filter((item) => item !== tag) })} aria-label={`Remove tag ${tag}`}>×</button>
                </span>
              ))}
              <input
                type="text"
                value={tagDraft}
                onChange={(event) => setTagDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    addTag();
                  }
                }}
                onBlur={addTag}
                placeholder="Add tag…"
              />
            </div>
          </div>

          {!isAnchor && (
            <>
            <div className="field">
              <label>Assigned to</label>
              <select multiple value={node.data.assignees || []} onChange={(event) => onPatch({ assignees: [...event.target.selectedOptions].map((option) => option.value) })}>
                {team.members.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}
              </select>
            </div>
            <div className="field evidence-field">
              <label>Research question</label>
              <select value={node.data.rq || ''} onChange={(event) => onPatch({ rq: event.target.value || undefined })}>
                <option value="">Not linked</option>
                {questions.map((question) => <option key={question.id} value={question.id}>{question.id}: {question.text.slice(0, 50)}</option>)}
              </select>
              {node.data.rq && (
                <>
                  <select className="mt-6" value={node.data.finding || 'positive'} onChange={(event) => onPatch({ finding: event.target.value })}>
                    <option value="positive">Supports the hypothesis</option>
                    <option value="negative">Contradicts the hypothesis</option>
                    <option value="neutral">Mixed or inconclusive</option>
                  </select>
                  <input className="mt-6" type="text" value={node.data.contribution || ''} onChange={(event) => onPatch({ contribution: event.target.value })} placeholder={`What this contributes to ${node.data.rq}`} />
                </>
              )}
            </div>
            </>
          )}

          {node.data.outcome && (
            <div className="field">
              <label>Outcome</label>
              <input type="text" value={node.data.outcome} onChange={(event) => onPatch({ outcome: event.target.value })} />
            </div>
          )}

          {!isAnchor && (
            <div className="field">
              <label>External experiment reference</label>
              <input type="text" value={node.data.external?.repoUrl || ''} onChange={(event) => onPatch({ external: { ...(node.data.external || {}), repoUrl: event.target.value } })} placeholder="Portable repository URL" />
              <input className="mt-6" type="text" value={node.data.external?.commit || ''} onChange={(event) => onPatch({ external: { ...(node.data.external || {}), commit: event.target.value } })} placeholder="Commit SHA" />
              <input className="mt-6" type="text" value={node.data.external?.runId || ''} onChange={(event) => onPatch({ external: { ...(node.data.external || {}), runId: event.target.value } })} placeholder="Run ID" />
              <input className="mt-6" type="text" value={node.data.external?.artifact || ''} onChange={(event) => onPatch({ external: { ...(node.data.external || {}), artifact: event.target.value } })} placeholder="Artifact-relative path (never an absolute local path)" />
            </div>
          )}

          <div className="field">
            <label>Topic / node color</label>
            <div className="node-color-row">
              {NODE_COLORS.map((color) => (
                <button key={color} type="button" className={'node-color-swatch' + (node.data.color === color ? ' selected' : '')} style={{ background: color }} aria-label={`Use ${color}`} onClick={() => onPatch({ color })} />
              ))}
              <input className="node-color-picker" type="color" value={node.data.color || '#faf9f5'} aria-label="Custom node color" onChange={(event) => onPatch({ color: event.target.value })} />
              {node.data.color && <button className="btn ghost node-color-clear" type="button" onClick={() => onPatch({ color: undefined })}>Clear</button>}
            </div>
          </div>
        </div>
      </details>

      {!isAnchor && <button className="link-danger" onClick={handleDeleteNode}>Delete node…</button>}
    </aside>
  );
}

function SidebarHeader({ title, onClose }) {
  return (
    <div className="sidebar-head">
      <h2>{title}</h2>
      <button className="sidebar-close" onClick={onClose} aria-label="Close details" title="Close">×</button>
    </div>
  );
}
