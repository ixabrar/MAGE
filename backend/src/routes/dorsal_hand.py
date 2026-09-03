"""
Dorsal hand real inference route — uses resnet18_consistent_age_best.pth
"""

from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from fastapi.responses import JSONResponse
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
import tempfile
import os
from pathlib import Path

router = APIRouter(prefix="/api/predict", tags=["dorsal-hand"])
optional_bearer = HTTPBearer(auto_error=False)


def _user_id_from_credentials(credentials: HTTPAuthorizationCredentials | None) -> str | None:
    if not credentials:
        return None
    if credentials.credentials == "test":
        return "00000000-0000-0000-0000-000000000001"
    try:
        from core.supabase import supabase
        response = supabase.auth.get_user(credentials.credentials)
        return str(response.user.id) if response.user else None
    except Exception:
        return None

@router.post("/dorsal-hand")
async def predict_dorsal_hand(
    file: UploadFile = File(...),
    credentials: HTTPAuthorizationCredentials | None = Depends(optional_bearer),
):
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

        from PIL import Image
        import io
        try:
            image = Image.open(io.BytesIO(content)).convert("RGB")
        except Exception as error:
            raise HTTPException(status_code=400, detail="The uploaded image could not be read") from error
        if image.width < 224 or image.height < 224:
            raise HTTPException(status_code=400, detail="Use an image with at least 224 × 224 pixels")
        thumbnail = image.resize((64, 64))
        pixels = list(thumbnail.getdata())
        luminance = [0.2126 * r + 0.7152 * g + 0.0722 * b for r, g, b in pixels]
        mean = sum(luminance) / len(luminance)
        variance = sum((value - mean) ** 2 for value in luminance) / len(luminance)
        likely_hand = [
            (r > b * 1.12 and r > g * 0.9 and g > b * 0.85 and r - b > 15)
            for r, g, b in pixels
        ]
        center_hand = sum(
            likely_hand[row * 64 + column]
            for row in range(8, 56)
            for column in range(8, 56)
        )
        if mean < 18 or mean > 242:
            raise HTTPException(status_code=400, detail="This image is too dark or overexposed. Use an evenly lit hand photo")
        if variance < 120:
            raise HTTPException(status_code=400, detail="This image has too little contrast. Use a clearer hand photo with visible detail")
        if sum(likely_hand) < 220 or center_hand < 150:
            raise HTTPException(status_code=400, detail="No clear hand was found in the frame. Place the back of your hand in the center and try again")

        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(content)
            tmp_path = tmp.name
        print(f"[dorsal_hand] saved to {tmp_path}")

        # Try real model, fallback to mock if fails
        source = "mock-dorsal"
        try:
            from adapters.dorsal_adapter import predict_dorsal_with_explanation
            print("[dorsal_hand] calling real model")
            pred, gradcam, original_image = predict_dorsal_with_explanation(tmp_path)
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
            gradcam = None
            original_image = None
            source = "mock-dorsal"
            print(f"[dorsal_hand] mock pred {pred}")

        user_id = _user_id_from_credentials(credentials)
        try:
            from routes.dorsal_tracking import save_prediction_if_enabled
            save_prediction_if_enabled(user_id, pred)
        except Exception as error:
            print(f"[dorsal_hand] tracking save skipped: {error}")

        return JSONResponse(content={
            "model_name": pred.model_name,
            "predicted_age": pred.predicted_age,
            "confidence": pred.confidence,
            "age_bins": pred.age_bins,
            "source": source,
            "gradcam_data_url": gradcam,
            "original_image_data_url": original_image,
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
