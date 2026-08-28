/* ============================================================
   Vision Studio — Basics Playground
   Interactive lab for Image Basics (Scale, Rotate, Translate, Crop)
   ============================================================ */

const BasicsPlayground = (() => {
  'use strict';

  // DOM Elements
  let dropzone, fileInput, typeSelect, controlsContainer;
  let origCanvas, procCanvas, codeBlock, copyBtn;
  let origCtx, procCtx;

  // State
  let currentImage = null; // HTMLImageElement
  let currentType = 'scale';

  // Current Parameters
  let params = {
    scale: 1.5,
    rotate: 45,
    tx: 50,
    ty: 50,
    crop: { x: 0.25, y: 0.25, w: 0.5, h: 0.5 }
  };

  // Drag state for crop
  let isDraggingCrop = false;
  let cropStartX = 0, cropStartY = 0;
  let cropOverlay = null;

  function init() {
    // Check if we are on the right page
    dropzone = document.getElementById('basics-playground-dropzone');
    if (!dropzone) return;

    fileInput = document.getElementById('basics-playground-file-input');
    typeSelect = document.getElementById('basics-playground-type-select');
    controlsContainer = document.getElementById('basics-playground-controls');
    
    origCanvas = document.getElementById('basics-playground-original');
    procCanvas = document.getElementById('basics-playground-processed');
    codeBlock = document.getElementById('basics-playground-code');
    copyBtn = document.getElementById('basics-playground-copy-code');

    origCtx = origCanvas.getContext('2d');
    procCtx = procCanvas.getContext('2d');

    // Event Listeners
    setupDropzone();
    typeSelect.addEventListener('change', handleTypeChange);
    copyBtn.addEventListener('click', copyCode);
    
    document.getElementById('basics-playground-reset').addEventListener('click', () => {
      resetParams();
      renderControls();
      processImage();
    });

    // Handle crop events on original canvas
    setupCropEvents();

    // Initial render
    loadSampleImage();
  }

  /* ----------------------------------------------------------
   * Dropzone & File Handling
   * ---------------------------------------------------------- */
  function setupDropzone() {
    dropzone.addEventListener('click', () => fileInput.click());

    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.classList.add('drag-over');
    });

    ['dragleave', 'dragend'].forEach(type => {
      dropzone.addEventListener(type, () => {
        dropzone.classList.remove('drag-over');
      });
    });

    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('drag-over');
      if (e.dataTransfer.files.length) {
        handleFile(e.dataTransfer.files[0]);
      }
    });

    fileInput.addEventListener('change', () => {
      if (fileInput.files.length) {
        handleFile(fileInput.files[0]);
      }
    });
  }

  function handleFile(file) {
    if (!file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        setImage(img);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  function loadSampleImage() {
    const img = new Image();
    img.onload = () => setImage(img);
    // Draw a sample image via a temporary canvas
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 300;
    tempCanvas.height = 200;
    const ctx = tempCanvas.getContext('2d');
    
    // Background sky
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, 300, 200);

    // Ground
    ctx.fillStyle = '#8FBC8F';
    ctx.fillRect(0, 140, 300, 60);

    // House
    ctx.fillStyle = '#F5DEB3';
    ctx.fillRect(50, 100, 80, 60);
    ctx.fillStyle = '#CD5C5C';
    ctx.beginPath();
    ctx.moveTo(40, 100);
    ctx.lineTo(90, 50);
    ctx.lineTo(140, 100);
    ctx.fill();

    img.src = tempCanvas.toDataURL();
  }

  function setImage(img) {
    currentImage = img;
    
    // Resize canvases to fit image (max 512)
    const MAX_DIM = 512;
    let w = img.width;
    let h = img.height;
    if (w > MAX_DIM || h > MAX_DIM) {
      const ratio = Math.min(MAX_DIM / w, MAX_DIM / h);
      w = Math.round(w * ratio);
      h = Math.round(h * ratio);
    }
    
    origCanvas.width = w;
    origCanvas.height = h;
    procCanvas.width = w;
    procCanvas.height = h;

    // Draw original
    origCtx.clearRect(0, 0, w, h);
    origCtx.drawImage(img, 0, 0, w, h);

    // Reset crop rect
    params.crop = { x: 0.25, y: 0.25, w: 0.5, h: 0.5 };

    handleTypeChange(); // Will render controls and process
  }

  /* ----------------------------------------------------------
   * UI Controls
   * ---------------------------------------------------------- */
  function resetParams() {
    params = {
      scale: 1.5,
      rotate: 45,
      tx: 50,
      ty: 50,
      crop: { x: 0.25, y: 0.25, w: 0.5, h: 0.5 }
    };
  }

  function handleTypeChange() {
    currentType = typeSelect.value;
    
    // Manage crop overlay visibility
    if (cropOverlay) {
      cropOverlay.style.display = (currentType === 'crop') ? 'block' : 'none';
    }
    origCanvas.style.cursor = (currentType === 'crop') ? 'crosshair' : 'default';

    renderControls();
    processImage();
  }

  function renderControls() {
    controlsContainer.innerHTML = '';

    if (currentType === 'scale') {
      createSlider('معامل التكبير', 'x', 0.1, 4.0, 0.1, params.scale, (val) => {
        params.scale = val;
        processImage();
      });
    } 
    else if (currentType === 'rotate') {
      createSlider('الزاوية', '°', 0, 360, 1, params.rotate, (val) => {
        params.rotate = val;
        processImage();
      });
    }
    else if (currentType === 'translate') {
      createSlider('الإزاحة الأفقية (tx)', 'px', -200, 200, 1, params.tx, (val) => {
        params.tx = val;
        processImage();
      });
      createSlider('الإزاحة العمودية (ty)', 'px', -200, 200, 1, params.ty, (val) => {
        params.ty = val;
        processImage();
      });
    }
    else if (currentType === 'crop') {
      const msg = document.createElement('p');
      msg.className = 'text-sm text-slate-500 dark:text-slate-400 text-center py-4';
      msg.textContent = 'اسحب الماوس على "الصورة الأصلية" لتحديد منطقة القص.';
      controlsContainer.appendChild(msg);
      updateCropOverlay();
    }
  }

  function createSlider(label, unit, min, max, step, initial, onChange) {
    const wrap = document.createElement('div');
    wrap.className = 'mb-4';

    const header = document.createElement('div');
    header.className = 'flex items-center justify-between mb-2';
    
    const labelEl = document.createElement('label');
    labelEl.className = 'text-sm font-medium text-slate-700 dark:text-slate-300';
    labelEl.textContent = label;

    const valEl = document.createElement('span');
    valEl.className = 'text-sm font-mono text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded';
    valEl.textContent = initial + unit;

    header.appendChild(labelEl);
    header.appendChild(valEl);

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = min;
    slider.max = max;
    slider.step = step;
    slider.value = initial;
    slider.className = 'w-full';

    slider.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      valEl.textContent = val + unit;
      onChange(val);
    });

    wrap.appendChild(header);
    wrap.appendChild(slider);
    controlsContainer.appendChild(wrap);
  }

  /* ----------------------------------------------------------
   * Crop Interaction
   * ---------------------------------------------------------- */
  function setupCropEvents() {
    // Create overlay element
    cropOverlay = document.createElement('div');
    cropOverlay.className = 'absolute border-2 border-indigo-500 bg-indigo-500/20';
    cropOverlay.style.pointerEvents = 'none';
    cropOverlay.style.display = 'none';
    
    // Find original canvas container to append overlay
    const origContainer = origCanvas.parentElement;
    origContainer.style.position = 'relative'; // Ensure relative positioning
    origContainer.appendChild(cropOverlay);

    origCanvas.addEventListener('mousedown', (e) => {
      if (currentType !== 'crop' || !currentImage) return;
      isDraggingCrop = true;
      const rect = origCanvas.getBoundingClientRect();
      cropStartX = (e.clientX - rect.left) / rect.width;
      cropStartY = (e.clientY - rect.top) / rect.height;
      
      params.crop.x = cropStartX;
      params.crop.y = cropStartY;
      params.crop.w = 0;
      params.crop.h = 0;
      updateCropOverlay();
    });

    origCanvas.addEventListener('mousemove', (e) => {
      if (!isDraggingCrop) return;
      const rect = origCanvas.getBoundingClientRect();
      const currentX = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const currentY = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
      
      params.crop.x = Math.min(cropStartX, currentX);
      params.crop.y = Math.min(cropStartY, currentY);
      params.crop.w = Math.abs(currentX - cropStartX);
      params.crop.h = Math.abs(currentY - cropStartY);
      
      updateCropOverlay();
      processImage();
    });

    const endDrag = () => {
      if (isDraggingCrop) {
        isDraggingCrop = false;
        if (params.crop.w < 0.05 || params.crop.h < 0.05) {
          params.crop = { x: 0.25, y: 0.25, w: 0.5, h: 0.5 };
          updateCropOverlay();
          processImage();
        }
      }
    };

    origCanvas.addEventListener('mouseup', endDrag);
    origCanvas.addEventListener('mouseleave', endDrag);

    // Touch Events (mobile crop support)
    origCanvas.addEventListener('touchstart', (e) => {
      if (currentType !== 'crop' || !currentImage) return;
      e.preventDefault();
      isDraggingCrop = true;
      const rect = origCanvas.getBoundingClientRect();
      const touch = e.touches[0];
      cropStartX = (touch.clientX - rect.left) / rect.width;
      cropStartY = (touch.clientY - rect.top) / rect.height;
      
      params.crop.x = cropStartX;
      params.crop.y = cropStartY;
      params.crop.w = 0;
      params.crop.h = 0;
      updateCropOverlay();
    }, { passive: false });

    origCanvas.addEventListener('touchmove', (e) => {
      if (!isDraggingCrop) return;
      e.preventDefault();
      const rect = origCanvas.getBoundingClientRect();
      const touch = e.touches[0];
      const currentX = Math.max(0, Math.min(1, (touch.clientX - rect.left) / rect.width));
      const currentY = Math.max(0, Math.min(1, (touch.clientY - rect.top) / rect.height));
      
      params.crop.x = Math.min(cropStartX, currentX);
      params.crop.y = Math.min(cropStartY, currentY);
      params.crop.w = Math.abs(currentX - cropStartX);
      params.crop.h = Math.abs(currentY - cropStartY);
      
      updateCropOverlay();
      processImage();
    }, { passive: false });

    origCanvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      endDrag();
    }, { passive: false });
    
    window.addEventListener('resize', () => {
      if (currentType === 'crop') updateCropOverlay();
    });
  }

  function updateCropOverlay() {
    if (!cropOverlay || currentType !== 'crop') return;
    
    // We base it on canvas rendered size
    const cw = origCanvas.offsetWidth;
    const ch = origCanvas.offsetHeight;
    
    cropOverlay.style.left = (params.crop.x * cw) + 'px';
    cropOverlay.style.top = (params.crop.y * ch) + 'px';
    cropOverlay.style.width = (params.crop.w * cw) + 'px';
    cropOverlay.style.height = (params.crop.h * ch) + 'px';
  }

  /* ----------------------------------------------------------
   * Processing & CodeGen
   * ---------------------------------------------------------- */
  function processImage() {
    if (!currentImage) return;

    if (currentType === 'scale') {
      BasicsProcessing.scaleImage(origCanvas, procCanvas, params.scale);
      updateCode(BasicsCodeGen.generateScale(params.scale));
    } 
    else if (currentType === 'rotate') {
      BasicsProcessing.rotateImage(origCanvas, procCanvas, params.rotate, 0.5, 0.5);
      updateCode(BasicsCodeGen.generateRotate(params.rotate));
    }
    else if (currentType === 'translate') {
      BasicsProcessing.translateImage(origCanvas, procCanvas, params.tx, params.ty);
      updateCode(BasicsCodeGen.generateTranslate(params.tx, params.ty));
    }
    else if (currentType === 'crop') {
      BasicsProcessing.cropImage(origCanvas, procCanvas, params.crop);
      updateCode(BasicsCodeGen.generateCrop(params.crop));
    }
  }

  function updateCode(pythonStr) {
    // Basic syntax highlighting
    let html = pythonStr
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    html = html.replace(/('[^']*'|"[^"]*")/g, '<span class="str">$1</span>');
    html = html.replace(/(#.*)/g, '<span class="cmt">$1</span>');
    html = html.replace(/\b(import|from|as|if|else|elif|for|while|def|return|class|pass|break|continue|None)\b(?![^<]*>)/g, '<span class="kw">$1</span>');
    html = html.replace(/\b(\d+(\.\d+)?)\b(?![^<]*>)/g, '<span class="num">$1</span>');
    html = html.replace(/\b(cv2|np|plt)\./g, '<span class="lib">$1</span>.');

    codeBlock.innerHTML = html;
  }

  function copyCode() {
    const text = codeBlock.textContent;
    navigator.clipboard.writeText(text).then(() => {
      const originalHtml = copyBtn.innerHTML;
      copyBtn.innerHTML = `
        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
        </svg>
        تم النسخ
      `;
      copyBtn.classList.add('copied');
      
      setTimeout(() => {
        copyBtn.innerHTML = originalHtml;
        copyBtn.classList.remove('copied');
      }, 2000);
    });
  }

  // Public API
  return {
    init
  };
})();
