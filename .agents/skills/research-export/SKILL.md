---
name: research-export
description: Generate a read-only, shareable Markdown snapshot of Research Navigator's topic, objectives, RQs, evidence, timeline, and active/dead work. Use for status reports, teammate handoffs, or thesis progress summaries.
---

# Research Export

Do not modify `research_data/`.

Gather topic/objective context, `questions.json`, `timeline.json`, node frontmatter/bodies under `nodes/`, and edge frontmatter/bodies under `edges/`. `graph.json` contains layout only and is unnecessary unless spatial order matters.

Produce a compact report, omitting empty sections:

1. Research questions: status and human-written answer.
2. Objectives: exit criterion, met/open state, and related work counts.
3. Evidence by RQ: every merged node with its positive/negative/neutral finding and contribution.
4. Timeline: milestone progress derived from linked node statuses.
5. Active work, grouped by tag when useful.
6. Decisions and dead ends, including brief rationale.

Never invent an answer or interpret active work as evidence. Omit Note / dump nodes from progress counts unless the user asks for them. Follow edges when relationship rationale helps explain the evidence chain.

Print the report in the reply by default. Only when asked, write `ROADMAP_SNAPSHOT.md` at the repo root.
