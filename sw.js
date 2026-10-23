/* Stat Brainteaser service worker: cache-first, versioned, precaches everything.
 *
 * VERSION is the human version (keep in sync with APP_VERSION in app.js).
 * BUILD is stamped by .github/workflows/deploy.yml on every push (commit sha + run number),
 * so this file's bytes change on every deploy and browsers detect a new service worker.
 * Locally it stays 'dev' and everything still works. */
var VERSION = '2.2.0';
var BUILD = 'dev';
var CACHE_PREFIX = 'stat-brainteaser-';
var CACHE = CACHE_PREFIX + 'v' + VERSION + '-' + BUILD;
var META_CACHE = 'sbt-meta'; // small key/value store (last build we notified about); not an app cache
// Coding lab: the optional Pyodide download (pinned version) lives in its own runtime cache. Its name does not start with
// CACHE_PREFIX, so app updates (activate cleanup) never delete it; a new Pyodide version gets a new cache name.
var PYODIDE_BASE = 'https://cdn.jsdelivr.net/pyodide/v0.26.4/';
var PYODIDE_CACHE = 'sbt-pyodide-v0.26.4';

var PRECACHE = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './problems.js',
  './competitions.js',
  './coach.js',
  './coach-ui.js',
  './prep-data.js',
  './prep.js',
  './prep-ui.js',
  './features.css',
  './library-data.js',
  './library.js',
  './learn-data.js',
  './learn.js',
  './guide-data.js',
  './guide.js',
  './deck.js',
  './codelab.js',
  './codelab-worker.js',
  './mock.js',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-192.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon-32.png'
];
// Arcade module (built separately). Precached too, but tolerantly: if one of these is missing the install
// still succeeds and the app shows an "arcade not available" card instead.
var OPTIONAL = ['./arcade.css', './arcade-data.js', './arcade.js'];
// Never cached, always fetched fresh: the deploy manifest used for update checks.
var NO_CACHE = ['version.json'];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE).then(function (cache) {
      // cache: 'reload' bypasses the HTTP cache so a new version never precaches stale files
      return cache.addAll(PRECACHE.map(function (url) { return new Request(url, { cache: 'reload' }); })).then(function () {
        return Promise.all(OPTIONAL.map(function (url) {
          return fetch(new Request(url, { cache: 'reload' })).then(function (res) { if (res && res.ok) return cache.put(url, res); }).catch(function () {});
        }));
      });
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

/* ---------- update check + notification (used by periodic background sync) ---------- */
function metaGet(key) {
  return caches.open(META_CACHE).then(function (c) { return c.match('/__meta/' + key); })
    .then(function (r) { return r ? r.text() : null; }).catch(function () { return null; });
}
function metaSet(key, value) {
  return caches.open(META_CACHE).then(function (c) { return c.put('/__meta/' + key, new Response(String(value))); });
}
function fetchVersionInfo() {
  return fetch(new URL('version.json', self.registration.scope).href, { cache: 'no-store' })
    .then(function (r) { return r.ok ? r.json() : null; })
    .catch(function () { return null; });
}
/* Compare the deployed build with this worker's BUILD; notify once per new build.
 * Resolves to {status: 'current'|'already'|'notified'|'offline'|'no-permission'|'error', build}. */
function checkForUpdateAndNotify() {
  return fetchVersionInfo().then(function (info) {
    if (!info || !info.build) return { status: 'offline' };
    if (info.build === BUILD) return { status: 'current', build: info.build };
    // also start downloading the new worker so the app is ready next time it opens
    try { self.registration.update(); } catch (e) {}
    return metaGet('lastNotifiedBuild').then(function (last) {
      if (last === info.build) return { status: 'already', build: info.build };
      if (self.Notification && Notification.permission !== 'granted') return { status: 'no-permission', build: info.build };
      var body = (info.notes ? info.notes + '\n' : '') + 'Version ' + (info.version || '') + ' · build ' + info.build + ' — tap to update.';
      return self.registration.showNotification('Stat Brainteaser update available', {
        body: body,
        icon: new URL('icons/icon-192.png', self.registration.scope).href,
        badge: new URL('icons/favicon-32.png', self.registration.scope).href,
        tag: 'update',
        data: { url: self.registration.scope }
      }).then(function () { return metaSet('lastNotifiedBuild', info.build); })
        .then(function () { return { status: 'notified', build: info.build }; });
    });
  }).catch(function (e) { return { status: 'error', error: String(e) }; });
}

self.addEventListener('periodicsync', function (event) {
  if (event.tag === 'check-update') event.waitUntil(checkForUpdateAndNotify());
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  var url = (event.notification.data && event.notification.data.url) || self.registration.scope;
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
      for (var i = 0; i < list.length; i++) {
        if (list[i].url.indexOf(self.registration.scope) === 0 && 'focus' in list[i]) return list[i].focus();
      }
      return self.clients.openWindow ? self.clients.openWindow(url) : null;
    })
  );
});

self.addEventListener('message', function (event) {
  var data = event.data || {};
  var port = event.ports && event.ports[0];
  if (data.type === 'SKIP_WAITING') self.skipWaiting();
  if (data.type === 'GET_VERSION' && port) port.postMessage({ version: VERSION, build: BUILD, cache: CACHE });
  // Lets the page (and tests) run the same code path periodic sync uses.
  if (data.type === 'CHECK_UPDATE_NOTIFY' && port) checkForUpdateAndNotify().then(function (r) { port.postMessage(r); });
  if (data.type === 'MARK_NOTIFIED' && data.build) metaSet('lastNotifiedBuild', data.build);
});

self.addEventListener('fetch', function (event) {
  var req = event.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  // Coding lab runtime (cross-origin, pinned): cache-first in its own cache so the lab works offline after one download.
  if (req.url.indexOf(PYODIDE_BASE) === 0) {
    event.respondWith(
      caches.open(PYODIDE_CACHE).then(function (cache) {
        return cache.match(req.url, { ignoreVary: true }).then(function (hit) {
          if (hit) return hit;
          // jsdelivr sends CORS headers: fetch in cors mode so the response is readable (not opaque) and safe to cache
          return fetch(req.url, { mode: 'cors', credentials: 'omit' }).then(function (res) {
            if (res && res.ok && res.status === 200) cache.put(req.url, res.clone()).catch(function () {});
            return res;
          });
        });
      })
    );
    return;
  }
  if (url.origin !== self.location.origin) return;
  // version.json: straight to the network, never cached
  for (var i = 0; i < NO_CACHE.length; i++) {
    if (url.pathname.slice(-NO_CACHE[i].length - 1) === '/' + NO_CACHE[i]) return;
  }

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
