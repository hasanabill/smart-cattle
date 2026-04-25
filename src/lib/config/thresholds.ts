export const HEALTH_THRESHOLDS = {
  temperature: {
    warningHighC: 32.5,
    anomalyHighC: 33.2,
  },
  activity: {
    warningLow: 0.01,
    anomalyLow: 0.004,
    inactivityWindowReadings: 5,
  },
  vibration: {
    warningLowCount: 2,
    anomalyLowCount: 0,
  },
} as const;

export const API_DEFAULTS = {
  recentReadingsLimit: 30,
  chartPointsLimit: 100,
} as const;
