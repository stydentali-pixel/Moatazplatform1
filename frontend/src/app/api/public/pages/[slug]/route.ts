import { prisma } from "@/lib/prisma";
import { ok, fail } from "@/lib/api";

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  const page = await prisma.page.findFirst({ where: { slug: params.slug, published: true } });
  if (!page) return fail("الصفحة غير موجودة", 404);
  return ok(page);
}
