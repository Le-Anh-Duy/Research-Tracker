# Local API and agent surfaces

The HTTP API has no authentication and is for trusted localhost use. The CLI
works while the web server is stopped; MCP is a thin JSON-RPC wrapper over the
same project layer.

## Initialization and orientation

```text
POST /api/research/init/preview   preview only
POST /api/research/init           create a new project; never overwrites
GET  /api/research/state          full state + STATE.md stale fingerprint
GET  /api/graph
GET  /api/context
GET  /api/questions
GET  /api/timeline
GET  /api/team
```

CLI equivalents:

```bash
node scripts/research-cli.mjs preview --input project.json
node scripts/research-cli.mjs init --input project.json
node scripts/research-cli.mjs state
node scripts/research-cli.mjs refresh-state
node scripts/research-cli.mjs apply --input operation.json
npm run research:export -- --output PLAN_EXPORT.md
```

`npm run research`, `npm run research:mcp`, and `npm run research:export` load
`RESEARCH_DATA_DIR` from the ignored `.env.local`, falling back to
`research_data/`. Direct CLI calls use the process environment or an explicit
`--data-dir <path>`. Once resolved, that directory is the only active research
state for the operation.

## Writes

```text
PUT  /api/graph                  nodes, edges, expectedRevision
PUT  /api/questions              { questions }
PUT  /api/timeline               { months }
PUT  /api/team                   { members }
GET/PUT /api/node/:id            Markdown body only
POST /api/research/nodes         semantic node creation
POST /api/research/links         typed relationship creation
POST /api/research/log           append dated note
POST /api/research/dead-end       preserve failed route
POST /api/research/merge          merge result/synthesis and optional RQ evidence
POST /api/research/apply          shared create/patch/connect/transition/objective operation
GET  /api/research/export         deterministic hierarchy + Mermaid timeline Markdown
```

Every structural write is validated. Agent workflows must inspect first,
announce exact intended edits, and write only after an explicit user request.
RQ answers, aspect retirement, and objective completion require human approval.

## Read-only Git

```text
GET /api/git/activity            research changes, commits, checkpoints
GET /api/git/snapshot/:ref       historical graph reconstructed in memory
```

Accepted refs are commit hashes or `research/checkpoint/*` tags. These endpoints
never check out, commit, branch, tag, pull, push, merge, or revert.

Swagger remains available at `http://localhost:3001/api-docs`; update
`openapi.js` when adding a public HTTP operation.
