import type { Metadata } from "next";
import { Ranchers, Space_Mono, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import { Analytics } from "@vercel/analytics/react";

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
    "Browser-based PDF tools that process files entirely on your device — tested with zero third-party network requests during file processing. 20 tools, no account required, no feature behind a paywall, no watermark.",
  metadataBase: new URL(SITE_URL),
  openGraph: {
    siteName: SITE_NAME,
    type: "website",
    locale: "en_US",
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
  // Bing Webmaster Tools (ChatGPT Search indexes via Bing, not Google).
  // After verifying the site at https://www.bing.com/webmasters, either:
  //   1) set NEXT_PUBLIC_BING_SITE_VERIFICATION to the msvalidate.01 content value, or
  //   2) drop BingSiteAuth.xml into /public with the XML Bing gives you.
  verification: {
    google: "9SW4TqG019lRHRDzEnQZcBMKjw3oSLK_ugahlsRtB4M",
    ...(process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION
      ? { other: { "msvalidate.01": process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION } }
      : {}),
  },
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
        <Analytics />
      </body>
    </html>
  );
}
