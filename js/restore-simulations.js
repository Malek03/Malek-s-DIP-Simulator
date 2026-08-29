/* ============================================================
   Vision Studio — Image Restoration Canvas Simulations
   Interactive simulations for concept pages
   ============================================================ */

const RestoreSimulations = (() => {
  'use strict';

  // Shared sample image generator (gradient + shapes)
  function drawSampleImage(ctx, w, h) {
    // Dark gradient background
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#1e3a5f');
    grad.addColorStop(1, '#0f1f3a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // White rectangle
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(w * 0.15, h * 0.2, w * 0.3, h * 0.3);

    // Light gray circle
    ctx.fillStyle = '#cccccc';
    ctx.beginPath();
    ctx.arc(w * 0.65, h * 0.4, Math.min(w, h) * 0.15, 0, Math.PI * 2);
    ctx.fill();

    // Small bright square
    ctx.fillStyle = '#ffcc00';
    ctx.fillRect(w * 0.4, h * 0.6, w * 0.2, h * 0.15);

    // Thin white line
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(w * 0.1, h * 0.85);
    ctx.lineTo(w * 0.9, h * 0.85);
    ctx.stroke();
  }

  /* ----------------------------------------------------------
   * Noise Simulation — shows effect of different noise types
   * ---------------------------------------------------------- */

  function initNoise(containerId, typeSelectId, slider1Id, slider2Id, val1Id, val2Id) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Create canvases
    container.innerHTML = `
      <div class="grid grid-cols-2 gap-4">
        <div class="text-center">
          <div class="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">الصورة الأصلية</div>
          <canvas id="${containerId}-original" width="280" height="200" class="rounded-lg border border-slate-200 dark:border-gray-700 w-full"></canvas>
        </div>
        <div class="text-center">
          <div class="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">بعد إضافة الضوضاء</div>
          <canvas id="${containerId}-noisy" width="280" height="200" class="rounded-lg border border-slate-200 dark:border-gray-700 w-full"></canvas>
        </div>
      </div>
    `;

    const origCanvas = document.getElementById(`${containerId}-original`);
    const noisyCanvas = document.getElementById(`${containerId}-noisy`);
    const origCtx = origCanvas.getContext('2d');
    const noisyCtx = noisyCanvas.getContext('2d');
    const typeSelect = document.getElementById(typeSelectId);
    const slider1 = document.getElementById(slider1Id);
    const slider2 = document.getElementById(slider2Id);
    const val1 = document.getElementById(val1Id);
    const val2 = document.getElementById(val2Id);

    // Draw original
    drawSampleImage(origCtx, origCanvas.width, origCanvas.height);
    const originalData = origCtx.getImageData(0, 0, origCanvas.width, origCanvas.height);

    function update() {
      const type = typeSelect ? typeSelect.value : 'gaussian';
      let noisy;
      if (type === 'gaussian') {
        const mean = slider1 ? parseFloat(slider1.value) : 0;
        const sigma = slider2 ? parseFloat(slider2.value) : 25;
        if (val1) val1.textContent = mean;
        if (val2) val2.textContent = sigma;
        noisy = RestoreProcessing.addGaussianNoise(originalData, mean, sigma);
      } else if (type === 'salt-pepper') {
        const sp = slider1 ? parseFloat(slider1.value) : 0.02;
        const pp = slider2 ? parseFloat(slider2.value) : 0.02;
        if (val1) val1.textContent = sp;
        if (val2) val2.textContent = pp;
        noisy = RestoreProcessing.addSaltPepperNoise(originalData, sp, pp);
      } else {
        const low = slider1 ? parseFloat(slider1.value) : -30;
        const high = slider2 ? parseFloat(slider2.value) : 30;
        if (val1) val1.textContent = low;
        if (val2) val2.textContent = high;
        noisy = RestoreProcessing.addUniformNoise(originalData, low, high);
      }
      noisyCtx.putImageData(noisy, 0, 0);
    }

    if (slider1) slider1.addEventListener('input', update);
    if (slider2) slider2.addEventListener('input', update);
    if (typeSelect) typeSelect.addEventListener('change', update);

    update();
  }

  /* ----------------------------------------------------------
   * Arithmetic Mean Simulation
   * ---------------------------------------------------------- */

  function initArithmeticMean(containerId, sliderId, valueId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
      <div class="grid grid-cols-3 gap-3">
        <div class="text-center">
          <div class="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">الأصلية</div>
          <canvas id="${containerId}-orig" width="200" height="150" class="rounded-lg border border-slate-200 dark:border-gray-700 w-full"></canvas>
        </div>
        <div class="text-center">
          <div class="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">+ ضوضاء Gaussian</div>
          <canvas id="${containerId}-noisy" width="200" height="150" class="rounded-lg border border-slate-200 dark:border-gray-700 w-full"></canvas>
        </div>
        <div class="text-center">
          <div class="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">بعد الفلترة</div>
          <canvas id="${containerId}-filtered" width="200" height="150" class="rounded-lg border border-slate-200 dark:border-gray-700 w-full"></canvas>
        </div>
      </div>
    `;

    const origCanvas = document.getElementById(`${containerId}-orig`);
    const noisyCanvas = document.getElementById(`${containerId}-noisy`);
    const filteredCanvas = document.getElementById(`${containerId}-filtered`);
    const origCtx = origCanvas.getContext('2d');
    const noisyCtx = noisyCanvas.getContext('2d');
    const filteredCtx = filteredCanvas.getContext('2d');
    const slider = document.getElementById(sliderId);
    const valueEl = document.getElementById(valueId);

    drawSampleImage(origCtx, origCanvas.width, origCanvas.height);
    const origData = origCtx.getImageData(0, 0, origCanvas.width, origCanvas.height);
    const noisyData = RestoreProcessing.addGaussianNoise(origData, 0, 30);
    noisyCtx.putImageData(noisyData, 0, 0);

    function update() {
      const kSize = slider ? parseInt(slider.value) : 3;
      if (valueEl) valueEl.textContent = `${kSize}×${kSize}`;
      const result = RestoreProcessing.arithmeticMeanFilter(noisyData, kSize);
      filteredCtx.putImageData(result, 0, 0);
    }

    if (slider) slider.addEventListener('input', update);
    update();
  }

  /* ----------------------------------------------------------
   * Geometric Mean Simulation
   * ---------------------------------------------------------- */

  function initGeometricMean(containerId, sliderId, valueId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
      <div class="grid grid-cols-3 gap-3">
        <div class="text-center">
          <div class="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">الأصلية</div>
          <canvas id="${containerId}-orig" width="200" height="150" class="rounded-lg border border-slate-200 dark:border-gray-700 w-full"></canvas>
        </div>
        <div class="text-center">
          <div class="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">+ ضوضاء Gaussian</div>
          <canvas id="${containerId}-noisy" width="200" height="150" class="rounded-lg border border-slate-200 dark:border-gray-700 w-full"></canvas>
        </div>
        <div class="text-center">
          <div class="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">بعد الفلترة</div>
          <canvas id="${containerId}-filtered" width="200" height="150" class="rounded-lg border border-slate-200 dark:border-gray-700 w-full"></canvas>
        </div>
      </div>
    `;

    const origCanvas = document.getElementById(`${containerId}-orig`);
    const noisyCanvas = document.getElementById(`${containerId}-noisy`);
    const filteredCanvas = document.getElementById(`${containerId}-filtered`);
    const origCtx = origCanvas.getContext('2d');
    const noisyCtx = noisyCanvas.getContext('2d');
    const filteredCtx = filteredCanvas.getContext('2d');
    const slider = document.getElementById(sliderId);
    const valueEl = document.getElementById(valueId);

    drawSampleImage(origCtx, origCanvas.width, origCanvas.height);
    const origData = origCtx.getImageData(0, 0, origCanvas.width, origCanvas.height);
    const noisyData = RestoreProcessing.addGaussianNoise(origData, 0, 25);
    noisyCtx.putImageData(noisyData, 0, 0);

    function update() {
      const kSize = slider ? parseInt(slider.value) : 3;
      if (valueEl) valueEl.textContent = `${kSize}×${kSize}`;
      const result = RestoreProcessing.geometricMeanFilter(noisyData, kSize);
      filteredCtx.putImageData(result, 0, 0);
    }

    if (slider) slider.addEventListener('input', update);
    update();
  }

  /* ----------------------------------------------------------
   * Contra-Harmonic Mean Simulation
   * ---------------------------------------------------------- */

  function initContraHarmonicMean(containerId, sizeSliderId, qSliderId, sizeValId, qValId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
      <div class="grid grid-cols-3 gap-3">
        <div class="text-center">
          <div class="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">الأصلية</div>
          <canvas id="${containerId}-orig" width="200" height="150" class="rounded-lg border border-slate-200 dark:border-gray-700 w-full"></canvas>
        </div>
        <div class="text-center">
          <div class="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">+ ضوضاء S&P</div>
          <canvas id="${containerId}-noisy" width="200" height="150" class="rounded-lg border border-slate-200 dark:border-gray-700 w-full"></canvas>
        </div>
        <div class="text-center">
          <div class="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">بعد الفلترة</div>
          <canvas id="${containerId}-filtered" width="200" height="150" class="rounded-lg border border-slate-200 dark:border-gray-700 w-full"></canvas>
        </div>
      </div>
    `;

    const origCanvas = document.getElementById(`${containerId}-orig`);
    const noisyCanvas = document.getElementById(`${containerId}-noisy`);
    const filteredCanvas = document.getElementById(`${containerId}-filtered`);
    const origCtx = origCanvas.getContext('2d');
    const noisyCtx = noisyCanvas.getContext('2d');
    const filteredCtx = filteredCanvas.getContext('2d');
    const sizeSlider = document.getElementById(sizeSliderId);
    const qSlider = document.getElementById(qSliderId);
    const sizeVal = document.getElementById(sizeValId);
    const qVal = document.getElementById(qValId);

    drawSampleImage(origCtx, origCanvas.width, origCanvas.height);
    const origData = origCtx.getImageData(0, 0, origCanvas.width, origCanvas.height);
    const noisyData = RestoreProcessing.addSaltPepperNoise(origData, 0.03, 0.03);
    noisyCtx.putImageData(noisyData, 0, 0);

    function update() {
      const kSize = sizeSlider ? parseInt(sizeSlider.value) : 3;
      const Q = qSlider ? parseFloat(qSlider.value) : 1.5;
      if (sizeVal) sizeVal.textContent = `${kSize}×${kSize}`;
      if (qVal) qVal.textContent = Q.toFixed(1);
      const result = RestoreProcessing.contraHarmonicMeanFilter(noisyData, kSize, Q);
      filteredCtx.putImageData(result, 0, 0);
    }

    if (sizeSlider) sizeSlider.addEventListener('input', update);
    if (qSlider) qSlider.addEventListener('input', update);
    update();
  }

  /* ----------------------------------------------------------
   * Wiener Filter Simulation
   * ---------------------------------------------------------- */

  function initWiener(containerId, sizeSliderId, noiseSliderId, sizeValId, noiseValId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
      <div class="grid grid-cols-3 gap-3">
        <div class="text-center">
          <div class="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">الأصلية</div>
          <canvas id="${containerId}-orig" width="200" height="150" class="rounded-lg border border-slate-200 dark:border-gray-700 w-full"></canvas>
        </div>
        <div class="text-center">
          <div class="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">+ ضوضاء Gaussian</div>
          <canvas id="${containerId}-noisy" width="200" height="150" class="rounded-lg border border-slate-200 dark:border-gray-700 w-full"></canvas>
        </div>
        <div class="text-center">
          <div class="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">بعد وينر</div>
          <canvas id="${containerId}-filtered" width="200" height="150" class="rounded-lg border border-slate-200 dark:border-gray-700 w-full"></canvas>
        </div>
      </div>
    `;

    const origCanvas = document.getElementById(`${containerId}-orig`);
    const noisyCanvas = document.getElementById(`${containerId}-noisy`);
    const filteredCanvas = document.getElementById(`${containerId}-filtered`);
    const origCtx = origCanvas.getContext('2d');
    const noisyCtx = noisyCanvas.getContext('2d');
    const filteredCtx = filteredCanvas.getContext('2d');
    const sizeSlider = document.getElementById(sizeSliderId);
    const noiseSlider = document.getElementById(noiseSliderId);
    const sizeVal = document.getElementById(sizeValId);
    const noiseVal = document.getElementById(noiseValId);

    drawSampleImage(origCtx, origCanvas.width, origCanvas.height);
    const origData = origCtx.getImageData(0, 0, origCanvas.width, origCanvas.height);
    const noisyData = RestoreProcessing.addGaussianNoise(origData, 0, 35);
    noisyCtx.putImageData(noisyData, 0, 0);

    function update() {
      const kSize = sizeSlider ? parseInt(sizeSlider.value) : 5;
      const noiseVar = noiseSlider ? parseFloat(noiseSlider.value) : 500;
      if (sizeVal) sizeVal.textContent = `${kSize}×${kSize}`;
      if (noiseVal) noiseVal.textContent = noiseVar;
      const result = RestoreProcessing.wienerFilter(noisyData, kSize, noiseVar);
      filteredCtx.putImageData(result, 0, 0);
    }

    if (sizeSlider) sizeSlider.addEventListener('input', update);
    if (noiseSlider) noiseSlider.addEventListener('input', update);
    update();
  }

  /* ----------------------------------------------------------
   * Public API
   * ---------------------------------------------------------- */

  return {
    initNoise,
    initArithmeticMean,
    initGeometricMean,
    initContraHarmonicMean,
    initWiener
  };

})();
