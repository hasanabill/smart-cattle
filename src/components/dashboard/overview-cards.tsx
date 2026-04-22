import type { DashboardSummary } from "@/types";

type Props = {
  summary: DashboardSummary;
};

const cards = [
  { key: "totalCows", label: "Total Cows" },
  { key: "healthyCows", label: "Healthy Cows" },
  { key: "warningCows", label: "Warning Cows" },
  { key: "anomalyCows", label: "Anomaly Cows" },
] as const;

export function OverviewCards({ summary }: Props) {
  return (
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <article
          key={card.key}
          className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          <p className="text-sm text-slate-500">{card.label}</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {summary[card.key]}
          </p>
        </article>
      ))}
    </section>
  );
}
