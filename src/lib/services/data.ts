import { API_DEFAULTS } from "@/lib/config/thresholds";
import { connectToDatabase } from "@/lib/db";
import {
  AnomalyEventModel,
  CowModel,
  DailyHealthReportModel,
  MLReportModel,
  SensorReadingModel,
} from "@/lib/models";
import { summarizeLatestHealth } from "@/lib/utils/anomaly";
import {
  buildDailyHealthReport,
  getDateKey,
  getDateRangeFromKey,
} from "@/lib/utils/daily-health";
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

export async function getMLReports(limit = 20) {
  await connectToDatabase();
  return MLReportModel.find({})
    .sort({ trainingCompletedAt: -1 })
    .limit(limit)
    .lean()
    .exec();
}

export async function getDailyHealthReports({
  cowId,
  dateKey,
  limit = 50,
}: {
  cowId?: string;
  dateKey?: string;
  limit?: number;
} = {}) {
  await connectToDatabase();
  const filter: Record<string, string> = {};
  if (cowId) filter.cowId = cowId;
  if (dateKey) filter.dateKey = dateKey;

  return DailyHealthReportModel.find(filter)
    .sort({ date: -1, cowId: 1 })
    .limit(limit)
    .lean()
    .exec();
}

export async function generateDailyHealthReports(dateKey = getDateKey()) {
  await connectToDatabase();
  const { start, end } = getDateRangeFromKey(dateKey);

  const cowIds = await SensorReadingModel.distinct("cowId", {
    timestamp: { $gte: start, $lte: end },
  });

  const generatedReports = [];

  for (const cowId of cowIds) {
    const readings = await SensorReadingModel.find({
      cowId,
      timestamp: { $gte: start, $lte: end },
    })
      .sort({ timestamp: 1 })
      .lean()
      .exec();

    if (readings.length === 0) continue;

    const report = buildDailyHealthReport({
      cowId,
      dateKey,
      date: start,
      readings,
    });

    const savedReport = await DailyHealthReportModel.findOneAndUpdate(
      { cowId, dateKey },
      { $set: report },
      { upsert: true, new: true },
    )
      .lean()
      .exec();

    generatedReports.push(savedReport);
  }

  return generatedReports;
}
