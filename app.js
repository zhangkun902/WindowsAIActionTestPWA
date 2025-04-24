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
    const mediaDisplay = document.querySelector('.media-display');

    if (!mediaDisplay) {
      console.error('Preview elements not found');
      return;
    }

    // Clear previous content
    mediaDisplay.innerHTML = '';

    console.log('Handling shared files:', fileData);

    for (const file of fileData) {
      try {
        // Create a blob from the array buffer
        const blob = new Blob([file.buffer], { type: file.type });
        const fileURL = URL.createObjectURL(blob);
        console.log('Created blob URL for:', file.name, fileURL);

        if (file.type.startsWith('image/')) {
          // Image editor: draw image to canvas and show toolbar
          const imageToolbar = document.querySelector('.image-editor-toolbar');
          const imageCanvas = document.getElementById('image-editor-canvas');
          if (imageToolbar) imageToolbar.style.display = '';
          if (imageCanvas) imageCanvas.style.display = '';
        
          const img = new window.Image();
          img.onload = () => {
            if (typeof window.setImageEditorImage === "function") {
              window.setImageEditorImage(fileURL, file.name.replace(/\.[^.]+$/, ''));
            }
          };
          img.src = fileURL;
        
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

  // Image editor toolbar logic
  const imageCanvas = document.getElementById('image-editor-canvas');
  const rotateLeftBtn = document.getElementById('rotate-left-btn');
  const rotateRightBtn = document.getElementById('rotate-right-btn');
  const brightnessBtn = document.getElementById('brightness-btn');
  const cropBtn = document.getElementById('crop-btn');
  const downloadImgBtn = document.getElementById('download-img-btn');

  let currentImageDataUrl = null;
  let currentRotation = 0;
  let currentBrightness = 1;

  function redrawImageOnCanvas() {
    if (!imageCanvas || !currentImageDataUrl) return;
    const img = new window.Image();
    img.onload = () => {
      // Set canvas size based on rotation
      let w = img.width;
      let h = img.height;
      let angle = (currentRotation % 360 + 360) % 360;
      if (angle === 90 || angle === 270) {
        imageCanvas.width = h;
        imageCanvas.height = w;
      } else {
        imageCanvas.width = w;
        imageCanvas.height = h;
      }
      const ctx = imageCanvas.getContext('2d');
      ctx.save();
      ctx.clearRect(0, 0, imageCanvas.width, imageCanvas.height);
      ctx.translate(imageCanvas.width / 2, imageCanvas.height / 2);
      ctx.rotate((currentRotation * Math.PI) / 180);
      ctx.filter = `brightness(${currentBrightness})`;
      ctx.drawImage(img, -w / 2, -h / 2, w, h);
      ctx.restore();
    };
    img.src = currentImageDataUrl;
  }

  if (rotateLeftBtn) rotateLeftBtn.onclick = () => {
    currentRotation -= 90;
    redrawImageOnCanvas();
  };
  if (rotateRightBtn) rotateRightBtn.onclick = () => {
    currentRotation += 90;
    redrawImageOnCanvas();
  };
  if (brightnessBtn) brightnessBtn.onclick = () => {
    currentBrightness = currentBrightness >= 2 ? 0.5 : currentBrightness + 0.5;
    redrawImageOnCanvas();
  };
  if (cropBtn) cropBtn.onclick = () => {
    if (!imageCanvas || !currentImageDataUrl) return;
    const img = new window.Image();
    img.onload = () => {
      const minSide = Math.min(img.width, img.height);
      const sx = (img.width - minSide) / 2;
      const sy = (img.height - minSide) / 2;
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = minSide;
      tempCanvas.height = minSide;
      const ctx = tempCanvas.getContext('2d');
      ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, minSide, minSide);
      currentImageDataUrl = tempCanvas.toDataURL('image/png');
      currentRotation = 0;
      currentBrightness = 1;
      redrawImageOnCanvas();
    };
    img.src = currentImageDataUrl;
  };
  if (downloadImgBtn) downloadImgBtn.onclick = () => {
    if (!imageCanvas) return;
    const link = document.createElement('a');
    link.download = (imageCanvas.dataset.filename || 'image') + '-edited.png';
    link.href = imageCanvas.toDataURL('image/png');
    link.click();
  };

  // When a new image is loaded, store its src in variable and reset transforms
  window.setImageEditorImage = function(dataUrl, filename) {
    currentImageDataUrl = dataUrl;
    currentRotation = 0;
    currentBrightness = 1;
    if (imageCanvas) {
      imageCanvas.dataset.filename = filename || 'image';
    }
    redrawImageOnCanvas();
  };
});
