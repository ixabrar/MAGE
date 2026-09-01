from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from core.supabase import supabase

router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"]
)


class LoginRequest(BaseModel):
    email: str
    password: str


@router.post("/login")
async def login(data: LoginRequest):

    try:
        response = supabase.auth.sign_in_with_password({
            "email": data.email,
            "password": data.password
        })

    except Exception as e:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    if not response.user or not response.session:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    user = response.user
    session = response.session

    profile_response = (
        supabase
        .table("profiles")
        .select("full_name, role")
        .eq("id", user.id)
        .single()
        .execute()
    )

    if not profile_response.data:
        raise HTTPException(
            status_code=403,
            detail="User profile not configured"
        )

    profile = profile_response.data

    return {
        "message": "Login successful",
        "access_token": session.access_token,
        "refresh_token": session.refresh_token,
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": profile["full_name"],
            "role": profile["role"]
        }
    }