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

export function RecentReadingsTable({ rows }: Props) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 p-4">
        <h2 className="text-lg font-semibold text-slate-900">Recent Readings</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-4 py-3 font-semibold">Cow ID</th>
              <th className="px-4 py-3 font-semibold">Timestamp</th>
              <th className="px-4 py-3 font-semibold">Temp (C)</th>
              <th className="px-4 py-3 font-semibold">Activity</th>
              <th className="px-4 py-3 font-semibold">Vibration</th>
              <th className="px-4 py-3 font-semibold">WiFi RSSI</th>
              <th className="px-4 py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row._id} className="border-t border-slate-100">
                <td className="px-4 py-3 font-medium text-slate-900">{row.cowId}</td>
                <td className="px-4 py-3 text-slate-700">
                  {new Date(row.timestamp).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-slate-700">
                  {row.temperatureC.toFixed(2)}
                </td>
                <td className="px-4 py-3 text-slate-700">
                  {row.activityIndex.toFixed(3)}
                </td>
                <td className="px-4 py-3 text-slate-700">{row.vibrationCount}</td>
                <td className="px-4 py-3 text-slate-700">{row.wifiRssi}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={row.derivedStatus} />
                </td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-slate-500" colSpan={7}>
                  No readings available yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
