from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from typing import List
from uuid import UUID
from datetime import datetime, date
import io

from core.supabase import supabase
from schemas.patient import PatientCreate, PatientUpdate, PatientResponse, PatientHistoryRecord, PatientHistoryRecordCreate, BioAgePredictionRequest
from services.bio_age_service import predict_bio_age_and_explain
from services.pdf_service import generate_bio_age_pdf
from services.llm_service import generate_health_recommendations

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


@router.post("/{patient_id}/predict-bio-age", response_class=StreamingResponse)
async def predict_bio_age(
    patient_id: UUID,
    payload: BioAgePredictionRequest,
    doctor_id: str = Depends(get_current_doctor_id)
):
    # Verify ownership
    verify = supabase.table("patients").select("*").eq("id", str(patient_id)).eq("doctor_id", doctor_id).execute()
    if not verify.data:
        raise HTTPException(status_code=404, detail="Patient not found or unauthorized")
        
    patient_data = verify.data[0]
    
    # Calculate chronological age
    dob_str = patient_data.get("date_of_birth")
    if not dob_str:
        raise HTTPException(status_code=400, detail="Patient date of birth is missing")
        
    dob = date.fromisoformat(dob_str[:10]) # Handle ISO format variations
    today = date.today()
    chronological_age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
    
    # Run prediction and SHAP
    try:
        features_dict = payload.model_dump()
        analysis_results = predict_bio_age_and_explain(features_dict, float(chronological_age))
        
        # Add LLM recommendations if the age gap is positive
        if analysis_results.get("bio_age_gap", 0) > 0:
            factors = analysis_results.get("top_contributing_factors", [])
            recommendations_html = generate_health_recommendations(factors)
            analysis_results["recommendations"] = recommendations_html
        else:
            analysis_results["recommendations"] = ""
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")
        
    # Generate PDF
    try:
        pdf_bytes = generate_bio_age_pdf(str(patient_id), analysis_results)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF generation error: {str(e)}")
        
    # Return as streaming response
    pdf_stream = io.BytesIO(pdf_bytes)
    return StreamingResponse(
        pdf_stream, 
        media_type="application/pdf", 
        headers={
            "Content-Disposition": f"attachment; filename=bio_age_report_{patient_id}.pdf"
        }
    )
