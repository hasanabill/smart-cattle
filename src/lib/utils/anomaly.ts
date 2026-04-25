import { HEALTH_THRESHOLDS } from "@/lib/config/thresholds";
import type { ComputedAnomaly, CowStatus, TimeSeriesPoint } from "@/types";

type ReadingLike = {
  timestamp: Date | string;
  temperatureC: number;
  activityIndex: number;
  vibrationValue?: number;
  vibrationCount: number;
};

export function detectAnomaly(reading: ReadingLike): ComputedAnomaly[] {
  const events: ComputedAnomaly[] = [];

  if (reading.temperatureC >= HEALTH_THRESHOLDS.temperature.anomalyHighC) {
    events.push({
      anomalyType: "high_temperature",
      severity: "high",
      message: "Skin temperature is above the device anomaly baseline.",
    });
  } else if (reading.temperatureC >= HEALTH_THRESHOLDS.temperature.warningHighC) {
    events.push({
      anomalyType: "high_temperature",
      severity: "medium",
      message: "Skin temperature is elevated; monitor the trend.",
    });
  }

  if (reading.activityIndex <= HEALTH_THRESHOLDS.activity.anomalyLow) {
    events.push({
      anomalyType: "low_activity",
      severity: "medium",
      message: "Activity is very low for this sampling window.",
    });
  } else if (reading.activityIndex <= HEALTH_THRESHOLDS.activity.warningLow) {
    events.push({
      anomalyType: "low_activity",
      severity: "low",
      message: "Activity level is lower than the collar baseline.",
    });
  }

  const hasWeakRawVibration =
    typeof reading.vibrationValue === "number" &&
    reading.vibrationValue <= HEALTH_THRESHOLDS.vibration.warningLowValue;
  const hasNoVibrationCount =
    typeof reading.vibrationValue !== "number" &&
    reading.vibrationCount <= HEALTH_THRESHOLDS.vibration.warningLowCount;

  if (hasWeakRawVibration || hasNoVibrationCount) {
    events.push({
      anomalyType: "low_vibration",
      severity: "low",
      message: "Raw vibration signal is weak; check rumination trend and sensor contact.",
    });
  }

  const highRiskSignals = events.filter((event) => event.severity !== "low");
  const hasTemperatureSignal = events.some(
    (event) => event.anomalyType === "high_temperature",
  );
  const hasRuminationSignal = events.some(
    (event) => event.anomalyType === "low_vibration",
  );
  const hasActivitySignal = events.some(
    (event) => event.anomalyType === "low_activity",
  );

  if (
    highRiskSignals.length >= 2 ||
    (hasTemperatureSignal && (hasRuminationSignal || hasActivitySignal))
  ) {
    events.push({
      anomalyType: "multi_signal_anomaly",
      severity: "high",
      message:
        "Temperature and behavior signals are abnormal in the same interval.",
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
