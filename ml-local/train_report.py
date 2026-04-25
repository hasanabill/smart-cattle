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


# Daily aggregate features (flattened) produced by Next.js + stored in MongoDB.
FEATURE_COLUMNS = [
    "totalReadings",
    "expectedReadings",
    "dataCompletenessPct",
    "temperatureAvgC",
    "temperatureMinC",
    "temperatureMaxC",
    "temperatureStdC",
    "temperatureElevatedMinutes",
    "temperatureHighMinutes",
    "activityAvgIndex",
    "activityMinIndex",
    "activityMaxIndex",
    "activityStdIndex",
    "activityLowActivityMinutes",
    "activityActiveMinutes",
    "vibrationAvgValue",
    "vibrationAvgCount",
    "vibrationLowSignalMinutes",
    "vibrationRuminationSignalScore",
    "wifiAvgRssi",
    "wifiWeakSignalMinutes",
    "wifiQualityScore",
    "healthScore",
    "dateOrdinal",
]

LABEL_COLUMN = "dailyStatus"
MODEL_DIR = Path(__file__).parent / "models"


def get_database_name(uri: str) -> str:
    path = uri.split("?")[0].rstrip("/").split("/")[-1]
    if not path or "." in path:
        raise ValueError(
            "MONGODB_URI must include the database name, for example "
            "mongodb+srv://user:pass@host/smart-cattle?retryWrites=true"
        )
    return path


def load_daily_readings_dataframe(db) -> pd.DataFrame:

    projection = {
        "_id": 0,
        "cowId": 1,
        "dateKey": 1,
        "date": 1,
        "totalReadings": 1,
        "expectedReadings": 1,
        "dataCompletenessPct": 1,
        "temperature": 1,
        "activity": 1,
        "vibration": 1,
        "wifi": 1,
        "healthScore": 1,
        "dailyStatus": 1,
    }

    # Mongoose default collection is lowercased plural: dailyhealthreports
    daily_reports = list(db.dailyhealthreports.find({}, projection).sort("date", 1))
    return pd.DataFrame(daily_reports)


def flatten_daily_report(row: dict) -> dict:
    date_value = row.get("date")
    if isinstance(date_value, str):
        date_parsed = datetime.fromisoformat(date_value.replace("Z", "+00:00"))
    elif isinstance(date_value, datetime):
        date_parsed = date_value
    else:
        date_parsed = datetime.now(timezone.utc)

    temp = row.get("temperature", {}) or {}
    act = row.get("activity", {}) or {}
    vib = row.get("vibration", {}) or {}
    wifi = row.get("wifi", {}) or {}

    return {
        "totalReadings": float(row.get("totalReadings", 0)),
        "expectedReadings": float(row.get("expectedReadings", 0)),
        "dataCompletenessPct": float(row.get("dataCompletenessPct", 0)),
        "temperatureAvgC": float(temp.get("avgC", 0)),
        "temperatureMinC": float(temp.get("minC", 0)),
        "temperatureMaxC": float(temp.get("maxC", 0)),
        "temperatureStdC": float(temp.get("stdC", 0)),
        "temperatureElevatedMinutes": float(temp.get("elevatedMinutes", 0)),
        "temperatureHighMinutes": float(temp.get("highMinutes", 0)),
        "activityAvgIndex": float(act.get("avgIndex", 0)),
        "activityMinIndex": float(act.get("minIndex", 0)),
        "activityMaxIndex": float(act.get("maxIndex", 0)),
        "activityStdIndex": float(act.get("stdIndex", 0)),
        "activityLowActivityMinutes": float(act.get("lowActivityMinutes", 0)),
        "activityActiveMinutes": float(act.get("activeMinutes", 0)),
        "vibrationAvgValue": float(vib.get("avgValue", 0)),
        "vibrationAvgCount": float(vib.get("avgCount", 0)),
        "vibrationLowSignalMinutes": float(vib.get("lowSignalMinutes", 0)),
        "vibrationRuminationSignalScore": float(
            vib.get("ruminationSignalScore", 0)
        ),
        "wifiAvgRssi": float(wifi.get("avgRssi", 0)),
        "wifiWeakSignalMinutes": float(wifi.get("weakSignalMinutes", 0)),
        "wifiQualityScore": float(wifi.get("qualityScore", 0)),
        "healthScore": float(row.get("healthScore", 0)),
        "dateOrdinal": float(date_parsed.toordinal()),
    }


def prepare_dataset(df: pd.DataFrame) -> pd.DataFrame:
    if df.empty:
        return df

    flattened = []
    for record in df.to_dict(orient="records"):
        flat = flatten_daily_report(record)
        flat["cowId"] = record.get("cowId")
        flat["dateKey"] = record.get("dateKey")
        flat["dailyStatus"] = record.get("dailyStatus")
        flattened.append(flat)

    prepared = pd.DataFrame(flattened)
    prepared = prepared.dropna(subset=FEATURE_COLUMNS + [LABEL_COLUMN])
    return prepared[prepared[LABEL_COLUMN].isin(["good", "watch", "bad"])]


def build_failed_report(reason: str, total_rows: int):
    now = datetime.now(timezone.utc)
    return {
        "reportId": f"local-rf-daily-{uuid4()}",
        "modelName": "Random Forest",
        "modelVersion": "local-rf-daily-v1",
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
            "labelSource": "daily_rule_dailyStatus",
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

    if len(prepared) < 10:
        return build_failed_report(
            "Not enough valid daily health reports. Generate daily reports for more dates first "
            "(`POST /api/daily-reports`) and aim for at least 10 day-level rows.",
            len(df),
        )

    if prepared[LABEL_COLUMN].nunique() < 2:
        return build_failed_report(
            "Need at least two daily status classes to train a classifier.",
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
        n_estimators=200,
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
    model_path = MODEL_DIR / "random_forest_daily_latest.joblib"
    joblib.dump({"model": model, "features": FEATURE_COLUMNS, "label": "dailyStatus"}, model_path)

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
        "reportId": f"local-rf-daily-{uuid4()}",
        "modelName": "Random Forest",
        "modelVersion": "local-rf-daily-v1",
        "status": "completed",
        "trainingStartedAt": started_at,
        "trainingCompletedAt": completed_at,
        "dataset": {
            "totalReadings": int(len(prepared)),
            "trainingRows": int(len(x_train)),
            "testRows": int(len(x_test)),
            "cowCount": int(prepared["cowId"].nunique()),
            "dateFrom": prepared["dateKey"].min(),
            "dateTo": prepared["dateKey"].max(),
            "labelSource": "daily_rule_dailyStatus",
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
            "Local Random Forest report generated from MongoDB `dailyhealthreports` (daily aggregate features).",
            "Label is `dailyStatus` (good, watch, bad) from daily rule-based analysis, not a veterinarian diagnosis.",
            f"Saved latest daily model artifact to {model_path}.",
        ],
        "createdAt": completed_at,
        "updatedAt": completed_at,
    }

    db.mlreports.insert_one(report)
    return report


def main():
    load_dotenv()
    mongo_uri = os.environ.get("MONGODB_URI")
    if not mongo_uri:
        raise RuntimeError("Missing MONGODB_URI in .env or environment.")

    client = MongoClient(mongo_uri)
    try:
        db = client[get_database_name(mongo_uri)]
        df = load_daily_readings_dataframe(db)
        report = train_and_save_report(db, df)
        if report["status"] == "failed":
            db.mlreports.insert_one(report)
        print("ML report generated.")
        print(f"Status: {report['status']}")
        print(f"Report ID: {report['reportId']}")
        print(f"Total daily reports: {report['dataset']['totalReadings']}")
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
