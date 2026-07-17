---
name: research-preflight
description: Check tracked repository changes and fingerprint changes in Research Navigator's configured research data before development or research work. Use when starting or resuming work, when the user may have edited code or ignored research data, or before relying on previously read project context.
---

# Research Preflight

Run this read-only check from the repository root before relying on cached project context:

```bash
npm run research:preflight
```

When a fingerprint was read earlier in the same session, compare it explicitly:

```bash
npm run research:preflight -- --expected-fingerprint <fingerprint>
```

The command prints Git status/diff first and the configured research fingerprint second. Interpret both before acting:

- Inspect overlapping Git changes before editing; preserve user work and re-read changed owners/callers.
- When `changedSinceExpected` is true, discard cached research context and route/read again from the configured data directory.
- When `stateStale` is true, do not rely on `STATE.md`; report or refresh it only within the authorized workflow.
- If an update materially changes the request's meaning, state the revised understanding and ask only when ambiguity remains. Continue without asking when the update is compatible and in scope.
- Choose verification from the actual diff: research-data-only changes need research validation, while application-code changes need the nearest targeted check and `npm run check` before completion. Documentation-only changes do not require an unrelated build.

The command never writes, refreshes state, or replaces user files. A new session treats the current fingerprint as its baseline.
