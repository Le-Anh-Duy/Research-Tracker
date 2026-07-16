import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { graphError, questionsError, teamError, timelineError } from './contracts.js';
import { evidenceForQuestion, objectiveProgress, priorityTasks } from './research-domain.js';
import { edgeMetadata, formatResearchDoc, linkedId, parseResearchDoc } from './research-doc.js';
import { connectNodes, createNode, patchNode, setObjectiveMet, transitionNode } from './research-actions.js';

const read = (file, fallback = '') => fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : fallback;
const json = (file, fallback) => JSON.parse(read(file, JSON.stringify(fallback)));
const writeJson = (file, value) => fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n');
const layoutOf = (graph) => ({ nodes: graph.nodes.map(({ id, position }) => ({ id, position })), revision: graph.revision || 0 });
const questionNodeId = (id) => `rq_${id.toLowerCase()}`;

const nodeBody = (role, title) => {
  if (role === 'experiment') return `# ${title}\n\n## Question\n\n## Plan\n\n## Runs\n\n## Interpretation\n\n## Next decision\n`;
  if (role === 'synthesis') return `# ${title}\n\n## Evidence considered\n\n## Synthesis\n\n## Caveats and gaps\n`;
  if (role === 'decision') return `# ${title}\n\n## Decision\n\n## Alternatives\n\n## Rationale\n`;
  return `# ${title}\n\n## Notes\n`;
};

