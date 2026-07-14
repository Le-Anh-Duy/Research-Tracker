import { useCallback, useEffect, useRef, useState } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import * as api from './api';
import TopBar from './components/TopBar';
import Canvas from './components/Canvas';
import Sidebar from './components/Sidebar';
import MergeModal from './components/MergeModal';
import InitWizard from './components/InitWizard';

export default function App() {
  const [initialized, setInitialized] = useState(null); // null = loading
  const [graph, setGraph] = useState(null);
  const [context, setContext] = useState({ layer1: '', layer2: '', layer3: '' });
  const [selectedId, setSelectedId] = useState(null);
  const [mergingId, setMergingId] = useState(null);
  const saveTimer = useRef(null);

  useEffect(() => {
    Promise.all([api.getGraph(), api.getContext()]).then(([g, c]) => {
      setContext(c);
      if (g.initialized === false) {
        setInitialized(false);
      } else {
        setGraph(g);
        setInitialized(true);
      }
    });
  }, []);

  const updateGraph = useCallback((updater) => {
    setGraph((g) => {
      const next = typeof updater === 'function' ? updater(g) : updater;
      clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => api.putGraph(next), 1000);
      return next;
    });
  }, []);

  const patchNodeData = useCallback(
    (id, patch) => {
      updateGraph((g) => ({
        ...g,
        nodes: g.nodes.map((n) => (n.id === id ? { ...n, data: { ...n.data, ...patch } } : n)),
      }));
    },
    [updateGraph]
  );

  const confirmMerge = useCallback(
    (id, title, outcome) => {
      updateGraph((g) => ({
        ...g,
        nodes: g.nodes.map((n) =>
          n.id === id ? { ...n, data: { ...n.data, title, outcome, status: 'merged' } } : n
        ),
        edges: g.edges.map((e) =>
          e.source === id ? { ...e, data: { ...e.data, kind: 'merge' } } : e
        ),
      }));
      setMergingId(null);
    },
    [updateGraph]
  );

  const saveContextLayer = useCallback((layerNum, value) => {
    api.putContext(layerNum, value);
    setContext((c) => ({ ...c, ['layer' + layerNum]: value }));
  }, []);

  // Wizard output -> context files + node .md files + graph, then enter the app.
  const handleInitDone = useCallback(async ({ topic, objectives, questions, firstTasks }) => {
    const layer2 = objectives.map((o, i) => `O${i + 1}: ${o}`).join('\n');
    const layer3 = questions
      .map((q, i) => `RQ${i + 1}${q.obj >= 0 ? ` (O${q.obj + 1})` : ''}: ${q.text}`)
      .join('\n');

    const nodes = [];
    const edges = [];
    const files = {};
    const COL = 300;
    const startId = 'n_start';
    const centerX = 80 + ((objectives.length - 1) * COL) / 2;

    nodes.push({
      id: startId,
      position: { x: centerX, y: 40 },
      data: { title: topic.slice(0, 90), status: 'active', outcome: '', anchor: true },
    });
    files[startId] = `# ${topic}\n\n## Research questions\n${layer3}\n`;

    objectives.forEach((obj, i) => {
      const oid = `n_o${i + 1}`;
      const rqs = questions
        .filter((q) => q.obj === i)
        .map((q) => `- ${q.text}`)
        .join('\n');
      nodes.push({
        id: oid,
        position: { x: 80 + i * COL, y: 210 },
        data: { title: `O${i + 1}: ${obj.slice(0, 70)}`, status: 'active', outcome: '', anchor: true },
      });
      files[oid] = `# O${i + 1}: ${obj}\n${rqs ? `\n## Questions\n${rqs}\n` : ''}`;
      edges.push({ id: `e_start_o${i + 1}`, source: startId, target: oid, data: { kind: 'step' } });

      const task = (firstTasks[i] || '').trim();
      if (task) {
        const tid = `n_o${i + 1}_t1`;
        nodes.push({
          id: tid,
          position: { x: 80 + i * COL, y: 390 },
          data: { title: task.slice(0, 90), status: 'active', outcome: '' },
        });
        files[tid] = `# ${task}\n\n- [ ] ${task}\n`;
        edges.push({ id: `e_o${i + 1}_t1`, source: oid, target: tid, data: { kind: 'step' } });
      }
    });

    const newGraph = { nodes, edges };
    await Promise.all([
      api.putContext(1, topic),
      api.putContext(2, layer2),
      api.putContext(3, layer3),
      ...Object.entries(files).map(([id, content]) => api.putNode(id, content)),
    ]);
    await api.putGraph(newGraph);
    setContext({ layer1: topic, layer2, layer3 });
    setGraph(newGraph);
    setInitialized(true);
  }, []);

  if (initialized === null) return <div className="loading">Loading…</div>;
  if (!initialized) return <InitWizard onDone={handleInitDone} />;

  const selectedNode = graph.nodes.find((n) => n.id === selectedId);
  const mergingNode = graph.nodes.find((n) => n.id === mergingId);

  return (
    <div className="app">
      <TopBar context={context} onSave={saveContextLayer} />
      <div className="main">
        <ReactFlowProvider>
          <Canvas graph={graph} updateGraph={updateGraph} selectedId={selectedId} onSelect={setSelectedId} />
        </ReactFlowProvider>
        {selectedNode && (
          <Sidebar
            key={selectedNode.id}
            node={selectedNode}
            onPatch={(patch) => patchNodeData(selectedNode.id, patch)}
            onMerge={() => setMergingId(selectedNode.id)}
            onClose={() => setSelectedId(null)}
          />
        )}
      </div>
      {mergingNode && (
        <MergeModal
          node={mergingNode}
          onConfirm={(title, outcome) => confirmMerge(mergingNode.id, title, outcome)}
          onClose={() => setMergingId(null)}
        />
      )}
    </div>
  );
}
