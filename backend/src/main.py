from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from routes import assessment

app = FastAPI(title="MAGE Backend", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(assessment.router)


@app.get("/health")
def health():
    return JSONResponse({"status": "ok"})

@app.get("/")
def greet():
    return JSONResponse({"status":"Welcome to MAGE"})