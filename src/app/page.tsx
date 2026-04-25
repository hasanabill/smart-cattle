import { Database, Radio, Wifi } from "lucide-react";
import { OverviewCards } from "@/components/dashboard/overview-cards";
import { RecentReadingsTable } from "@/components/dashboard/recent-readings-table";
import { getDashboardSummary, getRecentReadings } from "@/lib/services/data";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [summary, recentReadings] = await Promise.all([
    getDashboardSummary(),
    getRecentReadings(20),
  ]);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">
          Real-time cattle health monitoring from wearable IoT collars.
        </p>
      </div>

      {/* System info bar */}
      <div className="flex flex-wrap gap-3">
        {[
          { icon: Radio, label: "Collar node", value: "ESP8266 active" },
          {
            icon: Wifi,
            label: "Ingest endpoint",
            value: "POST /api/sensor-data",
          },
          {
            icon: Database,
            label: "Total readings",
            value: String(summary.latestReadingsCount),
          },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className="flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm shadow-sm ring-1 ring-slate-200"
            >
              <Icon className="h-4 w-4 text-emerald-600" />
              <span className="text-slate-500">{item.label}:</span>
              <span className="font-medium text-slate-900">{item.value}</span>
            </div>
          );
        })}
      </div>

      {/* Stat cards */}
      <OverviewCards summary={summary} />

      {/* Active anomalies count banner */}
      {summary.activeAnomalies > 0 ? (
        <div className="flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 px-5 py-3.5">
          <span className="flex h-2 w-2">
            <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-rose-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500" />
          </span>
          <p className="text-sm font-medium text-rose-800">
            {summary.activeAnomalies} active anomal
            {summary.activeAnomalies === 1 ? "y" : "ies"} detected.{" "}
            <a href="/anomalies" className="underline hover:no-underline">
              View anomalies →
            </a>
          </p>
        </div>
      ) : null}

      {/* Readings table */}
      <RecentReadingsTable
        rows={recentReadings.map((item) => ({
          ...item,
          _id: String(item._id),
        }))}
      />
    </div>
  );
}
