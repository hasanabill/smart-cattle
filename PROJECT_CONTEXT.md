# Smart Cattle MVP Context

## Project Scope
- Thesis-grade MVP for IoT-based cattle health monitoring and anomaly detection.
- Multi-cow support via `cowId`.
- Current inference mode is rule-based, designed to be upgraded to ML later.

## Stack and Architecture
- Next.js App Router + TypeScript + Tailwind CSS.
- MongoDB + Mongoose models.
- ESP8266 collar sends JSON packets to `POST /api/sensor-data`.
- Processing flow: ingest -> validation -> store -> rule processing -> anomaly events -> dashboard.

## Data Models
- `Cow`: profile and latest status (`normal`, `warning`, `anomaly`).
- `SensorReading`: full telemetry packet + derived status + prediction metadata.
- `AnomalyEvent`: alert records with severity and reading linkage.

## Key Routes
- `POST /api/sensor-data` ingest endpoint.
- `GET /api/readings/recent` latest packets.
- `GET /api/readings/[cowId]` per-cow history.
- `GET /api/cows` cow list.
- `GET /api/anomalies` anomaly records.
- `GET /api/dashboard/summary` overview counts.

## Local ML Reporting
- ML is not hosted in cloud for this thesis demo.
- `ml-local/train_report.py` runs locally, reads MongoDB sensor readings, trains Random Forest, and writes a report to `mlreports`.
- Website displays generated reports at `/ml-reports`.
- `src/lib/services/prediction.ts` remains as a future live-inference abstraction.

## Config
- MongoDB env vars in `.env.local`.
- Rule thresholds in `src/lib/config/thresholds.ts`.

## Seed Data
- `npm run seed` populates sample cows and readings for demo.
