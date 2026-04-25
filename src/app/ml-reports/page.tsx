import { BrainCircuit, FlaskConical, Target, Database } from "lucide-react";
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

function pct(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

const classColors: Record<string, string> = {
  normal: "bg-emerald-500",
  warning: "bg-amber-500",
  anomaly: "bg-rose-500",
};

const classBg: Record<string, string> = {
  normal: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  warning: "bg-amber-50 text-amber-800 ring-amber-200",
  anomaly: "bg-rose-50 text-rose-800 ring-rose-200",
};

export default async function MLReportsPage() {
  const reports = await getMLReports(20);
  const latest = reports[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">ML Reports</h1>
        <p className="mt-1 text-sm text-slate-500">
          Random Forest training results from your local Python script.
        </p>
      </div>

      {/* Latest metric cards */}
      {latest ? (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: "Accuracy",
              value: pct(latest.metrics.accuracy),
              icon: Target,
              iconBg: "bg-indigo-100",
              iconColor: "text-indigo-600",
              accent: "border-l-indigo-500",
            },
            {
              label: "Macro F1",
              value: pct(latest.metrics.macroF1),
              icon: BrainCircuit,
              iconBg: "bg-emerald-100",
              iconColor: "text-emerald-600",
              accent: "border-l-emerald-500",
            },
            {
              label: "Training Rows",
              value: latest.dataset.trainingRows.toLocaleString(),
              icon: Database,
              iconBg: "bg-amber-100",
              iconColor: "text-amber-600",
              accent: "border-l-amber-500",
            },
            {
              label: "Test Rows",
              value: latest.dataset.testRows.toLocaleString(),
              icon: FlaskConical,
              iconBg: "bg-sky-100",
              iconColor: "text-sky-600",
              accent: "border-l-sky-500",
            },
          ].map((card) => {
            const Icon = card.icon;
            return (
              <article
                key={card.label}
                className={`relative overflow-hidden rounded-xl border-l-4 bg-white px-5 py-4 shadow-sm ${card.accent}`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {card.label}
                    </p>
                    <p className="mt-2 text-3xl font-bold text-slate-900">
                      {card.value}
                    </p>
                  </div>
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl ${card.iconBg}`}
                  >
                    <Icon className={`h-5 w-5 ${card.iconColor}`} />
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      ) : null}

      {/* Per-class + Feature importance */}
      {latest ? (
        <section className="grid gap-6 lg:grid-cols-2">
          {/* Per-class metrics */}
          <article className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <h2 className="mb-4 font-semibold text-slate-900">
              Per-Class Metrics
            </h2>
            <div className="space-y-4">
              {latest.metrics.perClass.map((metric: PerClassMetric) => {
                const colorBar = classColors[metric.label] ?? "bg-slate-400";
                const colorBg = classBg[metric.label] ?? "bg-slate-50 text-slate-800 ring-slate-200";
                return (
                  <div key={metric.label}>
                    <div className="mb-2 flex items-center gap-2">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ring-1 ${colorBg}`}
                      >
                        {metric.label}
                      </span>
                      <span className="text-xs text-slate-400">
                        {metric.support} samples
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: "Precision", val: metric.precision },
                        { label: "Recall", val: metric.recall },
                        { label: "F1", val: metric.f1Score },
                      ].map((m) => (
                        <div key={m.label} className="rounded-lg bg-slate-50 p-2 text-center">
                          <p className="text-xs text-slate-500">{m.label}</p>
                          <p className="mt-1 text-sm font-bold text-slate-900">
                            {pct(m.val)}
                          </p>
                          <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-slate-200">
                            <div
                              className={`h-1 rounded-full ${colorBar}`}
                              style={{ width: `${m.val * 100}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </article>

          {/* Feature importance */}
          <article className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <h2 className="mb-4 font-semibold text-slate-900">
              Feature Importance
            </h2>
            <div className="space-y-3">
              {latest.featureImportances.slice(0, 10).map((item: FeatureImportance, idx: number) => {
                const width = Math.min(item.importance * 100, 100);
                const opacity = Math.max(1 - idx * 0.07, 0.4);
                return (
                  <div key={item.feature}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-700">
                        {item.feature}
                      </span>
                      <span className="tabular-nums text-slate-500">
                        {pct(item.importance)}
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-2 rounded-full bg-emerald-500 transition-all"
                        style={{ width: `${width}%`, opacity }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </article>
        </section>
      ) : null}

      {/* Report history table */}
      <section className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="font-semibold text-slate-900">Report History</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Each row is one local training run.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-5 py-3">Completed</th>
                <th className="px-5 py-3">Model</th>
                <th className="px-5 py-3">Dataset</th>
                <th className="px-5 py-3">Accuracy</th>
                <th className="px-5 py-3">Macro F1</th>
                <th className="px-5 py-3">Top Feature</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {reports.map((report) => (
                <tr
                  key={String(report._id)}
                  className="transition-colors hover:bg-slate-50"
                >
                  <td className="px-5 py-3 text-slate-600">
                    {new Date(report.trainingCompletedAt).toLocaleString()}
                  </td>
                  <td className="px-5 py-3">
                    <p className="font-medium text-slate-900">
                      {report.modelName}
                    </p>
                    <p className="text-xs text-slate-400">{report.modelVersion}</p>
                  </td>
                  <td className="px-5 py-3 text-slate-700">
                    {report.dataset.totalReadings.toLocaleString()} rows ·{" "}
                    {report.dataset.cowCount} cows
                  </td>
                  <td className="px-5 py-3">
                    <span className="font-semibold text-indigo-700">
                      {pct(report.metrics.accuracy)}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className="font-semibold text-emerald-700">
                      {pct(report.metrics.macroF1)}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-slate-600">
                    {(report.featureImportances[0] as FeatureImportance | undefined)
                      ?.feature ?? "—"}
                  </td>
                </tr>
              ))}
              {reports.length === 0 ? (
                <tr>
                  <td className="px-5 py-12 text-center text-slate-400" colSpan={6}>
                    <BrainCircuit className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                    No ML reports yet. Run{" "}
                    <code className="rounded bg-slate-100 px-1 text-xs">
                      python ml-local/train_report.py
                    </code>{" "}
                    locally after collecting data.
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
