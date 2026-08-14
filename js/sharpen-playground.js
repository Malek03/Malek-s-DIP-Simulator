/* ============================================================
   Vision Studio — Sharpening Filters Interactive Playground
   Image upload, live filtering, Convolution visualization
   ============================================================ */

const SharpenPlayground = (() => {
  'use strict';

  // State
  let originalImageData = null;
  let currentFilter = 'laplacian';
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
  let convContainer;

  /**
   * Initialize the Sharpen Playground module.
   */
  function init() {
    dropZone = document.getElementById('sharpen-playground-dropzone');
    fileInput = document.getElementById('sharpen-playground-file-input');
    originalCanvas = document.getElementById('sharpen-playground-original');
    processedCanvas = document.getElementById('sharpen-playground-processed');
    codeBlock = document.getElementById('sharpen-playground-code');
    controlsContainer = document.getElementById('sharpen-playground-controls');
    convContainer = document.getElementById('sharpen-conv-visualization');

    if (!originalCanvas || !processedCanvas) return;

    origCtx = originalCanvas.getContext('2d');
    procCtx = processedCanvas.getContext('2d');

    setupDropZone();

    // Filter type selector
    const typeSelect = document.getElementById('sharpen-playground-type-select');
    if (typeSelect) {
      typeSelect.addEventListener('change', (e) => {
        currentFilter = e.target.value;
        renderControls();
        applyFilter();
        updateCode();
      });
    }

    // Reset button
    const resetBtn = document.getElementById('sharpen-playground-reset');
    if (resetBtn) {
      resetBtn.addEventListener('click', resetPlayground);
    }

    // Copy code button
    const copyBtn = document.getElementById('sharpen-playground-copy-code');
    if (copyBtn) {
      copyBtn.addEventListener('click', copyCode);
    }

    // Visualize button
    const vizBtn = document.getElementById('sharpen-visualize-btn');
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

    const imgData = SharpenProcessing.generateEdgeSample(w, h);
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
        <span id="${prefix}-stride-val" class="text-sm font-mono text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/30 px-2 py-0.5 rounded">1</span>
      </div>
      <input type="range" id="${prefix}-stride" min="1" max="5" step="1" value="1" class="w-full">
      
      <div class="space-y-1 mt-3">
        <label class="text-sm font-medium text-slate-700 dark:text-slate-300">نوع الحواف (Padding Type)</label>
        <select id="${prefix}-padding" class="w-full px-2 py-1.5 bg-white dark:bg-gray-800 border border-slate-300 dark:border-gray-600 rounded-lg text-sm text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-rose-500 outline-none">
          <option value="zero">أصفار (Zero Padding)</option>
          <option value="replicate">تكرار الحافة (Replicate)</option>
          <option value="reflect">انعكاس (Reflect)</option>
          <option value="none">بدون (Valid / None)</option>
        </select>
      </div>
    `;

    const controlsMap = {
      laplacian: `
        <div class="space-y-3">
          <div class="space-y-1">
            <label class="text-sm font-medium text-slate-700 dark:text-slate-300">نوع الاتصال</label>
            <select id="shpg-lap-type" class="w-full px-2 py-1.5 bg-white dark:bg-gray-800 border border-slate-300 dark:border-gray-600 rounded-lg text-sm text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-rose-500 outline-none">
              <option value="4">4-connected (أعلى، أسفل، يمين، يسار)</option>
              <option value="8">8-connected (جميع الجيران)</option>
            </select>
          </div>
          ${getAdvancedControls('shpg-lap')}
          <div class="p-2 bg-rose-50 dark:bg-rose-900/20 rounded-lg border border-rose-200 dark:border-rose-700/50 mt-2">
            <p class="text-xs text-rose-700 dark:text-rose-300">
              <strong>ملاحظة:</strong> يكشف الحواف في كل الاتجاهات. 4-connected يكشف الحواف الأفقية والعمودية فقط، أما 8-connected فيشمل القطرية أيضاً.
            </p>
          </div>
        </div>
      `,
      sobel: `
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <label class="text-sm font-medium text-slate-700 dark:text-slate-300">حجم الـ Kernel</label>
            <span id="shpg-sobel-val" class="text-sm font-mono text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/30 px-2 py-0.5 rounded">3×3</span>
          </div>
          <input type="range" id="shpg-sobel-size" min="3" max="5" step="2" value="3" class="w-full">
          
          <div class="space-y-1 mt-3">
            <label class="text-sm font-medium text-slate-700 dark:text-slate-300">الاتجاه (Direction)</label>
            <select id="shpg-sobel-axis" class="w-full px-2 py-1.5 bg-white dark:bg-gray-800 border border-slate-300 dark:border-gray-600 rounded-lg text-sm text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-rose-500 outline-none">
              <option value="mag">المقدار (Magnitude: X+Y)</option>
              <option value="x">أفقي (Sobel-X)</option>
              <option value="y">عمودي (Sobel-Y)</option>
              <option value="diag1">القطر الرئيسي (\)</option>
              <option value="diag2">القطر الثانوي (/)</option>
            </select>
          </div>
          ${getAdvancedControls('shpg-sobel')}
        </div>
      `,
      prewitt: `
        <div class="space-y-3">
          <div class="p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700/50">
            <p class="text-xs text-slate-600 dark:text-slate-400">
              حجم الـ Kernel ثابت: <strong>3×3</strong>
            </p>
          </div>
          ${getAdvancedControls('shpg-prewitt')}
          <div class="p-2 bg-rose-50 dark:bg-rose-900/20 rounded-lg border border-rose-200 dark:border-rose-700/50 mt-2">
            <p class="text-xs text-rose-700 dark:text-rose-300">
              <strong>ملاحظة:</strong> مشابه لـ Sobel لكن بأوزان متساوية — أبسط وأقل حساسية للضوضاء.
            </p>
          </div>
        </div>
      `,
      unsharp: `
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <label class="text-sm font-medium text-slate-700 dark:text-slate-300">حجم Gaussian</label>
            <span id="shpg-unsharp-size-val" class="text-sm font-mono text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/30 px-2 py-0.5 rounded">3×3</span>
          </div>
          <input type="range" id="shpg-unsharp-size" min="3" max="11" step="2" value="3" class="w-full">
          <div class="flex items-center justify-between">
            <label class="text-sm font-medium text-slate-700 dark:text-slate-300">σ (سيغما)</label>
            <span id="shpg-unsharp-sigma-val" class="text-sm font-mono text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/30 px-2 py-0.5 rounded">1.0</span>
          </div>
          <input type="range" id="shpg-unsharp-sigma" min="0.1" max="5.0" step="0.1" value="1.0" class="w-full">
          <div class="flex items-center justify-between">
            <label class="text-sm font-medium text-slate-700 dark:text-slate-300">k (معامل الحدة)</label>
            <span id="shpg-unsharp-k-val" class="text-sm font-mono text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/30 px-2 py-0.5 rounded">1.0</span>
          </div>
          <input type="range" id="shpg-unsharp-k" min="0.1" max="5.0" step="0.1" value="1.0" class="w-full">
          ${getAdvancedControls('shpg-unsharp')}
        </div>
      `,
      highboost: `
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <label class="text-sm font-medium text-slate-700 dark:text-slate-300">حجم Gaussian</label>
            <span id="shpg-hb-size-val" class="text-sm font-mono text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/30 px-2 py-0.5 rounded">3×3</span>
          </div>
          <input type="range" id="shpg-hb-size" min="3" max="11" step="2" value="3" class="w-full">
          <div class="flex items-center justify-between">
            <label class="text-sm font-medium text-slate-700 dark:text-slate-300">σ (سيغما)</label>
            <span id="shpg-hb-sigma-val" class="text-sm font-mono text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/30 px-2 py-0.5 rounded">1.0</span>
          </div>
          <input type="range" id="shpg-hb-sigma" min="0.1" max="5.0" step="0.1" value="1.0" class="w-full">
          <div class="flex items-center justify-between">
            <label class="text-sm font-medium text-slate-700 dark:text-slate-300">A (معامل التعزيز)</label>
            <span id="shpg-hb-a-val" class="text-sm font-mono text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/30 px-2 py-0.5 rounded">1.5</span>
          </div>
          <input type="range" id="shpg-hb-a" min="1.0" max="5.0" step="0.1" value="1.5" class="w-full">
          ${getAdvancedControls('shpg-hb')}
          <div class="p-2 bg-rose-50 dark:bg-rose-900/20 rounded-lg border border-rose-200 dark:border-rose-700/50 mt-2">
            <p class="text-xs text-rose-700 dark:text-rose-300">
              <strong>ملاحظة:</strong> عندما A=1 → Unsharp Mask. عندما A>1 → تعزيز أقوى للحواف مع الحفاظ على الصورة الأصلية.
            </p>
          </div>
        </div>
      `,
      canny: `
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <label class="text-sm font-medium text-slate-700 dark:text-slate-300">الحد الأدنى (Low Threshold)</label>
            <span id="shpg-canny-low-val" class="text-sm font-mono text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/30 px-2 py-0.5 rounded">50</span>
          </div>
          <input type="range" id="shpg-canny-low" min="0" max="255" step="1" value="50" class="w-full">
          
          <div class="flex items-center justify-between mt-3">
            <label class="text-sm font-medium text-slate-700 dark:text-slate-300">الحد الأعلى (High Threshold)</label>
            <span id="shpg-canny-high-val" class="text-sm font-mono text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/30 px-2 py-0.5 rounded">150</span>
          </div>
          <input type="range" id="shpg-canny-high" min="0" max="255" step="1" value="150" class="w-full">
          
          <div class="flex items-center justify-between mt-3">
            <label class="text-sm font-medium text-slate-700 dark:text-slate-300">قوة التنعيم (Sigma)</label>
            <span id="shpg-canny-sigma-val" class="text-sm font-mono text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/30 px-2 py-0.5 rounded">1.0</span>
          </div>
          <input type="range" id="shpg-canny-sigma" min="0.1" max="5.0" step="0.1" value="1.0" class="w-full">

          <div class="p-2 bg-rose-50 dark:bg-rose-900/20 rounded-lg border border-rose-200 dark:border-rose-700/50 mt-2">
            <p class="text-xs text-rose-700 dark:text-rose-300">
              <strong>ملاحظة:</strong> خوارزمية Canny مكونة من 5 مراحل ولا تستخدم خصائص Padding و Stride الافتراضية.
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
      const sizeSlider = document.getElementById(`${prefix}-size`);
      const valEl = document.getElementById(`${prefix}-val`);
      const paddingSel = document.getElementById(`${prefix}-padding`);
      const strideSlider = document.getElementById(`${prefix}-stride`);
      const strideVal = document.getElementById(`${prefix}-stride-val`);

      const handler = () => {
        if (sizeSlider && valEl) {
          const size = parseInt(sizeSlider.value);
          valEl.textContent = `${size}×${size}`;
        }
        if (strideSlider && strideVal) {
          strideVal.textContent = strideSlider.value;
        }
        if (updateExtra) updateExtra();
        applyFilter();
        updateCode();
      };

      if (sizeSlider) sizeSlider.addEventListener('input', handler);
      if (paddingSel) paddingSel.addEventListener('change', handler);
      if (strideSlider) strideSlider.addEventListener('input', handler);
      return handler;
    };

    switch (currentFilter) {
      case 'laplacian': {
        const lapType = document.getElementById('shpg-lap-type');
        const paddingSel = document.getElementById('shpg-lap-padding');
        const strideSlider = document.getElementById('shpg-lap-stride');
        const strideVal = document.getElementById('shpg-lap-stride-val');

        const handler = () => {
          if (strideSlider && strideVal) strideVal.textContent = strideSlider.value;
          applyFilter();
          updateCode();
        };
        if (lapType) lapType.addEventListener('change', handler);
        if (paddingSel) paddingSel.addEventListener('change', handler);
        if (strideSlider) strideSlider.addEventListener('input', handler);
        break;
      }
      case 'sobel': {
        const handler = attachCommon('shpg-sobel');
        const axisSel = document.getElementById('shpg-sobel-axis');
        if (axisSel) axisSel.addEventListener('change', handler);
        break;
      }
      case 'canny': {
        const lowSlider = document.getElementById('shpg-canny-low');
        const lowVal = document.getElementById('shpg-canny-low-val');
        const highSlider = document.getElementById('shpg-canny-high');
        const highVal = document.getElementById('shpg-canny-high-val');
        const sigmaSlider = document.getElementById('shpg-canny-sigma');
        const sigmaVal = document.getElementById('shpg-canny-sigma-val');

        const handler = () => {
          let low = parseInt(lowSlider.value);
          let high = parseInt(highSlider.value);
          if (high <= low) {
            high = low + 1;
            highSlider.value = high;
          }
          if (lowVal) lowVal.textContent = low;
          if (highVal) highVal.textContent = high;
          if (sigmaVal) sigmaVal.textContent = parseFloat(sigmaSlider.value).toFixed(1);
          applyFilter();
          updateCode();
        };

        if (lowSlider) lowSlider.addEventListener('input', handler);
        if (highSlider) highSlider.addEventListener('input', handler);
        if (sigmaSlider) sigmaSlider.addEventListener('input', handler);
        break;
      }
      case 'prewitt': {
        const paddingSel = document.getElementById('shpg-prewitt-padding');
        const strideSlider = document.getElementById('shpg-prewitt-stride');
        const strideVal = document.getElementById('shpg-prewitt-stride-val');

        const handler = () => {
          if (strideSlider && strideVal) strideVal.textContent = strideSlider.value;
          applyFilter();
          updateCode();
        };
        if (paddingSel) paddingSel.addEventListener('change', handler);
        if (strideSlider) strideSlider.addEventListener('input', handler);
        break;
      }
      case 'unsharp': {
        const sigmaSlider = document.getElementById('shpg-unsharp-sigma');
        const sigmaVal = document.getElementById('shpg-unsharp-sigma-val');
        const kSlider = document.getElementById('shpg-unsharp-k');
        const kVal = document.getElementById('shpg-unsharp-k-val');

        const extraUnsharp = () => {
          if (sigmaSlider && sigmaVal) sigmaVal.textContent = parseFloat(sigmaSlider.value).toFixed(1);
          if (kSlider && kVal) kVal.textContent = parseFloat(kSlider.value).toFixed(1);
        };
        const handler = attachCommon('shpg-unsharp', extraUnsharp);
        if (sigmaSlider) sigmaSlider.addEventListener('input', handler);
        if (kSlider) kSlider.addEventListener('input', handler);
        break;
      }
      case 'highboost': {
        const sigmaSlider = document.getElementById('shpg-hb-sigma');
        const sigmaVal = document.getElementById('shpg-hb-sigma-val');
        const aSlider = document.getElementById('shpg-hb-a');
        const aVal = document.getElementById('shpg-hb-a-val');

        const extraHB = () => {
          if (sigmaSlider && sigmaVal) sigmaVal.textContent = parseFloat(sigmaSlider.value).toFixed(1);
          if (aSlider && aVal) aVal.textContent = parseFloat(aSlider.value).toFixed(1);
        };
        const handler = attachCommon('shpg-hb', extraHB);
        if (sigmaSlider) sigmaSlider.addEventListener('input', handler);
        if (aSlider) aSlider.addEventListener('input', handler);
        break;
      }
    }
  }

  /* ----------------------------------------------------------
   * Get Current Parameters
   * ---------------------------------------------------------- */

  function getParams() {
    const getCommonPadStride = (prefix) => {
      const paddingSel = document.getElementById(`${prefix}-padding`);
      const strideSlider = document.getElementById(`${prefix}-stride`);
      return {
        paddingType: paddingSel ? paddingSel.value : 'zero',
        stride: strideSlider ? parseInt(strideSlider.value) : 1
      };
    };

    switch (currentFilter) {
      case 'laplacian': {
        const lapType = document.getElementById('shpg-lap-type');
        const common = getCommonPadStride('shpg-lap');
        return { lapType: lapType ? lapType.value : '4', ...common };
      }
      case 'sobel': {
        const sizeSlider = document.getElementById('shpg-sobel-size');
        const axisSel = document.getElementById('shpg-sobel-axis');
        const common = getCommonPadStride('shpg-sobel');
        return { 
          size: sizeSlider ? parseInt(sizeSlider.value) : 3, 
          axis: axisSel ? axisSel.value : 'mag',
          ...common 
        };
      }
      case 'canny': {
        const lowSlider = document.getElementById('shpg-canny-low');
        const highSlider = document.getElementById('shpg-canny-high');
        const sigmaSlider = document.getElementById('shpg-canny-sigma');
        return {
          lowThresh: lowSlider ? parseInt(lowSlider.value) : 50,
          highThresh: highSlider ? parseInt(highSlider.value) : 150,
          sigma: sigmaSlider ? parseFloat(sigmaSlider.value) : 1.0,
        };
      }
      case 'prewitt': {
        return getCommonPadStride('shpg-prewitt');
      }
      case 'unsharp': {
        const sizeSlider = document.getElementById('shpg-unsharp-size');
        const sigmaSlider = document.getElementById('shpg-unsharp-sigma');
        const kSlider = document.getElementById('shpg-unsharp-k');
        const common = getCommonPadStride('shpg-unsharp');
        return {
          kSize: sizeSlider ? parseInt(sizeSlider.value) : 3,
          sigma: sigmaSlider ? parseFloat(sigmaSlider.value) : 1.0,
          k: kSlider ? parseFloat(kSlider.value) : 1.0,
          ...common
        };
      }
      case 'highboost': {
        const sizeSlider = document.getElementById('shpg-hb-size');
        const sigmaSlider = document.getElementById('shpg-hb-sigma');
        const aSlider = document.getElementById('shpg-hb-a');
        const common = getCommonPadStride('shpg-hb');
        return {
          kSize: sizeSlider ? parseInt(sizeSlider.value) : 3,
          sigma: sigmaSlider ? parseFloat(sigmaSlider.value) : 1.0,
          A: aSlider ? parseFloat(aSlider.value) : 1.5,
          ...common
        };
      }
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
      case 'laplacian':
        result = SharpenProcessing.applyLaplacianFilter(originalImageData, params.lapType, params.paddingType, params.stride);
        break;
      case 'sobel':
        result = SharpenProcessing.applySobelFilter(originalImageData, params.size, params.axis, params.paddingType, params.stride);
        break;
      case 'canny':
        result = SharpenProcessing.applyCannyFilter(originalImageData, params.lowThresh, params.highThresh, params.sigma);
        break;
      case 'prewitt':
        result = SharpenProcessing.applyPrewittFilter(originalImageData, params.paddingType, params.stride);
        break;
      case 'unsharp':
        result = SharpenProcessing.applyUnsharpMask(originalImageData, params.kSize, params.sigma, params.k, params.paddingType, params.stride);
        break;
      case 'highboost':
        result = SharpenProcessing.applyHighBoost(originalImageData, params.kSize, params.sigma, params.A, params.paddingType, params.stride);
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
    const paddingType = params.paddingType || 'zero';
    const stride = params.stride || 1;

    // Extract small pixel matrix
    const matrixSize = 8;
    const pixels = SmoothProcessing.extractPixelMatrix(originalImageData, matrixSize);

    // Determine kernel(s) and filter type for visualization
    let kernel = null;
    let kernelLabel = null;
    let isGradient = false;
    let kSize = 3;

    switch (currentFilter) {
      case 'laplacian':
        kernel = SharpenProcessing.createLaplacianKernel(params.lapType || '4');
        kernelLabel = 'Laplacian';
        kSize = 3;
        break;
      case 'sobel': {
        kSize = params.size || 3;
        const sobel = SharpenProcessing.createSobelKernels(kSize);
        const axis = params.axis || 'mag';
        if (axis === 'y') {
          kernel = sobel.ky; kernelLabel = 'Sobel Gy';
        } else if (axis === 'diag1') {
          kernel = sobel.kx_diag1; kernelLabel = 'Sobel Main Diag';
        } else if (axis === 'diag2') {
          kernel = sobel.ky_diag2; kernelLabel = 'Sobel Sec Diag';
        } else {
          kernel = sobel.kx; kernelLabel = 'Sobel Gx'; // default for mag and x
        }
        isGradient = true;
        break;
      }
      case 'canny': {
        kSize = Math.max(3, Math.ceil((params.sigma || 1.0) * 3));
        kSize = kSize % 2 === 0 ? kSize + 1 : kSize;
        kernel = SmoothProcessing.createGaussianKernel(kSize, kSize, params.sigma || 1.0);
        kernelLabel = 'Gaussian Blur (Step 1 of Canny)';
        break;
      }
      case 'prewitt': {
        const prewitt = SharpenProcessing.createPrewittKernels();
        kernel = prewitt.kx; // Show Gx for viz
        kernelLabel = 'Prewitt Gx';
        kSize = 3;
        isGradient = true;
        break;
      }
      case 'unsharp': {
        kSize = params.kSize || 3;
        kernel = SmoothProcessing.createGaussianKernel(kSize, kSize, params.sigma || 1.0);
        kernelLabel = 'Gaussian (for blur)';
        break;
      }
      case 'highboost': {
        kSize = params.kSize || 3;
        kernel = SmoothProcessing.createGaussianKernel(kSize, kSize, params.sigma || 1.0);
        kernelLabel = 'Gaussian (for blur)';
        break;
      }
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
    renderVisualizationLayout(inputMatrix, kernel, outH, outW, kSize, kernelLabel, hasPadding, padH, padW, pixels.length, pixels[0].length);

    // Start the step-by-step simulation
    simulateConvolution(inputMatrix, kernel, kSize, outH, outW, isGradient, stride, params);
  }

  function renderVisualizationLayout(inputMatrix, kernel, outH, outW, kSize, kernelLabel, hasPadding, padH, padW, origH, origW) {
    convContainer.innerHTML = '';

    // Main wrapper
    const wrapper = document.createElement('div');
    wrapper.className = 'conv-viz-wrapper';

    // Top row: Input ⊛ Kernel
    const topRow = document.createElement('div');
    topRow.className = 'conv-viz-top-row';

    // Input matrix
    const inputSection = createGridSection('المدخلات (Input)', inputMatrix, 'sh-input', hasPadding, padH, padW, origH, origW);
    topRow.appendChild(inputSection);

    // Operator symbol
    const opSymbol = document.createElement('div');
    opSymbol.className = 'conv-viz-operator';
    opSymbol.textContent = '⊛';
    topRow.appendChild(opSymbol);

    // Kernel section
    if (kernel) {
      const kernelSection = createGridSection(kernelLabel || 'الـ Kernel', kernel, 'sh-kernel', false);
      topRow.appendChild(kernelSection);
    }

    wrapper.appendChild(topRow);

    // Equals symbol
    const eqRow = document.createElement('div');
    eqRow.className = 'conv-viz-eq-row';
    eqRow.innerHTML = '<span class="text-2xl font-bold text-slate-400 dark:text-slate-500">=</span>';
    wrapper.appendChild(eqRow);

    // Output matrix
    const outputData = Array.from({ length: outH }, () => Array(outW).fill(''));
    const outputSection = createGridSection('الناتج (Output)', outputData, 'sh-output', false);
    wrapper.appendChild(outputSection);

    // Control buttons
    const controls = document.createElement('div');
    controls.className = 'conv-viz-controls';
    controls.innerHTML = `
      <button id="sh-conv-pause-btn" class="conv-ctrl-btn conv-ctrl-pause">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        إيقاف مؤقت
      </button>
      <button id="sh-conv-stop-btn" class="conv-ctrl-btn conv-ctrl-stop">
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
    calcDisplay.id = 'sh-conv-calc-display';
    calcDisplay.className = 'conv-calc-display';
    calcDisplay.textContent = 'ابدأ المحاكاة...';
    wrapper.appendChild(calcDisplay);

    convContainer.appendChild(wrapper);

    // Bind control buttons
    const pauseBtn = document.getElementById('sh-conv-pause-btn');
    const stopBtn = document.getElementById('sh-conv-stop-btn');

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
        if (prefix === 'sh-kernel') {
          cell.textContent = typeof val === 'number' ? (Number.isInteger(val) ? val : val.toFixed(3)) : '';
          cell.classList.add('kernel-cell');
        } else if (prefix === 'sh-output') {
          cell.textContent = '';
        } else {
          cell.textContent = typeof val === 'number' ? Math.floor(val) : '';
        }

        // Mark padding cells
        if (hasPadding && prefix === 'sh-input') {
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

  function simulateConvolution(inputMatrix, kernel, kSize, outH, outW, isGradient, stride = 1, params = {}) {
    simState.currentI = 0;
    simState.currentJ = 0;
    simState.running = true;
    simState.paused = false;

    const calcDisplay = document.getElementById('sh-conv-calc-display');
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
          const inCell = document.getElementById(`sh-input-${startI + ki}-${startJ + kj}`);
          if (inCell) inCell.classList.add('highlight-input');
        }
      }

      // Highlight kernel
      if (kernel) {
        for (let ki = 0; ki < kSize; ki++) {
          for (let kj = 0; kj < kSize; kj++) {
            const kCell = document.getElementById(`sh-kernel-${ki}-${kj}`);
            if (kCell) kCell.classList.add('highlight-kernel');
          }
        }
      }

      // Compute the output value
      let outputVal;
      let calcText;

      // Convolution: sum of element-wise products
      let sum = 0;
      const terms = [];
      for (let ki = 0; ki < kSize; ki++) {
        for (let kj = 0; kj < kSize; kj++) {
          const pixVal = inputMatrix[startI + ki][startJ + kj];
          const kVal = kernel[ki][kj];
          sum += pixVal * kVal;
          terms.push(`${pixVal}×${Number.isInteger(kVal) ? kVal : kVal.toFixed(2)}`);
        }
      }
      outputVal = Math.floor(Math.max(0, Math.min(255, Math.abs(sum))));
      // Show abbreviated calculation
      if (terms.length <= 9) {
        calcText = `Σ = ${terms.join(' + ')} = ${outputVal}`;
      } else {
        calcText = `Σ(${terms.length} terms) = ${outputVal}`;
      }

      // Highlight output cell and write value
      const outCell = document.getElementById(`sh-output-${i}-${j}`);
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
        const cell = document.getElementById(`sh-input-${i}-${j}`);
        if (cell) cell.classList.remove('highlight-input');
      }
    }
    // Clear kernel highlights
    for (let i = 0; i < kSize; i++) {
      for (let j = 0; j < kSize; j++) {
        const cell = document.getElementById(`sh-kernel-${i}-${j}`);
        if (cell) cell.classList.remove('highlight-kernel');
      }
    }
    // Clear output highlight
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
    const { raw, highlighted } = SharpenCodeGenerator.generate(currentFilter, params);
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
      const btn = document.getElementById('sharpen-playground-copy-code');
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
    currentFilter = 'laplacian';
    const typeSelect = document.getElementById('sharpen-playground-type-select');
    if (typeSelect) typeSelect.value = 'laplacian';

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
