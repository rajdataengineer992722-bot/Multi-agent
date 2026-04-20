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

## Deployment

### Recommended setup

This repository is prepared for a Render Blueprint deployment using [render.yaml](./render.yaml).

Why Render:

- official monorepo support with `rootDir`
- can host both the FastAPI backend and Next.js frontend
- can wire service URLs between frontend and backend using Blueprint environment variables

### Deploy on Render

1. Push the latest code to GitHub.
2. Open Render and create a new Blueprint.
3. Connect the GitHub repository:
   - `https://github.com/rajdataengineer992722-bot/Multi-agent.git`
4. Render will detect `render.yaml` at the repository root.
5. During Blueprint setup, provide secret values for:
   - `OPENAI_API_KEY` if using OpenAI
   - `XAI_API_KEY` if using Grok/xAI
6. Let Render create both services:
   - `multi-agent-ai-backend`
   - `multi-agent-ai-frontend`
7. After deploy finishes:
   - open the frontend Render URL
   - verify the backend health endpoint at `/api/health`
   - run a sample prompt from the dashboard

### What `render.yaml` does

- Deploys the backend from `backend/`
- Deploys the frontend from `frontend/`
- Pins Python and Node versions for consistency
- Sets the backend health check to `/api/health`
- Injects the backend public URL into the frontend as `NEXT_PUBLIC_API_BASE_URL`
- Injects the frontend public URL into the backend `CORS_ORIGINS`

### Notes

- Render free web services can spin down after inactivity.
- If you later use a custom frontend domain, update `CORS_ORIGINS` in Render to include it.
- If you later use a custom backend domain, update `NEXT_PUBLIC_API_BASE_URL` in Render to point to that domain.

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
