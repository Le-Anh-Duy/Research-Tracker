const SECTIONS = [
  {
    title: '1. Start a research roadmap',
    body: (
      <>
        <p>When the project is empty, the init form guides you through the research proposal. Enter the topic, objectives, research questions, exit criteria, first tasks, and optional months with milestones.</p>
        <p>Keep the wording concrete. An objective is achieved only when its exit criteria are supported by evidence, not merely when a task is checked off.</p>
      </>
    ),
  },
  {
    title: '2. Read the roadmap',
    body: (
      <>
        <p>The Map is the working graph. Project, objectives, and research questions are separate anchor nodes, so work can link directly to the question it serves. The timeline shows your months and milestones.</p>
        <p>A month advances when its milestones are complete. A milestone can point to one or more nodes. Click it to focus every linked node and dim unrelated work; clear the filter from the chip above the map or by clicking empty canvas.</p>
      </>
    ),
  },
  {
    title: '3. Work with nodes',
    body: (
      <>
        <p>Double-click an empty area of the Map to create a node. Click a node to open its notes. Use the title, status, outcome, tags, and Markdown lab log to record what happened.</p>
        <p><strong>Work</strong> is the flexible default for implementation, datasets, reading, and preliminary analysis. <strong>Experiment</strong> tests a hypothesis. <strong>Decision</strong> records a choice and rationale. <strong>Synthesis</strong> combines results toward an RQ. <strong>Note / dump</strong> accepts anything and carries no workflow expectation.</p>
        <p>Project, objective, and research-question nodes are structural anchors; add or edit objectives and questions in Compass. Milestones live in the timeline rather than becoming manual node types. A negative result is still useful evidence: mark it dead or merge it with a clear outcome.</p>
        <p>Delete a selected node from its sidebar. Its file and connected links are removed, and the graph can be restored with Undo.</p>
      </>
    ),
  },
  {
    title: '4. Connect work',
    body: (
      <>
        <p>Drag from a node handle to another node to create a link. Links describe dependency or reasoning flow. Click a link to inspect and explain it; clicking never deletes it.</p>
        <p>With a link selected, choose Delete link or press Delete/Backspace. Use Ctrl/Cmd+Z to undo and Ctrl/Cmd+Shift+Z (or Ctrl/Cmd+Y) to redo graph changes.</p>
      </>
    ),
  },
  {
    title: '5. Turn experiments into evidence',
    body: (
      <>
        <p>When an experiment or branch has a meaningful result, open its sidebar and choose Merge. Record its final title, outcome, related research question, finding, and contribution.</p>
        <p>Merging preserves the experiment as evidence. The Compass gathers every merged node linked to each RQ, so you can compare supporting, contradictory, and mixed findings before writing an answer.</p>
        <p>Mark an objective met only after its exit criteria are satisfied by the collected evidence. The result may be positive, negative, or inconclusive.</p>
      </>
    ),
  },
  {
    title: '6. Work with teammates',
    body: (
      <>
        <p>Add tags such as <code>duy</code>, <code>huy</code>, <code>baseline</code>, or <code>analysis</code> to nodes. Tags make ownership and filtering conventions visible in the shared roadmap.</p>
        <p>Use the Markdown log for assumptions, commands, metrics, links, and decisions. Keep the evidence close to the node that produced it.</p>
      </>
    ),
  },
  {
    title: '7. Export and continue with an agent',
    body: (
      <>
        <p>Ask the coding agent to use the <code>research-export</code> skill to create a Markdown snapshot of the current roadmap. Use <code>research-log</code> to record findings and <code>research-synthesize</code> to draft an answer for an RQ from linked evidence.</p>
        <p>The project is local-first. Your roadmap lives in <code>research_data/</code>; the agent skills operate on those files, so the same research can be continued after cloning the repository. The complete local action API is documented in <code>docs/API.md</code>.</p>
      </>
    ),
  },
];

export default function HelpView({ onBack }) {
  return (
    <div className="help-view">
      <article className="help-inner">
        <div className="help-header">
          <div>
            <p className="help-kicker">RESEARCH NAVIGATOR / GUIDE</p>
            <h1>How to use your roadmap</h1>
            <p className="help-lead">The roadmap turns research into a visible chain: question, objective, experiment, evidence, and answer.</p>
          </div>
          <button className="btn ghost" onClick={onBack}>Back to map</button>
        </div>
        {SECTIONS.map((section) => (
          <section className="help-section" key={section.title}>
            <h2>{section.title}</h2>
            {section.body}
          </section>
        ))}
      </article>
    </div>
  );
}
