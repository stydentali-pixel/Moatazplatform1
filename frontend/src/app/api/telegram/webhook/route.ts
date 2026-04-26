import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, fail } from "@/lib/api";
import { uniquePostSlug, readingTimeMinutes } from "@/lib/slug";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type TelegramMessage = { chat?: { id?: number | string }; text?: string; from?: { id?: number | string } };

type TelegramUpdate = { message?: TelegramMessage; callback_query?: { message?: TelegramMessage; data?: string; from?: { id?: number | string } } };

function configured() {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_ADMIN_ID);
}

async function sendMessage(chatId: string | number, text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return;
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
  }).catch((error) => console.error("Telegram sendMessage error", error));
}

async function log(action: string, status: string, payload?: unknown, message?: string) {
  await prisma.automationLog.create({
    data: { action, status, entity: "telegram", payload: payload ? JSON.stringify(payload).slice(0, 8000) : null, message },
  }).catch(() => null);
}

export async function POST(req: NextRequest) {
  if (!configured()) return ok({ configured: false });

  const update = (await req.json().catch(() => ({}))) as TelegramUpdate;
  const msg = update.message || update.callback_query?.message;
  const text = (update.message?.text || update.callback_query?.data || "").trim();
  const chatId = msg?.chat?.id;
  const fromId = update.message?.from?.id || update.callback_query?.from?.id || chatId;

  if (!chatId || !text) return ok({ ignored: true });
  if (String(fromId) !== String(process.env.TELEGRAM_ADMIN_ID)) {
    await sendMessage(chatId, "غير مسموح");
    await log("unauthorized", "rejected", { fromId, text });
    return ok({ rejected: true });
  }

  try {
    if (text === "/ideas") {
      const ideas = await prisma.articleIdea.findMany({ orderBy: { createdAt: "desc" }, take: 10, select: { id: true, title: true, status: true } });
      await sendMessage(chatId, ideas.length ? ideas.map((i) => `• ${i.id} — ${i.title} [${i.status}]`).join("\n") : "لا توجد أفكار حالياً");
      return ok({ done: true });
    }

    if (text.startsWith("/draft ")) {
      const title = text.replace("/draft ", "").trim();
      const idea = await prisma.articleIdea.create({ data: { title, status: "DRAFTED", source: "telegram" } });
      await log("draft", "success", idea);
      await sendMessage(chatId, `تم إنشاء فكرة/مسودة: ${title}`);
      return ok({ idea });
    }

    if (text.startsWith("/approve ")) {
      const id = text.replace("/approve ", "").trim();
      await prisma.articleIdea.update({ where: { id }, data: { status: "APPROVED" } });
      await log("approve", "success", { id });
      await sendMessage(chatId, `تم اعتماد الفكرة: ${id}`);
      return ok({ id });
    }

    if (text.startsWith("/reject ")) {
      const id = text.replace("/reject ", "").trim();
      await prisma.articleIdea.update({ where: { id }, data: { status: "REJECTED" } });
      await log("reject", "success", { id });
      await sendMessage(chatId, `تم رفض الفكرة: ${id}`);
      return ok({ id });
    }

    if (text.startsWith("/publish ")) {
      if (process.env.ENABLE_DIRECT_PUBLISH !== "true") {
        await sendMessage(chatId, "النشر المباشر معطل حالياً. استخدم /draft ثم انشر من لوحة التحكم.");
        return ok({ directPublish: false });
      }
      const title = text.replace("/publish ", "").trim();
      const admin = await prisma.user.findFirst({ where: { role: "ADMIN" }, select: { id: true } });
      if (!admin) return fail("لا يوجد مدير", 400);
      const slug = await uniquePostSlug(title);
      const post = await prisma.post.create({
        data: {
          title,
          slug,
          excerpt: "مسودة منشأة عبر تيليجرام.",
          content: "<p>هذه مسودة أولية تحتاج إلى تحرير يدوي.</p>",
          status: "PUBLISHED",
          publishedAt: new Date(),
          readingTime: readingTimeMinutes(title),
          authorId: admin.id,
        },
      });
      await log("publish", "success", post);
      await sendMessage(chatId, `تم النشر: ${title}`);
      return ok({ post });
    }

    if (text.startsWith("/schedule ")) {
      const raw = text.replace("/schedule ", "").trim();
      const [title, date] = raw.split("|").map((v) => v?.trim());
      await prisma.articleIdea.create({ data: { title: title || raw, status: "SCHEDULED", source: "telegram", notes: date ? `Scheduled for ${date}` : null } });
      await log("schedule", "success", { title, date });
      await sendMessage(chatId, `تم تسجيل الجدولة: ${title || raw}${date ? ` — ${date}` : ""}`);
      return ok({ scheduled: true });
    }

    await sendMessage(chatId, "الأوامر: /ideas /draft title /publish title /schedule title | date /approve id /reject id");
    return ok({ help: true });
  } catch (error) {
    console.error("Telegram webhook error", error);
    await log("telegram_error", "error", { text }, error instanceof Error ? error.message : "Unknown error");
    await sendMessage(chatId, "حدث خطأ أثناء تنفيذ الأمر.");
    return fail("Telegram command failed", 500);
  }
}

export async function GET() {
  return ok({ configured: configured(), status: "telegram webhook ready" });
}
