import os
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4

import joblib
import pandas as pd
from dotenv import load_dotenv
from pymongo import MongoClient
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
)
from sklearn.model_selection import train_test_split


FEATURE_COLUMNS = [
    "temperatureC",
    "activityIndex",
    "vibrationValue",
    "vibrationCount",
    "wifiRssi",
    "rawAccelX",
    "rawAccelY",
    "rawAccelZ",
    "rawGyroX",
    "rawGyroY",
    "rawGyroZ",
    "accelMagnitude",
    "gyroMagnitude",
]

LABEL_COLUMN = "derivedStatus"
MODEL_DIR = Path(__file__).parent / "models"


def get_database_name(uri: str) -> str:
    path = uri.split("?")[0].rstrip("/").split("/")[-1]
    if not path or "." in path:
        raise ValueError(
            "MONGODB_URI must include the database name, for example "
            "mongodb+srv://user:pass@host/smart-cattle?retryWrites=true"
        )
    return path


def fetch_readings():
    load_dotenv()
    mongo_uri = os.environ.get("MONGODB_URI")
    if not mongo_uri:
        raise RuntimeError("Missing MONGODB_URI in .env or environment.")

    client = MongoClient(mongo_uri)
    db = client[get_database_name(mongo_uri)]

    projection = {
        "_id": 0,
        "cowId": 1,
        "timestamp": 1,
        "temperatureC": 1,
        "activityIndex": 1,
        "vibrationValue": 1,
        "vibrationCount": 1,
        "wifiRssi": 1,
        "rawAccelX": 1,
        "rawAccelY": 1,
        "rawAccelZ": 1,
        "rawGyroX": 1,
        "rawGyroY": 1,
        "rawGyroZ": 1,
        "derivedStatus": 1,
    }

    readings = list(db.sensorreadings.find({}, projection).sort("timestamp", 1))
    return client, db, pd.DataFrame(readings)


def prepare_dataset(df: pd.DataFrame) -> pd.DataFrame:
    if df.empty:
        return df

    df = df.dropna(subset=FEATURE_COLUMNS[:-2] + [LABEL_COLUMN]).copy()
    df.loc[:, "accelMagnitude"] = (
        df["rawAccelX"] ** 2 + df["rawAccelY"] ** 2 + df["rawAccelZ"] ** 2
    ) ** 0.5
    df.loc[:, "gyroMagnitude"] = (
        df["rawGyroX"] ** 2 + df["rawGyroY"] ** 2 + df["rawGyroZ"] ** 2
    ) ** 0.5

    return df[df[LABEL_COLUMN].isin(["normal", "warning", "anomaly"])]


def build_failed_report(reason: str, total_rows: int):
    now = datetime.now(timezone.utc)
    return {
        "reportId": f"local-rf-{uuid4()}",
        "modelName": "Random Forest",
        "modelVersion": "local-rf-v1",
        "status": "failed",
        "trainingStartedAt": now,
        "trainingCompletedAt": now,
        "dataset": {
            "totalReadings": int(total_rows),
            "trainingRows": 0,
            "testRows": 0,
            "cowCount": 0,
            "dateFrom": None,
            "dateTo": None,
            "labelSource": "rule_based_derived_status",
        },
        "metrics": {
            "accuracy": 0,
            "macroF1": 0,
            "weightedF1": 0,
            "perClass": [],
            "confusionMatrix": {"labels": [], "matrix": []},
        },
        "featureImportances": [],
        "notes": [reason],
        "createdAt": now,
        "updatedAt": now,
    }


def train_and_save_report(db, df: pd.DataFrame):
    started_at = datetime.now(timezone.utc)
    prepared = prepare_dataset(df)

    if len(prepared) < 30:
        return build_failed_report(
            "Not enough valid labeled readings. Collect at least 30 readings first.",
            len(df),
        )

    if prepared[LABEL_COLUMN].nunique() < 2:
        return build_failed_report(
            "Need at least two status classes to train a classifier.",
            len(prepared),
        )

    x = prepared[FEATURE_COLUMNS]
    y = prepared[LABEL_COLUMN]

    stratify = y if y.value_counts().min() >= 2 else None
    x_train, x_test, y_train, y_test = train_test_split(
        x,
        y,
        test_size=0.25,
        random_state=42,
        stratify=stratify,
    )

    model = RandomForestClassifier(
        n_estimators=150,
        random_state=42,
        class_weight="balanced",
        max_depth=None,
    )
    model.fit(x_train, y_train)

    predictions = model.predict(x_test)
    labels = sorted(y.unique().tolist())
    class_report = classification_report(
        y_test,
        predictions,
        labels=labels,
        output_dict=True,
        zero_division=0,
    )
    matrix = confusion_matrix(y_test, predictions, labels=labels)

    MODEL_DIR.mkdir(exist_ok=True)
    model_path = MODEL_DIR / "random_forest_latest.joblib"
    joblib.dump({"model": model, "features": FEATURE_COLUMNS}, model_path)

    completed_at = datetime.now(timezone.utc)
    importances = sorted(
        [
            {"feature": feature, "importance": float(importance)}
            for feature, importance in zip(FEATURE_COLUMNS, model.feature_importances_)
        ],
        key=lambda item: item["importance"],
        reverse=True,
    )

    per_class = []
    for label in labels:
        metrics = class_report.get(label, {})
        per_class.append(
            {
                "label": label,
                "precision": float(metrics.get("precision", 0)),
                "recall": float(metrics.get("recall", 0)),
                "f1Score": float(metrics.get("f1-score", 0)),
                "support": int(metrics.get("support", 0)),
            }
        )

    report = {
        "reportId": f"local-rf-{uuid4()}",
        "modelName": "Random Forest",
        "modelVersion": "local-rf-v1",
        "status": "completed",
        "trainingStartedAt": started_at,
        "trainingCompletedAt": completed_at,
        "dataset": {
            "totalReadings": int(len(prepared)),
            "trainingRows": int(len(x_train)),
            "testRows": int(len(x_test)),
            "cowCount": int(prepared["cowId"].nunique()),
            "dateFrom": prepared["timestamp"].min(),
            "dateTo": prepared["timestamp"].max(),
            "labelSource": "rule_based_derived_status",
        },
        "metrics": {
            "accuracy": float(accuracy_score(y_test, predictions)),
            "macroF1": float(f1_score(y_test, predictions, average="macro")),
            "weightedF1": float(f1_score(y_test, predictions, average="weighted")),
            "perClass": per_class,
            "confusionMatrix": {
                "labels": labels,
                "matrix": matrix.astype(int).tolist(),
            },
        },
        "featureImportances": importances,
        "notes": [
            "Local Random Forest report generated from MongoDB sensor readings.",
            "Labels are based on current rule-derived status, not veterinarian diagnosis.",
            f"Saved latest model artifact to {model_path}.",
        ],
        "createdAt": completed_at,
        "updatedAt": completed_at,
    }

    db.mlreports.insert_one(report)
    return report


def main():
    client, db, df = fetch_readings()
    try:
        report = train_and_save_report(db, df)
        if report["status"] == "failed":
            db.mlreports.insert_one(report)
        print("ML report generated.")
        print(f"Status: {report['status']}")
        print(f"Report ID: {report['reportId']}")
        print(f"Total readings: {report['dataset']['totalReadings']}")
        if report["status"] == "failed":
            print("Accuracy: N/A (training did not run)")
            print("Reason:")
            for note in report["notes"]:
                print(f"- {note}")
        else:
            print(f"Accuracy: {report['metrics']['accuracy']:.3f}")
    finally:
        client.close()


if __name__ == "__main__":
    main()
