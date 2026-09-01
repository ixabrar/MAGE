from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date, datetime
from uuid import UUID

class PatientBase(BaseModel):
    first_name: str
    last_name: str
    date_of_birth: date
    gender: str
    contact_number: Optional[str] = None

class PatientCreate(PatientBase):
    pass

class PatientUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    contact_number: Optional[str] = None

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
    history: Optional[List[PatientHistoryRecord]] = []

    class Config:
        from_attributes = True
