"""Risk calculation request/response models."""

from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, Dict, Any


class RiskRequest(BaseModel):
    """Input payload for POST /calculate-risk."""
    aqi: float
    heart_rate: float
    spo2: float
    user_id: Optional[str] = None
    city: Optional[str] = None
    # Add profile to allow backend scoring
    profile: Optional[Dict[str, Any]] = None


class RiskResponse(BaseModel):
    """Output from the risk engine."""
    risk_score: float
    risk_level: str
    alert_flag: bool
    preventive_suggestions: list[str]


class RiskHistoryResponse(BaseModel):
    id: str = Field(alias="_id")
    user_id: str
    risk_score: float
    risk_level: str
    alert_flag: bool
    preventive_suggestions: list[str]
    timestamp: datetime

    class Config:
        populate_by_name = True


# ── MongoDB sample document ──────────────────────────────
# {
#   "_id": ObjectId("..."),
#   "user_id": "abc123",
#   "risk_score": 72.5,
#   "risk_level": "Moderate",
#   "alert_flag": false,
#   "preventive_suggestions": ["Wear a mask outdoors..."],
#   "timestamp": ISODate("2026-02-26T10:20:00Z")
# }
