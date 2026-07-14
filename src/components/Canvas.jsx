import { useCallback } from 'react';
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

export default function Canvas({ graph, updateGraph, selectedId, onSelect }) {
  const { screenToFlowPosition } = useReactFlow();

  const nodes = graph.nodes.map((n) => ({
    ...n,
    type: 'research',
    data: { ...n.data, isSelected: n.id === selectedId },
  }));

  const edges = graph.edges.map((e) => {
    const merged = e.data?.kind === 'merge';
    const color = merged ? MERGE_COLOR : STEP_COLOR;
    return {
      ...e,
      style: { stroke: color, strokeWidth: 1.5, strokeDasharray: merged ? '6 4' : undefined },
      markerEnd: { type: MarkerType.ArrowClosed, color },
    };
  });

  const onNodesChange = useCallback(
    (changes) => {
      const real = changes.filter((c) => c.type !== 'select');
      if (real.length) {
        updateGraph((g) => ({ ...g, nodes: applyNodeChanges(real, g.nodes) }));
      }
    },
    [updateGraph]
  );

  const onEdgesChange = useCallback(
    (changes) => {
      const real = changes.filter((c) => c.type !== 'select');
      if (real.length) {
        updateGraph((g) => ({ ...g, edges: applyEdgeChanges(real, g.edges) }));
      }
    },
    [updateGraph]
  );

  const onConnect = useCallback(
    (params) => {
      updateGraph((g) => ({ ...g, edges: addEdge({ ...params, data: { kind: 'step' } }, g.edges) }));
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
      updateGraph((g) => ({
        ...g,
        nodes: [...g.nodes, { id, position, data: { title: 'untitled', status: 'active', outcome: '' } }],
      }));
      onSelect(id);
    },
    [screenToFlowPosition, updateGraph, onSelect]
  );

  return (
    <div className="canvas-wrap" onDoubleClick={onDoubleClick}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={(e, node) => onSelect(node.id)}
        onPaneClick={() => onSelect(null)}
        zoomOnDoubleClick={false}
        deleteKeyCode={['Backspace', 'Delete']}
        fitView
        fitViewOptions={{ padding: 0.2, maxZoom: 1 }}
      >
        <Background color="#c9c3b4" gap={22} size={1.5} />
        <Controls showInteractive={false} />
      </ReactFlow>
      <div className="canvas-hint">double-click canvas: new node · drag between handles: connect · click node: open log</div>
    </div>
  );
}
