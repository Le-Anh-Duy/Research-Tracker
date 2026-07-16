---
name: research-log
description: "Record research progress in Research Navigator's research_data/: append notes, create or connect work, record decisions, mark dead ends, merge findings into RQs, tag nodes, link milestones, and update RQ answers. Use when the user reports research progress, results, ideas, failures, or roadmap changes."
---

# Research Log

Record only what the researcher states; do not invent findings or conclusions. Start with `AGENTS.md`, `research_data/PROJECT.md`, and `research_data/STATE.md`, then read only relevant nodes and edges. If `STATE.md` is stale, report it before relying on the summary.

## Locate and write

Inspect first. Before writing, state the exact files and structural changes you intend to make. Write only because the researcher explicitly requested the update. Match stable IDs from `STATE.md`; ask when a title is ambiguous. Use `POST /api/research/apply` when the server runs or `node scripts/research-cli.mjs apply --input <operation.json>` offline for structural/lifecycle changes.

- Append a report to the node body as `## <YYYY-MM-DD>` plus the user's words.
- Create implementation, reading, dataset preparation, or analysis as `task`; use `idea`, `experiment`, `decision`, `synthesis`, or `note` when explicit. Give placed work one `homeAspect`; ideas/notes may remain floating.
- A floating node has no edge. A connection is one edge Markdown document; never add reciprocal lists to node frontmatter.
- Use `step` inside a route, `depends-on` for a blocker, `informs` for non-blocking knowledge, `evidence` for RQ contribution, and `resolves` only from one closing synthesis to its home aspect.
- Store relationship rationale in the edge body, not in either node's notes.
- Mark a genuine failed direction `dead` and retain it. Confirm before deleting mistakes or test clutter.
- Merge only a meaningful result and require an outcome. Ask which RQs it contributes to and create explicit evidence edges with rationale; objective membership is not evidence.
- Retire an aspect or set an objective's `met: true` only after the researcher explicitly approves that human decision. A resolved aspect comes from its merged closing synthesis, not a manual flag.
- Update `questions.json` only with a researcher-approved answer/status. Use `research-synthesize` for a larger synthesis.
- Link milestones by adding node IDs to `timeline.json`; milestone completion remains derived.

Simple dated note-body edits may be direct; preserve frontmatter and unknown metadata. After any direct edit run `node scripts/research-cli.mjs refresh-state`, then `state`. Never commit, pull, push, branch, merge, tag, or revert.
