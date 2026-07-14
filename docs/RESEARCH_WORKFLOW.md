# Research workflow

The app preserves a flexible evidence chain without prescribing a scientific method:

```text
Research question -> idea or hypothesis -> work/experiment -> finding -> synthesis -> RQ answer
```

Objectives and research questions are long-lived. Monthly milestones are tactical "fog of war": define the current month in detail and keep later months broad. Every month should include a small review of all objectives and RQs.

## Node meanings

| Type | Use it for | Expected result |
| --- | --- | --- |
| Work | Implementation, dataset preparation, reading, or preliminary analysis | A concrete deliverable or next decision |
| Experiment | Testing a hypothesis with a reproducible setup and metric | A positive, negative, or neutral finding |
| Decision | Recording a selected direction and rejected alternatives | A rationale that later work can trace |
| Synthesis | Combining several findings toward an RQ | A bounded claim with caveats and gaps |
| Note / dump | Unstructured capture that does not yet fit the workflow | Anything; no lifecycle expectation |

Project, objective, and research-question nodes are separate structural anchors. Objectives and questions are managed in Compass; their nodes make both concepts independently linkable on the Map. Milestones belong to the timeline and are not manual node types. Use tags to qualify a Work node (`literature`, `module`, `dataset`, `analysis`) instead of multiplying node types.

A node becomes evidence only when it is merged and linked to an RQ. `dead` means a real attempted direction that should remain visible; delete only mistakes or test clutter.

## Links

Nodes and edges are peer Markdown documents with different meanings:

- `nodes/<id>.md` owns the node's research metadata and notes.
- `edges/<id>.md` owns the relation type, endpoints, and explanation.
- A node's `from`/`to` lists incoming/outgoing edge documents.
- An edge's `from`/`to` names its source/target node documents.
- `graph.json` owns UI layout and revision only.

The web editor hides frontmatter. Wikilinks make the folder readable in Obsidian, but Obsidian editing and reverse synchronization are not product requirements.

## Keeping the map readable

Use milestone focus for current work and status filters for active, parked, or resolved work. Compacting one node is safe because it changes only presentation. Folding a whole path should be added only after the app can identify a resolved branch without hiding unresolved work; folded state must remain a UI projection, never rewrite research content.
