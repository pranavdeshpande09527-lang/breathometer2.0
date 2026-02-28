import os
import pandas as pd
import numpy as np
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
        print("Excel columns:", df.columns.tolist())
    except Exception as e:
        print("Failed to read Excel:", e)
        return
        
    # Standardize column names if needed, let's just inspect first few rows to know the structure
    print(df.head())
    
if __name__ == "__main__":
    main()
