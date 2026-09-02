import os
import sys
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

# Ensure backend/src is at the front of sys.path to prioritize local modules
src_dir = str(Path(__file__).resolve().parent)
if src_dir not in sys.path:
    sys.path.insert(0, src_dir)

# Add MSYS2/GTK DLL directory on Windows if present
if sys.platform == "win32":
    msys_bin = r"C:\msys64\ucrt64\bin"
    if os.path.exists(msys_bin):
        os.add_dll_directory(msys_bin)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from routes import assessment
from routes import auth
from routes import patients
from routes import admin_doctor
from routes import dorsal_hand
from routes import blood_report


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
app.include_router(dorsal_hand.router)
app.include_router(blood_report.router)

@app.on_event("startup")
async def preload_models():
    try:
        from adapters.face_adapter import _try_load_real_face_model
        print("[startup] preloading face Hierarchical MoE (EfficientNet-B0)...")
        _try_load_real_face_model()
        print("[startup] face model preloaded successfully")
    except Exception as e:
        print(f"[startup] face preload failed: {e}")

    try:
        from adapters.dorsal_adapter import _try_load_real_model
        print("[startup] preloading dorsal ResNet18...")
        _try_load_real_model()
        print("[startup] dorsal model preloaded successfully")
    except Exception as e:
        print(f"[startup] dorsal preload failed: {e}")


@app.get("/health")
def health():
    return JSONResponse({"status": "ok"})

@app.get("/")
def greet():
    return JSONResponse({"status": "Welcome to MAGE"})