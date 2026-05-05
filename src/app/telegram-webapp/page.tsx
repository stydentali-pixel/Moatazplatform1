import type { Metadata } from "next";
import PuterAiClient from "@/components/ai/PuterAiClient";

export const metadata: Metadata = {
  title: "مساعد البوت — منصة معتز",
  description: "واجهة AI خفيفة تفتح من بوت تليجرام وتعمل عبر Puter.js.",
};

export default function TelegramWebAppPage() {
  return (
    <main className="min-h-screen bg-cream-50 px-3 py-4 sm:px-5 sm:py-6">
      <div className="mx-auto max-w-6xl">
        <PuterAiClient
          mode="telegram"
          compact
          title="مساعد البوت والموقع"
          description="استخدم هذه الصفحة من داخل تليجرام لكتابة سكربتات، تلخيص مقالات، أو تجهيز محتوى للنشر."
        />
      </div>
    </main>
  );
}
