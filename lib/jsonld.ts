import type { Tool } from "./tools";

const BASE = "https://pdftools.vercel.app";

export function toolJsonLd(tool: Tool) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        name: tool.name,
        description: tool.description,
        url: `${BASE}/${tool.slug}`,
        applicationCategory: "UtilitiesApplication",
        operatingSystem: "Any (browser-based)",
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      },
      {
        "@type": "FAQPage",
        mainEntity: tool.faq.map((item) => ({
          "@type": "Question",
          name: item.q,
          acceptedAnswer: { "@type": "Answer", text: item.a },
        })),
      },
      {
        "@type": "HowTo",
        name: `How to ${tool.name.toLowerCase()} — step by step`,
        step: tool.howTo.map((text, i) => ({
          "@type": "HowToStep",
          position: i + 1,
          text,
        })),
      },
    ],
  };
}
