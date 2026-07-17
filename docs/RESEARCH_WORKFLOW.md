# Research workflow

The workspace follows familiar iterative empirical research without forcing a
single methodology: question formulation, decomposition, planned investigation,
observation, interpretation, synthesis, and human review. It supports exploratory
branches and negative results while keeping claims traceable.

```text
Project
  -> research or enabling objective
     -> aspects to resolve
        -> idea/task/experiment/decision DAG
           -> closing synthesis --resolves--> aspect
              --evidence--> one or more research questions
```

An objective may end through several independent aspects; there is no required
single sink for its whole subgraph. Progress is an unweighted count such as
`3 of 5 aspects synthesized`. Cross-links between routes are normal. Retired
aspects remain visible but leave the denominator. Only a researcher marks the
objective met after reviewing the synthesized aspects.

Research Objectives and Research Questions are UI group labels, not separator
nodes. An enabling objective may support other objectives without answering an
RQ. Objective/RQ relationships are many-to-many, while scientific contribution
comes only from explicit evidence links.

## Practical meanings

- **Idea**: promising thought not yet placed in a route.
- **Task**: reading, dataset preparation, implementation, or analysis action.
- **Experiment**: one experimental question; raw runs remain external.
- **Decision**: choice, rejected alternatives, and rationale.
- **Synthesis**: bounded integration of evidence, caveats, and gaps.
- **Note**: capture that does not affect progress.

Use `dead` for a real failed route, `retired` for removed scope, and
`superseded` when later-milestone work replaces an unfinished task. Keep all of
them visible. Use `depends-on` only for blockers; use `informs` for non-blocking
knowledge. A new task should reference superseded work when useful.

External experiment references record portable repository URL, commit, run ID,
and artifact-relative path. Never commit absolute machine paths, raw logs,
datasets, or checkpoints into this coordination repository.

## Agent retrieval

Before relying on earlier context, run `npm run research:preflight`. Git reports
tracked worktree changes; the research fingerprint detects changes in the
configured data directory even when that directory is ignored.

For an arbitrary project question, route the original question plus optional
agent-supplied search hints to at most five typed references. Read focused
context for one selected node, question, month, milestone, or project reference,
then follow a side branch only when needed. Text selects the starting point;
graph relationships explain and expand it but never change search ranking.
