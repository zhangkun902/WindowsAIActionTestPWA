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
    const documentDisplay = document.querySelector('.document-display');

    if (!mediaDisplay) {
      console.error('Preview elements not found');
      return;
    }

    // Clear previous content
    mediaDisplay.innerHTML = '';
    documentDisplay.innerHTML = '';

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
} else if (file.type === 'application/pdf') {
  const docContainer = document.createElement('div');
  docContainer.className = 'media-wrapper';
  
  const iframe = document.createElement('iframe');
  iframe.src = fileURL;
  iframe.className = 'pdf-viewer';
  
  const info = document.createElement('div');
  info.className = 'file-info';
  info.innerHTML = `
    <span class="file-name">${file.name}</span>
    <span class="file-size">${formatFileSize(file.buffer.byteLength)}</span>
  `;
  
  docContainer.appendChild(iframe);
  docContainer.appendChild(info);
  documentDisplay.appendChild(docContainer);
} else if (file.type === 'text/plain') {
const docContainer = document.createElement('div');
docContainer.className = 'media-wrapper';

const reader = new FileReader();
reader.onload = function(e) {
  const pre = document.createElement('pre');
  pre.className = 'text-content';
  pre.textContent = e.target.result;
  
  const info = document.createElement('div');
  info.className = 'file-info';
  info.innerHTML = `
    <span class="file-name">${file.name}</span>
    <span class="file-size">${formatFileSize(file.buffer.byteLength)}</span>
  `;
  
  docContainer.appendChild(pre);
  docContainer.appendChild(info);
  documentDisplay.appendChild(docContainer);
};
reader.readAsText(blob);
} else if (file.type === 'application/msword' ||
        file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
const docContainer = document.createElement('div');
docContainer.className = 'media-wrapper';

const downloadBtn = document.createElement('a');
downloadBtn.href = fileURL;
downloadBtn.download = file.name;
downloadBtn.className = 'download-button';
downloadBtn.innerHTML = `
  <span class="download-icon">⬇️</span>
  <span>Download ${file.name}</span>
`;

const info = document.createElement('div');
info.className = 'file-info';
info.innerHTML = `
  <span class="file-name">${file.name}</span>
  <span class="file-size">${formatFileSize(file.buffer.byteLength)}</span>
  <span class="file-note">Word documents can't be previewed directly. Please download to view.</span>
`;

docContainer.appendChild(downloadBtn);
docContainer.appendChild(info);
documentDisplay.appendChild(docContainer);
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
    
    // Add shared text to text editor if available
    if (data.text) {
      const editor = document.getElementById('text-editor-content');
      if (editor) {
        // Append text to existing content
        const existingContent = editor.innerHTML;
        const newContent = existingContent + (existingContent ? '<br><br>' : '') + data.text;
        editor.innerHTML = newContent;
      }
    }

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
  // Interactive crop mode
  let cropMode = false;
  let cropStart = null;
  let cropEnd = null;

  if (cropBtn) cropBtn.onclick = () => {
    if (!imageCanvas || !currentImageDataUrl) return;
    cropMode = !cropMode;
    if (cropMode) {
      cropBtn.textContent = "✅";
      imageCanvas.style.cursor = "crosshair";
    } else {
      cropBtn.textContent = "✂️";
      imageCanvas.style.cursor = "";
      cropStart = null;
      cropEnd = null;
      redrawImageOnCanvas();
    }
  };

  // Canvas crop interaction
  if (imageCanvas) {
    imageCanvas.onmousedown = (e) => {
      if (!cropMode) return;
      const rect = imageCanvas.getBoundingClientRect();
      cropStart = {
        x: Math.round((e.clientX - rect.left) * (imageCanvas.width / rect.width)),
        y: Math.round((e.clientY - rect.top) * (imageCanvas.height / rect.height))
      };
      cropEnd = null;
    };
    imageCanvas.onmousemove = (e) => {
      if (!cropMode || !cropStart) return;
      const rect = imageCanvas.getBoundingClientRect();
      cropEnd = {
        x: Math.round((e.clientX - rect.left) * (imageCanvas.width / rect.width)),
        y: Math.round((e.clientY - rect.top) * (imageCanvas.height / rect.height))
      };
      // Draw overlay
      redrawImageOnCanvas();
      const ctx = imageCanvas.getContext('2d');
      ctx.save();
      ctx.strokeStyle = "#2196F3";
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      const x = Math.min(cropStart.x, cropEnd.x);
      const y = Math.min(cropStart.y, cropEnd.y);
      const w = Math.abs(cropEnd.x - cropStart.x);
      const h = Math.abs(cropEnd.y - cropStart.y);
      ctx.strokeRect(x, y, w, h);
      ctx.restore();
    };
    imageCanvas.onmouseup = (e) => {
      if (!cropMode || !cropStart) return;
      const rect = imageCanvas.getBoundingClientRect();
      cropEnd = {
        x: Math.round((e.clientX - rect.left) * (imageCanvas.width / rect.width)),
        y: Math.round((e.clientY - rect.top) * (imageCanvas.height / rect.height))
      };
      // Perform crop
      const x = Math.min(cropStart.x, cropEnd.x);
      const y = Math.min(cropStart.y, cropEnd.y);
      const w = Math.abs(cropEnd.x - cropStart.x);
      const h = Math.abs(cropEnd.y - cropStart.y);
      if (w > 0 && h > 0) {
        const img = new window.Image();
        img.onload = () => {
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = w;
          tempCanvas.height = h;
          const ctx = tempCanvas.getContext('2d');
          ctx.drawImage(img, x, y, w, h, 0, 0, w, h);
          currentImageDataUrl = tempCanvas.toDataURL('image/png');
          currentRotation = 0;
          currentBrightness = 1;
          cropMode = false;
          cropBtn.textContent = "✂️";
          imageCanvas.style.cursor = "";
          cropStart = null;
          cropEnd = null;
          redrawImageOnCanvas();
        };
        img.src = currentImageDataUrl;
      }
    };
  }
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

  // Text editor functionality
  const boldBtn = document.getElementById('bold-btn');
  const italicBtn = document.getElementById('italic-btn');
  const underlineBtn = document.getElementById('underline-btn');
  const clearFormatBtn = document.getElementById('clear-format-btn');
  const saveBtn = document.getElementById('save-text-btn');
  const editor = document.getElementById('text-editor-content');

  // Format buttons
  boldBtn?.addEventListener('click', () => document.execCommand('bold', false, null));
  italicBtn?.addEventListener('click', () => document.execCommand('italic', false, null));
  underlineBtn?.addEventListener('click', () => document.execCommand('underline', false, null));
  
  // Clear formatting
  clearFormatBtn?.addEventListener('click', () => {
    const text = editor.innerText;
    editor.innerHTML = text;
  });

  // Save functionality
  saveBtn?.addEventListener('click', () => {
    try {
      const content = editor.innerHTML;
      const blob = new Blob([content], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'editor-content.html';
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error saving content:', error);
    }
  });
});