export function buildProject(input) {
  const topic = String(input?.topic || '').trim();
  const objectiveTexts = (input?.objectives || []).map((value) => String(value).trim()).filter(Boolean);
  if (!topic || !objectiveTexts.length) throw new Error('topic and at least one objective are required');

  const nodes = [{
    id: 'project',
    position: { x: 360, y: 40 },
    data: { title: topic.slice(0, 180), role: 'project', status: 'active', anchor: true, outcome: '' },
  }];
  const edges = [];
  const documents = { project: nodeBody('project', topic) };
  const edgeBodies = {};
  const firstAspects = input.firstAspects || input.firstTasks || [];
  const exitCriteria = input.exitCriteria || [];

  objectiveTexts.forEach((title, index) => {
    const number = index + 1;
    const objectiveId = `o${number}`;
    const objectiveTitle = `O${number}: ${title}`;
    nodes.push({
      id: objectiveId,
      position: { x: 80 + index * 320, y: 230 },
      data: {
        title: objectiveTitle.slice(0, 180),
        role: 'objective',
        objectiveKind: input.objectiveKinds?.[index] === 'enabling' ? 'enabling' : 'research',
        status: 'active',
        anchor: true,
        met: false,
        exitCriteria: String(exitCriteria[index] || '').trim(),
        outcome: '',
      },
    });
    documents[objectiveId] = nodeBody('objective', objectiveTitle);
    if (input.connectInitialNodes !== false) {
      const id = `e_project_${objectiveId}`;
      edges.push({ id, source: 'project', target: objectiveId, data: { kind: 'step' } });
      edgeBodies[id] = 'This objective advances the project.';
    }

    const aspectTitle = String(firstAspects[index] || '').trim();
    if (!aspectTitle) return;
    const aspectId = `${objectiveId}_a1`;
    const synthesisId = `${aspectId}_synthesis`;
    nodes.push({
      id: aspectId,
      position: { x: 80 + index * 320, y: 430 },
      data: { title: aspectTitle.slice(0, 180), role: 'aspect', objectiveId, status: 'active', outcome: '' },
    }, {
      id: synthesisId,
      position: { x: 80 + index * 320, y: 630 },
      data: { title: `Synthesize: ${aspectTitle}`.slice(0, 180), role: 'synthesis', homeAspect: aspectId, status: 'active', outcome: '' },
    });
    documents[aspectId] = nodeBody('aspect', aspectTitle);
    documents[synthesisId] = nodeBody('synthesis', `Synthesize: ${aspectTitle}`);
    if (input.connectInitialNodes !== false) {
      const stepId = `e_${objectiveId}_${aspectId}`;
      const synthesisStepId = `e_${aspectId}_${synthesisId}`;
      const resolvesId = `e_${synthesisId}_resolves_${aspectId}`;
      edges.push(
        { id: stepId, source: objectiveId, target: aspectId, data: { kind: 'step' } },
        { id: synthesisStepId, source: aspectId, target: synthesisId, data: { kind: 'step' } },
        { id: resolvesId, source: synthesisId, target: aspectId, data: { kind: 'resolves' } },
      );
      edgeBodies[stepId] = 'This aspect is part of the objective.';
      edgeBodies[synthesisStepId] = 'The aspect closes through this synthesis.';
      edgeBodies[resolvesId] = 'Merging this synthesis resolves the aspect.';
    }
  });

  const questions = (input.questions || []).filter((question) => String(question.text || '').trim()).map((question, index) => {
    const id = `RQ${index + 1}`;
    const objectiveIds = Array.isArray(question.objectiveIds)
      ? question.objectiveIds
      : Number.isInteger(question.obj) && question.obj >= 0 ? [`o${question.obj + 1}`] : [];
    const text = String(question.text).trim();
    const nodeId = questionNodeId(id);
    nodes.push({
      id: nodeId,
      position: { x: 80 + index * 320, y: 850 },
      data: { title: `${id}: ${text}`.slice(0, 180), role: 'research-question', questionId: id, status: 'active', anchor: true, outcome: '' },
    });
    documents[nodeId] = `# ${id}\n\n${text}\n\n## Research notes\n`;
    return { id, text, objectiveIds, status: 'open', answer: '' };
  });

  const timeline = { months: (input.months || []).map((month, monthIndex) => ({
    id: `m${monthIndex + 1}`,
    title: String(month.title || '').trim(),
    current: month.current === true,
    milestones: (month.milestones || []).filter((milestone) => String(milestone.text || milestone.title || '').trim()).map((milestone, milestoneIndex) => ({
      id: `m${monthIndex + 1}_ms${milestoneIndex + 1}`,
      title: String(milestone.text || milestone.title).trim(),
      ...(milestone.deadline ? { deadline: milestone.deadline } : {}),
      ...(Number.isInteger(milestone.obj) && milestone.obj >= 0 ? { objectiveId: `o${milestone.obj + 1}` } : {}),
      nodeIds: [],
    })),
  })).filter((month) => month.title) };
  if (timeline.months.length && !timeline.months.some((month) => month.current)) timeline.months[0].current = true;

  const graph = {
    nodes,
    edges: edges
      .map((edge) => ({ ...edge, data: { ...edge.data, ...(edgeBodies[edge.id] ? { note: edgeBodies[edge.id] } : {}) } }))
      .sort((a, b) => a.id.localeCompare(b.id)),
    revision: 0,
  };
  const team = { members: Array.isArray(input.team?.members) ? input.team.members : [] };
  const contractError = graphError(graph) || questionsError({ questions }) || timelineError(timeline) || teamError(team);
  if (contractError) throw new Error(contractError);

  const projectMarkdown = formatResearchDoc(
    { schemaVersion: 2, topic },
    `# ${topic}\n\n## Research approach\n\nThis computational research project uses iterative design and empirical evaluation.\n\n## Scope decisions\n`,
  );
  return { graph, documents, edgeBodies, questions: { questions }, timeline, team, projectMarkdown };
}

export function readProject(dataDir) {
  const layout = json(path.join(dataDir, 'graph.json'), { nodes: [], revision: 0 });
  const documents = {};
  const nodes = (layout.nodes || []).map(({ id, position }) => {
    const { metadata, body } = parseResearchDoc(read(path.join(dataDir, 'nodes', `${id}.md`)));
    documents[id] = body;
    const { id: ignored, from, to, ...data } = metadata;
    return { id, position, data };
  });
  const edgesDir = path.join(dataDir, 'edges');
  const edgeBodies = {};
  const edges = fs.existsSync(edgesDir) ? fs.readdirSync(edgesDir).filter((name) => name.endsWith('.md')).map((name) => {
    const { metadata, body } = parseResearchDoc(read(path.join(edgesDir, name)));
    const { id, from, to, ...data } = metadata;
    edgeBodies[id] = body.trim();
    return { id, source: linkedId(from, 'nodes'), target: linkedId(to, 'nodes'), data: { ...data, ...(body.trim() ? { note: body.trim() } : {}) } };
  }) : [];
  return {
    graph: { nodes, edges, revision: layout.revision || 0 },
    documents,
    edgeBodies,
    questions: json(path.join(dataDir, 'questions.json'), { questions: [] }),
    timeline: json(path.join(dataDir, 'timeline.json'), { months: [] }),
    team: json(path.join(dataDir, 'team.json'), { members: [] }),
    projectMarkdown: read(path.join(dataDir, 'PROJECT.md')),
  };
}

