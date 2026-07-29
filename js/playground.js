/* ============================================================
   Vision Studio — Interactive Playground
   Image upload, live processing, slider controls, code generation
   ============================================================ */

const Playground = (() => {
  'use strict';

  // State
  let originalImageData = null;
  let currentType = 'negative';
  let isProcessing = false;

  // DOM references (populated on init)
  let dropZone, fileInput, originalCanvas, processedCanvas;
  let origCtx, procCtx;
  let codeBlock, codeRaw;
  let controlsContainer, histogramCanvas;

  /**
   * Initialize the Playground module.
   */
  function init() {
    // Get DOM elements
    dropZone = document.getElementById('playground-dropzone');
    fileInput = document.getElementById('playground-file-input');
    originalCanvas = document.getElementById('playground-original');
    processedCanvas = document.getElementById('playground-processed');
    codeBlock = document.getElementById('playground-code');
    controlsContainer = document.getElementById('playground-controls');
    histogramCanvas = document.getElementById('playground-histogram');

    if (!originalCanvas || !processedCanvas) return;

    origCtx = originalCanvas.getContext('2d');
    procCtx = processedCanvas.getContext('2d');

    // Setup drag & drop
    setupDropZone();

    // Setup transformation type selector
    const typeSelect = document.getElementById('playground-type-select');
    if (typeSelect) {
      typeSelect.addEventListener('change', (e) => {
        currentType = e.target.value;
        renderControls();
        applyTransformation();
        updateCode();
      });
    }

    // Reset button
    const resetBtn = document.getElementById('playground-reset');
    if (resetBtn) {
      resetBtn.addEventListener('click', resetPlayground);
    }

    // Copy code button
    const copyBtn = document.getElementById('playground-copy-code');
    if (copyBtn) {
      copyBtn.addEventListener('click', copyCode);
    }

    // Load default sample image
    loadSampleGradient();

    // Render initial controls and code
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
        // Limit size for performance
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

        // Update drop zone text
        dropZone.querySelector('.drop-text').textContent = file.name;

        applyTransformation();
        drawHistogram();
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  function loadSampleGradient() {
    const w = 300, h = 200;
    originalCanvas.width = w;
    originalCanvas.height = h;
    processedCanvas.width = w;
    processedCanvas.height = h;

    // Draw a sample image with various tones
    const grad = origCtx.createLinearGradient(0, 0, w, 0);
    grad.addColorStop(0, '#111');
    grad.addColorStop(0.25, '#444');
    grad.addColorStop(0.5, '#888');
    grad.addColorStop(0.75, '#bbb');
    grad.addColorStop(1, '#eee');
    origCtx.fillStyle = grad;
    origCtx.fillRect(0, 0, w, h);

    // Add shapes for visual depth
    origCtx.fillStyle = '#222';
    origCtx.fillRect(30, 30, 60, 120);
    origCtx.fillStyle = '#555';
    origCtx.beginPath();
    origCtx.arc(w * 0.4, h * 0.5, 40, 0, Math.PI * 2);
    origCtx.fill();
    origCtx.fillStyle = '#999';
    origCtx.fillRect(w * 0.55, 25, 55, 130);
    origCtx.fillStyle = '#ccc';
    origCtx.beginPath();
    origCtx.arc(w * 0.82, h * 0.5, 35, 0, Math.PI * 2);
    origCtx.fill();

    originalImageData = origCtx.getImageData(0, 0, w, h);
    applyTransformation();
    drawHistogram();
  }

  /* ----------------------------------------------------------
   * Dynamic Controls Rendering
   * ---------------------------------------------------------- */

  function renderControls() {
    if (!controlsContainer) return;

    const controlsMap = {
      negative: `
        <div class="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
          <svg class="w-8 h-8 mx-auto mb-2 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"/>
          </svg>
          لا يحتاج معاملات — يُطبَّق تلقائياً
        </div>
      `,
      log: `
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <label class="text-sm font-medium text-slate-700 dark:text-slate-300">الثابت c</label>
            <span id="pg-log-val" class="text-sm font-mono text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded">46.0</span>
          </div>
          <input type="range" id="pg-log-c" min="1" max="100" step="0.5" value="46" class="w-full">
        </div>
      `,
      gamma: `
        <div class="space-y-4">
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <label class="text-sm font-medium text-slate-700 dark:text-slate-300">قيمة غاما (γ)</label>
              <span id="pg-gamma-val" class="text-sm font-mono text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded">1.00</span>
            </div>
            <input type="range" id="pg-gamma-gamma" min="0.04" max="5" step="0.01" value="1" class="w-full">
          </div>
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <label class="text-sm font-medium text-slate-700 dark:text-slate-300">الثابت c</label>
              <span id="pg-gamma-c-val" class="text-sm font-mono text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded">1.00</span>
            </div>
            <input type="range" id="pg-gamma-c" min="0.1" max="3" step="0.01" value="1" class="w-full">
          </div>
        </div>
      `,
      threshold: `
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <label class="text-sm font-medium text-slate-700 dark:text-slate-300">قيمة العتبة (T)</label>
            <span id="pg-threshold-val" class="text-sm font-mono text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded">128</span>
          </div>
          <input type="range" id="pg-threshold-t" min="0" max="255" step="1" value="128" class="w-full">
        </div>
      `,
      contrast: `
        <div class="space-y-3">
          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-1">
              <div class="flex items-center justify-between">
                <label class="text-xs font-medium text-slate-600 dark:text-slate-400">r₁</label>
                <span id="pg-r1-val" class="text-xs font-mono text-indigo-500">70</span>
              </div>
              <input type="range" id="pg-contrast-r1" min="0" max="254" step="1" value="70" class="w-full">
            </div>
            <div class="space-y-1">
              <div class="flex items-center justify-between">
                <label class="text-xs font-medium text-slate-600 dark:text-slate-400">s₁</label>
                <span id="pg-s1-val" class="text-xs font-mono text-indigo-500">0</span>
              </div>
              <input type="range" id="pg-contrast-s1" min="0" max="255" step="1" value="0" class="w-full">
            </div>
            <div class="space-y-1">
              <div class="flex items-center justify-between">
                <label class="text-xs font-medium text-slate-600 dark:text-slate-400">r₂</label>
                <span id="pg-r2-val" class="text-xs font-mono text-indigo-500">180</span>
              </div>
              <input type="range" id="pg-contrast-r2" min="1" max="255" step="1" value="180" class="w-full">
            </div>
            <div class="space-y-1">
              <div class="flex items-center justify-between">
                <label class="text-xs font-medium text-slate-600 dark:text-slate-400">s₂</label>
                <span id="pg-s2-val" class="text-xs font-mono text-indigo-500">255</span>
              </div>
              <input type="range" id="pg-contrast-s2" min="0" max="255" step="1" value="255" class="w-full">
            </div>
          </div>
          <div id="pg-contrast-vals" class="text-xs text-center text-slate-500 dark:text-slate-400 font-mono">(r₁=70, s₁=0) → (r₂=180, s₂=255)</div>
        </div>
      `,
      bitplane: `
        <div class="space-y-3">
          <label class="text-sm font-medium text-slate-700 dark:text-slate-300 block">اختر المستويات البتّية:</label>
          <div id="pg-bitplane-btns" class="flex gap-2 justify-center flex-row-reverse"></div>
          <div class="text-xs text-center text-slate-500 dark:text-slate-400">
            المستوى 7 = الأكثر أهمية (MSB) &nbsp;|&nbsp; المستوى 0 = الأقل أهمية (LSB)
          </div>
        </div>
      `,
      histeq: `
        <div class="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
          <svg class="w-8 h-8 mx-auto mb-2 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
          </svg>
          لا يحتاج معاملات — يُطبَّق تلقائياً<br>
          <span class="text-xs text-slate-400">يتم عرض الهيستوغرام لكل قناة لون قبل وبعد التسوية أدناه</span>
        </div>
        <div id="pg-histeq-charts" class="space-y-3 mt-2"></div>
      `,
    };

    controlsContainer.innerHTML = controlsMap[currentType] || '';

    // Attach event listeners after rendering
    requestAnimationFrame(() => bindControlEvents());
  }

  function bindControlEvents() {
    switch (currentType) {
      case 'log': {
        const slider = document.getElementById('pg-log-c');
        const valEl = document.getElementById('pg-log-val');
        if (slider) {
          slider.addEventListener('input', () => {
            if (valEl) valEl.textContent = parseFloat(slider.value).toFixed(1);
            applyTransformation();
            updateCode();
          });
        }
        break;
      }
      case 'gamma': {
        const gammaSlider = document.getElementById('pg-gamma-gamma');
        const cSlider = document.getElementById('pg-gamma-c');
        const gammaVal = document.getElementById('pg-gamma-val');
        const cVal = document.getElementById('pg-gamma-c-val');
        const handler = () => {
          if (gammaVal) gammaVal.textContent = parseFloat(gammaSlider.value).toFixed(2);
          if (cVal) cVal.textContent = parseFloat(cSlider.value).toFixed(2);
          applyTransformation();
          updateCode();
        };
        if (gammaSlider) gammaSlider.addEventListener('input', handler);
        if (cSlider) cSlider.addEventListener('input', handler);
        break;
      }
      case 'threshold': {
        const slider = document.getElementById('pg-threshold-t');
        const valEl = document.getElementById('pg-threshold-val');
        if (slider) {
          slider.addEventListener('input', () => {
            if (valEl) valEl.textContent = slider.value;
            applyTransformation();
            updateCode();
          });
        }
        break;
      }
      case 'contrast': {
        const r1 = document.getElementById('pg-contrast-r1');
        const s1 = document.getElementById('pg-contrast-s1');
        const r2 = document.getElementById('pg-contrast-r2');
        const s2 = document.getElementById('pg-contrast-s2');
        const valsEl = document.getElementById('pg-contrast-vals');
        const handler = () => {
          const r1v = parseInt(r1.value), s1v = parseInt(s1.value);
          const r2v = Math.max(r1v + 1, parseInt(r2.value)), s2v = parseInt(s2.value);
          r2.min = r1v + 1;
          if (parseInt(r2.value) <= r1v) r2.value = r1v + 1;
          document.getElementById('pg-r1-val').textContent = r1v;
          document.getElementById('pg-s1-val').textContent = s1v;
          document.getElementById('pg-r2-val').textContent = r2v;
          document.getElementById('pg-s2-val').textContent = s2v;
          if (valsEl) valsEl.textContent = `(r₁=${r1v}, s₁=${s1v}) → (r₂=${r2v}, s₂=${s2v})`;
          applyTransformation();
          updateCode();
        };
        [r1, s1, r2, s2].forEach(s => { if (s) s.addEventListener('input', handler); });
        break;
      }
      case 'bitplane': {
        const btnsContainer = document.getElementById('pg-bitplane-btns');
        if (!btnsContainer) break;
        const selectedPlanes = new Set([7]);
        btnsContainer.innerHTML = '';
        for (let i = 7; i >= 0; i--) {
          const btn = document.createElement('button');
          btn.className = `bit-btn ${i === 7 ? 'active' : ''}`;
          btn.textContent = i;
          btn.dataset.bit = i;
          btn.addEventListener('click', () => {
            if (selectedPlanes.has(i)) {
              selectedPlanes.delete(i);
              btn.classList.remove('active');
            } else {
              selectedPlanes.add(i);
              btn.classList.add('active');
            }
            applyTransformation();
            updateCode();
          });
          btnsContainer.appendChild(btn);
        }
        // Store reference for getParams
        btnsContainer._selectedPlanes = selectedPlanes;
        break;
      }
    }
  }

  /* ----------------------------------------------------------
   * Get current parameters from controls
   * ---------------------------------------------------------- */

  function getParams() {
    switch (currentType) {
      case 'negative':
        return {};
      case 'log': {
        const slider = document.getElementById('pg-log-c');
        return { c: slider ? parseFloat(slider.value) : 46.0 };
      }
      case 'gamma': {
        const g = document.getElementById('pg-gamma-gamma');
        const c = document.getElementById('pg-gamma-c');
        return {
          gamma: g ? parseFloat(g.value) : 1.0,
          c: c ? parseFloat(c.value) : 1.0,
        };
      }
      case 'threshold': {
        const slider = document.getElementById('pg-threshold-t');
        return { threshold: slider ? parseInt(slider.value) : 128 };
      }
      case 'contrast': {
        const r1 = document.getElementById('pg-contrast-r1');
        const s1 = document.getElementById('pg-contrast-s1');
        const r2 = document.getElementById('pg-contrast-r2');
        const s2 = document.getElementById('pg-contrast-s2');
        return {
          r1: r1 ? parseInt(r1.value) : 70,
          s1: s1 ? parseInt(s1.value) : 0,
          r2: r2 ? parseInt(r2.value) : 180,
          s2: s2 ? parseInt(s2.value) : 255,
        };
      }
      case 'bitplane': {
        const btnsContainer = document.getElementById('pg-bitplane-btns');
        const planes = btnsContainer && btnsContainer._selectedPlanes
          ? Array.from(btnsContainer._selectedPlanes)
          : [7];
        return { planes };
      }
      case 'histeq':
        return {};
      default:
        return {};
    }
  }

  /* ----------------------------------------------------------
   * Apply Transformation
   * ---------------------------------------------------------- */

  function applyTransformation() {
    if (!originalImageData || isProcessing) return;
    isProcessing = true;

    const params = getParams();
    let result;

    switch (currentType) {
      case 'negative':
        result = ImageProcessing.applyNegative(originalImageData);
        break;
      case 'log':
        result = ImageProcessing.applyLog(originalImageData, params.c);
        break;
      case 'gamma':
        result = ImageProcessing.applyGamma(originalImageData, params.gamma, params.c);
        break;
      case 'threshold':
        result = ImageProcessing.applyThreshold(originalImageData, params.threshold);
        break;
      case 'contrast':
        result = ImageProcessing.applyContrastStretch(originalImageData, params.r1, params.s1, params.r2, params.s2);
        break;
      case 'bitplane':
        result = ImageProcessing.applyBitPlane(originalImageData, params.planes);
        break;
      case 'histeq':
        result = ImageProcessing.applyHistogramEqualization(originalImageData);
        break;
      default:
        result = originalImageData;
    }

    procCtx.putImageData(result, 0, 0);
    drawHistogram(result);

    // For histogram equalization, draw per-channel before/after histograms
    if (currentType === 'histeq') {
      drawChannelHistograms(originalImageData, result);
    }

    isProcessing = false;
  }

  /* ----------------------------------------------------------
   * Update Code Panel
   * ---------------------------------------------------------- */

  function updateCode() {
    if (!codeBlock) return;
    const params = getParams();
    const { raw, highlighted } = CodeGenerator.generate(currentType, params);
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
      const btn = document.getElementById('playground-copy-code');
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
   * Histogram
   * ---------------------------------------------------------- */

  function drawHistogram(imageData) {
    if (!histogramCanvas) return;
    const canvas = histogramCanvas;
    const ctx = canvas.getContext('2d');
    const w = canvas.width = canvas.offsetWidth || 300;
    const h = canvas.height = 100;

    ctx.clearRect(0, 0, w, h);

    const data = imageData || originalImageData;
    if (!data) return;

    const hist = ImageProcessing.computeHistogram(data);
    const maxFreq = Math.max(...hist);

    // Background
    const isDark = document.documentElement.classList.contains('dark');
    ctx.fillStyle = isDark ? '#111827' : '#f8fafc';
    ctx.fillRect(0, 0, w, h);

    // Draw bars
    const barWidth = w / 256;
    ctx.fillStyle = isDark ? 'rgba(129,140,248,0.6)' : 'rgba(99,102,241,0.5)';

    for (let i = 0; i < 256; i++) {
      const barHeight = (hist[i] / maxFreq) * (h - 4);
      ctx.fillRect(i * barWidth, h - barHeight, Math.max(barWidth - 0.5, 1), barHeight);
    }
  }

  /**
   * Draw per-channel (R, G, B) histograms before and after equalization.
   */
  function drawChannelHistograms(beforeData, afterData) {
    const container = document.getElementById('pg-histeq-charts');
    if (!container) return;
    container.innerHTML = '';

    const isDark = document.documentElement.classList.contains('dark');
    const bgColor = isDark ? '#1f2937' : '#f8fafc';
    const borderColor = isDark ? '#374151' : '#e2e8f0';

    const beforeHists = ImageProcessing.computeChannelHistograms(beforeData);
    const afterHists = ImageProcessing.computeChannelHistograms(afterData);

    const channels = [
      { key: 'r', label: 'أحمر (Red)',  color: isDark ? 'rgba(248,113,113,0.7)' : 'rgba(239,68,68,0.6)' },
      { key: 'g', label: 'أخضر (Green)', color: isDark ? 'rgba(74,222,128,0.7)' : 'rgba(34,197,94,0.6)' },
      { key: 'b', label: 'أزرق (Blue)',  color: isDark ? 'rgba(96,165,250,0.7)' : 'rgba(59,130,246,0.6)' },
    ];

    for (const ch of channels) {
      // Channel wrapper
      const chWrapper = document.createElement('div');
      chWrapper.className = 'rounded-lg border p-3';
      chWrapper.style.borderColor = borderColor;
      chWrapper.style.background = bgColor;

      // Channel label
      const label = document.createElement('div');
      label.className = 'text-xs font-semibold text-center mb-2';
      label.style.color = ch.color;
      label.textContent = ch.label;
      chWrapper.appendChild(label);

      // Before/After row
      const row = document.createElement('div');
      row.className = 'grid grid-cols-2 gap-2';

      // Before histogram
      const beforeCol = document.createElement('div');
      const beforeLabel = document.createElement('div');
      beforeLabel.className = 'text-[10px] text-center text-slate-400 mb-1';
      beforeLabel.textContent = 'قبل التسوية';
      const beforeCanvas = document.createElement('canvas');
      beforeCanvas.style.width = '100%';
      beforeCanvas.style.height = '50px';
      beforeCanvas.style.borderRadius = '4px';
      beforeCol.appendChild(beforeLabel);
      beforeCol.appendChild(beforeCanvas);

      // After histogram
      const afterCol = document.createElement('div');
      const afterLabel = document.createElement('div');
      afterLabel.className = 'text-[10px] text-center text-slate-400 mb-1';
      afterLabel.textContent = 'بعد التسوية';
      const afterCanvas = document.createElement('canvas');
      afterCanvas.style.width = '100%';
      afterCanvas.style.height = '50px';
      afterCanvas.style.borderRadius = '4px';
      afterCol.appendChild(afterLabel);
      afterCol.appendChild(afterCanvas);

      row.appendChild(beforeCol);
      row.appendChild(afterCol);
      chWrapper.appendChild(row);
      container.appendChild(chWrapper);

      // Draw on next frame after layout
      requestAnimationFrame(() => {
        drawSingleChannelHist(beforeCanvas, beforeHists[ch.key], ch.color, bgColor);
        drawSingleChannelHist(afterCanvas, afterHists[ch.key], ch.color, bgColor);
      });
    }
  }

  /**
   * Draw a single channel histogram on a canvas.
   */
  function drawSingleChannelHist(canvas, hist, barColor, bgColor) {
    const w = canvas.width = canvas.offsetWidth || 150;
    const h = canvas.height = 50;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, w, h);

    const maxFreq = Math.max(...hist);
    if (maxFreq === 0) return;

    const barWidth = w / 256;
    ctx.fillStyle = barColor;

    for (let i = 0; i < 256; i++) {
      const barHeight = (hist[i] / maxFreq) * (h - 2);
      ctx.fillRect(i * barWidth, h - barHeight, Math.max(barWidth - 0.3, 0.8), barHeight);
    }
  }

  /* ----------------------------------------------------------
   * Reset
   * ---------------------------------------------------------- */

  function resetPlayground() {
    currentType = 'negative';
    const typeSelect = document.getElementById('playground-type-select');
    if (typeSelect) typeSelect.value = 'negative';

    loadSampleGradient();
    renderControls();
    updateCode();

    if (dropZone) {
      const dropText = dropZone.querySelector('.drop-text');
      if (dropText) dropText.textContent = 'اسحب صورة هنا أو انقر للتحميل';
    }
  }

  // Public API
  return { init };
})();
