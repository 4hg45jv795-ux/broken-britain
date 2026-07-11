/* Enough Is Enough — service worker (v2).
   Two caches, two strategies:

   • MEDIA (images/audio/video) — CACHE-FIRST. Served instantly on repeat launches and
     works offline. If you ever change a media file's *contents* but keep the same
     filename and the old one sticks, bump MEDIA_CACHE below to force a refresh.

   • APP SHELL (index.html, data.js, engine.js, game.css, manifest.json) — now cached too,
     but served NETWORK-FIRST. When you're ONLINE you always get the freshly deployed code,
     so any edits you redeploy still show up immediately (your workflow is unchanged). When
     you're OFFLINE, the game still launches from the cached copy. */
const MEDIA_CACHE = 'eie-media-v1';
const SHELL_CACHE = 'eie-shell-v1';
const MEDIA = /\.(png|jpe?g|gif|webp|mp3|m4a|ogg|wav|mp4|webm|mov)$/i;
const SHELL = ['./', './index.html', './data.js', './engine.js', './game.css', './manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    try { const c = await caches.open(SHELL_CACHE); await c.addAll(SHELL); } catch (_) {}  // pre-cache the shell for offline
    self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== MEDIA_CACHE && k !== SHELL_CACHE).map(k => caches.delete(k)));  // drop old versions
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  let url;
  try { url = new URL(req.url); } catch (_) { return; }
  if (url.origin !== location.origin) return;             // only our own files

  // MEDIA: cache-first (instant + offline)
  if (MEDIA.test(url.pathname)) {
    e.respondWith((async () => {
      const cache = await caches.open(MEDIA_CACHE);
      const hit = await cache.match(req);
      if (hit) return hit;                                 // already cached -> instant
      try {
        const res = await fetch(req);
        if (res && res.ok) cache.put(req, res.clone());    // cache on first successful download
        return res;
      } catch (err) {
        const any = await cache.match(req);
        if (any) return any;
        throw err;
      }
    })());
    return;
  }

  // APP SHELL (navigations + code): network-first, fall back to cache when offline
  const isShell = req.mode === 'navigate' || url.pathname === '/' || /\.(html|js|css|json)$/i.test(url.pathname);
  if (isShell) {
    e.respondWith((async () => {
      const cache = await caches.open(SHELL_CACHE);
      try {
        const res = await fetch(req);
        if (res && res.ok) cache.put(req, res.clone());    // keep the offline copy fresh
        return res;
      } catch (err) {                                      // offline -> serve last-known-good
        const hit = await cache.match(req) || await cache.match('./index.html') || await cache.match('./');
        if (hit) return hit;
        throw err;
      }
    })());
    return;
  }
  // anything else: leave to the network
});
