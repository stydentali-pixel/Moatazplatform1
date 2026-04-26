/**
 * Telegram Bot integration.
 *
 * This file contains the logic for the Telegram bot, including commands
 * for managing article ideas, drafts, publishing, and scheduling.
 */
import type TelegramBotType from "node-telegram-bot-api";
import { prisma } from "./prisma";
import { uniquePostSlug, readingTimeMinutes } from "./slug";

let bot: TelegramBotType | null = null;

export function isTelegramConfigured(): boolean {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_ADMIN_ID);
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://moatazalalqami.online";

async function logAction(who: string, action: string, status: string, details?: any, approvedAt?: Date) {
  try {
    await prisma.automationLog.create({
      data: {
        action,
        status,
        entity: "telegram",
        payload: details ? JSON.stringify(details) : null,
        message: `User ${who} performed ${action}`,
        createdAt: new Date(),
        // Note: The schema doesn't have approvedAt, but we can store it in details or skip if not in schema.
        // Looking at schema.prisma, AutomationLog only has action, entity, entityId, payload, status, message, createdAt.
      },
    });
  } catch (err) {
    console.error("Failed to log automation action:", err);
  }
}

async function sendToChannel(post: any) {
  const channelId = process.env.TELEGRAM_CHANNEL_ID;
  if (!channelId || !bot) return;

  const text = `<b>${post.title}</b>\n\n${post.excerpt || ""}\n\n<a href="${SITE_URL}/posts/${post.slug}">اقرأ المزيد</a>`;
  
  try {
    if (post.coverImage) {
      await bot.sendPhoto(channelId, post.coverImage, {
        caption: text,
        parse_mode: "HTML"
      });
    } else {
      await bot.sendMessage(channelId, text, {
        parse_mode: "HTML"
      });
    }
  } catch (err) {
    console.error("Failed to send to channel:", err);
  }
}

