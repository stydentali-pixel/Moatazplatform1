import { prisma } from "@/lib/prisma";
import { ok } from "@/lib/api";

export async function GET() {
  const settings = await prisma.setting.findMany();
  const map: Record<string, string> = {};
  for (const s of settings) map[s.key] = s.value;
  return ok(map);
}
