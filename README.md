# Smart Cattle Health Monitoring and Anomaly Detection

Thesis-grade MVP for ingesting cattle collar sensor data, storing historical telemetry, running rule-based anomaly detection, and visualizing health status in a clean web dashboard.

## Tech Stack
- Next.js App Router (TypeScript)
- Tailwind CSS
- MongoDB + Mongoose
- Recharts
- Zod for payload validation

## System Architecture
`ESP8266 collar -> Next.js API -> MongoDB -> rule processing / prediction service -> dashboard`

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
│   │   │   └── dashboard/summary/route.ts
│   │   ├── cows/page.tsx
│   │   ├── cows/[cowId]/page.tsx
│   │   ├── anomalies/page.tsx
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
│   │   │   └── index.ts
│   │   ├── services/
│   │   │   ├── data.ts
│   │   │   └── prediction.ts
│   │   ├── seed/sample-data.ts
│   │   ├── utils/
│   │   │   ├── anomaly.ts
│   │   │   └── http.ts
│   │   └── validation/sensor.ts
│   └── types/index.ts
├── scripts/seed.ts
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

### `AnomalyEvent`
- `cowId`, `timestamp`, `anomalyType`, `severity`, `message`
- `relatedReadingId`, `resolved`, `createdAt`

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

## Rule-Based Anomaly Logic (Phase 1)
Thresholds are configurable in `src/lib/config/thresholds.ts`:
- High temperature
- Low activity
- Low vibration count (rumination proxy)
- Multi-signal anomaly when multiple high-risk signals happen together

## ML-Ready Integration
`src/lib/services/prediction.ts` exposes:
- `predictHealthRisk(reading)`

Current implementation uses rules, but ready for:
- Option A: call external Python Random Forest API
- Option B: ONNX Runtime inference in Next.js/Node

## ESP8266 Payload Example
See `docs/esp8266-post-example.md` for JSON and cURL examples.
