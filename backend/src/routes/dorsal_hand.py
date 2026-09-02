"""
Dorsal hand real inference route — uses resnet18_consistent_age_best.pth
"""

from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
import tempfile
import os
from pathlib import Path

router = APIRouter(prefix="/api/predict", tags=["dorsal-hand"])

@router.post("/dorsal-hand")
async def predict_dorsal_hand(file: UploadFile = File(...)):
    print(f"[dorsal_hand] received file={file.filename} content_type={file.content_type} size={file.size}")
    # Validate file type
    if not file.content_type or not file.content_type.startswith("image/"):
        print(f"[dorsal_hand] invalid content_type {file.content_type}")
        raise HTTPException(status_code=400, detail="Only image files are allowed for dorsal hand")
    if file.size and file.size > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large. Max 10MB")

    # Save to temp file so adapter can read via path (PIL)
    suffix = Path(file.filename or "dorsal.jpg").suffix or ".jpg"
    tmp_path = None
    try:
        print("[dorsal_hand] reading content")
        content = await file.read()
        print(f"[dorsal_hand] content len {len(content) if content else 0}")
        print(f"[dorsal_hand] header {content[:10] if content else b''}")
        if not content:
            raise HTTPException(status_code=400, detail="Empty file")

        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(content)
            tmp_path = tmp.name
        print(f"[dorsal_hand] saved to {tmp_path}")

        # Try real model, fallback to mock if fails
        source = "mock-dorsal"
        try:
            from adapters.dorsal_adapter import predict_dorsal_from_image
            print("[dorsal_hand] calling real model")
            pred = predict_dorsal_from_image(tmp_path)
            print(f"[dorsal_hand] real pred {pred}")
            source = "resnet18_consistent_age_best.pth"
        except Exception as e:
            import traceback; traceback.print_exc()
            print(f"[dorsal_hand] real model failed ({e}), fallback to mock")
            from pathlib import Path as _P
            import sys
            sys.path.insert(0, str(_P(__file__).resolve().parents[3] / "fusion-layer"))
            from mock_models.dorsal_mock import dorsal_mock
            pred = dorsal_mock("middle")
            source = "mock-dorsal"
            print(f"[dorsal_hand] mock pred {pred}")

        return JSONResponse(content={
            "model_name": pred.model_name,
            "predicted_age": pred.predicted_age,
            "confidence": pred.confidence,
            "age_bins": pred.age_bins,
            "source": source
        })

    finally:
        if tmp_path and os.path.exists(tmp_path):
            try:
                os.unlink(tmp_path)
            except Exception:
                pass


@router.get("/dorsal-hand/health")
async def dorsal_health():
    # Lightweight check — does model file exist and can it be loaded?
    from pathlib import Path as _Path
    candidates = [
        _Path(__file__).resolve().parents[2] / "models" / "resnet18_consistent_age_best.pth",
        _Path(__file__).resolve().parents[3] / "resnet18_consistent_age_best.pth",
    ]
    exists = any(p.exists() for p in candidates)
    size = next((p.stat().st_size for p in candidates if p.exists()), 0)
    try:
        # Try import torch to see if available
        import torch
        torch_ok = True
        torch_ver = torch.__version__
    except Exception as e:
        torch_ok = False
        torch_ver = str(e)

    return {
        "model": "resnet18_consistent_age_best.pth",
        "exists": exists,
        "size_bytes": size,
        "size_mb": round(size / (1024*1024), 1) if size else 0,
        "torch_available": torch_ok,
        "torch_version": torch_ver,
        "candidates": [str(p) for p in candidates],
    }
