/* Ellie Math service worker: cached copy first if the network is slow, never caches a bad response, updates on the next launch. */
const VERSION = 'ellie-math-v23';
const JS = ['engine', 'content', 'voice', 'audio', 'manip', 'theme', 'world', 'avatar', 'pixel', 'village', 'teach', 'parent', 'app'].map(n => `./${n}.js?v=23`);
const FILES = ['./', './index.html', ...JS, './fonts/fredoka-latin-500-normal.woff2', './fonts/fredoka-latin-600-normal.woff2', './fonts/fredoka-latin-700-normal.woff2', './manifest.webmanifest', './icon-180.png', './icon-192.png', './icon-512.png', './icon-maskable-512.png', ...['garden', 'ocean', 'space', 'classroom'].map(w => `./icon-${w}-180.png`)];
self.addEventListener('install', e => { e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
// Dot's recorded voice (~30 MB) lives in its own cache so an app update doesn't download it again; audio.js prunes old packs.
const VOICE_CACHE = 'ellie-voice';
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION && k !== VOICE_CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || !e.request.url.startsWith(self.location.origin)) return;
  if (/\/voice\/pack-\d+\.bin\?v=/.test(e.request.url)) {
    e.respondWith(caches.open(VOICE_CACHE).then(c => c.match(e.request).then(hit => hit || fetch(e.request).then(r => { if (r && r.ok) c.put(e.request, r.clone()); return r; }))));
    return;
  }
  e.respondWith((async () => {
    const cached = await caches.match(e.request);
    const net = fetch(e.request).then(r => {
      if (r && r.ok) { const copy = r.clone(); caches.open(VERSION).then(c => c.put(e.request, copy)); return r; }
      return cached || r;
    }).catch(() => cached || caches.match('./index.html'));
    // Versioned scripts never change, so serve them from cache; only the page itself races the network.
    if (cached && /\.js\?v=/.test(e.request.url)) return cached;
    if (!cached) return net;
    // Network first, but a slow network should not keep a cached app off the screen.
    const slow = new Promise(res => setTimeout(() => res(cached), 2500));
    return Promise.race([net, slow]);
  })());
});
