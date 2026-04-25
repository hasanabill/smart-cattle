import {
  generateDailyHealthReports,
  getDailyHealthReports,
} from "@/lib/services/data";
import { getDateKey } from "@/lib/utils/daily-health";
import { fail, ok } from "@/lib/utils/http";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const cowId = url.searchParams.get("cowId") ?? undefined;
    const dateKey = url.searchParams.get("date") ?? undefined;
    const limit = Number(url.searchParams.get("limit") ?? 50);

    const reports = await getDailyHealthReports({
      cowId,
      dateKey,
      limit: Number.isNaN(limit) ? 50 : limit,
    });

    return ok({ count: reports.length, reports });
  } catch (error) {
    return fail("Failed to fetch daily health reports.", 500, String(error));
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as { date?: string };
    const dateKey = body.date ?? getDateKey();
    const reports = await generateDailyHealthReports(dateKey);

    return ok(
      {
        dateKey,
        generatedReports: reports.length,
        reports,
      },
      201,
    );
  } catch (error) {
    return fail("Failed to generate daily health reports.", 500, String(error));
  }
}
