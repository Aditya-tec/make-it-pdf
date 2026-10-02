import type { Metadata } from "next";
import { Ranchers, Space_Mono, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { SITE_NAME, SITE_URL } from "@/lib/site";

// next/font self-hosts these at build time, so the site still makes zero third-party requests.
const ranchers = Ranchers({ weight: "400", subsets: ["latin"], variable: "--font-ranchers", display: "swap" });
const spaceMono = Space_Mono({ weight: ["400", "700"], subsets: ["latin"], variable: "--font-space-mono", display: "swap" });
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta", display: "swap" });

export const metadata: Metadata = {
  title: {
    default: `${SITE_NAME}: Free, No Upload, No Signup`,
    template: `%s | ${SITE_NAME}`,
  },
  description:
    "Free browser-based PDF tools. Merge, split, compress, convert and more, all processed on your device. No upload, no signup, no watermark.",
  metadataBase: new URL(SITE_URL),
  openGraph: {
    siteName: SITE_NAME,
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
        <div className="flex-1 flex flex-col overflow-x-clip">
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
