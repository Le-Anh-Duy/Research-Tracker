---
name: research-export
description: Generate a read-only, shareable Markdown snapshot of Research Navigator's topic, objectives, RQs, evidence, timeline, and active/dead work. Use for status reports, teammate handoffs, or thesis progress summaries.
---

# Research Export

Do not modify `research_data/`.

Read `PROJECT.md` and `STATE.md` first. Then gather only the questions, objectives, aspects, nodes, and edge rationales needed for the requested report. `graph.json` is layout only unless spatial order matters.

Produce a compact report, omitting empty sections:

1. Research questions: status and human-written answer.
2. Objectives: research/enabling kind, exit criterion, human met/open state, and `n of m aspects synthesized`.
3. Evidence by RQ: every merged source connected by an explicit `evidence` edge, including its rationale and finding when recorded.
4. Timeline: milestone progress derived from linked node statuses.
5. Up to five current priorities with their derived reasons, assignments, and due dates; then other active work.
6. Decisions and dead ends, including brief rationale.

Never invent an answer or interpret active work as evidence. Omit ideas and notes from progress. Include retired and superseded work only where it explains scope/history.

Print the report in the reply by default. Only when asked, write `ROADMAP_SNAPSHOT.md` at the repo root.
