import { HEALTH_THRESHOLDS } from "@/lib/config/thresholds";
import type { ComputedAnomaly, CowStatus, TimeSeriesPoint } from "@/types";

type ReadingLike = {
  timestamp: Date | string;
  temperatureC: number;
  activityIndex: number;
  vibrationCount: number;
};

export function detectAnomaly(reading: ReadingLike): ComputedAnomaly[] {
  const events: ComputedAnomaly[] = [];

  if (reading.temperatureC >= HEALTH_THRESHOLDS.temperature.anomalyHighC) {
    events.push({
      anomalyType: "high_temperature",
      severity: "high",
      message: "Body temperature is critically above expected range.",
    });
  } else if (reading.temperatureC >= HEALTH_THRESHOLDS.temperature.warningHighC) {
    events.push({
      anomalyType: "high_temperature",
      severity: "medium",
      message: "Body temperature is above warning threshold.",
    });
  }

  if (reading.activityIndex <= HEALTH_THRESHOLDS.activity.anomalyLow) {
    events.push({
      anomalyType: "low_activity",
      severity: "high",
      message: "Activity level is critically low.",
    });
  } else if (reading.activityIndex <= HEALTH_THRESHOLDS.activity.warningLow) {
    events.push({
      anomalyType: "low_activity",
      severity: "medium",
      message: "Activity level is below expected range.",
    });
  }

  if (reading.vibrationCount <= HEALTH_THRESHOLDS.vibration.anomalyLowCount) {
    events.push({
      anomalyType: "low_vibration",
      severity: "high",
      message: "Vibration count is very low, possible rumination issue.",
    });
  } else if (reading.vibrationCount <= HEALTH_THRESHOLDS.vibration.warningLowCount) {
    events.push({
      anomalyType: "low_vibration",
      severity: "low",
      message: "Vibration trend is lower than normal.",
    });
  }

  const highRiskSignals = events.filter((event) => event.severity !== "low");
  if (highRiskSignals.length >= 2) {
    events.push({
      anomalyType: "multi_signal_anomaly",
      severity: "high",
      message: "Multiple abnormal signals detected in the same interval.",
    });
  }

  return events;
}

export function computeCowStatus(reading: ReadingLike): CowStatus {
  const anomalies = detectAnomaly(reading);
  if (anomalies.some((item) => item.severity === "high")) {
    return "anomaly";
  }
  if (anomalies.length > 0) {
    return "warning";
  }
  return "normal";
}

export function summarizeLatestHealth(readings: ReadingLike[]) {
  if (!readings.length) {
    return {
      avgTemperature: 0,
      avgActivity: 0,
      avgVibration: 0,
    };
  }

  const total = readings.reduce(
    (acc, curr) => {
      acc.temperature += curr.temperatureC;
      acc.activity += curr.activityIndex;
      acc.vibration += curr.vibrationCount;
      return acc;
    },
    { temperature: 0, activity: 0, vibration: 0 },
  );

  return {
    avgTemperature: Number((total.temperature / readings.length).toFixed(2)),
    avgActivity: Number((total.activity / readings.length).toFixed(3)),
    avgVibration: Number((total.vibration / readings.length).toFixed(2)),
  };
}

export function groupReadingsForChart(readings: ReadingLike[]): TimeSeriesPoint[] {
  return readings
    .map((reading) => ({
      timestamp: new Date(reading.timestamp).toISOString(),
      temperatureC: reading.temperatureC,
      activityIndex: reading.activityIndex,
      vibrationCount: reading.vibrationCount,
    }))
    .sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );
}
