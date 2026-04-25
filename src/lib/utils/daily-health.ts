import type { DailyHealthStatus } from "@/types";

const READING_INTERVAL_SECONDS = 30;
const MINUTES_PER_READING = READING_INTERVAL_SECONDS / 60;

type DailyReading = {
  cowId: string;
  timestamp: Date | string;
  temperatureC: number;
  activityIndex: number;
  vibrationValue: number;
  vibrationCount: number;
  wifiRssi: number;
};

type DailyReportInput = {
  cowId: string;
  dateKey: string;
  date: Date;
  readings: DailyReading[];
};

function avg(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((sum, item) => sum + item, 0) / values.length;
}

function std(values: number[]) {
  if (values.length < 2) return 0;
  const mean = avg(values);
  const variance = avg(values.map((item) => (item - mean) ** 2));
  return Math.sqrt(variance);
}

function round(value: number, digits = 2) {
  return Number(value.toFixed(digits));
}

function minutesFromCount(count: number) {
  return round(count * MINUTES_PER_READING, 1);
}

function statusFromScore(score: number): DailyHealthStatus {
  if (score >= 80) return "good";
  if (score >= 60) return "watch";
  return "bad";
}

export function getDateKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export function getDateRangeFromKey(dateKey: string) {
  const start = new Date(`${dateKey}T00:00:00.000Z`);
  const end = new Date(`${dateKey}T23:59:59.999Z`);
  return { start, end };
}

export function buildDailyHealthReport({
  cowId,
  dateKey,
  date,
  readings,
}: DailyReportInput) {
  const totalReadings = readings.length;
  const expectedReadings = Math.round((24 * 60 * 60) / READING_INTERVAL_SECONDS);
  const dataCompletenessPct = round(
    Math.min((totalReadings / expectedReadings) * 100, 100),
    1,
  );

  const temps = readings.map((item) => item.temperatureC);
  const activities = readings.map((item) => item.activityIndex);
  const vibrationValues = readings.map((item) => item.vibrationValue);
  const vibrationCounts = readings.map((item) => item.vibrationCount);
  const wifiValues = readings.map((item) => item.wifiRssi);

  const elevatedTempCount = readings.filter(
    (item) => item.temperatureC >= 35.3,
  ).length;
  const highTempCount = readings.filter((item) => item.temperatureC >= 36).length;
  const lowActivityCount = readings.filter(
    (item) => item.activityIndex < 0.06,
  ).length;
  const activeCount = readings.filter((item) => item.activityIndex >= 0.12).length;
  const lowVibrationCount = readings.filter(
    (item) => item.vibrationValue <= 1,
  ).length;
  const weakWifiCount = readings.filter((item) => item.wifiRssi <= -70).length;

  let healthScore = 100;
  const recommendations: string[] = [];

  const highTempMinutes = minutesFromCount(highTempCount);
  const elevatedTempMinutes = minutesFromCount(elevatedTempCount);
  const lowActivityMinutes = minutesFromCount(lowActivityCount);
  const lowSignalMinutes = minutesFromCount(lowVibrationCount);
  const weakSignalMinutes = minutesFromCount(weakWifiCount);

  if (dataCompletenessPct < 40) {
    healthScore -= 15;
    recommendations.push("Data coverage is low; keep collar powered and connected.");
  }

  if (highTempMinutes >= 30) {
    healthScore -= 35;
    recommendations.push("High temperature persisted; inspect the cow physically.");
  } else if (elevatedTempMinutes >= 60) {
    healthScore -= 20;
    recommendations.push("Temperature was elevated for a long period; monitor closely.");
  }

  if (lowActivityMinutes >= 180) {
    healthScore -= 25;
    recommendations.push("Activity was low for several hours; check feeding and movement.");
  } else if (lowActivityMinutes >= 60) {
    healthScore -= 12;
    recommendations.push("Activity was lower than expected today.");
  }

  if (lowSignalMinutes >= 180) {
    healthScore -= 10;
    recommendations.push("Rumination/vibration signal was weak; check sensor placement.");
  }

  if (weakSignalMinutes >= 120) {
    healthScore -= 5;
    recommendations.push("WiFi signal was weak for long periods; check coverage.");
  }

  if (highTempMinutes >= 30 && lowActivityMinutes >= 60) {
    healthScore -= 15;
    recommendations.push(
      "Temperature and activity were both abnormal; prioritize this cow.",
    );
  }

  healthScore = Math.max(0, Math.min(100, Math.round(healthScore)));
  const dailyStatus = statusFromScore(healthScore);

  const summary =
    dailyStatus === "good"
      ? "Daily behavior and temperature trends look acceptable."
      : dailyStatus === "watch"
        ? "Some daily trends need attention, but this is not a confirmed illness."
        : "Multiple daily trends were abnormal; physical inspection is recommended.";

  return {
    cowId,
    dateKey,
    date,
    totalReadings,
    expectedReadings,
    dataCompletenessPct,
    temperature: {
      avgC: round(avg(temps), 2),
      minC: round(Math.min(...temps), 2),
      maxC: round(Math.max(...temps), 2),
      stdC: round(std(temps), 2),
      elevatedMinutes: elevatedTempMinutes,
      highMinutes: highTempMinutes,
    },
    activity: {
      avgIndex: round(avg(activities), 4),
      minIndex: round(Math.min(...activities), 4),
      maxIndex: round(Math.max(...activities), 4),
      stdIndex: round(std(activities), 4),
      lowActivityMinutes,
      activeMinutes: minutesFromCount(activeCount),
    },
    vibration: {
      avgValue: round(avg(vibrationValues), 2),
      avgCount: round(avg(vibrationCounts), 2),
      lowSignalMinutes,
      ruminationSignalScore: round(
        100 - Math.min((lowVibrationCount / Math.max(totalReadings, 1)) * 100, 100),
        1,
      ),
    },
    wifi: {
      avgRssi: round(avg(wifiValues), 1),
      weakSignalMinutes,
      qualityScore: round(
        100 - Math.min((weakWifiCount / Math.max(totalReadings, 1)) * 100, 100),
        1,
      ),
    },
    dailyStatus,
    healthScore,
    summary,
    recommendations:
      recommendations.length > 0
        ? recommendations
        : ["Continue normal monitoring and compare with future daily reports."],
    generatedBy: "daily-rule-analysis-v1",
  };
}
