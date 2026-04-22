import { getRecentReadings } from "@/lib/services/data";
import { fail, ok } from "@/lib/utils/http";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const limit = Number(url.searchParams.get("limit") ?? 30);
    const readings = await getRecentReadings(Number.isNaN(limit) ? 30 : limit);
    return ok({ count: readings.length, readings });
  } catch (error) {
    return fail("Failed to fetch recent readings.", 500, String(error));
  }
}
