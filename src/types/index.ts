export type CowStatus = "normal" | "warning" | "anomaly";

export type AnomalySeverity = "low" | "medium" | "high";

export type AnomalyType =
  | "high_temperature"
  | "low_activity"
  | "low_vibration"
  | "multi_signal_anomaly";

export interface SensorIngestPayload {
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
  timestamp_ms?: number;
}

export interface ComputedAnomaly {
  anomalyType: AnomalyType;
  severity: AnomalySeverity;
  message: string;
}

export interface DashboardSummary {
  totalCows: number;
  healthyCows: number;
  warningCows: number;
  anomalyCows: number;
  latestReadingsCount: number;
  activeAnomalies: number;
}

export interface TimeSeriesPoint {
  timestamp: string;
  temperatureC: number;
  activityIndex: number;
  vibrationCount: number;
}
