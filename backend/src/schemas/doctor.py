from pydantic import BaseModel, EmailStr
from typing import Optional


class DoctorCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str


class DoctorUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None


class DoctorResponse(BaseModel):
    id: str
    email: Optional[str] = None
    full_name: str
    role: str
