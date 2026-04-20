# Multi-Agent AI Studio: Code Flow and Architecture Guide

## 1. Interview-Style Explanation

This app is a full-stack multi-agent AI system with a React/Next.js frontend and a FastAPI backend.

The frontend acts like a real-time mission control dashboard:

- the user submits a prompt
- the UI starts a streaming request to the backend
- the dashboard updates live as each agent completes work

The backend acts like an orchestrated agent runtime:

- a central orchestrator creates a run record
- LangGraph moves the task through planner, researcher, executor, reviewer, and composer agents
- each agent returns structured JSON instead of raw untyped text
- the reviewer can send the workflow back to the executor if revisions are needed
- the final result is composed and streamed back to the frontend

The design goal is to demonstrate:

- structured LLM orchestration
- shared multi-agent state
- real-time UX updates
- production-minded separation between API, orchestration, agent logic, and UI rendering

In one sentence:

`A user prompt enters the frontend, the backend runs it through a LangGraph multi-agent workflow with typed state, and the UI renders each intermediate and final result in real time.`

---

## 2. Step-by-Step Runtime Flow

### Frontend request flow

1. The user types a prompt in the dashboard.
2. The prompt input component triggers a streaming API call.
3. The frontend opens a `text/event-stream` connection to the backend.
4. As the backend emits updated run state, the frontend updates:
   - agent status cards
   - workflow timeline
   - intermediate result panels
   - final output
   - live logs
5. The latest run is also shown in local history.

### Backend orchestration flow

1. FastAPI receives the request at `/api/runs/stream`.
2. The orchestrator creates a new `RunRecord`.
3. The run is stored in local JSON history.
4. LangGraph starts with a shared structured state object.
5. The workflow runs:
   - `bootstrap`
   - `planner`
   - `researcher`
   - `executor`
   - `reviewer`
   - `composer`
6. After `reviewer`, the graph conditionally routes:
   - back to `executor` if revision is needed
   - forward to `composer` if approved
7. Each node updates shared runtime state and run history.
8. The backend streams state snapshots back to the frontend after each graph update.
9. The final output is stored, marked complete, and sent to the UI.

### Error and fallback behavior

1. If an LLM request fails, the orchestrator retries it.
2. If retries still fail, the orchestrator uses deterministic structured fallback output.
3. The workflow still completes, but logs the error and marks fallback usage in runtime events.

---

## 3. File-by-File Architecture Walkthrough

## Backend

### Entry point

- `backend/app/main.py`
  - Creates the FastAPI app
  - Registers CORS
  - Mounts API routes

### API layer

- `backend/app/api/routes.py`
  - Exposes:
    - `GET /api/health`
    - `GET /api/runs`
    - `GET /api/runs/{run_id}`
    - `POST /api/runs`
    - `POST /api/runs/stream`
  - Delegates all orchestration work to `MultiAgentOrchestrator`

### Orchestration

- `backend/app/orchestrator/graph.py`
  - Core workflow brain of the application
  - Defines the LangGraph shared state
  - Builds the graph nodes and conditional routing
  - Tracks runtime metadata like:
    - current phase
    - active agent
    - execution loops
    - review loops
    - revision requests
    - fallback usage
  - Streams step-by-step updates to the frontend

### Structured models

- `backend/app/models/schemas.py`
  - Defines all typed Pydantic models used across the app
  - Includes:
    - task request schema
    - agent output schemas
    - run history schema
    - workflow runtime schema
  - Keeps agent handoffs typed and consistent

### Agent implementations

- `backend/app/agents/base.py`
  - Abstract base class for agent implementations

- `backend/app/agents/prompts.py`
  - Centralized prompt definitions for each agent

- `backend/app/agents/planner.py`
  - Converts the user prompt into a structured plan

- `backend/app/agents/researcher.py`
  - Builds findings, assumptions, risks, and context

- `backend/app/agents/executor.py`
  - Produces the main draft deliverable
  - Can consume reviewer feedback and previous execution drafts during revisions

- `backend/app/agents/reviewer.py`
  - Evaluates quality, completeness, and consistency
  - Can request revisions

