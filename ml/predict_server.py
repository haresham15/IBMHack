"""
ml/predict_server.py
Flask microserver that loads the trained UI config model bundle and serves predictions.
Run: python3 ml/predict_server.py
Listens on: http://localhost:5001
"""

import pickle
import json
import numpy as np
from flask import Flask, request, jsonify

app = Flask(__name__)

# ── Load model bundle ─────────────────────────────────────────────────────────
with open("ml/models/ui_model_bundle.pkl", "rb") as f:
    BUNDLE = pickle.load(f)

MODELS             = BUNDLE["models"]
ENCODERS           = BUNDLE["encoders"]
FEATURE_COLS       = BUNDLE["feature_cols"]
CATEGORICAL_TARGETS = BUNDLE["categorical_targets"]
BINARY_TARGETS     = BUNDLE["binary_targets"]

SUPPORT_MAP  = {"low": 0, "reminder": 0, "medium": 1, "step-by-step": 1, "high": 2, "full-agent": 2}
DENSITY_MAP  = {"minimal": 0, "summary": 0, "moderate": 1, "full": 2}
HORIZON_MAP  = {"24h": 0, "72h": 1, "1week": 2, "2weeks": 3}

def cap_to_features(cap):
    """
    Map a CAP profile dict to the model's feature vector.
    CAP fields from Supabase:
      - support_level     : reminder | step-by-step | full-agent
      - information_density: summary | moderate | full
      - time_horizon      : 24h | 72h | 1week | 2weeks
      - sensory_flags     : list of loud | bright | crowds | open
      - disorders         : optional list of adhd | asd | dyslexia | dyscalculia | dyspraxia | spd | anxiety
    """
    sensory = cap.get("sensory_flags", []) or []
    disorders = cap.get("disorders", []) or []

    # Infer sensory signals from CAP flags
    light_sensitivity  = int("bright" in sensory or "light_sensitivity" in sensory)
    sound_sensitivity  = int("loud"   in sensory or "sound_sensitivity"  in sensory)
    motion_sensitivity = int("motion_sensitivity" in sensory)

    # Disorder flags
    has_adhd        = int("adhd"        in disorders)
    has_asd         = int("asd"         in disorders)
    has_dyslexia    = int("dyslexia"    in disorders)
    has_dyscalculia = int("dyscalculia" in disorders)
    has_dyspraxia   = int("dyspraxia"   in disorders)
    has_spd         = int("spd"         in disorders)
    has_anxiety     = int("anxiety"     in disorders)
    n_disorders     = sum([has_adhd, has_asd, has_dyslexia, has_dyscalculia,
                           has_dyspraxia, has_spd, has_anxiety])

    support_enc = SUPPORT_MAP.get(str(cap.get("support_level", "medium")), 1)
    density_enc = DENSITY_MAP.get(str(cap.get("information_density", "moderate")), 1)
    horizon_enc = HORIZON_MAP.get(str(cap.get("time_horizon", "1week")), 2)

    return np.array([[
        has_adhd, has_asd, has_dyslexia, has_dyscalculia,
        has_dyspraxia, has_spd, has_anxiety, n_disorders,
        light_sensitivity, sound_sensitivity, motion_sensitivity,
        support_enc, density_enc, horizon_enc,
    ]], dtype=float)

@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.get_json(force=True)
        cap  = data.get("cap_profile", {})
        x    = cap_to_features(cap)

        result = {}
        for target in CATEGORICAL_TARGETS:
            enc      = ENCODERS[target]
            pred_idx = MODELS[target].predict(x)[0]
            result[target] = enc.inverse_transform([pred_idx])[0]

        for target in BINARY_TARGETS:
            result[target] = bool(MODELS[target].predict(x)[0])

        return jsonify({"ui_config": result})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "model": "neurodivergent_ui_v1"})

if __name__ == "__main__":
    print("🧠 Vantage UI Config Model Server — http://localhost:5001")
    app.run(host="0.0.0.0", port=5001, debug=False)
