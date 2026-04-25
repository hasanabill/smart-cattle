import type { DailyHealthStatus } from "@/types";

type Props = {
  status: DailyHealthStatus;
};

const config: Record<DailyHealthStatus, { label: string; classes: string }> = {
  good: {
    label: "Good",
    classes: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  },
  watch: {
    label: "Watch",
    classes: "bg-amber-50 text-amber-700 ring-amber-200",
  },
  bad: {
    label: "Bad",
    classes: "bg-rose-50 text-rose-700 ring-rose-200",
  },
};

export function DailyStatusBadge({ status }: Props) {
  const item = config[status];
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${item.classes}`}
    >
      {item.label}
    </span>
  );
}
