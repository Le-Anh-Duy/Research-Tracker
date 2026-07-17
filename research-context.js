import { evidenceForQuestion, indexEdges, priorityTasks } from './research-domain.js';

const ACTIONABLE_ROLES = new Set(['task', 'experiment', 'decision', 'synthesis']);
const STOP_WORDS = new Set('ai anh bay co cac cai cho cua dang day de dieu do dung duoc gi hien khi khong la lam mot nao nay nhu nhung o phai ra sao se the thi toi trong va ve voi'.split(' '));

const normalize = (value) => String(value || '')
  .replaceAll('α', ' alpha ')
  .replaceAll('β', ' beta ')
  .normalize('NFD')
  .toLowerCase()
  .replace(/[\u0300-\u036f]/gu, '')
  .replaceAll('đ', 'd')
  .replace(/[^a-z0-9]+/gu, ' ')
  .trim();
const tokens = (value) => [...new Set(normalize(value).split(/\s+/u).filter((term) => term.length > 1 && !STOP_WORDS.has(term)))];
const tokenSet = (value) => new Set(normalize(value).split(/\s+/u).filter(Boolean));
const clip = (value, limit = 180) => {
  const text = String(value || '').replace(/^#{1,6}\s+.*$/gmu, '').replace(/\s+/gu, ' ').trim();
  return text.length > limit ? `${text.slice(0, limit - 1).trimEnd()}…` : text;
};
const nodeRef = (node) => node.data.role === 'project' ? 'project:main'
  : node.data.role === 'research-question' && node.data.questionId ? `question:${node.data.questionId}`
    : `node:${node.id}`;
const nodeCard = (node) => ({ ref: nodeRef(node), title: node.data.title, role: node.data.role, status: node.data.status });

export function createResearchReader(project) {
  const nodes = project.graph.nodes || [];
  const byNodeId = new Map(nodes.map((node) => [node.id, node]));
  const edges = indexEdges(project.graph.edges || []);
  const records = [];

  for (const node of nodes) {
    if (node.data.role === 'project' || node.data.role === 'research-question') continue;
    records.push({
      ref: `node:${node.id}`,
      kind: 'node',
      title: node.data.title,
      id: node.id,
      tags: (node.data.tags || []).join(' '),
      context: [node.data.role, node.data.status, node.data.homeAspect, node.data.objectiveId].filter(Boolean).join(' '),
      body: [node.data.outcome, project.documents[node.id]].filter(Boolean).join('\n'),
    });
  }
  const projectNode = nodes.find((node) => node.data.role === 'project');
  if (projectNode) records.push({ ref: 'project:main', kind: 'project', title: projectNode.data.title, id: 'project', tags: '', context: '', body: project.projectMarkdown });
  for (const question of project.questions.questions || []) {
    const questionNode = nodes.find((node) => node.data.questionId === question.id);
    records.push({
      ref: `question:${question.id}`,
      kind: 'question',
      title: `${question.id}: ${question.text}`,
      id: question.id,
      tags: '',
      context: [question.status, ...(question.objectiveIds || [])].join(' '),
      body: [question.answer, questionNode && project.documents[questionNode.id]].filter(Boolean).join('\n'),
    });
  }
  for (const month of project.timeline.months || []) {
    records.push({
      ref: `month:${month.id}`,
      kind: 'month',
      title: month.title,
      id: month.id,
      tags: month.current ? 'hiện tại current' : '',
      context: (month.milestones || []).map((milestone) => milestone.title).join(' '),
      body: '',
    });
    for (const milestone of month.milestones || []) {
      records.push({
        ref: `milestone:${milestone.id}`,
        kind: 'milestone',
        title: milestone.title,
        id: milestone.id,
        tags: '',
        context: [month.title, milestone.objectiveId, ...(milestone.nodeIds || [])].filter(Boolean).join(' '),
        body: '',
      });
    }
  }
  const byRef = new Map(records.map((record) => [record.ref, record]));

  const search = ({ question, hints = [], limit = 5 } = {}) => {
    if (typeof question !== 'string' || !question.trim() || question.length > 1000) throw new Error('question must be a non-empty string up to 1000 characters');
    if (!Array.isArray(hints) || hints.length > 8 || hints.some((hint) => typeof hint !== 'string' || hint.length > 120)) throw new Error('hints must contain at most 8 strings up to 120 characters');
    const resultLimit = Number.isInteger(limit) ? Math.max(1, Math.min(5, limit)) : 5;
    const normalizedQuestion = normalize(question);
    if (/\b(uu tien|viec gi truoc|lam gi tiep|nen lam gi|gan nhat)\b/u.test(normalizedQuestion)) {
      const results = priorityTasks({ nodes, edges: project.graph.edges, timeline: project.timeline, limit: resultLimit })
        .map(({ node, reasons }, index) => ({ ref: nodeRef(node), kind: 'node', title: node.data.title, score: 100 - index, matchedTerms: [], reason: reasons.join(', '), snippet: clip(project.documents[node.id]) }));
      return { noMatch: results.length === 0, results };
    }

    const queryTerms = tokens(`${question} ${hints.join(' ')}`);
    if (!queryTerms.length) return { noMatch: true, results: [] };
    const requestedMonth = normalizedQuestion.match(/\bthang\s+(\d{1,2})(?:\s+(\d{4}))?\b/u);
    const scored = records.map((record) => {
      const fields = {
        id: tokenSet(record.id),
        title: tokenSet(record.title),
        tags: tokenSet(record.tags),
        context: tokenSet(record.context),
        body: tokenSet(record.body),
      };
      const matchedFields = {};
      let score = 0;
      for (const term of queryTerms) {
        for (const [field, weight] of [['id', 8], ['title', 6], ['tags', 4], ['context', 2], ['body', 1]]) {
          if (!fields[field].has(term)) continue;
          score += weight;
          (matchedFields[field] ||= []).push(term);
        }
      }
      const matchedTerms = [...new Set(Object.values(matchedFields).flat())];
      score += 8 * matchedTerms.length / queryTerms.length;
      if (requestedMonth && record.kind === 'month') {
        const recordMonth = normalize(record.title).match(/\bthang\s+(\d{1,2})\s+(\d{4})\b/u);
        if (recordMonth?.[1] === requestedMonth[1] && (!requestedMonth[2] || recordMonth[2] === requestedMonth[2])) score += 50;
      }
      const strongMatch = ['id', 'title', 'tags'].some((field) => matchedFields[field]?.length);
      const confident = strongMatch || matchedTerms.length >= Math.min(2, queryTerms.length);
      return { record, score, matchedTerms, matchedFields, confident };
    }).filter((item) => item.confident && item.score >= 3)
      .sort((left, right) => right.score - left.score || left.record.ref.localeCompare(right.record.ref))
      .slice(0, resultLimit)
      .map(({ record, score, matchedTerms, matchedFields }) => ({
        ref: record.ref,
        kind: record.kind,
        title: record.title,
        score: Number(score.toFixed(2)),
        matchedTerms,
        matchedFields,
        snippet: clip(record.body || record.context),
      }));
    return { noMatch: scored.length === 0, results: scored };
  };

  const parentFor = (node, visited, via) => {
    if (node.data.role === 'project') return null;
    const incomingSteps = (edges.incoming.get(node.id) || [])
      .filter((edge) => edge.data.kind === 'step' && !visited.has(edge.source))
      .sort((left, right) => left.id.localeCompare(right.id));
    const requestedParent = via[`node:${node.id}`]?.replace(/^node:/u, '');
    const selected = requestedParent && incomingSteps.find((edge) => edge.source === requestedParent) || incomingSteps[0];
    if (selected) return {
      node: byNodeId.get(selected.source),
      reason: requestedParent ? 'requested step parent' : 'incoming step',
      alternatives: incomingSteps.filter((edge) => edge !== selected).map((edge) => nodeRef(byNodeId.get(edge.source))),
    };
    for (const [id, reason] of [[node.data.homeAspect, 'home aspect'], [node.data.objectiveId, 'owning objective']]) {
      if (id && byNodeId.has(id) && !visited.has(id)) return { node: byNodeId.get(id), reason, alternatives: [] };
    }
    return null;
  };

  const traceNode = (node, via) => {
    const route = [];
    const visited = new Set();
    let current = node;
    while (current && !visited.has(current.id)) {
      visited.add(current.id);
      const parent = parentFor(current, visited, via);
      route.push({ node: current, parent });
      current = parent?.node;
    }
    const spineIds = new Set(route.map((item) => item.node.id));
    const subtree = (rootId) => {
      const found = new Set();
      const pending = [rootId];
      while (pending.length) {
        const id = pending.pop();
        if (found.has(id) || spineIds.has(id)) continue;
        found.add(id);
        for (const edge of edges.outgoing.get(id) || []) if (edge.data.kind === 'step') pending.push(edge.target);
      }
      return [...found].map((id) => byNodeId.get(id)).filter(Boolean);
    };
    const junctions = route.map(({ node: routeNode }, index) => {
      const childId = route[index - 1]?.node.id;
      const related = new Map();
      const add = (id, relationship) => {
        if (!id || spineIds.has(id) || !byNodeId.has(id)) return;
        if (!related.has(id)) related.set(id, []);
        related.get(id).push(relationship);
      };
      for (const edge of edges.outgoing.get(routeNode.id) || []) add(edge.target, `${edge.data.kind}:outgoing`);
      for (const edge of edges.incoming.get(routeNode.id) || []) add(edge.source, `${edge.data.kind}:incoming`);
      if (childId) related.delete(childId);
      const branches = [...related.entries()].map(([id, relationships]) => {
        const branch = byNodeId.get(id);
        const descendants = subtree(id);
        return {
          ...nodeCard(branch),
          relationships,
          nodeCount: descendants.length,
          ...(index <= 2 ? {
            activeWork: descendants.filter((item) => ACTIONABLE_ROLES.has(item.data.role) && item.data.status === 'active').slice(0, 2).map(nodeCard),
            summary: clip(branch.data.outcome || project.documents[id]) || 'No summary recorded.',
          } : {}),
        };
      });
      if (routeNode.data.role === 'objective') {
        for (const question of project.questions.questions || []) {
          if (!(question.objectiveIds || []).includes(routeNode.id)) continue;
          branches.push({ ref: `question:${question.id}`, title: `${question.id}: ${question.text}`, role: 'research-question', status: question.status, relationships: ['objective question'], nodeCount: 1 });
        }
      }
      return { at: nodeRef(routeNode), branches };
    }).filter((junction) => junction.branches.length);
    const milestones = (project.timeline.months || []).flatMap((month) => (month.milestones || [])
      .filter((milestone) => (milestone.nodeIds || []).includes(node.id))
      .map((milestone) => ({ ref: `milestone:${milestone.id}`, month: month.title, title: milestone.title, deadline: milestone.deadline || null })));
    return {
      kind: 'node',
      focus: { ...nodeCard(node), milestones, content: project.documents[node.id] || '' },
      spine: route.map(({ node: routeNode, parent }) => ({
        ...nodeCard(routeNode),
        ...(routeNode.id === node.id ? {} : { summary: clip(routeNode.data.outcome || project.documents[routeNode.id]) }),
        parentReason: parent?.reason || null,
        alternativeParents: parent?.alternatives || [],
      })),
      junctions,
    };
  };

  const context = ({ ref, via = {} } = {}) => {
    if (typeof ref !== 'string' || !byRef.has(ref)) throw new Error(`unknown research ref ${ref || ''}`);
    if (!via || typeof via !== 'object' || Array.isArray(via) || Object.keys(via).length > 20 || Object.entries(via).some(([key, value]) => !key.startsWith('node:') || typeof value !== 'string' || !value.startsWith('node:'))) throw new Error('via must map at most 20 node refs to node refs');
    const record = byRef.get(ref);
    if (record.kind === 'node') return traceNode(byNodeId.get(record.id), via);
    if (record.kind === 'project') return {
      kind: 'project',
      ref,
      title: projectNode.data.title,
      content: project.projectMarkdown,
      objectives: nodes.filter((node) => node.data.role === 'objective').map(nodeCard),
      currentMonths: (project.timeline.months || []).filter((month) => month.current).map((month) => ({ ref: `month:${month.id}`, title: month.title })),
      questions: (project.questions.questions || []).map((question) => ({ ref: `question:${question.id}`, title: question.text, status: question.status })),
    };
    if (record.kind === 'question') {
      const question = (project.questions.questions || []).find((item) => item.id === record.id);
      const questionNode = nodes.find((node) => node.data.questionId === question.id);
      return {
        kind: 'question', ref, question,
        content: questionNode ? project.documents[questionNode.id] || '' : '',
        objectives: (question.objectiveIds || []).map((id) => byNodeId.get(id)).filter(Boolean).map(nodeCard),
        evidence: evidenceForQuestion(question.id, nodes, project.graph.edges).map(nodeCard),
      };
    }
    const month = (project.timeline.months || []).find((item) => record.kind === 'month' ? item.id === record.id : (item.milestones || []).some((milestone) => milestone.id === record.id));
    if (record.kind === 'month') return {
      kind: 'month', ref, title: month.title, current: month.current,
      milestones: (month.milestones || []).map((milestone) => ({
        ref: `milestone:${milestone.id}`, title: milestone.title, deadline: milestone.deadline || null,
        linkedNodes: (milestone.nodeIds || []).map((id) => byNodeId.get(id)).filter(Boolean).map(nodeCard),
      })),
    };
    const milestone = month.milestones.find((item) => item.id === record.id);
    return {
      kind: 'milestone', ref, month: { ref: `month:${month.id}`, title: month.title }, milestone,
      linkedNodes: (milestone.nodeIds || []).map((id) => byNodeId.get(id)).filter(Boolean).map((node) => ({ ...nodeCard(node), summary: clip(node.data.outcome || project.documents[node.id]) })),
      objective: milestone.objectiveId && byNodeId.has(milestone.objectiveId) ? nodeCard(byNodeId.get(milestone.objectiveId)) : null,
    };
  };

  return { search, context };
}
