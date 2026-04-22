import Link from "next/link";
import { MainNav } from "@/components/dashboard/main-nav";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { getCowList } from "@/lib/services/data";

export const dynamic = "force-dynamic";

export default async function CowListPage() {
  const cows = await getCowList();

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8">
      <h1 className="mb-2 text-2xl font-bold text-slate-900">Cow List</h1>
      <p className="mb-6 text-slate-600">All registered collars and latest status.</p>
      <MainNav />

      <section className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-4 py-3 font-semibold">Cow ID</th>
              <th className="px-4 py-3 font-semibold">Name</th>
              <th className="px-4 py-3 font-semibold">Breed</th>
              <th className="px-4 py-3 font-semibold">Age</th>
              <th className="px-4 py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {cows.map((cow) => (
              <tr key={String(cow._id)} className="border-t border-slate-100">
                <td className="px-4 py-3 font-medium text-slate-900">
                  <Link href={`/cows/${cow.cowId}`} className="text-blue-700 hover:underline">
                    {cow.cowId}
                  </Link>
                </td>
                <td className="px-4 py-3 text-slate-700">{cow.name}</td>
                <td className="px-4 py-3 text-slate-700">{cow.breed ?? "-"}</td>
                <td className="px-4 py-3 text-slate-700">{cow.age ?? "-"}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={cow.status} />
                </td>
              </tr>
            ))}
            {cows.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-slate-500" colSpan={5}>
                  No cows found. Send sensor packets first.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>
    </main>
  );
}
