/* Essentera service worker.
   Dirancang agar TIDAK perlu diubah saat revisi: index.html selalu diambil
   dari jaringan lebih dulu (network-first), cache hanya jadi cadangan offline. */
const CACHE = 'essentera-shell-v1';
const SHELL = ['./', './index.html', './manifest.json', './icons/icon-192.png', './icons/icon-512.png', './icons/logo.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Biarkan Firebase (Firestore, Auth, Storage) memakai jaringan sendiri.
  if (/(firestore|identitytoolkit|securetoken|firebasestorage|googleapis)\.com$/.test(url.hostname) &&
      !url.hostname.startsWith('fonts.')) return;

  // Library Firebase dari gstatic: cache-first (versi sudah dikunci di URL).
  if (url.hostname === 'www.gstatic.com') {
    e.respondWith(
      caches.match(req).then((hit) => hit || fetch(req).then((res) => {
        const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); return res;
      }))
    );
    return;
  }

  // File milik aplikasi: network-first, cadangan dari cache.
  if (url.origin === location.origin) {
    e.respondWith(
      fetch(req).then((res) => {
        const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); return res;
      }).catch(() => caches.match(req).then((hit) => hit || caches.match('./index.html')))
    );
  }
});
