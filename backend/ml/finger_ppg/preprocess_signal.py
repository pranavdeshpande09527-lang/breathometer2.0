import cv2
import numpy as np
from scipy.signal import butter, filtfilt

def extract_red_signal(video_path: str) -> np.ndarray:
    """
    Extracts the average frame-by-frame RED channel intensity from a video.
    """
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise ValueError(f"Could not open video: {video_path}")
        
    red_signal = []
    
    while True:
        ret, frame = cap.read()
        if not ret:
            break
            
        # OpenCV reads in BGR format
        r_channel = frame[:, :, 2]
        avg_red = np.mean(r_channel)
        red_signal.append(avg_red)
        
    cap.release()
    return np.array(red_signal)


def bandpass_filter(signal: np.ndarray, fs: float, lowcut: float = 0.7, highcut: float = 4.0, order: int = 4) -> np.ndarray:
    """
    Applies a Butterworth bandpass filter to the signal.
    fs: sampling frequency (FPS of the video)
    lowcut: 0.7 Hz ~ 42 BPM
    highcut: 4.0 Hz ~ 240 BPM
    """
    nyq = 0.5 * fs
    low = lowcut / nyq
    high = highcut / nyq
    
    # ensure valid boundaries for the filter
    low = max(0.01, min(low, 0.99))
    high = max(low + 0.01, min(high, 0.99))
    
    b, a = butter(order, [low, high], btype='band')
    
    # Filter only if the signal is long enough
    padlen = min(len(signal) - 1, int(fs) * 2) 
    if len(signal) > 9: # scipy requirement for filtfilt
        try:
            filtered_signal = filtfilt(b, a, signal, padlen=padlen)
            return filtered_signal
        except ValueError:
            pass # fall back to original signal if error
            
    return signal

def normalize_signal(signal: np.ndarray) -> np.ndarray:
    """Zero-mean unit-variance normalization"""
    if len(signal) == 0:
        return signal
    std = np.std(signal)
    if std == 0:
        return signal - np.mean(signal)
    return (signal - np.mean(signal)) / std
