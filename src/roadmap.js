const questionPosition = (questions, index) => {
  const question = questions[index];
  const lane = question.obj >= 0 ? question.obj : index;
  const offset = questions.slice(0, index).filter((item) => item.obj === question.obj).length;
  return { x: 80 + lane * 300 + offset * 36, y: 570 + offset * 120 };
};

export function buildInitialRoadmap({ topic, objectives, questions, firstTasks, exitCriteria, months, connectInitialNodes }) {
  const layer2 = objectives.map((objective, index) => `O${index + 1}: ${objective}`).join('\n');
  const layer3 = questions
    .map((question, index) => `RQ${index + 1}${question.obj >= 0 ? ` (O${question.obj + 1})` : ''}: ${question.text}`)
    .join('\n');
  const nodes = [];
  const edges = [];
  const files = {};
  const startId = 'n_start';
  const columnWidth = 300;

  nodes.push({
    id: startId,
    position: { x: 80 + ((objectives.length - 1) * columnWidth) / 2, y: 40 },
    data: { title: topic.slice(0, 90), status: 'active', outcome: '', anchor: true, role: 'project' },
  });
  files[startId] = `# ${topic}\n\n## Research questions\n${layer3}\n`;

  objectives.forEach((objective, index) => {
    const objectiveId = `n_o${index + 1}`;
    const questionList = questions.filter((question) => question.obj === index).map((question) => `- ${question.text}`).join('\n');
    const exit = (exitCriteria[index] || '').trim();
    nodes.push({
      id: objectiveId,
      position: { x: 80 + index * columnWidth, y: 210 },
      data: { title: `O${index + 1}: ${objective.slice(0, 70)}`, status: 'active', outcome: '', anchor: true, role: 'objective', exitCriteria: exit, met: false },
    });
    files[objectiveId] = `# O${index + 1}: ${objective}\n${exit ? `\n**Done when:** ${exit}\n` : ''}${questionList ? `\n## Questions\n${questionList}\n` : ''}`;
    if (connectInitialNodes) edges.push({ id: `e_start_o${index + 1}`, source: startId, target: objectiveId, data: { kind: 'step' } });

    const task = (firstTasks[index] || '').trim();
    if (!task) return;
    const taskId = `n_o${index + 1}_t1`;
    nodes.push({ id: taskId, position: { x: 80 + index * columnWidth, y: 390 }, data: { title: task.slice(0, 90), status: 'active', outcome: '', role: 'work' } });
    files[taskId] = `# ${task}\n\n- [ ] ${task}\n`;
    if (connectInitialNodes) edges.push({ id: `e_o${index + 1}_t1`, source: objectiveId, target: taskId, data: { kind: 'step' } });
  });

  questions.forEach((question, index) => {
    const id = `RQ${index + 1}`;
    const nodeId = questionNodeId(id);
    nodes.push({
      id: nodeId,
      position: questionPosition(questions, index),
      data: { title: `${id}: ${question.text}`, status: 'active', outcome: '', anchor: true, role: 'research-question', questionId: id },
    });
    files[nodeId] = `# ${id}\n\n${question.text}\n\n## Research notes\n`;
    if (connectInitialNodes) {
      const source = question.obj >= 0 ? `n_o${question.obj + 1}` : startId;
      edges.push({ id: `e_${source}_${nodeId}`, source, target: nodeId, data: { kind: 'step' } });
    }
  });

  return {
    context: { layer1: topic, layer2, layer3 },
    graph: { nodes, edges },
    files,
    timeline: { months: (months || []).map((month, monthIndex) => ({
      id: `m_${monthIndex + 1}`,
      title: month.title,
      milestones: month.milestones.map((milestone, milestoneIndex) => ({
        id: `m_${monthIndex + 1}_ms_${milestoneIndex + 1}`,
        title: milestone.text,
        obj: milestone.obj,
        nodeIds: [],
      })),
    })) },
    questions: questions.map((question, index) => ({ id: `RQ${index + 1}`, text: question.text, obj: question.obj, status: 'open', answer: '' })),
  };
}

export const questionNodeId = (questionId) => `rq_${questionId.toLowerCase()}`;

export function reconcileQuestionNodes(graph, questions) {
  const wanted = new Map(questions.map((question) => [questionNodeId(question.id), question]));
  const existing = new Set(graph.nodes.map((node) => node.id));
  const nodes = graph.nodes
    .filter((node) => node.data.role !== 'research-question' || wanted.has(node.id))
    .map((node) => {
      const question = wanted.get(node.id);
      return question ? { ...node, data: { ...node.data, title: `${question.id}: ${question.text}`, questionId: question.id } } : node;
    });
  questions.forEach((question, index) => {
    const id = questionNodeId(question.id);
    if (existing.has(id)) return;
    nodes.push({
      id,
      position: questionPosition(questions, index),
      data: { title: `${question.id}: ${question.text}`, status: 'active', outcome: '', anchor: true, role: 'research-question', questionId: question.id },
    });
  });
  const nodeIds = new Set(nodes.map((node) => node.id));
  return { ...graph, nodes, edges: graph.edges.filter((edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target)) };
}

export const isEvidenceFor = (node, questionId) => node.data.status === 'merged' && node.data.rq === questionId;
export const focusState = (nodeId, focusedIds) => !focusedIds.length ? '' : focusedIds.includes(nodeId) ? 'focused' : 'dimmed';
