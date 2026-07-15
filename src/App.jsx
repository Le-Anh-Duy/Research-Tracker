import { useCallback, useEffect, useRef, useState } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import * as api from './api';
import TopBar from './components/TopBar';
import TimelineBar from './components/TimelineBar';
import Canvas from './components/Canvas';
import Sidebar from './components/Sidebar';
import MergeModal from './components/MergeModal';
import InitWizard from './components/InitWizard';
import HelpView from './components/HelpView';
import CompassView from './components/CompassView';
import ReviewView from './components/ReviewView';
import SettingsView from './components/SettingsView';
import ChangeReviewModal from './components/ChangeReviewModal';
import { buildInitialRoadmap, questionNodeId, reconcileQuestionNodes } from './roadmap';
import { loadPreferences } from './preferences';

export default function App() {
  const [initialized, setInitialized] = useState(null); // null = loading
  const [loadError, setLoadError] = useState('');
  const [graph, setGraph] = useState(null);
  const [context, setContext] = useState({ layer1: '', layer2: '', layer3: '' });
  const [timeline, setTimeline] = useState({ months: [] });
  const [questions, setQuestions] = useState([]);
  const [preferences, setPreferences] = useState(() => loadPreferences(localStorage));
  const [view, setView] = useState('map'); // map | compass | review | settings | help
  const [selectedId, setSelectedId] = useState(null);
  const [nodeFocus, setNodeFocus] = useState(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState(null);
  const [mergingId, setMergingId] = useState(null);
  const [pendingChange, setPendingChange] = useState(null);
  const saveTimer = useRef(null);
  const qTimer = useRef(null);
  const graphRef = useRef(null); // latest graph, for history snapshots
  const serverRevision = useRef(0);
  const graphSaveChain = useRef(Promise.resolve());
  const graphSaveEpoch = useRef(0);
  const graphWriteCount = useRef(0);
  const graphDirty = useRef(false);
  const history = useRef({ past: [], future: [] });
  const deletedFiles = useRef({});
  const lastCk = useRef(0);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.font = preferences.font;
    document.documentElement.dataset.theme = preferences.theme;
    localStorage.setItem('research-navigator-preferences', JSON.stringify(preferences));
  }, [preferences]);

  useEffect(() => {
    Promise.all([api.getGraph(), api.getContext(), api.getTimeline(), api.getQuestions()])
      .then(async ([g, c, t, q]) => {
        setContext(c);
        setTimeline(t);
        setQuestions(q.questions || []);
        if (g.initialized === false) {
          setInitialized(false);
        } else {
          const next = reconcileQuestionNodes(g, q.questions || []);
          const questionNodes = g.nodes.filter((node) => node.data.role === 'research-question');
          const needsReconcile = questionNodes.length !== (q.questions || []).length
            || questionNodes.some((node) => node.data.title !== next.nodes.find((item) => item.id === node.id)?.data.title);
          if (needsReconcile) {
            const existing = new Set(g.nodes.map((node) => node.id));
            await Promise.all((q.questions || []).filter((question) => !existing.has(questionNodeId(question.id))).map((question) =>
              api.putNode(questionNodeId(question.id), `# ${question.id}\n\n${question.text}\n\n## Research notes\n`)
            ));
            const saved = await api.putGraph(next, g.revision);
            next.revision = saved.revision;
          }
          serverRevision.current = next.revision || 0;
          graphRef.current = next;
          setGraph(next);
          setInitialized(true);
        }
      })
      .catch((error) => setLoadError(error.message));
  }, []);

  const syncHistoryFlags = () => {
    setCanUndo(history.current.past.length > 0);
    setCanRedo(history.current.future.length > 0);
  };

  const queueGraphSave = useCallback((next) => {
    const epoch = graphSaveEpoch.current;
    graphDirty.current = true;
    graphWriteCount.current += 1;
    graphSaveChain.current = graphSaveChain.current
      .catch(() => {})
      .then(async () => {
        if (epoch !== graphSaveEpoch.current) return;
        const saved = await api.putGraph(next, serverRevision.current);
        serverRevision.current = saved.revision;
      })
      .catch((error) => {
        if (error.status === 409 && error.data?.graph) {
          graphSaveEpoch.current += 1;
          serverRevision.current = error.data.graph.revision || 0;
          graphRef.current = error.data.graph;
          setGraph(error.data.graph);
          setSelectedId((id) => (error.data.graph.nodes.some((node) => node.id === id) ? id : null));
          setSelectedEdgeId((id) => (error.data.graph.edges.some((edge) => edge.id === id) ? id : null));
          window.alert('The roadmap changed through another writer. The latest version was loaded; please reapply your edit if it is still needed.');
        }
      })
      .finally(() => {
        graphWriteCount.current -= 1;
        if (graphWriteCount.current === 0) graphDirty.current = false;
      });
  }, []);

  // Continuous edits (typing, dragging) debounce the save; discrete actions
  // (delete, merge, connect) pass immediate - a debounced save can be lost if
  // the tab closes inside that window. `checkpoint` records an undo point:
  // immediate ops always do; debounced text edits coalesce within 500ms so a
  // typing burst is a single undo step; drags pass checkpoint:false (layout
  // noise, not worth an undo step). Push the PREVIOUS state, so undo restores it.
  const updateGraph = useCallback((updater, { immediate = false, checkpoint = true } = {}) => {
    setGraph((g) => {
      const next = typeof updater === 'function' ? updater(g) : updater;
      if (checkpoint) {
        const now = Date.now();
        const coalesce = !immediate && now - lastCk.current < 500;
        if (!coalesce) {
          history.current.past.push(g);
          if (history.current.past.length > 60) history.current.past.shift();
          history.current.future = [];
          syncHistoryFlags();
        }
        lastCk.current = now;
      }
      graphRef.current = next;
      clearTimeout(saveTimer.current);
      if (immediate) queueGraphSave(next);
      else saveTimer.current = setTimeout(() => queueGraphSave(next), 1000);
      return next;
    });
  }, [queueGraphSave]);

  const restore = useCallback((from, to) => {
    if (!from.length) return;
    const current = graphRef.current;
    const snapshot = from.pop();
    to.push(current);
    const currentIds = new Set(current.nodes.map((n) => n.id));
    const nextIds = new Set(snapshot.nodes.map((n) => n.id));
    current.nodes.forEach((n) => {
      if (!nextIds.has(n.id)) api.deleteNode(n.id);
    });
    snapshot.nodes.forEach((n) => {
      if (!currentIds.has(n.id)) api.putNode(n.id, deletedFiles.current[n.id] || '');
    });
    graphRef.current = snapshot;
    setGraph(snapshot);
    queueGraphSave(snapshot);
    setSelectedId((sel) => (snapshot.nodes.some((n) => n.id === sel) ? sel : null));
    setSelectedEdgeId((sel) => (snapshot.edges.some((e) => e.id === sel) ? sel : null));
    lastCk.current = 0; // don't coalesce the next edit into the restored step
    syncHistoryFlags();
  }, [queueGraphSave]);

  const undo = useCallback(() => restore(history.current.past, history.current.future), [restore]);
  const redo = useCallback(() => restore(history.current.future, history.current.past), [restore]);

  const deleteEdge = useCallback(
    (edgeId) => {
      updateGraph((g) => ({ ...g, edges: g.edges.filter((e) => e.id !== edgeId) }), { immediate: true });
      setSelectedEdgeId((sel) => (sel === edgeId ? null : sel));
    },
    [updateGraph]
  );

  const updateQuestions = useCallback((updater, immediate = false) => {
    setQuestions((qs) => {
      const next = typeof updater === 'function' ? updater(qs) : updater;
      clearTimeout(qTimer.current);
      if (immediate) api.putQuestions({ questions: next });
      else qTimer.current = setTimeout(() => api.putQuestions({ questions: next }), 1000);
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

  const patchEdgeData = useCallback(
    (id, patch) => {
      updateGraph((g) => ({
        ...g,
        edges: g.edges.map((e) => (e.id === id ? { ...e, data: { ...e.data, ...patch } } : e)),
      }));
    },
    [updateGraph]
  );

  const deleteNode = useCallback(
    async (id) => {
      try {
        deletedFiles.current[id] = (await api.getNode(id)).content;
      } catch {
        deletedFiles.current[id] = '';
      }
      updateGraph(
        (g) => ({
          nodes: g.nodes.filter((n) => n.id !== id),
          edges: g.edges.filter((e) => e.source !== id && e.target !== id),
        }),
        { immediate: true }
      );
      api.deleteNode(id);
      setNodeFocus((focus) => {
        if (!focus?.ids.includes(id)) return focus;
        const ids = focus.ids.filter((nodeId) => nodeId !== id);
        return ids.length ? { ...focus, ids } : null;
      });
      setSelectedId((sel) => (sel === id ? null : sel));
      setSelectedEdgeId(null);
    },
    [updateGraph]
  );

  // Merge closes a branch AND records what it means: which RQ it feeds, whether
  // the finding was positive/negative/neutral, and one line on what it says.
  const confirmMerge = useCallback(
    (id, { title, outcome, rq, finding, contribution }) => {
      updateGraph(
        (g) => ({
          ...g,
          nodes: g.nodes.map((n) =>
            n.id === id
              ? { ...n, data: { ...n.data, title, outcome, status: 'merged', rq, finding, contribution } }
              : n
          ),
          edges: (() => {
            const changed = g.edges.map((e) => (e.source === id ? { ...e, data: { ...e.data, kind: 'merge' } } : e));
            const questionNode = g.nodes.find((node) => node.data.questionId === rq);
            if (!questionNode || changed.some((edge) => edge.source === id && edge.target === questionNode.id)) return changed;
            return [...changed, { id: `e_${id}_${questionNode.id}`, source: id, target: questionNode.id, data: { kind: 'merge' } }];
          })(),
        }),
        { immediate: true }
      );
      setMergingId(null);
    },
    [updateGraph]
  );

  const affectedFor = useCallback((type, key) => {
    const questionNode = graph.nodes.find((node) => node.data.questionId === key);
    const linked = new Set(questionNode ? graph.edges.flatMap((edge) => edge.source === questionNode.id ? [edge.target] : edge.target === questionNode.id ? [edge.source] : []) : []);
    return graph.nodes
      .filter((node) => node.id !== 'n_start' && (
        type === 'topic'
        || (type === 'objective' && node.data.role === 'objective')
        || (type === 'question' && node.data.role !== 'research-question' && (node.data.rq === key || linked.has(node.id)))
      ))
      .map((node) => ({ id: node.id, title: node.data.title }));
  }, [graph]);

  const replaceHeading = (content, title) => content.replace(/^# .*$/m, `# ${title}`);
  const replaceDoneWhen = (content, value) => {
    const line = value ? `**Done when:** ${value}` : '';
    if (/^\*\*Done when:\*\*.*$/m.test(content)) return content.replace(/^\*\*Done when:\*\*.*$/m, line).replace(/\n{3,}/g, '\n\n');
    return line ? content.replace(/^(# .*\n)/, `$1\n${line}\n`) : content;
  };
  const objectiveText = (line) => line.replace(/^O\d+\s*:\s*/, '').trim();

  const saveContextLayer = useCallback((layerNum, value, onCancel) => {
    const type = layerNum === 1 ? 'topic' : 'objective';
    const objectiveNodes = graph.nodes.filter((node) => node.data.role === 'objective').sort((a, b) => a.position.x - b.position.x);
    const nextObjectives = value.split('\n').filter(Boolean).map(objectiveText).filter(Boolean);
    const currentObjectives = context.layer2.split('\n').filter(Boolean).map(objectiveText).filter(Boolean);
    const reordered = nextObjectives.length === currentObjectives.length && nextObjectives.some((text, index) => text !== currentObjectives[index])
      && [...nextObjectives].sort().join('\n') === [...currentObjectives].sort().join('\n');
    const blocked = type === 'objective' && (nextObjectives.length !== objectiveNodes.length || reordered)
      ? 'Adding, removing, or reordering objectives needs a guided migration because it changes RQ and milestone mappings. This text editor only supports wording changes for the existing objectives.'
      : '';
    setPendingChange({ type, title: `Update ${type}`, before: context['layer' + layerNum], after: value, affected: affectedFor(type), blocked, cancel: onCancel, apply: async () => {
      if (type === 'topic') {
        const start = graph.nodes.find((node) => node.id === 'n_start');
        if (start) {
          updateGraph((g) => ({ ...g, nodes: g.nodes.map((node) => node.id === 'n_start' ? { ...node, data: { ...node.data, title: value.slice(0, 90) } } : node) }), { immediate: true });
          const note = await api.getNode('n_start');
          await api.putNode('n_start', replaceHeading(note.content, value));
        }
      } else {
        updateGraph((g) => ({ ...g, nodes: g.nodes.map((node) => {
          const index = objectiveNodes.findIndex((objective) => objective.id === node.id);
          return index < 0 ? node : { ...node, data: { ...node.data, title: `O${index + 1}: ${nextObjectives[index].slice(0, 70)}` } };
        }) }), { immediate: true });
        await Promise.all(objectiveNodes.map(async (node, index) => {
          const note = await api.getNode(node.id);
          return api.putNode(node.id, replaceHeading(note.content, `O${index + 1}: ${nextObjectives[index]}`));
        }));
      }
      await api.putContext(layerNum, value);
      setContext((c) => ({ ...c, ['layer' + layerNum]: value }));
    }});
  }, [context, affectedFor, graph, updateGraph]);

  const saveQuestions = useCallback(async (next) => {
    const existing = new Set(graphRef.current.nodes.map((node) => node.id));
    await Promise.all(next.filter((question) => !existing.has(questionNodeId(question.id))).map((question) =>
      api.putNode(questionNodeId(question.id), `# ${question.id}\n\n${question.text}\n\n## Research notes\n`)
    ));
    updateGraph((current) => reconcileQuestionNodes(current, next), { immediate: true });
    updateQuestions(next, true);
    setContext((c) => ({ ...c, layer3: next.map((q, i) => `RQ${i + 1}${q.obj >= 0 ? ` (O${q.obj + 1})` : ''}: ${q.text}`).join('\n') }));
  }, [updateGraph, updateQuestions]);

  const requestQuestionChange = useCallback((question, value, onCancel) => {
    setPendingChange({ type: 'question', title: `Update ${question.id}`, before: question.text, after: value, affected: affectedFor('question', question.id), cancel: onCancel, apply: () => {
      const next = questions.map((q) => q.id === question.id ? { ...q, text: value } : q);
      return saveQuestions(next);
    }});
  }, [affectedFor, questions, saveQuestions]);

  const requestQuestionObjectiveChange = useCallback((question, obj) => {
    if (obj === question.obj) return;
    setPendingChange({ type: 'question mapping', title: `Map ${question.id} to ${obj < 0 ? 'general' : `O${obj + 1}`}`, before: question.obj < 0 ? 'general' : `O${question.obj + 1}`, after: obj < 0 ? 'general' : `O${obj + 1}`, affected: affectedFor('question', question.id), apply: () => saveQuestions(questions.map((q) => q.id === question.id ? { ...q, obj } : q)) });
  }, [affectedFor, questions, saveQuestions]);

  const requestQuestionAdd = useCallback((text, obj, onCancel) => {
    const maxId = questions.reduce((max, question) => Math.max(max, Number(question.id.replace(/^RQ/, '')) || 0), 0);
    const nextQuestion = { id: `RQ${maxId + 1}`, text, obj, status: 'open', answer: '' };
    setPendingChange({ type: 'question', title: `Add ${nextQuestion.id}`, before: '', after: text, affected: [], cancel: onCancel, apply: async () => { await saveQuestions([...questions, nextQuestion]); onCancel?.(); } });
  }, [questions, saveQuestions]);

  const requestQuestionDelete = useCallback((question) => {
    const affected = affectedFor('question', question.id);
    setPendingChange({ type: 'question', title: `Delete ${question.id}`, before: question.text, after: '', affected, blocked: affected.length ? 'Reassign or unlink the listed evidence nodes before deleting this research question.' : '', apply: () => saveQuestions(questions.filter((q) => q.id !== question.id)) });
  }, [affectedFor, questions, saveQuestions]);

  const saveObjectiveDetails = useCallback(async (id, { title, exitCriteria, met }) => {
    const objectives = graphRef.current.nodes.filter((node) => node.data.role === 'objective').sort((a, b) => a.position.x - b.position.x);
    const index = objectives.findIndex((node) => node.id === id);
    if (index < 0) throw new Error('objective not found');
    const cleanTitle = title.trim();
    const lines = context.layer2.split('\n').filter(Boolean);
    lines[index] = `O${index + 1}: ${cleanTitle}`;
    const note = await api.getNode(id);
    await Promise.all([
      api.putNode(id, replaceDoneWhen(replaceHeading(note.content, lines[index]), exitCriteria.trim())),
      api.putContext(2, lines.join('\n')),
    ]);
    updateGraph((current) => ({ ...current, nodes: current.nodes.map((node) => node.id === id
      ? { ...node, data: { ...node.data, title: lines[index].slice(0, 90), exitCriteria: exitCriteria.trim(), met } }
      : node) }), { immediate: true });
    setContext((current) => ({ ...current, layer2: lines.join('\n') }));
  }, [context.layer2, updateGraph]);

  const addObjective = useCallback(async ({ title, exitCriteria }) => {
    const objectives = graphRef.current.nodes.filter((node) => node.data.role === 'objective').sort((a, b) => a.position.x - b.position.x);
    const number = objectives.reduce((max, node) => Math.max(max, Number(node.id.match(/^n_o(\d+)$/)?.[1]) || 0), 0) + 1;
    const id = `n_o${number}`;
    const label = `O${objectives.length + 1}: ${title.trim()}`;
    const lines = [...context.layer2.split('\n').filter(Boolean), label];
    const x = objectives.length ? Math.max(...objectives.map((node) => node.position.x)) + 300 : 80;
    const done = exitCriteria.trim();
    await Promise.all([
      api.putNode(id, `# ${label}\n${done ? `\n**Done when:** ${done}\n` : ''}`),
      api.putContext(2, lines.join('\n')),
    ]);
    updateGraph((current) => ({ ...current, nodes: [...current.nodes, {
      id,
      position: { x, y: 210 },
      data: { title: label.slice(0, 90), status: 'active', outcome: '', anchor: true, role: 'objective', exitCriteria: done, met: false },
    }] }), { immediate: true });
    setContext((current) => ({ ...current, layer2: lines.join('\n') }));
  }, [context.layer2, updateGraph]);

  const applyChange = useCallback(() => {
    if (!pendingChange) return;
    const change = pendingChange;
    Promise.resolve(change.apply())
      .then(() => api.createChangeReport({ type: change.type, title: change.title, before: change.before, after: change.after, affected: change.affected }))
      .then(() => setPendingChange(null))
      .catch((error) => window.alert(`Could not apply change: ${error.message}`));
  }, [pendingChange]);

  const closeChangeReview = useCallback(() => {
    pendingChange?.cancel?.();
    setPendingChange(null);
  }, [pendingChange]);

  const jumpToNode = useCallback((nodeId) => {
    setView('map');
    setNodeFocus(null);
    setSelectedId(nodeId);
    setSelectedEdgeId(null);
  }, []);

  const focusMilestone = useCallback((milestone) => {
    if (nodeFocus?.milestoneId === milestone.id) {
      setNodeFocus(null);
      setSelectedId(null);
      return;
    }
    const ids = milestone.nodeIds.filter((id) => graphRef.current?.nodes.some((node) => node.id === id));
    setNodeFocus(ids.length ? { milestoneId: milestone.id, label: milestone.title, ids } : null);
    setSelectedId(ids[0] || null);
    setSelectedEdgeId(null);
  }, [nodeFocus]);

  // Wizard output -> context + node files + graph + timeline + questions, then enter the app.
  const handleInitDone = useCallback(
    async (input) => {
      const { context: newContext, graph: newGraph, files, timeline: newTimeline, questions: newQuestions } = buildInitialRoadmap(input);

      await Promise.all([
        api.putContext(1, newContext.layer1),
        api.putContext(2, newContext.layer2),
        api.putTimeline(newTimeline),
        api.putQuestions({ questions: newQuestions }), // also writes layer3 file server-side
        ...Object.entries(files).map(([id, content]) => api.putNode(id, content)),
      ]);
      const saved = await api.putGraph(newGraph);
      newGraph.revision = saved.revision;
      serverRevision.current = saved.revision;
      setContext(newContext);
      setTimeline(newTimeline);
      setQuestions(newQuestions);
      graphRef.current = newGraph;
      history.current = { past: [], future: [] };
      setCanUndo(false);
      setCanRedo(false);
      setGraph(newGraph);
      setInitialized(true);
    },
    []
  );

  // Agent actions write the same local graph. Refresh when the server revision
  // changes, but never replace an edit that this browser still needs to save.
  useEffect(() => {
    if (!initialized) return undefined;
    const timer = setInterval(() => {
      if (graphDirty.current) return;
      api.researchState().then((state) => {
        if (graphDirty.current || state.graph.revision === serverRevision.current) return;
        serverRevision.current = state.graph.revision || 0;
        graphRef.current = state.graph;
        setGraph(state.graph);
        setSelectedId((id) => (state.graph.nodes.some((node) => node.id === id) ? id : null));
        setSelectedEdgeId((id) => (state.graph.edges.some((edge) => edge.id === id) ? id : null));
      }).catch(() => {});
    }, 1500);
    return () => clearInterval(timer);
  }, [initialized]);

  // Undo/redo on the graph. Skipped while typing in a field (native undo wins
  // there) and while outside the Map (nothing spatial to undo).
  useEffect(() => {
    const onKey = (e) => {
      if (view !== 'map') return;
      const t = e.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable))
        return;
      const key = e.key.toLowerCase();
      if (selectedEdgeId && (key === 'delete' || key === 'backspace')) {
        e.preventDefault();
        deleteEdge(selectedEdgeId);
      } else if (!(e.ctrlKey || e.metaKey)) {
        return;
      } else if (key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if ((key === 'z' && e.shiftKey) || key === 'y') {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [view, undo, redo, selectedEdgeId, deleteEdge]);

  if (loadError) return <div className="load-error"><h1>Could not open the roadmap</h1><p>{loadError}</p><button className="btn primary" onClick={() => window.location.reload()}>Retry</button></div>;
  if (initialized === null) return <div className="loading">Loading...</div>;
  if (!initialized) return <InitWizard onDone={handleInitDone} />;

  const displayNode = (node) => {
    if (!node?.data.questionId) return node;
    const question = questions.find((item) => item.id === node.data.questionId);
    return question ? { ...node, data: { ...node.data, title: `${question.id}: ${question.text}` } } : node;
  };
  const selectedNode = displayNode(graph.nodes.find((n) => n.id === selectedId));
  const mergingNode = graph.nodes.find((n) => n.id === mergingId);
  const nodesById = Object.fromEntries(graph.nodes.map((n) => [n.id, displayNode(n)]));
  const milestoneNodeIds = new Set(
    timeline.months.flatMap((month) => month.milestones.flatMap((milestone) => milestone.nodeIds || []))
  );
  const saveTimeline = async (months) => {
    try {
      const next = { months };
      await api.putTimeline(next);
      setTimeline(next);
      if (nodeFocus) {
        const milestone = months.flatMap((month) => month.milestones).find((item) => item.id === nodeFocus.milestoneId);
        const ids = milestone?.nodeIds.filter((id) => nodesById[id]) || [];
        setNodeFocus(milestone && ids.length ? { milestoneId: milestone.id, label: milestone.title, ids } : null);
      }
      return true;
    } catch (error) {
      window.alert(`Could not save timeline: ${error.message}`);
      return false;
    }
  };

  return (
    <div className="app">
      <TopBar
        context={context}
        view={view}
        onSetView={setView}
        onOpenCompass={() => setView('compass')}
        onOpenReview={() => setView('review')}
        onOpenSettings={() => setView('settings')}
        onOpenHelp={() => setView('help')}
      />
      {view === 'map' && (
        <div className="main">
          <TimelineBar months={timeline.months} nodesById={nodesById} activeMilestoneId={nodeFocus?.milestoneId} onFocus={focusMilestone} onChange={saveTimeline} />
            <ReactFlowProvider>
              <Canvas
                graph={graph}
                questions={questions}
                milestoneNodeIds={milestoneNodeIds}
                updateGraph={updateGraph}
                deleteEdge={deleteEdge}
                selectedId={selectedId}
                selectedEdgeId={selectedEdgeId}
                focusedNodeIds={nodeFocus?.ids || []}
                focusLabel={nodeFocus?.label || ''}
                onSelect={setSelectedId}
                onSelectEdge={setSelectedEdgeId}
                onClearFocus={() => setNodeFocus(null)}
                onUndo={undo}
                onRedo={redo}
                canUndo={canUndo}
                canRedo={canRedo}
              />
            </ReactFlowProvider>
            {selectedNode && (
              <Sidebar
                key={selectedNode.id}
                node={selectedNode}
                questions={questions}
                onPatch={(patch) => patchNodeData(selectedNode.id, patch)}
                onMerge={() => setMergingId(selectedNode.id)}
                onDelete={() => deleteNode(selectedNode.id)}
                onClose={() => setSelectedId(null)}
              />
            )}
            {!selectedNode && selectedEdgeId && (
              <Sidebar
                key={selectedEdgeId}
                edge={graph.edges.find((e) => e.id === selectedEdgeId)}
                nodesById={nodesById}
                onPatchEdge={(patch) => patchEdgeData(selectedEdgeId, patch)}
                onDeleteEdge={() => deleteEdge(selectedEdgeId)}
                onClose={() => setSelectedEdgeId(null)}
              />
            )}
        </div>
      )}
      {view === 'compass' && (
        <CompassView
          context={context}
          objectiveNodes={graph.nodes.filter((n) => n.data.role === 'objective').sort((a, b) => a.position.x - b.position.x)}
          questions={questions}
          nodes={graph.nodes}
          onSaveTopic={(value) => saveContextLayer(1, value)}
          onSaveObjective={saveObjectiveDetails}
          onAddObjective={addObjective}
          onRequestQuestionChange={requestQuestionChange}
          onRequestQuestionObjectiveChange={requestQuestionObjectiveChange}
          onRequestQuestionAdd={requestQuestionAdd}
          onRequestQuestionDelete={requestQuestionDelete}
          onUpdateQuestions={updateQuestions}
          onJumpToNode={jumpToNode}
        />
      )}
      {view === 'review' && (
        <ReviewView
          nodes={graph.nodes}
          questions={questions}
          timeline={timeline}
          onJumpToNode={jumpToNode}
          onOpenCompass={() => setView('compass')}
        />
      )}
      {view === 'settings' && <SettingsView preferences={preferences} onChange={setPreferences} />}
      {view === 'help' && <HelpView onBack={() => setView('map')} />}
      {pendingChange && <ChangeReviewModal change={pendingChange} onApply={applyChange} onClose={closeChangeReview} />}
      {mergingNode && (
        <MergeModal
          node={mergingNode}
          questions={questions}
          onConfirm={(payload) => confirmMerge(mergingNode.id, payload)}
          onClose={() => setMergingId(null)}
        />
      )}
    </div>
  );
}
