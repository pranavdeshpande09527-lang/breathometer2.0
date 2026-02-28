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
    if fps == 0 or np.isnan(fps):
        fps = 30.0 # fallback default fps
        
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
    return np.array(red_signal), float(fps)
