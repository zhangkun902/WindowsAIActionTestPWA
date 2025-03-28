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

// Handle files from share target API
async function handleSharedFiles(fileData) {
  try {
    const imageDisplay = document.querySelector('.image-display');
    const mediaDisplay = document.querySelector('.media-display');

    if (!imageDisplay || !mediaDisplay) {
      console.error('Preview elements not found');
      return;
    }

    // Clear previous content
    imageDisplay.innerHTML = '';
    mediaDisplay.innerHTML = '';

    console.log('Handling shared files:', fileData);

    for (const file of fileData) {
      try {
        // Create a blob from the array buffer
        const blob = new Blob([file.buffer], { type: file.type });
        const fileURL = URL.createObjectURL(blob);
        console.log('Created blob URL for:', file.name, fileURL);

        if (file.type.startsWith('image/')) {
          const imgContainer = document.createElement('div');
          imgContainer.className = 'image-container';

          const img = document.createElement('img');
          img.src = fileURL;
          img.alt = file.name;
          img.title = file.name;
          img.onclick = () => openFullscreen(img);

          const info = document.createElement('div');
          info.className = 'image-info';
          info.innerHTML = `
            <span class="file-name">${file.name}</span>
            <span class="file-size">${formatFileSize(file.buffer.byteLength)}</span>
          `;

          imgContainer.appendChild(img);
          imgContainer.appendChild(info);
          imageDisplay.appendChild(imgContainer);

        } else if (file.type.startsWith('video/')) {
          const videoContainer = document.createElement('div');
          videoContainer.className = 'media-wrapper';

          const video = document.createElement('video');
          video.controls = true;
          video.src = fileURL;

          const info = document.createElement('div');
          info.className = 'file-info';
          info.innerHTML = `
            <span class="file-name">${file.name}</span>
            <span class="file-size">${formatFileSize(file.buffer.byteLength)}</span>
          `;

          videoContainer.appendChild(video);
          videoContainer.appendChild(info);
          mediaDisplay.appendChild(videoContainer);
        }
      } catch (error) {
        console.error('Error processing file:', file.name, error);
      }
    }
  } catch (error) {
    console.error('Error handling shared files:', error);
  }
}

// Handle shared data
function handleSharedData(data) {
  try {
    const shareContent = document.getElementById('share-content');
    
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

  } catch (error) {
    console.error('Error handling shared data:', error);
    const shareContent = document.getElementById('share-content');
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
    console.log('Received message from service worker:', event.data);
    
    // Handle text data
    handleSharedData(event.data.data);
    
    // Handle files if present
    if (event.data.files && Array.isArray(event.data.files)) {
      handleSharedFiles(event.data.files);
    }

    // Cleanup on page unload
    window.addEventListener('unload', () => {
      try {
        const elements = document.querySelectorAll('img[src^="blob:"], video[src^="blob:"]');
        elements.forEach(element => {
          if (element.src.startsWith('blob:')) {
            URL.revokeObjectURL(element.src);
          }
        });
      } catch (error) {
        console.error('Error cleaning up blob URLs:', error);
      }
    });
  }
});

// Register protocol handler
if ('registerProtocolHandler' in navigator) {
  try {
    navigator.registerProtocolHandler('web+pwa',
      `${window.location.origin}/WindowsAIActionTestPWA/?protocol=%s`,
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
