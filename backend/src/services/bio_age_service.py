import os
import pickle
import numpy as np
import pandas as pd
import shap
import xgboost as xgb

def load_model():
    base_dir = os.path.dirname(__file__)
    # Try multiple common paths for the model file
    paths_to_try = [
        os.path.join(base_dir, "../../../models/xgb_model.pkl"),
        os.path.join(base_dir, "../../models/xgb_model.pkl"),
        os.path.join(base_dir, "../models/xgb_model.pkl"),
        os.path.join(base_dir, "../../../xgb_model.pkl")
    ]
    
    for path in paths_to_try:
        if os.path.exists(path):
            with open(path, "rb") as f:
                return pickle.load(f)
    
    return None

model = load_model()

def predict_bio_age_and_explain(features_dict: dict, chronological_age: float):
    if not model:
        raise ValueError("XGBoost model file (xgb_model.pkl) not found in expected locations.")
        
    # Order must strictly match the 77 features
    feature_names = [
        "CRP","LBDEONO","LBDHDD","LBDLYMNO","LBDMONO","LBDNENO","LBXBAPCT","LBXEOPCT",
        "LBXGH","LBXHCT","LBXHGB","LBXLYPCT","LBXMC","LBXMCHSI","LBXMCVSI","LBXMOPCT",
        "LBXMPSI","LBXNEPCT","LBXPLTSI","LBXRBCSI","LBXRDW","LBXSAL","LBXSAPSI","LBXSASSI",
        "LBXSATSI","LBXSBU","LBXSC3SI","LBXSCA","LBXSCH","LBXSCLSI","LBXSCR","LBXSGB",
        "LBXSGL","LBXSGTSI","LBXSIR","LBXSKSI","LBXSLDSI","LBXSNASI","LBXSOSSI","LBXSPH",
        "LBXSTB","LBXSTP","LBXSUA","LBXTC","LBXWBCSI","URXCRS","URXUCR","URXUMA","URXUMS",
        "URDACT","LBXSCK","Gender","Weight","Height","Waist","Systolic_BP","Alcohol_days",
        "Exercise_days","LBXGLU","Smoking_status_Former","Smoking_status_Never","log_CRP",
        "log_LBXSAPSI","log_LBXWBCSI","log_LBXGH","log_LBXSCR","log_LBXGLU","chol_ratio",
        "non_hdl","scr_albumin_ratio","inflam_score","NLR_proxy","glycation_gap",
        "LBXRDW_sq","LBXMCVSI_sq","BMI","WHtR"
    ]
    
    # Create DataFrame with 1 row, ensuring exact column order and NaN for missing
    row = {k: features_dict.get(k) for k in feature_names}
    df = pd.DataFrame([row])
    
    # Convert Nones to np.nan so XGBoost handles them natively
    df.fillna(value=np.nan, inplace=True)
    
    # Predict
    predicted_bio_age = float(model.predict(df)[0])
    bio_age_gap = predicted_bio_age - chronological_age
    
    # SHAP Explanation
    contributing_factors = []
    
    if bio_age_gap > 0:
        explainer = shap.TreeExplainer(model)
        shap_values = explainer.shap_values(df)
        
        # shap_values[0] is the array of SHAP values for the first (and only) row
        feature_impacts = []
        for i, f_name in enumerate(feature_names):
            val = shap_values[0][i]
            if val > 0: # Only care about factors that increased the age
                
                # Check if the feature was actually provided (not NaN). We don't want to blame a missing feature!
                original_val = df.iloc[0][f_name]
                if not pd.isna(original_val):
                    feature_impacts.append({
                        "feature": f_name,
                        "impact": float(val),
                        "value": float(original_val)
                    })
                
        # Sort descending by impact
        feature_impacts.sort(key=lambda x: x["impact"], reverse=True)
        # Take top 5
        contributing_factors = feature_impacts[:5]
        
    return {
        "chronological_age": chronological_age,
        "predicted_bio_age": predicted_bio_age,
        "bio_age_gap": bio_age_gap,
        "top_contributing_factors": contributing_factors
    }
