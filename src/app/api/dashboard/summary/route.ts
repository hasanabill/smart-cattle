import { getDashboardSummary } from "@/lib/services/data";
import { fail, ok } from "@/lib/utils/http";

export async function GET() {
  try {
    const summary = await getDashboardSummary();
    return ok(summary);
  } catch (error) {
    return fail("Failed to fetch dashboard summary.", 500, String(error));
  }
}
