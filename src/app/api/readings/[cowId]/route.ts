import { getReadingsByCow } from "@/lib/services/data";
import { fail, ok } from "@/lib/utils/http";

type Params = {
  params: Promise<{ cowId: string }>;
};

export async function GET(request: Request, { params }: Params) {
  try {
    const { cowId } = await params;
    const url = new URL(request.url);
    const limit = Number(url.searchParams.get("limit") ?? 100);
    const readings = await getReadingsByCow(cowId, Number.isNaN(limit) ? 100 : limit);
    return ok({ cowId, count: readings.length, readings });
  } catch (error) {
    return fail("Failed to fetch cow readings.", 500, String(error));
  }
}
