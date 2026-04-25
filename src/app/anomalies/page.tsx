import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { SeverityBadge } from "@/components/dashboard/severity-badge";
import { getAnomalyList } from "@/lib/services/data";

export const dynamic = "force-dynamic";

export default async function AnomaliesPage() {
  const anomalies = await getAnomalyList(100);
  const active = anomalies.filter((item) => !item.resolved);
  const history = anomalies.filter((item) => item.resolved);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Anomaly Events</h1>
        <p className="mt-1 text-sm text-slate-500">
          Active alerts and historical anomaly records from all collars.
        </p>
      </div>

      {/* Summary chips */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 rounded-lg bg-rose-50 px-4 py-2.5 text-sm ring-1 ring-rose-200">
          <AlertTriangle className="h-4 w-4 text-rose-600" />
          <span className="font-medium text-rose-800">{active.length} active</span>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-2.5 text-sm ring-1 ring-emerald-200">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <span className="font-medium text-emerald-800">{history.length} resolved</span>
        </div>
      </div>

      {/* Active anomalies */}
      <section className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
          <span className="flex h-2 w-2">
            <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-rose-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500" />
          </span>
          <h2 className="font-semibold text-slate-900">Active Anomalies</h2>
        </div>
        <ul className="divide-y divide-slate-50">
          {active.map((event) => (
            <li
              key={String(event._id)}
              className={`flex flex-wrap items-start gap-4 px-5 py-4 hover:bg-slate-50 ${
                event.severity === "high"
                  ? "border-l-4 border-l-rose-400"
                  : event.severity === "medium"
                    ? "border-l-4 border-l-amber-400"
                    : "border-l-4 border-l-sky-400"
              }`}
            >
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100 font-bold text-slate-700 text-sm">
                {event.cowId.slice(-2)}
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-slate-900 text-sm">
                    {event.cowId}
                  </span>
                  <SeverityBadge severity={event.severity} />
                  <span className="text-xs text-slate-400">
                    {event.anomalyType.replace(/_/g, " ")}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-600">{event.message}</p>
              </div>
              <time className="flex-shrink-0 text-xs text-slate-400">
                {new Date(event.timestamp).toLocaleString()}
              </time>
            </li>
          ))}
          {active.length === 0 ? (
            <li className="flex flex-col items-center justify-center px-5 py-10 text-center">
              <CheckCircle2 className="mb-2 h-8 w-8 text-emerald-400" />
              <p className="text-sm font-medium text-slate-600">
                No active anomalies — all clear.
              </p>
            </li>
          ) : null}
        </ul>
      </section>

      {/* Resolved history */}
      <section className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="font-semibold text-slate-900">Resolved History</h2>
        </div>
        <ul className="divide-y divide-slate-50">
          {history.map((event) => (
            <li
              key={String(event._id)}
              className="flex flex-wrap items-start gap-4 px-5 py-4 opacity-70 hover:opacity-100"
            >
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100 text-sm font-bold text-slate-500">
                {event.cowId.slice(-2)}
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-slate-700 text-sm">
                    {event.cowId}
                  </span>
                  <SeverityBadge severity={event.severity} />
                </div>
                <p className="mt-1 text-sm text-slate-500">{event.message}</p>
              </div>
              <time className="flex-shrink-0 text-xs text-slate-400">
                {new Date(event.timestamp).toLocaleString()}
              </time>
            </li>
          ))}
          {history.length === 0 ? (
            <li className="px-5 py-8 text-center text-sm text-slate-400">
              No resolved anomaly history.
            </li>
          ) : null}
        </ul>
      </section>
    </div>
  );
}
