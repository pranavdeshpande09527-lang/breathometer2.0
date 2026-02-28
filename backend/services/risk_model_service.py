"""
Inference Service for Respiratory ML Prediction (Environmental Regression).
Loads `risk_model.pkl` natively. Predicts base environmental risk.
Applies specific Medical Safety Guardrails & personal vulnerability post-scaling at runtime.
"""

import os
import joblib
import json
import pandas as pd
import numpy as np

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ML_DIR = os.path.join(os.path.dirname(SCRIPT_DIR), "ml")
MODEL_PATH = os.path.join(ML_DIR, "risk_model.pkl")
META_PATH = os.path.join(ML_DIR, "risk_model_meta.json")

_risk_pipeline = None
_risk_meta = None
model_available = False
model_error = "Not loaded."

def load_risk_model():
    global _risk_pipeline, _risk_meta, model_available, model_error
    try:
        if os.path.exists(MODEL_PATH) and os.path.exists(META_PATH):
            _risk_pipeline = joblib.load(MODEL_PATH)
            with open(META_PATH, "r") as f:
                _risk_meta = json.load(f)
            model_available = True
            model_error = ""
            print(f"[SUCCESS] Advanced Environmental Risk model loaded from {MODEL_PATH}")
        else:
            model_available = False
            model_error = "Model file risk_model.pkl or meta NOT found."
            print("[ERROR] Risk Model not found. Run train_risk_model.py to initialize.")
    except Exception as e:
        model_available = False
        model_error = f"Exception: {str(e)}"
        print(f"[ERROR] Could not load Risk ML model: {e}")

# Try to load simultaneously
load_risk_model()


def get_risk_model_status():
    return model_available, model_error


def inference_air_quality_risk(payload_dict: dict) -> dict:
    """Predicts regression score, applies medical overrides, formats JSON output."""
    if not model_available or _risk_pipeline is None:
        return None

    try:
        pm25 = payload_dict.get("PM2.5", 0)
        pm10 = payload_dict.get("PM10", 0)
        no2 = payload_dict.get("NO2", 0)
        o3 = payload_dict.get("O3", 0)
        so2 = payload_dict.get("SO2", 0)
        co = payload_dict.get("CO", 0)
        
        aqi = payload_dict.get("AQI", pm25 * 3) # Failsafe AQI approximation
        temperature = payload_dict.get("Temperature", 25)
        humidity = payload_dict.get("Humidity", 50)
        wind_speed = payload_dict.get("WindSpeed", 0)
        
        # Environmental Inference (No Personal Variables)
        # Match order: AQI, PM10, PM2.5, NO2, SO2, O3, Temperature, Humidity, WindSpeed
        df_in = pd.DataFrame([{
            "AQI": aqi, "PM10": pm10, "PM2.5": pm25, "NO2": no2, 
            "SO2": so2, "O3": o3, "Temperature": temperature, 
            "Humidity": humidity, "WindSpeed": wind_speed
        }])

        # Regression Output (Base HealthImpactScore 0-100)
        base_score = float(_risk_pipeline.predict(df_in)[0])
        base_score = max(0.0, min(100.0, base_score)) # Clamp to 0-100
        
        # Calculate pseudo-confidence (Standard Deviation across estimators in VotingRegressor)
        try:
            scaler = _risk_pipeline.named_steps["scaler"]
            voting_reg = _risk_pipeline.named_steps["regressor"]
            X_scaled = scaler.transform(df_in)
            
            preds = [est.predict(X_scaled)[0] for _, est in voting_reg.estimators]
            std_dev = np.std(preds)
            
            # Confidence Logic: High standard deviation -> Low confidence
            # if std_dev is 0, 100% confidence. If std_dev is 50, ~10% confidence.
            confidence = max(10.0, 100.0 - (std_dev * 2.5))
        except Exception as e:
            print("Fallback confidence error:", e)
            confidence = 85.0 # Fallback 

        confidence = round(confidence, 2)
        
        # Post-Adjustment using Personal Profile
        age = payload_dict.get("Age", 30)
        smoking = str(payload_dict.get("Smoking_Status", "No")).title()
        condition = str(payload_dict.get("Lung_Condition", "None")).title()

        # Simple multiplicative vulnerability factor 
        vuln_factor = 1.0
        if age > 65:
            vuln_factor += 0.15
        if age < 12:
            vuln_factor += 0.1
        if smoking == "Yes":
            vuln_factor += 0.25
        if condition in ["Asthma", "Copd", "Bronchitis"]:
            vuln_factor += 0.35
            
        final_score = base_score * vuln_factor
        final_score = min(max(round(final_score, 1), 0.0), 100.0)
        
        # Map Score to Risk Level Class
        if final_score < 35:
            risk_level = "Low"
        elif final_score < 70:
            risk_level = "Moderate"
        else:
            risk_level = "High"

        # Apply Safety Guardrails AFTER everything
        if confidence < 60.0:
            risk_level = "Uncertain"
            # We don't change the score, just the class to uncertain

        # Escalation Logic
        if pm25 > 300:
            if risk_level not in ["Uncertain", "High"]:
                risk_level = "High"
            final_score = max(final_score, 85.0)
            
        if condition.lower() == "asthma" and aqi > 200:
            if risk_level == "Low":
                risk_level = "Moderate"
            final_score = max(final_score, 60.0)

        # Exposure escalation
        exposure_idx = 0.5 * pm25 + 0.2 * pm10 + 0.1 * no2 + 0.1 * o3 + 0.05 * so2 + 0.05 * co
        if exposure_idx > 100 and risk_level == "Low":
            risk_level = "Moderate"
            final_score = max(final_score, 50.0)

        return {
            "risk_level": risk_level,
            "risk_score": final_score,
            "confidence": confidence,
            "top_contributing_features": _risk_meta.get("top_contributing_features", [])[:3]
        }

    except Exception as e:
        print(f"[ERROR] Inference execution failed: {e}")
        return None
