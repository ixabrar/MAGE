from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from core.supabase import supabase_admin
from middleware.auth import get_current_doctor_id

router = APIRouter(prefix="/api/dorsal-tracking", tags=["dorsal-tracking"])


class BaselineRequest(BaseModel):
    predicted_age: float = Field(ge=0, le=120)
    confidence: float = Field(ge=0, le=1)
    age_bins: dict[str, float]
    predicted_at: datetime | None = None


def _db_error(error: Exception) -> HTTPException:
    return HTTPException(status_code=503, detail="Dorsal tracking storage is unavailable")


def _tracking_enabled(user_id: str) -> bool:
    response = (
        supabase_admin.table("dorsal_hand_tracking_profiles")
        .select("tracking_enabled")
        .eq("user_id", user_id)
        .maybe_single()
        .execute()
    )
    return bool(response.data and response.data.get("tracking_enabled"))


def save_prediction_if_enabled(user_id: str | None, prediction: Any, assessment_id: str | None = None) -> None:
    if not user_id:
        return
    try:
        if not _tracking_enabled(user_id):
            return
        supabase_admin.table("dorsal_hand_predictions").insert({
            "user_id": user_id,
            "assessment_id": assessment_id,
            "predicted_age": prediction.predicted_age,
            "confidence": prediction.confidence,
            "age_bins": prediction.age_bins,
            "model_name": prediction.model_name,
            "source": "resnet18_consistent_age_best.pth",
        }).execute()
    except Exception as error:
        print(f"[dorsal_tracking] prediction storage failed: {error}")


@router.post("/baseline")
def start_tracking(payload: BaselineRequest, user_id: str = Depends(get_current_doctor_id)):
    now = payload.predicted_at or datetime.now(timezone.utc)
    try:
        supabase_admin.table("dorsal_hand_tracking_profiles").upsert({
            "user_id": user_id,
            "tracking_enabled": True,
            "baseline_predicted_age": payload.predicted_age,
            "baseline_at": now.isoformat(),
        }, on_conflict="user_id").execute()
        supabase_admin.table("dorsal_hand_predictions").insert({
            "user_id": user_id,
            "predicted_at": now.isoformat(),
            "predicted_age": payload.predicted_age,
            "confidence": payload.confidence,
            "age_bins": payload.age_bins,
            "model_name": "dorsal",
            "source": "resnet18_consistent_age_best.pth",
            "is_baseline": True,
        }).execute()
    except Exception as error:
        print(f"[dorsal_tracking] baseline storage failed: {error}")
        raise _db_error(error) from error
    return {"tracking_enabled": True, "baseline_predicted_age": payload.predicted_age}


@router.get("/history")
def get_history(user_id: str = Depends(get_current_doctor_id)):
    try:
        profile = (
            supabase_admin.table("dorsal_hand_tracking_profiles")
            .select("tracking_enabled, baseline_predicted_age, baseline_at")
            .eq("user_id", user_id)
            .maybe_single()
            .execute()
        )
        records = (
            supabase_admin.table("dorsal_hand_predictions")
            .select("id, predicted_at, predicted_age, confidence, age_bins, is_baseline")
            .eq("user_id", user_id)
            .order("predicted_at", desc=False)
            .execute()
        )
    except Exception as error:
        raise _db_error(error) from error

    history = records.data or []
    baseline = profile.data or {}
    baseline_age = baseline.get("baseline_predicted_age")
    latest = history[-1] if history else None
    return {
        "tracking_enabled": bool(baseline.get("tracking_enabled")),
        "baseline_predicted_age": baseline_age,
        "baseline_at": baseline.get("baseline_at"),
        "latest_predicted_age": latest.get("predicted_age") if latest else None,
        "change_from_baseline": round(latest["predicted_age"] - baseline_age, 1) if latest and baseline_age is not None else None,
        "predictions": history,
    }
