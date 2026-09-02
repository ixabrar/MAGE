from fastapi import Header, HTTPException
from core.supabase import supabase


def get_current_doctor_id(authorization: str = Header(None)) -> str:
    if not authorization:
        raise HTTPException(
            status_code=401,
            detail="Authorization header missing"
        )

    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Invalid authorization header"
        )

    token = authorization.replace("Bearer ", "", 1).strip()

    if not token:
        raise HTTPException(
            status_code=401,
            detail="Access token missing"
        )

    try:
        response = supabase.auth.get_user(token)
    except Exception:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired access token"
        )

    if not response.user:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired access token"
        )

    user = response.user

    # Verify that this user is actually a doctor
    profile_response = (
        supabase
        .table("profiles")
        .select("id, role")
        .eq("id", user.id)
        .single()
        .execute()
    )

    if not profile_response.data:
        raise HTTPException(
            status_code=403,
            detail="User profile not configured"
        )

    if profile_response.data["role"] != "doctor":
        raise HTTPException(
            status_code=403,
            detail="Doctor access required"
        )

    return str(user.id)