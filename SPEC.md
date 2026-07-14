> **Superseded:** this spec has been implemented (with an Anthropic-style theme, an init wizard, and agent skills instead of the retro terminal look). See `README.md` for current docs. Kept for history.

# Technical Specification: Retro Research Navigator

A local-first web app for tracking academic research progress as a git-style branching graph. All data lives in flat files (`.md` + `.json`). Retro terminal aesthetic. Single user, runs on localhost only.

## 1. Tech Stack (fixed — do not substitute)

- **Frontend:** React 18 + Vite. Plain JavaScript or TypeScript, agent's choice, but no other frameworks.
- **Graph:** `@xyflow/react` (React Flow v12). ⚠️ NOT `react-flow-renderer` — that package is deprecated and must not be installed.
- **Styling:** Tailwind CSS.
- **Backend:** One single-file Express server (`server.js`) that (a) exposes the file CRUD API, (b) proxies nothing else. Run alongside Vite dev server; Vite proxies `/api` to it.
- **AI:** `fetch` to Ollama at `http://localhost:11434/api/generate`, model name read from `research_data/config.json` (default `"llama3.2"`). Every AI call MUST use `AbortSignal.timeout(5000)`. On timeout / connection refused / non-200 → fall back to manual input UI. The app must be 100% functional with Ollama off.
- **No database. No auth. No cloud. No state management library** (React useState/useContext is enough).

## 2. Data Layer

All data in `/research_data` at project root. The server is the only thing that reads/writes it. Create the folder + seed files on first run if missing.

```
/research_data
  config.json                 # { "ollamaModel": "llama3.2" }
  graph.json                  # nodes + edges (schema below)
  context/
    layer1_topic.txt
    layer2_objective.txt
    layer3_research_question.txt
  nodes/
    <nodeId>.md               # freeform log for each node
```

### graph.json schema

```json
{
  "nodes": [
    {
      "id": "n_1720900000000",
      "position": { "x": 100, "y": 100 },
      "data": {
        "title": "Baseline GeoCLIP eval",
        "status": "active",
        "outcome": ""
      }
    }
  ],
  "edges": [
    { "id": "e_a_b", "source": "n_a", "target": "n_b", "kind": "step" }
  ]
}
```

- `status`: `"active"` | `"merged"` | `"dead"`. No other node types exist.
- `edge.kind`: `"step"` (normal progression) | `"merge"` (branch merged back).
- Node id = `n_` + `Date.now()`. Markdown file is always `nodes/<nodeId>.md`.
- Title/status/outcome live ONLY in graph.json. Do not parse Markdown frontmatter.

### Server API (all JSON)

```
GET  /api/graph                 → graph.json
PUT  /api/graph                 → overwrite graph.json (body = full graph)
GET  /api/node/:id              → { content: "<markdown string>" }
PUT  /api/node/:id              → write markdown  (body = { content })
GET  /api/context               → { layer1, layer2, layer3 }
PUT  /api/context/:layer        → write one layer file (layer ∈ 1|2|3)
POST /api/summarize             → body { nodeId }; server reads the node's .md,
                                  calls Ollama, returns { title, outcome } or
                                  { error: "AI_OFFLINE" } on any failure
```

Writes are whole-file overwrites. No locking, no versioning — single local user.
<!-- ponytail: whole-file overwrite; add write-queue only if corruption ever observed -->

## 3. UI / UX — Retro Terminal

- **Fonts:** monospace only (`"JetBrains Mono", "Fira Code", "Courier New", monospace`).
- **Colors:** black background `#000000`, green phosphor text `#33FF00`, dim green `#1a8000` for dead branches / secondary text, amber `#FFB000` for the selected node.
- **Style rules:** `border-radius: 0` everywhere. No shadows, no gradients. Borders are `1px solid #33FF00`. Hover = invert (green bg, black text). Buttons look like `[ MERGE ]` — square brackets in the label.
- **Layout:**
  - **Top bar (fixed):** three lines of raw text, always visible:
    `L1_TOPIC > ...` / `L2_OBJECTIVE > ...` / `L3_RQ > ...` — each truncated to one line, click a line to open a plain textarea editor for that layer file.
  - **Center:** React Flow infinite canvas (dot grid background, dots in dim green).
  - **Right sidebar (~40% width, toggleable):** opens when a node is clicked. Contains: title input, status display, a plain `<textarea>` for the node's Markdown, and a `[ MARK DEAD ]` button.
