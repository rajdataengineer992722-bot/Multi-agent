# Deployment Steps

This file explains exactly how to deploy the Multi-Agent AI Studio application.

The repository is already prepared for deployment using Render Blueprints through the `render.yaml` file at the root of the repo.

Repository:

`https://github.com/rajdataengineer992722-bot/Multi-agent.git`

---

## 1. What Will Be Deployed

This app is deployed as two services:

1. `multi-agent-ai-backend`
   - FastAPI backend
   - Python runtime
   - exposes `/api/*`

2. `multi-agent-ai-frontend`
   - Next.js frontend
   - Node runtime
   - serves the dashboard UI

The deployment is defined in:

`render.yaml`

---

## 2. Before You Start

Make sure you have:

1. A Render account
2. Access to the GitHub repository
3. At least one working LLM API key:
   - `OPENAI_API_KEY`, or
   - `XAI_API_KEY`

If you want to use Grok/xAI:

- set `LLM_PROVIDER=xai`
- provide `XAI_API_KEY`

If you want to use OpenAI:

- set `LLM_PROVIDER=openai`
- provide `OPENAI_API_KEY`

---

## 3. Deploy on Render

### Step 1: Open Render

Go to:

`https://render.com/`

Log in to your account.

### Step 2: Create a New Blueprint

In the Render dashboard:

1. Click `New`
2. Click `Blueprint`

### Step 3: Connect the GitHub Repository

When Render asks for the repo:

1. Connect your GitHub account if needed
2. Select this repository:

`rajdataengineer992722-bot/Multi-agent`

### Step 4: Let Render Read `render.yaml`

Render should detect:

`render.yaml`

This file defines both services automatically.

Render will create:

1. `multi-agent-ai-backend`
2. `multi-agent-ai-frontend`

### Step 5: Fill the Required Secret Environment Variables

During setup, Render will ask for secret values.

Provide these as needed:

#### Required if using xAI / Grok

- `XAI_API_KEY`

#### Required if using OpenAI

- `OPENAI_API_KEY`

#### Optional but already defaulted in `render.yaml`

- `LLM_PROVIDER`
- `OPENAI_MODEL`
- `OPENAI_BASE_URL`
- `XAI_MODEL`
- `XAI_BASE_URL`

Recommended:

- For Grok:
  - `LLM_PROVIDER=xai`
- For OpenAI:
  - `LLM_PROVIDER=openai`

### Step 6: Create the Blueprint

Click `Apply` / `Create Blueprint` / `Deploy` in Render.

Render will then:

1. create the backend service
2. create the frontend service
3. inject the backend URL into the frontend
4. inject the frontend URL into backend CORS settings

---

## 4. What `render.yaml` Configures

The root deployment file already sets up:

### Backend

- runtime: `python`
- root directory: `backend`
- build command:

```bash
pip install -e .
```

- start command:

```bash
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

- health check:

`/api/health`

### Frontend

- runtime: `node`
- root directory: `frontend`
- build command:

```bash
npm install && npm run build
```

- start command:

```bash
npm run start -- --hostname 0.0.0.0 --port $PORT
```

### Automatic service wiring

The blueprint also wires:

- `NEXT_PUBLIC_API_BASE_URL` in the frontend from the backend service URL
- `CORS_ORIGINS` in the backend from the frontend service URL

---

## 5. Environment Variables Summary

### Backend-related variables

- `LLM_PROVIDER`
- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `OPENAI_BASE_URL`
- `XAI_API_KEY`
- `XAI_MODEL`
- `XAI_BASE_URL`
- `CORS_ORIGINS`

### Frontend-related variables

- `NEXT_PUBLIC_API_BASE_URL`

### Version pinning

- `PYTHON_VERSION=3.11.11`
- `NODE_VERSION=20.18.0`

---

## 6. After Deployment: What to Test

### Step 1: Test the backend health endpoint

Open:

`https://<your-backend-service>.onrender.com/api/health`

Expected response:

```json
{"status":"ok"}
```

### Step 2: Open the frontend

Open:

`https://<your-frontend-service>.onrender.com`

You should see:

- landing page
- dashboard UI
- workflow cards
- agent panels

### Step 3: Run a sample prompt

Try:

- `Build a project plan for an AI learning assistant`
- `Research vector databases and recommend one for a startup MVP`
- `Create an implementation roadmap for a full-stack AI learning platform`

### Step 4: Verify runtime behavior

Check that:

1. agent cards update status
2. workflow stages update
3. intermediate panels fill in
4. final output appears
5. run history is saved

---

## 7. Troubleshooting

### Problem: frontend loads but agent runs fail

Possible causes:

1. missing `OPENAI_API_KEY` or `XAI_API_KEY`
2. wrong provider selected in `LLM_PROVIDER`
3. provider quota / billing / auth issue

Check backend logs in Render.

### Problem: CORS errors in browser

Possible causes:

1. frontend URL changed
2. backend `CORS_ORIGINS` does not include the frontend domain

Fix:

- update `CORS_ORIGINS` in Render for the backend service

### Problem: backend health check fails

Check:

1. backend build logs
2. start command
3. Python dependency installation

### Problem: frontend cannot reach backend

Check:

1. `NEXT_PUBLIC_API_BASE_URL`
2. backend service is live
3. backend health endpoint responds

---

## 8. Redeploying After Changes

Once the repo is connected to Render:

1. push changes to `main`
2. Render will auto-deploy by default

If needed, in Render you can also manually trigger:

- `Deploy latest commit`
- `Clear build cache & deploy`

Use cache-clear deploy if:

- dependencies changed
- env variables changed
- build output seems stale

---

## 9. Optional Production Improvements

After the first successful deploy, you may want to add:

1. custom domain for frontend
2. custom domain for backend
3. stronger secret management
4. database-backed history instead of local JSON file
5. persistent analytics and monitoring
6. provider failover between OpenAI and xAI

---

## 10. Quick Deployment Checklist

Use this short checklist:

1. Push repo to GitHub
2. Open Render
3. Create Blueprint
4. Select repository
5. Let Render load `render.yaml`
6. Enter `OPENAI_API_KEY` and/or `XAI_API_KEY`
7. Deploy
8. Open backend `/api/health`
9. Open frontend URL
10. Run a prompt and verify the workflow

---

## 11. One-Line Summary

`Deploy the repo on Render as a Blueprint, provide the LLM API keys, let Render create both backend and frontend services from render.yaml, and verify the app through /api/health plus the live dashboard.`
