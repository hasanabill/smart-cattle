import { connectToDatabase } from "@/lib/db";
import { AnomalyEventModel, CowModel, SensorReadingModel } from "@/lib/models";
import { predictHealthRisk } from "@/lib/services/prediction";
import { computeCowStatus, detectAnomaly } from "@/lib/utils/anomaly";
import { fail, ok } from "@/lib/utils/http";
import {
  MAX_BULK_SENSOR_READINGS,
  sensorBulkPayloadSchema,
} from "@/lib/validation/sensor";
import { Types } from "mongoose";
import { z } from "zod";

const MAX_BULK_DELETE_IDS = 10_000;

type BulkDeletePayload = {
  ids?: unknown[];
  readingIds?: unknown[];
  readings?: Array<{ _id?: unknown }>;
};

function resolvePacketTimestamp(timestampMs?: number) {
  return timestampMs ? new Date(Date.now() - timestampMs) : new Date();
}

function normalizeMongoId(value: unknown): string | null {
  if (typeof value === "string") {
    return value;
  }

  if (value && typeof value === "object" && "$oid" in value) {
    const oid = (value as { $oid?: unknown }).$oid;
    return typeof oid === "string" ? oid : null;
  }

  return null;
}

function extractBulkDeleteIds(payload: BulkDeletePayload) {
  const rawIds = [
    ...(payload.ids ?? []),
    ...(payload.readingIds ?? []),
    ...(payload.readings ?? []).map((reading) => reading._id),
  ];

  const normalizedIds = rawIds
    .map(normalizeMongoId)
    .filter((id): id is string => typeof id === "string");

  return Array.from(new Set(normalizedIds)).filter((id) =>
    Types.ObjectId.isValid(id),
  );
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

export async function DELETE(request: Request) {
  try {
    const payload = (await request.json()) as BulkDeletePayload;
    const ids = extractBulkDeleteIds(payload);

    if (ids.length === 0) {
      return fail(
        "No valid MongoDB reading IDs provided. Send { ids: [\"...\"] } or { readings: [{ _id: { $oid: \"...\" } }] }.",
        422,
      );
    }

    if (ids.length > MAX_BULK_DELETE_IDS) {
      return fail(
        `Too many IDs. Maximum bulk delete size is ${MAX_BULK_DELETE_IDS}.`,
        413,
      );
    }

    await connectToDatabase();

    const objectIds = ids.map((id) => new Types.ObjectId(id));
    const readingsToDelete = await SensorReadingModel.find({
      _id: { $in: objectIds },
    })
      .select({ _id: 1, cowId: 1 })
      .lean()
      .exec();

    const affectedCowIds = Array.from(
      new Set(readingsToDelete.map((reading) => String(reading.cowId))),
    );

    const [anomalyDeleteResult, readingDeleteResult] = await Promise.all([
      AnomalyEventModel.deleteMany({ relatedReadingId: { $in: objectIds } }),
      SensorReadingModel.deleteMany({ _id: { $in: objectIds } }),
    ]);

    if (affectedCowIds.length > 0) {
      await Promise.all(
        affectedCowIds.map(async (cowId) => {
          const latestReading = await SensorReadingModel.findOne({ cowId })
            .sort({ timestamp: -1 })
            .select({ derivedStatus: 1 })
            .lean()
            .exec();

          await CowModel.findOneAndUpdate(
            { cowId },
            { $set: { status: latestReading?.derivedStatus ?? "normal" } },
          );
        }),
      );
    }

    return ok({
      requestedIds: ids.length,
      matchedReadings: readingsToDelete.length,
      deletedReadings: readingDeleteResult.deletedCount,
      deletedAnomalies: anomalyDeleteResult.deletedCount,
      refreshedCows: affectedCowIds.length,
      maxBatchSize: MAX_BULK_DELETE_IDS,
    });
  } catch (error) {
    return fail("Failed to delete bulk sensor readings.", 500, String(error));
  }
}
