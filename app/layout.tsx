import type { Metadata } from "next";
import { Ranchers, Space_Mono, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Sidebar from "@/components/Sidebar";
import { SITE_URL } from "@/lib/site";

// next/font self-hosts these at build time, so the site still makes zero third-party requests.
const ranchers = Ranchers({ weight: "400", subsets: ["latin"], variable: "--font-ranchers", display: "swap" });
const spaceMono = Space_Mono({ weight: ["400", "700"], subsets: ["latin"], variable: "--font-space-mono", display: "swap" });
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta", display: "swap" });

export const metadata: Metadata = {
  title: {
    default: "PDF Tools: Free, No Upload, No Signup",
    template: "%s | PDF Tools",
  },
  description:
    "Free browser-based PDF tools. Merge, split, compress, convert and more, all processed on your device. No upload, no signup, no watermark.",
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
    <html lang="en" className={`${ranchers.variable} ${spaceMono.variable} ${jakarta.variable}`}>
      <body className="min-h-screen flex flex-col">
        <Header />
        <Sidebar />
        <div className="flex-1 flex flex-col lg:pr-[200px] overflow-x-clip">
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
