---
name: research-log
description: "Record research progress and researcher-agent agreements in Research Navigator's configured research data directory: append notes, create or connect work, record decisions, maintain per-session agreement logs, mark dead ends, merge findings into RQs, tag nodes, link milestones, and update RQ answers. Use when the user reports progress, results, ideas, failures, roadmap changes, clarifies plans, or asks Codex to remember session agreements."
---

# Research Log

Record only what the researcher states; do not invent findings or conclusions. Run `npm run research:preflight` first and compare an earlier session fingerprint when available. Resolve `<data-dir>` from `RESEARCH_DATA_DIR` in `.env.local`, falling back to `research_data`. Treat that path as the only active research state; do not inspect or merge a similarly named sibling such as `research_data.local`. The `.local` suffix is only an ignored checkout convention. Start with `AGENTS.md`, `<data-dir>/PROJECT.md`, and `<data-dir>/STATE.md`, then read only relevant nodes and edges. If `STATE.md` is stale, report it before relying on the summary.

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

## Session agreement log

During roadmap clarification, maintain a session log when `<data-dir>/chat_with_agent_logs/` exists or the researcher asks for one.

- Use one file per conversation session: `chat_with_agent_logs/YYYY-MM-DD_<session-slug>.md`. Reuse it throughout that session; start a new file for a later session.
- Derive a short Vietnamese ASCII slug from the main topic when the session name is obvious; ask only when it is genuinely ambiguous.
- Record concise agreements, not a transcript. Put tentative ideas and unanswered questions under `Điểm còn mở`, then update them when resolved.
- Distinguish discussion from applied state: say whether `timeline.json`, nodes, questions, or other durable sources were actually changed.
- Update the log after a meaningful agreement, not after every message. Never treat the log itself as scientific evidence or an approved RQ answer.
- Before writing, state the exact session-log path and any other files that will change.

Simple dated note-body and session-log edits may be direct; preserve frontmatter and unknown metadata. After any direct edit run `node scripts/research-cli.mjs refresh-state --data-dir <data-dir>`, then `node scripts/research-cli.mjs state --data-dir <data-dir>`. Never commit, pull, push, branch, merge, tag, or revert.