export async function startBot(): Promise<{ started: boolean; reason?: string }> {
  if (!isTelegramConfigured()) {
    return { started: false, reason: "TELEGRAM_BOT_TOKEN or TELEGRAM_ADMIN_ID not set" };
  }
  if (bot) return { started: true };

  const TelegramBot = (await import("node-telegram-bot-api")).default;
  bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN as string, { polling: true });
  const adminId = String(process.env.TELEGRAM_ADMIN_ID);

  const guard = (msg: TelegramBotType.Message): boolean => {
    if (String(msg.from?.id) !== adminId) {
      bot?.sendMessage(msg.chat.id, "عذراً، هذا البوت مخصص للمسؤول فقط. لا تملك صلاحية الوصول.");
      return false;
    }
    return true;
  };

  const helpMessage = `
<b>أهلاً بك في بوت إدارة منصة معتز القمي 🚀</b>

يمكنك استخدام الأوامر التالية لإدارة المحتوى:

• <code>/ideas</code> - عرض آخر 10 أفكار مقترحة.
• <code>/draft [العنوان]</code> - إنشاء مسودة مقال جديدة.
• <code>/publish [العنوان]</code> - نشر مقال مباشرة.
• <code>/schedule [العنوان] | YYYY-MM-DD HH:mm</code> - جدولة نشر مقال.
• <code>/approve [ideaId]</code> - اعتماد فكرة وتحويلها لمسودة.
• <code>/reject [ideaId]</code> - رفض فكرة مقترحة.

<b>أمثلة:</b>
<code>/draft أهمية الذكاء الاصطناعي</code>
<code>/schedule مقال جديد | 2024-05-01 10:00</code>
  `;

  bot.onText(/^\/start$/, async (msg) => {
    if (!guard(msg)) return;
    bot?.sendMessage(msg.chat.id, helpMessage, { parse_mode: "HTML" });
  });

  bot.onText(/^\/help$/, async (msg) => {
    if (!guard(msg)) return;
    bot?.sendMessage(msg.chat.id, helpMessage, { parse_mode: "HTML" });
  });

  bot.onText(/^\/ideas$/, async (msg) => {
    if (!guard(msg)) return;
    const ideas = await prisma.articleIdea.findMany({ orderBy: { createdAt: "desc" }, take: 10 });
    const text = ideas.length
      ? ideas.map((i) => `• <code>${i.id}</code> — ${i.title} [${i.status}]`).join("\n")
      : "لا توجد أفكار حالياً.";
    bot?.sendMessage(msg.chat.id, text, { parse_mode: "HTML" });
  });

  bot.onText(/^\/draft (.+)$/, async (msg, match) => {
    if (!guard(msg)) return;
    const title = match?.[1]?.trim();
    if (!title) return;

    try {
      const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
      const slug = await uniquePostSlug(title);
      const post = await prisma.post.create({
        data: {
          title,
          slug,
          content: "<p>مسودة أنشئت عبر التليجرام.</p>",
          status: "DRAFT",
          authorId: admin?.id || "default",
        }
      });

      await logAction(String(msg.from?.id), "create_draft", "success", { title, postId: post.id });

      const reply = `✅ تم إنشاء المسودة بنجاح!
<b>العنوان:</b> ${title}
<b>الحالة:</b> مسودة
🔗 <a href="${SITE_URL}/admin/posts/${post.id}">تعديل المقال</a>`;
      
      bot?.sendMessage(msg.chat.id, reply, { parse_mode: "HTML" });
    } catch (err) {
      bot?.sendMessage(msg.chat.id, "❌ حدث خطأ أثناء إنشاء المسودة.");
    }
  });

  bot.onText(/^\/publish (.+)$/, async (msg, match) => {
    if (!guard(msg)) return;
    const title = match?.[1]?.trim();
    if (!title) return;

    const opts = {
      reply_markup: {
        inline_keyboard: [
          [
            { text: "نعم، انشر ✅", callback_data: `pub_confirm:${title}` },
            { text: "إلغاء ❌", callback_data: `pub_cancel` }
          ]
        ]
      }
    };

    bot?.sendMessage(msg.chat.id, `هل تريد نشر هذا المقال الآن؟\n<b>العنوان:</b> ${title}`, { 
      parse_mode: "HTML",
      ...opts as any
    });
  });

  bot.on("callback_query", async (query) => {
    const data = query.data;
    const chatId = query.message?.chat.id;
    if (!chatId || !data) return;

    if (data.startsWith("pub_confirm:")) {
      const title = data.split(":")[1];
      try {
        const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
        const slug = await uniquePostSlug(title);
        const post = await prisma.post.create({
          data: {
            title,
            slug,
            content: "<p>تم النشر عبر التليجرام.</p>",
            status: "PUBLISHED",
            publishedAt: new Date(),
            authorId: admin?.id || "default",
          }
        });

        await logAction(String(query.from.id), "publish_post", "success", { title, postId: post.id });
        
        const reply = `🚀 تم النشر بنجاح!
<b>العنوان:</b> ${title}
🔗 <a href="${SITE_URL}/posts/${post.slug}">رابط المقال العام</a>
🛠 <a href="${SITE_URL}/admin/posts/${post.id}">تعديل من لوحة التحكم</a>`;
        
        bot?.editMessageText(reply, {
          chat_id: chatId,
          message_id: query.message?.message_id,
          parse_mode: "HTML"
        });

        await sendToChannel(post);
      } catch (err) {
        bot?.sendMessage(chatId, "❌ حدث خطأ أثناء النشر.");
      }
    } else if (data === "pub_cancel") {
      bot?.editMessageText("تم إلغاء عملية النشر.", {
        chat_id: chatId,
        message_id: query.message?.message_id
      });
    }
  });

  bot.onText(/^\/schedule (.+)\|(.+)$/, async (msg, match) => {
    if (!guard(msg)) return;
    const title = match?.[1]?.trim();
    const dateStr = match?.[2]?.trim();
    if (!title || !dateStr) return;

    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      bot?.sendMessage(msg.chat.id, "❌ تنسيق التاريخ غير صحيح. يرجى استخدام: YYYY-MM-DD HH:mm");
      return;
    }

    try {
      const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
      const slug = await uniquePostSlug(title);
      const post = await prisma.post.create({
        data: {
          title,
          slug,
          content: "<p>مقال مجدول عبر التليجرام.</p>",
          status: "SCHEDULED",
          scheduledAt: date,
          authorId: admin?.id || "default",
        }
      });

      await logAction(String(msg.from?.id), "schedule_post", "success", { title, postId: post.id, date });

      const reply = `📅 تم جدولة المقال بنجاح!
<b>العنوان:</b> ${title}
<b>موعد النشر:</b> ${dateStr}
🔗 <a href="${SITE_URL}/admin/posts/${post.id}">تعديل المقال</a>`;
      
      bot?.sendMessage(msg.chat.id, reply, { parse_mode: "HTML" });
    } catch (err) {
      bot?.sendMessage(msg.chat.id, "❌ حدث خطأ أثناء جدولة المقال.");
    }
  });

  bot.onText(/^\/approve (.+)$/, async (msg, match) => {
    if (!guard(msg)) return;
    const id = match?.[1]?.trim();
    if (!id) return;

    try {
      const idea = await prisma.articleIdea.findUnique({ where: { id } });
      if (!idea) {
        bot?.sendMessage(msg.chat.id, "❌ الفكرة غير موجودة.");
        return;
      }

      const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
      const slug = await uniquePostSlug(idea.title);
      const post = await prisma.post.create({
        data: {
          title: idea.title,
          slug,
          excerpt: idea.description,
          content: `<p>${idea.description || "مسودة معتمدة من فكرة."}</p>`,
          status: "DRAFT",
          authorId: admin?.id || "default",
        }
      });

      await prisma.articleIdea.update({
        where: { id },
        data: { status: "APPROVED" }
      });

      await logAction(String(msg.from?.id), "approve_idea", "success", { ideaId: id, postId: post.id });

      bot?.sendMessage(msg.chat.id, `✅ تم اعتماد الفكرة وتحويلها لمسودة.\n🔗 <a href="${SITE_URL}/admin/posts/${post.id}">تعديل المسودة</a>`, { parse_mode: "HTML" });
    } catch (err) {
      bot?.sendMessage(msg.chat.id, "❌ حدث خطأ أثناء اعتماد الفكرة.");
    }
  });

  bot.onText(/^\/reject (.+)$/, async (msg, match) => {
    if (!guard(msg)) return;
    const id = match?.[1]?.trim();
    if (!id) return;

    try {
      await prisma.articleIdea.update({
        where: { id },
        data: { status: "REJECTED" }
      });
      await logAction(String(msg.from?.id), "reject_idea", "success", { ideaId: id });
      bot?.sendMessage(msg.chat.id, `🚫 تم رفض الفكرة ${id}`);
    } catch (err) {
      bot?.sendMessage(msg.chat.id, "❌ حدث خطأ أثناء رفض الفكرة.");
    }
  });

  return { started: true };
}

export function stopBot() {
  bot?.stopPolling().catch(() => null);
  bot = null;
}
