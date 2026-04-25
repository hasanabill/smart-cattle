# Smart Cattle MVP Context

## Project Scope
- Thesis-grade MVP for IoT-based cattle health monitoring and daily behavior analysis.
- Multi-cow support via `cowId`.
- Health status should be decided from daily patterns, not one sensor packet.

## Stack and Architecture
- Next.js App Router + TypeScript + Tailwind CSS.
- MongoDB + Mongoose models.
- ESP8266 collar sends JSON packets to `POST /api/sensor-data`.
- Processing flow: ingest -> validation -> store raw readings -> generate daily health report -> dashboard.

## Data Models
- `Cow`: profile and latest lightweight status.
- `SensorReading`: full telemetry packet and lightweight per-reading signal.
- `AnomalyEvent`: packet-level alerts retained for visibility, but not final daily health.
- `DailyHealthReport`: end-of-day cow health result (`good`, `watch`, `bad`) with score and recommendations.

## Key Routes
- `POST /api/sensor-data` ingest endpoint.
- `GET /api/readings/recent` latest packets.
- `GET /api/readings/[cowId]` per-cow history.
- `GET /api/cows` cow list.
- `GET /api/anomalies` anomaly records.
- `GET /api/dashboard/summary` overview counts.
- `GET /api/daily-reports` daily report list.
- `POST /api/daily-reports` generate reports from stored readings for a date.

## Local ML Reporting
- ML is not hosted in cloud for this thesis demo.
- `ml-local/train_report.py` runs locally, reads the `dailyhealthreports` collection, trains a Random Forest on daily aggregate features, and writes a report to `mlreports` (and saves a local `random_forest_daily_latest.joblib` model artifact for reuse).
- Generate daily health rows in Mongo with `POST /api/daily-reports` (per `YYYY-MM-DD`) before training, so the dataset has a label column: `dailyStatus` (`good`, `watch`, `bad`).
- Website displays generated reports at `/ml-reports`.
- `src/lib/services/prediction.ts` remains as a future live-inference abstraction.

## Config
- MongoDB env vars in `.env.local`.
- Rule thresholds in `src/lib/config/thresholds.ts`.

## Seed Data
- `npm run seed` populates sample cows and readings for demo.
