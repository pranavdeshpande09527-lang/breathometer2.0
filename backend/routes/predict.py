from fastapi import APIRouter, HTTPException
from models.prediction import PredictionRequest, PredictionResponse
import models.prediction
from services.ml_predictor import predict_pm25, is_model_available, get_model_error
from services.risk_model_service import get_risk_model_status, inference_air_quality_risk

router = APIRouter(tags=["ML Prediction"])

@router.post("/predict-ai-lung-risk")
async def predict_ai_lung_risk(payload: dict):
    """
    Advanced ensemble ML endpoint for personalized lung risk forecasting.
    Expects standard payload dictionary (PM2.5, Age, Smoking_Status, etc.)
    """
    available, errorMsg = get_risk_model_status()
    if not available:
        raise HTTPException(
            status_code=503, 
            detail=f"Advanced Risk ML model not initialized. Please train and restart backend. Reason: {errorMsg}"
        )
        
    result = inference_air_quality_risk(payload)
    if result is None:
        raise HTTPException(status_code=500, detail="Inference execution failed internally.")
        
    return result

import httpx

@router.post("/predict-air-quality", response_model=PredictionResponse)
async def predict_air_quality(payload: PredictionRequest):
    """Predict PM2.5 via local ML model and fetch real PM10 from OpenWeather."""
    
    if not is_model_available():
        err = get_model_error()
        raise HTTPException(status_code=503, detail=f"ML model not initialized on server. Please train and restart backend. Reason: {err}")
        
    # 1. Local ML Model directly predicts PM 2.5
    pm25_result = predict_pm25(
        temperature=payload.temperature,
        humidity=payload.humidity,
        pressure=payload.pressure,
        visibility=payload.visibility,
        wind_speed=payload.wind_speed,
    )
    
    # 2. OpenWeather API for real PM10 Data 
    pm10_result = None
    lat, lon = 28.6139, 77.2090  # fallback to New Delhi
    
    try:
        api_key = "92b720fddf2a5c86fd6eb01f8a23430d"
        async with httpx.AsyncClient() as client:
            # Step A: Get Coordinates by City name
            geo_url = f"http://api.openweathermap.org/geo/1.0/direct?q={payload.city}&limit=1&appid={api_key}"
            geo_resp = await client.get(geo_url, timeout=5.0)
            if geo_resp.status_code == 200:
                geo_data = geo_resp.json()
                if len(geo_data) > 0:
                    lat, lon = geo_data[0]["lat"], geo_data[0]["lon"]

            # Step B: Fetch PM10 from Air Pollution API
            air_url = f"http://api.openweathermap.org/data/2.5/air_pollution?lat={lat}&lon={lon}&appid={api_key}"
            air_resp = await client.get(air_url, timeout=5.0)
            
            if air_resp.status_code == 200:
                data = air_resp.json()
                if "list" in data and len(data["list"]) > 0:
                    pm10_result = data["list"][0]["components"]["pm10"]
    except Exception as e:
        print(f"[WARNING] OpenWeather API failed: {e}")
        # Soft fallback if network fails
        pm10_result = pm25_result * 1.5 if pm25_result else 50.0 
        
    return {
        "predicted_pm25": pm25_result,
        "predicted_pm10": pm10_result if pm10_result is not None else 0.0
    }


def calculate_lung_risk_score(payload, override_aqi=None, override_spo2=None, override_cough=None, override_breath=None):
    """Core mathematical engine to calculate lung infection risk."""
    
    # Overrides for simulated historical data
    api_aqi = override_aqi if override_aqi is not None else payload.aqi
    api_spo2 = override_spo2 if override_spo2 is not None else payload.spo2
    api_cough = override_cough if override_cough is not None else payload.cough_severity
    api_breath = override_breath if override_breath is not None else payload.breathlessness_severity
    
    # 1. Environmental Risk (Max ~30%)
    env_risk = min(api_aqi / 300 * 15, 15) + min(payload.pm25 / 150 * 10, 10) + min(payload.pm10 / 250 * 5, 5)
    if payload.outdoor_exposure == "High":
        env_risk += 5
    elif payload.outdoor_exposure == "Medium":
        env_risk += 2
        
    # 2. Profile Vulnerability Risk (Max ~35%)
    prof_risk = 0.0
    if payload.age > 65: prof_risk += 10
    if payload.smoking: 
        prof_risk += 10
        if payload.cigarettes_per_day > 10:
            prof_risk += 5
    if payload.asthma: prof_risk += 5
    if payload.copd: prof_risk += 5
    if payload.previous_infection: prof_risk += 5
    
    # 3. Symptom Risk (Max ~40%)
    symp_risk = (api_cough * 1.0) + (api_breath * 1.5)
    if payload.cough_type == "Wet": symp_risk += 3
    if payload.symptoms_duration_days > 5: symp_risk += 2
    if payload.symptoms_duration_days > 10: symp_risk += 3
    
    if payload.wheezing: symp_risk += 4
    if payload.fever: symp_risk += 2.5
    if payload.chest_pain: symp_risk += 2.5
    
    if api_spo2 < 92:
        symp_risk += 10
    elif api_spo2 < 95:
        symp_risk += 5
        
    total_risk = min(env_risk + prof_risk + symp_risk, 100.0)
    
    # Determine Level and Explanation
    explanations = []
    if env_risk > 15:
        explanations.append("poor air quality")
    if prof_risk > 15:
        explanations.append("underlying health vulnerabilities")
    if symp_risk > 15:
        explanations.append("significant current symptoms")
        
    if total_risk < 30:
        level = "Low"
        base_exp = "Your lung infection risk is currently low."
    elif total_risk < 60:
        level = "Moderate"
        base_exp = "You have a moderate risk of lung infection."
    else:
        level = "High"
        base_exp = "You are at high risk for a lung infection."
        
    if explanations:
        explanation = f"{base_exp} This is primarily due to {', '.join(explanations)}."
    else:
        explanation = base_exp
        
    return total_risk, level, explanation

