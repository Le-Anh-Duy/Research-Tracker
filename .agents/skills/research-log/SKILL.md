---
name: research-log
description: Record research progress in Research Navigator's research_data/ — append findings to a node's lab notes, branch experiments, mark dead ends, delete stray nodes, tag nodes, link milestones, merge with synthesis (link result to a research question + finding), create synthesis nodes, mark objectives met, and update RQ answers. Use when the user reports experiment results, a new idea, a dead end, wants to assign/tag work, or connects a result to a research question.
---

# Research Log

You are the lab scribe. Record what the user tells you into `research_data/`; do not editorialize or add conclusions they didn't state.

## Locate the node
Read `research_data/graph.json`, match the user's description against `data.title`. If ambiguous, ask which node they mean.

## Actions

**Append notes** to `research_data/nodes/<id>.md`:
```markdown

## <YYYY-MM-DD>
<what the user reported, kept in their voice — results, numbers, links, failures>
```

**Branch a new experiment:** add a node to graph.json (`id`: `n_` + timestamp, `status: "active"`, `outcome: ""`, no `anchor`), position it ~180px below its parent (offset x by ±60 if occupied), add an edge `{ "data": { "kind": "step" } }` from the parent, and create `nodes/<id>.md` with a `# <title>` heading and a `- [ ]` checklist of what they plan to try.

**Mark dead end:** set the node's `data.status` to `"dead"` and append a dated note explaining why (in the user's words). Prefer this over deleting — dead branches are the record of what was already tried, and it's what the "delete" action below should NOT be used for.

**Merge a finished branch (with synthesis):** ask the user (or derive from the .md, then confirm): a title (max 8 words) and an outcome (max 25 words) of what was learned or decided. Then set `data.title`, `data.outcome`, `data.status: "merged"`, and change outgoing edges to `"data": { "kind": "merge" }`. **Then do the synthesis step — this is the point of the whole app:** ask "which research question does this feed, and what does it say about it?" and set on the node: `data.rq` (e.g. `"RQ3"`), `data.finding` (`positive` if it supports the hypothesis, `negative` if against, `neutral` if mixed), and `data.contribution` (one line on what it says about that RQ). A negative or neutral finding is still evidence — record it, don't bury it. If the user genuinely can't connect it to an RQ yet, leave those three fields off and note it.

**Record an objective as met:** when the user says an objective's exit criterion is satisfied, set that objective node's `data.met: true`. Don't infer it yourself from progress — it's the user's call that enough evidence exists to answer the RQ. If they're grinding for marginal gains past their own exit criterion, gently point back at it.

**Answer / update a research question:** when the user states what they now believe about an RQ, open `research_data/questions.json`, find the question by `id`, and update its `answer` (their words, synthesized) and `status` (`open` → `partial` → `answered`). Never write an answer they didn't state. For a bigger synthesis pass across accumulated evidence, defer to the `research-synthesize` skill.

**Delete a node:** only for genuine mistakes — an empty "untitled" node, a duplicate, test clutter — never for an abandoned research direction (use "mark dead end" for that; it's the whole point of this app). Confirm with the user before deleting. Remove the node from `graph.json`, remove every edge where it's `source` or `target`, and delete `nodes/<id>.md`.

**Tag a node:** add/remove strings in `data.tags` (create the array if absent). Common use: a teammate's name, so "who's on what" is visible on the graph and in exports.

**Link a milestone:** if `research_data/timeline.json` exists and the user says they're starting or finished work tied to a milestone, add the relevant node's id to that milestone's `nodeIds` array. Milestones have no manual "done" flag — a milestone completes automatically once every node in its `nodeIds` has `status: "merged"`.

**Create a synthesis node:** a synthesis node's job is analysis, not running code — it's where evidence across several experiments gets written up toward an RQ answer. Same as branching a new experiment, but set `data.kind: "synthesis"`, usually set `data.rq`, and seed its `.md` with the analysis prompt rather than a task checklist. Draw `step` edges into it from the experiment nodes whose results it synthesizes.

**Floating nodes and action API:** if the user says a relationship is not known yet, create the node without a parent edge and record the intended relation in its Markdown note. For agent-driven tests, prefer the local action API (`POST /api/research/nodes`, `/api/research/links`, `/api/research/log`, `/api/research/dead-end`, `/api/research/merge`) over editing graph.json by hand. A node request without `parentId` creates a floating node.

## Rules
- Never edit `context/layer1_topic.txt` or `layer2_objective.txt` unless the user asks. RQ text lives in `questions.json` (the app regenerates `layer3_research_question.txt` from it) — edit `questions.json`, not layer3 directly.
- Keep graph.json valid: every node id matches `[\w-]+` and has a `nodes/<id>.md` file (except right after a delete, which removes both together).
- `data.rq` on a node must match an `id` in `questions.json`. Evidence per RQ is derived from these links — there is no evidence list to maintain.
- Preserve fields you don't understand (positions, measured sizes) — the UI owns them.
