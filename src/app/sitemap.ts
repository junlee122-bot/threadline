import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: siteUrl, changeFrequency: "monthly", priority: 1 },
    { url: `${siteUrl}/command`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${siteUrl}/incidents`, changeFrequency: "weekly", priority: 0.86 },
    { url: `${siteUrl}/incidents/inc-2471`, changeFrequency: "monthly", priority: 0.85 },
    { url: `${siteUrl}/map`, changeFrequency: "monthly", priority: 0.75 },
    { url: `${siteUrl}/changes`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${siteUrl}/agents`, changeFrequency: "monthly", priority: 0.65 },
    { url: `${siteUrl}/reports`, changeFrequency: "monthly", priority: 0.6 },
  ];
}
