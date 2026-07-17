# Research Navigator

Research Navigator helps you plan, track, and review a research project in one
place. It shows how goals, questions, tasks, experiments, decisions, and results
connect over time.

The app runs on your computer and stores the project as plain Markdown and JSON
files. Your experiment code, datasets, logs, and model files stay in their own
repositories or storage locations.

## Why use it?

Research rarely follows a straight line. Ideas change, experiments fail, and a
useful result may support more than one question. Research Navigator keeps that
history visible while helping you decide what to work on next.

You can use it to:

- break a large goal into smaller pieces;
- connect tasks and experiments to the questions they support;
- keep failed or replaced work without losing the reasoning behind it;
- plan milestones on a timeline;
- review evidence before accepting a conclusion;
- share focused project context with coding agents.

## Quick start

Research Navigator requires Node.js 18 or newer.

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

For a new project, the setup wizard asks for the topic, goals, research
questions, first areas of work, and an optional timeline. It shows a preview
before creating any files.

## A simple workflow

1. Create a goal for a result you want to reach.
2. Split the goal into smaller areas that can be worked on separately.
3. Add ideas, tasks, experiments, notes, and decisions as the work develops.
4. Connect useful results to the research questions they help answer.
5. Write a short summary for each finished area.
6. Review the collected evidence before marking a goal complete.

For example, a model-evaluation goal may have separate areas for baseline
reproduction, dataset preparation, and robustness testing. Each area can follow
its own path while still contributing evidence to the same research question.

## Main views

- **Home** shows the next priorities, progress, deadlines, and warnings.
- **Map** shows the research paths and how they connect.
- **Compass** keeps the topic, goals, research questions, and approved answers.
- **Evidence** groups finished findings by research question.
- **Review** shows missing evidence and unfinished work.
- **Journey** replays tracked project changes from Git history.
- **Timeline** groups milestones by month or another planning period.

## Project data

By default, the app stores project files in `research_data/`. To use a different
directory for one checkout, create an ignored `.env.local` file:

```dotenv
RESEARCH_DATA_DIR=research_data.local
```

The chosen directory is the single active source for that checkout. A name such
as `research_data.local/` has no special behavior; it is only a convenient name
for private local data.

This repository ignores both its maintainer's research data and `*.local`
directories. If your own project should keep research state in Git, update the
ignore rules to match your workflow.

## Agent access

The project includes a command-line interface, a local MCP server, and agent
skills for reading and updating research context.

```bash
npm run research -- state
npm run research:preflight
npm run research:mcp
```

The preflight command checks both Git changes and the active research data
before an agent relies on earlier context.

## Documentation

- [Research workflow](docs/RESEARCH_WORKFLOW.md) explains how research work,
  evidence, and review fit together.
- [Development guide](docs/DEVELOPMENT.md) maps features to their code and
  tests.
- [Architecture](docs/ARCHITECTURE.md) describes system boundaries and sources
  of truth.
- [API reference](docs/API.md) covers the local HTTP and command-line surfaces.
- [Agent guide](AGENTS.md) is the starting point for coding agents working on
  the application.

## Development

Run all tests and create a production build with:

```bash
npm run check
```

The app uses React, Vite, React Flow, Express, plain CSS, Markdown, JSON, and
Git. Optional local summarization with Ollama is not required.

License: MIT.
