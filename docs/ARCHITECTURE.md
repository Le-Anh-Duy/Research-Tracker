# Architecture

Research Navigator is a local-first, single-user application. Its architecture favors inspectable files and small runtime boundaries over a database or state framework.

## System shape

```text
Browser (React + React Flow)
  |  JSON over /api
  v
Express server
  |  synchronous local file I/O
  v
research_data/ (JSON + Markdown)

Coding agents
  |  semantic /api/research/* actions, or documented file contracts
  +--------------------------------------------------------------^
```

The browser never reads `research_data/` directly. The Express server is the file owner while the app is running. Agent skills may edit the same files when the app is stopped; when it is running, they should prefer the semantic API.

## Design constraints

- Localhost and one researcher; there is no authentication or multi-user collaboration protocol.
- Flat files are the durable source of truth. React state is a working copy.
- The application remains usable without Ollama. AI only proposes a merge summary.
- Research questions and their answers remain human-owned.
- A failed experiment is retained as a `dead` node; deletion is for mistakes and test clutter.
- Dependencies stay limited to React, React Flow, Express, Vite, and Swagger UI.

## Module boundaries

| Area | Entry point | Responsibility |
| --- | --- | --- |
| UI composition | `src/App.jsx` | Loads roadmap state, coordinates views, selections, structural-change review, persistence, undo/redo |
| Roadmap scaffold | `src/roadmap.js` | Pure conversion from wizard input to context, graph, node notes, questions, and timeline |
| Graph UI | `src/components/Canvas.jsx` | React Flow projection, node/edge interaction, canvas node creation |
| Graph projection rules | `src/graphView.js` | Importance, dependency DAG, semantic zoom, focus traversal, and safe branch folding |
| Node editor | `src/components/Sidebar.jsx` | Node metadata, tags, Markdown log, lifecycle actions |
| Timeline UI | `src/components/TimelineBar.jsx` | Month/milestone editing, derived status, multi-node focus filter |
| Research compass | `CompassView.jsx`, `QuestionsView.jsx` | Topic/objective editing, RQ status, answers, evidence projection |
| Personal settings | `SettingsView.jsx`, `preferences.js` | Browser-local font and theme preferences; no research-data writes |
| Review | `src/components/ReviewView.jsx` | Derived list of open objectives, evidence gaps, branches, and milestones |
| HTTP client | `src/api.js` | Fetch wrappers; converts non-2xx responses into errors |
| API + storage | `server.js` | Validates requests, owns file reads/writes, semantic research actions, optional Ollama call |
| Markdown documents | `research-doc.js` | Frontmatter parsing, wikilinks, and reciprocal node/edge metadata |
| Boundary contracts | `contracts.js` | Shared constants and minimum validation for graph, questions, and timeline writes |
| Agent contract | `.agents/skills/*/SKILL.md` | Research-specific workflows over the same data model |

`server.js` intentionally remains one file. It has one deployment unit and one storage implementation; split routers/repositories only when a second storage backend or independent server test lifecycle appears.

## Sources of truth

| Concept | Source of truth | Derived views |
| --- | --- | --- |
| Node metadata and notes | `nodes/<nodeId>.md` | Map, Sidebar, Review, timeline status, RQ evidence |
| Edge endpoints, kind, and notes | `edges/<edgeId>.md` | Map links and relationship explanation |
| Graph layout and revision | `graph.json` | Node positions and optimistic concurrency |
| Research questions and answers | `questions.json` | Compass, `layer3_research_question.txt` |
| Topic | `context/layer1_topic.txt` | Top bar, Compass, start-node heading |
| Objectives | `context/layer2_objective.txt` | Top bar, Compass, objective-node headings |
| Timeline | `timeline.json` | Timeline panel, Review |

Evidence is never stored as a second list. A node contributes evidence to an RQ only when it is `merged` and `node.data.rq` equals that question's ID. An active node with `data.rq` records intent, not evidence. Milestone completion is also derived: every ID in `milestone.nodeIds` must point to a `merged` node.

Each question also has a structural graph node with `role: "research-question"` and `questionId`. It exists so graph edges can target the RQ independently from an objective. `questions.json` remains the source of question wording and answers; the node is the linkable spatial representation.

## Important runtime flows

### Initial load

`App` loads graph, context, timeline, and questions in parallel. If `graph.json` is absent, it renders `InitWizard`. Wizard output passes through `buildInitialRoadmap`, then the app writes context, timeline, questions, and node Markdown before writing the graph.

### Graph writes

Graph edits update React state first. Continuous edits are debounced; discrete lifecycle edits save immediately. Writes carry `expectedRevision`. A `409 GRAPH_CONFLICT` replaces the browser copy with the latest server graph and asks the user to reapply the edit.

### Graph projection contract

The stored graph may contain dependency, evidence, and reference relationships. The Map derives a dependency DAG without rewriting those edges. Node importance is fixed by role: Project → Objective/RQ → Module/Synthesis/Decision → Work/Experiment → Note. An edge from a lower-importance node to a higher one is a reference backedge. A same-level edge that would close a dependency cycle is also a reference; for equal-level conflicts, the lexically earlier edge ID remains the dependency so classification is stable after reload. Merge edges are always evidence references. Focus and Fold traverse only dependency edges.

Map projections run in this order:

1. Classify stored edges as dependency or reference.
2. Fold private outgoing dependency descendants into a selected Synthesis, Decision, or Module. Shared descendants remain visible and boundary relationships are projected onto the fold root.
3. Apply Focus. If a focused node belongs to a folded branch, that fold is temporarily expanded until focus is cleared.
4. Apply semantic zoom to card content: overview below `0.55`, compact below `0.85`, and detail otherwise. Zoom never removes nodes.

Zoom, focus, folds, and multi-selection are UI-only. They never enter Markdown or `graph.json`; folds reset on reload. Normal click opens details, Ctrl+click toggles selection, Ctrl+drag box-selects, and plain drag pans.

### Node notes

Markdown autosaves after one second. The API exposes only the body; frontmatter stays hidden and is preserved. Closing or switching the Sidebar flushes a dirty note. Graph undo restores deleted Markdown from an in-memory copy; it does not provide durable history after a reload.

### Structural compass changes

Topic, objective, and RQ wording changes pass through a review modal. Objective add/remove/reorder is deliberately blocked in the text editor because it changes objective indexes used by questions and timeline milestones.

### External agent writes

The browser polls `/api/research/state` and reloads the graph when its revision changes, unless a local graph write is still pending. Timeline, context, and questions are loaded at startup; those files do not currently live-refresh after external edits.

## Consistency model

The project is single-user but has two possible writers: browser and agent. Graph revision checks protect browser graph writes. A graph save rewrites reciprocal node/edge metadata before writing the layout projection last. Multi-file operations are not transactional; validators must report a broken reciprocal link instead of silently choosing one side.

This ceiling is deliberate. Add atomic temp-file renames or a write journal only if interrupted writes or concurrent writers become a real operating mode.
