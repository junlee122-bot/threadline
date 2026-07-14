/* Threadline's deliberately small offline shell. Application and RSC data stay network-only. */
const CACHE_PREFIX = "threadline-offline";
const CACHE_NAME = `${CACHE_PREFIX}-v1`;
const OFFLINE_URL = "/offline";
const PRECACHE_URLS = [OFFLINE_URL, "/icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.allSettled(
        PRECACHE_URLS.map((url) => cache.add(new Request(url, { cache: "reload" }))),
      ),
    ),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.method !== "GET") return;

  const url = new URL(request.url);
  const isSameOrigin = url.origin === self.location.origin;
  const isNextAsset = url.pathname.startsWith("/_next/");
  const isApiRequest = url.pathname.startsWith("/api/");
  const isRscRequest =
    request.headers.get("RSC") === "1" ||
    request.headers.get("accept")?.includes("text/x-component") ||
    url.searchParams.has("_rsc");

  // Never intercept or cache Next.js build assets, APIs, or React Server Component payloads.
  if (!isSameOrigin || isNextAsset || isApiRequest || isRscRequest) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(async () => {
        const cache = await caches.open(CACHE_NAME);
        return (await cache.match(OFFLINE_URL)) || Response.error();
      }),
    );
  }
});