- `backend/app/agents/composer.py`
  - Produces the final polished deliverable shown in the UI

### LLM integration

- `backend/app/services/llm.py`
  - Shared LLM client
  - Supports provider switching through config
  - Sends structured completion requests
  - Validates results into Pydantic response models

### Config

- `backend/app/core/config.py`
  - Loads environment settings from `.env`
  - Supports both OpenAI and xAI/Grok provider configuration

### Persistence

- `backend/app/storage/history.py`
  - Persists runs to `backend/.data/runs.json`
  - Supports listing, fetching, and saving run history

---

## Frontend

### Main pages

- `frontend/app/page.tsx`
  - Landing page

- `frontend/app/dashboard/page.tsx`
  - Main orchestration dashboard
  - Coordinates prompt submission, stream updates, and layout rendering

### API client

- `frontend/lib/api.ts`
  - Fetches run history
  - Opens streaming run requests

### Shared frontend types

- `frontend/lib/types.ts`
  - Mirrors backend response structures
  - Keeps the UI typed and aligned with backend payloads

### Major UI components

- `frontend/components/prompt-input.tsx`
  - User prompt entry and demo prompts

- `frontend/components/agent-card.tsx`
  - Shows each agent’s role, status, and preview

- `frontend/components/workflow-graph.tsx`
  - Renders the visual workflow stages

- `frontend/components/intermediate-panels.tsx`
  - Displays planner, researcher, executor, and reviewer outputs in productized panels

- `frontend/components/output-panel.tsx`
  - Displays final deliverable sections and markdown export

- `frontend/components/run-history.tsx`
  - Displays previous runs and lets the user reopen them

### Styling and look

- `frontend/app/globals.css`
  - Global dashboard shell, glass panels, scroll styling, and atmospheric effects

---

## 4. LangGraph Architecture Flow

The graph is effectively:

```text
START
  |
  v
bootstrap
  |
  v
planner
  |
  v
researcher
  |
  v
executor
  |
  v
reviewer
  |----------------------\
  | approved              \ revision needed
  v                        \
composer <------------------ executor
  |
  v
END
```

The important production idea here is that the workflow is not just a fixed linear chain.

It uses:

- shared typed state
- node-based orchestration
- conditional review routing
- retry and fallback logic
- runtime metadata tracking

That makes it much closer to a real orchestration system than a simple “call 5 prompts in a row” implementation.

---

## 5. Sequence Diagram in Text

```text
User
  |
  | enters prompt
  v
Next.js Dashboard
  |
  | POST /api/runs/stream
  v
FastAPI Route
  |
  | create RunRecord + save history
  v
LangGraph Orchestrator
  |
  | initialize GraphState and runtime
  v
Planner Agent
  |
  | returns PlannerOutput
  v
Researcher Agent
  |
  | returns ResearchOutput
  v
Executor Agent
  |
  | returns ExecutionOutput
  v
Reviewer Agent
  |
  | returns ReviewOutput
  | if revisions required -> route back to Executor
  v
Composer Agent
  |
  | returns FinalOutput
  v
Orchestrator
  |
  | mark run completed + stream updates
  v
Next.js Dashboard
  |
  | re-render agents, workflow, intermediate panels, output, logs
  v
User sees final result
```

---

## 6. Why This Architecture Is Good for Interviews

This project demonstrates several things interviewers usually care about:

- you can design modular backend architecture
- you understand structured stateful LLM orchestration
- you can connect backend workflows to live frontend UX
- you can build resilient fallbacks around provider failures
- you can think in terms of typed contracts rather than fragile prompt chaining

It also gives you multiple talking angles:

- AI orchestration
- LangGraph state machines
- FastAPI design
- real-time frontend streaming
- production-ready UI architecture

---

## 7. Short Summary

If you need to explain this project quickly:

`This is a multi-agent AI workspace where a prompt is sent to a FastAPI backend, routed through a LangGraph workflow with planner, researcher, executor, reviewer, and composer agents, and streamed back to a Next.js dashboard that visualizes every step in real time.`
