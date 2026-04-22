import type { AnomalySeverity } from "@/types";

type Props = {
  severity: AnomalySeverity;
};

const severityClassMap: Record<AnomalySeverity, string> = {
  low: "bg-sky-100 text-sky-800",
  medium: "bg-amber-100 text-amber-800",
  high: "bg-rose-100 text-rose-800",
};

export function SeverityBadge({ severity }: Props) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${severityClassMap[severity]}`}
    >
      {severity}
    </span>
  );
}
