---
name: research-synthesize
description: Gather merged Research Navigator evidence for one research question, separate support from contradiction, identify gaps, and draft a candidate answer for researcher approval. Use when asked to synthesize results or answer an RQ.
---

# Research Synthesize

The researcher owns the claim. Gather and draft; never decide the answer for them.

1. Read `questions.json`; use the named RQ or ask which one.
2. Read node frontmatter and collect every node whose `status` is `merged` and `rq` matches. Active nodes are planned work, not evidence.
3. Read those node bodies and relevant edge documents when more context is needed. Read matching objective exit criteria and `met` state.
4. Show a compact evidence table. Separate support from contradiction/mixed findings and name uncovered parts of the RQ.
5. Draft a bounded candidate answer with caveats, then ask the researcher to edit or approve it.
6. Only after approval, update the RQ's `answer` and set `status` to `partial` or `answered` as directed.

Do not modify node metadata or invent evidence links. Suggest a Synthesis node when longer analysis should remain on the map.
