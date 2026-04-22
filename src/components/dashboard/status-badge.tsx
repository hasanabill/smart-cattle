import type { CowStatus } from "@/types";

type Props = {
  status: CowStatus;
};

const statusClassMap: Record<CowStatus, string> = {
  normal: "bg-emerald-100 text-emerald-800",
  warning: "bg-amber-100 text-amber-800",
  anomaly: "bg-rose-100 text-rose-800",
};

export function StatusBadge({ status }: Props) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${statusClassMap[status]}`}
    >
      {status}
    </span>
  );
}
