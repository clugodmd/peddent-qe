// PedBoards QE — Service Worker
// Strategy: Network-first for HTML/JS/CSS (always fresh), cache-first for images/fonts
// Auto-updates silently: when a new version is detected, reload all open tabs automatically.

const CACHE_VERSION = 'peddent-qe-v4';
const STATIC_ASSETS = ['/manifest.json', '/favicon.svg', '/apple-touch-icon.png'];

// ── Install: pre-cache static assets only ─────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(STATIC_ASSETS).catch(() => {}))
  );
  // Activate immediately — don't wait for old tabs to close
  self.skipWaiting();
});

// ── Activate: wipe old caches, claim all clients ──────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// ── Fetch: network-first for app shell; cache-first for images/fonts ──────
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Never intercept Firebase Auth redirects or Google identity
  if (
    url.pathname.startsWith('/__/auth') ||
    url.hostname.includes('googleapis.com') ||
    url.hostname.includes('gstatic.com') ||
    url.hostname.includes('accounts.google.com') ||
    url.hostname.includes('firebaseapp.com')
  ) {
    return;
  }

  // Always go to network for the app HTML + JS/CSS bundles (versioned filenames cover this)
  // Network-first: try network, fall back to cache, never serve stale HTML
  const isAppShell = url.pathname === '/' || url.pathname.endsWith('.html');
  const isAsset    = /\.(js|css)$/.test(url.pathname);
  const isMedia    = /\.(png|jpg|jpeg|svg|gif|webp|woff2?|ttf)$/.test(url.pathname);

  if (isAppShell || isAsset) {
    // Network-first: always try to get fresh, fall back to cache for offline
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  if (isMedia) {
    // Cache-first for images/fonts — these don't change often
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // Everything else: network only (API calls, Firebase, etc.)
  event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
});

// ── Auto-update message: tell all clients to reload when new SW activates ─
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Notify all open tabs to reload silently after new SW takes over
self.addEventListener('activate', (event) => {
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      clients.forEach((client) => client.postMessage({ type: 'SW_UPDATED' }));
    })
  );
});
