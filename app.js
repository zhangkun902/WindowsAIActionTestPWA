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
  let filesHtml = '';

  // Handle images
  if (data.files?.images?.length > 0) {
    filesHtml += `
      <div class="shared-files images">
        <h4>Shared Images:</h4>
        <div class="image-grid">
          ${data.files.images.map(file => `
            <div class="image-item">
              <img src="${file.url}" alt="${file.name}" title="${file.name}">
              <div class="file-info">
                <span>${file.name}</span>
                <span>${(file.size / 1024).toFixed(1)} KB</span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  // Handle documents
  if (data.files?.documents?.length > 0) {
    filesHtml += `
      <div class="shared-files documents">
        <h4>Shared Documents:</h4>
        <ul class="document-list">
          ${data.files.documents.map(file => `
            <li>
              <a href="${file.url}" download="${file.name}" class="document-link">
                <span class="file-name">${file.name}</span>
                <span class="file-info">${file.type} - ${(file.size / 1024).toFixed(1)} KB</span>
              </a>
            </li>
          `).join('')}
        </ul>
      </div>
    `;
  }

  // Handle media files
  if (data.files?.media?.length > 0) {
    filesHtml += `
      <div class="shared-files media">
        <h4>Shared Media:</h4>
        <div class="media-list">
          ${data.files.media.map(file => {
            if (file.type.startsWith('video/')) {
              return `
                <div class="media-item">
                  <video controls>
                    <source src="${file.url}" type="${file.type}">
                    Your browser does not support the video tag.
                  </video>
                  <div class="file-info">
                    <span>${file.name}</span>
                    <span>${(file.size / 1024).toFixed(1)} KB</span>
                  </div>
                </div>
              `;
            } else if (file.type.startsWith('audio/')) {
              return `
                <div class="media-item">
                  <audio controls>
                    <source src="${file.url}" type="${file.type}">
                    Your browser does not support the audio tag.
                  </audio>
                  <div class="file-info">
                    <span>${file.name}</span>
                    <span>${(file.size / 1024).toFixed(1)} KB</span>
                  </div>
                </div>
              `;
            }
          }).join('')}
        </div>
      </div>
    `;
  }

  // Display text and URL if present
  const textContent = [];
  if (data.title) textContent.push(`<strong>Title:</strong> ${data.title}`);
  if (data.text) textContent.push(`<strong>Text:</strong> ${data.text}`);
  if (data.url) textContent.push(`<strong>URL:</strong> <a href="${data.url}" target="_blank">${data.url}</a>`);

  shareContent.innerHTML = `
    <div class="received-data">
      <h3>Received Shared Data:</h3>
      ${textContent.length ? `<div class="text-content">${textContent.join('<br>')}</div>` : ''}
      ${filesHtml}
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
      `${window.location.origin}/WindowsAIAction/?protocol=%s`,
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
