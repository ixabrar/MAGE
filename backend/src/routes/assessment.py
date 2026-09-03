from typing import Dict
from fastapi import APIRouter, HTTPException, Request, UploadFile, File, Form
from fastapi.responses import JSONResponse
from datetime import datetime, timezone
import uuid
import json
import tempfile
import os
from pathlib import Path

from schemas.fusion import AssessmentRequest, AssessmentResponse, FusionResult
from services.assessment_service import run_assessment
from services.image_validation_service import validate_face_image, validate_dorsal_hand_image

router = APIRouter()

# In-memory store for development only.
_assessments: Dict[str, dict] = {}


@router.post("/api/assessment/validate")
async def validate_image(request: Request):
    """
    Validate an uploaded image in real time before submitting for assessment.
    Returns: { "valid": bool, "modality": str, "message": str, "metadata": dict }
    """
    try:
        form = await request.form()
        modality = str(form.get("modality", "face")).lower()
        file_obj = form.get("file")

        if file_obj is None or not hasattr(file_obj, "read"):
            return JSONResponse(
                status_code=400,
                content={"valid": False, "message": "No image file provided for validation."}
            )

        content = await file_obj.read()  # type: ignore
        if not content:
            return JSONResponse(
                status_code=400,
                content={"valid": False, "message": "Uploaded file is empty."}
            )

        if modality == "face":
            is_valid, message, metadata = validate_face_image(content)
        elif modality in ("dorsal_hand", "dorsal", "hand"):
            is_valid, message, metadata = validate_dorsal_hand_image(content)
        else:
            is_valid, message, metadata = True, "Validation passed.", {}

        return {
            "valid": is_valid,
            "modality": modality,
            "message": message,
            "metadata": metadata,
        }
    except Exception as exc:
        return JSONResponse(
            status_code=500,
            content={"valid": False, "message": f"Validation error: {str(exc)}"}
        )


@router.post("/api/assessment", response_model=AssessmentResponse)
async def create_assessment(request: Request):
    # Support both JSON (legacy mock) and multipart/form-data (real image bytes)
    tmp_paths: list[str] = []
    try:
        content_type = request.headers.get("content-type", "")
        if "multipart/form-data" in content_type:
            form = await request.form()
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
                    modalities = [s.strip() for s in raw.split(",") if s.strip()]
            else:
                for key in ["face", "dorsal_hand", "blood"]:
                    if key in form:
                        modalities.append(key)
            if not modalities:
                raise ValueError("No modalities provided in multipart request")

            inputs: Dict[str, Dict[str, str | None]] = {}
            for modality in modalities:
                file_obj = form.get(modality) or form.get(f"{modality}_file") or form.get("file")
                if file_obj is not None and hasattr(file_obj, "filename") and hasattr(file_obj, "read"):
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

                    # Biometric Validation Check
                    if modality == "face":
                        is_valid, v_msg, _ = validate_face_image(tmp_path)
                        if not is_valid:
                            raise HTTPException(
                                status_code=400,
                                detail=f"Face Image Validation Failed: {v_msg}"
                            )
                    elif modality in ("dorsal_hand", "dorsal", "hand"):
                        is_valid, v_msg, _ = validate_dorsal_hand_image(tmp_path)
                        if not is_valid:
                            raise HTTPException(
                                status_code=400,
                                detail=f"Dorsal Hand Image Validation Failed: {v_msg}"
                            )

                    inputs[modality] = {"file_path": tmp_path, "file_url": str(getattr(file_obj, "filename", ""))}
                else:
                    text_url = form.get(f"{modality}_url") or form.get(f"{modality}_file_url")
                    if text_url:
                        inputs[modality] = {"file_url": str(text_url)}
                    else:
                        inputs[modality] = {"file_url": f"mock_{modality}.jpg"}

            context = {}
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
        for p in tmp_paths:
            try:
                if os.path.exists(p):
                    os.unlink(p)
            except Exception:
                pass

    assessment_id = f"assess_{uuid.uuid4().hex[:8]}"
    created_at = datetime.now(timezone.utc).isoformat()

    record = {
        "assessment_id": assessment_id,
        "status": "completed",
        "result": outcome["result"].model_dump(),
        "created_at": created_at,
        "modalities": assessment_req.modalities if 'assessment_req' in locals() else [],
        "source": "real_models" if any("file_path" in v for v in (assessment_req.inputs.values() if 'assessment_req' in locals() else [])) else "mock",
    }
    _assessments[assessment_id] = record

    return AssessmentResponse(
        assessment_id=assessment_id,
        status="completed",
        created_at=created_at,
        result=outcome["result"],
    )


@router.get("/api/assessment/{assessment_id}", response_model=AssessmentResponse)
async def get_assessment(assessment_id: str):
    if assessment_id not in _assessments:
        raise HTTPException(
            status_code=404,
            detail=f"Assessment '{assessment_id}' not found. In-memory store was reset or ID is invalid."
        )
    return _assessments[assessment_id]
