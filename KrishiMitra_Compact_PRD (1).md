# KrishiMitra — Compact PRD

## 1. Goal

Build **KrishiMitra**, an AI-powered crop yield prediction and optimization system for Smart India Hackathon.

A farmer registers a field once. The system monitors the crop from sowing to harvest, updates yield predictions using weather data, detects important agricultural events, and sends verified recommendations only when action is required.

### Core ideas
- Use **Growing Degree Days (GDD)** instead of calendar days for crop-stage tracking.
- Report **yield ranges**, not only a single number.
- Use an **adversarial Challenger** to find evidence-backed risks in recommendations.
- Let **deterministic safety code** make the final decision.
- Maintain field state and yield history throughout the season.

### V1 non-goals
No mobile app, WhatsApp/SMS, payments, marketplace, IoT sensors, or multi-season history.

---

## 2. Users

### Farmer
- Register and monitor own fields.
- Access only own fields.

### Admin
- Government/KVK officer.
- View all users, fields, alerts, and aggregate analytics.
- Read-only except running checks across fields.

Use one `User` collection with `farmer` or `admin` role.

---

## 3. Locked Stack

### Frontend
React 18, Vite, React Router, Axios, TailwindCSS, Recharts

### Backend
Node.js 20, Express 4, Mongoose 8, JWT, bcrypt, Multer

### Database
MongoDB Atlas

### AI service
Python 3.11, FastAPI, scikit-learn, pandas, joblib, requests

### LLM
DeepSeek chat + vision

### External
Open-Meteo, Tavily

### Deployment
Vercel for React, Render for Node/Python, MongoDB Atlas

### Architecture rules
- Node owns auth, business logic, and MongoDB.
- Python owns only ML inference and LLM calls.
- Python is stateless and never accesses MongoDB.
- React communicates only with Node.
- No Redis, message queue, GraphQL, Next.js, or TypeScript.

---

## 4. Architecture

React → Node/Express → MongoDB

Node also handles:
- Open-Meteo
- GDD engine
- Tavily
- Advisor rules
- Safety policy
- Validator

Node → Python/FastAPI for:
- Yield prediction
- DeepSeek Challenger
- DeepSeek vision
- Explanation

GDD stays in Node because it is pure arithmetic.

---

## 5. Data Models

### User
- `_id`
- `name`
- `phone` — unique 10-digit login ID
- `passwordHash`
- `role` — `farmer | admin`
- `language` — `en | hi`
- `district`
- `state`
- `createdAt`

### Field
- `_id`
- `userId`
- `name`
- `crop` — `rice | wheat | maize`
- `variety`
- `sowingDate`
- `areaAcre`
- `location` — district, state, lat, lon
- `soil` — nitrogen, phosphorus, potassium, ph, testedOn
- `current` — stage, cumGdd, gddPct, predictedHarvestDate, yieldEstimate, yieldRangeLow, yieldRangeHigh, stressFactor, lastCheckedAt
- `yieldHistory` — date, estimate, trigger
- `photos` — url, uploadedAt, detectedCrop, detectedStage, problems
- `status` — `active | harvested`
- `actualYield`
- `createdAt`

### Event
- `_id`
- `fieldId`
- `userId`
- `type`
- `severity` — `low | medium | high`
- `title`
- `message`
- `evidence`
- `advisory` — proposedAction, challengerObjection, finalAction, decisionReason, validatorPassed
- `read`
- `createdAt`

No notification collection. Notifications use the `events` collection.

---

## 6. Node API

Base URL: `/api`

All routes except auth require JWT.

### Auth
- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me`

### Farmer fields
- `POST /fields`
- `GET /fields`
- `GET /fields/:id`
- `PUT /fields/:id`
- `DELETE /fields/:id`
- `POST /fields/:id/check`
- `POST /fields/:id/photo`
- `POST /fields/:id/harvest`
- `GET /fields/:id/weather`

Creating a field runs the first check immediately.

`/fields/:id/check` runs the complete pipeline.

### Events
- `GET /events`
- `GET /events?fieldId=:id`
- `PATCH /events/:id/read`
- `GET /events/unread-count`

### Admin
- `GET /admin/stats`
- `GET /admin/fields`
- `GET /admin/farmers`
- `GET /admin/alerts`
- `GET /admin/yield-map`
- `POST /admin/run-all-checks`

Use consistent success and error responses.

---

## 7. Python API

Port `8000`.

Node authenticates with the shared `X-Service-Key`.

### `/predict-yield`
Receives crop, state, season, area, rainfall, stage, and weather arrays.

Returns:
- baseline yield
- stress factor
- heat/water/dry-spell breakdown
- predicted yield
- low/high range

### `/challenge`
Receives the recommendation and evidence.

Returns:
- challenge status
- severity
- reason
- cited evidence
- recommended action

### `/vision`
Receives an image and returns:
- crop
- confidence
- stage
- problems
- image usability

### `/explain`
Receives language and advisory data and returns the farmer-facing explanation.

---

## 8. GDD and Weather

### Crop parameters

Rice:
- base temperature: 10°C
- upper temperature: 35°C
- maturity: 2400 GDD
- water need: 1100 mm

Wheat:
- base temperature: 5°C
- upper temperature: 30°C
- maturity: 2100 GDD
- water need: 450 mm

Maize:
- base temperature: 10°C
- upper temperature: 35°C
- maturity: 1700 GDD
- water need: 550 mm

Daily GDD is never negative and is upper-capped.

### Stage thresholds
- below 20%: seedling
- below 45%: vegetative
- below 65%: flowering
- below 90%: grain filling
- otherwise: mature

Harvest date uses the 16-day forecast to consume remaining GDD. After that, use the mean of the last 7 forecast days.

### Weather
Use Open-Meteo archive from sowing date to today and a 16-day forecast.

Cache each field's weather response for 6 hours.

---

## 9. Event Detection

Run these checks on every field check:

- `STAGE_CHANGE` — stage changed — low
- `HEAVY_RAIN` — next 48h rainfall >25mm — high
- `HEAT_STRESS` — 3+ forecast days above crop upper temperature — high
- `DRY_SPELL` — 14+ past days with rainfall <1mm — medium
- `FERTILIZER_WINDOW` — vegetative/flowering and next 3 days rainfall <15mm — medium
- `HAZARD_ALERT` — Tavily finds cyclone/flood warning — high
- `YIELD_SHIFT` — yield changed by more than 10% from last notification — medium
- `HARVEST_WINDOW` — GDD progress >90% — high

Triggered events are stored and the field's current state and yield history are updated.

---

## 10. Advisory and Verification

Pipeline:

**Advisor → Challenger → Safety Policy → Validator → Event**

### Advisor
Use deterministic crop-stage rules.

Fertilizer:
- Rice: vegetative Urea 25 kg/acre; flowering Urea + MOP 15 kg/acre
- Wheat: vegetative Urea 30 kg/acre; flowering Urea 15 kg/acre
- Maize: vegetative Urea 28 kg/acre; flowering Urea 14 kg/acre

Only propose fertilizer when the stage has a rule and next-3-day rainfall is below 15mm.

When GDD progress exceeds 90%, propose harvest in the driest 3-day forecast window.

### Challenger
DeepSeek acts only as an **agricultural risk auditor**.

Its job is to find evidence that the recommendation could fail.

Rules:
- Every objection must cite a field and value from supplied evidence.
- Never invent numbers.
- No evidence-backed risk → no challenge.
- Allowed actions: `WAIT`, `HOLD`, `REDUCE_DOSE`, `PROCEED`.
- Return valid JSON only.

### Safety Policy
1. No challenge → keep the proposal.
2. Verify every cited Challenger value against actual tool data.
3. Unsupported or mismatched evidence → discard the objection.
4. Verified rainfall risk with rainfall ≥15mm and probability ≥50% → `WAIT`.
5. Verified objection with soil test older than 90 days → `HOLD`.
6. Otherwise keep the original proposal.

### Validator
Reject if:
- yield is outside 0.3–12 t/ha
- fertilizer dose exceeds 60 kg/acre
- GDD is negative
- final action is not `APPLY`, `WAIT`, `HOLD`, or `HARVEST`
- `APPLY` or `HARVEST` occurs during an active high-severity hazard

Failure → `validatorPassed=false` and safe fallback `HOLD`.

---

## 11. Yield Model

Dataset: Agricultural Crop Yield in Indian States, 1997–2020.

Features:
- Crop
- Season
- State
- Area
- Annual Rainfall
- Fertilizer
- Pesticide

Target: Yield.

Use one-hot encoding and:

- RandomForestRegressor
- 200 estimators
- max depth 15
- random state 42

Print real MAE and R². Save the trained model as `yield_model.pkl`.

### Stress
- Heat factor: based on days above crop upper temperature.
- Flowering heat stress: additional reduction after 5+ hot days.
- Water factor based on rainfall/water-need ratio.
- Dry-spell factor: reduction after a dry run longer than 21 days.
- Clamp total stress factor between 0.5 and 1.1.

Final yield = baseline yield × stress factor.

Range = predicted yield ±15%.

Do not invent model accuracy; use actual evaluation results.

---

## 12. Farmer UI

Routes:
- `/`
- `/login`
- `/register`
- `/dashboard`
- `/fields/new`
- `/fields/:id`
- `/alerts`

### Dashboard
Show:
- unread alerts
- field cards
- crop
- stage
- yield
- GDD progress
- recent alerts
- add-field action

### Field detail
Show:
- field information
- crop stage
- GDD progress
- harvest estimate
- yield and range
- yield evolution chart
- rainfall forecast chart
- timeline
- photo upload
- harvest action

### Alert detail
Show:
- recommendation
- reason
- evidence
- original proposal
- Challenger objection
- evidence verification
- final decision
- validator result

Use Tailwind, green/white agricultural styling, mobile-first layout, large touch targets, minimal text, and Hindi labels alongside English.

---

## 13. Admin

Routes:
- `/admin`
- `/admin/fields`
- `/admin/farmers`

Dashboard:
- total farmers
- total fields
- active fields
- average yield
- crop distribution
- state yield
- high-severity alerts
- run-all-checks action

Admin is read-only except `run-all-checks`.

Show:
- all fields
- farmers
- district yield information
- high-severity alerts
- recommendations overridden by safety policy

---

## 14. Priority

### P0 — Must ship
1. Authentication and roles
2. Field CRUD
3. Open-Meteo
4. GDD and harvest prediction
5. RandomForest yield model
6. Stress factor and range
7. Advisor
8. Challenger
9. Safety policy
10. Validator
11. Event detection
12. Farmer dashboard
13. Field detail and timeline
14. Yield/rainfall charts
15. Admin dashboard
16. Manual field check

### P1 — If time allows
- Crop photo + DeepSeek vision
- Hindi explanation
- Tavily hazard alerts
- Admin district yield table
- Actual harvest yield

### P2 — Future only
Mandi prices, WhatsApp, multi-season calibration, satellite NDVI, irrigation scheduling, pest prediction.

---

## 15. Repository

Use exactly this structure:

- `client/` — React frontend
- `server/` — Node/Express backend
- `ai-service/` — Python/FastAPI service
- `README.md`

Server services:
- weather
- gdd
- scheduler
- advisor
- challenger
- safetyPolicy
- validator
- pythonClient
- tavily

AI service:
- main
- yield_model
- stress
- challenger
- vision
- train_model
- trained model

---

## 16. Environment

Server:
- `PORT`
- `MONGO_URI`
- `JWT_SECRET`
- `PYTHON_SERVICE_URL`
- `SERVICE_KEY`
- `TAVILY_API_KEY`
- `CLIENT_URL`

AI service:
- `DEEPSEEK_API_KEY`
- `SERVICE_KEY`

Client:
- `VITE_API_URL`

---

## 17. Build Order

Build sequentially. Verify each step before continuing.

1. Train model and save `yield_model.pkl`.
2. Build FastAPI yield endpoint.
3. Build Express, MongoDB, and authentication.
4. Build field CRUD.
5. Add weather and GDD.
6. Integrate yield prediction.
7. Add event detection.
8. Add advisor.
9. Add Challenger, safety policy, and validator.
10. Build React authentication.
11. Build dashboard and field detail.
12. Add charts.
13. Add notification feed and verification UI.
14. Add admin.
15. Add deterministic seed data.
16. Deploy.

If time is short, cut admin and charts before cutting the verification pipeline.

Seed demo fields at different crop stages. Pre-cache demo weather so the system can run if internet access fails.

---

## 18. Demo

Use one deterministic demo field:

- Rice
- Barabanki
- Sowing: 2 July
- Area: 2.5 acres

Demo sequence:

1. Register field.
2. Run first check.
3. Show weather, GDD, stage, and harvest estimate.
4. Show baseline yield, stress factor, and yield range.
5. Show fertilizer proposal.
6. Show Challenger objection.
7. Show evidence verification.
8. Show final `HOLD` or `WAIT` decision.
9. Show validator result.
10. Show yield evolution.
11. Show admin overview.

Main message:

**The LLM does not have authority. It identifies risks. Deterministic code verifies evidence and makes the final decision.**

Be honest about model performance. Report actual MAE/R². State that the stress adjustment is not field-validated and requires real seasonal ground truth.

## Final implementation rule

Follow this PRD exactly. Do not invent additional features, libraries, collections, endpoints, architecture, or behavior.
