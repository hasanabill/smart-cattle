import { writeFileSync } from "node:fs";
import { join } from "node:path";

type SensorPacket = {
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

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function randomInt(min: number, max: number) {
  return Math.floor(randomBetween(min, max + 1));
}

function createPacket(index: number): SensorPacket {
  const wave = Math.sin(index / 40);
  const cowNumeric = (index % 5) + 1;
  const cow_id = `COW_${String(cowNumeric).padStart(2, "0")}`;

  const temperature = Number((31.5 + wave * 0.9 + randomBetween(-0.3, 0.3)).toFixed(2));
  const activity = Number((0.35 + wave * 0.2 + randomBetween(-0.08, 0.08)).toFixed(3));
  const vibrationCount = Math.max(1, randomInt(3, 12) + (wave < -0.6 ? -2 : 0));

  return {
    cow_id,
    temperature_c: Math.max(29.8, Math.min(35.2, temperature)),
    activity_index: Math.max(0.05, Number(activity.toFixed(3))),
    vibration_value: randomInt(180, 620),
    vibration_count: vibrationCount,
    wifi_rssi: randomInt(-78, -54),
    raw_accel_x: randomInt(-2500, 2500),
    raw_accel_y: randomInt(-2500, 2500),
    raw_accel_z: randomInt(15000, 17500),
    raw_gyro_x: randomInt(-20, 20),
    raw_gyro_y: randomInt(-20, 20),
    raw_gyro_z: randomInt(-20, 20),
    timestamp_ms: (1000 - index) * 10_000,
  };
}

function main() {
  const readings: SensorPacket[] = [];
  for (let i = 0; i < 1000; i += 1) {
    readings.push(createPacket(i));
  }

  const payload = { readings };
  const outputPath = join(process.cwd(), "docs", "postman-bulk-1000.json");
  writeFileSync(outputPath, JSON.stringify(payload, null, 2), "utf-8");

  console.log(`Generated ${readings.length} records at ${outputPath}`);
}

main();
