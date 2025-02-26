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
  try {
    const shareContent = document.getElementById('share-content');
    const imageDisplay = document.querySelector('.image-display');
    const mediaDisplay = document.querySelector('.media-display');

    if (!imageDisplay || !mediaDisplay) {
      console.error('Preview elements not found. Make sure the HTML structure is correct.');
      return;
    }

    console.log('Handling shared data:', data);

    // Display text content
    let textContent = '<div class="received-data">';
    if (data.title || data.text || data.url) {
      textContent += '<div class="text-content">';
      if (data.title) textContent += `<p><strong>Title:</strong> ${data.title}</p>`;
      if (data.text) textContent += `<p><strong>Text:</strong> ${data.text}</p>`;
      if (data.url) textContent += `<p><strong>URL:</strong> <a href="${data.url}" target="_blank">${data.url}</a></p>`;
      textContent += '</div>';
    }
    shareContent.innerHTML = textContent + '</div>';

    // Clear previous previews
    imageDisplay.innerHTML = '';
    mediaDisplay.innerHTML = '';

    // Handle shared files
    if (data.files) {
      // Display images in the dedicated image preview area
      if (data.files.images?.length) {
        console.log('Processing images:', data.files.images);
        const imageHtml = data.files.images.map(file => {
          console.log('Creating image element for:', file);
          return `
            <div class="image-container">
              <img src="${file.url}" 
                   alt="${file.name}" 
                   onClick="openFullscreen(this)" 
                   title="${file.name} (${formatFileSize(file.size)})"
                   onerror="console.error('Failed to load image:', '${file.name}')">
              <div class="image-info">
                <span class="file-name">${file.name}</span>
                <span class="file-size">${formatFileSize(file.size)}</span>
              </div>
            </div>
          `;
        }).join('');
        console.log('Setting image HTML:', imageHtml);
        imageDisplay.innerHTML = imageHtml;
      } else {
        console.log('No images to display');
        imageDisplay.innerHTML = '<div class="no-content">No images shared</div>';
      }

      // Display media files in the dedicated media preview area
      if (data.files.media?.length) {
        mediaDisplay.innerHTML = data.files.media.map(file => {
          if (file.type.startsWith('video/')) {
            return `
              <div class="media-wrapper">
                <video controls>
                  <source src="${file.url}" type="${file.type}">
                  Your browser does not support video playback.
                </video>
                <div class="file-info">
                  <span class="file-name">${file.name}</span>
                  <span class="file-size">${formatFileSize(file.size)}</span>
                </div>
              </div>
            `;
          } else if (file.type.startsWith('audio/')) {
            return `
              <div class="media-wrapper audio">
                <audio controls>
                  <source src="${file.url}" type="${file.type}">
                  Your browser does not support audio playback.
                </audio>
                <div class="file-info">
                  <span class="file-name">${file.name}</span>
                  <span class="file-size">${formatFileSize(file.size)}</span>
                </div>
              </div>
            `;
          }
          return '';
        }).join('');
      }

      // Display documents in the text content area
      if (data.files.documents?.length) {
        shareContent.innerHTML += `
          <div class="files-section">
            <h4>Shared Documents</h4>
            <div class="document-list">
              ${data.files.documents.map(file => `
                <a href="${file.url}" download="${file.name}" class="document-item">
                  <span class="document-icon">📄</span>
                  <span class="file-name">${file.name}</span>
                  <span class="file-info">${file.type} • ${formatFileSize(file.size)}</span>
                </a>
              `).join('')}
            </div>
          </div>
        `;
      }
    }
  } catch (error) {
    console.error('Error handling shared data:', error);
    if (shareContent) {
      shareContent.innerHTML = `
        <div class="error-message">
          Error displaying shared content. Please try again.
        </div>
      `;
    }
  }
}

// Function to open image in fullscreen
function openFullscreen(img) {
  if (img.requestFullscreen) {
    img.requestFullscreen();
  } else if (img.webkitRequestFullscreen) { // Safari
    img.webkitRequestFullscreen();
  } else if (img.msRequestFullscreen) { // IE11
    img.msRequestFullscreen();
  }
}

// Function to format file size
function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  else return (bytes / 1048576).toFixed(1) + ' MB';
}

// Listen for messages from service worker
navigator.serviceWorker.addEventListener('message', event => {
  if (event.data.type === 'SHARE_TARGET_DATA') {
    handleSharedData(event.data.data);
    // Revoke object URLs when they're no longer needed
    if (event.data.data.files) {
      window.addEventListener('unload', () => {
        Object.values(event.data.data.files).flat().forEach(file => {
          if (file.url && file.url.startsWith('blob:')) {
            URL.revokeObjectURL(file.url);
          }
        });
      });
    }
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
