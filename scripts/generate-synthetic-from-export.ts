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

type DayProfile = "good" | "watch" | "bad";

const INPUT_FILE = "smart-cattle.sensorreadings.json";
const OUTPUT_DIR = "synthetic-data";
const CHUNK_SIZE = 1_000;

/** Number of full UTC days (yesterday and earlier) to cover — matches ML need for ≥10 day-level rows. */
const NUM_DAYS = 14;
/** Per cow per day; 1200/2880 ≈ 42% of a full day at 30s helps avoid heavy “low coverage” penalty. */
const READINGS_PER_DAY = 1_200;

// Cycle so generated daily reports are not all the same `dailyStatus` (train_report needs 2+ classes).
const PROFILE_CYCLE: DayProfile[] = [
  "good",
  "good",
  "watch",
  "good",
  "bad",
  "watch",
  "good",
  "good",
  "bad",
  "watch",
  "good",
  "good",
  "watch",
  "bad",
];

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

function maybeSensorSpike(value: number, chance: number, spread: number) {
  return Math.random() < chance ? value + randomBetween(-spread, spread) : value;
}

/**
 * For each of the last NUM_DAYS full UTC days (1 = yesterday), return [dateKey, start, end].
 */
function enumerateUtcHistoryDays(
  n: number,
): Array<{ dateKey: string; start: Date; end: Date }> {
  const now = new Date();
  const days: Array<{ dateKey: string; start: Date; end: Date }> = [];
  for (let i = 1; i <= n; i += 1) {
    const start = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate() - i,
        0,
        0,
        0,
        0,
      ),
    );
    const end = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate() - i,
        23,
        59,
        59,
        999,
      ),
    );
    days.push({ dateKey: start.toISOString().slice(0, 10), start, end });
  }
  return days;
}

function createSyntheticReading(
  base: MongoExportReading,
  profile: DayProfile,
  indexInDay: number,
): ApiReading {
  const dailyWave = Math.sin(indexInDay / 190);
  const shortWave = Math.sin(indexInDay / 29);
  const transitionNoise = profile === "good" && Math.random() < 0.12;

  let temperature: number;
  let activity: number;
  let vibrationCount: number;
  let vibrationValue: number;

  if (profile === "good") {
    temperature = randomBetween(25.2, 31.7) + dailyWave * 0.18;
    activity = randomBetween(0.014, 0.075) + Math.abs(shortWave) * 0.01;
    vibrationCount = randomInt(3, 10);
    vibrationValue = randomInt(10, 55);
    if (transitionNoise) {
      temperature = randomBetween(31.7, 32.75);
      activity = randomBetween(0.008, 0.018);
      vibrationCount = randomInt(2, 4);
    }
  } else if (profile === "watch") {
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
    timestamp_ms: 0, // set per slot below
  };
}

function pickBaseForCow(
  source: MongoExportReading[],
  cowId: string,
): MongoExportReading {
  const match = source.find((r) => r.cowId === cowId);
  return match ?? source[0];
}

function buildCowIds(source: MongoExportReading[]): string[] {
  const fromExport = [...new Set(source.map((r) => r.cowId).filter(Boolean))];
  if (fromExport.length >= 1) {
    return [fromExport[0]!];
  }
  return ["COW_01"];
}

function main() {
  const sourcePath = join(process.cwd(), INPUT_FILE);
  const source = JSON.parse(readFileSync(sourcePath, "utf-8")) as MongoExportReading[];

  if (!Array.isArray(source) || source.length === 0) {
    throw new Error(`No readings found in ${INPUT_FILE}`);
  }

  const outputDir = join(process.cwd(), OUTPUT_DIR);
  mkdirSync(outputDir, { recursive: true });

  const daySpecs = enumerateUtcHistoryDays(NUM_DAYS);
  const cowIds = buildCowIds(source);
  const allReadings: ApiReading[] = [];
  const now = Date.now();

  for (let dayIndex = 0; dayIndex < daySpecs.length; dayIndex += 1) {
    const { start, end } = daySpecs[dayIndex];
    const profile = PROFILE_CYCLE[dayIndex % PROFILE_CYCLE.length] ?? "good";
    for (const cowId of cowIds) {
      const base = { ...pickBaseForCow(source, cowId), cowId };
      const span = end.getTime() - start.getTime();
      for (let k = 0; k < READINGS_PER_DAY; k += 1) {
        const tMs = start.getTime() + (k / READINGS_PER_DAY) * span;
        const row = createSyntheticReading(base, profile, k);
        row.cow_id = cowId;
        row.timestamp_ms = Math.max(0, Math.round(now - tMs));
        allReadings.push(row);
      }
    }
  }

  const dateKeysPath = join(outputDir, "synthetic-daily-date-keys.txt");
  writeFileSync(
    dateKeysPath,
    `${daySpecs.map((d) => d.dateKey).join("\n")}\n`,
    "utf-8",
  );

  const total = allReadings.length;
  const fullOutputPath = join(outputDir, `synthetic-bulk-full-${total}.json`);
  writeFileSync(
    fullOutputPath,
    JSON.stringify({ readings: allReadings }, null, 2),
    "utf-8",
  );

  for (let i = 0; i < total / CHUNK_SIZE; i += 1) {
    const chunk = allReadings.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
    const chunkPath = join(
      outputDir,
      `synthetic-bulk-${String(i + 1).padStart(2, "0")}.json`,
    );
    writeFileSync(chunkPath, JSON.stringify({ readings: chunk }, null, 2), "utf-8");
  }

  console.log(
    `Generated ${total} synthetic readings across ${NUM_DAYS} UTC days, ${cowIds.length} cow(s).`,
  );
  console.log(
    `Each (cow,day) is ~${READINGS_PER_DAY} points with a day-level profile (good/watch/bad) for daily health + ML.`,
  );
  console.log(`Full file: ${fullOutputPath}`);
  console.log(`Date keys (for POST /api/daily-reports): ${dateKeysPath}`);
  const chunks = Math.ceil(total / CHUNK_SIZE);
  console.log(
    `Bulk upload chunks: ${outputDir}/synthetic-bulk-01.json ... synthetic-bulk-${String(chunks).padStart(2, "0")}.json`,
  );
  console.log(
    "After upload: call POST /api/daily-reports with { \"date\": \"YYYY-MM-DD\" } for each line in that file (or at least 10+ distinct dates) so dailyhealthreports is populated before train_report.py.",
  );
}

main();
