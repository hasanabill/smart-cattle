import type { CowStatus } from "@/types";

type Props = {
  status: CowStatus;
};

const config: Record<CowStatus, { dot: string; text: string; bg: string }> = {
  normal: {
    dot: "bg-emerald-500",
    text: "text-emerald-700",
    bg: "bg-emerald-50 ring-1 ring-emerald-200",
  },
  warning: {
    dot: "bg-amber-500",
    text: "text-amber-700",
    bg: "bg-amber-50 ring-1 ring-amber-200",
  },
  anomaly: {
    dot: "bg-rose-500",
    text: "text-rose-700",
    bg: "bg-rose-50 ring-1 ring-rose-200",
  },
};

export function StatusBadge({ status }: Props) {
  const c = config[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${c.bg} ${c.text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
      {status}
    </span>
  );
}
