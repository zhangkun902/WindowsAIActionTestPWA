const CACHE_NAME = 'pwa-demo-v1';
const BASE_PATH = '/WindowsAIActionTestPWA';
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
  console.log('Request method:', event.request.method);
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
          console.log('Text data received:');
          console.log('title:', data.title);
          console.log('text:', data.text);
          console.log('url:', data.url);

          // Get all files from form data
          const files = data.url.toLowerCase().startsWith('web+pwa')
            ? formData.getAll('windowsActionFiles')
            : formData.getAll('media');
          console.log('Files received:', files.map(f => ({ name: f.name, type: f.type })));

          // Convert files to array buffers and create transferable objects
          const processedFiles = await Promise.all(files.map(async file => {
            // Read the file data
            const arrayBuffer = await file.arrayBuffer();
            
            return {
              buffer: arrayBuffer,
              type: file.type,
              name: file.name,
              size: file.size,
              lastModified: file.lastModified
            };
          }));

          // Get the client and send the data
          const client = await self.clients.get(event.resultingClientId);
          if (client) {
            // Create array of transferable objects (the array buffers)
            const transferables = processedFiles.map(file => file.buffer);
            
            // Send the data using structured clone algorithm with transferables
            client.postMessage({
              type: 'SHARE_TARGET_DATA',
              data: data,
              files: processedFiles
            }, transferables);

            console.log('Sent to client:', {
              data,
              fileCount: processedFiles.length,
              fileTypes: processedFiles.map(f => f.type)
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
