import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok } from "@/lib/api";
import { z } from "zod";

const Schema = z.object({ email: z.string().email() });

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return ok({ subscribed: false, message: "البريد غير صحيح" });

  const email = parsed.data.email.toLowerCase().trim();
  await prisma.subscriber.upsert({
    where: { email },
    create: { email },
    update: { active: true },
  });
  return ok({ subscribed: true });
}
