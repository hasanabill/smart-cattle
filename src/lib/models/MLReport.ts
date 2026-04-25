import { Schema, model, models, type InferSchemaType } from "mongoose";

const MLReportSchema = new Schema(
  {
    reportId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    modelName: {
      type: String,
      required: true,
      default: "Random Forest",
      trim: true,
    },
    modelVersion: {
      type: String,
      required: true,
      default: "local-rf-v1",
      trim: true,
    },
    status: {
      type: String,
      enum: ["completed", "failed"],
      default: "completed",
      index: true,
    },
    trainingStartedAt: {
      type: Date,
      required: true,
    },
    trainingCompletedAt: {
      type: Date,
      required: true,
    },
    dataset: {
      totalReadings: {
        type: Number,
        required: true,
        min: 0,
      },
      trainingRows: {
        type: Number,
        required: true,
        min: 0,
      },
      testRows: {
        type: Number,
        required: true,
        min: 0,
      },
      cowCount: {
        type: Number,
        required: true,
        min: 0,
      },
      dateFrom: {
        type: Date,
        default: null,
      },
      dateTo: {
        type: Date,
        default: null,
      },
      labelSource: {
        type: String,
        required: true,
        default: "rule_based_derived_status",
        trim: true,
      },
    },
    metrics: {
      accuracy: {
        type: Number,
        required: true,
        min: 0,
        max: 1,
      },
      macroF1: {
        type: Number,
        required: true,
        min: 0,
        max: 1,
      },
      weightedF1: {
        type: Number,
        required: true,
        min: 0,
        max: 1,
      },
      perClass: {
        type: [
          {
            label: String,
            precision: Number,
            recall: Number,
            f1Score: Number,
            support: Number,
          },
        ],
        default: [],
      },
      confusionMatrix: {
        labels: {
          type: [String],
          default: [],
        },
        matrix: {
          type: [[Number]],
          default: [],
        },
      },
    },
    featureImportances: {
      type: [
        {
          feature: String,
          importance: Number,
        },
      ],
      default: [],
    },
    notes: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export type MLReportDocument = InferSchemaType<typeof MLReportSchema>;

export const MLReportModel =
  models.MLReport || model("MLReport", MLReportSchema);
