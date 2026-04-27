import { CalendarDays, ClipboardList, HeartPulse, Thermometer } from "lucide-react";
import { GenerateDailyReportsControl } from "@/components/daily-reports/generate-daily-reports-control";
import { DailyStatusBadge } from "@/components/dashboard/daily-status-badge";
import { getDailyHealthReports } from "@/lib/services/data";
import { getDateKey } from "@/lib/utils/daily-health";

export const dynamic = "force-dynamic";

type DailyReport = Awaited<ReturnType<typeof getDailyHealthReports>>[number];

function scoreColor(score: number) {
  if (score >= 80) return "text-emerald-700";
  if (score >= 60) return "text-amber-700";
  return "text-rose-700";
}

function latestByCow(reports: DailyReport[]) {
  const map = new Map<string, DailyReport>();
  for (const report of reports) {
    const existing = map.get(report.cowId);
    if (!existing || report.date > existing.date) {
      map.set(report.cowId, report);
    }
  }
  return Array.from(map.values());
}

export default async function DailyReportsPage() {
  const reports = await getDailyHealthReports({ limit: 100 });
  const latestReports = latestByCow(reports);
  const goodCount = latestReports.filter((item) => item.dailyStatus === "good").length;
  const watchCount = latestReports.filter((item) => item.dailyStatus === "watch").length;
  const badCount = latestReports.filter((item) => item.dailyStatus === "bad").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Daily Health Reports</h1>
          <p className="mt-1 text-sm text-slate-500">
            End-of-day analysis from all stored sensor readings. A single packet is
            treated as observation, not diagnosis.
          </p>
        </div>
        <div className="w-full min-w-0 max-w-md rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 lg:max-w-sm">
          <p className="text-xs font-medium text-slate-600">Build from readings</p>
          <p className="mt-0.5 text-xs text-slate-500">
            One row per cow for the selected UTC day, from measurements already in the
            database.
          </p>
          <div className="mt-3">
            <GenerateDailyReportsControl defaultDateKey={getDateKey()} />
          </div>
        </div>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Generated Reports",
            value: reports.length,
            icon: ClipboardList,
            color: "text-indigo-600",
            bg: "bg-indigo-100",
          },
          {
            label: "Good",
            value: goodCount,
            icon: HeartPulse,
            color: "text-emerald-600",
            bg: "bg-emerald-100",
          },
          {
            label: "Watch",
            value: watchCount,
            icon: CalendarDays,
            color: "text-amber-600",
            bg: "bg-amber-100",
          },
          {
            label: "Bad",
            value: badCount,
            icon: Thermometer,
            color: "text-rose-600",
            bg: "bg-rose-100",
          },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <article
              key={card.label}
              className="flex items-center gap-4 rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200"
            >
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl ${card.bg}`}
              >
                <Icon className={`h-5 w-5 ${card.color}`} />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {card.label}
                </p>
                <p className="mt-1 text-2xl font-bold text-slate-900">
                  {card.value}
                </p>
              </div>
            </article>
          );
        })}
      </section>

      <section className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="font-semibold text-slate-900">Report History</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Use the form above, or <code className="rounded bg-slate-100 px-1">POST /api/daily-reports</code>{" "}
            with a <code className="rounded bg-slate-100 px-1">date</code> (optional; defaults to today UTC).
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Cow</th>
                <th className="px-5 py-3">Daily Status</th>
                <th className="px-5 py-3">Health Score</th>
                <th className="px-5 py-3">Temperature</th>
                <th className="px-5 py-3">Activity</th>
                <th className="px-5 py-3">Summary</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {reports.map((report) => (
                <tr
                  key={String(report._id)}
                  className="transition-colors hover:bg-slate-50"
                >
                  <td className="px-5 py-3 font-medium text-slate-900">
                    {report.dateKey}
                  </td>
                  <td className="px-5 py-3 text-slate-700">{report.cowId}</td>
                  <td className="px-5 py-3">
                    <DailyStatusBadge status={report.dailyStatus} />
                  </td>
                  <td className={`px-5 py-3 font-bold ${scoreColor(report.healthScore)}`}>
                    {report.healthScore}/100
                  </td>
                  <td className="px-5 py-3 text-slate-600">
                    Avg {report.temperature.avgC}°C · Max{" "}
                    {report.temperature.maxC}°C
                  </td>
                  <td className="px-5 py-3 text-slate-600">
                    Avg {report.activity.avgIndex} · Low{" "}
                    {report.activity.lowActivityMinutes}m
                  </td>
                  <td className="max-w-sm px-5 py-3 text-slate-600">
                    {report.summary}
                  </td>
                </tr>
              ))}
              {reports.length === 0 ? (
                <tr>
                  <td className="px-5 py-12 text-center text-slate-400" colSpan={7}>
                    No daily reports yet. Ingest sensor data for a UTC day, then use{" "}
                    <strong>Generate report</strong> at the top of this page (or the API
                    call below).
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
