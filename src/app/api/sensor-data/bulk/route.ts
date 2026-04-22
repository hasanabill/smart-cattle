import { connectToDatabase } from "@/lib/db";
import { AnomalyEventModel, CowModel, SensorReadingModel } from "@/lib/models";
import { predictHealthRisk } from "@/lib/services/prediction";
import { computeCowStatus, detectAnomaly } from "@/lib/utils/anomaly";
import { fail, ok } from "@/lib/utils/http";
import {
  MAX_BULK_SENSOR_READINGS,
  sensorBulkPayloadSchema,
} from "@/lib/validation/sensor";
import { z } from "zod";

function resolvePacketTimestamp(timestampMs?: number) {
  return timestampMs ? new Date(Date.now() - timestampMs) : new Date();
}

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const payload = sensorBulkPayloadSchema.parse(json);
    await connectToDatabase();

    const prepared = await Promise.all(
      payload.readings.map(async (item) => {
        const timestamp = resolvePacketTimestamp(item.timestamp_ms);
        const readingBase = {
          cowId: item.cow_id,
          timestamp,
          temperatureC: item.temperature_c,
          activityIndex: item.activity_index,
          vibrationValue: item.vibration_value,
          vibrationCount: item.vibration_count,
          wifiRssi: item.wifi_rssi,
          rawAccelX: item.raw_accel_x,
          rawAccelY: item.raw_accel_y,
          rawAccelZ: item.raw_accel_z,
          rawGyroX: item.raw_gyro_x,
          rawGyroY: item.raw_gyro_y,
          rawGyroZ: item.raw_gyro_z,
        };

        const derivedStatus = computeCowStatus(readingBase);
        const prediction = await predictHealthRisk(readingBase);
        const anomalies = detectAnomaly(readingBase);

        return {
          reading: {
            ...readingBase,
            derivedStatus,
            prediction,
          },
          anomalies,
          cowId: readingBase.cowId,
          timestamp: readingBase.timestamp,
          status: derivedStatus,
        };
      }),
    );

    const createdReadings = await SensorReadingModel.insertMany(
      prepared.map((item) => item.reading),
      { ordered: true },
    );

    const anomalyInsertPayload: Array<{
      cowId: string;
      timestamp: Date;
      anomalyType: "high_temperature" | "low_activity" | "low_vibration" | "multi_signal_anomaly";
      severity: "low" | "medium" | "high";
      message: string;
      relatedReadingId: (typeof createdReadings)[number]["_id"];
      resolved: boolean;
    }> = [];

    for (let i = 0; i < createdReadings.length; i += 1) {
      const reading = createdReadings[i];
      const anomalies = prepared[i].anomalies;
      for (const event of anomalies) {
        anomalyInsertPayload.push({
          cowId: reading.cowId,
          timestamp: reading.timestamp,
          anomalyType: event.anomalyType,
          severity: event.severity,
          message: event.message,
          relatedReadingId: reading._id,
          resolved: false,
        });
      }
    }

    const insertedAnomalies =
      anomalyInsertPayload.length > 0
        ? await AnomalyEventModel.insertMany(anomalyInsertPayload, { ordered: true })
        : [];

    if (insertedAnomalies.length > 0) {
      const readingToAnomalyIds = new Map<string, string[]>();
      for (const event of insertedAnomalies) {
        const key = String(event.relatedReadingId);
        const prev = readingToAnomalyIds.get(key) ?? [];
        prev.push(String(event._id));
        readingToAnomalyIds.set(key, prev);
      }

      await SensorReadingModel.bulkWrite(
        Array.from(readingToAnomalyIds.entries()).map(([readingId, anomalyEventIds]) => ({
          updateOne: {
            filter: { _id: readingId },
            update: { $set: { anomalyEventIds } },
          },
        })),
      );
    }

    const latestCowStatusById = new Map<
      string,
      { status: "normal" | "warning" | "anomaly"; timestamp: Date }
    >();
    for (const item of prepared) {
      const existing = latestCowStatusById.get(item.cowId);
      if (!existing || item.timestamp.getTime() >= existing.timestamp.getTime()) {
        latestCowStatusById.set(item.cowId, {
          status: item.status,
          timestamp: item.timestamp,
        });
      }
    }

    if (latestCowStatusById.size > 0) {
      await CowModel.bulkWrite(
        Array.from(latestCowStatusById.entries()).map(([cowId, value]) => ({
          updateOne: {
            filter: { cowId },
            update: {
              $set: { status: value.status },
              $setOnInsert: { cowId, name: cowId },
            },
            upsert: true,
          },
        })),
      );
    }

    return ok(
      {
        accepted: payload.readings.length,
        insertedReadings: createdReadings.length,
        createdAnomalies: insertedAnomalies.length,
        updatedCows: latestCowStatusById.size,
        maxBatchSize: MAX_BULK_SENSOR_READINGS,
      },
      201,
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return fail("Invalid bulk sensor payload.", 422, error.flatten());
    }

    return fail("Failed to ingest bulk sensor data.", 500, String(error));
  }
}
