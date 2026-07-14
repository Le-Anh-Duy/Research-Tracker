---
name: research-init
description: Interview the user to define a research roadmap (topic, objectives, research questions, first tasks, optional month/milestone timeline), then scaffold research_data/ for Research Navigator. Use when the user wants to initialize or restart a research project/roadmap in this repo.
---

# Research Init

You are the **interviewer, not the planner**. The entire point is that the researcher articulates their own plan — you only ask, record, and scaffold. Never invent objectives, questions, tasks, or milestones for the user. Never answer your own questions.

## Interview (one question at a time; wait for each answer)

1. **Topic:** "In one or two sentences, what is your research about?"
2. **Objectives:** "What concrete outcomes must exist for this research to count as done? List 2–4 objectives." — If an answer is vague (e.g. "improve the model"), push back once: "How would you measure that?"
3. **Research questions:** "For each objective, what question does it answer?" Allow general questions not tied to an objective.
4. **First tasks + exit criteria:** For each objective ask two things: "What is the FIRST concrete task you could start this week?" and "What is the *done-when* — the exit criterion that tells you this objective has produced enough evidence to answer its question, so you stop tuning?" Push back once if the exit criterion is a moving target like "beats SOTA" — a good one is falsifiable and not about a leaderboard (e.g. "pipeline runs end-to-end and produces the metric on clean + corrupted sets").
5. **Timeline (optional):** "Do you want to rough out a timeline? If so, break the work into months, and each month into ~2-week milestones, tagged to an objective or general." Skip entirely if they'd rather plan as they go — don't push back on skipping this one.

Remember: RQs are the destination, objectives are how you get there. The exit criterion is what connects them — it defines when an objective has yielded enough to answer its RQ. Never invent exit criteria for the user.

## Initial links

Ask whether the initial objectives and first tasks should be connected or created as floating nodes. Respect the answer. If the user chooses floating initialization, create the nodes but omit the initial edges; do not invent relationships later.

## Then write these files (exact formats)

All paths relative to repo root. Overwrite only after confirming with the user if `research_data/graph.json` already exists.

### `research_data/context/layer1_topic.txt`
The topic verbatim.

### `research_data/context/layer2_objective.txt`
```
O1: <objective 1>
O2: <objective 2>
```

### `research_data/context/layer3_research_question.txt`
```
RQ1 (O1): <question tied to objective 1>
RQ2: <general question>
```

### `research_data/nodes/<nodeId>.md`
One markdown file per node. Free-form lab notes. For scaffolding use:
- `n_start.md` — `# <topic>` + the research questions.
- `n_o<i>.md` — `# O<i>: <objective>` + `**Done when:** <exit criterion>` + its questions as a bullet list.
- `n_o<i>_t1.md` — `# <task>` + `- [ ] <task>`.

### `research_data/graph.json`
```json
{
  "nodes": [
    { "id": "n_start", "position": { "x": 380, "y": 40 },
      "data": { "title": "<topic, max 90 chars>", "status": "active", "outcome": "", "anchor": true } },
    { "id": "n_o1", "position": { "x": 80, "y": 210 },
      "data": { "title": "O1: <objective>", "status": "active", "outcome": "", "anchor": true,
                "exitCriteria": "<done-when, or empty>", "met": false } },
    { "id": "n_o1_t1", "position": { "x": 80, "y": 390 },
      "data": { "title": "<first task>", "status": "active", "outcome": "" } }
  ],
  "edges": [
    { "id": "e_start_o1", "source": "n_start", "target": "n_o1", "data": { "kind": "step" } },
    { "id": "e_o1_t1", "source": "n_o1", "target": "n_o1_t1", "data": { "kind": "step" } }
  ]
}
```

Rules:
- Node ids: `[\w-]+` only. Every node in graph.json must have a matching `nodes/<id>.md` (create empty if needed).
- Layout: one column per objective, `x = 80 + column * 300`; start node centered above at `y: 40`; objectives `y: 210`; first tasks `y: 390`.
- `status` ∈ `active | merged | dead`. New nodes are always `active` with empty `outcome`.
- `data.anchor: true` only for the start node and objective nodes. Objective nodes carry `exitCriteria` (string, may be empty) and `met: false`.
- Optional node fields, omit unless relevant: `tags` (string[], teammate names), `kind: "synthesis"`, `rq` (e.g. `"RQ1"`), `finding` (`positive|negative|neutral`), `contribution` (string).
- Do not touch `research_data/config.json`.

### `research_data/questions.json`
```json
{
  "questions": [
    { "id": "RQ1", "text": "<question>", "obj": 0, "status": "open", "answer": "" }
  ]
}
```
`id` is `RQ<n>` (1-indexed). `obj` is the 0-indexed objective it belongs to, or `-1` for general. `status` starts `"open"` (later `partial` / `answered`, set by the researcher). `answer` starts empty — it's the living, human-written synthesis. **Do NOT store an evidence list here**; evidence is derived from any node whose `data.rq` equals this question's `id`. This file is the source of truth for RQ text; the app keeps `context/layer3_research_question.txt` in sync from it, so still write layer3 at init for the first render.

### `research_data/timeline.json` (only if step 5 wasn't skipped)
```json
{
  "months": [
    { "id": "m_1", "title": "Month 1 — <theme>", "milestones": [
        { "id": "m_1_ms_1", "title": "<milestone>", "obj": 0, "nodeIds": [] }
      ] }
  ]
}
```
`obj` is the 0-indexed objective the milestone belongs to, or `-1` for general. Leave `nodeIds` empty at init time — a milestone has no manual "done" flag, it completes automatically once every id in `nodeIds` reaches `status: "merged"` on a real node (link one later via `research-log` when the user actually starts that work).

Finish by telling the user to run `npm run dev` and open http://localhost:5173.
