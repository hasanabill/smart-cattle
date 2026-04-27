"use client";

import {
  Area,
  AreaChart,
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

function TimeAxis(value: string) {
  return new Date(value).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function TooltipLabel(value: unknown) {
  return new Date(String(value)).toLocaleString();
}

function TooltipFormat(value: unknown) {
  return typeof value === "number" ? value.toFixed(3) : String(value ?? "");
}

const tooltipStyle = {
  backgroundColor: "#0f172a",
  border: "none",
  borderRadius: "8px",
  color: "#f8fafc",
  fontSize: "12px",
};

const axisStyle = { fontSize: 11, fill: "#94a3b8" };

export function HealthCharts({ points }: Props) {
  if (points.length === 0) {
    return (
      <section className="flex h-48 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
        <p className="text-sm text-slate-400">No chart data available yet.</p>
      </section>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* Temperature area chart */}
      <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Body Temperature
            </h3>
            <p className="text-xs text-slate-500">°C over time</p>
          </div>
          <span className="h-2 w-2 rounded-full bg-rose-500" />
        </div>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={points}>
              <defs>
                <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="timestamp"
                tickFormatter={TimeAxis}
                tick={axisStyle}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={axisStyle}
                axisLine={false}
                tickLine={false}
                domain={["auto", "auto"]}
              />
              <Tooltip
                labelFormatter={TooltipLabel}
                formatter={TooltipFormat}
                contentStyle={tooltipStyle}
                labelStyle={{ color: "#94a3b8" }}
              />
              <Area
                type="monotone"
                dataKey="temperatureC"
                name="Temp (°C)"
                stroke="#f43f5e"
                strokeWidth={2}
                fill="url(#tempGrad)"
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Activity + Vibration line chart */}
      <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Activity & Vibration
            </h3>
            <p className="text-xs text-slate-500">Behavior signals over time</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-indigo-500" />
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
          </div>
        </div>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={points}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="timestamp"
                tickFormatter={TimeAxis}
                tick={axisStyle}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={axisStyle}
                axisLine={false}
                tickLine={false}
                domain={["auto", "auto"]}
              />
              <Tooltip
                labelFormatter={TooltipLabel}
                formatter={TooltipFormat}
                contentStyle={tooltipStyle}
                labelStyle={{ color: "#94a3b8" }}
              />
              <Legend
                wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                iconType="circle"
                iconSize={8}
              />
              <Line
                type="monotone"
                dataKey="activityIndex"
                name="Activity"
                stroke="#6366f1"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
              <Line
                type="monotone"
                dataKey="vibrationValue"
                name="Vibration"
                stroke="#10b981"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
