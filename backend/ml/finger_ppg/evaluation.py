import os
import sys

# Local imports for modules in the same directory
try:
    from video_processor import extract_red_signal
    from signal_preprocess import normalize_signal, bandpass_filter, detrend_signal
    from peak_detection import find_systolic_peaks
    from bpm_estimator import calculate_bpm
except ImportError:
    # Fallback for when imported from elsewhere
    from ml.finger_ppg.video_processor import extract_red_signal
    from ml.finger_ppg.signal_preprocess import normalize_signal, bandpass_filter, detrend_signal
    from ml.finger_ppg.peak_detection import find_systolic_peaks
    from ml.finger_ppg.bpm_estimator import calculate_bpm

def evaluate_video(video_path: str) -> dict:
    """
    Evaluates a single video and returns the estimated BPM and confidence.
    """
    try:
        raw_signal, fs = extract_red_signal(video_path)
        if len(raw_signal) < 30:
            return {"error": "Signal too short"}
            
        # Detrend first to remove baseline drift
        detrended = detrend_signal(raw_signal, fs)
        
        # Bandpass filter
        filtered = bandpass_filter(detrended, fs)
        
        # Normalize for peak detection
        normalized = normalize_signal(filtered)
        
        # Peak Detection
        peaks = find_systolic_peaks(normalized, fs)
        
        # BPM Calculation
        result = calculate_bpm(peaks, fs)
        
        return result
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    if len(sys.argv) > 1:
        video_file = sys.argv[1]
        print(f"Evaluating {video_file}...")
        res = evaluate_video(video_file)
        print("Result:", res)
    else:
        print("Usage: python evaluation.py <path_to_video>")
