import Link from "next/link";
import { HealthCharts } from "@/components/dashboard/health-charts";
import { MainNav } from "@/components/dashboard/main-nav";
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
      <main className="mx-auto w-full max-w-5xl px-4 py-8 md:px-8">
        <MainNav />
        <p className="rounded-lg border border-slate-200 bg-white p-6 text-slate-700">
          Cow <span className="font-semibold">{cowId}</span> was not found.
        </p>
      </main>
    );
  }

  const chartPoints = groupReadingsForChart(recentReadings);

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{cow.name}</h1>
          <p className="text-slate-600">Cow ID: {cow.cowId}</p>
        </div>
        <StatusBadge status={cow.status} />
      </div>

      <MainNav />

      <section className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Latest Temperature</p>
          <p className="mt-2 text-xl font-semibold text-slate-900">
            {latestReading ? `${latestReading.temperatureC.toFixed(2)} C` : "-"}
          </p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Latest Activity</p>
          <p className="mt-2 text-xl font-semibold text-slate-900">
            {latestReading ? latestReading.activityIndex.toFixed(3) : "-"}
          </p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Latest Vibration Count</p>
          <p className="mt-2 text-xl font-semibold text-slate-900">
            {latestReading ? latestReading.vibrationCount : "-"}
          </p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Avg Health Snapshot</p>
          <p className="mt-2 text-sm text-slate-700">
            Temp: {summary.avgTemperature} C | Activity: {summary.avgActivity} |
            Vibration: {summary.avgVibration}
          </p>
        </article>
      </section>

      <div className="mb-6">
        <HealthCharts points={chartPoints} />
      </div>

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-4">
          <h2 className="text-lg font-semibold text-slate-900">Anomaly History</h2>
        </div>
        <ul className="divide-y divide-slate-100">
          {anomalies.map((event) => (
            <li key={String(event._id)} className="flex items-center gap-3 p-4">
              <SeverityBadge severity={event.severity} />
              <span className="text-sm text-slate-700">{event.message}</span>
              <span className="ml-auto text-xs text-slate-500">
                {new Date(event.timestamp).toLocaleString()}
              </span>
            </li>
          ))}
          {anomalies.length === 0 ? (
            <li className="p-4 text-sm text-slate-500">No anomalies recorded.</li>
          ) : null}
        </ul>
      </section>

      <div className="mt-4">
        <Link href="/cows" className="text-sm font-medium text-blue-700 hover:underline">
          Back to cow list
        </Link>
      </div>
    </main>
  );
}
