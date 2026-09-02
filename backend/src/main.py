import os
import sys
from dotenv import load_dotenv


load_dotenv()

if sys.platform == "win32":
    os.add_dll_directory(r"C:\msys64\ucrt64\bin")

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from routes import assessment, auth, patients, admin_doctor, blood_report

app = FastAPI(title="MAGE Backend", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(assessment.router)
app.include_router(auth.router)
app.include_router(patients.router)
app.include_router(admin_doctor.router)
app.include_router(blood_report.router)

@app.get("/health")
def health():
    return JSONResponse({"status": "ok"})

@app.get("/")
def greet():
    return JSONResponse({"status": "Welcome to MAGE"})