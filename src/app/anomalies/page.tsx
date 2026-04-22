import { MainNav } from "@/components/dashboard/main-nav";
import { SeverityBadge } from "@/components/dashboard/severity-badge";
import { getAnomalyList } from "@/lib/services/data";

export const dynamic = "force-dynamic";

export default async function AnomaliesPage() {
  const anomalies = await getAnomalyList(100);
  const active = anomalies.filter((item) => !item.resolved);
  const history = anomalies.filter((item) => item.resolved);

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8">
      <h1 className="mb-2 text-2xl font-bold text-slate-900">Anomaly Events</h1>
      <p className="mb-6 text-slate-600">Active alerts and historical anomaly records.</p>
      <MainNav />

      <section className="mb-6 rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-4">
          <h2 className="text-lg font-semibold text-slate-900">Active Anomalies</h2>
        </div>
        <ul className="divide-y divide-slate-100">
          {active.map((event) => (
            <li key={String(event._id)} className="grid gap-2 p-4 md:grid-cols-4">
              <p className="text-sm font-medium text-slate-800">{event.cowId}</p>
              <SeverityBadge severity={event.severity} />
              <p className="text-sm text-slate-700">{event.message}</p>
              <p className="text-xs text-slate-500">
                {new Date(event.timestamp).toLocaleString()}
              </p>
            </li>
          ))}
          {active.length === 0 ? (
            <li className="p-4 text-sm text-slate-500">No active anomalies.</li>
          ) : null}
        </ul>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-4">
          <h2 className="text-lg font-semibold text-slate-900">Past Anomalies</h2>
        </div>
        <ul className="divide-y divide-slate-100">
          {history.map((event) => (
            <li key={String(event._id)} className="grid gap-2 p-4 md:grid-cols-4">
              <p className="text-sm font-medium text-slate-800">{event.cowId}</p>
              <SeverityBadge severity={event.severity} />
              <p className="text-sm text-slate-700">{event.message}</p>
              <p className="text-xs text-slate-500">
                {new Date(event.timestamp).toLocaleString()}
              </p>
            </li>
          ))}
          {history.length === 0 ? (
            <li className="p-4 text-sm text-slate-500">
              No resolved anomalies in history.
            </li>
          ) : null}
        </ul>
      </section>
    </main>
  );
}
