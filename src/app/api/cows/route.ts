import { getCowList } from "@/lib/services/data";
import { fail, ok } from "@/lib/utils/http";

export async function GET() {
  try {
    const cows = await getCowList();
    return ok({ count: cows.length, cows });
  } catch (error) {
    return fail("Failed to fetch cows.", 500, String(error));
  }
}
