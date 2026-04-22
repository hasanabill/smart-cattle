"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TimeSeriesPoint } from "@/types";

type Props = {
  points: TimeSeriesPoint[];
};

export function HealthCharts({ points }: Props) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900">Health Trend</h3>
      <div className="mt-4 h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="timestamp"
              tickFormatter={(value) =>
                new Date(value).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              }
            />
            <YAxis />
            <Tooltip
              labelFormatter={(value) => new Date(value).toLocaleString()}
              formatter={(value) =>
                typeof value === "number" ? value.toFixed(2) : String(value ?? "")
              }
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="temperatureC"
              stroke="#e11d48"
              name="Temperature (C)"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="activityIndex"
              stroke="#2563eb"
              name="Activity"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="vibrationCount"
              stroke="#16a34a"
              name="Vibration Count"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
