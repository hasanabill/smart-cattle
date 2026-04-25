# Local ML Reporting

This folder runs Random Forest training locally on your laptop. It does not host ML in the cloud.

Workflow:

```txt
MongoDB sensor readings -> local Python training -> ML report saved to MongoDB -> website displays report
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

## Run Report

```bash
python train_report.py
```

The script will:

- read `sensorreadings` from MongoDB
- use `derivedStatus` as the temporary label
- train a local Random Forest model
- calculate accuracy, F1 score, per-class metrics, confusion matrix, and feature importance
- save the report into `mlreports`
- save the latest local model artifact at `ml-local/models/random_forest_latest.joblib`

## View In Website

Open:

```txt
/ml-reports
```

The website reads the saved report from MongoDB and displays it in the dashboard.

## Important Thesis Note

The first version uses rule-derived labels (`normal`, `warning`, `anomaly`). This is acceptable for a prototype and demonstration, but final ML evaluation should clearly state that labels are generated from rule-based early-warning logic unless manually validated.
