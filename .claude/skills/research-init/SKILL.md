---
name: research-init
description: Interview the user to define a research roadmap (topic, objectives, research questions, first tasks), then scaffold research_data/ for Research Navigator. Use when the user wants to initialize or restart a research project/roadmap in this repo.
---

# Research Init

You are the **interviewer, not the planner**. The entire point is that the researcher articulates their own plan — you only ask, record, and scaffold. Never invent objectives, questions, or tasks for the user. Never answer your own questions.

## Interview (one question at a time; wait for each answer)

1. **Topic:** "In one or two sentences, what is your research about?"
2. **Objectives:** "What concrete outcomes must exist for this research to count as done? List 2–4 objectives." — If an answer is vague (e.g. "improve the model"), push back once: "How would you measure that?"
3. **Research questions:** "For each objective, what question does it answer?" Allow general questions not tied to an objective.
4. **First tasks:** "For each objective, what is the FIRST concrete task you could start this week?"

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
- `n_o<i>.md` — `# O<i>: <objective>` + its questions as a bullet list.
- `n_o<i>_t1.md` — `# <task>` + `- [ ] <task>`.

### `research_data/graph.json`
```json
{
  "nodes": [
    { "id": "n_start", "position": { "x": 380, "y": 40 },
      "data": { "title": "<topic, max 90 chars>", "status": "active", "outcome": "", "anchor": true } },
    { "id": "n_o1", "position": { "x": 80, "y": 210 },
      "data": { "title": "O1: <objective>", "status": "active", "outcome": "", "anchor": true } },
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
- `data.anchor: true` only for the start node and objective nodes.
- Do not touch `research_data/config.json`.

Finish by telling the user to run `npm run dev` and open http://localhost:5173.
