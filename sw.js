const CACHE_NAME = 'my-pwa-cache-v1';
const urlsToCache = [
  '/',
  '/favicon-16x16.png',
  '/safari-pinned-tab.svg',
  '/favicon.ico',
  '/index.html',
  '/android-chrome-192x192.png',
  '/apple-touch-icon.png',
  '/android-chrome-512x512.png',
  '/site.webmanifest',
  '/manefest.json',
  '/mstile-150x150.png',
  '/browserconfig.xml',
  '/favicon-32x32.png',
  '/images/jorgen-haland-2zD3cHs-mXA-unsplash.jpg',
  '/js/bg-audio.js',
  '/audio/rain-loop.ogg',
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});
