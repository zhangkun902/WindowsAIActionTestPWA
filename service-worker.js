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
        // Create a data object to store the shared content
        const data = {
          title: formData.get('title') || '',
          text: formData.get('text') || '',
          url: formData.get('url') || '',
          files: {
            images: [],
            documents: [],
            media: []
          }
        };

        console.log('Form data received:', formData);

        // Process all files from the form data
        const files = Array.from(formData.getAll('media') || []);
        console.log('Files received:', files.map(f => ({ name: f.name, type: f.type })));
        await Promise.all(files.map(async (file) => {
          const blob = await file.arrayBuffer().then(buffer => new Blob([buffer], { type: file.type }));
          const url = URL.createObjectURL(blob);
          const fileData = {
            url,
            name: file.name,
            type: file.type,
            size: file.size,
            lastModified: file.lastModified
          };

          console.log('Processing file:', file.name, file.type);
          
          // Categorize file based on its type
          if (file.type.startsWith('image/')) {
            data.files.images.push(fileData);
            console.log('Added as image:', fileData);
          } else if (file.type.startsWith('video/') || file.type.startsWith('audio/')) {
            data.files.media.push(fileData);
            console.log('Added as media:', fileData);
          } else {
            data.files.documents.push(fileData);
            console.log('Added as document:', fileData);
          }
        }));

        console.log('Final processed data:', {
          ...data,
          files: {
            images: data.files.images.length,
            documents: data.files.documents.length,
            media: data.files.media.length
          }
        });

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
