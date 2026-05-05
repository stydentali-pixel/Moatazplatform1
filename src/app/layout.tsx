import type { Metadata } from "next";
import { Cairo, Tajawal, Amiri } from "next/font/google";
import "./globals.css";

const cairo = Cairo({ subsets: ["arabic", "latin"], variable: "--font-cairo", weight: ["400", "600", "700", "800"] });
const tajawal = Tajawal({ subsets: ["arabic", "latin"], variable: "--font-tajawal", weight: ["400", "500", "700"] });
const amiri = Amiri({ subsets: ["arabic", "latin"], variable: "--font-amiri", weight: ["400", "700"], style: ["normal", "italic"] });

export const metadata: Metadata = {
  title: "منصة معتز — للمعرفة والإلهام",
  description: "مقالات وقصص ومحتوى عربي راقٍ للمعرفة والإلهام.",
  openGraph: { type: "website", locale: "ar_AR", siteName: "منصة معتز", images: ["/brand/logo.jpg"] },
  icons: { icon: "/brand/icon-192.jpg", apple: "/brand/icon-192.jpg" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={`${cairo.variable} ${tajawal.variable} ${amiri.variable}`}>
      <body>{children}</body>
    </html>
  );
}
