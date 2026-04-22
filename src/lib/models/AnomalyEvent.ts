import { Schema, model, models, Types, type InferSchemaType } from "mongoose";

const AnomalyEventSchema = new Schema(
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
    anomalyType: {
      type: String,
      required: true,
      enum: [
        "high_temperature",
        "low_activity",
        "low_vibration",
        "multi_signal_anomaly",
      ],
    },
    severity: {
      type: String,
      required: true,
      enum: ["low", "medium", "high"],
      index: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    relatedReadingId: {
      type: Types.ObjectId,
      required: true,
      index: true,
      ref: "SensorReading",
    },
    resolved: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
  },
);

AnomalyEventSchema.index({ cowId: 1, timestamp: -1 });

export type AnomalyEventDocument = InferSchemaType<typeof AnomalyEventSchema>;

export const AnomalyEventModel =
  models.AnomalyEvent || model("AnomalyEvent", AnomalyEventSchema);
