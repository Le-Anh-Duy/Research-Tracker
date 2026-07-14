---
name: research-synthesize
description: Help the researcher turn accumulated experimental evidence into an answer for a research question in Research Navigator. Gathers every experiment linked to an RQ, lays out what supports vs. contradicts it, and drafts a candidate answer for the human to edit and own. Use when the user asks to synthesize, "answer RQ2", "what do my results say about", pull findings together, or write up conclusions.
---

# Research Synthesize

The hardest, most-procrastinated part of research is turning a pile of experiments into a defensible answer. This skill does the *gathering and laying-out*; the human writes the actual claim. **You never decide the answer for them** — you surface the evidence and draft, they judge.

## 1. Pick the question
Read `research_data/questions.json`. If the user named an RQ, use it; else list the RQs with their current `status` and ask which one.

## 2. Gather the evidence (all derived, nothing new invented)
- From `research_data/graph.json`, collect every node with `data.rq === <that RQ id>`.
- For each: note its `title`, `finding` (positive/negative/neutral), `outcome`, `contribution`, and — if you need more than the one-liner — read its `nodes/<id>.md`.
- Also read the matching objective node(s) (`data.anchor` with the same `obj`): is `met` true? what was the `exitCriteria`?

## 3. Lay it out (show the user before drafting)
Present a compact table: each evidence node → finding → what it contributes. Separate **supports** from **contradicts/mixed**. Explicitly name gaps: "RQ2 asks about robustness under *weather*, but no linked experiment covers rain — the answer can't claim that yet." Negative findings are not failures to hide; per Objective-3-style reasoning, "the method depends on the detector" is itself a valid, publishable answer.

## 4. Draft, don't decree
Offer a candidate answer in the user's framing: what the evidence supports, how strongly, with what caveats and gaps. Keep it honest — a hedged "partial" answer is better than an overclaim. Then ask them to edit it.

## 5. Write back (only what they approve)
On the user's confirmation, update that question in `research_data/questions.json`:
- `answer`: the human-approved text.
- `status`: `partial` if gaps remain, `answered` only if they're satisfied the evidence settles it.

Do not touch node `data` here (that's `research-log`'s job), and do not invent evidence links. If the user wants to write a longer analysis, suggest a **synthesis node** (via `research-log`) so the prose lives on the graph next to its evidence.