@router.post("/predict-lung-risk", response_model=models.prediction.LungRiskResponse)
async def predict_lung_risk(payload: models.prediction.LungRiskRequest):
    """Calculate lung infection risk based on environment, profile, and symptoms."""
    total_risk, level, explanation = calculate_lung_risk_score(payload)
    
    return {
        "risk_percentage": round(total_risk, 1),
        "risk_level": level,
        "explanation": explanation
    }

import random

def get_fallback_analysis(payload, avg_aqi, avg_spo2, avg_cough, avg_breath, highest_symptom, trend, spo2_drops):
    base_env_risk = min((avg_aqi / 300) * 100, 100)
    disease_scores = {
        "Asthma Exacerbation": base_env_risk * 0.4 + (30 if payload.asthma else 0) + (avg_breath * 3) + (10 if highest_symptom in ["Cough", "Breathlessness"] else 0),
        "Chronic Obstructive Pulmonary Disease (COPD)": base_env_risk * 0.3 + (30 if payload.copd else 0) + (15 if payload.smoking else 0) + (payload.age / 100 * 20),
        "Acute Bronchitis": base_env_risk * 0.5 + (avg_cough * 4) + (15 if payload.fever else 0) + (10 if payload.previous_infection else 0),
        "Chronic Bronchitis": base_env_risk * 0.4 + (20 if payload.smoking else 0) + (avg_cough * 3) + (payload.age / 100 * 10),
        "Emphysema": base_env_risk * 0.2 + (25 if payload.smoking else 0) + (10 if payload.copd else 0) + (payload.age / 100 * 15),
        "Respiratory Tract Infections": base_env_risk * 0.4 + (20 if payload.fever else 0) + (avg_cough * 2) + (10 if payload.previous_infection else 0),
        "Pneumonia": base_env_risk * 0.2 + (20 if payload.fever else 0) + (avg_breath * 4) + (20 if len(spo2_drops) >= 3 else 0),
        "Lung Cancer": base_env_risk * 0.1 + (30 if payload.smoking else 0) + (payload.cigarettes_per_day * 0.5) + (payload.age / 100 * 20)
    }
    disease_risks = [{"name": name, "risk_percentage": min(round(score, 1), 100.0)} for name, score in disease_scores.items()]
    disease_risks = sorted(disease_risks, key=lambda x: x.get("risk_percentage", 0), reverse=True)
    
    insights = []
    if avg_aqi > 150: insights.append("Your symptoms increased significantly on high AQI days.")
    else: insights.append("AQI remained healthy this week, supporting better lung function.")
    if len(spo2_drops) >= 3: insights.append("SpO₂ dipped below 95% multiple times. This indicates restricted airways.")
    else: insights.append("SpO₂ remained highly stable and healthy all week.")
    
    recommendation = "Continue monitoring your daily symptoms."
    if avg_aqi > 150: recommendation = "Strictly avoid outdoor exposure on high AQI days and use an N95 mask."
    elif payload.smoking: recommendation = "Reducing cigarette intake will significantly improve recovery speed."
    
    return insights[:2], disease_risks, recommendation

