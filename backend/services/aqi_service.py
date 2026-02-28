"""
AQI Service — Strict Real-Time OpenWeatherMap Fetcher.
Fetches both air pollution and current weather data. No mock fallbacks allowed.
"""

import os
from datetime import datetime, timezone
import httpx
from fastapi import HTTPException

# Provided OpenWeather API Key
AQI_API_KEY = os.getenv("AQI_API_KEY", "92b720fddf2a5c86fd6eb01f8a23430d")

def _classify_aqi(aqi: int) -> str:
    if aqi <= 50:   return "Good"
    if aqi <= 100:  return "Moderate"
    if aqi <= 150:  return "Unhealthy for Sensitive Groups"
    if aqi <= 200:  return "Unhealthy"
    if aqi <= 300:  return "Very Unhealthy"
    return "Hazardous"

def _pm25_to_us_aqi(pm25: float) -> int:
    """Convert PM2.5 µg/m³ to US EPA AQI."""
    if pm25 <= 12.0:   return int((50 / 12.0) * pm25)
    if pm25 <= 35.4:   return int(50 + (50 / 23.4) * (pm25 - 12.0))
    if pm25 <= 55.4:   return int(100 + (50 / 20.0) * (pm25 - 35.4))
    if pm25 <= 150.4:  return int(150 + (50 / 95.0) * (pm25 - 55.4))
    if pm25 <= 250.4:  return int(200 + (100 / 100.0) * (pm25 - 150.4))
    if pm25 <= 500.4:  return int(300 + (200 / 250.0) * (pm25 - 250.4))
    return 500

def _dominant(components: dict) -> str:
    keys = {"pm2_5": "PM2.5", "pm10": "PM10", "o3": "O3", "no2": "NO2", "so2": "SO2", "co": "CO"}
    if not components:
        return "PM2.5"
    best = max(keys.keys(), key=lambda k: components.get(k, 0))
    return keys[best]

async def fetch_aqi(city: str) -> dict:
    """
    Strict fetch for AQI and Weather.
    Raises HTTPException if API Key is missing or external fetch fails.
    """
    if not AQI_API_KEY:
        raise HTTPException(status_code=500, detail="AQI_API_KEY is not configured.")

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            # 1. Geocode City
            geo_url = f"http://api.openweathermap.org/geo/1.0/direct?q={city}&limit=1&appid={AQI_API_KEY}"
            geo_resp = await client.get(geo_url)
            geo_resp.raise_for_status()
            geo_data = geo_resp.json()
            
            if not geo_data:
                raise HTTPException(status_code=404, detail=f"City '{city}' not found.")

            lat, lon = geo_data[0]["lat"], geo_data[0]["lon"]
            resolved_city = geo_data[0].get("name", city)

            # 2. Fetch Air Pollution and Weather concurrently
            poll_url = f"http://api.openweathermap.org/data/2.5/air_pollution?lat={lat}&lon={lon}&appid={AQI_API_KEY}"
            weather_url = f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&units=metric&appid={AQI_API_KEY}"
            
            # Await both independent requests
            # Even though asyncio.gather is standard, doing sequential awaits is safer for simple scripts
            poll_resp = await client.get(poll_url)
            poll_resp.raise_for_status()
            
            weather_resp = await client.get(weather_url)
            weather_resp.raise_for_status()

            poll_data = poll_resp.json()
            weather_data = weather_resp.json()

            # 3. Process Pollution Data
            item = poll_data["list"][0]
            components = item.get("components", {})
            pm25_val = components.get("pm2_5", 0)
            pm10_val = components.get("pm10", 0)
            us_aqi = _pm25_to_us_aqi(pm25_val)

            # 4. Construct Strict Response JSON
            return {
                "city": resolved_city,
                "aqi": us_aqi,
                "dominant_pollutant": _dominant(components),
                "category": _classify_aqi(us_aqi),
                "pm25": round(pm25_val, 1),
                "pm10": round(pm10_val, 1),
                "temperature": weather_data.get("main", {}).get("temp"),
                "humidity": weather_data.get("main", {}).get("humidity"),
                "pressure": weather_data.get("main", {}).get("pressure"),
                "visibility": weather_data.get("visibility"),
                "wind_speed": weather_data.get("wind", {}).get("speed"),
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "source": "OpenWeatherMap"
            }

    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=e.response.status_code, detail=f"External API error: {e}")
    except httpx.RequestError as e:
        raise HTTPException(status_code=503, detail=f"External API unreachable: {e}")
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Internal processing error: {str(e)}")
