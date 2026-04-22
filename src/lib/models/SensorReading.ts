import { Schema, model, models, Types, type InferSchemaType } from "mongoose";

const SensorReadingSchema = new Schema(
  {
    cowId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    timestamp: {
      type: Date,
      required: true,
      index: true,
    },
    temperatureC: {
      type: Number,
      required: true,
    },
    activityIndex: {
      type: Number,
      required: true,
    },
    vibrationValue: {
      type: Number,
      required: true,
    },
    vibrationCount: {
      type: Number,
      required: true,
    },
    wifiRssi: {
      type: Number,
      required: true,
    },
    rawAccelX: {
      type: Number,
      required: true,
    },
    rawAccelY: {
      type: Number,
      required: true,
    },
    rawAccelZ: {
      type: Number,
      required: true,
    },
    rawGyroX: {
      type: Number,
      required: true,
    },
    rawGyroY: {
      type: Number,
      required: true,
    },
    rawGyroZ: {
      type: Number,
      required: true,
    },
    derivedStatus: {
      type: String,
      enum: ["normal", "warning", "anomaly"],
      default: "normal",
      index: true,
    },
    processingNotes: {
      type: [String],
      default: [],
    },
    prediction: {
      label: {
        type: String,
        default: "rule_based",
      },
      riskScore: {
        type: Number,
        default: 0,
      },
      source: {
        type: String,
        enum: ["rule_based", "python_service", "onnx"],
        default: "rule_based",
      },
      modelVersion: {
        type: String,
        default: "v0-rule",
      },
    },
    anomalyEventIds: {
      type: [Types.ObjectId],
      default: [],
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
  },
);

SensorReadingSchema.index({ cowId: 1, timestamp: -1 });

export type SensorReadingDocument = InferSchemaType<typeof SensorReadingSchema>;

export const SensorReadingModel =
  models.SensorReading || model("SensorReading", SensorReadingSchema);
