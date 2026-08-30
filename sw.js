const CACHE_NAME = "ledger-cache-v1";

const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./LedgerApp.jsx",
  "./icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

// Network-first, falling back to cache (and to the app shell for navigations).
// Keeps LedgerApp.jsx fresh after you push edits, while still working offline.
self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          if (response.ok) cache.put(request, copy);
        });
        return response;
      })
      .catch(() =>
        caches.match(request).then((cached) => cached || caches.match("./index.html"))
      )
  );
});
