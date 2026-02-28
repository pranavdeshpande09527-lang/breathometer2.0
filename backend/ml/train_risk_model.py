"""
Offline ML Training Pipeline for Environmental Lung Risk (Regression).
Strictly trains on environmental factors to predict HealthImpactScore.
"""

import os
import zipfile
import pandas as pd
import numpy as np
import joblib

from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor, VotingRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import json

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.getenv("RISK_DATASET_PATH", r"C:\Users\prana\OneDrive\Desktop\data for ml\health_effects")
MODEL_OUT_PATH = os.path.join(SCRIPT_DIR, "risk_model.pkl")
META_OUT_PATH = os.path.join(SCRIPT_DIR, "risk_model_meta.json")

FEATURES = [
    "AQI", "PM10", "PM2.5", "NO2", "SO2", "O3", 
    "Temperature", "Humidity", "WindSpeed"
]
TARGET_COL = "HealthImpactScore"


def load_dataset():
    """Loads CSV specifically from archive (1).zip: air_quality_health_impact_data.csv"""
    print(f"📂 [STEP 1] Loading dataset from {DATA_DIR}...")
    archive_path = os.path.join(DATA_DIR, "archive (1).zip")
    if not os.path.exists(archive_path):
        raise FileNotFoundError(f"Missing required zip: {archive_path}")

    # Read from zip
    df = None
    with zipfile.ZipFile(archive_path, 'r') as z:
        for name in z.namelist():
            if name.endswith('.csv') and "air_quality_health_impact_data" in name:
                with z.open(name) as zf:
                    df = pd.read_csv(zf)
                break
                
    if df is None:
        raise ValueError("Could not find air_quality_health_impact_data.csv inside archive (1).zip")

    # Rename PM2_5 to PM2.5
    if "PM2_5" in df.columns:
        df.rename(columns={"PM2_5": "PM2.5"}, inplace=True)
        
    print(f"   => Loaded raw shape: {df.shape}")
    
    # strictly keep only features + target
    available_cols = set(df.columns)
    missing = [f for f in FEATURES + [TARGET_COL] if f not in available_cols]
    if missing:
        raise ValueError(f"Missing required columns inside dataset: {missing}")

    return df


def validate_clean_data(df):
    """Clean missing, detect dupes."""
    print("🧹 [STEP 2] Data Validation & Prevention of Leakage...")
    
    # Remove leakage columns (as requested explicitly by user)
    leak_cols = ["RespiratoryCases", "CardiovascularCases", "HospitalAdmissions", "RecordID", "HealthImpactClass"]
    df = df.drop(columns=[c for c in leak_cols if c in df.columns])
    
    # 1. Null check
    df = df.dropna(subset=FEATURES + [TARGET_COL])
    
    # Remove rows where Target is completely invalid (<0 or >100 assuming 0-100 scale)
    # The prompt explicitly asks to ensure normalization if not 0-100.
    target_min, target_max = df[TARGET_COL].min(), df[TARGET_COL].max()
    print(f"   => Target 'HealthImpactScore' range: {target_min:.2f} to {target_max:.2f}")
    
    # Assuming the data is already 0-100 according to standard dataset, if not, we MinMax scale it.
    if target_max > 100 or target_min < 0:
        print("   => Normalizing target to 0-100 scale.")
        df[TARGET_COL] = (df[TARGET_COL] - target_min) / (target_max - target_min) * 100.0

    df = df.drop_duplicates()
    print(f"   => Cleaned shape: {df.shape}")
    return df, target_min, target_max


def execute_training():
    df = load_dataset()
    df, t_min, t_max = validate_clean_data(df)

    print("✂️  [STEP 4] Data Split & Preprocessing...")
    
    X = df[FEATURES]
    y = df[TARGET_COL].values
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Standard Scaler
    scaler = StandardScaler()

    print("🚀 [STEP 5 & 6] Model Training (Ensemble Regressors)...")
    
    # Try importing XGBoost
    try:
        from xgboost import XGBRegressor
        xgb_reg = XGBRegressor(max_depth=6, n_estimators=100, learning_rate=0.1, random_state=42)
        has_xgb = True
    except ImportError:
        print("   => XGBoost library not found. Proceeding with RF & GB only.")
        has_xgb = False

    rf_reg = RandomForestRegressor(n_estimators=150, max_depth=12, random_state=42)
    gb_reg = GradientBoostingRegressor(n_estimators=100, max_depth=6, random_state=42)
    
    estimators = [("rf", rf_reg), ("gb", gb_reg)]
    if has_xgb:
        estimators.append(("xgb", xgb_reg))

    voting_reg = VotingRegressor(estimators=estimators)

    pipeline = Pipeline(steps=[
        ("scaler", scaler),
        ("regressor", voting_reg)
    ])

    print("   => Fitting Pipeline with 5-Fold Cross Validation...")
    cv_scores = cross_val_score(pipeline, X_train, y_train, cv=5, scoring='neg_mean_absolute_error')
    print(f"   => 5-Fold CV MAE: {-np.mean(cv_scores):.3f} (+/- {np.std(cv_scores):.3f})")

    pipeline.fit(X_train, y_train)
    
    print("📊 [STEP 8] Evaluation...")
    y_pred = pipeline.predict(X_test)
    
    mae = mean_absolute_error(y_test, y_pred)
    mse = mean_squared_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)

    print(f"   => Test MAE: {mae:.3f}")
    print(f"   => Test RMSE: {np.sqrt(mse):.3f}")
    print(f"   => Test R²: {r2:.3f}")

    # Extract feature importance from RF for metadata
    temp_pipe = Pipeline(steps=[("scaler", scaler), ("rf", rf_reg)])
    temp_pipe.fit(X_train, y_train)
    importances = temp_pipe.named_steps["rf"].feature_importances_
    
    top_indices = np.argsort(importances)[::-1][:5]
    top_features = [FEATURES[i] for i in top_indices]
    
    meta = {
        "top_contributing_features": top_features,
        "target_original_min": float(t_min),
        "target_original_max": float(t_max),
        "metrics": {"mae": mae, "r2": r2}
    }
    print(f"🌟 Top Features: {top_features}")

    # Save to disk
    joblib.dump(pipeline, MODEL_OUT_PATH)
    with open(META_OUT_PATH, "w") as f:
        json.dump(meta, f)
        
    print(f"📦 [SUCCESS] Environmental Regression Model saved to {MODEL_OUT_PATH}!")

if __name__ == "__main__":
    try:
        execute_training()
    except Exception as e:
        print(f"\n❌ [FATAL ERROR] {str(e)}")
        import traceback
        traceback.print_exc()
