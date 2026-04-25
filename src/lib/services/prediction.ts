import { detectAnomaly } from "@/lib/utils/anomaly";

type PredictionSource = "rule_based" | "python_service" | "onnx";

export interface PredictionResult {
  label: "normal" | "warning" | "anomaly";
  riskScore: number;
  source: PredictionSource;
  modelVersion: string;
}

type ReadingForPrediction = {
  temperatureC: number;
  activityIndex: number;
  vibrationValue?: number;
  vibrationCount: number;
  timestamp: Date | string;
};

export async function predictHealthRisk(
  reading: ReadingForPrediction,
): Promise<PredictionResult> {
  // Placeholder for future integration:
  // Option A: call Python model service with fetch/HTTP.
  // Option B: run ONNX Runtime inference in-process.
  const anomalies = detectAnomaly(reading);
  const hasHigh = anomalies.some((item) => item.severity === "high");

  if (hasHigh) {
    return {
      label: "anomaly",
      riskScore: 0.9,
      source: "rule_based",
      modelVersion: "v0-rule",
    };
  }

  if (anomalies.length > 0) {
    return {
      label: "warning",
      riskScore: 0.6,
      source: "rule_based",
      modelVersion: "v0-rule",
    };
  }

  return {
    label: "normal",
    riskScore: 0.2,
    source: "rule_based",
    modelVersion: "v0-rule",
  };
}
