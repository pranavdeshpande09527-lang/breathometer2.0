import numpy as np
from scipy.signal import find_peaks

def find_systolic_peaks(signal: np.ndarray, fs: float) -> np.ndarray:
    """
    Detects systolic peaks in the filtered PPG signal.
    fs: sampling frequency (FPS)
    Returns indices of the peaks.
    """
    # Minimum distance between peaks: assuming max HR is 240 BPM (4 Hz)
    # The minimum distance between beats in seconds is 60/240 = 0.25 s
    min_distance_frames = int(fs * 0.25)
    
    # Find peaks. 
    # Height threshold can be adjusted or kept None/0 if signal is normalized.
    # With zero-mean normalized signal, we expect peaks to be > 0.
    peaks, _ = find_peaks(signal, distance=max(1, min_distance_frames), height=0)
    
    return peaks
