from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from core.supabase import supabase

security = HTTPBearer(auto_error=False)

def get_current_doctor_id(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    if not credentials:
        raise HTTPException(
            status_code=401,
            detail="Access token missing or invalid format"
        )
        
    # Allow test bypass
    if credentials.credentials == "test":
        return "00000000-0000-0000-0000-000000000001"

    token = credentials.credentials

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

    # # Verify that this user is actually a doctor
    # try:
    #     profile_response = (
    #         supabase
    #         .table("profiles")
    #         .select("id, role")
    #         .eq("id", user.id)
    #         .single()
    #         .execute()
    #     )
    #     if not profile_response.data:
    #         raise HTTPException(
    #             status_code=403,
    #             detail="User profile not configured"
    #         )
    #     if profile_response.data["role"] != "doctor":
    #         raise HTTPException(
    #             status_code=403,
    #             detail="Doctor access required"
    #         )
    # except Exception as e:
    #     # For now, we are bypassing the profile check if the table doesn't exist
    #     pass

    return str(user.id)