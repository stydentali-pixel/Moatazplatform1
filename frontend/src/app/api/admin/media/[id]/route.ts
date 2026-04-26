import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, fail } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const user = await requireAdmin();
  if (!user) return fail("غير مصرح", 401);
  await prisma.media.delete({ where: { id: params.id } }).catch(() => null);
  return ok({ deleted: true });
}
