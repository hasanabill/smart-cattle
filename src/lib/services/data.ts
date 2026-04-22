import { API_DEFAULTS } from "@/lib/config/thresholds";
import { connectToDatabase } from "@/lib/db";
import { AnomalyEventModel, CowModel, SensorReadingModel } from "@/lib/models";
import { summarizeLatestHealth } from "@/lib/utils/anomaly";
import type { DashboardSummary } from "@/types";

export async function getDashboardSummary(): Promise<DashboardSummary> {
  await connectToDatabase();

  const [totalCows, healthyCows, warningCows, anomalyCows, latestReadingsCount, activeAnomalies] =
    await Promise.all([
      CowModel.countDocuments({}),
      CowModel.countDocuments({ status: "normal" }),
      CowModel.countDocuments({ status: "warning" }),
      CowModel.countDocuments({ status: "anomaly" }),
      SensorReadingModel.countDocuments({}),
      AnomalyEventModel.countDocuments({ resolved: false }),
    ]);

  return {
    totalCows,
    healthyCows,
    warningCows,
    anomalyCows,
    latestReadingsCount,
    activeAnomalies,
  };
}

export async function getRecentReadings(
  limit: number = API_DEFAULTS.recentReadingsLimit,
) {
  await connectToDatabase();
  return SensorReadingModel.find({})
    .sort({ timestamp: -1 })
    .limit(limit)
    .lean()
    .exec();
}

export async function getReadingsByCow(
  cowId: string,
  limit: number = API_DEFAULTS.chartPointsLimit,
) {
  await connectToDatabase();
  return SensorReadingModel.find({ cowId })
    .sort({ timestamp: -1 })
    .limit(limit)
    .lean()
    .exec();
}

export async function getCowList() {
  await connectToDatabase();
  return CowModel.find({}).sort({ cowId: 1 }).lean().exec();
}

export async function getCowDetails(cowId: string) {
  await connectToDatabase();
  const [cow, latestReading, recentReadings, anomalies] = await Promise.all([
    CowModel.findOne({ cowId }).lean().exec(),
    SensorReadingModel.findOne({ cowId }).sort({ timestamp: -1 }).lean().exec(),
    SensorReadingModel.find({ cowId }).sort({ timestamp: -1 }).limit(50).lean().exec(),
    AnomalyEventModel.find({ cowId }).sort({ timestamp: -1 }).limit(30).lean().exec(),
  ]);

  const summary = summarizeLatestHealth(recentReadings);
  return { cow, latestReading, recentReadings, anomalies, summary };
}

export async function getAnomalyList(limit = 100) {
  await connectToDatabase();
  return AnomalyEventModel.find({})
    .sort({ timestamp: -1 })
    .limit(limit)
    .lean()
    .exec();
}
