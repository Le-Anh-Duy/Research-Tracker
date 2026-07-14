# Research Navigator

A local-first research roadmap tracker. Your research lives as a **git-style branching graph**: objectives are lanes, experiments are branches, dead ends stay visible (grayed out, never deleted), and finished branches get *merged* with a one-line outcome. Built for researchers who lose the thread — the topic / objectives / questions "compass" is pinned on screen at all times.

**Everything is flat files.** No database, no cloud, no account. `research_data/` is plain Markdown + JSON you can read, edit, grep, and commit anywhere — and it's gitignored by default, so your actual research notes never end up in this repo's git history.

This checkout ships with a demo roadmap (see `research_data/`) purely so the graph isn't empty the first time you open it. It's local-only and untracked; see [Using this as a template](#using-this-as-a-template) for how to start your own project.

## Quick start

Requires Node.js 18+.

```bash
npm install
npm run dev        # API on :3001, app on http://localhost:5173
```

First launch opens a 5-step wizard: topic → objectives → research questions → first tasks → review. The questions are deliberately **not** answered by AI — the point is that *you* articulate your plan. The wizard scaffolds one lane per objective.

Production-ish: `npm run build && npm start` → everything on http://localhost:3001.

## How you use it

- **Double-click the canvas** → new experiment node. Click a node → sidebar with its Markdown lab notes (autosaves, 1s debounce).
- **Drag between node handles** → connect steps.
- **Mark dead end** → branch grays out with strikethrough. It stays on the map: the record of what you already tried is half the value.
- **Merge & summarize** → closes a branch with a short title + outcome. If [Ollama](https://ollama.com) is running locally it drafts the summary from your notes (5s timeout, model set in `research_data/config.json`); if not, you type it yourself. The app is fully functional without any AI.
- The top bar always shows your three context layers (topic / objectives / questions). Click a line to edit it. **The app never lets AI rewrite these** — they're your compass; only you move the compass.

## Data format

```
research_data/
  config.json          { "ollamaUrl": "...", "ollamaModel": "llama3.2" }
  graph.json           nodes + edges (React-Flow-compatible)
  context/
    layer1_topic.txt
    layer2_objective.txt
    layer3_research_question.txt
  nodes/<nodeId>.md    free-form lab notes, one per node
```

Node: `{ id, position: {x,y}, data: { title, status: "active"|"merged"|"dead", outcome, anchor? } }`.
Edge: `{ id, source, target, data: { kind: "step"|"merge" } }`.

Start a new research project by deleting (or archiving) `research_data/graph.json` — the wizard reappears.

## Use with coding agents

The repo doubles as an agent plugin. `.claude/skills/` ships two skills that any Claude Code session in this repo picks up automatically:

- **research-init** — the agent interviews you (one question at a time, it never plans *for* you) and scaffolds `research_data/` in the exact format above. An alternative to the UI wizard.
- **research-log** — tell the agent "ran the baseline, 34% A@1km, worse at night" and it appends dated notes to the right node, branches new experiments, marks dead ends, or merges finished branches.

Because the data layer is plain text with a documented schema, any agent (or script) can read and write your roadmap safely.

## Using this as a template

This repo is meant to be reused: one checkout per research project, each with its own `research_data/`.

- **Starting a new project:** don't just `git clone` this repo for real work — a plain clone keeps `origin` pointed at this same remote, so an accidental `git push` from inside a project lands in the template repo. Instead, either click **Use this template** on GitHub (makes an independent repo), or `git clone <url> my-project && cd my-project && git remote remove origin` before you begin.
- **Starting the roadmap itself:** delete `research_data/` (or just `graph.json`) and run `npm run dev` — the init wizard appears. If you're working with a coding agent instead of the UI, ask it to use the `research-init` skill (see below).
- **Developing the app itself** (new features, UI changes, new skills): work directly in this checkout. It's the one place `research_data/` content doesn't matter — feel free to reset it to the demo data any time.

## Stack

React + Vite, [@xyflow/react](https://reactflow.dev) for the graph, one single-file Express server for file I/O, plain CSS. No database, no state library, no Tailwind. Optional Ollama for summaries.

## License

MIT
