const VIEWS = [
  ['Home', 'Decide what deserves attention now. Priorities always explain why they appeared.'],
  ['Objectives', 'See research and enabling objectives, aspect progress, and closing syntheses.'],
  ['Map', 'Explore the canonical spatial memory of routes, failures, cross-links, and convergence.'],
  ['Compass', 'Maintain the human-owned topic, objective wording, research questions, and answers.'],
  ['Evidence', 'Inspect only merged results connected to an RQ by explicit evidence links.'],
  ['Review', 'Find gaps, open branches, schedule warnings, and objectives ready for human review.'],
  ['Journey', 'Read Git changes and historical graph snapshots without changing the worktree.'],
];

const NODE_TYPES = [
  ['Aspect', 'One independently resolvable part of an objective; owns an internal work DAG and one closing synthesis.'],
  ['Idea', 'A promising thought that may remain unplaced without affecting progress.'],
  ['Task', 'Reading, data preparation, implementation, or analysis with a concrete deliverable.'],
  ['Experiment', 'One empirical question; raw runs and artifacts remain in an external workspace.'],
  ['Decision', 'A selected direction, rejected alternatives, and rationale.'],
  ['Synthesis', 'Combines evidence and closes an aspect when merged and linked with resolves.'],
  ['Note', 'Unstructured capture; never counts as progress or evidence by itself.'],
];

const LINKS = [
  ['step', 'Primary route through work inside an aspect.'],
  ['depends-on', 'A real blocker; unresolved prerequisites derive blocked state.'],
  ['informs', 'Useful knowledge or output that does not block the target.'],
  ['evidence', 'A merged result or synthesis contributing to a research question.'],
  ['resolves', 'The designated closing synthesis completing its home aspect.'],
];

