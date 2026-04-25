/**
 * Telegram Bot integration scaffold.
 *
 * The bot is intentionally NOT started automatically. It only runs when both
 * TELEGRAM_BOT_TOKEN and TELEGRAM_ADMIN_ID are present and `startBot()` is
 * explicitly called. Commands are pre-wired and route to the same domain
 * actions used by the admin dashboard.
 */
import type TelegramBotType from "node-telegram-bot-api";
import { prisma } from "./prisma";

let bot: TelegramBotType | null = null;

export function isTelegramConfigured(): boolean {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_ADMIN_ID);
}

export async function startBot(): Promise<{ started: boolean; reason?: string }> {
  if (!isTelegramConfigured()) {
    return { started: false, reason: "TELEGRAM_BOT_TOKEN or TELEGRAM_ADMIN_ID not set" };
  }
  if (bot) return { started: true };

  // dynamic import to avoid loading native deps when unused
  const TelegramBot = (await import("node-telegram-bot-api")).default;
  bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN as string, { polling: true });
  const adminId = String(process.env.TELEGRAM_ADMIN_ID);

  const guard = (msg: TelegramBotType.Message): boolean => {
    if (String(msg.chat.id) !== adminId) {
      bot?.sendMessage(msg.chat.id, "غير مسموح");
      return false;
    }
    return true;
  };

  bot.onText(/^\/ideas$/, async (msg) => {
    if (!guard(msg)) return;
    const ideas = await prisma.articleIdea.findMany({ orderBy: { createdAt: "desc" }, take: 10 });
    const text = ideas.length
      ? ideas.map((i) => `• ${i.id} — ${i.title} [${i.status}]`).join("\n")
      : "لا توجد أفكار";
    bot?.sendMessage(msg.chat.id, text);
  });

  bot.onText(/^\/draft (.+)$/, async (msg, match) => {
    if (!guard(msg)) return;
    const title = match?.[1]?.trim();
    if (!title) return;
    await prisma.articleIdea.create({ data: { title, status: "DRAFTED" } });
    bot?.sendMessage(msg.chat.id, `تم حفظ المسودة: ${title}`);
  });

  bot.onText(/^\/approve (.+)$/, async (msg, match) => {
    if (!guard(msg)) return;
    const id = match?.[1]?.trim();
    if (!id) return;
    await prisma.articleIdea.update({ where: { id }, data: { status: "APPROVED" } }).catch(() => null);
    bot?.sendMessage(msg.chat.id, `تم اعتماد الفكرة ${id}`);
  });

  bot.onText(/^\/reject (.+)$/, async (msg, match) => {
    if (!guard(msg)) return;
    const id = match?.[1]?.trim();
    if (!id) return;
    await prisma.articleIdea.update({ where: { id }, data: { status: "REJECTED" } }).catch(() => null);
    bot?.sendMessage(msg.chat.id, `تم رفض الفكرة ${id}`);
  });

  bot.onText(/^\/publish (.+)$/, async (msg, match) => {
    if (!guard(msg)) return;
    const title = match?.[1]?.trim();
    if (!title) return;
    bot?.sendMessage(
      msg.chat.id,
      `هل أنت متأكد من نشر "${title}"؟ أرسل /confirm_publish ${title} للتأكيد.`,
    );
  });

  bot.onText(/^\/schedule (.+)\|(.+)$/, async (msg, match) => {
    if (!guard(msg)) return;
    const title = match?.[1]?.trim();
    const date = match?.[2]?.trim();
    bot?.sendMessage(msg.chat.id, `تم تسجيل طلب جدولة "${title}" في ${date}.`);
  });

  return { started: true };
}

export function stopBot() {
  bot?.stopPolling().catch(() => null);
  bot = null;
}
