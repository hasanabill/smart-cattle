import { getMLReports } from "@/lib/services/data";
import { fail, ok } from "@/lib/utils/http";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const limit = Number(url.searchParams.get("limit") ?? 20);
    const reports = await getMLReports(Number.isNaN(limit) ? 20 : limit);
    return ok({ count: reports.length, reports });
  } catch (error) {
    return fail("Failed to fetch ML reports.", 500, String(error));
  }
}
