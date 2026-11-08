// Service worker: dzięki niemu strona da się zainstalować jako aplikacja
// i działa offline (w trybie lokalnym). Po każdej zmianie plików podbij numer wersji.
const VERSION = 'wa-v2';
const SHELL = [
  './', 'index.html', 'play.html', 'profil.html', 'ranking.html', 'zasady.html', 'login.html',
  'css/style.css', 'manifest.webmanifest',
  'js/app.js', 'js/bot.js', 'js/bot-worker.js', 'js/bots.js', 'js/elo.js', 'js/engine.js',
  'js/firebase-config.js', 'js/play.js', 'js/pwa.js', 'js/store.js', 'js/random-bots.js',
  'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png', 'icons/favicon-32.png',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const sameOrigin = url.origin === location.origin;
  const cdn = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com'
    || (url.hostname === 'www.gstatic.com' && url.pathname.startsWith('/firebasejs/'));
  if (!sameOrigin && !cdn) return; // Firestore, logowanie itd. zawsze idą do sieci

  // Najpierw pamięć podręczna (szybko i offline), w tle pobieramy świeżą wersję
  e.respondWith(
    caches.open(VERSION).then(async cache => {
      const cached = await cache.match(req, { ignoreSearch: sameOrigin && req.mode === 'navigate' });
      const fresh = fetch(req).then(res => {
        if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone());
        return res;
      }).catch(() => cached);
      return cached || fresh;
    })
  );
});
