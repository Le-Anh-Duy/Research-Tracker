# Research Navigator API

The API is a local HTTP API for the Research Navigator app. It writes directly to `research_data/` and has no authentication. Use it only from a trusted local agent or local script.

Data shapes and cross-file invariants are documented in [DEVELOPMENT.md](DEVELOPMENT.md). Node and edge frontmatter is hidden behind the API; note endpoints read and write Markdown bodies only. Graph, question, and timeline writes that violate runtime contracts return HTTP `400`.

Interactive Swagger UI: `http://localhost:3001/api-docs`

OpenAPI JSON: `http://localhost:3001/api/openapi.json`

Start the server:

```bash
npm run dev
```

The API is normally available at `http://localhost:3001`. To use another port:

```powershell
$env:PORT = 3011
node server.js
```

## State

### `GET /api/research/state`

Returns the complete current state for an agent: graph, timeline, questions, and compass context.

```bash
curl http://localhost:3001/api/research/state
```

## Research Actions

All request bodies are JSON.

### `POST /api/research/nodes`

Creates a node and its Markdown file. Omit `parentId` to create a floating node. Include `parentId` to create the node and a `step` link together.

```json
{
  "title": "Test detector vocabulary",
  "role": "experiment",
  "tags": ["agent-demo", "detector"],
  "parentId": "n_o1",
  "content": "# Test detector vocabulary\n\n- [ ] Run the test\n"
}
```

Useful fields: `title`, `role`, `kind`, `status`, `outcome`, `tags`, `position`, `parentId`, `link`, and `content`.

Response:

```json
{ "node": { "id": "n_..." }, "edge": { "id": "e_..." }, "floating": false }
```

### `POST /api/research/links`

Creates a link between existing nodes. `kind` can be `step` or `merge`.

```json
{
  "source": "n_exp_1",
  "target": "n_syn_1",
  "kind": "merge",
  "note": "This experiment contributes evidence to the synthesis."
}
```

### `POST /api/research/log`

Appends a dated Markdown note to a node.

```json
{
  "nodeId": "n_exp_1",
  "note": "The baseline was reproduced on the fixed sample."
}
```

Optional `date` overrides the automatic local log date.

### `POST /api/research/dead-end`

Marks a node as `dead` and stores the reason in its outcome.

```json
{
  "nodeId": "n_exp_1",
  "reason": "The preprocessing changed two variables at once."
}
```

### `POST /api/research/merge`

Marks a node as `merged`, changes its outgoing edges to `merge`, and optionally records its relationship to an RQ.

```json
{
  "nodeId": "n_exp_1",
  "title": "Crop-aware mapping validated",
  "outcome": "Boxes align with the intended ViT patches.",
  "rq": "RQ1",
  "finding": "positive",
  "contribution": "Supports the mapping part of RQ1."
}
```

`finding` must be `positive`, `negative`, or `neutral`.

### `POST /api/change-reports`

Writes a Markdown audit trail for an approved topic, objective, or research-question change.

## Existing File Endpoints

These lower-level endpoints are still available for UI and tooling:

```text
GET    /api/graph
PUT    /api/graph
GET    /api/context
PUT    /api/context/:layer
GET    /api/questions
PUT    /api/questions
GET    /api/timeline
PUT    /api/timeline
GET    /api/node/:id
PUT    /api/node/:id
DELETE /api/node/:id
POST   /api/summarize
POST   /api/change-reports
```

For agent workflows, prefer the semantic `/api/research/*` actions. They preserve the graph-plus-Markdown convention and make the agent's intent visible in the request sequence.

## Agent Demo

The repository includes a script that exercises the complete loop without editing JSON manually:

```bash
node scripts/research-api-demo.mjs
```

It creates a floating hypothesis, a linked branch, a lab note, a dead end, a synthesis node, evidence links, and a merged synthesis. The demo intentionally changes local `research_data/`; use it on demo data or reset the roadmap afterward.