export function sourceFingerprint(project) {
  const value = JSON.stringify({
    graph: project.graph,
    questions: project.questions,
    timeline: project.timeline,
    team: project.team,
    projectMarkdown: project.projectMarkdown,
    documents: project.documents,
    edgeBodies: project.edgeBodies,
  });
  return crypto.createHash('sha256').update(value).digest('hex').slice(0, 16);
}

export function buildStateMarkdown(project) {
  const fingerprint = sourceFingerprint(project);
  const topic = project.graph.nodes.find((node) => node.data.role === 'project');
  const objectives = project.graph.nodes.filter((node) => node.data.role === 'objective');
  const priorities = priorityTasks({ nodes: project.graph.nodes, edges: project.graph.edges, timeline: project.timeline });
  const lines = [`# Current research state`, '', `Source fingerprint: \`${fingerprint}\``, '', '## Project', '', topic ? `- **${topic.data.title}** · [PROJECT.md](PROJECT.md)` : '- Topic not defined.', '', '## Objectives'];
  if (!objectives.length) lines.push('', '- None');
  for (const objective of objectives) {
    const progress = objectiveProgress(objective.id, project.graph.nodes, project.graph.edges);
    lines.push('', `- **${objective.data.title}** — ${progress.complete}/${progress.total} aspects synthesized${progress.readyForReview ? ' · ready for review' : ''} · [${objective.id}](nodes/${objective.id}.md)`);
  }
  lines.push('', '## Priorities');
  if (!priorities.length) lines.push('', '- No priorities derived. Pin a task or mark the current timeline period.');
  priorities.forEach(({ node, reasons }) => {
    const assigned = (node.data.assignees || []).length ? ` · assigned: ${node.data.assignees.join(', ')}` : '';
    lines.push('', `- **${node.data.title}** — ${reasons.join(', ')}${assigned} · [${node.id}](nodes/${node.id}.md)`);
  });
  lines.push('', '## Research questions');
  for (const question of project.questions.questions || []) {
    const evidence = evidenceForQuestion(question.id, project.graph.nodes, project.graph.edges);
    lines.push('', `- **${question.id}** (${question.status}) — ${evidence.length} merged evidence · ${question.text}`);
  }
  lines.push('', '## Timeline');
  const current = (project.timeline.months || []).filter((month) => month.current);
  if (!current.length) lines.push('', '- No current period selected.');
  current.forEach((month) => lines.push('', `- **${month.title}** — ${(month.milestones || []).length} milestones`));
  lines.push('', '## Decisions and retained dead ends');
  const retained = project.graph.nodes.filter((node) => node.data.role === 'decision' || ['dead', 'retired', 'superseded'].includes(node.data.status));
  if (!retained.length) lines.push('', '- None recorded.');
  retained.slice(0, 10).forEach((node) => lines.push('', `- **${node.data.title}** (${node.data.status})${node.data.outcome ? ` — ${node.data.outcome}` : ''} · [${node.id}](nodes/${node.id}.md)`));
  lines.push('', '## Team');
  if (!(project.team.members || []).length) lines.push('', '- No team members recorded.');
  (project.team.members || []).forEach((member) => lines.push('', `- ${member.name} (\`${member.id}\`)`));
  return formatResearchDoc({ generated: true, fingerprint }, lines.join('\n') + '\n');
}

