import os
from video_processor import extract_red_signal
from signal_preprocess import normalize_signal, bandpass_filter
from peak_detection import find_systolic_peaks
from bpm_estimator import calculate_bpm

def evaluate_video(video_path: str) -> dict:
    """
    Evaluates a single video and returns the estimated BPM and confidence.
    """
    try:
        signal, fs = extract_red_signal(video_path)
        if len(signal) < 30:
            return {"error": "Signal too short"}
            
        normalized = normalize_signal(signal)
        filtered = bandpass_filter(normalized, fs)
        peaks = find_systolic_peaks(filtered, fs)
        result = calculate_bpm(peaks, fs)
        
        return result
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    # Example standalone usage for dataset inspection
    import sys
    if len(sys.argv) > 1:
        video_file = sys.argv[1]
        print(f"Evaluating {video_file}...")
        res = evaluate_video(video_file)
        print("Result:", res)
    else:
        print("Usage: python evaluation.py <path_to_video>")
