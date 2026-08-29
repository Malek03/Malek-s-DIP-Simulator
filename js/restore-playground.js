/* ============================================================
   Vision Studio — Image Restoration Interactive Playground
   Noise addition + Restoration filters
   ============================================================ */

const RestorePlayground = (() => {
  'use strict';

  // State
  let originalImageData = null;
  let noisyImageData = null;
  let currentNoiseType = 'gaussian';
  let currentFilter = 'arithmetic';
  
  // DOM References
  let dropZone, fileInput;
  let origCanvas, noisyCanvas, procCanvas;
  let origCtx, noisyCtx, procCtx;
  let codeBlock, controlsContainer;

  function init() {
    dropZone = document.getElementById('restore-playground-dropzone');
    fileInput = document.getElementById('restore-playground-file-input');
    origCanvas = document.getElementById('restore-playground-original');
    noisyCanvas = document.getElementById('restore-playground-noisy');
    procCanvas = document.getElementById('restore-playground-processed');
    codeBlock = document.getElementById('restore-playground-code');
    controlsContainer = document.getElementById('restore-playground-controls');

    if (!origCanvas || !noisyCanvas || !procCanvas) return;

    origCtx = origCanvas.getContext('2d');
    noisyCtx = noisyCanvas.getContext('2d');
    procCtx = procCanvas.getContext('2d');

    setupDropZone();

    // Noise and Filter selectors
    const noiseSelect = document.getElementById('restore-noise-type-select');
    if (noiseSelect) {
      noiseSelect.addEventListener('change', (e) => {
        currentNoiseType = e.target.value;
        renderControls();
        applyNoiseAndFilter();
      });
    }

    const filterSelect = document.getElementById('restore-filter-type-select');
    if (filterSelect) {
      filterSelect.addEventListener('change', (e) => {
        currentFilter = e.target.value;
        renderControls();
        applyFilterOnly(); // Only re-apply filter, noise is same
        updateCode();
      });
    }

    // Reset button
    const resetBtn = document.getElementById('restore-playground-reset');
    if (resetBtn) {
      resetBtn.addEventListener('click', resetPlayground);
    }

    // Copy code button
    const copyBtn = document.getElementById('restore-playground-copy-code');
    if (copyBtn) {
      copyBtn.addEventListener('click', copyCode);
    }

    loadSampleImage();
    renderControls();
  }

  function setupDropZone() {
    dropZone.addEventListener('click', () => fileInput.click());
    
    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('border-cyan-500', 'bg-cyan-50', 'dark:bg-cyan-900/20');
    });

    dropZone.addEventListener('dragleave', (e) => {
      e.preventDefault();
      dropZone.classList.remove('border-cyan-500', 'bg-cyan-50', 'dark:bg-cyan-900/20');
    });

    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('border-cyan-500', 'bg-cyan-50', 'dark:bg-cyan-900/20');
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFile(e.dataTransfer.files[0]);
      }
    });

    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files.length > 0) {
        handleFile(e.target.files[0]);
      }
    });
  }

  function handleFile(file) {
    if (!file.type.match('image.*')) {
      alert('الرجاء اختيار ملف صورة صالح.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => processImage(img);
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  function loadSampleImage() {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => processImage(img);
    // Draw a synthetic sample image similar to what we used in simulations
    drawSyntheticSample();
  }

  function drawSyntheticSample() {
    // Generate a simple synthetic image on origCanvas
    const w = origCanvas.width;
    const h = origCanvas.height;
    
    // Background gradient
    const grad = origCtx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#2b4162');
    grad.addColorStop(1, '#fa9c7a');
    origCtx.fillStyle = grad;
    origCtx.fillRect(0, 0, w, h);

    // Some shapes
    origCtx.fillStyle = '#ffffff';
    origCtx.font = 'bold 40px Arial';
    origCtx.fillText('VISION', w * 0.2, h * 0.4);
    
    origCtx.fillStyle = '#333333';
    origCtx.fillRect(w * 0.6, h * 0.5, 60, 60);
    
    origCtx.beginPath();
    origCtx.arc(w * 0.3, h * 0.7, 40, 0, Math.PI * 2);
    origCtx.fillStyle = '#f0f0f0';
    origCtx.fill();

    // Extract data
    originalImageData = origCtx.getImageData(0, 0, w, h);
    applyNoiseAndFilter();
  }

  function processImage(img) {
    // Scale down if too large
    const MAX_SIZE = 400; // Keep small for performance with complex filters
    let w = img.width;
    let h = img.height;

    if (w > MAX_SIZE || h > MAX_SIZE) {
      const ratio = Math.min(MAX_SIZE / w, MAX_SIZE / h);
      w = Math.floor(w * ratio);
      h = Math.floor(h * ratio);
    }

    origCanvas.width = w;
    origCanvas.height = h;
    noisyCanvas.width = w;
    noisyCanvas.height = h;
    procCanvas.width = w;
    procCanvas.height = h;

    origCtx.drawImage(img, 0, 0, w, h);
    originalImageData = origCtx.getImageData(0, 0, w, h);
    
    applyNoiseAndFilter();
  }

  /* ----------------------------------------------------------
   * Controls Rendering
   * ---------------------------------------------------------- */

  function renderControls() {
    let noiseHtml = '';
    let filterHtml = '';

    // Noise Controls
    if (currentNoiseType === 'gaussian') {
      noiseHtml = `
        <div class="mb-4 bg-slate-50 dark:bg-gray-700/30 p-3 rounded-lg border border-slate-200 dark:border-gray-600">
          <div class="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 border-b border-slate-200 dark:border-gray-600 pb-1">إعدادات الضوضاء</div>
          <div class="flex justify-between items-center mb-1">
            <span class="text-sm text-slate-600 dark:text-slate-400">المتوسط (Mean)</span>
            <span class="text-sm font-bold text-cyan-600 dark:text-cyan-400" id="noise-val1">0</span>
          </div>
          <div class="flex items-center gap-2 mb-3">
            <input type="range" id="noise-param1" min="-50" max="50" step="1" value="0" class="w-full accent-cyan-500">
          </div>
          <div class="flex justify-between items-center mb-1">
            <span class="text-sm text-slate-600 dark:text-slate-400">الانحراف (Sigma)</span>
            <span class="text-sm font-bold text-cyan-600 dark:text-cyan-400" id="noise-val2">25</span>
          </div>
          <div class="flex items-center gap-2">
            <input type="range" id="noise-param2" min="1" max="100" step="1" value="25" class="w-full accent-cyan-500">
          </div>
        </div>
      `;
    } else if (currentNoiseType === 'salt-pepper') {
      noiseHtml = `
        <div class="mb-4 bg-slate-50 dark:bg-gray-700/30 p-3 rounded-lg border border-slate-200 dark:border-gray-600">
          <div class="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 border-b border-slate-200 dark:border-gray-600 pb-1">إعدادات الضوضاء</div>
          <div class="flex justify-between items-center mb-1">
            <span class="text-sm text-slate-600 dark:text-slate-400">احتمال Salt</span>
            <span class="text-sm font-bold text-cyan-600 dark:text-cyan-400" id="noise-val1">0.05</span>
          </div>
          <div class="flex items-center gap-2 mb-3">
            <input type="range" id="noise-param1" min="0" max="0.2" step="0.01" value="0.05" class="w-full accent-cyan-500">
          </div>
          <div class="flex justify-between items-center mb-1">
            <span class="text-sm text-slate-600 dark:text-slate-400">احتمال Pepper</span>
            <span class="text-sm font-bold text-cyan-600 dark:text-cyan-400" id="noise-val2">0.05</span>
          </div>
          <div class="flex items-center gap-2">
            <input type="range" id="noise-param2" min="0" max="0.2" step="0.01" value="0.05" class="w-full accent-cyan-500">
          </div>
        </div>
      `;
    } else if (currentNoiseType === 'uniform') {
      noiseHtml = `
        <div class="mb-4 bg-slate-50 dark:bg-gray-700/30 p-3 rounded-lg border border-slate-200 dark:border-gray-600">
          <div class="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 border-b border-slate-200 dark:border-gray-600 pb-1">إعدادات الضوضاء</div>
          <div class="flex justify-between items-center mb-1">
            <span class="text-sm text-slate-600 dark:text-slate-400">الحد الأدنى</span>
            <span class="text-sm font-bold text-cyan-600 dark:text-cyan-400" id="noise-val1">-30</span>
          </div>
          <div class="flex items-center gap-2 mb-3">
            <input type="range" id="noise-param1" min="-100" max="0" step="1" value="-30" class="w-full accent-cyan-500">
          </div>
          <div class="flex justify-between items-center mb-1">
            <span class="text-sm text-slate-600 dark:text-slate-400">الحد الأقصى</span>
            <span class="text-sm font-bold text-cyan-600 dark:text-cyan-400" id="noise-val2">30</span>
          </div>
          <div class="flex items-center gap-2">
            <input type="range" id="noise-param2" min="0" max="100" step="1" value="30" class="w-full accent-cyan-500">
          </div>
        </div>
      `;
    }

    // Filter Controls
    if (currentFilter === 'arithmetic' || currentFilter === 'geometric' || currentFilter === 'harmonic') {
      filterHtml = `
        <div class="mb-3">
          <div class="flex justify-between items-center mb-1">
            <span class="text-sm text-slate-600 dark:text-slate-400">حجم النافذة (Kernel Size)</span>
            <span class="text-sm font-bold text-cyan-600 dark:text-cyan-400" id="filter-size-val">3</span>
          </div>
          <div class="flex items-center gap-2">
            <input type="range" id="filter-size" min="3" max="9" step="2" value="3" class="w-full accent-cyan-500">
          </div>
        </div>
      `;
    } else if (currentFilter === 'contraharmonic') {
      filterHtml = `
        <div class="mb-3">
          <div class="flex justify-between items-center mb-1">
            <span class="text-sm text-slate-600 dark:text-slate-400">حجم النافذة (Kernel Size)</span>
            <span class="text-sm font-bold text-cyan-600 dark:text-cyan-400" id="filter-size-val">3</span>
          </div>
          <div class="flex items-center gap-2 mb-3">
            <input type="range" id="filter-size" min="3" max="9" step="2" value="3" class="w-full accent-cyan-500">
          </div>
          <div class="flex justify-between items-center mb-1">
            <span class="text-sm text-slate-600 dark:text-slate-400">الترتيب (Q)</span>
            <span class="text-sm font-bold text-cyan-600 dark:text-cyan-400" id="filter-q-val">1.5</span>
          </div>
          <div class="flex items-center gap-2">
            <input type="range" id="filter-q" min="-5" max="5" step="0.5" value="1.5" class="w-full accent-cyan-500">
          </div>
          <p class="text-xs text-slate-400 mt-2">ملاحظة: Q موجب لإزالة Pepper، Q سالب لإزالة Salt.</p>
        </div>
      `;
    } else if (currentFilter === 'alpha-trimmed') {
      filterHtml = `
        <div class="mb-3">
          <div class="flex justify-between items-center mb-1">
            <span class="text-sm text-slate-600 dark:text-slate-400">حجم النافذة (Kernel Size)</span>
            <span class="text-sm font-bold text-cyan-600 dark:text-cyan-400" id="filter-size-val">5</span>
          </div>
          <div class="flex items-center gap-2 mb-3">
            <input type="range" id="filter-size" min="3" max="9" step="2" value="5" class="w-full accent-cyan-500">
          </div>
          <div class="flex justify-between items-center mb-1">
            <span class="text-sm text-slate-600 dark:text-slate-400">عدد المحذوفات (d)</span>
            <span class="text-sm font-bold text-cyan-600 dark:text-cyan-400" id="filter-d-val">4</span>
          </div>
          <div class="flex items-center gap-2">
            <input type="range" id="filter-d" min="0" max="24" step="2" value="4" class="w-full accent-cyan-500">
          </div>
        </div>
      `;
    } else if (currentFilter === 'wiener') {
      filterHtml = `
        <div class="mb-3">
          <div class="flex justify-between items-center mb-1">
            <span class="text-sm text-slate-600 dark:text-slate-400">حجم النافذة (Kernel Size)</span>
            <span class="text-sm font-bold text-cyan-600 dark:text-cyan-400" id="filter-size-val">5</span>
          </div>
          <div class="flex items-center gap-2 mb-3">
            <input type="range" id="filter-size" min="3" max="9" step="2" value="5" class="w-full accent-cyan-500">
          </div>
          <div class="flex justify-between items-center mb-1">
            <span class="text-sm text-slate-600 dark:text-slate-400">تباين الضوضاء (Noise Variance)</span>
            <span class="text-sm font-bold text-cyan-600 dark:text-cyan-400" id="filter-var-val">500</span>
          </div>
          <div class="flex items-center gap-2">
            <input type="range" id="filter-var" min="10" max="2000" step="10" value="500" class="w-full accent-cyan-500">
          </div>
          <button id="btn-estimate-noise" class="mt-2 text-xs w-full py-1.5 bg-slate-200 dark:bg-gray-700 hover:bg-slate-300 dark:hover:bg-gray-600 rounded transition-colors">
            تقدير التباين تلقائياً
          </button>
        </div>
      `;
    }

    controlsContainer.innerHTML = noiseHtml + filterHtml;
    bindControlEvents();
    updateCode();
  }

  function bindControlEvents() {
    // Bind noise controls
    const np1 = document.getElementById('noise-param1');
    const np2 = document.getElementById('noise-param2');
    const nv1 = document.getElementById('noise-val1');
    const nv2 = document.getElementById('noise-val2');

    if (np1) {
      np1.addEventListener('input', (e) => {
        if (nv1) nv1.textContent = e.target.value;
        applyNoiseAndFilter();
      });
    }
    if (np2) {
      np2.addEventListener('input', (e) => {
        if (nv2) nv2.textContent = e.target.value;
        applyNoiseAndFilter();
      });
    }

    // Bind filter controls
    const fsize = document.getElementById('filter-size');
    const fsizeVal = document.getElementById('filter-size-val');
    
    if (fsize) {
      fsize.addEventListener('input', (e) => {
        if (fsizeVal) fsizeVal.textContent = e.target.value;
        
        // Update max for 'd' if alpha-trimmed
        const fd = document.getElementById('filter-d');
        if (fd && currentFilter === 'alpha-trimmed') {
          const k = parseInt(e.target.value);
          const maxD = (k * k) - 1;
          fd.max = maxD;
          if (parseInt(fd.value) > maxD) {
            fd.value = maxD - (maxD % 2); // keep even
            document.getElementById('filter-d-val').textContent = fd.value;
          }
        }
        
        applyFilterOnly();
      });
    }

    const fq = document.getElementById('filter-q');
    const fqVal = document.getElementById('filter-q-val');
    if (fq) {
      fq.addEventListener('input', (e) => {
        if (fqVal) fqVal.textContent = e.target.value;
        applyFilterOnly();
      });
    }

    const fd = document.getElementById('filter-d');
    const fdVal = document.getElementById('filter-d-val');
    if (fd) {
      fd.addEventListener('input', (e) => {
        if (fdVal) fdVal.textContent = e.target.value;
        applyFilterOnly();
      });
    }

    const fvar = document.getElementById('filter-var');
    const fvarVal = document.getElementById('filter-var-val');
    if (fvar) {
      fvar.addEventListener('input', (e) => {
        if (fvarVal) fvarVal.textContent = e.target.value;
        applyFilterOnly();
      });
    }

    const estBtn = document.getElementById('btn-estimate-noise');
    if (estBtn) {
      estBtn.addEventListener('click', () => {
        if (noisyImageData) {
          const est = RestoreProcessing.estimateNoiseVariance(noisyImageData);
          if (fvar && fvarVal) {
            fvar.value = Math.round(est);
            fvarVal.textContent = Math.round(est);
            applyFilterOnly();
          }
        }
      });
    }
  }

  function getNoiseParams() {
    const p1 = document.getElementById('noise-param1');
    const p2 = document.getElementById('noise-param2');
    const v1 = p1 ? parseFloat(p1.value) : 0;
    const v2 = p2 ? parseFloat(p2.value) : 0;
    
    if (currentNoiseType === 'gaussian') return { mean: v1, sigma: v2 };
    if (currentNoiseType === 'salt-pepper') return { saltProb: v1, pepperProb: v2 };
    return { low: v1, high: v2 };
  }

  function getFilterParams() {
    const fs = document.getElementById('filter-size');
    const kSize = fs ? parseInt(fs.value) : 3;

    if (currentFilter === 'contraharmonic') {
      const fq = document.getElementById('filter-q');
      return { kSize, Q: fq ? parseFloat(fq.value) : 1.5 };
    }
    if (currentFilter === 'alpha-trimmed') {
      const fd = document.getElementById('filter-d');
      return { kSize, d: fd ? parseInt(fd.value) : 4 };
    }
    if (currentFilter === 'wiener') {
      const fvar = document.getElementById('filter-var');
      return { kSize, noiseVar: fvar ? parseFloat(fvar.value) : 500 };
    }
    return { kSize }; // Arithmetic, Geometric, Harmonic
  }

  /* ----------------------------------------------------------
   * Processing
   * ---------------------------------------------------------- */

  function applyNoiseAndFilter() {
    if (!originalImageData) return;

    // Apply Noise
    const nParams = getNoiseParams();
    if (currentNoiseType === 'gaussian') {
      noisyImageData = RestoreProcessing.addGaussianNoise(originalImageData, nParams.mean, nParams.sigma);
    } else if (currentNoiseType === 'salt-pepper') {
      noisyImageData = RestoreProcessing.addSaltPepperNoise(originalImageData, nParams.saltProb, nParams.pepperProb);
    } else {
      noisyImageData = RestoreProcessing.addUniformNoise(originalImageData, nParams.low, nParams.high);
    }
    
    noisyCtx.putImageData(noisyImageData, 0, 0);

    // Apply Filter
    applyFilterOnly();
  }

  function applyFilterOnly() {
    if (!noisyImageData) return;

    const fParams = getFilterParams();
    let resultData;

    try {
      if (currentFilter === 'arithmetic') {
        resultData = RestoreProcessing.arithmeticMeanFilter(noisyImageData, fParams.kSize);
      } else if (currentFilter === 'geometric') {
        resultData = RestoreProcessing.geometricMeanFilter(noisyImageData, fParams.kSize);
      } else if (currentFilter === 'harmonic') {
        resultData = RestoreProcessing.harmonicMeanFilter(noisyImageData, fParams.kSize);
      } else if (currentFilter === 'contraharmonic') {
        resultData = RestoreProcessing.contraHarmonicMeanFilter(noisyImageData, fParams.kSize, fParams.Q);
      } else if (currentFilter === 'alpha-trimmed') {
        resultData = RestoreProcessing.alphaTrimmedMeanFilter(noisyImageData, fParams.kSize, fParams.d);
      } else if (currentFilter === 'wiener') {
        resultData = RestoreProcessing.wienerFilter(noisyImageData, fParams.kSize, fParams.noiseVar);
      }
      
      procCtx.putImageData(resultData, 0, 0);
      updatePSNR(resultData);
    } catch (e) {
      console.error("Filter error:", e);
    }
    updateCode();
  }

  function updatePSNR(restoredData) {
    const psnrLabel = document.getElementById('restore-psnr-value');
    if (!psnrLabel || !originalImageData) return;

    // Calculate PSNR between original (before noise) and restored
    const psnr = RestoreProcessing.calculatePSNR(originalImageData, restoredData);
    
    if (psnr === Infinity) {
      psnrLabel.textContent = "Infinity (متطابقة)";
    } else {
      psnrLabel.textContent = psnr.toFixed(2) + ' dB';
    }
    
    // Also calculate PSNR of noisy image to compare
    const psnrNoisy = RestoreProcessing.calculatePSNR(originalImageData, noisyImageData);
    const noisyLabel = document.getElementById('restore-noisy-psnr-value');
    if (noisyLabel) {
      noisyLabel.textContent = psnrNoisy === Infinity ? "Infinity" : psnrNoisy.toFixed(2) + ' dB';
    }
  }

  /* ----------------------------------------------------------
   * Code Generation
   * ---------------------------------------------------------- */

  function updateCode() {
    if (!RestoreCodeGenerator) return;
    const code = RestoreCodeGenerator.generateFullPipeline(
      currentNoiseType, getNoiseParams(),
      currentFilter, getFilterParams()
    );
    if (codeBlock) codeBlock.textContent = code;
  }

  function copyCode() {
    if (!codeBlock) return;
    navigator.clipboard.writeText(codeBlock.textContent).then(() => {
      const btn = document.getElementById('restore-playground-copy-code');
      if (!btn) return;
      const origText = btn.innerHTML;
      btn.innerHTML = `<svg class="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg> تم النسخ`;
      setTimeout(() => btn.innerHTML = origText, 2000);
    });
  }

  function resetPlayground() {
    currentNoiseType = 'gaussian';
    currentFilter = 'arithmetic';
    
    const noiseSelect = document.getElementById('restore-noise-type-select');
    if (noiseSelect) noiseSelect.value = 'gaussian';
    
    const filterSelect = document.getElementById('restore-filter-type-select');
    if (filterSelect) filterSelect.value = 'arithmetic';
    
    renderControls();
    loadSampleImage();
  }

  return { init };
})();
