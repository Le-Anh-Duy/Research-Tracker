---
name: research-export
description: Generate a shareable markdown snapshot of the current research roadmap (topic, objectives, timeline progress, active/merged/dead branches, tags) from research_data/. Use when the user wants to export, share, summarize, or report the current state of their roadmap — e.g. for a teammate without Codex, a status update, or a thesis progress section.
---

# Research Export

Produce a **read-only** snapshot of the current roadmap for sharing outside the app. Never modify `research_data/` — this skill only reads.

## Gather

- `research_data/context/layer1_topic.txt`, `layer2_objective.txt`
- `research_data/questions.json` — each RQ's `text`, `status`, `answer`
- `research_data/graph.json` — every node's `title`, `status`, `outcome`, `tags`, `rq`, `finding`, `contribution`, `exitCriteria`, `met`, and every edge
- `research_data/timeline.json` (if it exists) — months/milestones and their `nodeIds`
- Read a node's `.md` under `research_data/nodes/` only when you need more color than `outcome` gives you.

## Produce this markdown (adapt sections; omit any that are empty)

```markdown
# <topic>
_Snapshot: <today's date>_

## Research questions — where the answers stand
- **RQ1** _(answered)_: <the answer text>
- **RQ2** _(partial)_: <answer so far> — gaps: <what's still missing, inferred from which objectives aren't met / which findings are absent>
- **RQ3** _(open)_: not yet answered
_This is the section that matters most — RQs are the destination._

## Objectives — done criteria & status
- **O1: <objective>** — ✅ met / ⬜ not met · done-when: <exitCriteria> · <n> merged · <n> active · <n> dead

## Evidence by question
- **RQ2** ← _<node title>_ [positive/negative/neutral]: <contribution>

## Timeline
- **Month 1 — <title>**: <done>/<total> milestones
  - [x] <done milestone>
  - [ ] <not-yet-done milestone>
(omit if timeline.json has no months)

## Active branches
- <node title>  <!-- group by tag when tags are present, e.g. under a "### alice" heading -->

## Dead ends
- <node title> — <one-line reason, from its .md if not obvious>
```

Lead with **Research questions** — a progress report on an academic project is measured by which questions are answered, not how many scripts ran. Group **Active branches** by tag when any node has `data.tags` so "who's on what" reads straight off the export. Under **Evidence by question**, list each merged node with a `rq` so a reader sees the experiment→answer chain (negative findings included — they're results, not omissions).

## Delivery

Default: print the report directly in your reply so the user can paste it into Slack, email, or a thesis draft. Only write it to a file if asked — save it as `ROADMAP_SNAPSHOT.md` at the repo root (NOT inside the gitignored `research_data/`), so it's something a teammate can actually receive or a commit can carry.
