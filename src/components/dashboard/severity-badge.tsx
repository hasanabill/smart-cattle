import type { AnomalySeverity } from "@/types";

type Props = {
  severity: AnomalySeverity;
};

const config: Record<AnomalySeverity, { label: string; classes: string }> = {
  low: {
    label: "Low",
    classes: "bg-sky-50 text-sky-700 ring-1 ring-sky-200",
  },
  medium: {
    label: "Medium",
    classes: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  },
  high: {
    label: "High",
    classes: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
  },
};

export function SeverityBadge({ severity }: Props) {
  const c = config[severity];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${c.classes}`}
    >
      {c.label}
    </span>
  );
}
