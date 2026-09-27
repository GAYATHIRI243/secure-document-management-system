"""
Real-time anomaly detection microservice.

Loads the trained Isolation Forest and One-Class SVM models and exposes a
single /predict endpoint. The Node.js backend calls this on every user
activity, passing a small feature vector describing recent behavior, and
gets back a classification from each model plus a combined verdict.

Run:  uvicorn main:app --host 0.0.0.0 --port 8001 --reload
"""

from pathlib import Path
from contextlib import asynccontextmanager

import joblib
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from features import FEATURE_NAMES, to_feature_vector

MODELS_DIR = Path(__file__).parent / "models"

models = {}


@asynccontextmanager
async def lifespan(_app: FastAPI):
    required = ["isolation_forest.pkl", "one_class_svm.pkl", "scaler.pkl"]
    missing = [f for f in required if not (MODELS_DIR / f).exists()]
    if missing:
        print(
            f"[ml-service] WARNING: missing model files {missing}. "
            "Run `python train_model.py` first."
        )
    else:
        models["isolation_forest"] = joblib.load(MODELS_DIR / "isolation_forest.pkl")
        models["one_class_svm"] = joblib.load(MODELS_DIR / "one_class_svm.pkl")
        models["scaler"] = joblib.load(MODELS_DIR / "scaler.pkl")
        print("[ml-service] Models loaded successfully.")
    yield
    models.clear()


app = FastAPI(title="SDMS Anomaly Detection Service", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # internal service, called only by our own backend
    allow_methods=["*"],
    allow_headers=["*"],
)


class BehaviorSnapshot(BaseModel):
    failed_logins_15m: float = Field(0, ge=0)
    downloads_10m: float = Field(0, ge=0)
    actions_30s: float = Field(0, ge=0)
    unauthorized_attempts: float = Field(0, ge=0)
    hour_of_day: float = Field(12, ge=0, le=23)


class PredictionResult(BaseModel):
    isolation_forest: dict
    one_class_svm: dict
    combined_is_anomaly: bool
    feature_names: list


@app.get("/health")
def health():
    return {"status": "ok", "models_loaded": bool(models)}


@app.post("/predict", response_model=PredictionResult)
def predict(snapshot: BehaviorSnapshot):
    if not models:
        raise HTTPException(
            status_code=503,
            detail="Models are not loaded. Run train_model.py and restart the service.",
        )

    vector = [to_feature_vector(snapshot.model_dump())]
    scaled = models["scaler"].transform(vector)

    iso = models["isolation_forest"]
    svm = models["one_class_svm"]

    # sklearn convention: predict() returns 1 for inlier (normal), -1 for outlier (anomaly)
    iso_pred = int(iso.predict(scaled)[0])
    iso_score = float(iso.decision_function(scaled)[0])  # higher = more normal

    svm_pred = int(svm.predict(scaled)[0])
    svm_score = float(svm.decision_function(scaled)[0])  # higher = more normal

    iso_is_anomaly = iso_pred == -1
    svm_is_anomaly = svm_pred == -1

    return PredictionResult(
        isolation_forest={"is_anomaly": iso_is_anomaly, "score": round(iso_score, 4)},
        one_class_svm={"is_anomaly": svm_is_anomaly, "score": round(svm_score, 4)},
        # Flag as anomalous if EITHER model agrees - conservative (high recall) stance,
        # appropriate for a security monitoring use case where missing a real threat
        # is costlier than a false alarm an admin can dismiss.
        combined_is_anomaly=bool(iso_is_anomaly or svm_is_anomaly),
        feature_names=FEATURE_NAMES,
    )
