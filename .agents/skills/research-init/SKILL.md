---
name: research-init
description: Interview the user to define or restart a Research Navigator roadmap, then scaffold research_data/ with objectives, questions, first work, and an optional fog-of-war timeline. Use when the user asks to initialize a research project in this repo.
---

# Research Init

Act as interviewer, not planner. Ask one question at a time and never invent the researcher's objectives, claims, tasks, or milestones.

1. Ask for the topic in one or two sentences.
2. Ask for 2-4 measurable objectives.
3. Ask which research question each objective serves; allow general RQs.
4. For each objective, ask for its first concrete work and falsifiable exit criterion.
5. Offer a fog-of-war timeline: detail the current month, leave later months broad, and add one O/RQ progress review to every month.
6. Ask whether initial nodes should be connected or floating.

Before writing, read `docs/RESEARCH_WORKFLOW.md` and the data contracts in `docs/DEVELOPMENT.md`. If `research_data/graph.json` exists, confirm before replacing it.

Write:

- Context text files for topic, objectives, and RQs.
- `questions.json` with `{ id: "RQ<n>", text, obj, status: "open", answer: "" }`.
- `timeline.json` only when requested. Milestones contain `nodeIds: []`; completion is derived later.
- One `nodes/<id>.md` per project, objective, research question, and first Work node. RQ nodes use `role: "research-question"`, `questionId: "RQ<n>"`, and remain distinct from objectives. Put all node meaning in frontmatter and notes in the body.
- One `edges/<id>.md` per requested initial relation. Put endpoints and relation meaning there.
- `graph.json` with only node IDs, positions, and `revision: 0`.

Use the exact frontmatter convention emitted by `research-doc.js`: JSON values on one line, node `from/to` linking edge files, and edge `from/to` linking node files. Maintain reciprocal links. IDs must match `[\w-]{1,80}`. Project, objective, and RQ nodes use `anchor: true`; first tasks use `role: "work"`; all new statuses are `active`.

Do not modify `config.json`. Finish by telling the user to run `npm run dev` and open `http://localhost:5173`.
