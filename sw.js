/* Enough Is Enough — service worker.
   Makes repeat launches fast and reliable once the game has been opened once:
   it caches the heavy MEDIA (images, audio, video) and serves it instantly
   (and offline) on later launches.

   IMPORTANT: code files (index.html, data.js, engine.js, game.css, manifest.json)
   are deliberately NOT cached here — they always come fresh from the network, so
   any edits you redeploy show up immediately. Only media is cached.

   If you ever change an existing image/audio/video file (same filename) and the
   old one keeps showing, bump the version number in CACHE below to force a refresh. */
const CACHE = 'eie-media-v1';
const MEDIA = /\.(png|jpe?g|gif|webp|mp3|m4a|ogg|wav|mp4|webm|mov)$/i;

self.addEventListener('install', e => { self.skipWaiting(); });

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));  // drop old cache versions
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  let url;
  try { url = new URL(req.url); } catch (_) { return; }
  if (url.origin !== location.origin) return;     // only our own files
  if (!MEDIA.test(url.pathname)) return;           // code/html/etc: leave to the network (always fresh)
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const hit = await cache.match(req);
    if (hit) return hit;                           // already cached -> instant
    try {
      const res = await fetch(req);
      if (res && res.ok) cache.put(req, res.clone());  // cache on first successful download
      return res;
    } catch (err) {
      const any = await cache.match(req);
      if (any) return any;
      throw err;
    }
  })());
});
