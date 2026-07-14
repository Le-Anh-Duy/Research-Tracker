---
name: research-log
description: "Record research progress in Research Navigator's research_data/: append notes, create or connect work, record decisions, mark dead ends, merge findings into RQs, tag nodes, link milestones, and update RQ answers. Use when the user reports research progress, results, ideas, failures, or roadmap changes."
---

# Research Log

Record only what the researcher states; do not invent findings or conclusions. Read `docs/RESEARCH_WORKFLOW.md` and `docs/DEVELOPMENT.md` before direct file writes.

## Locate and write

Read node frontmatter under `research_data/nodes/` and match by `title`. Ask if ambiguous. When the local server is running, prefer its semantic research API so node/edge documents and reciprocal links change together.

- Append a report to the node body as `## <YYYY-MM-DD>` plus the user's words.
- Create general implementation, reading, dataset, or preliminary-analysis activity as `role: "work"`; use `experiment`, `decision`, `synthesis`, or `note` only when that meaning is explicit.
- A floating node has no edge. A connected node requires an edge Markdown document and reciprocal node `from/to` references.
- Connect work directly to a research-question anchor when the relationship is known; do not treat the objective and RQ as the same entity.
- Store relationship rationale in the edge body, not in either node's notes.
- Mark a genuine failed direction `dead` and retain it. Confirm before deleting mistakes or test clutter.
- Merge only a meaningful result. Record concise `title`, `outcome`, and `status: "merged"`; then ask which RQ it informs, whether the finding is positive/negative/neutral, and its one-line contribution. Leave RQ fields absent if the researcher cannot connect it yet.
- Set an objective's `met: true` only when the researcher says its exit criterion is satisfied.
- Update `questions.json` only with a researcher-approved answer/status. Use `research-synthesize` for a larger synthesis.
- Link milestones by adding node IDs to `timeline.json`; milestone completion remains derived.

For direct writes, node metadata owns node meaning, edge metadata owns endpoints/kind, and `graph.json` owns layout/revision only. Preserve unknown metadata. Every edge must appear in its source node's `to` and target node's `from`. Never treat an active node linked to an RQ as evidence; only merged nodes count.
