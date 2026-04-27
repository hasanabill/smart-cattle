export const HEALTH_THRESHOLDS = {
  temperature: {
    warningHighC: 35.3,
    anomalyHighC: 36.0,
  },
  activity: {
    warningLow: 0.06,
    anomalyLow: 0.03,
    inactivityWindowReadings: 5,
  },
  vibration: {
    warningLowValue: 1,
  },
} as const;

export const API_DEFAULTS = {
  recentReadingsLimit: 30,
  chartPointsLimit: 100,
} as const;
