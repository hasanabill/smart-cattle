import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

type MongoExportReading = {
  cowId: string;
  temperatureC: number;
  activityIndex: number;
  vibrationValue: number;
  vibrationCount: number;
  wifiRssi: number;
  rawAccelX: number;
  rawAccelY: number;
  rawAccelZ: number;
  rawGyroX: number;
  rawGyroY: number;
  rawGyroZ: number;
};

type ApiReading = {
  cow_id: string;
  temperature_c: number;
  activity_index: number;
  vibration_value: number;
  vibration_count: number;
  wifi_rssi: number;
  raw_accel_x: number;
  raw_accel_y: number;
  raw_accel_z: number;
  raw_gyro_x: number;
  raw_gyro_y: number;
  raw_gyro_z: number;
  timestamp_ms: number;
};

const INPUT_FILE = "smart-cattle.sensorreadings.json";
const OUTPUT_DIR = "synthetic-data";
const TOTAL_READINGS = 10_000;
const CHUNK_SIZE = 1_000;
const SEND_INTERVAL_MS = 30_000;

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function randomInt(min: number, max: number) {
  return Math.round(randomBetween(min, max));
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function pick<T>(items: T[]) {
  return items[randomInt(0, items.length - 1)];
}

function createSyntheticReading(base: MongoExportReading, index: number): ApiReading {
  const dailyWave = Math.sin(index / 180);
  const shortWave = Math.sin(index / 25);
  const anomalyWindow = index % 2200 > 2050;

  const temperature = anomalyWindow
    ? randomBetween(32.6, 34.2)
    : base.temperatureC + dailyWave * 0.45 + randomBetween(-0.2, 0.2);

  const activity = anomalyWindow
    ? randomBetween(0.04, 0.16)
    : base.activityIndex + Math.abs(shortWave) * 0.04 + randomBetween(-0.002, 0.008);

  const vibrationCount = anomalyWindow
    ? randomInt(0, 2)
    : clamp(base.vibrationCount + randomInt(0, 8), 0, 14);

  return {
    cow_id: base.cowId || "COW_01",
    temperature_c: Number(clamp(temperature, 24, 35).toFixed(3)),
    activity_index: Number(clamp(activity, 0, 1.2).toFixed(6)),
    vibration_value: clamp(base.vibrationValue + randomInt(-5, 30), 0, 1023),
    vibration_count: vibrationCount,
    wifi_rssi: clamp(base.wifiRssi + randomInt(-6, 6), -90, -35),
    raw_accel_x: base.rawAccelX + randomInt(-350, 350),
    raw_accel_y: base.rawAccelY + randomInt(-350, 350),
    raw_accel_z: base.rawAccelZ + randomInt(-350, 350),
    raw_gyro_x: base.rawGyroX + randomInt(-80, 80),
    raw_gyro_y: base.rawGyroY + randomInt(-80, 80),
    raw_gyro_z: base.rawGyroZ + randomInt(-80, 80),
    timestamp_ms: (TOTAL_READINGS - index) * SEND_INTERVAL_MS,
  };
}

function main() {
  const sourcePath = join(process.cwd(), INPUT_FILE);
  const source = JSON.parse(readFileSync(sourcePath, "utf-8")) as MongoExportReading[];

  if (!Array.isArray(source) || source.length === 0) {
    throw new Error(`No readings found in ${INPUT_FILE}`);
  }

  const outputDir = join(process.cwd(), OUTPUT_DIR);
  mkdirSync(outputDir, { recursive: true });

  const allReadings: ApiReading[] = [];
  for (let i = 0; i < TOTAL_READINGS; i += 1) {
    allReadings.push(createSyntheticReading(pick(source), i));
  }

  const fullOutputPath = join(outputDir, "synthetic-bulk-10000.json");
  writeFileSync(
    fullOutputPath,
    JSON.stringify({ readings: allReadings }, null, 2),
    "utf-8",
  );

  for (let i = 0; i < TOTAL_READINGS / CHUNK_SIZE; i += 1) {
    const chunk = allReadings.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
    const chunkPath = join(
      outputDir,
      `synthetic-bulk-${String(i + 1).padStart(2, "0")}.json`,
    );
    writeFileSync(chunkPath, JSON.stringify({ readings: chunk }, null, 2), "utf-8");
  }

  console.log(`Generated ${TOTAL_READINGS} synthetic readings.`);
  console.log(`Full file: ${fullOutputPath}`);
  console.log(`Postman chunks: ${dirname(fullOutputPath)}/synthetic-bulk-01.json ... synthetic-bulk-10.json`);
}

main();
