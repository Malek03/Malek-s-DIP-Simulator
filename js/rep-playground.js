/* ============================================================
   Vision Studio — Representation Playground
   Interactive lab for Image Representation (RGB, Sampling, Quantization, Color Mix)
   ============================================================ */

const RepPlayground = (() => {
  'use strict';

  // DOM Elements
  let dropzone, fileInput, typeSelect, controlsContainer;
  let origCanvas, procCanvas, codeBlock, copyBtn;
  let origCtx, procCtx;

  // Extra Canvases
  let rgbWrap;
  let matricesWrap;

  // State
  let currentImage = null; // HTMLImageElement
  let currentType = 'rgb';

  // Current Parameters
  let params = {
    sampling: { rows: 20, cols: 20 },
    quantization: { levels: 8 },
    colormix: { rect: { x: 0.25, y: 0.25, w: 0.5, h: 0.5 }, color: '#ff0000' }
  };

  // Drag state for color mix
  let isDraggingRect = false;
  let startX = 0, startY = 0;
  let rectOverlay = null;

  function init() {
    dropzone = document.getElementById('rep-playground-dropzone');
    if (!dropzone) return;

    fileInput = document.getElementById('rep-playground-file-input');
    typeSelect = document.getElementById('rep-playground-type-select');
    controlsContainer = document.getElementById('rep-playground-controls');
    
    origCanvas = document.getElementById('rep-playground-original');
    procCanvas = document.getElementById('rep-playground-processed');
    codeBlock = document.getElementById('rep-playground-code');
    copyBtn = document.getElementById('rep-playground-copy-code');

    origCtx = origCanvas.getContext('2d');
    procCtx = procCanvas.getContext('2d');

    // Create wrapper for RGB mode inside processed container
    rgbWrap = document.createElement('div');
    rgbWrap.className = 'grid grid-cols-1 gap-2 hidden h-full';
    procCanvas.parentElement.appendChild(rgbWrap);

    for(let i=0; i<3; i++) {
      const c = document.createElement('canvas');
      c.className = 'w-full h-auto border border-slate-200 dark:border-gray-700 rounded';
      rgbWrap.appendChild(c);
    }

    // Create wrapper for Matrices
    matricesWrap = document.createElement('div');
    matricesWrap.className = 'grid grid-cols-3 gap-2 mt-4 hidden';
    
    const rMat = document.createElement('canvas'); rMat.id = 'rep-matrix-r';
    const gMat = document.createElement('canvas'); gMat.id = 'rep-matrix-g';
    const bMat = document.createElement('canvas'); bMat.id = 'rep-matrix-b';
    
    [rMat, gMat, bMat].forEach((c, idx) => {
      c.className = 'w-auto max-w-none';
      const wrapper = document.createElement('div');
      wrapper.className = 'overflow-auto max-h-[250px] border border-slate-300 dark:border-gray-600 rounded bg-white custom-scrollbar';
      wrapper.appendChild(c);
      
      const label = document.createElement('div');
      label.className = 'text-center text-xs font-bold text-white py-1';
      label.style.backgroundColor = idx === 0 ? '#ef4444' : idx === 1 ? '#22c55e' : '#3b82f6';
      label.textContent = idx === 0 ? 'الأحمر' : idx === 1 ? 'الأخضر' : 'الأزرق';
      
      const colWrap = document.createElement('div');
      colWrap.appendChild(label);
      colWrap.appendChild(wrapper);
      matricesWrap.appendChild(colWrap);
    });
    
    // Add custom scrollbar styles dynamically
    if (!document.getElementById('rep-custom-scrollbar-style')) {
      const style = document.createElement('style');
      style.id = 'rep-custom-scrollbar-style';
      style.textContent = `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #c1c1c1; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #a8a8a8; }
      `;
      document.head.appendChild(style);
    }

    procCanvas.parentElement.appendChild(matricesWrap);

    // Event Listeners
    setupDropzone();
    typeSelect.addEventListener('change', handleTypeChange);
    copyBtn.addEventListener('click', copyCode);
    
    document.getElementById('rep-playground-reset').addEventListener('click', () => {
      resetParams();
      renderControls();
      processImage();
    });

    setupRectEvents();

    // Initial render
    loadSampleImage();
  }

  function setupDropzone() {
    dropzone.addEventListener('click', () => fileInput.click());
    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.classList.add('drag-over');
    });
    ['dragleave', 'dragend'].forEach(type => {
      dropzone.addEventListener(type, () => dropzone.classList.remove('drag-over'));
    });
    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('drag-over');
      if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
    });
    fileInput.addEventListener('change', () => {
      if (fileInput.files.length) handleFile(fileInput.files[0]);
    });
  }

  function handleFile(file) {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => setImage(img);
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  function loadSampleImage() {
    const img = new Image();
    img.onload = () => setImage(img);
    // Draw a sample colorful image
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 300;
    tempCanvas.height = 200;
    const ctx = tempCanvas.getContext('2d');
    
    const grad = ctx.createLinearGradient(0, 0, 300, 200);
    grad.addColorStop(0, '#ff9a9e');
    grad.addColorStop(1, '#a1c4fd');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 300, 200);

    ctx.fillStyle = '#ff0000';
    ctx.beginPath();
    ctx.arc(100, 100, 50, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#00ff00';
    ctx.fillRect(160, 50, 80, 80);

    img.src = tempCanvas.toDataURL();
  }

  function setImage(img) {
    currentImage = img;
    const MAX_DIM = 512;
    let w = img.width, h = img.height;
    if (w > MAX_DIM || h > MAX_DIM) {
      const ratio = Math.min(MAX_DIM / w, MAX_DIM / h);
      w = Math.round(w * ratio);
      h = Math.round(h * ratio);
    }
    
    origCanvas.width = w;
    origCanvas.height = h;
    procCanvas.width = w;
    procCanvas.height = h;

    origCtx.clearRect(0, 0, w, h);
    origCtx.drawImage(img, 0, 0, w, h);

    handleTypeChange();
  }

  function resetParams() {
    params = {
      sampling: { rows: 20, cols: 20 },
      quantization: { levels: 8 },
      colormix: { rect: { x: 0.25, y: 0.25, w: 0.5, h: 0.5 }, color: '#ff0000' }
    };
  }

  function handleTypeChange() {
    currentType = typeSelect.value;
    
    if (rectOverlay) {
      rectOverlay.style.display = (currentType === 'colormix') ? 'block' : 'none';
    }
    origCanvas.style.cursor = (currentType === 'colormix') ? 'crosshair' : 'default';

    if (currentType === 'rgb') {
      procCanvas.style.display = 'none';
      rgbWrap.classList.remove('hidden');
      matricesWrap.classList.add('hidden');
    } else {
      procCanvas.style.display = 'block';
      rgbWrap.classList.add('hidden');
      if (currentType !== 'quantization') matricesWrap.classList.add('hidden');
    }

    renderControls();
    processImage();
  }

  function renderControls() {
    controlsContainer.innerHTML = '';

    if (currentType === 'rgb') {
      const msg = document.createElement('p');
      msg.className = 'text-sm text-slate-500 dark:text-slate-400 py-4';
      msg.textContent = 'تم فصل قنوات اللون (أحمر، أخضر، أزرق) وعرضها في الجهة المقابلة.';
      controlsContainer.appendChild(msg);
    } 
    else if (currentType === 'sampling') {
      createSlider('عدد الأعمدة (Cols)', '', 2, 100, 1, params.sampling.cols, (val) => {
        params.sampling.cols = val;
        processImage();
      });
      createSlider('عدد الصفوف (Rows)', '', 2, 100, 1, params.sampling.rows, (val) => {
        params.sampling.rows = val;
        processImage();
      });
    }
    else if (currentType === 'quantization') {
      createSlider('أعمدة العينات (Cols)', '', 2, 100, 1, params.sampling.cols, (val) => {
        params.sampling.cols = val;
        processImage();
      });
      createSlider('صفوف العينات (Rows)', '', 2, 100, 1, params.sampling.rows, (val) => {
        params.sampling.rows = val;
        processImage();
      });
      createSlider('مستويات الألوان (Levels)', '', 2, 256, 1, params.quantization.levels, (val) => {
        params.quantization.levels = val;
        processImage();
      });
      
      const matrixBtn = document.createElement('button');
      matrixBtn.className = 'w-full py-2 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-bold rounded-lg hover:bg-indigo-200 transition-colors mt-2 text-sm';
      matrixBtn.innerHTML = 'إظهار / إخفاء مصفوفات الألوان';
      matrixBtn.onclick = () => {
        matricesWrap.classList.toggle('hidden');
        processImage();
      };
      controlsContainer.appendChild(matrixBtn);

      const expandBtn = document.createElement('button');
      expandBtn.className = 'w-full py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors mt-2 text-sm border border-slate-300 dark:border-slate-700';
      expandBtn.innerHTML = 'عرض المصفوفات بحجم الشاشة ⛶';
      expandBtn.onclick = () => {
        openFullscreenMatrices();
      };
      controlsContainer.appendChild(expandBtn);
    }
    else if (currentType === 'colormix') {
      const msg = document.createElement('p');
      msg.className = 'text-sm text-slate-500 dark:text-slate-400 mb-3';
      msg.textContent = 'اسحب الماوس على الصورة الأصلية لاختيار منطقة.';
      controlsContainer.appendChild(msg);

      const colorWrap = document.createElement('div');
      colorWrap.className = 'flex items-center gap-3 mt-4';
      
      const label = document.createElement('label');
      label.className = 'text-sm font-bold text-slate-700 dark:text-slate-300';
      label.textContent = 'لون المزج:';

      const colorInput = document.createElement('input');
      colorInput.type = 'color';
      colorInput.value = params.colormix.color;
      colorInput.className = 'w-10 h-10 p-0 border-0 rounded cursor-pointer';

      colorInput.addEventListener('input', (e) => {
        params.colormix.color = e.target.value;
        processImage();
      });

      colorWrap.appendChild(label);
      colorWrap.appendChild(colorInput);
      controlsContainer.appendChild(colorWrap);
      
      updateRectOverlay();
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

  function setupRectEvents() {
    rectOverlay = document.createElement('div');
    rectOverlay.className = 'absolute border-2 border-dashed border-indigo-500 bg-indigo-500/20';
    rectOverlay.style.pointerEvents = 'none';
    rectOverlay.style.display = 'none';
    
    const origContainer = origCanvas.parentElement;
    origContainer.style.position = 'relative';
    origContainer.appendChild(rectOverlay);

    origCanvas.addEventListener('mousedown', (e) => {
      if (currentType !== 'colormix' || !currentImage) return;
      isDraggingRect = true;
      const r = origCanvas.getBoundingClientRect();
      startX = (e.clientX - r.left) / r.width;
      startY = (e.clientY - r.top) / r.height;
      
      params.colormix.rect = { x: startX, y: startY, w: 0, h: 0 };
      updateRectOverlay();
    });

    origCanvas.addEventListener('mousemove', (e) => {
      if (!isDraggingRect) return;
      const r = origCanvas.getBoundingClientRect();
      const cx = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
      const cy = Math.max(0, Math.min(1, (e.clientY - r.top) / r.height));
      
      params.colormix.rect.x = Math.min(startX, cx);
      params.colormix.rect.y = Math.min(startY, cy);
      params.colormix.rect.w = Math.abs(cx - startX);
      params.colormix.rect.h = Math.abs(cy - startY);
      
      updateRectOverlay();
      processImage();
    });

    const endDrag = () => {
      if (isDraggingRect) {
        isDraggingRect = false;
        if (params.colormix.rect.w < 0.05 || params.colormix.rect.h < 0.05) {
          params.colormix.rect = { x: 0.25, y: 0.25, w: 0.5, h: 0.5 };
          updateRectOverlay();
          processImage();
        }
      }
    };

    origCanvas.addEventListener('mouseup', endDrag);
    origCanvas.addEventListener('mouseleave', endDrag);

    // Touch Events (mobile rect selection support)
    origCanvas.addEventListener('touchstart', (e) => {
      if (currentType !== 'colormix' || !currentImage) return;
      e.preventDefault();
      isDraggingRect = true;
      const r = origCanvas.getBoundingClientRect();
      const touch = e.touches[0];
      startX = (touch.clientX - r.left) / r.width;
      startY = (touch.clientY - r.top) / r.height;
      
      params.colormix.rect = { x: startX, y: startY, w: 0, h: 0 };
      updateRectOverlay();
    }, { passive: false });

    origCanvas.addEventListener('touchmove', (e) => {
      if (!isDraggingRect) return;
      e.preventDefault();
      const r = origCanvas.getBoundingClientRect();
      const touch = e.touches[0];
      const cx = Math.max(0, Math.min(1, (touch.clientX - r.left) / r.width));
      const cy = Math.max(0, Math.min(1, (touch.clientY - r.top) / r.height));
      
      params.colormix.rect.x = Math.min(startX, cx);
      params.colormix.rect.y = Math.min(startY, cy);
      params.colormix.rect.w = Math.abs(cx - startX);
      params.colormix.rect.h = Math.abs(cy - startY);
      
      updateRectOverlay();
      processImage();
    }, { passive: false });

    origCanvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      endDrag();
    }, { passive: false });
    
    window.addEventListener('resize', () => {
      if (currentType === 'colormix') updateRectOverlay();
    });
  }

  function updateRectOverlay() {
    if (!rectOverlay || currentType !== 'colormix') return;
    const cw = origCanvas.offsetWidth;
    const ch = origCanvas.offsetHeight;
    
    rectOverlay.style.left = (params.colormix.rect.x * cw) + 'px';
    rectOverlay.style.top = (params.colormix.rect.y * ch) + 'px';
    rectOverlay.style.width = (params.colormix.rect.w * cw) + 'px';
    rectOverlay.style.height = (params.colormix.rect.h * ch) + 'px';
  }

  function processImage() {
    if (!currentImage) return;

    if (currentType === 'rgb') {
      const canvases = rgbWrap.querySelectorAll('canvas');
      RepProcessing.decomposeRGB(origCanvas, canvases[0], canvases[1], canvases[2]);
      updateCode(RepCodeGen.generateRGB());
    } 
    else if (currentType === 'sampling') {
      RepProcessing.applySampling(origCanvas, procCanvas, params.sampling.rows, params.sampling.cols);
      updateCode(RepCodeGen.generateSampling(params.sampling.rows, params.sampling.cols));
    }
    else if (currentType === 'quantization') {
      // For Quantization in playground, we first apply sampling, then quantize for the visual effect
      RepProcessing.applySampling(origCanvas, procCanvas, params.sampling.rows, params.sampling.cols);
      RepProcessing.applyQuantization(procCanvas, procCanvas, params.quantization.levels);
      
      // Update matrices
      const tinyData = RepProcessing.getSampledQuantizedData(origCanvas, params.sampling.rows, params.sampling.cols, params.quantization.levels);
      RepProcessing.drawChannelMatrix(document.getElementById('rep-matrix-r'), tinyData, 0);
      RepProcessing.drawChannelMatrix(document.getElementById('rep-matrix-g'), tinyData, 1);
      RepProcessing.drawChannelMatrix(document.getElementById('rep-matrix-b'), tinyData, 2);
      
      updateCode(RepCodeGen.generateQuantization(params.quantization.levels));
    }
    else if (currentType === 'colormix') {
      RepProcessing.applyColorMixing(origCanvas, procCanvas, params.colormix.rect, params.colormix.color, 'color');
      updateCode(RepCodeGen.generateColorMix(params.colormix.rect, params.colormix.color));
    }
  }

  function updateCode(pythonStr) {
    let html = pythonStr.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    html = html.replace(/('[^']*'|"[^"]*")/g, '<span class="str">$1</span>');
    html = html.replace(/(#.*)/g, '<span class="cmt">$1</span>');
    html = html.replace(/\b(import|from|as|if|else|elif|for|while|def|return|class|pass|break|continue|None)\b(?![^<]*>)/g, '<span class="kw">$1</span>');
    html = html.replace(/\b(\d+(\.\d+)?)\b(?![^<]*>)/g, '<span class="num">$1</span>');
    html = html.replace(/\b(cv2|np|plt|Image)\./g, '<span class="lib">$1</span>.');
    codeBlock.innerHTML = html;
  }

  function openFullscreenMatrices() {
    if (!currentImage) return;
    
    const modal = document.getElementById('rep-matrices-modal');
    const content = document.getElementById('rep-matrices-modal-content');
    const closeBtn = document.getElementById('rep-matrices-close');
    
    if (!modal || !content) return;
    
    content.innerHTML = '';
    
    const tinyData = RepProcessing.getSampledQuantizedData(origCanvas, params.sampling.rows, params.sampling.cols, params.quantization.levels);
    
    ['الأحمر', 'الأخضر', 'الأزرق'].forEach((name, channel) => {
      const wrap = document.createElement('div');
      wrap.className = 'flex flex-col items-center bg-white dark:bg-slate-800 p-2 rounded-lg shadow-xl';
      
      const title = document.createElement('h4');
      title.className = `text-white font-bold w-full text-center py-1 mb-2 rounded ${
        channel === 0 ? 'bg-red-500' : channel === 1 ? 'bg-green-500' : 'bg-blue-500'
      }`;
      title.textContent = name;
      
      const c = document.createElement('canvas');
      c.className = 'border border-slate-300 dark:border-slate-700';
      RepProcessing.drawChannelMatrix(c, tinyData, channel, true); // true for fullscreen
      
      wrap.appendChild(title);
      wrap.appendChild(c);
      content.appendChild(wrap);
    });
    
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    setTimeout(() => {
      modal.classList.remove('opacity-0');
    }, 10);
    
    const closeModal = () => {
      modal.classList.add('opacity-0');
      setTimeout(() => {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        content.innerHTML = '';
      }, 300);
    };
    
    closeBtn.onclick = closeModal;
    modal.onclick = (e) => {
      if (e.target === modal) closeModal();
    };
  }

  function copyCode() {
    navigator.clipboard.writeText(codeBlock.textContent).then(() => {
      const orig = copyBtn.innerHTML;
      copyBtn.innerHTML = `تم النسخ`;
      copyBtn.classList.add('copied');
      setTimeout(() => { copyBtn.innerHTML = orig; copyBtn.classList.remove('copied'); }, 2000);
    });
  }

  return { init };
})();
