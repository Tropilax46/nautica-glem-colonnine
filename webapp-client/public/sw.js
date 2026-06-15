// Service worker minimale: serve solo a rendere il sito "installabile" (PWA).
// Strategia network-first, nessuna cache aggressiva (i dati restano freschi).
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", (e) => {
  e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
});
