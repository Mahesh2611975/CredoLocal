
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

load_dotenv()

from app.database import engine
from app.models.models import Base
from app.routers import auth, applications, lenders

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Microfinance Platform API",
    description="AI-powered blockchain-based microfinance underwriting platform",
    version="1.0.0",
)

# CORS configuration - use only ONE middleware
FRONTEND_URL = os.getenv(
    "FRONTEND_URL",
    "https://credo-local.vercel.app"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://credo-local.vercel.app",
        FRONTEND_URL,
        "http://localhost:5173",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth")
app.include_router(applications.router, prefix="/api/applications")
app.include_router(lenders.router, prefix="/api/lenders")


@app.get("/")
def root():
    return {
        "status": "ok",
        "message": "Microfinance Platform API"
    }


@app.get("/health")
def health():
    return {"status": "healthy"}
