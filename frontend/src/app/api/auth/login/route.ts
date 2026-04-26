import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyPassword, signToken, setAuthCookie } from "@/lib/auth";
import { ok, fail, readJson } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const Schema = z.object({
  email: z.string().email("بريد إلكتروني غير صحيح"),
  password: z.string().min(1, "كلمة المرور مطلوبة"),
});

export async function POST(req: NextRequest) {
  const body = await readJson(req);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return fail(parsed.error.errors[0]?.message || "بيانات غير صحيحة", 400);

  const email = parsed.data.email.toLowerCase().trim();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return fail("بيانات الدخول غير صحيحة", 401);

  const valid = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!valid) return fail("بيانات الدخول غير صحيحة", 401);

  const token = signToken({ sub: user.id, email: user.email, role: user.role, name: user.name });
  setAuthCookie(token);

  return ok({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });
}
