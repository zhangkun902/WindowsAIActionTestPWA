const CACHE_NAME = 'pwa-demo-v1';
const BASE_PATH = '/WindowsAIAction';
const ASSETS = [
  `${BASE_PATH}/`,
  `${BASE_PATH}/index.html`,
  `${BASE_PATH}/styles.css`,
  `${BASE_PATH}/app.js`,
  `${BASE_PATH}/share-test.html`
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
    event.respondWith(Response.redirect(`${BASE_PATH}/?share=true`));
    event.waitUntil(
      (async () => {
        const formData = await event.request.formData();
        // Process form data including files
        const data = {
          title: formData.get('title') || '',
          text: formData.get('text') || '',
          url: formData.get('url') || '',
          files: {
            images: formData.getAll('images'),
            documents: formData.getAll('documents'),
            media: formData.getAll('media')
          }
        };

        // Convert files to object URLs
        if (data.files.images.length) {
          data.files.images = await Promise.all(
            data.files.images.map(async file => ({
              url: URL.createObjectURL(file),
              name: file.name,
              type: file.type,
              size: file.size
            }))
          );
        }
        if (data.files.documents.length) {
          data.files.documents = await Promise.all(
            data.files.documents.map(async file => ({
              url: URL.createObjectURL(file),
              name: file.name,
              type: file.type,
              size: file.size
            }))
          );
        }
        if (data.files.media.length) {
          data.files.media = await Promise.all(
            data.files.media.map(async file => ({
              url: URL.createObjectURL(file),
              name: file.name,
              type: file.type,
              size: file.size
            }))
          );
        }

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
