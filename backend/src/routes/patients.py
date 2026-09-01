from fastapi import APIRouter, HTTPException, Depends
from typing import List
from uuid import UUID
from datetime import datetime

from core.supabase import supabase
from schemas.patient import PatientCreate, PatientUpdate, PatientResponse, PatientHistoryRecord, PatientHistoryRecordCreate

router = APIRouter(prefix="/api/patients", tags=["patients"])


# Dummy dependency to simulate doctor auth for now
# In a real scenario, this would decode the Supabase JWT and extract the user ID
def get_current_doctor_id() -> str:
    # Example hardcoded doctor UUID for testing purposes
    return "00000000-0000-0000-0000-000000000001"


@router.post("/", response_model=PatientResponse)
async def create_patient(patient: PatientCreate, doctor_id: str = Depends(get_current_doctor_id)):
    data = patient.model_dump()
    data["doctor_id"] = doctor_id
    
    # Supabase uses ISO strings for dates
    data["date_of_birth"] = data["date_of_birth"].isoformat()
    
    response = supabase.table("patients").insert(data).execute()
    
    if not response.data:
        raise HTTPException(status_code=400, detail="Failed to create patient")
        
    return response.data[0]


@router.get("/", response_model=List[PatientResponse])
async def get_patients(doctor_id: str = Depends(get_current_doctor_id)):
    response = supabase.table("patients").select("*").eq("doctor_id", doctor_id).execute()
    return response.data


@router.get("/{patient_id}", response_model=PatientResponse)
async def get_patient(patient_id: UUID, doctor_id: str = Depends(get_current_doctor_id)):
    response = supabase.table("patients").select("*").eq("id", str(patient_id)).eq("doctor_id", doctor_id).execute()
    
    if not response.data:
        raise HTTPException(status_code=404, detail="Patient not found or unauthorized")
        
    patient_data = response.data[0]
    
    # Fetch history
    history_response = supabase.table("patient_history_records").select("*").eq("patient_id", str(patient_id)).execute()
    patient_data["history"] = history_response.data
    
    return patient_data


@router.put("/{patient_id}", response_model=PatientResponse)
async def update_patient(patient_id: UUID, patient: PatientUpdate, doctor_id: str = Depends(get_current_doctor_id)):
    # Verify ownership first
    verify = supabase.table("patients").select("id").eq("id", str(patient_id)).eq("doctor_id", doctor_id).execute()
    if not verify.data:
        raise HTTPException(status_code=404, detail="Patient not found or unauthorized")
        
    update_data = patient.model_dump(exclude_unset=True)
    if "date_of_birth" in update_data and update_data["date_of_birth"]:
        update_data["date_of_birth"] = update_data["date_of_birth"].isoformat()
        
    update_data["updated_at"] = datetime.utcnow().isoformat()
        
    response = supabase.table("patients").update(update_data).eq("id", str(patient_id)).execute()
    return response.data[0]


@router.delete("/{patient_id}")
async def delete_patient(patient_id: UUID, doctor_id: str = Depends(get_current_doctor_id)):
    # Verify ownership first
    verify = supabase.table("patients").select("id").eq("id", str(patient_id)).eq("doctor_id", doctor_id).execute()
    if not verify.data:
        raise HTTPException(status_code=404, detail="Patient not found or unauthorized")
        
    # First delete history (or rely on CASCADE in DB schema)
    supabase.table("patient_history_records").delete().eq("patient_id", str(patient_id)).execute()
    
    # Then delete patient
    response = supabase.table("patients").delete().eq("id", str(patient_id)).execute()
    return {"message": "Patient deleted successfully"}


@router.post("/{patient_id}/history", response_model=PatientHistoryRecord)
async def add_patient_history(patient_id: UUID, history: PatientHistoryRecordCreate, doctor_id: str = Depends(get_current_doctor_id)):
    # Verify ownership of the patient first
    verify = supabase.table("patients").select("id").eq("id", str(patient_id)).eq("doctor_id", doctor_id).execute()
    if not verify.data:
        raise HTTPException(status_code=404, detail="Patient not found or unauthorized")
        
    data = history.model_dump(exclude_unset=True)
    data["patient_id"] = str(patient_id)
    data["doctor_id"] = doctor_id
    
    response = supabase.table("patient_history_records").insert(data).execute()
    
    if not response.data:
        raise HTTPException(status_code=400, detail="Failed to add patient history")
        
    return response.data[0]
