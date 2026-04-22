export const HEALTH_THRESHOLDS = {
  temperature: {
    warningHighC: 32.5,
    anomalyHighC: 33.5,
  },
  activity: {
    warningLow: 0.25,
    anomalyLow: 0.15,
    inactivityWindowReadings: 5,
  },
  vibration: {
    warningLowCount: 4,
    anomalyLowCount: 2,
  },
} as const;

export const API_DEFAULTS = {
  recentReadingsLimit: 30,
  chartPointsLimit: 100,
} as const;
