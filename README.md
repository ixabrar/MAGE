# MAGE — Multimodal Age Estimation

MAGE is a multimodal biological-age estimation platform that integrates face, dorsal-hand, and blood-report inputs through an Adaptive Reliability Module (ARM) and Prediction Fusion Module (PFM) to produce calibrated age predictions.

## Repository Structure

| Directory | Purpose |
|---|---|
| `frontend/` | Next.js frontend — landing page, assessment flow, dashboard, fusion explorer |
| `backend/` | FastAPI backend — assessment orchestration, model adapters, ARM/PFM integration |
| `fusion-layer/` | Copied ARM/PFM fusion implementation with mock models for development |
| `database/` | Database boundary — placeholder; persistence not implemented yet |

> **Note:** The original fusion source repository is at `D:/ARM+PFM/fusion/` and must remain untouched. The `fusion-layer/` directory in this repository is the integrated copy used by the backend.

## Architecture

```
Frontend (Next.js)
  → Backend API (FastAPI)
    → Model Adapters
      → Mock Models
        → ARM / PFM
          → FusionResult
```

## Tech Stack

- **Frontend:** Next.js, TypeScript, Tailwind CSS, Framer Motion
- **Backend:** FastAPI, Uvicorn, Pydantic
- **Fusion:** ARM (Adaptive Reliability Module), PFM (Prediction Fusion Module)
- **Fonts:** Rajdhani (display), Inter (body)

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.11+
- pip / uv

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000

### Backend

```bash
cd backend
pip install -r requirements.txt
python -m uvicorn src.main:app --host 127.0.0.1 --port 8000
```

Backend health check: http://localhost:8000/health

## Assessment Flow

1. Select modalities: face, dorsal hand, blood report, or any combination
2. Upload inputs through the assessment UI
3. Frontend submits to `POST /api/assessment`
4. Backend runs adapters → ARM → PFM
5. Result displays fused predicted age, confidence, age bins, and model contributions

## Modality Support

All seven combinations are supported:

- Face
- Dorsal Hand
- Blood Report
- Face + Dorsal Hand
- Face + Blood
- Dorsal Hand + Blood
- Face + Dorsal Hand + Blood

## Development Notes

- `NEXT_PUBLIC_DEV_AUTH_BYPASS` is active during development; auth/RBAC is not enforced
- Mock models are used through backend adapters; real models can be plugged in later
- Database persistence is not yet implemented; assessment results are stored in memory during development

## Documentation

- `DESIGN-superhuman.md` — primary frontend design specification
- `SECURITY_HARDENING.md` — security considerations
- `FRONTEND_LEARNING.md` — frontend development notes
- `TERMS.md` — terms of use

## Contributing

Contributing members: Vikas, Abrar, Pruvesh (TEAM MOBIUS)

## License

Proprietary — all rights reserved.
