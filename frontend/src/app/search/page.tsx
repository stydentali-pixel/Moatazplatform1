import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import SearchClient from "@/components/SearchClient";

export const metadata = { title: "بحث — معتز العلقمي" };

export default function SearchPage() {
  return (
    <>
      <SiteHeader />
      <section className="container-px max-w-5xl mx-auto py-14">
        <div className="mb-10">
          <div className="text-gold-700 text-sm tracking-widest mb-2">بحث</div>
          <h1 className="heading-sec">عمّاذا تبحث؟</h1>
        </div>
        <SearchClient />
      </section>
      <SiteFooter />
    </>
  );
}
