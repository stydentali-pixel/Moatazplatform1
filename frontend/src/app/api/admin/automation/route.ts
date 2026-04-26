import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, fail } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await requireAdmin();
  if (!user) return fail("غير مصرح", 401);

  try {
    const logs = await prisma.automationLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return ok(logs);
  } catch (error) {
    return fail("فشل جلب السجلات");
  }
}
