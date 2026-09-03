from fastapi import APIRouter, HTTPException
import urllib.request
import json
import os

from core.supabase import supabase_admin
from schemas.doctor import DoctorCreate, DoctorUpdate, DoctorResponse


router = APIRouter(
    prefix="/api/admin/doctors",
    tags=["Admin Doctors"]
)

def fetch_user_details(user_id: str) -> dict:
    try:
        supabase_url = os.environ.get("SUPABASE_URL")
        service_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
        if not supabase_url or not service_key:
            return {}
        url = f"{supabase_url}/auth/v1/admin/users/{user_id}"
        req = urllib.request.Request(url, headers={
            "apikey": service_key,
            "Authorization": f"Bearer {service_key}"
        })
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode())
            return {"email": data.get("email"), "banned_until": data.get("banned_until")}
    except Exception:
        return {}


@router.post("")
async def create_doctor(data: DoctorCreate):

    try:
        # Create user in Supabase Auth
        response = supabase_admin.auth.admin.create_user({
            "email": data.email,
            "password": data.password,
            "email_confirm": True,
            "user_metadata": {
                "full_name": data.full_name
            }
        })

        if not response.user:
            raise HTTPException(
                status_code=400,
                detail="Failed to create doctor"
            )

        user = response.user

        # Create doctor profile
        profile_response = (
            supabase_admin
            .table("profiles")
            .insert({
                "id": user.id,
                "full_name": data.full_name,
                "role": "doctor"
            })
            .execute()
        )

        if not profile_response.data:
            raise HTTPException(
                status_code=500,
                detail="Doctor created but profile creation failed"
            )

        return {
            "message": "Doctor created successfully",
            "doctor": {
                "id": user.id,
                "email": user.email,
                "full_name": data.full_name,
                "role": "doctor"
            }
        }

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )


@router.get("")
async def get_all_doctors():

    try:
        response = (
            supabase_admin
            .table("profiles")
            .select("id, full_name, role")
            .eq("role", "doctor")
            .execute()
        )

        doctors = []

        for doctor in response.data:
            details = fetch_user_details(doctor["id"])
            is_active = not bool(details.get("banned_until"))

            doctors.append({
                "id": doctor["id"],
                "email": details.get("email"),
                "full_name": doctor["full_name"],
                "role": doctor["role"],
                "is_active": is_active
            })

        return {
            "doctors": doctors
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )



@router.get("/{doctor_id}")
async def get_doctor_by_id(doctor_id: str):

    try:
        response = (
            supabase_admin
            .table("profiles")
            .select("id, full_name, role")
            .eq("id", doctor_id)
            .eq("role", "doctor")
            .maybe_single()
            .execute()
        )

        if not response.data:
            raise HTTPException(
                status_code=404,
                detail="Doctor not found"
            )

        doctor = response.data
        details = fetch_user_details(doctor_id)
        is_active = not bool(details.get("banned_until"))

        return {
            "doctor": {
                "id": doctor["id"],
                "email": details.get("email"),
                "full_name": doctor["full_name"],
                "role": doctor["role"],
                "is_active": is_active
            }
        }

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )



@router.put("/{doctor_id}")
async def update_doctor(
    doctor_id: str,
    data: DoctorUpdate
):

    try:
        # Check doctor exists
        response = (
            supabase_admin
            .table("profiles")
            .select("id, role")
            .eq("id", doctor_id)
            .eq("role", "doctor")
            .maybe_single()
            .execute()
        )

        if not response.data:
            raise HTTPException(
                status_code=404,
                detail="Doctor not found"
            )

        # Update profile
        profile_updates = {}

        if data.full_name is not None:
            profile_updates["full_name"] = data.full_name

        if profile_updates:
            (
                supabase_admin
                .table("profiles")
                .update(profile_updates)
                .eq("id", doctor_id)
                .execute()
            )

        # Update Supabase Auth
        auth_updates = {}

        if data.email is not None:
            auth_updates["email"] = data.email

        if data.full_name is not None:
            auth_updates["user_metadata"] = {
                "full_name": data.full_name
            }

        if auth_updates:
            supabase_admin.auth.admin.update_user_by_id(
                doctor_id,
                auth_updates
            )

        return {
            "message": "Doctor updated successfully"
        }

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )



@router.delete("/{doctor_id}")
async def delete_doctor(doctor_id: str):

    try:
        # Check doctor exists
        response = (
            supabase_admin
            .table("profiles")
            .select("id, role")
            .eq("id", doctor_id)
            .eq("role", "doctor")
            .maybe_single()
            .execute()
        )

        if not response.data:
            raise HTTPException(
                status_code=404,
                detail="Doctor not found"
            )

        supabase_admin.auth.admin.update_user_by_id(
            doctor_id,
            {"ban_duration": "876000h"}
        )

        return {
            "message": "Doctor disabled successfully"
        }

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )

@router.post("/{doctor_id}/enable")
async def enable_doctor(doctor_id: str):

    try:
        # Check doctor exists
        response = (
            supabase_admin
            .table("profiles")
            .select("id, role")
            .eq("id", doctor_id)
            .eq("role", "doctor")
            .maybe_single()
            .execute()
        )

        if not response.data:
            raise HTTPException(
                status_code=404,
                detail="Doctor not found"
            )

        # Enable Auth user by removing ban
        supabase_admin.auth.admin.update_user_by_id(
            doctor_id,
            {"ban_duration": "none"}
        )

        return {
            "message": "Doctor enabled successfully"
        }

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )