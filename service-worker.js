const CACHE_NAME = 'pwa-demo-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

// Install event - cache assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key !== CACHE_NAME)
        .map(key => caches.delete(key))
    ))
  );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', event => {
  // Handle share target requests
  if (event.request.url.includes('/share-target/')) {
    event.respondWith(Response.redirect('/?share=true'));
    event.waitUntil(
      (async () => {
        const formData = await event.request.formData();
        const data = {
          title: formData.get('title') || '',
          text: formData.get('text') || '',
          url: formData.get('url') || ''
        };

        // Store the shared data
        const client = await self.clients.get(event.resultingClientId);
        client.postMessage({ type: 'SHARE_TARGET_DATA', data });
      })()
    );
    return;
  }

  // Handle normal requests
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});
