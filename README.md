# Research Navigator

A desktop-first, local research coordination workspace for computational
researchers and coding-agent companions. It keeps objectives, research
questions, aspects, tasks, external experiments, evidence, people, and time in
one inspectable graph without running experiments itself.

The Map is the visible memory of the journey: branching ideas, failed routes,
cross-connections, and converging syntheses stay spatially understandable. Home
turns that graph into a practical list of at most five explained priorities.

## Quick start

Requires Node.js 18+.

```bash
npm install
npm run dev
```

Open `http://localhost:5173`. A new project starts with a six-step wizard:
topic, objectives, questions, first aspects, optional timeline, and preview.
Initialization creates plain Markdown and JSON only after confirmation.

```bash
npm run check                    # tests + production build
npm run research -- state        # check whether STATE.md is current
npm run research:mcp             # local stdio MCP server
```

## Research model

Each objective is decomposed into aspects. Every aspect owns a flexible work
DAG and one closing synthesis. Merging the synthesis resolves the aspect; the
objective then reports `n of m aspects synthesized`. A human decides whether
the reviewed objective is truly met.

Objectives and RQs are many-to-many. They are grouped visually, not with fake
separator nodes. A result contributes to an RQ only through an explicit
`evidence` relationship. Failed, retired, and superseded work remains visible.

Nodes: project, objective, research question, aspect, idea, task, experiment,
decision, synthesis, and note. Relationships: step, depends-on, informs,
evidence, and resolves.

## Flat-file project state

```text
research_data/
  PROJECT.md          human-owned compass and scope
  STATE.md            generated compact agent/researcher entry point
  team.json           informational member registry
  questions.json      RQs and human-approved answers
  timeline.json       periods, milestones, deadlines, linked work
  graph.json          canonical positions and layout revision only
  nodes/<id>.md        node metadata and narrative
  edges/<id>.md        relationship endpoints, type, and rationale
```

Edge files exclusively own relationships; adjacency and progress are derived.
The browser watches a full-state fingerprint and safely refreshes external
changes. Git is the collaboration contract. Journey can read status, commits,
`research/checkpoint/*` tags, and historical graphs, but the app never performs
Git mutations.

This template intentionally ignores `research_data/` because the maintainer's
local thesis notes are private. A project created from this template may choose
to track its own `research_data/` and synchronize it through Git.

## Agent-friendly development

An implementation agent starts with only:

1. `AGENTS.md`
2. `docs/ARCHITECTURE.md`
3. the relevant row in `docs/DEVELOPMENT.md`

It then reads the named owner, shared domain module, and nearest test. Research
agents start with `AGENTS.md`, `research_data/PROJECT.md`, and
`research_data/STATE.md`, then open only relevant node and edge files.

Agents inspect by default. Before writing, they state the exact files and
structural changes and wait for an explicit request. The `research-init` skill,
CLI, HTTP API, and MCP surface share the same initializer rather than
reimplementing multi-file writes.

## Interface

- **Home:** priorities, timeline, objective progress, evidence gaps, team, warnings.
- **Map:** canonical manually positioned research journey.
- **Compass:** human-owned topic, objectives, questions, and answers.
- **Evidence:** merged findings and syntheses grouped by RQ.
- **Review:** gaps, open branches, and ready-for-review work.
- **Export plan:** download a hierarchical Markdown report with a Mermaid event timeline from Review.
- **Journey:** read-only Git activity and historical graph replay.
- **Settings:** warm parchment or sepia-dark themes and Vietnamese-safe fonts.

External experiments remain in other repositories/folders. Experiment nodes may
record a portable repository URL, commit, run ID, and artifact-relative path.

Developer references: [architecture](docs/ARCHITECTURE.md),
[feature map](docs/DEVELOPMENT.md), [research workflow](docs/RESEARCH_WORKFLOW.md),
and [local API](docs/API.md).

## Stack

React, Vite, React Flow, Express, plain CSS, Markdown, JSON, and Git. Optional
Ollama summarization is a convenience, not a core dependency. License: MIT.
