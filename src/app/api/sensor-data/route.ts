import { connectToDatabase } from "@/lib/db";
import { AnomalyEventModel, CowModel, SensorReadingModel } from "@/lib/models";
import { predictHealthRisk } from "@/lib/services/prediction";
import { computeCowStatus, detectAnomaly } from "@/lib/utils/anomaly";
import { fail, ok } from "@/lib/utils/http";
import { sensorPayloadSchema } from "@/lib/validation/sensor";
import { z } from "zod";

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const payload = sensorPayloadSchema.parse(json);
    await connectToDatabase();

    const packetTime = payload.timestamp_ms
      ? new Date(Date.now() - payload.timestamp_ms)
      : new Date();

    const readingBase = {
      cowId: payload.cow_id,
      timestamp: packetTime,
      temperatureC: payload.temperature_c,
      activityIndex: payload.activity_index,
      vibrationValue: payload.vibration_value,
      vibrationCount: payload.vibration_count,
      wifiRssi: payload.wifi_rssi,
      rawAccelX: payload.raw_accel_x,
      rawAccelY: payload.raw_accel_y,
      rawAccelZ: payload.raw_accel_z,
      rawGyroX: payload.raw_gyro_x,
      rawGyroY: payload.raw_gyro_y,
      rawGyroZ: payload.raw_gyro_z,
    };

    const derivedStatus = computeCowStatus({
      timestamp: readingBase.timestamp,
      temperatureC: readingBase.temperatureC,
      activityIndex: readingBase.activityIndex,
      vibrationCount: readingBase.vibrationCount,
    });

    const prediction = await predictHealthRisk({
      timestamp: readingBase.timestamp,
      temperatureC: readingBase.temperatureC,
      activityIndex: readingBase.activityIndex,
      vibrationCount: readingBase.vibrationCount,
    });

    const createdReading = await SensorReadingModel.create({
      ...readingBase,
      derivedStatus,
      prediction,
    });

    const anomalies = detectAnomaly({
      timestamp: readingBase.timestamp,
      temperatureC: readingBase.temperatureC,
      activityIndex: readingBase.activityIndex,
      vibrationCount: readingBase.vibrationCount,
    });

    const anomalyDocs =
      anomalies.length > 0
        ? await AnomalyEventModel.insertMany(
            anomalies.map((event) => ({
              cowId: readingBase.cowId,
              timestamp: readingBase.timestamp,
              anomalyType: event.anomalyType,
              severity: event.severity,
              message: event.message,
              relatedReadingId: createdReading._id,
              resolved: false,
            })),
          )
        : [];

    if (anomalyDocs.length > 0) {
      createdReading.anomalyEventIds = anomalyDocs.map((item) => item._id);
      await createdReading.save();
    }

    await CowModel.findOneAndUpdate(
      { cowId: readingBase.cowId },
      {
        $set: { status: derivedStatus },
        $setOnInsert: {
          cowId: readingBase.cowId,
          name: readingBase.cowId,
        },
      },
      {
        upsert: true,
        new: true,
      },
    );

    return ok(
      {
        readingId: createdReading._id,
        cowId: createdReading.cowId,
        derivedStatus,
        anomalyCount: anomalyDocs.length,
        prediction,
      },
      201,
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return fail("Invalid sensor payload.", 422, error.flatten());
    }

    return fail("Failed to ingest sensor data.", 500, String(error));
  }
}
