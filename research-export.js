import { aspectWorkProgress, dueDateWarnings, evidenceForQuestion, objectiveProgress, priorityTasks } from './research-domain.js';
import { sourceFingerprint } from './research-project.js';
import { milestoneStatus } from './src/timelineStatus.js';

const WORK_ROLES = new Set(['idea', 'task', 'experiment', 'decision', 'synthesis', 'note']);
const mark = { active: '○', merged: '●', dead: '×', retired: '–', superseded: '↪' };
const clean = (value = '') => String(value).replace(/\s+/g, ' ').trim();
const mermaid = (value) => clean(value).replaceAll(':', ' –');

export function buildPlanExport(project) {
  const { nodes, edges } = project.graph;
  const nodesById = Object.fromEntries(nodes.map((node) => [node.id, node]));
  const topic = nodes.find((node) => node.data.role === 'project')?.data.title || 'Research project';
  const objectives = nodes.filter((node) => node.data.role === 'objective');
  const priorities = priorityTasks({ nodes, edges, timeline: project.timeline });
  const warnings = dueDateWarnings(nodes, project.timeline);
  const lines = [
    '---',
    'generated: true',
    `fingerprint: "${sourceFingerprint(project)}"`,
    '---',
    '',
    '# Research plan export',
    '',
    `> ${clean(topic)}`,
    '',
    `**Team:** ${(project.team.members || []).map((member) => member.name).join(', ') || 'Not recorded'}`,
    '',
    '## Current priorities',
  ];

  if (!priorities.length) lines.push('', '- No priorities are currently derived.');
  priorities.forEach(({ node, reasons }, index) => lines.push('', `${index + 1}. **${clean(node.data.title)}** — ${reasons.join(', ')}${node.data.due ? `; due ${node.data.due}` : ''}${node.data.assignees?.length ? `; assigned ${node.data.assignees.join(', ')}` : ''} (\`${node.id}\`)`));

  lines.push('', '## Plan hierarchy');
  for (const objective of objectives) {
    const progress = objectiveProgress(objective.id, nodes, edges);
    lines.push('', `### ${clean(objective.data.title)}`, '', `**${objective.data.objectiveKind || 'research'} · ${progress.complete}/${progress.total} aspects synthesized${objective.data.met ? ' · met' : progress.readyForReview ? ' · ready for human review' : ''}**`);
    if (objective.data.exitCriteria) lines.push('', `Exit criterion: ${clean(objective.data.exitCriteria)}`);
    const aspects = nodes.filter((node) => node.data.role === 'aspect' && node.data.objectiveId === objective.id);
    if (!aspects.length) lines.push('', '- No aspects recorded.');
    for (const aspect of aspects) {
      const workProgress = aspectWorkProgress(aspect.id, nodes);
      const closing = edges.find((edge) => edge.data.kind === 'resolves' && edge.target === aspect.id);
      lines.push('', `- **${mark[aspect.data.status] || '○'} ${clean(aspect.data.title)}** — ${workProgress.complete}/${workProgress.total} work nodes merged${closing ? `; closes at \`${closing.source}\`` : '; closing synthesis missing'}`);
      const work = nodes.filter((node) => WORK_ROLES.has(node.data.role) && node.data.homeAspect === aspect.id)
        .sort((a, b) => a.position.y - b.position.y || a.position.x - b.position.x || a.id.localeCompare(b.id));
      work.forEach((node) => lines.push(`  - ${mark[node.data.status] || '○'} \`${node.data.role}\` **${clean(node.data.title)}**${node.data.outcome ? ` — ${clean(node.data.outcome)}` : ''} (\`${node.id}\`)`));
    }
  }

  lines.push('', '## Research questions');
  for (const question of project.questions.questions || []) {
    const evidence = evidenceForQuestion(question.id, nodes, edges);
    lines.push('', `### ${question.id} · ${question.status}`, '', clean(question.text), '', `**Merged evidence:** ${evidence.length}${question.objectiveIds?.length ? ` · Objectives: ${question.objectiveIds.join(', ')}` : ''}`);
    if (question.answer) lines.push('', `**Human answer:** ${clean(question.answer)}`);
    evidence.forEach((node) => lines.push('', `- **${clean(node.data.title)}**${node.data.finding ? ` · ${node.data.finding}` : ''}${node.data.contribution ? ` — ${clean(node.data.contribution)}` : ''} (\`${node.id}\`)`));
  }

  lines.push('', '## Event timeline', '', '```mermaid', 'timeline', `  title ${mermaid(topic)}`);
  for (const month of project.timeline.months || []) {
    lines.push(`  ${mermaid(month.title)}`);
    for (const milestone of month.milestones || []) lines.push(`    : ${mermaid(milestone.title)}`);
  }
  lines.push('```', '', '### Timeline details');
  for (const month of project.timeline.months || []) {
    lines.push('', `- **${clean(month.title)}**${month.current ? ' · current' : ''}`);
    for (const milestone of month.milestones || []) lines.push(`  - ${milestoneStatus(milestone, nodesById)} · ${clean(milestone.title)}${milestone.deadline ? ` · ${milestone.deadline}` : ''}`);
  }

  const crossLinks = edges.filter((edge) => !['step', 'resolves'].includes(edge.data.kind));
  if (crossLinks.length) {
    lines.push('', '## Cross-links');
    crossLinks.forEach((edge) => lines.push('', `- \`${edge.source}\` — **${edge.data.kind}** → \`${edge.target}\`${edge.data.note ? `: ${clean(edge.data.note)}` : ''}`));
  }

  const retained = nodes.filter((node) => node.data.role === 'decision' || ['dead', 'retired', 'superseded'].includes(node.data.status));
  if (retained.length) {
    lines.push('', '## Decisions and retained history');
    retained.forEach((node) => lines.push('', `- **${clean(node.data.title)}** · ${node.data.status}${node.data.outcome ? ` — ${clean(node.data.outcome)}` : ''} (\`${node.id}\`)`));
  }
  if (warnings.length) {
    lines.push('', '## Warnings');
    warnings.forEach((warning) => lines.push('', `- ${warning.code}: \`${warning.nodeId}\` / \`${warning.milestoneId}\``));
  }
  return lines.join('\n') + '\n';
}