export function initializeProject(dataDir, input, { overwrite = false } = {}) {
  const graphFile = path.join(dataDir, 'graph.json');
  if (!overwrite && fs.existsSync(graphFile)) throw new Error('project is already initialized');
  const project = buildProject(input);
  fs.mkdirSync(path.join(dataDir, 'nodes'), { recursive: true });
  fs.mkdirSync(path.join(dataDir, 'edges'), { recursive: true });
  fs.mkdirSync(path.join(dataDir, 'context'), { recursive: true });
  Object.entries(project.documents).forEach(([id, body]) => {
    const node = project.graph.nodes.find((item) => item.id === id);
    fs.writeFileSync(path.join(dataDir, 'nodes', `${id}.md`), formatResearchDoc({ id, ...node.data }, body));
  });
  project.graph.edges.forEach((edge) => {
    fs.writeFileSync(path.join(dataDir, 'edges', `${edge.id}.md`), formatResearchDoc(edgeMetadata(edge), project.edgeBodies[edge.id] || edge.data.note || ''));
  });
  writeJson(graphFile, layoutOf(project.graph));
  writeJson(path.join(dataDir, 'questions.json'), project.questions);
  writeJson(path.join(dataDir, 'timeline.json'), project.timeline);
  writeJson(path.join(dataDir, 'team.json'), project.team);
  fs.writeFileSync(path.join(dataDir, 'PROJECT.md'), project.projectMarkdown);

  // Temporary compatibility projection for the current UI; PROJECT.md and
  // questions.json remain authoritative during the redesign.
  fs.writeFileSync(path.join(dataDir, 'context', 'layer1_topic.txt'), String(input.topic).trim());
  fs.writeFileSync(path.join(dataDir, 'context', 'layer2_objective.txt'), (input.objectives || []).map((value, index) => `O${index + 1}: ${String(value).trim()}`).join('\n'));
  fs.writeFileSync(path.join(dataDir, 'context', 'layer3_research_question.txt'), project.questions.questions.map((question) => `${question.id}: ${question.text}`).join('\n'));
  const persisted = readProject(dataDir);
  fs.writeFileSync(path.join(dataDir, 'STATE.md'), buildStateMarkdown(persisted));
  return persisted;
}

export function refreshStateMarkdown(dataDir) {
  const project = readProject(dataDir);
  const content = buildStateMarkdown(project);
  fs.writeFileSync(path.join(dataDir, 'STATE.md'), content);
  return content;
}

export function applyResearchOperation(dataDir, operation) {
  const project = readProject(dataDir);
  let graph = project.graph;
  if (operation.type === 'create-node') {
    graph = createNode(graph, operation.node);
    project.documents[operation.node.id] = operation.content || nodeBody(operation.node.data.role, operation.node.data.title);
  } else if (operation.type === 'patch-node') {
    graph = patchNode(graph, operation.nodeId, operation.patch || {});
  } else if (operation.type === 'connect') {
    graph = connectNodes(graph, operation.edge);
    project.edgeBodies[operation.edge.id] = String(operation.rationale || operation.edge.data?.note || '').trim();
  } else if (operation.type === 'transition') {
    graph = transitionNode(graph, operation.nodeId, operation.status, { outcome: operation.outcome || '', humanApproved: operation.humanApproved === true });
  } else if (operation.type === 'objective-met') {
    graph = setObjectiveMet(graph, operation.objectiveId, operation.met, { humanApproved: operation.humanApproved === true });
  } else {
    throw new Error(`unknown research operation ${operation.type}`);
  }
  graph = { ...graph, revision: (project.graph.revision || 0) + 1 };
  graph.nodes.forEach((node) => fs.writeFileSync(path.join(dataDir, 'nodes', `${node.id}.md`), formatResearchDoc({ id: node.id, ...node.data }, project.documents[node.id] || nodeBody(node.data.role, node.data.title))));
  graph.edges.forEach((edge) => fs.writeFileSync(path.join(dataDir, 'edges', `${edge.id}.md`), formatResearchDoc(edgeMetadata(edge), project.edgeBodies[edge.id] || edge.data.note || '')));
  writeJson(path.join(dataDir, 'graph.json'), layoutOf(graph));
  const next = readProject(dataDir);
  fs.writeFileSync(path.join(dataDir, 'STATE.md'), buildStateMarkdown(next));
  return next;
}
