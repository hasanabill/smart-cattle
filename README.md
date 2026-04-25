# Smart Cattle Health Monitoring and Anomaly Detection

Thesis-grade MVP for ingesting cattle collar sensor data, storing historical telemetry, generating end-of-day cow health reports, and visualizing health trends in a clean web dashboard.

## Tech Stack
- Next.js App Router (TypeScript)
- Tailwind CSS
- MongoDB + Mongoose
- Recharts
- Zod for payload validation

## System Architecture
`ESP8266 collar -> Next.js API -> MongoDB -> daily health analysis -> dashboard`

The system does not claim final health status from one sensor packet. Individual readings are raw observations. A daily report analyzes all readings for a cow on a date and classifies the day as `good`, `watch`, or `bad`.

Local ML reporting runs separately on your laptop:

`MongoDB daily health reports -> local Python Random Forest report -> MongoDB mlreports -> website ML Reports page`

## Folder Structure
```txt
smart-cattle/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── sensor-data/route.ts
│   │   │   ├── readings/recent/route.ts
│   │   │   ├── readings/[cowId]/route.ts
│   │   │   ├── cows/route.ts
│   │   │   ├── anomalies/route.ts
│   │   │   ├── daily-reports/route.ts
│   │   │   ├── ml-reports/route.ts
│   │   │   └── dashboard/summary/route.ts
│   │   ├── cows/page.tsx
│   │   ├── cows/[cowId]/page.tsx
│   │   ├── anomalies/page.tsx
│   │   ├── daily-reports/page.tsx
│   │   ├── ml-reports/page.tsx
│   │   ├── page.tsx
│   │   ├── layout.tsx
│   │   ├── loading.tsx
│   │   └── error.tsx
│   ├── components/
│   │   └── dashboard/
│   │       ├── main-nav.tsx
│   │       ├── overview-cards.tsx
│   │       ├── recent-readings-table.tsx
│   │       ├── health-charts.tsx
│   │       ├── status-badge.tsx
│   │       └── severity-badge.tsx
│   ├── lib/
│   │   ├── config/thresholds.ts
│   │   ├── db.ts
│   │   ├── models/
│   │   │   ├── Cow.ts
│   │   │   ├── SensorReading.ts
│   │   │   ├── AnomalyEvent.ts
│   │   │   ├── DailyHealthReport.ts
│   │   │   └── index.ts
│   │   ├── services/
│   │   │   ├── data.ts
│   │   │   └── prediction.ts
│   │   ├── seed/sample-data.ts
│   │   ├── utils/
│   │   │   ├── anomaly.ts
│   │   │   ├── daily-health.ts
│   │   │   └── http.ts
│   │   └── validation/sensor.ts
│   └── types/index.ts
├── scripts/seed.ts
├── ml-local/
│   ├── train_report.py
│   ├── requirements.txt
│   └── README.md
├── docs/esp8266-post-example.md
├── PROJECT_CONTEXT.md
└── .env.example
```

## Data Models

### `Cow`
- `cowId`, `name`, optional `age`, optional `breed`, `status`
- automatic `createdAt`, `updatedAt`

### `SensorReading`
- `cowId`, `timestamp`, `temperatureC`, `activityIndex`
- `vibrationValue`, `vibrationCount`, `wifiRssi`
- raw motion fields (`rawAccel*`, `rawGyro*`)
- `derivedStatus`, prediction metadata, `createdAt`
- note: per-reading status is only a lightweight signal; final cow health is based on daily reports

### `AnomalyEvent`
- `cowId`, `timestamp`, `anomalyType`, `severity`, `message`
- `relatedReadingId`, `resolved`, `createdAt`

### `DailyHealthReport`
- `cowId`, `dateKey`, total/expected readings, data completeness
- daily temperature/activity/vibration/WiFi summaries
- `dailyStatus`: `good`, `watch`, or `bad`
- `healthScore`, summary, recommendations

### `MLReport`
- stores local Random Forest report output
- includes dataset summary, accuracy, F1 scores, per-class metrics, confusion matrix, and feature importance

## Environment Variables
Create `.env.local`:

