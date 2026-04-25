# Local ML Reporting

This folder runs Random Forest training locally on your laptop. It does not host ML in the cloud.

Workflow:

```txt
MongoDB daily health reports -> local Python training -> ML report saved to MongoDB -> website displays report
```

## Setup

From the project root:

```bash
cd ml-local
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Create `ml-local/.env`:

```bash
MONGODB_URI=mongodb+srv://USER:PASSWORD@HOST/smart-cattle?retryWrites=true&w=majority
```

Use the same MongoDB URI as your Next.js app. The URI must include the database name.

## Generate daily health reports first

The ML trainer is **daily-cow based**, not single-packet based.

In your app (or Postman) generate reports for the dates you want to train on:

```txt
POST /api/daily-reports
```

Body:

```json
{ "date": "2026-04-25" }
```

This writes rows into the MongoDB collection `dailyhealthreports`.

## Run Report

```bash
python train_report.py
```

The script will:

- read `dailyhealthreports` from MongoDB
- use `dailyStatus` as the label (`good`, `watch`, `bad`)
- train a local Random Forest model on **daily aggregate features**
- calculate accuracy, F1 score, per-class metrics, confusion matrix, and feature importance
- save the report into `mlreports`
- save the latest local model artifact at `ml-local/models/random_forest_daily_latest.joblib`

## View In Website

Open:

```txt
/ml-reports
```

The website reads the saved report from MongoDB and displays it in the dashboard.

## Important Thesis Note

The labels are **rule-derived daily health labels**, not a veterinarian diagnosis. You should state clearly in your report that the label source is a daily early-warning model unless manually validated.
