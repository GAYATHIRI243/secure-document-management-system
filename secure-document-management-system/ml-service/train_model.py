"""
Trains the two anomaly-detection models used by the real-time risk engine:

  1. Isolation Forest   - isolates outliers by randomly partitioning feature
                           space; anomalies need fewer splits to isolate.
  2. One-Class SVM      - learns a decision boundary around "normal" data in
                           a kernel feature space; anything outside it is
                           flagged as an anomaly.

Both are UNSUPERVISED: we only need examples of *normal* user behavior to
train them (that's the whole point of these two algorithms - they don't
need labeled attack data, which is realistic since real attacks are rare
and not always labeled).

Since this is a student/demo project with no historical production data,
we generate a synthetic dataset of "normal" office-hours document-system
behavior, plus a small labeled anomaly set used only to report accuracy
metrics (never used for training).

Run:  python train_model.py
Output: models/isolation_forest.pkl, models/one_class_svm.pkl, models/scaler.pkl
"""

import numpy as np
import joblib
from pathlib import Path
from sklearn.ensemble import IsolationForest
from sklearn.svm import OneClassSVM
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import classification_report

from features import FEATURE_NAMES

MODELS_DIR = Path(__file__).parent / "models"
MODELS_DIR.mkdir(exist_ok=True)

RANDOM_STATE = 42
rng = np.random.default_rng(RANDOM_STATE)


def generate_normal_behavior(n_samples: int) -> np.ndarray:
    """
    Synthesizes 'normal' user behavior snapshots.

    A typical legitimate user: rarely fails a login, downloads a handful of
    documents occasionally, doesn't burst through dozens of actions in
    seconds, and is almost never flagged for unauthorized access. Activity
    is concentrated in business hours (9am-6pm) with some spillover.
    """
    failed_logins_15m = rng.poisson(0.15, n_samples)
    downloads_10m = rng.poisson(0.8, n_samples)
    actions_30s = rng.poisson(1.2, n_samples)
    unauthorized_attempts = rng.poisson(0.03, n_samples)

    # Business-hours-weighted hour of day (9am-6pm most likely)
    hour_of_day = rng.normal(loc=13, scale=3.2, size=n_samples)
    hour_of_day = np.clip(hour_of_day, 0, 23)

    return np.column_stack([
        failed_logins_15m,
        downloads_10m,
        actions_30s,
        unauthorized_attempts,
        hour_of_day,
    ]).astype(float)


def generate_anomalous_behavior(n_samples: int) -> np.ndarray:
    """
    Synthesizes suspicious / attacker-like behavior snapshots, used ONLY to
    evaluate the trained models (not for fitting them).
    """
    half = n_samples // 2

    # Pattern A: brute-force style - many failed logins, odd hours
    brute_force = np.column_stack([
        rng.poisson(6, half),                       # many failed logins
        rng.poisson(0.5, half),
        rng.poisson(4, half),                        # rapid retry actions
        rng.poisson(0.2, half),
        rng.uniform(0, 23, half),                     # any hour, often off-hours
    ])

    # Pattern B: data exfiltration style - excessive downloads, unauthorized access
    exfiltration = np.column_stack([
        rng.poisson(0.5, n_samples - half),
        rng.poisson(9, n_samples - half),             # excessive downloads
        rng.poisson(7, n_samples - half),              # rapid actions
        rng.poisson(2.5, n_samples - half),             # unauthorized attempts
        rng.uniform(0, 23, n_samples - half),
    ])

    return np.vstack([brute_force, exfiltration]).astype(float)


def main():
    print("Generating synthetic training data (normal behavior only)...")
    X_train_normal = generate_normal_behavior(3000)

    print("Generating held-out evaluation set (normal + anomalous, labeled)...")
    X_eval_normal = generate_normal_behavior(400)
    X_eval_anomaly = generate_anomalous_behavior(200)
    X_eval = np.vstack([X_eval_normal, X_eval_anomaly])
    # sklearn convention: 1 = normal (inlier), -1 = anomaly (outlier)
    y_eval = np.array([1] * len(X_eval_normal) + [-1] * len(X_eval_anomaly))

    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train_normal)
    X_eval_scaled = scaler.transform(X_eval)

    print("\nTraining Isolation Forest...")
    iso_forest = IsolationForest(
        n_estimators=200,
        contamination=0.05,
        random_state=RANDOM_STATE,
    )
    iso_forest.fit(X_train_scaled)
    iso_preds = iso_forest.predict(X_eval_scaled)
    print(classification_report(y_eval, iso_preds, target_names=["anomaly", "normal"]))

    print("Training One-Class SVM...")
    ocsvm = OneClassSVM(kernel="rbf", nu=0.05, gamma="scale")
    ocsvm.fit(X_train_scaled)
    ocsvm_preds = ocsvm.predict(X_eval_scaled)
    print(classification_report(y_eval, ocsvm_preds, target_names=["anomaly", "normal"]))

    joblib.dump(iso_forest, MODELS_DIR / "isolation_forest.pkl")
    joblib.dump(ocsvm, MODELS_DIR / "one_class_svm.pkl")
    joblib.dump(scaler, MODELS_DIR / "scaler.pkl")
    joblib.dump(FEATURE_NAMES, MODELS_DIR / "feature_names.pkl")

    print(f"\nSaved models to {MODELS_DIR}/")
    print("  - isolation_forest.pkl")
    print("  - one_class_svm.pkl")
    print("  - scaler.pkl")
    print("  - feature_names.pkl")


if __name__ == "__main__":
    main()