- Markdown editing is a raw textarea. **No WYSIWYG, no markdown preview, no editor library.** It's a lab log, not a publishing tool.

## 4. Core Behaviors

### 4.1 Node lifecycle
- **Double-click empty canvas** → create node at that position (`status: "active"`, title `"untitled"`, empty `.md` file created via API), open it in sidebar.
- **Click node** → open sidebar with its Markdown. Autosave the textarea with a **1-second debounce** (PUT `/api/node/:id`). Also flush on blur. No save button.
- **Drag between node handles** → create a `step` edge.
- **`[ MARK DEAD ]`** → set `status: "dead"`. Dead nodes render dim green with strikethrough title. Never deleted.
- Node drag / create / edge create → PUT full graph (debounced 1s).

### 4.2 Merge flow (the one AI feature)
1. User selects an edge (or drags a new edge) and clicks `[ MERGE ]` in the sidebar / edge context.
2. A retro modal opens: black, green border, blinking `>_` cursor, text `[SYSTEM] MERGING BRANCH... CALLING LOCAL AI`.
3. Client calls `POST /api/summarize { nodeId: <source node> }`.
   - **Success:** modal shows returned Title + Outcome in two editable inputs (user can fix them), plus `[ CONFIRM ]`.
   - **Failure:** modal shows `[SYSTEM_ERR] Local AI offline. Enter Task Title & Outcome manually >_` with the same two (empty) inputs and `[ CONFIRM ]`.
4. On confirm: source node → `status: "merged"`, its `title`/`outcome` updated, edge `kind: "merge"` (render it dashed). Save graph.

Ollama prompt (server-side, keep verbatim):
```
You are a research log summarizer. Given the raw lab notes below, reply with ONLY valid JSON: {"title": "<max 8 words>", "outcome": "<max 25 words, what was learned/decided>"}. Notes:
<markdown content>
```
Parse the response; if JSON parsing fails, treat as AI_OFFLINE fallback.

### 4.3 Context layers
- Displayed read-only in top bar, edited manually via click → textarea → save on blur.
- **The AI never writes to layer files.** They are the user's compass; only the user moves the compass.

## 5. Seed Data (create on first run)

`layer1_topic.txt`:
```
Explainable Visual Geolocation via In-Place Soft-Masked Attention Intervention (CV / OSINT / XAI)
```

`layer2_objective.txt`:
```
O1: Inject Grounding DINO bounding boxes into self-attention of frozen geolocation backbones (GeoCLIP). O2: Evaluate robustness under domain shift (night, weather, viewpoint). O3: Analyze explainability & faithfulness via deep-layer attention propagation.
```

`layer3_research_question.txt`:
```
RQ1: How to extract localized visual clues from an open-vocab detector and integrate into a geolocation backbone? RQ2: Effect of explicit local clues on accuracy + environmental robustness on corrupted benchmarks? RQ3: Explainability & efficiency gains of training-free masking vs black-box baselines and VLMs?
```

`graph.json`: one starter node titled `"PROJECT START: env setup + GeoCLIP baseline"`, status `active`, at `{x: 250, y: 250}`, with matching `nodes/<id>.md` containing `# GeoCLIP baseline\n\n- [ ] reproduce GeoCLIP eval on IM2GPS3K\n`.

## 6. Development Phases

Each phase ends with a runnable "Done when" check. Do not start a phase until the previous one's check passes.

- **Phase 1 — Skeleton.** Vite + React + Tailwind + Express with `/api/context` wired to real files (seed them). Render top bar with the 3 layers, black/green retro styling, empty canvas area.
  *Done when:* `npm run dev` shows the 3 seeded layer lines; editing a layer and reloading persists.
- **Phase 2 — Graph.** `@xyflow/react` canvas, custom retro node component, double-click create, drag edges, all persisted through `/api/graph`.
  *Done when:* create 3 nodes + 2 edges, restart both servers, everything is still there.
- **Phase 3 — Node log.** Sidebar with debounced-autosave textarea backed by `/api/node/:id`, `[ MARK DEAD ]`, dead-node styling.
  *Done when:* type in a node, wait 2s, kill the browser, reopen — text persisted; a dead node renders dim + strikethrough.
- **Phase 4 — Merge + AI.** `/api/summarize` with 5s timeout, retro modal, both AI and manual paths, merged-node + dashed-edge styling.
  *Done when:* merge works with Ollama running AND with Ollama stopped (manual fallback).
