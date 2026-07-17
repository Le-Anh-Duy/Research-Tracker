# Agent Development Guide

Use this file as the entry point for application development. Do not scan the
whole repository before every change.

## Start here

1. Read `docs/ARCHITECTURE.md` for boundaries and sources of truth.
2. Find the requested behavior in the feature map in `docs/DEVELOPMENT.md`.
3. Read only the listed owner, persistence module, and nearest test.
4. Search for every reader and writer of any field or function you will change.

For the planned agentic research-workspace redesign, also read
`docs/AGENTIC_RESEARCH_WORKSPACE_PLAN.md`; it records the approved product
decisions and phased acceptance criteria.

For research-roadmap work, resolve the active data directory from
`RESEARCH_DATA_DIR` in `.env.local`, falling back to `research_data/`. Read only
that directory; do not inspect or merge a similarly named fallback directory.
`research_data.local/` is this checkout's ignored private state, not a second
schema. For application development, use synthetic temporary data instead.

Read `docs/API.md` only for HTTP changes and `docs/RESEARCH_WORKFLOW.md` only
for research-domain behavior. The skills under `.agents/skills/` operate the
research roadmap; they are not required for ordinary application features.

## Change rules

- Reuse the nearest existing component, helper, and styling pattern.
- Keep UI-only state in React; keep durable research meaning in Markdown and
  the documented JSON sources of truth.
- Put shared validation in `contracts.js` or the server boundary, not only in
  a component.
- Preserve graph revision checks. Edge files exclusively own endpoints and relationship meaning; do not add reciprocal edge lists to nodes.
- Add no dependency when the platform or installed stack handles the change.
- Give a non-trivial pure rule one small `scripts/*.test.mjs` assertion test.
- Update the feature map or API docs when ownership, behavior, or a request
  shape changes. Do not duplicate architecture documentation here.
- Do not read, rewrite, or depend on the user's configured research data while
  developing application features.
- Preserve unrelated working-tree changes.

## Verification

Run `npm run check` after implementation. For UI-only behavior that cannot be
covered by the current assertion tests, also report the shortest manual check
from the feature map.

The change is complete when the requested behavior works, relevant contracts
and docs agree, and `npm run check` passes. Do not perform speculative cleanup.
