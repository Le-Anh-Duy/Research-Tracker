# Development Guide

This document is the change contract for the application. Read it before adding a feature that writes roadmap data.

## Local workflow

```bash
npm install
npm run dev
npm test
```

The Vite UI runs on `http://localhost:5173`; Express and Swagger run on `http://localhost:3001` and `/api-docs`.

`research_data/` is ignored. Tests must not depend on or rewrite the researcher's roadmap. Keep pure checks under `scripts/*.test.mjs` and use Node's built-in `assert` unless browser behavior genuinely requires an end-to-end test.

## Feature map

| Feature | UI owner | Persistence/API | Smallest useful check |
| --- | --- | --- | --- |
| Initialize roadmap | `InitWizard`, `roadmap.js` | context, questions, timeline, node files, graph | `scripts/roadmap.test.mjs` |
| Edit graph | `Canvas`, `App` | `GET/PUT /api/graph` with revision | create/drag/connect, reload |
| Navigate large graphs | `Canvas`, `graphView.js` | UI-only projection | `scripts/graphView.test.mjs` + zoom/focus/fold combinations |
| Edit node log | `Sidebar` | `GET/PUT /api/node/:id` | type, wait 1s, reload |
| Merge evidence | `MergeModal`, `App` | graph + optional `/api/summarize` | test with Ollama on and off |
| Edit compass/RQs | `CompassView`, `QuestionsView` | context/questions + change report | edit wording, review, reload |
| Timeline | `TimelineBar`, `timelineStatus.js` | `GET/PUT /api/timeline` | `scripts/timelineStatus.test.mjs` |
| Research review | `ReviewView` | derived from loaded state | verify each empty/open category |
| Agent automation | `.agents/skills`, semantic endpoints | `/api/research/*` | use API demo only on disposable data |

## Data contracts

Writes to graph, questions, and timeline are checked by `contracts.js`. Keep the runtime validator, this document, `README.md`, and agent skills aligned.

### IDs

- Node, edge, month, and milestone IDs match `[\w-]{1,80}` and are unique within their collection.
- Research-question IDs match `RQ<n>`.
- Every graph edge references existing nodes.
- Every graph node and edge has a matching Markdown document. Write entity documents before the layout projection.

### Runtime graph projection

```js
{
  nodes: [{
    id,
    position: { x, y },
    data: {
      title,
      status: 'active' | 'merged' | 'dead',
      outcome,
      anchor?, met?, exitCriteria?,
      role?, kind?, tags?, color?,
      rq?, finding?, contribution?
    }
  }],
  edges: [{ id, source, target, data: { kind: 'step' | 'merge', note? } }],
  revision
}
```

Project, objective, and research-question nodes use `anchor: true`. Objective nodes additionally own `met` and `exitCriteria`. RQ anchors use `role: 'research-question'` and `questionId: 'RQ<n>'`; do not reuse `data.rq`, which means an evidence contribution. If `data.rq` exists, it must reference `questions.json`; `finding` is `positive`, `negative`, or `neutral`. A node counts as RQ evidence only after its status becomes `merged`.

The HTTP API uses this hydrated React Flow shape for compatibility. On disk, node `data` lives in `nodes/<id>.md`, edge endpoints/data live in `edges/<id>.md`, and `graph.json` stores only `{ nodes: [{ id, position }], revision }`. Node frontmatter links to incoming/outgoing edge documents; edge frontmatter links to source/target node documents. The server owns reciprocal updates.

### Questions

```js
{ questions: [{ id: 'RQ1', text, obj, status, answer }] }
```

`obj` is a zero-based objective index or `-1` for general. `status` is `open`, `partial`, or `answered`. `questions.json` owns RQ wording and answers; the server rewrites `layer3_research_question.txt` after every question update.

### Timeline

```js
{ months: [{ id, title, milestones: [{ id, title, obj, nodeIds: [] }] }] }
```

`obj` is a zero-based objective index or `-1`. `nodeIds` may be empty while work is only planned. There is no manual completion flag: status comes from linked graph nodes. Do not duplicate a node's status inside timeline data.

Selecting a milestone is a view filter, not durable state: every linked node is highlighted, unrelated graph content is dimmed, and the first linked node opens in the Sidebar. Do not store this selection in `timeline.json`.

The dependency DAG is derived by `graphView.js`, not stored as duplicate edge data. Traversal follows only importance-respecting, non-cycling dependency edges. Backedges, merge/evidence edges, and cycle-closing same-level edges remain visible references. Fold roots own outgoing private descendants; do not implement traversal directly in a component.

## Contracts for new development

1. Trace all readers and writers of a field before changing its shape. Search the UI, server, skills, README, and docs.
2. Put node meaning in its Markdown metadata/body, relationship meaning in its edge document, and UI-only state in `graph.json`. Do not mirror evidence, completion, or RQ text.
3. Validate user/agent input in `server.js` or `contracts.js`; UI validation is convenience, not a boundary.
4. Preserve graph revision checks. A new graph write path must send `expectedRevision` or use a semantic server action that updates the current graph.
5. Keep graph and Markdown lifecycle together: create documents before layout references; update both sides of a link; remove links before deleting a node document.
6. A non-trivial pure rule gets one Node `assert` test. A UI-only layout change gets a short manual checklist.
7. Update the feature map and API docs in the same change when behavior or a request body changes.
8. Do not add a dependency until the platform or installed stack cannot solve the problem in a few clear lines.

## Technical debt register

| Debt | Current decision | Revisit when |
| --- | --- | --- |
| `App.jsx` still coordinates many workflows | Keep orchestration together; initialization was extracted because it is pure and independently testable | A second view needs the same graph persistence/history logic, or changes repeatedly conflict in `App.jsx` |
| `server.js` uses synchronous file I/O | Acceptable for localhost, one-user data and keeps write ordering obvious | Large files cause visible latency or the server gains concurrent remote users |
| Multi-file writes are not atomic | Write dependent files first, graph last | Interrupted writes or agent/browser concurrency causes real inconsistency |
| External edits only live-refresh graph | Context/questions/timeline refresh on reload | Agents commonly update those files while the browser is open |
| Browser tests are manual | Pure domain rules use Node assertions | Regressions appear in critical flows such as merge, undo, or structural review |
| OpenAPI focuses on semantic agent actions | Lower-level UI endpoints remain documented in `docs/API.md` | External clients need generated SDKs for every endpoint |

Do not pay down these items speculatively. Each row names the condition that justifies the extra machinery.
