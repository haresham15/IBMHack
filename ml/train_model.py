"""
train_model.py
Trains Random Forest classifiers on the synthetic neurodivergent dataset.
Saves individual per-output models + a unified config dict to ml/models/.

Run: python3 ml/train_model.py
Requires: ml/data/synthetic_profiles.csv (run generate_data.py first)
"""

import os
import pickle
import json
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import classification_report, accuracy_score

# ── Config ────────────────────────────────────────────────────────────────────
DATA_PATH   = "ml/data/synthetic_profiles.csv"
MODELS_DIR  = "ml/models"

FEATURE_COLS = [
    "has_adhd", "has_asd", "has_dyslexia", "has_dyscalculia",
    "has_dyspraxia", "has_spd", "has_anxiety", "n_disorders",
    "light_sensitivity", "sound_sensitivity", "motion_sensitivity",
    # Encoded categoricals added after preprocessing
    "support_level_enc", "info_density_pref_enc", "time_horizon_enc",
]

# Categorical targets (multi-class classifiers)
CATEGORICAL_TARGETS = ["color_theme", "font_family", "font_size", "motion", "info_density"]

# Binary targets (binary classifiers)
BINARY_TARGETS = ["large_targets", "read_aloud", "progress_bars", "no_timers"]

ALL_TARGETS = CATEGORICAL_TARGETS + BINARY_TARGETS

RF_PARAMS = {
    "n_estimators":    200,
    "max_depth":       12,
    "min_samples_leaf": 3,
    "random_state":    42,
    "n_jobs":          -1,
}

# ── Helpers ───────────────────────────────────────────────────────────────────
def encode_ordinals(df):
    """Encode categorical feature columns into numeric."""
    support_map     = {"low": 0, "medium": 1, "high": 2}
    density_map     = {"minimal": 0, "moderate": 1, "full": 2}
    horizon_map     = {"24h": 0, "72h": 1, "1week": 2, "2weeks": 3}

    df["support_level_enc"]     = df["support_level"].map(support_map)
    df["info_density_pref_enc"] = df["info_density_pref"].map(density_map)
    df["time_horizon_enc"]      = df["time_horizon"].map(horizon_map)
    return df

def train_and_evaluate(X_train, X_test, y_train, y_test, target_name, le=None):
    """Train a Random Forest, evaluate, and return (model, label_encoder)."""
    clf = RandomForestClassifier(**RF_PARAMS)
    clf.fit(X_train, y_train)

    y_pred = clf.predict(X_test)
    acc = accuracy_score(y_test, y_pred)

    print(f"\n{'─'*50}")
    print(f"  Target: {target_name}")
    print(f"  Test accuracy:  {acc:.4f}")

    cv_scores = cross_val_score(clf, X_train, y_train, cv=5, scoring="accuracy")
    print(f"  CV accuracy:    {cv_scores.mean():.4f} ± {cv_scores.std():.4f}")

    if le:
        print(f"\n{classification_report(y_test, y_pred, target_names=le.classes_)}")
    else:
        unique = sorted(set(y_test))
        print(f"\n{classification_report(y_test, y_pred, target_names=[str(u) for u in unique])}")

    return clf

def feature_importance_report(models, feature_names):
    """Print top features across all models."""
    print(f"\n{'═'*50}")
    print("  TOP FEATURE IMPORTANCES (averaged across all targets)")
    print(f"{'═'*50}")

    all_importances = np.zeros(len(feature_names))
    for clf in models.values():
        if hasattr(clf, "feature_importances_"):
            all_importances += clf.feature_importances_
    all_importances /= len(models)

    ranked = sorted(zip(feature_names, all_importances), key=lambda x: x[1], reverse=True)
    for fname, imp in ranked:
        bar = "█" * int(imp * 100)
        print(f"  {fname:30s}  {imp:.4f}  {bar}")

# ── Main ──────────────────────────────────────────────────────────────────────
def main():
    os.makedirs(MODELS_DIR, exist_ok=True)

    print("📂 Loading data...")
    df = pd.read_csv(DATA_PATH)
    print(f"   {len(df)} rows × {len(df.columns)} columns")

    df = encode_ordinals(df)
    X = df[FEATURE_COLS].values

    models   = {}
    encoders = {}

    # ── Categorical targets ───────────────────────────────────────────────────
    print(f"\n{'═'*50}")
    print("  CATEGORICAL TARGET CLASSIFIERS")
    print(f"{'═'*50}")

    for target in CATEGORICAL_TARGETS:
        le = LabelEncoder()
        y  = le.fit_transform(df[target])
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

        clf = train_and_evaluate(X_train, X_test, y_train, y_test, target, le)
        models[target]   = clf
        encoders[target] = le

    # ── Binary targets ────────────────────────────────────────────────────────
    print(f"\n{'═'*50}")
    print("  BINARY TARGET CLASSIFIERS")
    print(f"{'═'*50}")

    for target in BINARY_TARGETS:
        y = df[target].values
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

        clf = train_and_evaluate(X_train, X_test, y_train, y_test, target)
        models[target] = clf

    # ── Feature importance ────────────────────────────────────────────────────
    feature_importance_report(models, FEATURE_COLS)

    # ── Save everything ───────────────────────────────────────────────────────
    print(f"\n💾 Saving models to {MODELS_DIR}/...")

    bundle = {
        "models":         models,
        "encoders":       encoders,
        "feature_cols":   FEATURE_COLS,
        "categorical_targets": CATEGORICAL_TARGETS,
        "binary_targets": BINARY_TARGETS,
    }
    with open(f"{MODELS_DIR}/ui_model_bundle.pkl", "wb") as f:
        pickle.dump(bundle, f)

    # Save metadata JSON (feature names, classes) for JS API route reference
    metadata = {
        "feature_cols":        FEATURE_COLS,
        "categorical_targets": CATEGORICAL_TARGETS,
        "binary_targets":      BINARY_TARGETS,
        "label_classes": {
            t: list(encoders[t].classes_) for t in CATEGORICAL_TARGETS
        }
    }
    with open(f"{MODELS_DIR}/model_metadata.json", "w") as f:
        json.dump(metadata, f, indent=2)

    print(f"✅ Saved  ui_model_bundle.pkl  +  model_metadata.json")

    # ── Quick sanity test ─────────────────────────────────────────────────────
    print(f"\n{'═'*50}")
    print("  SANITY CHECK — predict for dyslexic student")
    print(f"{'═'*50}")

    # Simulate: dyslexia + high support, light sensitive
    sample = {
        "has_adhd": 0, "has_asd": 0, "has_dyslexia": 1, "has_dyscalculia": 0,
        "has_dyspraxia": 0, "has_spd": 0, "has_anxiety": 0, "n_disorders": 1,
        "light_sensitivity": 1, "sound_sensitivity": 0, "motion_sensitivity": 0,
        "support_level_enc": 2, "info_density_pref_enc": 0, "time_horizon_enc": 2,
    }
    x = np.array([[sample[f] for f in FEATURE_COLS]])

    result = {}
    for target in CATEGORICAL_TARGETS:
        pred_enc = models[target].predict(x)[0]
        result[target] = encoders[target].inverse_transform([pred_enc])[0]
    for target in BINARY_TARGETS:
        result[target] = bool(models[target].predict(x)[0])

    print(f"\n  Input: dyslexia=1, light_sensitive=1, support=high")
    print(f"  Predicted UI config:")
    for k, v in result.items():
        print(f"    {k:20s}: {v}")

    print(f"\n🎉 Training complete!")

if __name__ == "__main__":
    main()
