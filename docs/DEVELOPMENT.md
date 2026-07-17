# Development guide

Read `AGENTS.md`, then use this feature map. Do not scan the whole repository.
Never use `research_data/`, `research_data.local/`, or another configured real
research directory as a fixture; tests create a temporary directory.

## Commands

```bash
npm test
npm run build
npm run check
node scripts/research-cli.mjs preview --input project.json
node scripts/research-cli.mjs init --input project.json
node scripts/research-cli.mjs state
npm run research:preflight
```

The direct CLI defaults to `RESEARCH_DATA_DIR` and then `research_data/`.
`npm run research -- <command>` also loads `.env.local`. Always pass an explicit
temporary `--data-dir` in tests and examples that write.

## Feature map

| Change | Read first | Check |
| --- | --- | --- |
| Schema/frontmatter | `core/contracts.js`, `core/research-doc.js` | contract/doc tests |
| Progress/evidence/priorities | `core/research-domain.js` | `research-domain.test.mjs` |
| Lifecycle/semantic writes | `core/research-actions.js` | `research-actions.test.mjs` |
| Init or generated context | `core/research-project.js`, `InitWizard.jsx` | `research-project.test.mjs` |
| Home/team/tasks | `HomeView.jsx`, `Sidebar.jsx` | domain tests + build |
| Map behavior | `Canvas.jsx`, `graphView.js` | `graphView.test.mjs` |
| Timeline | `TimelineBar.jsx`, `timelineStatus.js` | timeline test |
| HTTP | `server.js`, `src/api.js`, `docs/API.md` | tests + build |
| Agent routing/context | `core/research-context.js`, MCP script, relevant skill | `research-context.test.mjs` |
| Agent writes/init | CLI/MCP script and relevant skill | temp-data CLI check |
| Git/Journey | `core/git-awareness.js`, `JourneyView.jsx` | read-only temp-repo check |

## Durable contract

Node roles: `project`, `objective`, `research-question`, `aspect`, `idea`,
`task`, `experiment`, `decision`, `synthesis`, `note`.

Statuses: `active`, `merged`, `dead`, `retired`, `superseded`. `blocked` is
derived from unresolved `depends-on` edges.

Relationships: `step`, `depends-on`, `informs`, `evidence`, `resolves`.
Relationships are first-class Markdown documents. RQs and objectives are
many-to-many through `question.objectiveIds`; actual contribution requires an
explicit `evidence` edge to the RQ node.

An aspect has one incoming `resolves` edge from its closing synthesis. A merged
closing synthesis resolves the aspect. An objective is ready for review when all
non-retired aspects resolve, but `met` is a separate human decision.

Tasks are graph nodes, not a second database. They may have `assignees`, `due`,
and `pinned`. Members come from `team.json`. Milestone completion and due-date
warnings are derived.

## Change rules

1. Search every reader/writer of a field you change.
2. Put reusable meaning in the domain modules, not a component.
3. Keep edge meaning in edge files and node narrative in node files.
4. Regenerate `STATE.md` after semantic writes; a stale fingerprint is visible.
5. Keep agent writes explicit and semantic. Do not make agents Git writers.
6. Add one small assertion for a non-trivial pure rule.
7. Update this feature map and API docs when ownership or shapes move.
8. Finish with `npm run check`.
