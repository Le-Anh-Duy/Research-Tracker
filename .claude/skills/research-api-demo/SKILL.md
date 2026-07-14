---
name: research-api-demo
description: Run a local demo of the Research Navigator action API so the user can observe an agent creating floating nodes, branches, notes, dead ends, links, and synthesis.
---

# Research API Demo

Use only when the user explicitly asks to test or observe an agent-driven research workflow. This changes local `research_data/`.

1. Confirm the app is running at `http://localhost:3001`.
2. Run `node scripts/research-api-demo.mjs` from the repository root.
3. Report the created node ids and tell the user to refresh the app.

The demo creates a floating hypothesis, a linked branch, a Markdown log, a dead-end branch, a floating synthesis node, evidence links, and a merged synthesis linked to the first RQ.
