---
name: research-log
description: Record research progress in Research Navigator's research_data/ — append findings to a node's lab notes, branch a new experiment node, mark a branch dead, or merge a finished branch with a title+outcome summary. Use when the user reports experiment results, a new idea to try, or a dead end.
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

**Mark dead end:** set the node's `data.status` to `"dead"` and append a dated note explaining why (in the user's words). Never delete nodes — dead branches are the record of what was already tried.

**Merge a finished branch:** ask the user (or derive from the .md, then confirm): a title of max 8 words and an outcome of max 25 words stating what was learned or decided. Then set `data.title`, `data.outcome`, `data.status: "merged"`, and change that node's outgoing edges to `"data": { "kind": "merge" }`.

## Rules
- Never modify `research_data/context/*.txt` unless the user explicitly asks to update their topic/objectives/questions.
- Keep graph.json valid: every node id matches `[\w-]+` and has a `nodes/<id>.md` file.
- Preserve fields you don't understand (positions, measured sizes) — the UI owns them.
