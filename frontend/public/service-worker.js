/* ═══════════════════════════════════════════════════════════════════════════
   SafeHer Service Worker
   - Caches app shell for offline use
   - Queues failed SOS requests and replays when online
   ═══════════════════════════════════════════════════════════════════════════ */

const CACHE_NAME = 'safeher-v1';
const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.json',
];

// ── INSTALL — cache app shell ────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching app shell');
      return cache.addAll(APP_SHELL);
    })
  );
  self.skipWaiting();
});

// ── ACTIVATE — clean old caches ──────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ── FETCH — network-first for API, cache-first for static assets ─────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Don't cache POST/PUT/DELETE or non-same-origin requests
  if (request.method !== 'GET') return;

  // API calls → network-first
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          // Cache successful API GETs for offline fallback
          const clone = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(request, clone));
          return res;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Static assets → cache-first
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((res) => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(request, clone));
        }
        return res;
      });
    })
  );
});

// ── BACKGROUND SYNC — replay failed SOS requests ────────────────────────────
self.addEventListener('sync', (event) => {
  if (event.tag === 'sos-sync') {
    event.waitUntil(replaySosQueue());
  }
});

async function replaySosQueue() {
  try {
    const db = await openSosDB();
    const tx = db.transaction('sos-queue', 'readwrite');
    const store = tx.objectStore('sos-queue');
    const allRequests = await storeGetAll(store);

    for (const entry of allRequests) {
      try {
        await fetch('/api/incidents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(entry.data),
        });
        // Success — remove from queue
        const delTx = db.transaction('sos-queue', 'readwrite');
        delTx.objectStore('sos-queue').delete(entry.id);
        console.log('[SW] Replayed queued SOS:', entry.id);
      } catch (err) {
        console.error('[SW] Replay failed for:', entry.id, err);
      }
    }
  } catch (err) {
    console.error('[SW] replaySosQueue error:', err);
  }
}

// ── IndexedDB helpers ────────────────────────────────────────────────────────
function openSosDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('safeher-sos', 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore('sos-queue', { keyPath: 'id', autoIncrement: true });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function storeGetAll(store) {
  return new Promise((resolve, reject) => {
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// ── MESSAGE handler — queue SOS when offline ─────────────────────────────────
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'QUEUE_SOS') {
    queueSosRequest(event.data.payload);
  }
});

async function queueSosRequest(data) {
  const db = await openSosDB();
  const tx = db.transaction('sos-queue', 'readwrite');
  tx.objectStore('sos-queue').add({ data, timestamp: Date.now() });
  // Register for background sync
  if (self.registration.sync) {
    await self.registration.sync.register('sos-sync');
  }
  // Notify clients
  const clients = await self.clients.matchAll();
  clients.forEach((client) => {
    client.postMessage({ type: 'SOS_QUEUED' });
  });
}
