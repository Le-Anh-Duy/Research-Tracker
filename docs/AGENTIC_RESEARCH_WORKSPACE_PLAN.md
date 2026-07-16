# Agentic Research Workspace Plan

Status: approved product direction; core implementation landed in the working tree in July 2026. This remains the product contract and acceptance checklist.

This document records the product decisions agreed during the July 2026 design
interview. It is the implementation contract for the next version of Research
Navigator. Do not reinterpret the product from the current mock roadmap.

## Product definition

Research Navigator is a desktop-first, Git-synchronized research coordination
workspace for computational researchers. It connects objectives, research
questions, aspects, tasks, external experiments, evidence, people, and time.

It is not:

- an experiment runner or long-running job monitor;
- a replacement for an external code/data repository;
- a real-time collaboration server;
- a citation manager;
- a chat application;
- an autonomous scientific authority.

One Git repository represents one research project. The application source and
project research state live in that repository. Teammates coordinate before
editing and use normal Git utilities as the collaboration boundary and audit
history. The application may read Git status and history, but must not commit,
pull, push, branch, merge, tag, or revert.

The template repository's current ignored `research_data/` contains private
thesis material. Never stage, move, rewrite, publish, or use it as a fixture.
Create synthetic data separately when examples or tests are needed.

## Research model

### Objective structure

An objective is decomposed into a flexible set of aspects. As understanding
changes, aspects may be added, split, merged, or retired with a rationale.

Each aspect owns an arbitrary internal work DAG and one designated closing
synthesis. Merging that synthesis resolves the aspect. An objective displays an
unweighted count such as `3 of 5 aspects synthesized`. When every active aspect
is resolved, the objective becomes `ready for review`; only a human may mark it
met. A retired aspect remains visible but leaves the completion denominator.

Every node has one primary home aspect. Typed cross-links may connect routes,
aspects, objectives, and questions. A synthesis resolves exactly one aspect but
may inform many other entities.

Objectives have `research` or `enabling` kind. Enabling objectives such as
research infrastructure may have no research-question relationship and may be
prerequisites for research objectives.

Objectives and research questions are many-to-many. Actual RQ contributions
come from explicit evidence relationships rather than an objective index.

### Node vocabulary

- `project`
- `objective`
- `research-question`
- `aspect`
- `idea`
- `task`
- `experiment`
- `decision`
- `synthesis`
- `note`

Milestones remain timeline records, not graph nodes. Reading, datasets,
implementation, and analysis use tasks plus tags rather than new node types.
Ideas and notes may remain floating in an Unplaced/Idea Garden area without
affecting progress or evidence.

### Lifecycle

- `active`: current work;
- `merged`: completed work with a recorded outcome;
- `dead`: an attempted route that did not work;
- `retired`: an aspect deliberately removed from current scope;
- `superseded`: an unfinished task replaced by a new task in a later milestone.

`blocked` is derived from unresolved `depends-on` relationships and is never
stored manually. A superseding task may use `informs` to reference the previous
attempt. Dead ends, retired scope, and superseded work remain visible.

### Relationships

Relationships remain first-class Markdown documents because their bodies may
explain the research reasoning behind a connection.

- `step`: primary route inside an aspect;
- `depends-on`: blocking prerequisite across routes;
- `informs`: useful, non-blocking knowledge or output;
- `evidence`: a result or synthesis contributing to an RQ;
- `resolves`: a closing synthesis completing its home aspect.

An edge file exclusively owns its type, source, target, and rationale. Remove
the duplicated reciprocal edge lists from node frontmatter; incoming and
outgoing adjacency are derived by indexing edge files.

The default Map emphasizes `step` and `depends-on`. Other relationships appear
in contextual or filtered projections so backlinks do not overwhelm the Map.

## Data contract

The durable project state remains inspectable flat files:

```text
research_data/
  PROJECT.md          human-owned compass, methodology, and scope decisions
  STATE.md            generated compact agent/researcher entry point
  team.json           tracked project member registry
  questions.json      RQs and human-approved answers
  timeline.json       periods, milestones, optional deadlines, linked tasks
  graph.json          canonical manual positions and layout revision only
  nodes/<id>.md       node metadata and narrative
  edges/<id>.md       typed relationship and rationale
```

`STATE.md` is a tracked generated projection, not an editable source of truth.
It includes a source fingerprint and summarizes:

- topic and active scope;
- objectives, aspect counts, and open closing syntheses;
- up to five current priorities with selection reasons;
- assignments and current timeline milestones;
- RQ status, evidence counts, and gaps;
- important decisions, dead ends, and recent changes;
- stable IDs and file paths for targeted follow-up reading.

