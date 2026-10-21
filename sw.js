/* Stat Brainteaser service worker: cache-first, versioned, precaches everything.
 * When you change ANY file, bump VERSION (and APP_VERSION in app.js) so users get an update prompt. */
var VERSION = '1.0.0';
var CACHE_PREFIX = 'stat-brainteaser-';
var CACHE = CACHE_PREFIX + 'v' + VERSION;

var PRECACHE = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './problems.js',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-192.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon-32.png'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE).then(function (cache) {
      // cache: 'reload' bypasses the HTTP cache so a new version never precaches stale files
      return cache.addAll(PRECACHE.map(function (url) { return new Request(url, { cache: 'reload' }); }));
    })
  );
  // No skipWaiting() here: an updated worker waits until the user accepts the in-app update prompt.
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) {
        return k.indexOf(CACHE_PREFIX) === 0 && k !== CACHE;
      }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('message', function (event) {
  var data = event.data || {};
  if (data.type === 'SKIP_WAITING') self.skipWaiting();
  if (data.type === 'GET_VERSION' && event.ports && event.ports[0]) event.ports[0].postMessage(VERSION);
});

self.addEventListener('fetch', function (event) {
  var req = event.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // App-shell navigation: always answer from the cached index.html (works offline, ignores ?query and #hash).
  if (req.mode === 'navigate') {
    event.respondWith(
      caches.open(CACHE).then(function (cache) {
        return cache.match('./index.html').then(function (hit) {
          return hit || fetch(req).catch(function () { return cache.match('./'); });
        });
      })
    );
    return;
  }

  // Cache-first for everything else; fill the cache on a miss.
  event.respondWith(
    caches.open(CACHE).then(function (cache) {
      return cache.match(req, { ignoreSearch: true }).then(function (hit) {
        if (hit) return hit;
        return fetch(req).then(function (res) {
          if (res && res.ok && res.type === 'basic') cache.put(req, res.clone());
          return res;
        });
      });
    })
  );
});
