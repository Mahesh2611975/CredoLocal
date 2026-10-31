import sys
import sklearn
import joblib


import os
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

from app.database import engine
from app.models.models import Base
from app.routers import auth, applications, lenders

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Microfinance Platform API",
    description="AI-powered blockchain-based microfinance underwriting platform",
    version="1.0.0",
)

origins = [
    "https://credo-local.vercel.app",
    "http://localhost:5173",
    "http://localhost:3000",
]

frontend_url = os.getenv("FRONTEND_URL")
if frontend_url and frontend_url not in origins:
    origins.append(frontend_url.rstrip("/"))

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth")
app.include_router(applications.router, prefix="/api/applications")
app.include_router(lenders.router, prefix="/api/lenders")


@app.get("/")
def root():
    return {"status": "ok", "message": "Microfinance Platform API"}


@app.get("/health")
def health():
    return {"status": "healthy"}


@app.get("/api/version-check")
def version_check():
    return {
        "python": sys.version,
        "sklearn": sklearn.__version__,
        "joblib": joblib.__version__
    }