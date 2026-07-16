---
name: research-export
description: Export a read-only Research Navigator plan/map snapshot as Markdown with hierarchy, priorities, RQs, evidence, warnings, and a Mermaid event timeline. Use for plan exports, roadmap reports, timeline/Gantt-like views, status handoffs, or thesis progress snapshots.
---

# Research Export

Use the deterministic exporter. Do not reconstruct the report yourself.

## Default workflow

1. From the repository root, run:

   ```bash
   npm run research:export -- --output PLAN_EXPORT.md
   ```

2. Report the output path and byte count printed by the command.
3. Do not read the generated file unless the user asks for a summary, critique, or narrative version.

For a requested filename, replace `PLAN_EXPORT.md` with that path. Never write inside the research data folder.

## Context boundary

- Do not inspect application source, `docs/`, Git history, or unrelated repository files.
- Do not enumerate or manually read nodes, edges, or JSON before exporting; the script owns data gathering and derived calculations.
- Do not modify research files. This skill is read-only except for the requested export file.
- If the user requests interpretation after export, read only the generated Markdown first. Open a specific research file only when the user explicitly requests missing detail that the export does not contain.
- Never invent evidence, answers, dates, progress, or relationship meaning.

The export already contains the objective/aspect/work hierarchy, derived progress, up to five priorities, RQ evidence state, readable milestone details, Mermaid timeline, cross-links, retained decisions/dead ends, and warnings.
