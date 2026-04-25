import { Activity, AlertTriangle, CheckCircle2, Layers } from "lucide-react";
import type { DashboardSummary } from "@/types";

type Props = {
  summary: DashboardSummary;
};

const cards = [
  {
    key: "totalCows",
    label: "Total Cows",
    icon: Layers,
    iconBg: "bg-indigo-100",
    iconColor: "text-indigo-600",
    accent: "border-l-indigo-500",
  },
  {
    key: "healthyCows",
    label: "Healthy Cows",
    icon: CheckCircle2,
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
    accent: "border-l-emerald-500",
  },
  {
    key: "warningCows",
    label: "Warning Cows",
    icon: Activity,
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
    accent: "border-l-amber-500",
  },
  {
    key: "anomalyCows",
    label: "Anomaly Cows",
    icon: AlertTriangle,
    iconBg: "bg-rose-100",
    iconColor: "text-rose-600",
    accent: "border-l-rose-500",
  },
] as const;

export function OverviewCards({ summary }: Props) {
  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <article
            key={card.key}
            className={`relative overflow-hidden rounded-xl border-l-4 bg-white px-5 py-4 shadow-sm ${card.accent}`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {card.label}
                </p>
                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {summary[card.key]}
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
  );
}
