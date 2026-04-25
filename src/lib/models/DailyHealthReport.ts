import { Schema, model, models, type InferSchemaType } from "mongoose";

const DailyHealthReportSchema = new Schema(
  {
    cowId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    dateKey: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    totalReadings: {
      type: Number,
      required: true,
      min: 0,
    },
    expectedReadings: {
      type: Number,
      required: true,
      min: 0,
    },
    dataCompletenessPct: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    temperature: {
      avgC: Number,
      minC: Number,
      maxC: Number,
      stdC: Number,
      elevatedMinutes: Number,
      highMinutes: Number,
    },
    activity: {
      avgIndex: Number,
      minIndex: Number,
      maxIndex: Number,
      stdIndex: Number,
      lowActivityMinutes: Number,
      activeMinutes: Number,
    },
    vibration: {
      avgValue: Number,
      avgCount: Number,
      lowSignalMinutes: Number,
      ruminationSignalScore: Number,
    },
    wifi: {
      avgRssi: Number,
      weakSignalMinutes: Number,
      qualityScore: Number,
    },
    dailyStatus: {
      type: String,
      enum: ["good", "watch", "bad"],
      required: true,
      index: true,
    },
    healthScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    summary: {
      type: String,
      required: true,
      trim: true,
    },
    recommendations: {
      type: [String],
      default: [],
    },
    generatedBy: {
      type: String,
      default: "daily-rule-analysis-v1",
      trim: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

DailyHealthReportSchema.index({ cowId: 1, dateKey: 1 }, { unique: true });

export type DailyHealthReportDocument = InferSchemaType<
  typeof DailyHealthReportSchema
>;

export const DailyHealthReportModel =
  models.DailyHealthReport ||
  model("DailyHealthReport", DailyHealthReportSchema);
