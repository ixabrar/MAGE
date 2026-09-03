# MAGE — Multimodal Age-Guided Estimation

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI_0.111-009688.svg?style=flat&logo=fastapi)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Frontend-Next.js_16-black.svg?style=flat&logo=next.js)](https://nextjs.org)
[![PyTorch](https://img.shields.io/badge/Inference-PyTorch_2.x-EE4C2C.svg?style=flat&logo=pytorch)](https://pytorch.org)
[![TailwindCSS](https://img.shields.io/badge/Styling-Tailwind_v4-38B2AC.svg?style=flat&logo=tailwind-css)](https://tailwindcss.com)
[![License](https://img.shields.io/badge/License-Proprietary-blue.svg)](TERMS.md)

**MAGE** is a multimodal biological-age estimation platform that unifies facial features, dorsal-hand characteristics, and clinical blood laboratory reports through an **Adaptive Reliability Module (ARM)** and **Prediction Fusion Module (PFM)** to produce calibrated composite age estimations.

---

## Architecture Overview

```
                          ┌───────────────────────────┐
                          │   Next.js Frontend App    │
                          │ (Public / Doctor / Admin) │
                          └─────────────┬─────────────┘
                                        │  Multipart Form / REST
                                        ▼
                          ┌───────────────────────────┐
                          │      FastAPI Backend      │
                          │   (Assessment Service)    │
                          └─────────────┬─────────────┘
                                        │
           ┌────────────────────────────┼────────────────────────────┐
           ▼                            ▼                            ▼
┌──────────────────────┐     ┌──────────────────────┐     ┌──────────────────────┐
│     Face Adapter     │     │ Dorsal Hand Adapter  │     │    Blood Adapter     │
│  (EfficientNet-B0    │     │  (ResNet18 Backbone  │     │   (PyMuPDF Parser    │
│  Hierarchical MoE)   │     │  Landmark Classifier)│     │  + XGBoost TreeSHAP) │
└──────────┬───────────┘     └──────────┬───────────┘     └──────────┬───────────┘
           │                            │                            │
           └────────────────────────────┼────────────────────────────┘
                                        ▼
                   ┌─────────────────────────────────────────┐
                   │  Adaptive Reliability Module (ARM)      │
                   │  • Dynamic Cohort Error History         │
                   │  • Evidence Calibration (18-25 to 46+)  │
                   └────────────────────┬────────────────────┘
                                        ▼
                   ┌─────────────────────────────────────────┐
                   │   Prediction Fusion Module (PFM)        │
                   │   • Bayesian Density Integration        │
                   │   • Cross-Modal Uncertainty Minimization│
                   └────────────────────┬────────────────────┘
                                        ▼
                   ┌─────────────────────────────────────────┐
                   │         Fused Biological Age            │
                   │  • Composite Age & Confidence Interval  │
                   │  • Model Contribution Weights (Face/Hand)│
                   │  • Clinical Biomarker Attribution (SHAP)│
                   └─────────────────────────────────────────┘
```

---

## Active AI Models & Adapters

| Modality | Architecture / Model | Weights File | Input Pipeline | Output Format |
|---|---|---|---|---|
| **Face** | **EfficientNet-B0 Hierarchical MoE** (6 Gated Distributional Heads) | `backend/src/models/best_hierarchical_dist.pt` (~50.2 MB) | 224×224 RGB, ImageNet normalized | 101-bin probability density over ages 0–100 → Expected age + 4 standard cohorts |
| **Dorsal Hand** | **ResNet-18** (Landmark & Age Distribution Classifier) | `backend/src/models/resnet18_consistent_age_best.pth` | 224×224 RGB Center-Crop | Continuous age expectation + cohort probabilities |
| **Blood Chemistry** | **77-Biomarker Clinical Pipeline** + **XGBoost Regressor & TreeSHAP** | `backend/src/models/xgb_model.pkl` | Automated PyMuPDF table extraction & regex biomarker parser | Phenotypic bio-age gap + SHAP feature attribution |

---

## Key Features

### 1. Multimodal Biological Age Assessment
- Supports all **7 possible modality combinations**:
  - Individual: `Face`, `Dorsal Hand`, `Blood`
  - Bi-modal: `Face + Dorsal Hand`, `Face + Blood`, `Dorsal Hand + Blood`
  - Tri-modal: `Face + Dorsal Hand + Blood`
- Dynamic handling for missing modalities with automatic ARM re-weighting.

### 2. Interactive Real-Time Telemetry Interface
- **Concentric Biometric Radar**: Rotating orbital scan ring with real-time percentage counter (`0% → 100%`).
- **Synchronized 5-Stage Stepper**:
  1. *Multimodal Ingestion & Alignment* (Image validation & tensor normalization)
  2. *Deep Neural Feature Extraction* (EfficientNet-B0 MoE & ResNet-18 inference)
  3. *Adaptive Reliability Calibration (ARM)* (Empirical error profiling over age cohorts)
  4. *Prediction Fusion Module (PFM)* (Bayesian distribution integration)
  5. *Calibrated Biological Synthesis* (Composite metrics & report generation)
- **Live Telemetry Console**: Real-time streaming inference terminal log feed.
- **Seamless Dark Mode**: Zero-flash dark-canvas transitions (`#000000`) across all screen routes.

### 3. Role-Based Access Control (RBAC) & Portals
- **Public Users (`/assessment`)**: Privacy-first instant Face + Hand age estimation without mandatory account registration.
- **Doctor / Clinician Portal (`/dashboard/patients`)**:
  - Patient directory & biometric history tracking.
  - Blood report PDF parser with automatic biomarker extraction.
  - XGBoost phenotypic bio-age gap and SHAP feature importance graphs.
  - Clinical assessment PDF report generation (WeasyPrint / Jinja2).
- **System Admin Portal (`/dashboard/users`)**:
  - Doctor account provisioning and access revocation.
  - Audit logging of biological age runs and system telemetry.

---

## Repository Structure

```
MAGE/
├── backend/
│   ├── src/
│   │   ├── adapters/          # Face (Hierarchical MoE), Dorsal Hand (ResNet18), Blood
│   │   ├── models/            # Model weights (best_hierarchical_dist.pt, xgb_model.pkl)
│   │   ├── routes/            # assessment, auth, patients, admin_doctor, blood_report
│   │   ├── schemas/           # Pydantic schemas (fusion, bio-age, auth, patient)
│   │   ├── services/          # assessment_service, fusion_service, bio_age_service, pdf_service
│   │   └── main.py            # FastAPI application entrypoint & model preloader
│   ├── requirements.txt       # Backend dependencies (PyTorch, timm, FastAPI, XGBoost)
│   └── .env                   # Supabase & backend configuration
├── frontend/
│   ├── app/
│   │   ├── assessment/        # Assessment flow (upload, processing visualizer, result)
│   │   ├── auth/              # Sign in & sign up pages
│   │   ├── dashboard/         # Doctor patient list, admin user management, audit logs
│   │   ├── fusion/            # Technical ARM + PFM interactive simulator
│   │   ├── globals.css        # Tailwind v4 dark theme configuration
│   │   └── layout.tsx         # Root layout with dark background
│   ├── src/
│   │   ├── components/        # UI components (Radar, Stepper, Navigation, Shell)
│   │   └── lib/               # auth.ts (NextAuth v5), api.ts, design-tokens.ts
│   ├── package.json           # Next.js 16 + React 19 dependencies
│   └── .env.local             # Frontend environment variables (AUTH_SECRET, API_URL)
└── fusion-layer/              # ARM & PFM fusion logic and empirical error profiles
```

---

## Getting Started

### Prerequisites
- **Node.js**: `v18.0.0` or higher
- **Python**: `3.11` or `3.12`
- **Package Managers**: `npm` and `uv` (or `pip`)

---

### 1. Backend Setup (FastAPI)

```powershell
# Navigate to backend directory
cd backend

# Create virtual environment (recommended with uv)
uv venv
.\.venv\Scripts\activate

# Install dependencies
uv pip install -r requirements.txt

# Start backend server
python -m uvicorn src.main:app --host 127.0.0.1 --port 8000 --reload
```

* **Health Check:** `http://127.0.0.1:8000/health`
* **Swagger API Docs:** `http://127.0.0.1:8000/docs`

---

### 2. Frontend Setup (Next.js)

```powershell
# Navigate to frontend directory
cd frontend

# Install packages
npm install

# Create/verify frontend/.env.local
# (Contains AUTH_SECRET and NEXT_PUBLIC_API_URL=http://127.0.0.1:8000)

# Run development server
npm run dev
```

* **Web Application:** `http://localhost:3000`

---

## Pre-Configured Demo Accounts

| Role | Email | Password | Primary Portal |
|---|---|---|---|
| **Doctor / Clinician** | `doctor@mage.health` | `doctor123` | [`/dashboard/patients`](http://localhost:3000/dashboard/patients) |
| **System Admin** | `admin@mage.health` | `admin123` | [`/dashboard/users`](http://localhost:3000/dashboard/users) |
| **Public User** | *No login needed* | *N/A* | [`/assessment`](http://localhost:3000/assessment) |

---

## API Endpoints Reference

### Assessment & Fusion
- `POST /api/assessment`: Run multimodal assessment (supports multipart `face`, `dorsal_hand`, `blood` uploads or JSON metadata).
- `GET /api/assessment/{id}`: Retrieve stored assessment state, individual modality predictions, and ARM/PFM fused result.

### Blood Biomarker & Clinical Bio-Age
- `POST /api/blood-report/parse`: Upload laboratory PDF to extract 77 standardized biomarker values.
- `POST /api/patients/{id}/predict-bio-age`: Run XGBoost + TreeSHAP feature attribution on patient biomarkers.
- `GET /api/patients/{id}/pdf`: Generate clinical PDF biological age report.

### Authentication & Users
- `POST /api/auth/login`: Authenticate doctor/admin credentials with JWT session token.
- `GET /api/patients`: List patients (doctor access).
- `GET /api/admin/doctors`: Manage doctor accounts (admin access).

---

## Contributors

**TEAM MOBIUS:**
- **Purvesh** — Model Integration, Processing Engine & Full-Stack Fusion
- **Abrar** — Fusion Architecture & Pipeline Orchestration
- **Vikas** — Backend Engineering & Microservices
- **Vinita** — UI/UX Design & Dashboard Components

---

## License

Proprietary — All rights reserved. See [`TERMS.md`](TERMS.md) for terms of use.
