/* Ellie Math service worker: network-first for the app files, cache fallback so it opens offline.
   New versions take effect on the next launch; never prompts mid-session. */
const VERSION = 'ellie-math-v1';
const FILES = ['./', './index.html', './engine.js', './content.js', './audio.js', './app.js', './parent.js', './manifest.webmanifest', './icon-180.png', './icon-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(fetch(e.request).then(r => { const copy = r.clone(); caches.open(VERSION).then(c => c.put(e.request, copy)); return r; })
    .catch(() => caches.match(e.request).then(r => r || caches.match('./index.html'))));
});
