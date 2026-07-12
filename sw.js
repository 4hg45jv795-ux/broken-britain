/* Enough Is Enough — service worker (RESET / inert).
   This version deliberately caches NOTHING and intercepts NOTHING. On activate it
   deletes every existing cache, so all media and code load straight from the network
   again — exactly as they did before offline caching was added.

   Why: instant cache hits were making too many Library audio elements start at once
   (iOS has a hard cap on simultaneous audio), which was crashing the app. This rolls
   that back cleanly. We can reintroduce offline later in a safer, audio-free way. */

self.addEventListener('install', e => { self.skipWaiting(); });

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map(k => caches.delete(k)));   // wipe ALL caches (media + shell)
    await self.clients.claim();
  })());
});

/* No 'fetch' listener on purpose: the service worker never serves from cache,
   so every request goes to the network normally. */
