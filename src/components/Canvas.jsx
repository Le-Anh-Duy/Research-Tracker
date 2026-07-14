import { useCallback, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MarkerType,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import * as api from '../api';
import ResearchNode from './ResearchNode';

const nodeTypes = { research: ResearchNode };
const STEP_COLOR = '#b9b2a3';
const MERGE_COLOR = '#d97757';

export default function Canvas({
  graph,
  milestoneNodeIds,
  updateGraph,
  deleteEdge,
  selectedId,
  selectedEdgeId,
  onSelect,
  onSelectEdge,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}) {
  const { screenToFlowPosition } = useReactFlow();
  const [hoverEdge, setHoverEdge] = useState(null);

  const nodes = graph.nodes.map((n) => ({
    ...n,
    type: 'research',
    data: {
      ...n.data,
      isSelected: n.id === selectedId,
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
    const color = selected ? '#1f1e1d' : hovered ? '#b3452e' : merged ? MERGE_COLOR : STEP_COLOR;
    return {
      ...e,
      style: {
        stroke: color,
        strokeWidth: selected || hovered ? 2.5 : 1.5,
        strokeDasharray: merged ? '6 4' : undefined,
        cursor: 'pointer',
      },
      markerEnd: { type: MarkerType.ArrowClosed, color },
    };
  });

  // Node position/dimension changes are layout noise - save but don't checkpoint.
  const onNodesChange = useCallback(
    (changes) => {
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
      const id = 'n_' + Date.now();
      api.putNode(id, '');
      updateGraph(
        (g) => ({
          ...g,
          nodes: [...g.nodes, { id, position, data: { title: 'untitled', status: 'active', outcome: '' } }],
        }),
        { immediate: true }
      );
      onSelect(id);
    },
    [screenToFlowPosition, updateGraph, onSelect]
  );

  return (
    <div className="canvas-wrap" onDoubleClick={onDoubleClick}>
      <div className="undo-bar">
        <button className="undo-btn" onClick={onUndo} disabled={!canUndo} title="Undo (Ctrl+Z)">
          Undo
        </button>
        <button className="undo-btn" onClick={onRedo} disabled={!canRedo} title="Redo (Ctrl+Shift+Z)">
          Redo
        </button>
      </div>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={(e, node) => {
          onSelect(node.id);
          onSelectEdge(null);
        }}
        onEdgeClick={(e, edge) => {
          onSelect(null);
          onSelectEdge(edge.id);
        }}
        onEdgeMouseEnter={(e, edge) => setHoverEdge(edge.id)}
        onEdgeMouseLeave={() => setHoverEdge(null)}
        onPaneClick={() => {
          onSelect(null);
          onSelectEdge(null);
        }}
        zoomOnDoubleClick={false}
        deleteKeyCode={null}
        fitView
        fitViewOptions={{ padding: 0.2, maxZoom: 1 }}
      >
        <Background color="#c9c3b4" gap={22} size={1.5} />
        <Controls showInteractive={false} />
      </ReactFlow>
      <div className="canvas-hint">
        double-click: new node | drag handles: connect | click a link to inspect it | Ctrl+Z to undo
      </div>
    </div>
  );
}
