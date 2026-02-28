import cv2
import numpy as np
from typing import Tuple

def extract_red_signal(video_path: str) -> Tuple[np.ndarray, float]:
    """
    Extracts the average frame-by-frame RED channel intensity from a video.
    Returns the 1D PPG signal and the sampling frequency (fps).
    """
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise ValueError(f"Could not open video: {video_path}")
        
    fps = cap.get(cv2.CAP_PROP_FPS)
    if fps <= 0 or np.isnan(fps):
        fps = 30.0 # fallback default fps
        
    red_signal = []
    
    while True:
        ret, frame = cap.read()
        if not ret:
            break
            
        # OpenCV reads in BGR format. Red is index 2.
        # Computing the mean of the red channel for the center area? 
        # Actually, let's just do full frame as specified in the scope.
        r_channel = frame[:, :, 2]
        avg_red = np.mean(r_channel)
        red_signal.append(avg_red)
        
    cap.release()
    
    signal = np.array(red_signal)
    
    # Trim first and last 2 seconds to avoid placement/removal artifacts
    trim_frames = int(fps * 2)
    if len(signal) > 2 * trim_frames + 30: # Ensure we have enough signal left
        signal = signal[trim_frames:-trim_frames]
        
    return signal, float(fps)
