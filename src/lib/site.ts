const vercelHost = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
const fallbackSiteUrl = vercelHost ? `https://${vercelHost}` : "http://localhost:3000";

export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? fallbackSiteUrl).replace(/\/$/, "");

export const siteOrigin = new URL(siteUrl);