Agents read `AGENTS.md`, `PROJECT.md`, and `STATE.md`, then only the relevant
node and edge files. The UI, CLI, API, and MCP rebuild `STATE.md` after semantic
changes and report a stale fingerprint after manual file edits.

Nodes store structured frontmatter and flexible Markdown bodies. New files use
lightweight editable templates. For example, an Experiment contains `Question`,
`Plan`, `Runs`, `Interpretation`, and `Next decision` headings. Methodology
checks are advisory; only corrupt references, invalid data, and destructive
operations block writes.

## External experiment boundary

An Experiment node represents one experimental question, not every execution.
Its body holds a plan, selected/comparative run summaries, interpretation, and
links to raw results. Hyperparameter sweeps, code, data, checkpoints, and raw
logs remain in external experiment workspaces.

Tracked references use portable repository URLs, commits, run IDs, and
artifact-relative paths. Optional machine-specific path mappings live in an
ignored local configuration file. Never commit absolute local paths.

## People, tasks, and priorities

Actionable graph nodes are the tasks; there is no parallel task database.
Assignments are informational metadata and select stable human IDs from
`team.json`. Agents are not team members or assignees. The application has no
authentication and no current-user identity; Home may filter assignments by a
manually selected person.

Agents are checkers and organizers. They may inspect by default. They may edit
only after an explicit request, and must first state the exact files and
structural changes they intend to make. Git diff is the review boundary; do not
add a second approval database.

Home displays at most five priorities. Human pins appear first; remaining slots
are derived from assignment, current milestones, due dates, and blocking
dependencies. Every derived item explains why it appeared. Agents may recommend
priority changes but may write them only when explicitly asked.

A task may have an optional due date. A linked milestone may have an optional
deadline; warn when the task due date is later. A task belongs to at most one
active milestone. Carrying unfinished work forward creates a new task in the
new milestone and marks the old one superseded, preserving honest history.

Milestone completion is derived from linked task/aspect/synthesis state. Broad
future milestones may remain unlinked until their work becomes clear.

## Interface contract

The application is desktop-first. There is no mobile graph-editing requirement.

Home is the practical starting point and includes:

- up to five priorities;
- current timeline period and milestones;
- objective/aspect progress;
- RQs missing evidence;
- assignments grouped or filtered by person;
- recent Git-derived activity;
- uncommitted/external changes and validation warnings.

The Map is the emotional and conceptual center: the visible memory of branching
ideas, failed directions, cross-connections, and converging synthesis. Canonical
manual positions preserve the researcher's spatial narrative. Focus and Tidy
create temporary layouts and never overwrite it.

Focused views retain a compact route indicator such as
`Project -> O1 -> Aspect -> Experiment`. The main projections are:

- Project overview: objectives, RQs, prerequisites, and progress;
- Objective workspace: aspects and their internal DAGs;
- Map: canonical research journey;
- Evidence: findings and syntheses connected to RQs;
- Timeline: periods, milestones, assignments, and derived status;
- Review: gaps, warnings, open branches, and ready-for-review items.

“Research Objectives” and “Research Questions” are UI-only group labels or
swimlanes, not persisted separator nodes.

The visual identity uses warm sand/parchment, ink, muted ochre, and terracotta;
subtle borders and paper-like layers; and compact editorial density. Support
light parchment and dark charcoal/sepia themes. Font choices must render
Vietnamese well, using options such as Be Vietnam Pro, Inter, IBM Plex Sans, or
Noto Sans. Monospace is reserved for IDs, commits, metrics, and file references.

## Agent and application architecture

The application is model-agnostic. Optional Ollama summarization may remain a
convenience, but embedded AI is not a core dependency and no chat UI is planned.

All semantic writers share one local domain layer:

```text
Web UI -> HTTP API --+
MCP tools -----------+-> shared research operations -> tracked files
Agent skill -> CLI --+
```

Offline agent operation is required. Skills should call the CLI/domain layer
instead of independently reimplementing multi-file mutations. Direct manual
edits remain possible for notes and simple metadata; structural and lifecycle
changes should use semantic operations when available.

When files change through an agent or `git pull`, the browser automatically
reloads if it has no unsaved edits. Otherwise it pauses and presents the
external change before replacing local state. Synchronization covers all
research state, not only `graph.json`.

Git integration is read-only:

- show status and uncommitted research changes;
- derive recent project activity from commits touching `research_data/`;
- list optional annotated tags under `research/checkpoint/*`;
- reconstruct historical research state in memory using `git show`/`git tree`;
- never check out or revert a historical commit.

