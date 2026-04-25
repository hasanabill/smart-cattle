import { MainNav } from "@/components/dashboard/main-nav";
import { getMLReports } from "@/lib/services/data";

export const dynamic = "force-dynamic";

type FeatureImportance = {
  feature: string;
  importance: number;
};

type PerClassMetric = {
  label: string;
  precision: number;
  recall: number;
  f1Score: number;
  support: number;
};

function formatPercent(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

export default async function MLReportsPage() {
  const reports = await getMLReports(20);
  const latestReport = reports[0];

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8">
      <h1 className="mb-2 text-2xl font-bold text-slate-900">
        Machine Learning Reports
      </h1>
      <p className="mb-6 text-slate-600">
        Local Random Forest training summaries written to MongoDB by your laptop.
      </p>
      <MainNav />

      {latestReport ? (
        <section className="mb-6 grid gap-4 md:grid-cols-4">
          <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">Latest Accuracy</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {formatPercent(latestReport.metrics.accuracy)}
            </p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">Macro F1</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {formatPercent(latestReport.metrics.macroF1)}
            </p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">Training Rows</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {latestReport.dataset.trainingRows}
            </p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">Test Rows</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {latestReport.dataset.testRows}
            </p>
          </article>
        </section>
      ) : null}

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-4">
          <h2 className="text-lg font-semibold text-slate-900">Report History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-600">
              <tr>
                <th className="px-4 py-3 font-semibold">Completed</th>
                <th className="px-4 py-3 font-semibold">Model</th>
                <th className="px-4 py-3 font-semibold">Rows</th>
                <th className="px-4 py-3 font-semibold">Accuracy</th>
                <th className="px-4 py-3 font-semibold">Macro F1</th>
                <th className="px-4 py-3 font-semibold">Top Features</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr key={String(report._id)} className="border-t border-slate-100">
                  <td className="px-4 py-3 text-slate-700">
                    {new Date(report.trainingCompletedAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    <span className="font-medium text-slate-900">
                      {report.modelName}
                    </span>
                    <span className="block text-xs text-slate-500">
                      {report.modelVersion}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {report.dataset.totalReadings}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {formatPercent(report.metrics.accuracy)}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {formatPercent(report.metrics.macroF1)}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {report.featureImportances
                      .slice(0, 3)
                      .map((item: FeatureImportance) => item.feature)
                      .join(", ") || "-"}
                  </td>
                </tr>
              ))}
              {reports.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-slate-500" colSpan={6}>
                    No ML reports yet. Run the local Python report script after
                    collecting sensor data.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      {latestReport ? (
        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-lg font-semibold text-slate-900">
              Per-Class Metrics
            </h2>
            <div className="space-y-3">
              {latestReport.metrics.perClass.map((metric: PerClassMetric) => (
                <div key={metric.label} className="rounded-lg bg-slate-50 p-3">
                  <p className="font-medium capitalize text-slate-900">
                    {metric.label}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    Precision {formatPercent(metric.precision)} | Recall{" "}
                    {formatPercent(metric.recall)} | F1{" "}
                    {formatPercent(metric.f1Score)} | Support {metric.support}
                  </p>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-lg font-semibold text-slate-900">
              Feature Importance
            </h2>
            <div className="space-y-3">
              {latestReport.featureImportances.slice(0, 8).map((item: FeatureImportance) => (
                <div key={item.feature}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="font-medium text-slate-700">
                      {item.feature}
                    </span>
                    <span className="text-slate-500">
                      {formatPercent(item.importance)}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div
                      className="h-2 rounded-full bg-emerald-600"
                      style={{ width: `${Math.min(item.importance * 100, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </article>
        </section>
      ) : null}
    </main>
  );
}
