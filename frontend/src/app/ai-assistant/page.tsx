import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import PuterAiClient from "@/components/ai/PuterAiClient";

export const metadata: Metadata = {
  title: "مساعد الذكاء الاصطناعي — منصة معتز",
  description: "مساعد AI للكتابة والبرمجة والتحليل داخل منصة معتز.",
};

export default function AiAssistantPage() {
  return (
    <>
      <SiteHeader />
      <main className="container-px mx-auto max-w-7xl py-10 sm:py-14">
        <PuterAiClient mode="assistant" />
      </main>
      <SiteFooter />
    </>
  );
}
