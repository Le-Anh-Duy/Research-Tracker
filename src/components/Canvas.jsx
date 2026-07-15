import { useCallback, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MarkerType,
  SelectionMode,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import * as api from '../api';
import ResearchNode from './ResearchNode';
import { focusState } from '../roadmap';
import { applySelectionChanges, detailSelectionForClick } from '../selection';

const nodeTypes = { research: ResearchNode };
const STEP_COLOR = '#b9b2a3';
const MERGE_COLOR = '#d97757';

export default function Canvas({
  graph,
  questions,
  milestoneNodeIds,
  updateGraph,
  deleteEdge,
  selectedId,
  selectedEdgeId,
  focusedNodeIds,
  focusLabel,
  onSelect,
  onSelectEdge,
  onClearFocus,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}) {
  const { screenToFlowPosition } = useReactFlow();
  const [hoverEdge, setHoverEdge] = useState(null);
  const [selectedNodeIds, setSelectedNodeIds] = useState([]);
  const [newNode, setNewNode] = useState(null);
  const [createError, setCreateError] = useState('');

  const nodes = graph.nodes.map((n) => ({
    ...n,
    type: 'research',
    selected: selectedNodeIds.includes(n.id),
    data: {
      ...n.data,
      title: n.data.questionId
        ? `${n.data.questionId}: ${questions.find((question) => question.id === n.data.questionId)?.text || n.data.title}`
        : n.data.title,
      isSelected: n.id === selectedId || selectedNodeIds.includes(n.id),
      focusState: focusState(n.id, focusedNodeIds),
      role:
        n.data.role ||
        (n.id === 'n_start'
          ? 'project'
          : n.data.anchor
            ? 'objective'
            : n.data.kind === 'module'
              ? 'module'
              : n.data.kind === 'synthesis'
                ? 'synthesis'
                : milestoneNodeIds.has(n.id)
                  ? 'milestone'
                  : 'experiment'),
    },
  }));

  const edges = graph.edges.map((e) => {
    const merged = e.data?.kind === 'merge';
    const hovered = e.id === hoverEdge;
    const selected = e.id === selectedEdgeId;
    const focusMatch = !focusedNodeIds.length || (focusedNodeIds.includes(e.source) && focusedNodeIds.includes(e.target));
    const color = selected ? '#1f1e1d' : hovered ? '#b3452e' : merged ? MERGE_COLOR : STEP_COLOR;
    return {
      ...e,
      style: {
        stroke: color,
        strokeWidth: selected || hovered ? 2.5 : 1.5,
        strokeDasharray: merged ? '6 4' : undefined,
        cursor: 'pointer',
        opacity: focusMatch ? 1 : 0.12,
      },
      markerEnd: { type: MarkerType.ArrowClosed, color },
    };
  });

  // Node position/dimension changes are layout noise - save but don't checkpoint.
  const onNodesChange = useCallback(
    (changes) => {
      const selection = changes.filter((c) => c.type === 'select');
      if (selection.length) setSelectedNodeIds((ids) => applySelectionChanges(ids, selection));
      const real = changes.filter((c) => c.type !== 'select');
      if (real.length) {
        updateGraph((g) => ({ ...g, nodes: applyNodeChanges(real, g.nodes) }), { checkpoint: false });
      }
    },
    [updateGraph]
  );

  const onEdgesChange = useCallback(
    (changes) => {
      const real = changes.filter((c) => c.type !== 'select');
      if (real.length) {
        updateGraph((g) => ({ ...g, edges: applyEdgeChanges(real, g.edges) }), { checkpoint: false });
      }
    },
    [updateGraph]
  );

  const onConnect = useCallback(
    (params) => {
      updateGraph((g) => ({ ...g, edges: addEdge({ ...params, data: { kind: 'step' } }, g.edges) }), {
        immediate: true,
      });
    },
    [updateGraph]
  );

  const onDoubleClick = useCallback(
    (event) => {
      // Only create on empty canvas, not on nodes/controls.
      if (!event.target.classList.contains('react-flow__pane')) return;
      const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
      setCreateError('');
      setNewNode({ position, title: '', role: 'work' });
    },
    [screenToFlowPosition]
  );

  const createNode = async (event) => {
    event.preventDefault();
    const title = newNode.title.trim();
    if (!title) return;
    const id = 'n_' + Date.now();
    const kind = newNode.role === 'synthesis' ? 'synthesis' : undefined;
    try {
      await api.putNode(id, `# ${title}\n`);
      updateGraph(
        (graph) => ({
          ...graph,
          nodes: [...graph.nodes, { id, position: newNode.position, data: { title, role: newNode.role, kind, status: 'active', outcome: '' } }],
        }),
        { immediate: true }
      );
      setNewNode(null);
      onSelect(id);
      onSelectEdge(null);
    } catch (error) {
      setCreateError(error.message);
    }
  };

  return (
    <div className="canvas-wrap" onDoubleClick={onDoubleClick}>
      <div className="undo-bar">
        <button className="undo-btn" onClick={onUndo} disabled={!canUndo} title="Undo (Ctrl+Z)">
          Undo
        </button>
        <button className="undo-btn" onClick={onRedo} disabled={!canRedo} title="Redo (Ctrl+Shift+Z)">
          Redo
        </button>
        {focusedNodeIds.length > 0 && (
          <button className="focus-chip" onClick={onClearFocus} title="Clear milestone filter">
            {focusLabel} · {focusedNodeIds.length} nodes <span aria-hidden="true">×</span>
          </button>
        )}
      </div>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onSelectionStart={() => {
          onSelect(null);
          onSelectEdge(null);
        }}
        onConnect={onConnect}
        onNodeClick={(e, node) => {
          if (focusedNodeIds.length && !focusedNodeIds.includes(node.id)) onClearFocus();
          onSelect(detailSelectionForClick(node.id, e.ctrlKey));
          onSelectEdge(null);
        }}
        onEdgeClick={(e, edge) => {
          setSelectedNodeIds([]);
          onSelect(null);
          onSelectEdge(edge.id);
        }}
        onEdgeMouseEnter={(e, edge) => setHoverEdge(edge.id)}
        onEdgeMouseLeave={() => setHoverEdge(null)}
        onPaneClick={() => {
          setSelectedNodeIds([]);
          onClearFocus();
          onSelect(null);
          onSelectEdge(null);
        }}
        zoomOnDoubleClick={false}
        selectionKeyCode="Control"
        multiSelectionKeyCode="Control"
        selectionMode={SelectionMode.Partial}
        deleteKeyCode={null}
        fitView
        fitViewOptions={{ padding: 0.2, maxZoom: 1 }}
      >
        <Background color="var(--line)" gap={22} size={1.5} />
        <Controls showInteractive={false} />
      </ReactFlow>
      <div className="canvas-hint">
        drag to pan · Ctrl+drag to select · Ctrl+click to add/remove nodes
      </div>
      {newNode && (
        <div className="overlay" onClick={() => setNewNode(null)} onDoubleClick={(event) => event.stopPropagation()}>
          <form className="modal node-create" onSubmit={createNode} onClick={(event) => event.stopPropagation()}>
            <p className="screen-kicker">NEW ROADMAP NODE</p>
            <h2>Add research work</h2>
            <p className="muted">Name the work first. Detailed notes can be added after the node exists.</p>
            <div className="field">
              <label>Title</label>
              <input autoFocus type="text" value={newNode.title} onChange={(event) => setNewNode({ ...newNode, title: event.target.value })} placeholder="e.g. Reproduce GeoCLIP baseline" />
            </div>
            <div className="field">
              <label>Type</label>
              <select value={newNode.role} onChange={(event) => setNewNode({ ...newNode, role: event.target.value })}>
                <option value="work">Work</option>
                <option value="experiment">Experiment</option>
                <option value="decision">Decision</option>
                <option value="synthesis">Synthesis</option>
                <option value="note">Note / dump</option>
              </select>
            </div>
            {createError && <p className="form-error">Could not create node: {createError}</p>}
            <div className="modal-actions">
              <button type="button" className="btn ghost" onClick={() => setNewNode(null)}>Cancel</button>
              <button className="btn primary" disabled={!newNode.title.trim()}>Create node</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
