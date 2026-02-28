"""
Breathometer AI — FastAPI Backend
──────────────────────────────────
Entry point. Configures CORS, lifespan events, and route includes.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from database import connect_db, disconnect_db
from routes import aqi, risk, users, analytics, chat, predict, finger_ppg
import os

DEMO_MODE = os.getenv("DEMO_MODE", "true").lower() == "true"


# ── Lifespan: connect/disconnect MongoDB ─────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup & shutdown events."""
    try:
        await connect_db()
    except Exception as e:
        print(f"[WARNING] MongoDB connection failed — running in mock-data mode: {e}")
    yield
    try:
        await disconnect_db()
    except Exception:
        pass


# ── App ───────────────────────────────────────────────────
app = FastAPI(
    title="Breathometer AI",
    description="Real-time air quality + lung impact monitoring API",
    version="1.0.0",
    lifespan=lifespan,
)

# ── CORS — allow frontend dev server + any origin for demo
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],                  # tighten in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Register routes ──────────────────────────────────────
app.include_router(aqi.router)
app.include_router(risk.router)
app.include_router(users.router)
app.include_router(analytics.router)
app.include_router(chat.router)
app.include_router(predict.router)
app.include_router(finger_ppg.router)

@app.get("/", tags=["Health"])
async def root():
    return {
        "app": "Breathometer AI",
        "status": "running",
        "docs": "/docs",
        "endpoints": ["/aqi/{city}", "/calculate-risk", "/user/{id}", "/public-analytics", "/predict-pm25"],
    }

# Forced reload trigger
