const CACHE_NAME = 'pwa-demo-v1';
const BASE_PATH = '.';
const ASSETS = [
  `${BASE_PATH}/`,
  `${BASE_PATH}/index.html`,
  `${BASE_PATH}/styles.css`,
  `${BASE_PATH}/app.js`,
  `${BASE_PATH}/share-test.html`,
  `${BASE_PATH}/action-error.html`
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

// Handle share target functionality
async function handleShareTarget(event) {
  try {
    const formData = await event.request.formData();
    
    // Extract text data
    const data = {
      title: formData.get('title') || '',
      text: formData.get('text') || '',
      url: formData.get('url') || ''
    };

    // Get all files from form data
    const files = data.url.toLowerCase().startsWith('web+pwa')
      ? formData.getAll('windowsActionFiles')
      : formData.getAll('media');

    // Process files
    const processedFiles = await Promise.all(files.map(async file => {
      const arrayBuffer = await file.arrayBuffer();
      return {
        buffer: arrayBuffer,
        type: file.type,
        name: file.name,
        size: file.size,
        lastModified: file.lastModified
      };
    }));

    // Find all open windows
    const allClients = await self.clients.matchAll({ 
      type: "window", 
      includeUncontrolled: true 
    });

    // 创建传输对象
    const transferables = processedFiles.map(file => file.buffer);
    const messageData = {
      type: 'SHARE_TARGET_DATA',
      data: data,
      files: processedFiles
    };

    if (allClients.length > 0) {
      const client = allClients[0];
      // Send data to the first client
      client.postMessage(messageData, transferables);
      // Return empty response to prevent navigation
      return new Response(null, {
        status: 204,
        headers: { 'Content-Type': 'text/plain' }
      });
    }

    // If no clients are open, redirect to main page and send data in background
    event.waitUntil((async () => {
      // Wait for new page to open and become available
      await new Promise(resolve => setTimeout(resolve, 300));
      const newClients = await self.clients.matchAll({ 
        type: "window", 
        includeUncontrolled: true 
      });
      if (newClients.length > 0) {
        newClients[0].postMessage(messageData, transferables);
      }
    })());

    return Response.redirect(`${BASE_PATH}/?share=true`);

  } catch (error) {
    console.error('Error processing share target:', error);
    // return Response.redirect(`${BASE_PATH}/?share=true`);
  }
}

// Fetch event - serve from cache or network
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Handle share target requests
  if (url.pathname.includes('/share-target/')) {
    if (event.request.method === 'GET') {
      // Handle GET requests by redirecting to error page
      event.respondWith(Response.redirect(`${BASE_PATH}/action-error.html`));
      return;
    }
    
    if (event.request.method === 'POST') {
      // Handle POST requests
      event.respondWith(handleShareTarget(event));
      return;
    }
  }

  // Handle normal requests
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});
