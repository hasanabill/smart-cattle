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

const TARGET_MIX = {
  normal: 0.7,
  warning: 0.2,
  anomaly: 0.1,
} as const;

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

function pickSyntheticClass() {
  const roll = Math.random();
  if (roll < TARGET_MIX.normal) return "normal";
  if (roll < TARGET_MIX.normal + TARGET_MIX.warning) return "warning";
  return "anomaly";
}

function maybeSensorSpike(value: number, chance: number, spread: number) {
  return Math.random() < chance ? value + randomBetween(-spread, spread) : value;
}

function createSyntheticReading(base: MongoExportReading, index: number): ApiReading {
  const syntheticClass = pickSyntheticClass();
  const dailyWave = Math.sin(index / 190);
  const shortWave = Math.sin(index / 29);
  const transitionNoise = Math.random() < 0.18;

  let temperature: number;
  let activity: number;
  let vibrationCount: number;
  let vibrationValue: number;

  if (syntheticClass === "normal") {
    temperature = randomBetween(25.2, 31.7) + dailyWave * 0.18;
    activity = randomBetween(0.014, 0.075) + Math.abs(shortWave) * 0.01;
    vibrationCount = randomInt(3, 10);
    vibrationValue = randomInt(10, 55);

    // Real collars occasionally produce borderline but still recoverable readings.
    if (transitionNoise) {
      temperature = randomBetween(31.7, 32.75);
      activity = randomBetween(0.008, 0.018);
      vibrationCount = randomInt(2, 4);
    }
  } else if (syntheticClass === "warning") {
    const mode = pick(["temperature", "activity", "vibration", "mixed"]);
    temperature = randomBetween(25.6, 31.9);
    activity = randomBetween(0.012, 0.06);
    vibrationCount = randomInt(3, 8);
    vibrationValue = randomInt(6, 45);

    if (mode === "temperature") {
      temperature = randomBetween(32.45, 33.15);
    } else if (mode === "activity") {
      activity = randomBetween(0.0042, 0.012);
    } else if (mode === "vibration") {
      vibrationCount = randomInt(1, 2);
    } else {
      temperature = randomBetween(32.1, 33.05);
      activity = randomBetween(0.006, 0.018);
      vibrationCount = randomInt(1, 4);
    }
  } else {
    const mode = pick(["temperature", "activity", "vibration", "combined"]);
    temperature = randomBetween(26.0, 32.4);
    activity = randomBetween(0.008, 0.055);
    vibrationCount = randomInt(1, 7);
    vibrationValue = randomInt(0, 40);

    if (mode === "temperature") {
      temperature = randomBetween(33.05, 34.4);
      activity = randomBetween(0.008, 0.05);
      vibrationCount = randomInt(1, 7);
    } else if (mode === "activity") {
      temperature = randomBetween(31.0, 33.0);
      activity = randomBetween(0.001, 0.005);
      vibrationCount = randomInt(1, 6);
    } else if (mode === "vibration") {
      temperature = randomBetween(31.0, 33.0);
      activity = randomBetween(0.006, 0.055);
      vibrationCount = 0;
    } else {
      temperature = randomBetween(32.6, 34.2);
      activity = randomBetween(0.001, 0.012);
      vibrationCount = randomInt(0, 2);
    }
  }

  temperature = maybeSensorSpike(temperature, 0.04, 0.65);
  activity = maybeSensorSpike(activity, 0.04, 0.01);
  vibrationValue = maybeSensorSpike(vibrationValue, 0.05, 18);

  return {
    cow_id: base.cowId || "COW_01",
    temperature_c: Number(clamp(temperature, 24, 35).toFixed(3)),
    activity_index: Number(clamp(activity, 0, 0.18).toFixed(6)),
    vibration_value: clamp(Math.round(vibrationValue), 0, 1023),
    vibration_count: vibrationCount,
    wifi_rssi: clamp(base.wifiRssi + randomInt(-6, 6), -90, -35),
    raw_accel_x: base.rawAccelX + randomInt(-650, 650),
    raw_accel_y: base.rawAccelY + randomInt(-650, 650),
    raw_accel_z: base.rawAccelZ + randomInt(-650, 650),
    raw_gyro_x: base.rawGyroX + randomInt(-160, 160),
    raw_gyro_y: base.rawGyroY + randomInt(-160, 160),
    raw_gyro_z: base.rawGyroZ + randomInt(-160, 160),
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
