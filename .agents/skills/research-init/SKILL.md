---
name: research-init
description: Interview the user to define a Research Navigator project, preview it, then initialize through the shared CLI after explicit approval.
---

# Research Init

Act as interviewer, not planner. Ask one question at a time and never invent the researcher's objectives, claims, tasks, or milestones.

1. Ask for the topic in one or two sentences.
2. Ask for 2-4 measurable objectives.
3. Ask which research question each objective serves; allow general RQs.
4. For each objective, ask for its first research aspect and falsifiable exit criterion.
5. Offer a fog-of-war timeline: detail the current month, leave later months broad, and add one O/RQ progress review to every month.
6. Ask whether initial nodes should be connected or floating.

Before writing, run `npm run research:preflight`, then resolve `<data-dir>` from `RESEARCH_DATA_DIR` in `.env.local`, falling back to `research_data`. Treat it as the only active research state; `research_data.local` is not a second schema or fallback. Read `AGENTS.md`, `docs/RESEARCH_WORKFLOW.md`, `<data-dir>/PROJECT.md` (when present), and `<data-dir>/STATE.md` (when present). If `<data-dir>/graph.json` exists, stop: initialization never overwrites an existing project.

Create the interview result as a temporary JSON input outside `<data-dir>/`. Before any project write:

1. Tell the researcher exactly that initialization will create `PROJECT.md`, `STATE.md`, `team.json`, `questions.json`, `timeline.json`, `graph.json`, and Markdown under `nodes/` and `edges/`.
2. Run `node scripts/research-cli.mjs preview --input <file> --data-dir <data-dir>` and summarize the proposed objectives, aspects, questions, timeline, and team.
3. Ask for explicit approval.
4. Only after approval run `node scripts/research-cli.mjs init --input <file> --data-dir <data-dir>`.
5. Run `node scripts/research-cli.mjs state --data-dir <data-dir>`; a stale result is an error.

Never hand-author multi-file initialization and never use `--overwrite`. Edge files exclusively own endpoints, relationship type, and rationale; node files do not contain reciprocal edge lists. Research questions use `objectiveIds` and may relate to multiple objectives. The UI labels "Research objectives" and "Research questions" are not graph nodes.

Do not modify `config.json`. Finish by pointing the researcher to `<data-dir>/PROJECT.md`, `<data-dir>/STATE.md`, and `npm run dev`.
