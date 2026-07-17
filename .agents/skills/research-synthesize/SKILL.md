---
name: research-synthesize
description: Gather merged Research Navigator evidence for one research question, separate support from contradiction, identify gaps, and draft a candidate answer for researcher approval. Use when asked to synthesize results or answer an RQ.
---

# Research Synthesize

The researcher owns the claim. Gather and draft; never decide the answer for them. Resolve `<data-dir>` from `RESEARCH_DATA_DIR` in `.env.local`, falling back to `research_data`, and use only that directory.

1. Read `AGENTS.md`, `<data-dir>/PROJECT.md`, and `<data-dir>/STATE.md`, then `<data-dir>/questions.json`; use the named RQ or ask which one.
2. Find its research-question node and follow incoming `evidence` edges. Keep only merged source nodes. Objective membership and active work are not evidence.
3. Read those source node bodies and the evidence-edge rationales. Follow `resolves` to relevant aspect syntheses and read related objective exit criteria.
4. Show a compact evidence table. Separate support from contradiction/mixed findings and name uncovered parts of the RQ.
5. Draft a bounded candidate answer with caveats, then ask the researcher to edit or approve it.
6. Before any write, name `<data-dir>/questions.json` and the exact answer/status change. Only after explicit approval update it as directed, then refresh `<data-dir>/STATE.md`.

Do not modify node metadata or invent evidence links. Suggest a Synthesis node when longer analysis should remain on the map. Distinguish evidence, inference, and uncertainty.