export default function HelpView({ onBack }) {
  return <div className="help-view"><article className="help-inner manual">
    <header className="help-header"><div><p className="help-kicker">RESEARCH NAVIGATOR / MANUAL</p><h1>From uncertain work to traceable evidence</h1><p className="help-lead">Research may branch and fail. The workspace keeps that mess visible while making ownership, progress, and scientific contribution explicit.</p></div><button className="btn ghost" onClick={onBack}>Back to map</button></header>

    <section className="manual-start"><p className="manual-eyebrow">THE DAILY LOOP</p><ol><li><strong>Choose</strong><span>Open Home and select one justified priority.</span></li><li><strong>Work</strong><span>Record the task, experiment, decision, or external result in its home aspect.</span></li><li><strong>Interpret</strong><span>Merge meaningful outcomes; retain dead and superseded routes.</span></li><li><strong>Synthesize</strong><span>Close aspects, connect explicit RQ evidence, then ask for human review.</span></li></ol></section>

    <ManualSection number="01" title="Know where to look">
      <div className="manual-view-grid">{VIEWS.map(([name, description]) => <div className="manual-view" key={name}><strong>{name}</strong><p>{description}</p></div>)}</div>
    </ManualSection>

    <ManualSection number="02" title="Objectives end through aspects">
      <p>A <strong>research objective</strong> supports scientific questions. An <strong>enabling objective</strong> builds infrastructure or workflow and may have no RQ link.</p>
      <p>Break each objective into independently resolvable aspects. Every active aspect has one closing synthesis. Merging that synthesis resolves the aspect, producing progress such as <code>3 of 5 aspects synthesized</code>. Retired aspects remain visible but leave the denominator.</p>
      <div className="manual-callout"><strong>Human authority</strong><span>“Ready for review” is derived. Only a researcher marks an objective met, retires an aspect, or approves an RQ answer.</span></div>
    </ManualSection>

    <ManualSection number="03" title="Use the smallest honest node">
      <dl className="manual-definitions">{NODE_TYPES.map(([name, meaning]) => <div key={name}><dt>{name}</dt><dd>{meaning}</dd></div>)}</dl>
      <p>Statuses preserve history: <code>active</code>, <code>merged</code>, <code>dead</code>, <code>retired</code>, and <code>superseded</code>. Delete only genuine mistakes.</p>
    </ManualSection>

    <ManualSection number="04" title="Make relationships say what they mean">
      <dl className="manual-definitions link-definitions">{LINKS.map(([name, meaning]) => <div key={name}><dt><code>{name}</code></dt><dd>{meaning}</dd></div>)}</dl>
      <p>Click an edge to edit its type and rationale. Edge Markdown owns the connection; nodes do not maintain duplicate backlink lists.</p>
    </ManualSection>

    <ManualSection number="05" title="Navigate the Map without damaging it">
      <ul className="manual-list"><li><strong>Create:</strong> double-click empty canvas. Drag handles to connect nodes.</li><li><strong>Select:</strong> Ctrl+click or Ctrl+drag for multiple nodes; drag a selected node to move the group.</li><li><strong>Focus:</strong> select an Objective or RQ, then use <em>Focus related</em>.</li><li><strong>Collapse:</strong> select an Aspect to fold its private internal DAG. Decision and Synthesis may also fold private downstream branches. Shared work stays visible.</li><li><strong>Tidy:</strong> use <em>Tidy temporarily</em> for a generated layout. Returning to canonical restores the researcher’s saved spatial narrative.</li><li><strong>Undo:</strong> Ctrl/Cmd+Z; redo with Ctrl/Cmd+Shift+Z or Ctrl/Cmd+Y.</li></ul>
      <p>Solid edges are traversable route/blocking relationships. Contextual evidence, informs, resolves, backedges, and cycle-closing links remain dashed and do not control Focus or Collapse.</p>
    </ManualSection>

    <ManualSection number="06" title="Turn results into evidence carefully">
      <p>Merge only when work has a meaningful outcome. A result counts for an RQ only when it is merged and connected to the RQ node with an explicit <code>evidence</code> edge. Objective membership alone is not evidence.</p>
      <p>Use Evidence to compare support, contradiction, mixed findings, rationale, and missing contribution notes. Write or approve the RQ answer in Compass only after reviewing that record.</p>
    </ManualSection>

    <ManualSection number="07" title="Coordinate people and time">
      <p>Tasks are the task system: assign stable member IDs and add due dates only when useful. Open a task’s sidebar and choose <em>Pin to Home</em> to control it manually. Drag pinned rows by the <em>⋮⋮</em> handle on Home to reorder them. Automatically derived items stay after pins and become manually sortable only after you pin them.</p>
      <p>The first tag is the task’s Home topic label, and its selected node color becomes the topic dot. The small bar below a priority is derived from merged work in the same home aspect; it does not create another completion field.</p>
      <p>Milestones contain linked work and complete from node state; they have no manual checkbox. When unfinished work moves to a later milestone, create a new task and mark the old one superseded.</p>
    </ManualSection>

    <ManualSection number="08" title="Work safely with agents and Git">
      <p>Agents inspect by default. Before editing they must name the files and structural changes, receive an explicit request, then use the shared CLI/API/MCP operations. Agents may organize and check methodology; they do not approve scientific claims.</p>
      <p>Journey is read-only. It may show status, commits, checkpoints, and historical graphs, but never commits, pulls, pushes, branches, merges, tags, checks out, or reverts. External experiment repositories keep raw data, runs, logs, and checkpoints; this workspace stores portable references and selected interpretations.</p>
      <p>Use <em>Export plan (.md)</em> in Review for a deterministic hierarchy and Mermaid event timeline. Agents use the same exporter through the <code>research-export</code> skill instead of rereading the repository.</p>
    </ManualSection>
  </article></div>;
}

function ManualSection({ number, title, children }) {
  return <section className="help-section manual-section"><div className="manual-section-title"><span>{number}</span><h2>{title}</h2></div><div className="manual-section-body">{children}</div></section>;
}
