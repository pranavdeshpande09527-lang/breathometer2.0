import asyncio
import sys
import os

# Ensure the backend directory is in the path so imports work
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from services.aqi_service import fetch_aqi

async def main():
    try:
        print("Fetching AQI for Delhi...")
        result = await fetch_aqi("Delhi")
        print("\nSUCCESS!")
        print(result)
    except Exception as e:
        print("\nERROR:")
        print(repr(e))

if __name__ == "__main__":
    asyncio.run(main())
