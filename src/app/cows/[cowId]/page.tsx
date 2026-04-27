import Link from "next/link";
import {
  ArrowLeft,
  Activity,
  Thermometer,
  Vibrate,
  BarChart3,
} from "lucide-react";
import { HealthCharts } from "@/components/dashboard/health-charts";
import { SeverityBadge } from "@/components/dashboard/severity-badge";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { getCowDetails } from "@/lib/services/data";
import { groupReadingsForChart } from "@/lib/utils/anomaly";

export const dynamic = "force-dynamic";

type Params = {
  params: Promise<{ cowId: string }>;
};

export default async function CowDetailPage({ params }: Params) {
  const { cowId } = await params;
  const { cow, latestReading, recentReadings, anomalies, summary } =
    await getCowDetails(cowId);

  if (!cow) {
    return (
      <div className="space-y-4">
        <Link
          href="/cows"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" /> Back to cows
        </Link>
        <div className="rounded-xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
          <p className="text-slate-600">
            Cow <span className="font-semibold">{cowId}</span> was not found.
          </p>
        </div>
      </div>
    );
  }

  const chartPoints = groupReadingsForChart(recentReadings);

  const statCards = [
    {
      label: "Latest Temperature",
      value: latestReading
        ? `${latestReading.temperatureC.toFixed(2)} °C`
        : "—",
      icon: Thermometer,
      iconBg: "bg-rose-100",
      iconColor: "text-rose-600",
    },
    {
      label: "Latest Activity",
      value: latestReading ? latestReading.activityIndex.toFixed(4) : "—",
      icon: Activity,
      iconBg: "bg-indigo-100",
      iconColor: "text-indigo-600",
    },
    {
      label: "Vibration Value",
      value: latestReading ? String(latestReading.vibrationValue) : "—",
      icon: Vibrate,
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-600",
    },
    {
      label: "Avg Temperature",
      value: `${summary.avgTemperature} °C`,
      icon: BarChart3,
      iconBg: "bg-amber-100",
      iconColor: "text-amber-600",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Back + header */}
      <div>
        <Link
          href="/cows"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" /> Back to cows
        </Link>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{cow.name}</h1>
            <p className="mt-0.5 text-sm text-slate-500">
              Collar ID: {cow.cowId}
              {cow.breed ? ` · ${cow.breed}` : ""}
              {cow.age != null ? ` · Age ${cow.age}` : ""}
            </p>
          </div>
          <StatusBadge status={cow.status} />
        </div>
      </div>

      {/* Stat cards */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <article
              key={card.label}
              className="flex items-center gap-4 rounded-xl bg-white px-5 py-4 shadow-sm ring-1 ring-slate-200"
            >
              <div
                className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${card.iconBg}`}
              >
                <Icon className={`h-5 w-5 ${card.iconColor}`} />
              </div>
              <div>
                <p className="text-xs text-slate-500">{card.label}</p>
                <p className="mt-0.5 text-lg font-bold text-slate-900">
                  {card.value}
                </p>
              </div>
            </article>
          );
        })}
      </section>

      {/* Charts */}
      <HealthCharts points={chartPoints} />

      {/* Anomaly history */}
      <section className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="font-semibold text-slate-900">Anomaly History</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            All anomaly events detected for this collar
          </p>
        </div>
        <ul className="divide-y divide-slate-50">
          {anomalies.map((event) => (
            <li
              key={String(event._id)}
              className={`flex items-start gap-4 px-5 py-4 transition-colors hover:bg-slate-50 ${
                event.severity === "high"
                  ? "border-l-4 border-l-rose-400"
                  : event.severity === "medium"
                  ? "border-l-4 border-l-amber-400"
                  : "border-l-4 border-l-sky-400"
              }`}
            >
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <SeverityBadge severity={event.severity} />
                  <span className="text-xs text-slate-400">
                    {event.anomalyType.replace(/_/g, " ")}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-700">{event.message}</p>
              </div>
              <time className="flex-shrink-0 text-xs text-slate-400">
                {new Date(event.timestamp).toLocaleString()}
              </time>
            </li>
          ))}
          {anomalies.length === 0 ? (
            <li className="px-5 py-10 text-center text-sm text-slate-400">
              No anomalies recorded for this cow.
            </li>
          ) : null}
        </ul>
      </section>
    </div>
  );
}
