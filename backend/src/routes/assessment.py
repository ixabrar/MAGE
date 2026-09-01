from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from datetime import datetime, timezone
import uuid

from schemas.fusion import AssessmentRequest, AssessmentResponse, FusionResult
from services.assessment_service import run_assessment

router = APIRouter()

# In-memory store for development only.
_assessments: Dict[str, dict] = {}


@router.post("/api/assessment", response_model=AssessmentResponse)
async def create_assessment(request: AssessmentRequest):
    try:
        outcome = run_assessment(request)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Internal error: {exc}") from exc

    assessment_id = f"assess_{uuid.uuid4().hex[:8]}"
    created_at = datetime.now(timezone.utc).isoformat()

    record = {
        "assessment_id": assessment_id,
        "status": "completed",
        "result": outcome["result"].model_dump(),
        "created_at": created_at,
    }
    _assessments[assessment_id] = record

    return JSONResponse(content=AssessmentResponse(**record).model_dump())


@router.get("/api/assessment/{assessment_id}")
async def get_assessment(assessment_id: str):
    record = _assessments.get(assessment_id)
    if not record:
        raise HTTPException(status_code=404, detail="Assessment not found")
    return JSONResponse(content=record)
