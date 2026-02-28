import os
import pandas as pd
import numpy as np
import sys

# Add current directory to path so it can find evaluation.py and its dependencies
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from evaluation import evaluate_video

def main():
    dataset_dir = r"c:\Users\prana\Desktop\breathometer\backend\ml\finger_ppg\dataset1\DatasetVideoFiles"
    excel_path = r"c:\Users\prana\Desktop\breathometer\backend\ml\finger_ppg\ProjectDatasetReadings.xlsx"
    
    if not os.path.exists(dataset_dir):
        print(f"Dataset dir not found: {dataset_dir}")
        return
        
    if not os.path.exists(excel_path):
        print(f"Excel file not found: {excel_path}")
        return
        
    try:
        df = pd.read_excel(excel_path)
    except Exception as e:
        print("Failed to read Excel:", e)
        return
        
    results = []
    
    for index, row in df.iterrows():
        file_id = row['FileName']
        ground_truth = row['Heart Rate (bpm)']
        
        video_path = os.path.join(dataset_dir, f"{file_id}.mp4")
        
        if not os.path.exists(video_path):
            print(f"Video {file_id}.mp4 not found, skipping...")
            continue
            
        print(f"Evaluating {file_id}.mp4 (GT: {ground_truth})...")
        res = evaluate_video(video_path)
        
        if "error" in res:
            print(f"  Error: {res['error']}")
            continue
            
        est_bpm = res['bpm']
        error = est_bpm - ground_truth
        
        results.append({
            "id": file_id,
            "gt": ground_truth,
            "est": est_bpm,
            "error": error,
            "abs_error": abs(error),
            "confidence": res['confidence']
        })
        print(f"  Est: {est_bpm}, Error: {error:.1f}, Confidence: {res['confidence']}")

    if results:
        res_df = pd.DataFrame(results)
        mae = res_df['abs_error'].mean()
        me = res_df['error'].mean()
        rmse = np.sqrt((res_df['error']**2).mean())
        
        print("\n" + "="*30)
        print("EVALUATION SUMMARY")
        print("="*30)
        print(f"Total evaluated: {len(results)}")
        print(f"Mean Absolute Error (MAE): {mae:.2f} BPM")
        print(f"Mean Error (ME): {me:.2f} BPM")
        print(f"RMSE: {rmse:.2f} BPM")
        print("="*30)
    else:
        print("No successful evaluations performed.")

if __name__ == "__main__":
    main()
