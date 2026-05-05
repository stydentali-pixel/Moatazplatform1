import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import PuterAiClient from "@/components/ai/PuterAiClient";

export const metadata: Metadata = {
  title: "مساعد السكربتات والبرمجة — منصة معتز",
  description: "مساعد لكتابة السكربتات، بوتات تليجرام، إصلاح الأخطاء، وتخطيط المشاريع البرمجية.",
};

export default function ScriptHelperPage() {
  return (
    <>
      <SiteHeader />
      <main className="container-px mx-auto max-w-7xl py-10 sm:py-14">
        <PuterAiClient mode="script" />
      </main>
      <SiteFooter />
    </>
  );
}
