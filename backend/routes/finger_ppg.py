from fastapi import APIRouter, File, UploadFile
from fastapi.responses import JSONResponse
import tempfile
import os

from ml.finger_ppg.video_processor import extract_red_signal
from ml.finger_ppg.signal_preprocess import normalize_signal, bandpass_filter
from ml.finger_ppg.peak_detection import find_systolic_peaks
from ml.finger_ppg.bpm_estimator import calculate_bpm

router = APIRouter(prefix="/analyze-finger-ppg", tags=["Finger PPG"])

@router.post("")
async def analyze_finger_ppg(video: UploadFile = File(...)):
    if not video.filename.endswith((".mp4", ".mov", ".avi")):
         return JSONResponse(status_code=400, content={"error": "Unsupported file type", "method": "finger_ppg"})

    # Save the uploaded file temporarily
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".mp4")
    temp_path = temp_file.name
    try:
        content = await video.read()
        temp_file.write(content)
        temp_file.close()
        
        # Process the video
        signal, fs = extract_red_signal(temp_path)
        
        # Minimum signal length mapping to roughly 3-4 seconds depending on fps
        if len(signal) < 30: 
            return JSONResponse(status_code=400, content={"error": "Low signal quality", "method": "finger_ppg"})
            
        # Preprocess
        normalized_signal = normalize_signal(signal)
        filtered_signal = bandpass_filter(normalized_signal, fs)
        
        # Peak Detection
        peaks = find_systolic_peaks(filtered_signal, fs)
        
        # BPM Calculation
        result = calculate_bpm(peaks, fs)
        
        # Validation checks on BPM and confidence
        if result["bpm"] < 40 or result["bpm"] > 240 or result["confidence"] < 0.2:
            return JSONResponse(status_code=400, content={"error": "Low signal quality", "method": "finger_ppg"})
            
        return {
            "bpm": result["bpm"],
            "method": "finger_ppg",
            "confidence": result["confidence"]
        }
        
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": "Server processing error", "details": str(e), "method": "finger_ppg"})
    finally:
        if os.path.exists(temp_path):
            os.unlink(temp_path)
