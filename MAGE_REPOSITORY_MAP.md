# MAGE — Repository Map

> Quick reference for where the frontend, backend API, and fusion layer live.
> Use this before changing code so changes are made in the correct layer.

## Repository Root

`D:/mage-app/`

| Folder | Purpose |
|---|---|
| `frontend/` | Next.js frontend — pages, UI, client API calls |
| `backend/` | FastAPI backend — API routes, orchestration, adapters |
| `fusion-layer/` | Copied ARM/PFM fusion implementation + mock models |
| `database/` | Database area — currently a placeholder; persistence not implemented yet |
| `scripts/` | Project utility/one-off scripts |

> **Important:** `D:/ARM+PFM/fusion/` is the original fusion repository. **Do not modify it.**
> `D:/mage-app/fusion-layer/` is the copy used by MAGE.

---

# 1. FRONTEND

**Location:** `D:/mage-app/frontend/`

Technology: **Next.js / TypeScript**

| Path | What it does |
|---|---|
| `frontend/app/` | Next.js App Router pages/routes |
| `frontend/app/assessment/` | Assessment flow |
| `frontend/app/assessment/upload/page.tsx` | Collects modality files and submits assessment to backend |
| `frontend/app/assessment/processing/page.tsx` | Processing/loading flow and assessment navigation |
| `frontend/app/assessment/result/page.tsx` | Fetches and displays backend assessment/fusion result |
| `frontend/app/dashboard/` | Dashboard pages |
| `frontend/app/fusion/` | Fusion explorer/visualization UI |
| `frontend/src/components/` | Reusable UI components |
| `frontend/src/components/assessment/` | Assessment-specific components |
| `frontend/src/components/modalities/` | Face, dorsal hand, and blood input UI |
| `frontend/src/components/results/` | Result/history UI |
| `frontend/src/context/` | React application context |
| `frontend/src/hooks/` | Custom React hooks |
| `frontend/src/lib/` | Frontend utilities |
| `frontend/src/types/` | TypeScript types |
| `frontend/public/` | Static assets |
| `frontend/middleware.ts` | Current frontend middleware/dev auth bypass |
| `frontend/package.json` | Frontend dependencies/scripts |
| `frontend/tsconfig.json` | TypeScript configuration and `@/` alias |

### Frontend → backend flow

```text
Assessment UI
    ↓
/assessment/upload
    ↓
POST http://127.0.0.1:8000/api/assessment
    ↓
Backend
    ↓
assessment_id
    ↓
/assessment/processing
    ↓
GET /api/assessment/{id}
    ↓
/assessment/result
```

**The frontend does not call ARM/PFM directly.**

---

# 2. BACKEND API

**Location:** `D:/mage-app/backend/`

Technology: **FastAPI / Python**

```text
backend/
└── src/
    ├── main.py
    ├── config.py
    ├── schemas/
    ├── routes/
    ├── services/
    ├── adapters/
    ├── middleware/
    └── utils/
```

| Path | What it does |
|---|---|
| `backend/src/main.py` | Creates FastAPI application and mounts routes |
| `backend/src/config.py` | Backend configuration/environment settings |
| `backend/src/routes/assessment.py` | Assessment API endpoints |
| `backend/src/services/assessment_service.py` | Orchestrates assessment execution |
| `backend/src/services/model_adapter_service.py` | Selects/runs modality adapters |
| `backend/src/services/fusion_service.py` | Calls real ARM + PFM |
| `backend/src/adapters/face_adapter.py` | Face model output → `ModelPrediction` |
| `backend/src/adapters/dorsal_adapter.py` | Dorsal model output → `ModelPrediction` |
| `backend/src/adapters/blood_adapter.py` | Blood model output → `ModelPrediction` |
| `backend/src/schemas/fusion.py` | Backend Pydantic fusion schema |
| `backend/src/routes/health.py` | Health check |

### Main API

```text
GET  /health
POST /api/assessment
GET  /api/assessment/{id}
```

Backend development server:

```text
http://127.0.0.1:8000
```

### Backend pipeline

```text
HTTP request
    ↓
Validate request
    ↓
Select modality adapters
    ↓
Run models
    ↓
ModelPrediction[]
    ↓
Fusion service
    ↓
ARM
    ↓
PFM
    ↓
FusionResult
    ↓
JSON response
```

**Current storage is in-memory development storage. Database persistence is not implemented yet.**

---

# 3. FUSION LAYER

**Location:** `D:/mage-app/fusion-layer/`

