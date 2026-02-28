import numpy as np

def calculate_bpm(peaks: np.ndarray, fs: float) -> dict:
    """
    Calculates BPM and confidence score from peak indices.
    """
    if len(peaks) < 2:
        return {"bpm": 0, "confidence": 0.0}
        
    # Calculate intervals between peaks in seconds
    intervals_frames = np.diff(peaks)
    intervals_sec = intervals_frames / fs
    
    mean_interval = np.mean(intervals_sec)
    
    if mean_interval == 0:
        return {"bpm": 0, "confidence": 0.0}
        
    bpm = 60.0 / mean_interval
    
    # Basic confidence metric based on variance of intervals
    # A regular heartbeat should have low variance.
    cv = np.std(intervals_sec) / mean_interval # Coefficient of Variation
    
    # Arbitrary mapping: lower CV -> higher confidence.
    # CV of 0 -> 1.0 confidence.
    # CV of 0.3 -> ~0.0 confidence.
    confidence = max(0.0, 1.0 - (cv / 0.3))
    
    return {
        "bpm": round(float(bpm), 1),
        "confidence": round(float(confidence), 2)
    }
