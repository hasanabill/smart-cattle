import { Schema, model, models, type InferSchemaType } from "mongoose";

const CowSchema = new Schema(
  {
    cowId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    age: {
      type: Number,
      min: 0,
      default: null,
    },
    breed: {
      type: String,
      trim: true,
      default: null,
    },
    status: {
      type: String,
      enum: ["normal", "warning", "anomaly"],
      default: "normal",
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export type CowDocument = InferSchemaType<typeof CowSchema>;

export const CowModel = models.Cow || model("Cow", CowSchema);
