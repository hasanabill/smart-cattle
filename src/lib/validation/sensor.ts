import { z } from "zod";

export const MAX_BULK_SENSOR_READINGS = 1000;

export const sensorPayloadSchema = z.object({
  cow_id: z.string().min(1),
  temperature_c: z.number(),
  activity_index: z.number().min(0),
  vibration_value: z.number().min(0),
  vibration_count: z.number().min(0),
  wifi_rssi: z.number(),
  raw_accel_x: z.number(),
  raw_accel_y: z.number(),
  raw_accel_z: z.number(),
  raw_gyro_x: z.number(),
  raw_gyro_y: z.number(),
  raw_gyro_z: z.number(),
  timestamp_ms: z.number().int().nonnegative().optional(),
});

export const sensorBulkPayloadSchema = z.object({
  readings: z.array(sensorPayloadSchema).min(1).max(MAX_BULK_SENSOR_READINGS),
});

export type SensorPayloadInput = z.infer<typeof sensorPayloadSchema>;
export type SensorBulkPayloadInput = z.infer<typeof sensorBulkPayloadSchema>;
