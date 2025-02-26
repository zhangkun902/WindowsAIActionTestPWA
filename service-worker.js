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
        try {
          const formData = await event.request.formData();
          
          // Extract text data
          const data = {
            title: formData.get('title') || '',
            text: formData.get('text') || '',
            url: formData.get('url') || ''
          };

          // Get all files from form data
          const files = Array.from(formData.getAll('media') || []);
          console.log('Files received:', files.map(f => ({ name: f.name, type: f.type })));

          // Convert files to proper File objects
          const processedFiles = await Promise.all(files.map(async (file) => {
            const arrayBuffer = await file.arrayBuffer();
            return new File([arrayBuffer], file.name, {
              type: file.type,
              lastModified: file.lastModified
            });
          }));

          // Get the client and send the data
          const client = await self.clients.get(event.resultingClientId);
          if (client) {
            client.postMessage({
              type: 'SHARE_TARGET_DATA',
              data: data,
              files: processedFiles
            });

            console.log('Sent to client:', {
              data,
              fileCount: processedFiles.length
            });
          } else {
            console.error('No client found to send the data to');
          }
        } catch (error) {
          console.error('Error processing share target:', error);
        }
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
