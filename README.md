# Multi-Agent AI Studio

Portfolio-grade multi-agent AI web app built with Next.js, Tailwind CSS, Framer Motion, FastAPI, and a graph-based Python orchestrator.

## Features

- Multi-agent workflow with `planner`, `researcher`, `executor`, `reviewer`, and `composer`
- Real-time step streaming from the backend
- Structured Pydantic schemas between agents
- Run history persisted locally
- Premium dashboard with workflow visualization and inspectable agent outputs
- OpenAI-compatible LLM client with configurable base URL and model
- Supports OpenAI or xAI Grok via environment configuration

## Project Structure

```text
backend/
  app/
    agents/
    api/
    core/
    models/
    orchestrator/
    services/
    storage/
frontend/
  app/
  components/
  lib/
```

## Setup

### 1. Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -e .
copy ..\.env.example .env
uvicorn app.main:app --reload --port 8000
```

### 2. Frontend

```bash
cd frontend
npm install
copy ..\.env.example .env.local
npm run dev
```

## Local URLs

- Frontend: `http://localhost:3000`
- Backend docs: `http://localhost:8000/docs`

## Environment

Required values:

- `LLM_PROVIDER`
- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `OPENAI_BASE_URL`
- `XAI_API_KEY`
- `XAI_MODEL`
- `XAI_BASE_URL`
- `NEXT_PUBLIC_API_BASE_URL`

Provider examples:

- Grok/xAI: `LLM_PROVIDER=xai`, `XAI_BASE_URL=https://api.x.ai/v1`, `XAI_MODEL=grok-4.20-reasoning`
- OpenAI: `LLM_PROVIDER=openai`, `OPENAI_BASE_URL=https://api.openai.com/v1`, `OPENAI_MODEL=gpt-4.1-mini`

## Example Prompts

- `Build a project plan for an AI learning assistant`
- `Research vector databases and recommend one for a startup MVP`
- `Create an implementation roadmap for a Next.js SaaS analytics app`
- `Analyze a resume project idea and suggest technical improvements`

## Notes

- The backend stores run history in `backend/.data/runs.json`.
- If an LLM call fails, the orchestrator retries and then falls back to a deterministic structured response.
- The workflow shows task steps and agent outputs instead of hidden chain-of-thought.
