"""
ML Predictor Service — loads trained models and predicts PM2.5.
Model must be trained offline before starting the server.
"""

import os
import numpy as np

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ML_DIR = os.path.join(os.path.dirname(SCRIPT_DIR), "ml")
PM25_MODEL_PATH = os.path.join(ML_DIR, "pm25_model.pkl")

_pm25_model = None
model_available = False
model_error = "Not loaded."

def load_model():
    global _pm25_model, model_available, model_error
    try:
        import joblib
        
        # Load PM2.5
        if os.path.exists(PM25_MODEL_PATH):
            _pm25_model = joblib.load(PM25_MODEL_PATH)
            model_available = True
            model_error = ""
            print(f"[SUCCESS] ML model loaded from {PM25_MODEL_PATH}")
        else:
            model_available = False
            model_error = "Model file pm25_model.pkl not found."
            print("[ERROR] PM2.5 Model file not found — Please train model before utilizing prediction API.")
            
    except Exception as e:
        model_available = False
        model_error = f"Exception: {str(e)}"
        print(f"[ERROR] Could not load ML models: {e}")

# Load once at import time
load_model()

def get_model_error() -> str:
    return model_error

def is_model_available() -> bool:
    return model_available

def predict_pm25(temperature: float, humidity: float, pressure: float,
                 visibility: float, wind_speed: float) -> float | None:
    """Predict PM2.5 from 5 weather features. Returns None on failure."""
    if not model_available or _pm25_model is None:
        return None
    try:
        features = np.array([[temperature, humidity, pressure, visibility, wind_speed]])
        result = float(_pm25_model.predict(features)[0])
        return round(max(0, result), 2)
    except Exception as e:
        print(f"[WARNING]  PM2.5 Prediction error: {e}")
        return None
