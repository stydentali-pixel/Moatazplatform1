import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import PuterAiClient from "@/components/ai/PuterAiClient";

export const metadata: Metadata = {
  title: "أدوات المقالات AI — منصة معتز",
  description: "تلخيص المقالات، تحسين SEO، إعادة الصياغة، وتجميع الملاحظات إلى مقالات.",
};

export default function ArticleToolsPage() {
  return (
    <>
      <SiteHeader />
      <main className="container-px mx-auto max-w-7xl py-10 sm:py-14">
        <PuterAiClient mode="article" />
      </main>
      <SiteFooter />
    </>
  );
}
