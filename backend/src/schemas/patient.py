from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date, datetime
from uuid import UUID

class PatientBase(BaseModel):
    first_name: str
    last_name: str
    date_of_birth: date
    gender: str
    email: Optional[str] = None
    contact_number: Optional[str] = None

class PatientCreate(PatientBase):
    pass

class PatientUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    contact_number: Optional[str] = None
    is_active: Optional[bool] = None

class PatientHistoryRecordCreate(BaseModel):
    chronological_age: Optional[int] = None
    predicted_bio_age: Optional[float] = None
    bio_age_gap: Optional[float] = None
    ai_summary: Optional[str] = None
    doctor_remarks: Optional[str] = None

class PatientHistoryRecord(BaseModel):
    id: UUID
    patient_id: UUID
    doctor_id: UUID
    record_date: datetime
    chronological_age: Optional[int] = None
    predicted_bio_age: Optional[float] = None
    bio_age_gap: Optional[float] = None
    ai_summary: Optional[str] = None
    doctor_remarks: Optional[str] = None
    created_at: datetime

class PatientResponse(PatientBase):
    id: UUID
    doctor_id: UUID
    created_at: datetime
    updated_at: datetime
    is_active: bool = True
    history: Optional[List[PatientHistoryRecord]] = []

    class Config:
        from_attributes = True

class BioAgePredictionRequest(BaseModel):
    CRP: Optional[float] = None
    LBDEONO: Optional[float] = None
    LBDHDD: Optional[float] = None
    LBDLYMNO: Optional[float] = None
    LBDMONO: Optional[float] = None
    LBDNENO: Optional[float] = None
    LBXBAPCT: Optional[float] = None
    LBXEOPCT: Optional[float] = None
    LBXGH: Optional[float] = None
    LBXHCT: Optional[float] = None
    LBXHGB: Optional[float] = None
    LBXLYPCT: Optional[float] = None
    LBXMC: Optional[float] = None
    LBXMCHSI: Optional[float] = None
    LBXMCVSI: Optional[float] = None
    LBXMOPCT: Optional[float] = None
    LBXMPSI: Optional[float] = None
    LBXNEPCT: Optional[float] = None
    LBXPLTSI: Optional[float] = None
    LBXRBCSI: Optional[float] = None
    LBXRDW: Optional[float] = None
    LBXSAL: Optional[float] = None
    LBXSAPSI: Optional[float] = None
    LBXSASSI: Optional[float] = None
    LBXSATSI: Optional[float] = None
    LBXSBU: Optional[float] = None
    LBXSC3SI: Optional[float] = None
    LBXSCA: Optional[float] = None
    LBXSCH: Optional[float] = None
    LBXSCLSI: Optional[float] = None
    LBXSCR: Optional[float] = None
    LBXSGB: Optional[float] = None
    LBXSGL: Optional[float] = None
    LBXSGTSI: Optional[float] = None
    LBXSIR: Optional[float] = None
    LBXSKSI: Optional[float] = None
    LBXSLDSI: Optional[float] = None
    LBXSNASI: Optional[float] = None
    LBXSOSSI: Optional[float] = None
    LBXSPH: Optional[float] = None
    LBXSTB: Optional[float] = None
    LBXSTP: Optional[float] = None
    LBXSUA: Optional[float] = None
    LBXTC: Optional[float] = None
    LBXWBCSI: Optional[float] = None
    URXCRS: Optional[float] = None
    URXUCR: Optional[float] = None
    URXUMA: Optional[float] = None
    URXUMS: Optional[float] = None
    URDACT: Optional[float] = None
    LBXSCK: Optional[float] = None
    Gender: Optional[int] = None
    Weight: Optional[float] = None
    Height: Optional[float] = None
    Waist: Optional[float] = None
    Systolic_BP: Optional[float] = None
    Alcohol_days: Optional[int] = None
    Exercise_days: Optional[int] = None
    LBXGLU: Optional[float] = None
    Smoking_status_Former: Optional[int] = None
    Smoking_status_Never: Optional[int] = None
    log_CRP: Optional[float] = None
    log_LBXSAPSI: Optional[float] = None
    log_LBXWBCSI: Optional[float] = None
    log_LBXGH: Optional[float] = None
    log_LBXSCR: Optional[float] = None
    log_LBXGLU: Optional[float] = None
    chol_ratio: Optional[float] = None
    non_hdl: Optional[float] = None
    scr_albumin_ratio: Optional[float] = None
    inflam_score: Optional[float] = None
    NLR_proxy: Optional[float] = None
    glycation_gap: Optional[float] = None
    LBXRDW_sq: Optional[float] = None
    LBXMCVSI_sq: Optional[float] = None
    BMI: Optional[float] = None
    WHtR: Optional[float] = None
