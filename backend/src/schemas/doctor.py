from pydantic import BaseModel, EmailStr


class DoctorCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str


class DoctorUpdate(BaseModel):
    full_name: str | None = None
    email: EmailStr | None = None


class DoctorResponse(BaseModel):
    id: str
    email: str | None
    full_name: str
    role: str
