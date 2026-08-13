# KrishiMitra — Railway Deployment Guide

## Overview

Three Railway services in one Railway project:

| Service | Root Directory | Port | Dockerfile |
|---------|---------------|------|------------|
| `krishi-server` | `server/` | 5000 | `server/Dockerfile` |
| `krishi-ai` | `ai-service/` | 8000 | `ai-service/Dockerfile` |
| `krishi-client` | `client/` | 80 | `client/Dockerfile` |

---

## Prerequisites

1. [Railway account](https://railway.app)
2. `railway` CLI: `npm install -g @railway/cli`
3. MongoDB Atlas cluster (free tier works)
4. DeepSeek API key (from [platform.deepseek.com](https://platform.deepseek.com))
5. Tavily API key (from [tavily.com](https://tavily.com)) — optional for full demo
6. Python 3.11+ installed locally (for model training)

---

## Step 0 — Model artifact

`ai-service/yield_model.pkl` is committed, so **no training step is needed to
deploy**. The dataset is committed too (`ai-service/data/crop_yield.csv`) — no
Kaggle download required.

Retrain only if you change the data, the features, or the pinned library
versions:

```bash
cd ai-service
pip install -r requirements.txt
python train_model.py         # prints holdout accuracy, writes yield_model.pkl (~42 MB)
python export_crop_params.py  # regenerates server/data/cropParams.json

git add yield_model.pkl ../server/data/cropParams.json
git commit -m "chore: retrain yield model"
```

> [!IMPORTANT]
> The `ai-service/Dockerfile` fails the build if `yield_model.pkl` is missing or
> is a stale bundle from an older training script.

> [!WARNING]
> The pickle embeds scikit-learn's internal tree layout. If you bump
> `scikit-learn` or `numpy` in `requirements.txt`, retrain in the same commit or
> the service will warn on boot and may not load the model at all.

---

## Step 1 — Create Railway Project

```bash
railway login
railway init  # creates a new project
```

Or create the project in the [Railway dashboard](https://railway.app/dashboard).

---

## Step 2 — Create Three Services

In the Railway dashboard → New Service → Empty Service for each:

1. **krishi-server**
2. **krishi-ai**  
3. **krishi-client**

For each service:
- Go to **Settings → Source**
- Set **Root Directory** to the respective subdirectory (`server/`, `ai-service/`, `client/`)
- Set **Builder** to `Dockerfile`

---

## Step 3 — Set Environment Variables

### krishi-server

```
PORT=5000
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/krishimitra
JWT_SECRET=<generate-with: openssl rand -hex 32>
PYTHON_SERVICE_URL=https://krishi-ai.up.railway.app
SERVICE_KEY=<pick-any-strong-random-key>
TAVILY_API_KEY=tvly-...
CLIENT_URL=https://krishi-client.up.railway.app
```

### krishi-ai

```
SERVICE_KEY=<same-key-as-server>
DEEPSEEK_API_KEY=sk-...
```

### krishi-client

```
VITE_API_URL=https://krishi-server.up.railway.app/api
```

> [!WARNING]
> `VITE_API_URL` is a **build-time** variable. After setting it, you must redeploy the client service for it to take effect. Vite bakes it into the static bundle.

---

## Step 4 — Deploy Services

Deploy in this order (ai-service before server, server before client):

```bash
# From repo root
railway link  # link to your Railway project

# Option A: Deploy from CLI (set service name first in dashboard)
railway up --service krishi-ai
railway up --service krishi-server
railway up --service krishi-client

# Option B: Push to GitHub — Railway auto-deploys on push if GitHub repo is linked
git push origin main
```

---

## Step 5 — MongoDB Atlas Network Access

Railway uses dynamic IPs. For simplicity during SIH demo:
1. MongoDB Atlas → Network Access → Add IP: `0.0.0.0/0` (allow all)
2. Or use a dedicated Railway IP (available on Railway Pro)

---

## Step 6 — Seed Demo Data

```bash
# Set MONGO_URI locally (same as Railway env var)
cd server
cp .env.example .env
# Fill in MONGO_URI in .env
node seed/seed.js
```

Demo credentials:
- **Farmer**: `9999999999` / `demo1234`
- **Admin**: `8888888888` / `admin1234`

---

## Step 7 — Verify Deployment

```bash
# Health checks
curl https://krishi-server.up.railway.app/health
curl https://krishi-ai.up.railway.app/health

# Expected responses:
# {"status":"ok","service":"krishi-server"}
# {"status":"ok","service":"krishi-ai"}
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `yield_model.pkl not found` | Run `python train_model.py` locally, commit pkl files |
| `MONGO_URI not set` | Check Railway env vars for krishi-server |
| Client shows CORS error | Check `CLIENT_URL` in krishi-server matches actual client URL |
| AI service 401 | Verify `SERVICE_KEY` matches in both krishi-server and krishi-ai |
| MongoDB connection refused | Check Atlas network access allows `0.0.0.0/0` |
| Vite shows wrong API URL | `VITE_API_URL` must be set before build — redeploy client after setting it |

---

## Railway Internal Networking

If all services are in the same Railway project, you can use Railway's internal networking to avoid egress charges:

In **krishi-server** env vars:
```
PYTHON_SERVICE_URL=http://krishi-ai.railway.internal:8000
```

This uses Railway's private network — faster and free between services in the same project.

---

## Demo Flow (PRD §18)

1. Open `https://krishi-client.up.railway.app`
2. Login as farmer: `9999999999` / `demo1234`
3. View the Barabanki Rice Field
4. Click **Run Check** — watch the full pipeline execute
5. Show GDD progress, yield estimate, stress factor
6. View the Challenger objection in the alert
7. Show Safety Policy decision and Validator result
8. Login as admin (`8888888888` / `admin1234`) → show aggregate dashboard
