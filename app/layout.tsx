import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: {
    default: "PDF Tools – Free, No Upload, No Signup",
    template: "%s | PDF Tools",
  },
  description:
    "Free browser-based PDF tools. Merge, split, compress, convert and more — all processed on your device. No upload, no signup, no watermark.",
  metadataBase: new URL(SITE_URL),
  openGraph: {
    siteName: "PDF Tools",
    type: "website",
    locale: "en_US",
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
