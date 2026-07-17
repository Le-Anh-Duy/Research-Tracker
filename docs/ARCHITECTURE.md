# Architecture

Research Navigator is a desktop-first, local application. One Git repository is
one research project. It coordinates research; experiments, raw data, logs, and
checkpoints stay in external workspaces.

## Runtime

```text
Web UI -> HTTP API ----+
CLI / MCP / skills ----+-> research-project + research-actions -> <data-dir>/
                              |
                              +-> generated STATE.md
Git history ----------------------> read-only Journey projection
```

The shared domain is deliberately server-independent:

- `contracts.js`: durable shape validation;
- `research-doc.js`: Markdown frontmatter and wikilinks;
- `research-domain.js`: derived progress, evidence, blockers, warnings, priorities;
- `research-actions.js`: pure semantic graph operations and human-approval gates;
- `research-project.js`: project build/read/init/fingerprint/`STATE.md` generation;
- `git-awareness.js`: fixed-argument, read-only Git status/history/snapshots.

`server.js` adapts these operations to HTTP. `scripts/research-cli.mjs` and
`scripts/research-mcp.mjs` are offline agent surfaces. React is a projection and
working copy; it is not a second source of research truth.

`<data-dir>` resolves from `RESEARCH_DATA_DIR`; without it, the default is
`research_data/`. The npm entry points load the ignored `.env.local`, so runtime
and agent surfaces use the same configured directory. A path such as
`research_data.local/` is a private local override, not a second source of
truth. Git/Journey history remains scoped to tracked `research_data/` state.

## Durable sources

All paths below are relative to the resolved `<data-dir>`.

| File | Owns |
| --- | --- |
| `PROJECT.md` | Human-owned topic, approach, scope decisions |
| `STATE.md` | Generated agent/researcher orientation; fingerprint detects staleness |
| `nodes/<id>.md` | Node metadata and narrative |
| `edges/<id>.md` | Relationship type, endpoints, and rationale |
| `graph.json` | Canonical manual positions and layout revision only |
| `questions.json` | RQ wording, objective relationships, status, human answer |
| `timeline.json` | Periods, milestones, deadlines, linked node IDs |
| `team.json` | Informational project member registry |

Adjacency, blocked state, aspect/objective completion, milestone completion, RQ
evidence, warnings, and Home priorities are derived. Never store them twice.
Edge files exclusively own relationships; node frontmatter has no reciprocal
edge lists.

## UI ownership

| Area | Owner |
| --- | --- |
| Startup and full-state sync | `src/App.jsx`, `src/api.js` |
| Home and team | `HomeView.jsx` |
| Canonical graph | `Canvas.jsx`, `graphView.js` |
| Node/edge editing and external references | `Sidebar.jsx` |
| Objectives/RQs | `CompassView.jsx`, `QuestionsView.jsx` |
| Evidence projection | `EvidenceView.jsx` |
| Method checks | `ReviewView.jsx` |
| Read-only Git replay | `JourneyView.jsx`, `git-awareness.js` |
| Timeline | `TimelineBar.jsx`, `timelineStatus.js` |

## Authority and synchronization

Agents inspect by default. Before an agent writes, it states the files and
structural change, receives an explicit request, then uses a semantic surface.
Only a human approves an RQ answer, retires an aspect, or marks an objective met.

The browser polls the complete research fingerprint. It reloads graph, timeline,
questions, context, and team when external files change and no graph edit is
pending. Git integration never mutates the repository. Historical graphs are
rendered read-only and returned to current state by reloading `/api/graph`.
