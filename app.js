// Handle protocol handler
function handleProtocolLaunch() {
  const params = new URLSearchParams(window.location.search);
  const protocolData = params.get('protocol');
  
  if (protocolData) {
    const protocolContent = document.getElementById('protocol-content');
    protocolContent.innerHTML = `
      <div class="received-data">
        <h3>Received Protocol Data:</h3>
        <pre>${protocolData}</pre>
      </div>
    `;
  }
}

// Handle shared data
function handleSharedData(data) {
  const shareContent = document.getElementById('share-content');
  shareContent.innerHTML = `
    <div class="received-data">
      <h3>Received Shared Data:</h3>
      <pre>${JSON.stringify(data, null, 2)}</pre>
    </div>
  `;
}

// Listen for messages from service worker
navigator.serviceWorker.addEventListener('message', event => {
  if (event.data.type === 'SHARE_TARGET_DATA') {
    handleSharedData(event.data.data);
  }
});

// Register protocol handler
if ('registerProtocolHandler' in navigator) {
  try {
    navigator.registerProtocolHandler('web+pwa',
      `${window.location.origin}/?protocol=%s`,
      'PWA Protocol Handler'
    );
  } catch (err) {
    console.error('Protocol handler registration failed:', err);
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  handleProtocolLaunch();
});
