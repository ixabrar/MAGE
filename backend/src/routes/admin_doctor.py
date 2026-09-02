from fastapi import APIRouter, HTTPException

from core.supabase import supabase_admin
from schemas.doctor import DoctorCreate, DoctorUpdate, DoctorResponse


router = APIRouter(
    prefix="/api/admin/doctors",
    tags=["Admin Doctors"]
)


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

            auth_response = (
                supabase_admin
                .auth.admin.get_user_by_id(doctor["id"])
            )

            email = None

            if auth_response.user:
                email = auth_response.user.email

            doctors.append({
                "id": doctor["id"],
                "email": email,
                "full_name": doctor["full_name"],
                "role": doctor["role"]
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

        auth_response = (
            supabase_admin
            .auth.admin.get_user_by_id(doctor_id)
        )

        email = None

        if auth_response.user:
            email = auth_response.user.email

        return {
            "doctor": {
                "id": doctor["id"],
                "email": email,
                "full_name": doctor["full_name"],
                "role": doctor["role"]
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

        # Soft delete Auth user
        supabase_admin.auth.admin.delete_user(
            doctor_id,
            should_soft_delete=True
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