Source copy:

`D:/ARM+PFM/fusion/`

The original source remains untouched.

| Path | What it does |
|---|---|
| `fusion-layer/arm/` | ARM implementation |
| `fusion-layer/arm/arm.py` | ARM weighting/reliability logic |
| `fusion-layer/arm/pfm.py` | Prediction Fusion Module |
| `fusion-layer/arm/schemas.py` | `ModelPrediction` and ARM/PFM schemas |
| `fusion-layer/mock_models/` | Development mock models |
| `fusion-layer/mock_models/face_mock.py` | Mock face prediction |
| `fusion-layer/mock_models/dorsal_mock.py` | Mock dorsal prediction |
| `fusion-layer/mock_models/blood_mock.py` | Mock blood prediction |
| `fusion-layer/tests/` | Fusion tests |
| `fusion-layer/data/error_history.json` | ARM historical error data/runtime dependency |
| `fusion-layer/demo_pipeline.py` | Example ARM → PFM pipeline |

### Core fusion flow

```text
ModelPrediction[]
       ↓
ARM.compute_weights()
       ↓
ARMModelResult[]
       ↓
PredictionFusionModule.fuse()
       ↓
FusionResult
```

`FusionResult` contains:

```text
fused_age_bins
fused_predicted_age
fused_confidence
model_contributions
```

### Model contract

Every model adapter must ultimately produce:

```text
model_name
predicted_age
confidence
age_bins
```

Current:

```text
face_adapter  → face_mock
dorsal_adapter → dorsal_mock
blood_adapter → blood_mock
```

Later:

```text
face_adapter  → real face model
dorsal_adapter → real dorsal model
blood_adapter → real blood model
```

Keep the adapter output contract as `ModelPrediction` so ARM/PFM does not need to change when real models are introduced.

---

# 4. LAYER OWNERSHIP

## Frontend owns
- UI and pages
- modality selection
- upload UI
- navigation
- API calls
- result presentation
- fusion explorer visualization

## Backend owns
- API endpoints
- request validation
- adapter orchestration
- model execution
- ARM/PFM invocation
- result serialization
- future database persistence
- future auth/RBAC enforcement

## Fusion layer owns
- ARM
- PFM
- reliability calculations
- gating
- fusion math
- `ModelPrediction` contract
- fusion validation
- historical error profiles
- development mock models

## Database owns

**Not implemented yet.** Planned storage includes:
- users
- organizations
- patients
- assessments
- assessment inputs
- model predictions
- fusion results
- audit logs
- datasets
- experiments
- model configurations

---

# 5. WHERE TO MAKE CHANGES

| If you want to change... | Go here |
|---|---|
| UI/page | `D:/mage-app/frontend/` |
| Assessment flow | `frontend/app/assessment/` |
| API endpoint | `backend/src/routes/` |
| Assessment orchestration | `backend/src/services/assessment_service.py` |
| Model selection/execution | `backend/src/services/model_adapter_service.py` |
| Face/Dorsal/Blood adapter | `backend/src/adapters/` |
| ARM/PFM integration | `backend/src/services/fusion_service.py` |
| Fusion weighting/math | `D:/mage-app/fusion-layer/` |
| Replace mock model | Relevant file in `backend/src/adapters/` |
| Database | `D:/mage-app/database/` + backend database layer |

---

# 6. CURRENT STATUS

| Area | Status |
|---|---|
| Frontend | ✅ Migrated to `frontend/` |
| Backend API | ✅ FastAPI working |
| ARM | ✅ Integrated |
| PFM | ✅ Integrated |
| Mock models | ✅ Integrated through adapters |
| 7 modality combinations | ✅ Verified |
| Frontend assessment flow | ✅ Backend-wired |
| Result page | ✅ Backend result-wired |
| Database persistence | ⏳ Not implemented |
| Real model inference | ⏳ Future |
| Real authentication/RBAC | ⏳ Future |
| Dashboard API integration | ⏳ Future |

---

# 7. GOLDEN RULE

```text
Frontend
   ↓ HTTP API
Backend
   ↓ adapters
Models
   ↓ ModelPrediction
ARM
   ↓ ARMModelResult
PFM
   ↓ FusionResult
Backend
   ↓ JSON
Frontend
```

**Never bypass the backend from the production frontend to call ARM/PFM directly.**

**Never modify `D:/ARM+PFM/fusion/`.**

When replacing mock models, preserve the `ModelPrediction` contract so the fusion layer remains stable.