async def fetch_groq_ai_analysis(payload, avg_aqi, avg_spo2, avg_cough, avg_breath, highest_symptom, trend, spo2_drops):
    import httpx
    import json
    prompt = f"""You are an expert AI pulmonologist. Analyze this patient's 7-day environmental and symptom data.
    User Profile: Age: {payload.age}, Smoker: {payload.smoking} (Cigarettes/day: {payload.cigarettes_per_day}), Asthma: {payload.asthma}, COPD: {payload.copd}
    7-Day Averages -> AQI: {avg_aqi:.1f}, SpO2: {avg_spo2:.1f}%, Cough (0-10): {avg_cough:.1f}, Breathlessness (0-10): {avg_breath:.1f}
    Highest Symptom: {highest_symptom}, Weekly Risk Trend: {trend}
    
    Return EXACTLY a pure JSON object with this structure:
    {{
      "insights": ["<insight 1 (max 2 sentences)>", "<insight 2 (max 2 sentences)>"],
      "disease_risks": [
        {{"name": "Asthma Exacerbation", "risk_percentage": <number 0-100>}},
        {{"name": "Chronic Obstructive Pulmonary Disease (COPD)", "risk_percentage": <number>}},
        {{"name": "Acute Bronchitis", "risk_percentage": <number>}},
        {{"name": "Chronic Bronchitis", "risk_percentage": <number>}},
        {{"name": "Emphysema", "risk_percentage": <number>}},
        {{"name": "Respiratory Tract Infections", "risk_percentage": <number>}},
        {{"name": "Pneumonia", "risk_percentage": <number>}},
        {{"name": "Lung Cancer", "risk_percentage": <number>}}
      ],
      "recommendation": "<One highly actionable recommendation based on the data>"
    }}"""
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={
                    "Authorization": "Bearer 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",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "llama-3.1-8b-instant",
                    "messages": [{"role": "user", "content": prompt}],
                    "response_format": {"type": "json_object"},
                    "temperature": 0.2
                },
                timeout=12.0
            )
            if resp.status_code == 200:
                data = resp.json()
                ai_result = json.loads(data["choices"][0]["message"]["content"])
                disease_risks = sorted(ai_result.get("disease_risks", []), key=lambda x: x.get("risk_percentage", 0), reverse=True)
                return ai_result.get("insights", []), disease_risks, ai_result.get("recommendation", "")
            else:
                print(f"Groq API Failed with status {resp.status_code}: {resp.text}")
    except Exception as e:
        print(f"Groq Integration Error: {e}")
    
    return get_fallback_analysis(payload, avg_aqi, avg_spo2, avg_cough, avg_breath, highest_symptom, trend, spo2_drops)

@router.post("/generate-weekly-report", response_model=models.prediction.WeeklyReportResponse)
async def generate_weekly_report(payload: models.prediction.WeeklyReportRequest):
    """Generates a 7-day simulated history based on current inputs, and analyzes it for a weekly report."""
    
    daily_aqi, daily_spo2, daily_cough, daily_breath, daily_risks = [], [], [], [], []
    base_aqi, base_spo2 = payload.aqi, payload.spo2
    base_cough, base_breath = payload.cough_severity, payload.breathlessness_severity
    
    for day in range(7):
        variance_multiplier = (6 - day) / 6.0 
        sim_aqi = max(50, min(500, base_aqi + random.uniform(-40, 30) * variance_multiplier))
        sim_spo2 = max(85, min(100, base_spo2 + random.uniform(-2, 3) * variance_multiplier))
        sim_cough = max(0, min(10, base_cough + random.uniform(-3, 2) * variance_multiplier))
        sim_breath = max(0, min(10, base_breath + random.uniform(-3, 2) * variance_multiplier))
        
        daily_aqi.append(sim_aqi)
        daily_spo2.append(sim_spo2)
        daily_cough.append(sim_cough)
        daily_breath.append(sim_breath)
        
        day_risk, _, _ = calculate_lung_risk_score(payload, override_aqi=sim_aqi, override_spo2=sim_spo2, override_cough=sim_cough, override_breath=sim_breath)
        daily_risks.append(round(day_risk, 1)) 
    
    daily_aqi[-1], daily_spo2[-1], daily_cough[-1], daily_breath[-1] = payload.aqi, payload.spo2, payload.cough_severity, payload.breathlessness_severity
    exact_risk, exact_level, _ = calculate_lung_risk_score(payload)
    daily_risks[-1] = round(exact_risk, 1)
    
    avg_aqi = sum(daily_aqi) / 7
    avg_spo2 = sum(daily_spo2) / 7
    avg_cough = sum(daily_cough) / 7
    avg_breath = sum(daily_breath) / 7
    avg_risk = sum(daily_risks) / 7
    
    highest_symptom = "None"
    if avg_cough > avg_breath and avg_cough >= 2: highest_symptom = "Cough"
    elif avg_breath >= 2: highest_symptom = "Breathlessness"
    if avg_spo2 < 94: highest_symptom = "Low Oxygen (SpO2)"
        
    avg_risk_level = "Low"
    if avg_risk > 30: avg_risk_level = "Moderate"
    if avg_risk > 60: avg_risk_level = "High"

    first_half_risk = sum(daily_risks[:3]) / 3
    last_half_risk = sum(daily_risks[-3:]) / 3
    trend = "Stable"
    if last_half_risk > first_half_risk + 5: trend = "Increasing"
    elif last_half_risk < first_half_risk - 5: trend = "Decreasing"

    spo2_drops = [s for s in daily_spo2 if s < 95]
    
    insights, disease_risks, recommendation = await fetch_groq_ai_analysis(
        payload, avg_aqi, avg_spo2, avg_cough, avg_breath, highest_symptom, trend, spo2_drops
    )

    return {
        "avg_cough_severity": round(avg_cough, 1),
        "avg_breathlessness": round(avg_breath, 1),
        "highest_symptom": highest_symptom,
        "avg_spo2": round(avg_spo2, 1),
        "avg_aqi": round(avg_aqi, 0),
        "avg_risk_percentage": round(avg_risk, 1),
        "avg_risk_level": avg_risk_level,
        "trend": trend,
        "insights": insights,
        "disease_risks": disease_risks,
        "recommendation": recommendation,
        "daily_risks": daily_risks
    }
