import Link from "next/link";
import { StatusBadge } from "@/components/dashboard/status-badge";
import type { CowStatus } from "@/types";

type ReadingRow = {
  _id: string;
  cowId: string;
  timestamp: Date | string;
  temperatureC: number;
  activityIndex: number;
  vibrationCount: number;
  wifiRssi: number;
  derivedStatus: CowStatus;
};

type Props = {
  rows: ReadingRow[];
};

function signalColor(rssi: number) {
  if (rssi >= -60) return "text-emerald-600";
  if (rssi >= -70) return "text-amber-600";
  return "text-rose-600";
}

export function RecentReadingsTable({ rows }: Props) {
  return (
    <section className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <div>
          <h2 className="font-semibold text-slate-900">Recent Readings</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Latest sensor packets from all collars
          </p>
        </div>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
          {rows.length} records
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <th className="px-5 py-3">Cow ID</th>
              <th className="px-5 py-3">Timestamp</th>
              <th className="px-5 py-3">Temp (°C)</th>
              <th className="px-5 py-3">Activity</th>
              <th className="px-5 py-3">Vibration</th>
              <th className="px-5 py-3">WiFi RSSI</th>
              <th className="px-5 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {rows.map((row, idx) => (
              <tr
                key={row._id}
                className={`transition-colors hover:bg-slate-50 ${idx % 2 === 1 ? "bg-slate-50/50" : ""}`}
              >
                <td className="px-5 py-3">
                  <Link
                    href={`/cows/${row.cowId}`}
                    className="font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
                  >
                    {row.cowId}
                  </Link>
                </td>
                <td className="px-5 py-3 text-slate-600">
                  {new Date(row.timestamp).toLocaleString()}
                </td>
                <td className="px-5 py-3">
                  <span
                    className={`font-medium ${row.temperatureC >= 32.5 ? "text-rose-600" : "text-slate-700"}`}
                  >
                    {row.temperatureC.toFixed(2)}
                  </span>
                </td>
                <td className="px-5 py-3 font-mono text-slate-700">
                  {row.activityIndex.toFixed(4)}
                </td>
                <td className="px-5 py-3 text-slate-700">{row.vibrationCount}</td>
                <td className={`px-5 py-3 font-medium ${signalColor(row.wifiRssi)}`}>
                  {row.wifiRssi} dBm
                </td>
                <td className="px-5 py-3">
                  <StatusBadge status={row.derivedStatus} />
                </td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td className="px-5 py-10 text-center text-slate-400" colSpan={7}>
                  No readings yet. Send sensor packets to get started.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
