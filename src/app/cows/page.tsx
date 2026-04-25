import Link from "next/link";
import { ChevronRight, Tag } from "lucide-react";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { getCowList } from "@/lib/services/data";

export const dynamic = "force-dynamic";

export default async function CowListPage() {
  const cows = await getCowList();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Cow List</h1>
        <p className="mt-1 text-sm text-slate-500">
          All registered collars and their current health status.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-slate-400" />
            <h2 className="font-semibold text-slate-900">Registered Cows</h2>
          </div>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
            {cows.length} total
          </span>
        </div>

        {cows.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
            <Tag className="mb-3 h-10 w-10 text-slate-300" />
            <p className="font-medium text-slate-600">No cows registered yet.</p>
            <p className="mt-1 text-sm text-slate-400">
              Cows are auto-registered when a collar sends its first sensor packet.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {cows.map((cow) => (
              <Link
                key={String(cow._id)}
                href={`/cows/${cow.cowId}`}
                className="flex items-center justify-between px-5 py-4 transition-colors hover:bg-slate-50"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 font-bold text-indigo-700">
                    {cow.cowId.slice(-2)}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{cow.name}</p>
                    <p className="text-xs text-slate-500">
                      ID: {cow.cowId}
                      {cow.breed ? ` · ${cow.breed}` : ""}
                      {cow.age != null ? ` · ${cow.age}y` : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={cow.status} />
                  <ChevronRight className="h-4 w-4 text-slate-300" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
