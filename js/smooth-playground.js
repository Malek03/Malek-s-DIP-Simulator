/* ============================================================
   Vision Studio — Smoothing Filters Interactive Playground
   Image upload, live filtering, Convolution visualization
   ============================================================ */

const SmoothPlayground = (() => {
  'use strict';

  // State
  let originalImageData = null;
  let currentFilter = 'mean';
  let isProcessing = false;

  // Convolution simulation state
  const simState = {
    interval: null,
    running: false,
    paused: false,
    currentI: 0,
    currentJ: 0,
  };

  // DOM references
  let dropZone, fileInput, originalCanvas, processedCanvas;
  let origCtx, procCtx;
  let codeBlock, controlsContainer;
  let convContainer; // Convolution visualization container

  /**
   * Initialize the Smooth Playground module.
   */
  function init() {
    dropZone = document.getElementById('smooth-playground-dropzone');
    fileInput = document.getElementById('smooth-playground-file-input');
    originalCanvas = document.getElementById('smooth-playground-original');
    processedCanvas = document.getElementById('smooth-playground-processed');
    codeBlock = document.getElementById('smooth-playground-code');
    controlsContainer = document.getElementById('smooth-playground-controls');
    convContainer = document.getElementById('smooth-conv-visualization');

    if (!originalCanvas || !processedCanvas) return;

    origCtx = originalCanvas.getContext('2d');
    procCtx = processedCanvas.getContext('2d');

    setupDropZone();

    // Filter type selector
    const typeSelect = document.getElementById('smooth-playground-type-select');
    if (typeSelect) {
      typeSelect.addEventListener('change', (e) => {
        currentFilter = e.target.value;
        renderControls();
        applyFilter();
        updateCode();
      });
    }

    // Reset button
    const resetBtn = document.getElementById('smooth-playground-reset');
    if (resetBtn) {
      resetBtn.addEventListener('click', resetPlayground);
    }

    // Copy code button
    const copyBtn = document.getElementById('smooth-playground-copy-code');
    if (copyBtn) {
      copyBtn.addEventListener('click', copyCode);
    }

    // Visualize button
    const vizBtn = document.getElementById('smooth-visualize-btn');
    if (vizBtn) {
      vizBtn.addEventListener('click', startVisualization);
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

        applyFilter();
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

    const imgData = SmoothProcessing.generateNoisySample(w, h);
    origCtx.putImageData(imgData, 0, 0);
    originalImageData = imgData;
    applyFilter();
  }

  /* ----------------------------------------------------------
   * Dynamic Controls Rendering
   * ---------------------------------------------------------- */

  function renderControls() {
    if (!controlsContainer) return;

    const getAdvancedControls = (prefix) => `
      <div class="flex items-center justify-between mt-3">
        <label class="text-sm font-medium text-slate-700 dark:text-slate-300">الخطوة (Stride)</label>
        <span id="${prefix}-stride-val" class="text-sm font-mono text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30 px-2 py-0.5 rounded">1</span>
      </div>
      <input type="range" id="${prefix}-stride" min="1" max="5" step="1" value="1" class="w-full">
      
      <div class="space-y-1 mt-3">
        <label class="text-sm font-medium text-slate-700 dark:text-slate-300">نوع الحواف (Padding Type)</label>
        <select id="${prefix}-padding" class="w-full px-2 py-1.5 bg-white dark:bg-gray-800 border border-slate-300 dark:border-gray-600 rounded-lg text-sm text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-teal-500 outline-none">
          <option value="zero">أصفار (Zero Padding)</option>
          <option value="replicate">تكرار الحافة (Replicate)</option>
          <option value="reflect">انعكاس (Reflect)</option>
          <option value="none">بدون (Valid / None)</option>
        </select>
      </div>
    `;

    const controlsMap = {
      mean: `
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <label class="text-sm font-medium text-slate-700 dark:text-slate-300">حجم الـ Kernel</label>
            <span id="spg-mean-val" class="text-sm font-mono text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30 px-2 py-0.5 rounded">3×3</span>
          </div>
          <input type="range" id="spg-mean-size" min="3" max="11" step="2" value="3" class="w-full">
          ${getAdvancedControls('spg-mean')}
        </div>
      `,
      gaussian: `
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <label class="text-sm font-medium text-slate-700 dark:text-slate-300">حجم الـ Kernel</label>
            <span id="spg-gauss-size-val" class="text-sm font-mono text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30 px-2 py-0.5 rounded">3×3</span>
          </div>
          <input type="range" id="spg-gauss-size" min="3" max="11" step="2" value="3" class="w-full">
          <div class="flex items-center justify-between">
            <label class="text-sm font-medium text-slate-700 dark:text-slate-300">σ (سيغما)</label>
            <span id="spg-gauss-sigma-val" class="text-sm font-mono text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30 px-2 py-0.5 rounded">1.0</span>
          </div>
          <input type="range" id="spg-gauss-sigma" min="0.1" max="5.0" step="0.1" value="1.0" class="w-full">
          ${getAdvancedControls('spg-gauss')}
        </div>
      `,
      median: `
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <label class="text-sm font-medium text-slate-700 dark:text-slate-300">حجم النافذة</label>
            <span id="spg-median-val" class="text-sm font-mono text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30 px-2 py-0.5 rounded">3×3</span>
          </div>
          <input type="range" id="spg-median-size" min="3" max="11" step="2" value="3" class="w-full">
          ${getAdvancedControls('spg-median')}
          <div class="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-700/50 mt-2">
            <p class="text-xs text-amber-700 dark:text-amber-300">
              <strong>ملاحظة:</strong> فلتر الوسيط لا يستخدم Kernel رقمي — بل يرتب قيم النافذة ويختار القيمة الوسطى.
            </p>
          </div>
        </div>
      `,
      min: `
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <label class="text-sm font-medium text-slate-700 dark:text-slate-300">حجم النافذة</label>
            <span id="spg-min-val" class="text-sm font-mono text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30 px-2 py-0.5 rounded">3×3</span>
          </div>
          <input type="range" id="spg-min-size" min="3" max="11" step="2" value="3" class="w-full">
          ${getAdvancedControls('spg-min')}
          <div class="p-2 bg-teal-50 dark:bg-teal-900/20 rounded-lg border border-teal-200 dark:border-teal-700/50 mt-2">
            <p class="text-xs text-teal-700 dark:text-teal-300">
              <strong>ملاحظة:</strong> فلتر الحد الأدنى يختار أصغر قيمة في النافذة (يعمل كـ Erode).
            </p>
          </div>
        </div>
      `,
      max: `
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <label class="text-sm font-medium text-slate-700 dark:text-slate-300">حجم النافذة</label>
            <span id="spg-max-val" class="text-sm font-mono text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30 px-2 py-0.5 rounded">3×3</span>
          </div>
          <input type="range" id="spg-max-size" min="3" max="11" step="2" value="3" class="w-full">
          ${getAdvancedControls('spg-max')}
          <div class="p-2 bg-teal-50 dark:bg-teal-900/20 rounded-lg border border-teal-200 dark:border-teal-700/50 mt-2">
            <p class="text-xs text-teal-700 dark:text-teal-300">
              <strong>ملاحظة:</strong> فلتر الحد الأقصى يختار أكبر قيمة في النافذة (يعمل كـ Dilate).
            </p>
          </div>
        </div>
      `,
    };

    controlsContainer.innerHTML = controlsMap[currentFilter] || '';
    requestAnimationFrame(() => bindControlEvents());
  }

  function bindControlEvents() {
    const attachCommon = (prefix, updateExtra) => {
      const slider = document.getElementById(`${prefix}-size`);
      const valEl = document.getElementById(`${prefix}-val`);
      const paddingSel = document.getElementById(`${prefix}-padding`);
      const strideSlider = document.getElementById(`${prefix}-stride`);
      const strideVal = document.getElementById(`${prefix}-stride-val`);

      const handler = () => {
        if (slider && valEl) {
          const size = parseInt(slider.value);
          valEl.textContent = `${size}×${size}`;
        }
        if (strideSlider && strideVal) {
          strideVal.textContent = strideSlider.value;
        }
        if (updateExtra) updateExtra();
        applyFilter();
        updateCode();
      };

      if (slider) slider.addEventListener('input', handler);
      if (paddingSel) paddingSel.addEventListener('change', handler);
      if (strideSlider) strideSlider.addEventListener('input', handler);
      return handler;
    };

    switch (currentFilter) {
      case 'mean':
        attachCommon('spg-mean');
        break;
      case 'gaussian': {
        const sigmaSlider = document.getElementById('spg-gauss-sigma');
        const sigmaVal = document.getElementById('spg-gauss-sigma-val');
        const extraGauss = () => {
          if (sigmaSlider && sigmaVal) sigmaVal.textContent = parseFloat(sigmaSlider.value).toFixed(1);
        };
        const handler = attachCommon('spg-gauss', extraGauss);
        if (sigmaSlider) sigmaSlider.addEventListener('input', handler);
        break;
      }
      case 'median':
        attachCommon('spg-median');
        break;
      case 'min':
        attachCommon('spg-min');
        break;
      case 'max':
        attachCommon('spg-max');
        break;
    }
  }

  /* ----------------------------------------------------------
   * Get Current Parameters
   * ---------------------------------------------------------- */

  function getParams() {
    const getCommon = (prefix) => {
      const slider = document.getElementById(`${prefix}-size`);
      const paddingSel = document.getElementById(`${prefix}-padding`);
      const strideSlider = document.getElementById(`${prefix}-stride`);
      return {
        size: slider ? parseInt(slider.value) : 3,
        paddingType: paddingSel ? paddingSel.value : 'zero',
        stride: strideSlider ? parseInt(strideSlider.value) : 1
      };
    };

    switch (currentFilter) {
      case 'mean': {
        const c = getCommon('spg-mean');
        return { rows: c.size, cols: c.size, paddingType: c.paddingType, stride: c.stride };
      }
      case 'gaussian': {
        const c = getCommon('spg-gauss');
        const sigmaSlider = document.getElementById('spg-gauss-sigma');
        return { rows: c.size, cols: c.size, sigma: sigmaSlider ? parseFloat(sigmaSlider.value) : 1.0, paddingType: c.paddingType, stride: c.stride };
      }
      case 'median':
        return getCommon('spg-median');
      case 'min':
        return getCommon('spg-min');
      case 'max':
        return getCommon('spg-max');
      default:
        return {};
    }
  }

  /* ----------------------------------------------------------
   * Apply Filter to Full Image
   * ---------------------------------------------------------- */

  function applyFilter() {
    if (!originalImageData || isProcessing) return;
    isProcessing = true;

    const params = getParams();
    let result;

    switch (currentFilter) {
      case 'mean':
        result = SmoothProcessing.applyMeanFilter(originalImageData, params.rows, params.cols, params.paddingType, params.stride);
        break;
      case 'gaussian':
        result = SmoothProcessing.applyGaussianFilter(originalImageData, params.rows, params.cols, params.sigma, params.paddingType, params.stride);
        break;
      case 'median':
        result = SmoothProcessing.applyMedianFilter(originalImageData, params.size, params.size, params.paddingType, params.stride);
        break;
      case 'min':
        result = SmoothProcessing.applyMinFilter(originalImageData, params.size, params.size, params.paddingType, params.stride);
        break;
      case 'max':
        result = SmoothProcessing.applyMaxFilter(originalImageData, params.size, params.size, params.paddingType, params.stride);
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
   * Convolution Visualization
   * ---------------------------------------------------------- */

  function startVisualization() {
    if (!originalImageData || !convContainer) return;

    // Stop any running simulation
    stopSimulation();

    const params = getParams();
    const kSize = params.rows || params.size || 3;
    const paddingType = params.paddingType || 'zero';
    const stride = params.stride || 1;

    // Extract small pixel matrix
    const matrixSize = 8;
    const pixels = SmoothProcessing.extractPixelMatrix(originalImageData, matrixSize);

    // Build kernel
    let kernel = null;
    let rankType = null;
    if (currentFilter === 'mean') {
      kernel = SmoothProcessing.createMeanKernel(kSize, kSize);
    } else if (currentFilter === 'gaussian') {
      const sigma = params.sigma || 1.0;
      kernel = SmoothProcessing.createGaussianKernel(kSize, kSize, sigma);
    } else {
      rankType = currentFilter; // 'median', 'min', 'max'
    }

    // Apply padding if needed
    const padH = Math.floor(kSize / 2);
    const padW = Math.floor(kSize / 2);
    const hasPadding = paddingType && paddingType !== 'none';
    const inputMatrix = hasPadding ? SmoothProcessing.addPadding(pixels, padH, padW, paddingType) : pixels;

    // Compute output size
    const inH = inputMatrix.length;
    const inW = inputMatrix[0].length;
    const outH = Math.floor((inH - kSize) / stride) + 1;
    const outW = Math.floor((inW - kSize) / stride) + 1;

    // Build the visualization layout
    renderVisualizationLayout(inputMatrix, kernel, outH, outW, kSize, rankType, hasPadding, padH, padW, pixels.length, pixels[0].length);

    // Start the step-by-step simulation
    simulateConvolution(inputMatrix, kernel, kSize, outH, outW, rankType, stride);
  }

  function renderVisualizationLayout(inputMatrix, kernel, outH, outW, kSize, rankType, hasPadding, padH, padW, origH, origW) {
    convContainer.innerHTML = '';

    // Main wrapper
    const wrapper = document.createElement('div');
    wrapper.className = 'conv-viz-wrapper';

    // Top row: Input ⊛ Kernel
    const topRow = document.createElement('div');
    topRow.className = 'conv-viz-top-row';

    // Input matrix
    const inputSection = createGridSection('المدخلات (Input)', inputMatrix, 'input', hasPadding, padH, padW, origH, origW);
    topRow.appendChild(inputSection);

    // Operator symbol
    const opSymbol = document.createElement('div');
    opSymbol.className = 'conv-viz-operator';
    opSymbol.textContent = rankType ? rankType : '⊛';
    topRow.appendChild(opSymbol);

    // Kernel or info section
    if (!rankType && kernel) {
      const kernelSection = createGridSection('الـ Kernel', kernel, 'kernel', false);
      topRow.appendChild(kernelSection);
    } else {
      const medianInfo = document.createElement('div');
      medianInfo.className = 'conv-viz-section';
      const title = document.createElement('div');
      title.className = 'text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 text-center';
      title.textContent = rankType === 'median' ? 'ترتيب + وسيط' : (rankType === 'min' ? 'أصغر قيمة' : 'أكبر قيمة');
      const info = document.createElement('div');
      info.className = 'text-xs text-slate-400 dark:text-slate-500 text-center p-4 bg-slate-50 dark:bg-gray-700/30 rounded-lg';
      info.id = 'conv-median-info';
      info.textContent = 'سيتم عرض القيم المرتبة هنا';
      medianInfo.appendChild(title);
      medianInfo.appendChild(info);
      topRow.appendChild(medianInfo);
    }

    wrapper.appendChild(topRow);

    // Equals symbol
    const eqRow = document.createElement('div');
    eqRow.className = 'conv-viz-eq-row';
    eqRow.innerHTML = '<span class="text-2xl font-bold text-slate-400 dark:text-slate-500">=</span>';
    wrapper.appendChild(eqRow);

    // Output matrix
    const outputData = Array.from({ length: outH }, () => Array(outW).fill(''));
    const outputSection = createGridSection('الناتج (Output)', outputData, 'output', false);
    wrapper.appendChild(outputSection);

    // Control buttons
    const controls = document.createElement('div');
    controls.className = 'conv-viz-controls';
    controls.innerHTML = `
      <button id="conv-pause-btn" class="conv-ctrl-btn conv-ctrl-pause">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        إيقاف مؤقت
      </button>
      <button id="conv-stop-btn" class="conv-ctrl-btn conv-ctrl-stop">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"/>
        </svg>
        إيقاف
      </button>
    `;
    wrapper.appendChild(controls);

    // Calculation display
    const calcDisplay = document.createElement('div');
    calcDisplay.id = 'conv-calc-display';
    calcDisplay.className = 'conv-calc-display';
    calcDisplay.textContent = 'ابدأ المحاكاة...';
    wrapper.appendChild(calcDisplay);

    convContainer.appendChild(wrapper);

    // Bind control buttons
    const pauseBtn = document.getElementById('conv-pause-btn');
    const stopBtn = document.getElementById('conv-stop-btn');

    if (pauseBtn) {
      pauseBtn.addEventListener('click', () => {
        if (simState.paused) {
          simState.paused = false;
          pauseBtn.innerHTML = `
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            إيقاف مؤقت
          `;
        } else {
          simState.paused = true;
          pauseBtn.innerHTML = `
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/>
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            استئناف
          `;
        }
      });
    }

    if (stopBtn) {
      stopBtn.addEventListener('click', stopSimulation);
    }
  }

  function createGridSection(title, matrix, prefix, hasPadding, padH, padW, origH, origW) {
    const section = document.createElement('div');
    section.className = 'conv-viz-section';

    const titleEl = document.createElement('div');
    titleEl.className = 'text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 text-center';
    titleEl.textContent = title;
    section.appendChild(titleEl);

    const rows = matrix.length;
    const cols = matrix[0].length;

    const grid = document.createElement('div');
    grid.className = 'matrix-grid';
    grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;

    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        const cell = document.createElement('div');
        cell.className = 'matrix-cell';
        cell.id = `${prefix}-${i}-${j}`;

        const val = matrix[i][j];
        if (prefix === 'kernel') {
          cell.textContent = typeof val === 'number' ? val.toFixed(3) : '';
          cell.classList.add('kernel-cell');
        } else if (prefix === 'output') {
          cell.textContent = '';
        } else {
          cell.textContent = typeof val === 'number' ? Math.floor(val) : '';
        }

        // Mark padding cells
        if (hasPadding && prefix === 'input') {
          const isPadding = i < padH || i >= padH + origH || j < padW || j >= padW + origW;
          if (isPadding) {
            cell.classList.add('padding-cell');
          }
        }

        grid.appendChild(cell);
      }
    }

    section.appendChild(grid);
    return section;
  }

  function simulateConvolution(inputMatrix, kernel, kSize, outH, outW, rankType, stride = 1) {
    simState.currentI = 0;
    simState.currentJ = 0;
    simState.running = true;
    simState.paused = false;

    const calcDisplay = document.getElementById('conv-calc-display');
    const inH = inputMatrix.length;
    const inW = inputMatrix[0].length;

    simState.interval = setInterval(() => {
      if (simState.paused) return;

      const i = simState.currentI;
      const j = simState.currentJ;

      if (i >= outH) {
        stopSimulation();
        if (calcDisplay) calcDisplay.textContent = '✅ اكتملت المحاكاة!';
        return;
      }

      // Clear previous highlights
      clearHighlights(inH, inW, kSize);

      const startI = i * stride;
      const startJ = j * stride;

      // Highlight current window in input
      for (let ki = 0; ki < kSize; ki++) {
        for (let kj = 0; kj < kSize; kj++) {
          const inCell = document.getElementById(`input-${startI + ki}-${startJ + kj}`);
          if (inCell) inCell.classList.add('highlight-input');
        }
      }

      // Highlight kernel
      if (!rankType && kernel) {
        for (let ki = 0; ki < kSize; ki++) {
          for (let kj = 0; kj < kSize; kj++) {
            const kCell = document.getElementById(`kernel-${ki}-${kj}`);
            if (kCell) kCell.classList.add('highlight-kernel');
          }
        }
      }

      // Compute the output value
      let outputVal;
      let calcText;

      if (rankType) {
        // Median/Min/Max
        const values = [];
        for (let ki = 0; ki < kSize; ki++) {
          for (let kj = 0; kj < kSize; kj++) {
            values.push(inputMatrix[startI + ki][startJ + kj]);
          }
        }
        
        if (rankType === 'median') {
          const sorted = [...values].sort((a, b) => a - b);
          outputVal = sorted[Math.floor(sorted.length / 2)];
          calcText = `الترتيب: [${sorted.join(', ')}] → الوسيط = ${outputVal}`;
          
          // Update median info display
          const medInfo = document.getElementById('conv-median-info');
          if (medInfo) {
            medInfo.innerHTML = `<div class="font-mono text-[10px] leading-relaxed">[${sorted.map((v, idx) => idx === Math.floor(sorted.length / 2) ? `<strong class="text-teal-500">${v}</strong>` : v).join(', ')}]</div>`;
          }
        } else if (rankType === 'min') {
          outputVal = Math.min(...values);
          calcText = `min([${values.join(', ')}]) = ${outputVal}`;
          const medInfo = document.getElementById('conv-median-info');
          if (medInfo) medInfo.innerHTML = `<div class="font-mono text-[10px] leading-relaxed">أصغر قيمة هي: <strong class="text-teal-500">${outputVal}</strong></div>`;
        } else if (rankType === 'max') {
          outputVal = Math.max(...values);
          calcText = `max([${values.join(', ')}]) = ${outputVal}`;
          const medInfo = document.getElementById('conv-median-info');
          if (medInfo) medInfo.innerHTML = `<div class="font-mono text-[10px] leading-relaxed">أكبر قيمة هي: <strong class="text-teal-500">${outputVal}</strong></div>`;
        }
        
      } else {
        // Convolution: sum of element-wise products
        let sum = 0;
        const terms = [];
        for (let ki = 0; ki < kSize; ki++) {
          for (let kj = 0; kj < kSize; kj++) {
            const pixVal = inputMatrix[startI + ki][startJ + kj];
            const kVal = kernel[ki][kj];
            sum += pixVal * kVal;
            terms.push(`${pixVal}×${kVal.toFixed(2)}`);
          }
        }
        outputVal = Math.floor(Math.max(0, Math.min(255, sum)));
        // Show abbreviated calculation
        if (terms.length <= 9) {
          calcText = `Σ = ${terms.join(' + ')} = ${outputVal}`;
        } else {
          calcText = `Σ(${terms.length} terms) = ${outputVal}`;
        }
      }

      // Highlight output cell and write value
      const outCell = document.getElementById(`output-${i}-${j}`);
      if (outCell) {
        outCell.textContent = outputVal;
        outCell.classList.add('highlight-output');
      }

      // Update calculation display
      if (calcDisplay) {
        calcDisplay.textContent = `[${i},${j}] → ${calcText}`;
      }

      // Advance to next position
      simState.currentJ++;
      if (simState.currentJ >= outW) {
        simState.currentJ = 0;
        simState.currentI++;
      }
    }, 600);
  }

  function clearHighlights(inH, inW, kSize) {
    // Clear input highlights
    for (let i = 0; i < inH; i++) {
      for (let j = 0; j < inW; j++) {
        const cell = document.getElementById(`input-${i}-${j}`);
        if (cell) cell.classList.remove('highlight-input');
      }
    }
    // Clear kernel highlights
    for (let i = 0; i < kSize; i++) {
      for (let j = 0; j < kSize; j++) {
        const cell = document.getElementById(`kernel-${i}-${j}`);
        if (cell) cell.classList.remove('highlight-kernel');
      }
    }
    // Clear output highlight (only the active class, not the value)
    document.querySelectorAll('.highlight-output').forEach(el => el.classList.remove('highlight-output'));
  }

  function stopSimulation() {
    if (simState.interval) {
      clearInterval(simState.interval);
      simState.interval = null;
    }
    simState.running = false;
    simState.paused = false;
  }

  /* ----------------------------------------------------------
   * Update Code Panel
   * ---------------------------------------------------------- */

  function updateCode() {
    if (!codeBlock) return;
    const params = getParams();
    const { raw, highlighted } = SmoothCodeGenerator.generate(currentFilter, params);
    codeBlock.innerHTML = highlighted;
    codeBlock._rawCode = raw;
  }

  /* ----------------------------------------------------------
   * Copy Code
   * ---------------------------------------------------------- */

  function copyCode() {
    const raw = codeBlock?._rawCode;
    if (!raw) return;

    navigator.clipboard.writeText(raw).then(() => {
      const btn = document.getElementById('smooth-playground-copy-code');
      if (btn) {
        const origText = btn.innerHTML;
        btn.classList.add('copied');
        btn.innerHTML = `
          <svg class="w-4 h-4 inline-block ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
          </svg>
          تم النسخ!
        `;
        setTimeout(() => {
          btn.classList.remove('copied');
          btn.innerHTML = origText;
        }, 2000);
      }
    });
  }

  /* ----------------------------------------------------------
   * Reset
   * ---------------------------------------------------------- */

  function resetPlayground() {
    stopSimulation();
    currentFilter = 'mean';
    const typeSelect = document.getElementById('smooth-playground-type-select');
    if (typeSelect) typeSelect.value = 'mean';

    loadSampleImage();
    renderControls();
    updateCode();

    if (convContainer) convContainer.innerHTML = '';

    if (dropZone) {
      const dropText = dropZone.querySelector('.drop-text');
      if (dropText) dropText.textContent = 'اسحب صورة هنا أو انقر للتحميل';
    }
  }

  // Public API
  return { init };
})();