Journey replay begins at the commit introducing the new schema. It is a later
phase, after the core workflow is stable.

## Human authority

Agents may draft synthesis text, propose evidence links, identify gaps, and
maintain graph organization after explicit instruction. Only a human may:

- approve an RQ answer;
- retire an aspect;
- mark an objective met;
- accept a final scientific claim or scope decision.

The agent is a continuous methodological checker and research companion, not a
substitute supervisor. Recommendations must distinguish evidence, inference,
and uncertainty.

## Implementation phases

Each phase ends with a runnable, reviewable application.

### Phase 1: Domain foundation

- Add the new node/status/relationship contracts and pure derived selectors.
- Index adjacency from edge files and remove reciprocal-link requirements.
- Implement aspect resolution, objective readiness, blockers, priorities,
  assignments, milestone status, due-date warnings, and many-to-many evidence.
- Put semantic operations in a shared module usable without the server.
- Add small assertion tests using synthetic temporary data only.
- Do not read or mutate the ignored private thesis roadmap.

Acceptance: pure checks cover every derived rule; existing application remains
runnable until the new reader/writer is switched over at a phase boundary.

### Phase 2: Project initialization and agent context

- Replace the current schema without legacy compatibility.
- Make UI wizard and `research-init` use the same preview and semantic writer.
- Generate `PROJECT.md`, `STATE.md`, `team.json`, objectives, aspects, RQs,
  timeline, nodes, and explanatory edges only after preview approval.
- Add the source fingerprint and stale-summary check.
- Update agent skills and developer/data documentation.

Acceptance: a synthetic project initialized through UI and CLI yields equivalent
valid state; a fresh agent can orient from three entry files.

### Phase 3: Task, team, Home, and timeline workflow

- Add team registry editing and assignment controls.
- Implement mixed pinned/derived priorities capped at five with reasons.
- Support optional task due dates and milestone deadlines.
- Support superseding work across milestones.
- Preserve automatic milestone completion and fog-of-war planning.
- Establish the sand/ink design tokens, both themes, and Vietnamese-safe fonts.

Acceptance: a researcher can initialize, assign, prioritize, schedule, update,
and review work without using the Map or editing files manually.

### Phase 4: Objective workspace and graph projections

- Add aspect nodes and designated closing syntheses.
- Show unweighted aspect progress and human-only objective completion.
- Add research/enabling objective presentation and prerequisites.
- Replace persisted separator nodes with UI-only grouping.
- Add relationship filters, Objective workspace, Evidence view, Idea Garden,
  route breadcrumbs, and temporary Focus/Tidy layouts.
- Preserve canonical manual Map positions.

Acceptance: a multi-route objective with shared cross-links remains readable;
no visual backlink is required to understand objective or RQ contribution.

### Phase 5: External workspaces and agent surfaces

- Add portable repo/commit/run/artifact references and ignored local mappings.
- Expose every semantic operation through CLI and HTTP API.
- Add thin MCP tools over the same operations.
- Update skills to inspect by default, announce intended edits, then use semantic
  operations only after explicit instruction.
- Implement full-state external-change detection and safe browser reload.

Acceptance: a terminal agent can inspect and update a stopped or running project
without bespoke file mutation logic, and the open browser reflects safe changes.

### Phase 6: Git awareness and Journey replay

- Show read-only repository status and research-focused recent commits.
- Display uncommitted changes separately from committed history.
- Discover and emphasize `research/checkpoint/*` annotated tags.
- Reconstruct and cache historical states without touching the worktree.
- Add a read-only Journey slider/diff between current and historical graph state.

Acceptance: selecting a checkpoint or commit renders the historical research
graph and summary while `git status` remains unchanged.

### Phase 7: Final usability and visual pass

- Run the complete workflow with a synthetic computational-research project.
- Tighten empty states, warnings, keyboard navigation, accessibility, density,
  typography, and Vietnamese rendering.
- Ensure beginner labels remain plain-language while formal methodology stays
  available as contextual help.
- Update screenshots, README, architecture, API, and development contracts.

Acceptance: a newcomer can move from initialization to first planned experiment,
external result note, closing synthesis, and objective review without consulting
the data schema.

## Deliberately deferred

- Real-time multi-user editing or authentication.
- Built-in Git mutation.
- Embedded chat.
- Experiment execution or job monitoring.
- Raw run/metric storage and model registry.
- Citation-library management.
- Mobile graph editing.
- Weighted objective progress.
- Backward compatibility with the current mock schema.