```bash
cp .env.example .env.local
```

Required values:
- `MONGODB_URI` e.g. `mongodb://127.0.0.1:27017/smart_cattle`

## Setup and Run
```bash
npm install
npm run dev
```

App URL: [http://localhost:3000](http://localhost:3000)

## Seed Demo Data
```bash
npm run seed
```

This creates sample cows and readings for dashboard demonstration.

## API Endpoints

### `POST /api/sensor-data`
Receives ESP8266 packets, validates payload, stores reading, creates/updates cow, computes derived status, and creates anomaly events when thresholds are crossed.

### `POST /api/sensor-data/bulk`
Bulk ingest endpoint for up to `1000` readings in one request.

Example payload:
```json
{
  "readings": [
    {
      "cow_id": "COW_01",
      "temperature_c": 31.8,
      "activity_index": 0.42,
      "vibration_value": 540,
      "vibration_count": 8,
      "wifi_rssi": -63,
      "raw_accel_x": 120,
      "raw_accel_y": -220,
      "raw_accel_z": 16384,
      "raw_gyro_x": 4,
      "raw_gyro_y": -2,
      "raw_gyro_z": 1,
      "timestamp_ms": 123456
    }
  ]
}
```

### `DELETE /api/sensor-data/bulk`
Bulk delete endpoint for MongoDB sensor reading IDs. It deletes matching readings, deletes related anomaly events, and refreshes affected cow statuses.

Simple ID payload:
```json
{
  "ids": [
    "662a1d5ad0c7b3a86e200001",
    "662a1d5ad0c7b3a86e200002"
  ]
}
```

MongoDB export-style payload is also supported:
```json
{
  "readings": [
    {
      "_id": {
        "$oid": "662a1d5ad0c7b3a86e200001"
      }
    }
  ]
}
```

Note: the generated `synthetic-data/synthetic-bulk-*.json` files do not contain MongoDB `_id` values before upload. To delete by ID after upload, copy `_id` values from MongoDB Atlas, Compass, or an exported `sensorreadings` JSON.

### `GET /api/readings/recent?limit=30`
Returns recent sensor readings.

### `GET /api/readings/[cowId]?limit=100`
Returns historical readings for one cow.

### `GET /api/cows`
Returns all cows.

### `GET /api/anomalies?limit=100`
Returns anomaly events.

### `GET /api/dashboard/summary`
Returns overview stats for the dashboard cards.

### `GET /api/ml-reports?limit=20`
Returns ML reports generated by the local Python training script.

### `GET /api/daily-reports?date=YYYY-MM-DD&cowId=COW_01`
Returns generated daily cow health reports.

### `POST /api/daily-reports`
Generates daily health reports from stored readings.

Example:
```json
{
  "date": "2026-04-25"
}
```

If `date` is omitted, today is used.

## Daily Health Analysis
Daily reports are generated from all readings for a cow on a date. The report calculates:

- average/min/max temperature
- elevated/high temperature duration
- average activity and low-activity minutes
- vibration/rumination signal quality
- WiFi/data quality
- daily health score from `0` to `100`
- final daily status: `good`, `watch`, or `bad`

This is more realistic than diagnosing from a single packet.

## Local ML Reporting
ML is not hosted in the cloud. Run it locally from `ml-local/`, and the website displays generated reports from MongoDB.

The local trainer is **daily** (it reads the `dailyhealthreports` collection, label field `dailyStatus`).

1. **Generate daily health reports** in Mongo (for each `YYYY-MM-DD` you want in training), for example with `POST /api/daily-reports` and body `{ "date": "2026-04-25" }` (or omit `date` for today).

2. **Train and write an ML report** to Mongo from `ml-local/`:

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

```bash
python train_report.py
```

The model artifact is saved as `ml-local/models/random_forest_daily_latest.joblib` (this folder is gitignored).

Then open `/ml-reports` in the website.

`src/lib/services/prediction.ts` still keeps a lightweight prediction abstraction for future live inference. The current dashboard report workflow is local/offline ML.

## ESP8266 Payload Example
See `docs/esp8266-post-example.md` for JSON and cURL examples.
