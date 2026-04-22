import { CowModel, SensorReadingModel } from "@/lib/models";
import { computeCowStatus, detectAnomaly } from "@/lib/utils/anomaly";

type SamplePacket = {
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

const baseTime = Date.now();

const samplePackets: SamplePacket[] = [
  {
    cowId: "COW_01",
    temperatureC: 31.8,
    activityIndex: 0.42,
    vibrationValue: 540,
    vibrationCount: 8,
    wifiRssi: -63,
    rawAccelX: 120,
    rawAccelY: -220,
    rawAccelZ: 16384,
    rawGyroX: 4,
    rawGyroY: -2,
    rawGyroZ: 1,
  },
  {
    cowId: "COW_02",
    temperatureC: 33.7,
    activityIndex: 0.12,
    vibrationValue: 190,
    vibrationCount: 2,
    wifiRssi: -68,
    rawAccelX: 105,
    rawAccelY: -180,
    rawAccelZ: 16200,
    rawGyroX: 8,
    rawGyroY: -1,
    rawGyroZ: 3,
  },
  {
    cowId: "COW_03",
    temperatureC: 32.7,
    activityIndex: 0.2,
    vibrationValue: 260,
    vibrationCount: 3,
    wifiRssi: -71,
    rawAccelX: 93,
    rawAccelY: -150,
    rawAccelZ: 16411,
    rawGyroX: 6,
    rawGyroY: -2,
    rawGyroZ: 2,
  },
];

export async function seedSampleData() {
  await CowModel.deleteMany({});
  await SensorReadingModel.deleteMany({});

  for (let i = 0; i < 12; i += 1) {
    for (const packet of samplePackets) {
      const timestamp = new Date(baseTime - i * 5 * 60 * 1000);
      const jitter = i % 2 === 0 ? 0.1 : -0.1;

      const reading = {
        cowId: packet.cowId,
        timestamp,
        temperatureC: packet.temperatureC + jitter,
        activityIndex: Math.max(0, packet.activityIndex + jitter / 10),
        vibrationValue: packet.vibrationValue,
        vibrationCount: Math.max(0, packet.vibrationCount + (i % 3 === 0 ? -1 : 0)),
        wifiRssi: packet.wifiRssi,
        rawAccelX: packet.rawAccelX,
        rawAccelY: packet.rawAccelY,
        rawAccelZ: packet.rawAccelZ,
        rawGyroX: packet.rawGyroX,
        rawGyroY: packet.rawGyroY,
        rawGyroZ: packet.rawGyroZ,
      };

      const derivedStatus = computeCowStatus(reading);
      const anomalies = detectAnomaly(reading);

      await SensorReadingModel.create({
        ...reading,
        derivedStatus,
        processingNotes: anomalies.map((entry) => entry.message),
      });

      await CowModel.findOneAndUpdate(
        { cowId: reading.cowId },
        {
          $set: { status: derivedStatus },
          $setOnInsert: { cowId: reading.cowId, name: reading.cowId },
        },
        { upsert: true },
      );
    }
  }
}
