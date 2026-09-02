from typing import Dict
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import JSONResponse
from datetime import datetime, timezone
import uuid
import json
import tempfile
import os
from pathlib import Path

from schemas.fusion import AssessmentRequest, AssessmentResponse, FusionResult
from services.assessment_service import run_assessment

router = APIRouter()

# In-memory store for development only.
_assessments: Dict[str, dict] = {}


@router.post("/api/assessment", response_model=AssessmentResponse)
async def create_assessment(request: Request):
    # Support both JSON (legacy mock) and multipart/form-data (real image bytes)
    tmp_paths: list[str] = []
    try:
        content_type = request.headers.get("content-type", "")
        if "multipart/form-data" in content_type:
            form = await request.form()
            # modalities can be JSON array string or comma-separated string or repeated field
            modalities_raw = form.get("modalities")
            modalities: list[str] = []
            if modalities_raw is not None:
                raw = str(modalities_raw)
                try:
                    parsed = json.loads(raw)
                    if isinstance(parsed, list):
                        modalities = [str(m) for m in parsed]
                    else:
                        modalities = [str(parsed)]
                except Exception:
                    # fallback comma split
                    modalities = [s.strip() for s in raw.split(",") if s.strip()]
            else:
                # try to infer from files present
                for key in ["face", "dorsal_hand", "blood"]:
                    if key in form:
                        modalities.append(key)
            if not modalities:
                raise ValueError("No modalities provided in multipart request")

            inputs: Dict[str, Dict[str, str | None]] = {}
            for modality in modalities:
                # try modality key, modality_file, or generic file
                file_obj = form.get(modality) or form.get(f"{modality}_file") or form.get("file")
                # form.get may return str for non-file fields, check for UploadFile-like
                if file_obj is not None and hasattr(file_obj, "filename") and hasattr(file_obj, "read"):
                    # Validate size
                    content = await file_obj.read()  # type: ignore
                    if not content:
                        raise ValueError(f"Empty file for {modality}")
                    if len(content) > 10 * 1024 * 1024:
                        raise ValueError(f"File too large for {modality} (max 10MB)")
                    suffix = Path(str(getattr(file_obj, "filename", "") or f"{modality}.jpg")).suffix or ".jpg"
                    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
                        tmp.write(content)
                        tmp_path = tmp.name
                    tmp_paths.append(tmp_path)
                    inputs[modality] = {"file_path": tmp_path, "file_url": str(getattr(file_obj, "filename", ""))}  # type: ignore
                else:
                    # No file uploaded for this modality — allow fallback to mock via file_url if provided as text field
                    text_url = form.get(f"{modality}_url") or form.get(f"{modality}_file_url")
                    if text_url:
                        inputs[modality] = {"file_url": str(text_url)}
                    else:
                        # keep empty to trigger adapter mock fallback but still pass validation
                        inputs[modality] = {"file_url": f"mock_{modality}.jpg"}

            # Optional context fields
            context = {}
            # Allow extra json fields like patient_id, context
            for k in ["patient_id", "organization_id"]:
                if k in form:
                    context[k] = str(form.get(k))

            assessment_req = AssessmentRequest(modalities=modalities, inputs=inputs, context=context)
        else:
            body = await request.json()
            assessment_req = AssessmentRequest(**body)

        outcome = run_assessment(assessment_req)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except HTTPException:
        raise
    except Exception as exc:
        import traceback; traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal error: {exc}") from exc
    finally:
        # Cleanup will be after fusion; but keep files until after run_assessment (already done)
        # We'll delete tmp files after response is built, with slight delay via background cleanup
        pass

    assessment_id = f"assess_{uuid.uuid4().hex[:8]}"
    created_at = datetime.now(timezone.utc).isoformat()

    record = {
        "assessment_id": assessment_id,
        "status": "completed",
        "result": outcome["result"].model_dump(),
        "created_at": created_at,
        "modalities": assessment_req.modalities if 'assessment_req' in locals() else [],
        "source": "real_resnet18" if any("file_path" in v for v in (assessment_req.inputs.values() if 'assessment_req' in locals() else [])) else "mock",
    }
    _assessments[assessment_id] = record

    # Cleanup temp files now that fusion is done
    for p in tmp_paths:
        try:
            if os.path.exists(p):
                os.unlink(p)
        except Exception:
            pass

    return JSONResponse(content=AssessmentResponse(**{k: v for k, v in record.items() if k in ["assessment_id","status","result","created_at"]}).model_dump())


@router.get("/api/assessment/{assessment_id}")
async def get_assessment(assessment_id: str):
    record = _assessments.get(assessment_id)
    if not record:
        raise HTTPException(status_code=404, detail="Assessment not found")
    return JSONResponse(content=record)
