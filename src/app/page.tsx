import { MainNav } from "@/components/dashboard/main-nav";
import { OverviewCards } from "@/components/dashboard/overview-cards";
import { RecentReadingsTable } from "@/components/dashboard/recent-readings-table";
import { getDashboardSummary, getRecentReadings } from "@/lib/services/data";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [summary, recentReadings] = await Promise.all([
    getDashboardSummary(),
    getRecentReadings(20),
  ]);

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8">
      <h1 className="mb-2 text-2xl font-bold text-slate-900">
        Smart Cattle Health Monitoring
      </h1>
      <p className="mb-6 text-slate-600">
        Wearable IoT sensor dashboard with rule-based anomaly detection.
      </p>
      <MainNav />
      <div className="space-y-6">
        <OverviewCards summary={summary} />
        <RecentReadingsTable
          rows={recentReadings.map((item) => ({
            ...item,
            _id: String(item._id),
          }))}
        />
      </div>
    </main>
  );
}
