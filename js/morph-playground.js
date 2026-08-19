/* ============================================================
   Vision Studio — Morphological Processing Interactive Playground
   Image upload, live morphological operations, code generation
   ============================================================ */

const MorphPlayground = (() => {
  'use strict';

  // State
  let originalImageData = null;
  let currentOp = 'erode';
  let isProcessing = false;

  // DOM references
  let dropZone, fileInput, originalCanvas, processedCanvas;
  let origCtx, procCtx;
  let codeBlock, controlsContainer;

  /**
   * Initialize the Morph Playground module.
   */
  function init() {
    dropZone = document.getElementById('morph-playground-dropzone');
    fileInput = document.getElementById('morph-playground-file-input');
    originalCanvas = document.getElementById('morph-playground-original');
    processedCanvas = document.getElementById('morph-playground-processed');
    codeBlock = document.getElementById('morph-playground-code');
    controlsContainer = document.getElementById('morph-playground-controls');

    if (!originalCanvas || !processedCanvas) return;

    origCtx = originalCanvas.getContext('2d');
    procCtx = processedCanvas.getContext('2d');

    setupDropZone();

    // Operation type selector
    const typeSelect = document.getElementById('morph-playground-type-select');
    if (typeSelect) {
      typeSelect.addEventListener('change', (e) => {
        currentOp = e.target.value;
        renderControls();
        applyOp();
        updateCode();
      });
    }

    // Reset button
    const resetBtn = document.getElementById('morph-playground-reset');
    if (resetBtn) {
      resetBtn.addEventListener('click', resetPlayground);
    }

    // Copy code button
    const copyBtn = document.getElementById('morph-playground-copy-code');
    if (copyBtn) {
      copyBtn.addEventListener('click', copyCode);
    }

    loadSampleImage();
    renderControls();
    updateCode();
  }

  /* ----------------------------------------------------------
   * File Upload & Drag-and-Drop
   * ---------------------------------------------------------- */

  function setupDropZone() {
    if (!dropZone || !fileInput) return;

    dropZone.addEventListener('click', () => fileInput.click());

    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('drag-over');
    });

    dropZone.addEventListener('dragleave', () => {
      dropZone.classList.remove('drag-over');
    });

    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('drag-over');
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('image/')) {
        loadImageFile(file);
      }
    });

    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) loadImageFile(file);
    });
  }

  function loadImageFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 512;
        let w = img.width, h = img.height;
        if (w > maxDim || h > maxDim) {
          const scale = maxDim / Math.max(w, h);
          w = Math.round(w * scale);
          h = Math.round(h * scale);
        }

        originalCanvas.width = w;
        originalCanvas.height = h;
        processedCanvas.width = w;
        processedCanvas.height = h;

        origCtx.drawImage(img, 0, 0, w, h);
        originalImageData = origCtx.getImageData(0, 0, w, h);

        dropZone.querySelector('.drop-text').textContent = file.name;

        applyOp();
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  function loadSampleImage() {
    const w = 300, h = 200;
    originalCanvas.width = w;
    originalCanvas.height = h;
    processedCanvas.width = w;
    processedCanvas.height = h;

    const imgData = MorphProcessing.generateBinarySample(w, h);
    origCtx.putImageData(imgData, 0, 0);
    originalImageData = imgData;
    applyOp();
  }

  /* ----------------------------------------------------------
   * Dynamic Controls Rendering
   * ---------------------------------------------------------- */

  function renderControls() {
    if (!controlsContainer) return;

    const commonControls = `
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <label class="text-sm font-medium text-slate-700 dark:text-slate-300">حجم العنصر البنيوي (SE)</label>
          <span id="mpg-size-val" class="text-sm font-mono text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-900/30 px-2 py-0.5 rounded">3×3</span>
        </div>
        <input type="range" id="mpg-size" min="3" max="15" step="2" value="3" class="w-full">

        <div class="space-y-1">
          <label class="text-sm font-medium text-slate-700 dark:text-slate-300">شكل العنصر البنيوي</label>
          <select id="mpg-shape" class="w-full px-2 py-1.5 bg-white dark:bg-gray-800 border border-slate-300 dark:border-gray-600 rounded-lg text-sm text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-pink-500 outline-none">
            <option value="rect">مربع (Rectangle)</option>
            <option value="cross">صليب (Cross)</option>
            <option value="ellipse">بيضاوي (Ellipse)</option>
          </select>
        </div>

        <div class="flex items-center justify-between">
          <label class="text-sm font-medium text-slate-700 dark:text-slate-300">عدد التكرارات (Iterations)</label>
          <span id="mpg-iter-val" class="text-sm font-mono text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-900/30 px-2 py-0.5 rounded">1</span>
        </div>
        <input type="range" id="mpg-iterations" min="1" max="10" step="1" value="1" class="w-full">
      </div>
    `;

    controlsContainer.innerHTML = commonControls;

    // Add SE visualization
    updateSEVisualization();

    requestAnimationFrame(() => bindControlEvents());
  }

  function updateSEVisualization() {
    const sizeSlider = document.getElementById('mpg-size');
    const shapeSelect = document.getElementById('mpg-shape');
    if (!sizeSlider || !shapeSelect) return;

    let size = parseInt(sizeSlider.value);
    size = size % 2 === 0 ? size + 1 : size;
    const shape = shapeSelect.value;
    const se = MorphProcessing.createStructuringElement(size, size, shape);

    // Remove old SE visualization
    const existingViz = controlsContainer.querySelector('.se-viz');
    if (existingViz) existingViz.remove();

    // Only show SE grid for small sizes
    if (size <= 7) {
      const vizDiv = document.createElement('div');
      vizDiv.className = 'se-viz mt-3 p-3 bg-slate-50 dark:bg-gray-700/50 rounded-lg border border-slate-200 dark:border-gray-600';

      const title = document.createElement('p');
      title.className = 'text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 text-center';
      title.textContent = 'العنصر البنيوي (Structuring Element)';
      vizDiv.appendChild(title);

      const grid = document.createElement('div');
      grid.className = 'flex flex-col items-center gap-0.5';

      for (let i = 0; i < size; i++) {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'flex gap-0.5';
        for (let j = 0; j < size; j++) {
          const cell = document.createElement('div');
          const cellSize = size <= 5 ? 'w-6 h-6 text-xs' : 'w-4 h-4 text-[10px]';
          cell.className = `${cellSize} flex items-center justify-center rounded font-mono font-bold ${
            se[i][j] === 1
              ? 'bg-pink-500 text-white'
              : 'bg-slate-200 dark:bg-gray-600 text-slate-400 dark:text-slate-500'
          }`;
          cell.textContent = se[i][j];
          rowDiv.appendChild(cell);
        }
        grid.appendChild(rowDiv);
      }

      vizDiv.appendChild(grid);
      controlsContainer.appendChild(vizDiv);
    }
  }

  function bindControlEvents() {
    const sizeSlider = document.getElementById('mpg-size');
    const sizeVal = document.getElementById('mpg-size-val');
    const shapeSelect = document.getElementById('mpg-shape');
    const iterSlider = document.getElementById('mpg-iterations');
    const iterVal = document.getElementById('mpg-iter-val');

    const handler = () => {
      if (sizeSlider && sizeVal) {
        const size = parseInt(sizeSlider.value);
        sizeVal.textContent = `${size}×${size}`;
      }
      if (iterSlider && iterVal) {
        iterVal.textContent = iterSlider.value;
      }
      updateSEVisualization();
      applyOp();
      updateCode();
    };

    if (sizeSlider) sizeSlider.addEventListener('input', handler);
    if (shapeSelect) shapeSelect.addEventListener('change', handler);
    if (iterSlider) iterSlider.addEventListener('input', handler);
  }

  /* ----------------------------------------------------------
   * Get Current Parameters
   * ---------------------------------------------------------- */

  function getParams() {
    const sizeSlider = document.getElementById('mpg-size');
    const shapeSelect = document.getElementById('mpg-shape');
    const iterSlider = document.getElementById('mpg-iterations');

    return {
      size: sizeSlider ? parseInt(sizeSlider.value) : 3,
      shape: shapeSelect ? shapeSelect.value : 'rect',
      iterations: iterSlider ? parseInt(iterSlider.value) : 1,
    };
  }

  /* ----------------------------------------------------------
   * Apply Morphological Operation to Full Image
   * ---------------------------------------------------------- */

  function applyOp() {
    if (!originalImageData || isProcessing) return;
    isProcessing = true;

    const params = getParams();
    let result;

    switch (currentOp) {
      case 'erode':
        result = MorphProcessing.applyErode(originalImageData, params.size, params.size, params.shape, params.iterations);
        break;
      case 'dilate':
        result = MorphProcessing.applyDilate(originalImageData, params.size, params.size, params.shape, params.iterations);
        break;
      case 'open':
        result = MorphProcessing.applyOpen(originalImageData, params.size, params.size, params.shape, params.iterations);
        break;
      case 'close':
        result = MorphProcessing.applyClose(originalImageData, params.size, params.size, params.shape, params.iterations);
        break;
      case 'tophat':
        result = MorphProcessing.applyTopHat(originalImageData, params.size, params.size, params.shape, params.iterations);
        break;
      case 'blackhat':
        result = MorphProcessing.applyBlackHat(originalImageData, params.size, params.size, params.shape, params.iterations);
        break;
      default:
        result = originalImageData;
    }

    processedCanvas.width = result.width;
    processedCanvas.height = result.height;
    procCtx.putImageData(result, 0, 0);
    isProcessing = false;
  }

  /* ----------------------------------------------------------
   * Code Generation
   * ---------------------------------------------------------- */

  function updateCode() {
    if (!codeBlock) return;
    const params = getParams();
    const { highlighted } = MorphCodeGenerator.generate(currentOp, params);
    codeBlock.innerHTML = highlighted;
  }

  function copyCode() {
    const params = getParams();
    const { raw } = MorphCodeGenerator.generate(currentOp, params);
    navigator.clipboard.writeText(raw).then(() => {
      const copyBtn = document.getElementById('morph-playground-copy-code');
      if (copyBtn) {
        const origText = copyBtn.innerHTML;
        copyBtn.innerHTML = `
          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
          </svg>
          تم النسخ!
        `;
        setTimeout(() => { copyBtn.innerHTML = origText; }, 2000);
      }
    });
  }

  /* ----------------------------------------------------------
   * Reset
   * ---------------------------------------------------------- */

  function resetPlayground() {
    currentOp = 'erode';
    const typeSelect = document.getElementById('morph-playground-type-select');
    if (typeSelect) typeSelect.value = 'erode';
    renderControls();
    loadSampleImage();
    updateCode();
  }

  // Public API
  return { init };
})();
