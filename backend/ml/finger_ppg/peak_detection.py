import numpy as np
from scipy.signal import find_peaks

def find_systolic_peaks(signal: np.ndarray, fs: float) -> np.ndarray:
    """
    Detects systolic peaks in the filtered PPG signal.
    fs: sampling frequency (FPS)
    Returns indices of the peaks.
    """
    # Assuming max resting HR is 150 BPM (2.5 Hz)
    # The minimum distance between beats in seconds is 60/150 = 0.4 s
    min_distance_frames = int(fs * 0.4)
    
    # Use prominence to handle noise. 
    # Lowered to 0.1 to maximize sensitivity for weak PPG pulses.
    peaks, _ = find_peaks(signal, distance=max(1, min_distance_frames), prominence=0.1)
    
    return peaks
