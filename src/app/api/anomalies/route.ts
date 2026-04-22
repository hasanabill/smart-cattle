import { getAnomalyList } from "@/lib/services/data";
import { fail, ok } from "@/lib/utils/http";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const limit = Number(url.searchParams.get("limit") ?? 100);
    const anomalies = await getAnomalyList(Number.isNaN(limit) ? 100 : limit);
    return ok({ count: anomalies.length, anomalies });
  } catch (error) {
    return fail("Failed to fetch anomalies.", 500, String(error));
  }
}
