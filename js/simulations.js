/* ============================================================
   Vision Studio — Concept Simulations
   Canvas-based interactive demos for each Point Processing concept
   ============================================================ */

const Simulations = (() => {
  'use strict';

  // Default sample image size for simulations
  const SIM_W = 400;
  const SIM_H = 150;

  // Track which simulations have been initialized
  const initialized = {};

  /**
   * Draws a grayscale gradient on a canvas.
   */
  function drawGradient(ctx, w, h) {
    const imgData = ImageProcessing.generateGradient(w, h);
    ctx.putImageData(imgData, 0, 0);
    return imgData;
  }

  /**
   * Draws a richer sample image with various gray levels (circles, rects).
   */
  function drawSampleImage(ctx, w, h) {
    // Start with gradient
    const grad = ctx.createLinearGradient(0, 0, w, 0);
    grad.addColorStop(0, '#000');
    grad.addColorStop(0.25, '#404040');
    grad.addColorStop(0.5, '#808080');
    grad.addColorStop(0.75, '#c0c0c0');
    grad.addColorStop(1, '#fff');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Add some geometric shapes for visual interest
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(20, 20, 60, 90);
    ctx.fillStyle = '#555';
    ctx.beginPath();
    ctx.arc(w * 0.35, h * 0.5, 35, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#999';
    ctx.fillRect(w * 0.5, 15, 65, 100);
    ctx.fillStyle = '#ccc';
    ctx.beginPath();
    ctx.arc(w * 0.8, h * 0.5, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#eee';
    ctx.fillRect(w * 0.88, 30, 40, 60);

    return ctx.getImageData(0, 0, w, h);
  }

  /**
   * Helper: Set up a pair of canvases (original + processed).
   */
  function setupCanvasPair(container, w, h) {
    container.innerHTML = '';

    const wrapper = document.createElement('div');
    wrapper.className = 'sim-canvas-wrap';

    // Original canvas
    const origWrap = document.createElement('div');
    origWrap.className = 'text-center';
    const origLabel = document.createElement('div');
    origLabel.className = 'text-xs text-slate-500 dark:text-slate-400 mb-1 font-semibold';
    origLabel.textContent = 'الصورة الأصلية';
    const origCanvas = document.createElement('canvas');
    origCanvas.width = w;
    origCanvas.height = h;
    origCanvas.style.maxWidth = '100%';
    origCanvas.style.height = 'auto';
    origWrap.appendChild(origLabel);
    origWrap.appendChild(origCanvas);

    // Processed canvas
    const procWrap = document.createElement('div');
    procWrap.className = 'text-center';
    const procLabel = document.createElement('div');
    procLabel.className = 'text-xs text-slate-500 dark:text-slate-400 mb-1 font-semibold';
    procLabel.textContent = 'الناتج';
    const procCanvas = document.createElement('canvas');
    procCanvas.width = w;
    procCanvas.height = h;
    procCanvas.style.maxWidth = '100%';
    procCanvas.style.height = 'auto';
    procWrap.appendChild(procLabel);
    procWrap.appendChild(procCanvas);

    wrapper.appendChild(origWrap);
    wrapper.appendChild(procWrap);
    container.appendChild(wrapper);

    return {
      origCtx: origCanvas.getContext('2d'),
      procCtx: procCanvas.getContext('2d'),
      origCanvas,
      procCanvas,
    };
  }

  /* ----------------------------------------------------------
   * 1. Negatives Simulation
   * ---------------------------------------------------------- */
  function initNegative(containerId) {
    if (initialized[containerId]) return;
    const container = document.getElementById(containerId);
    if (!container) return;

    const { origCtx, procCtx } = setupCanvasPair(container, SIM_W, SIM_H);
    const originalData = drawSampleImage(origCtx, SIM_W, SIM_H);
    const result = ImageProcessing.applyNegative(originalData);
    procCtx.putImageData(result, 0, 0);
    initialized[containerId] = true;
  }

  /* ----------------------------------------------------------
   * 2. Log Transformation Simulation
   * ---------------------------------------------------------- */
  function initLog(containerId, sliderId, valueId) {
    if (initialized[containerId]) return;
    const container = document.getElementById(containerId);
    const slider = document.getElementById(sliderId);
    const valueDisplay = document.getElementById(valueId);
    if (!container || !slider) return;

    const { origCtx, procCtx } = setupCanvasPair(container, SIM_W, SIM_H);
    const originalData = drawSampleImage(origCtx, SIM_W, SIM_H);

    function update() {
      const c = parseFloat(slider.value);
      if (valueDisplay) valueDisplay.textContent = c.toFixed(1);
      const result = ImageProcessing.applyLog(originalData, c);
      procCtx.putImageData(result, 0, 0);
    }

    slider.addEventListener('input', update);
    update();
    initialized[containerId] = true;
  }

  /* ----------------------------------------------------------
   * 3. Gamma Correction Simulation
   * ---------------------------------------------------------- */
  function initGamma(containerId, sliderId, valueId) {
    if (initialized[containerId]) return;
    const container = document.getElementById(containerId);
    const slider = document.getElementById(sliderId);
    const valueDisplay = document.getElementById(valueId);
    if (!container || !slider) return;

    const { origCtx, procCtx } = setupCanvasPair(container, SIM_W, SIM_H);
    const originalData = drawSampleImage(origCtx, SIM_W, SIM_H);

    function update() {
      const gamma = parseFloat(slider.value);
      if (valueDisplay) valueDisplay.textContent = gamma.toFixed(2);
      const result = ImageProcessing.applyGamma(originalData, gamma);
      procCtx.putImageData(result, 0, 0);
    }

    slider.addEventListener('input', update);
    update();
    initialized[containerId] = true;
  }

  /* ----------------------------------------------------------
   * 4. Thresholding Simulation
   * ---------------------------------------------------------- */
  function initThreshold(containerId, sliderId, valueId) {
    if (initialized[containerId]) return;
    const container = document.getElementById(containerId);
    const slider = document.getElementById(sliderId);
    const valueDisplay = document.getElementById(valueId);
    if (!container || !slider) return;

    const { origCtx, procCtx } = setupCanvasPair(container, SIM_W, SIM_H);
    const originalData = drawSampleImage(origCtx, SIM_W, SIM_H);

    function update() {
      const threshold = parseInt(slider.value);
      if (valueDisplay) valueDisplay.textContent = threshold;
      const result = ImageProcessing.applyThreshold(originalData, threshold);
      procCtx.putImageData(result, 0, 0);
    }

    slider.addEventListener('input', update);
    update();
    initialized[containerId] = true;
  }

  /* ----------------------------------------------------------
   * 5. Contrast Stretching Simulation
   * ---------------------------------------------------------- */
  function initContrast(containerId, r1Id, s1Id, r2Id, s2Id, valuesId) {
    if (initialized[containerId]) return;
    const container = document.getElementById(containerId);
    const r1Slider = document.getElementById(r1Id);
    const s1Slider = document.getElementById(s1Id);
    const r2Slider = document.getElementById(r2Id);
    const s2Slider = document.getElementById(s2Id);
    const valuesDisplay = document.getElementById(valuesId);
    if (!container || !r1Slider) return;

    const { origCtx, procCtx } = setupCanvasPair(container, SIM_W, SIM_H);
    const originalData = drawSampleImage(origCtx, SIM_W, SIM_H);

    function update() {
      const r1 = parseInt(r1Slider.value);
      const s1 = parseInt(s1Slider.value);
      const r2 = Math.max(r1 + 1, parseInt(r2Slider.value));
      const s2 = parseInt(s2Slider.value);
      r2Slider.min = r1 + 1;
      if (valuesDisplay) {
        valuesDisplay.textContent = `(r₁=${r1}, s₁=${s1}) → (r₂=${r2}, s₂=${s2})`;
      }
      const result = ImageProcessing.applyContrastStretch(originalData, r1, s1, r2, s2);
      procCtx.putImageData(result, 0, 0);
    }

    [r1Slider, s1Slider, r2Slider, s2Slider].forEach(s => {
      if (s) s.addEventListener('input', update);
    });
    update();
    initialized[containerId] = true;
  }

  /* ----------------------------------------------------------
   * 6. Bit-plane Slicing Simulation
   * ---------------------------------------------------------- */
  function initBitPlane(containerId, buttonsContainerId) {
    if (initialized[containerId]) return;
    const container = document.getElementById(containerId);
    const btnsContainer = document.getElementById(buttonsContainerId);
    if (!container || !btnsContainer) return;

    const { origCtx, procCtx } = setupCanvasPair(container, SIM_W, SIM_H);
    const originalData = drawSampleImage(origCtx, SIM_W, SIM_H);

    // Track selected planes
    const selectedPlanes = new Set([7]);

    // Create 8 toggle buttons
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
        update();
      });
      btnsContainer.appendChild(btn);
    }

    function update() {
      const planes = Array.from(selectedPlanes);
      if (planes.length === 0) {
        procCtx.clearRect(0, 0, SIM_W, SIM_H);
        return;
      }
      const result = ImageProcessing.applyBitPlane(originalData, planes);
      procCtx.putImageData(result, 0, 0);
    }

    update();
    initialized[containerId] = true;
  }

  /* ----------------------------------------------------------
   * 7. Histogram Equalization Simulation
   * ---------------------------------------------------------- */
  function initHistEq(containerId) {
    if (initialized[containerId]) return;
    const container = document.getElementById(containerId);
    if (!container) return;

    const { origCtx, procCtx } = setupCanvasPair(container, SIM_W, SIM_H);
    const originalData = drawSampleImage(origCtx, SIM_W, SIM_H);
    const result = ImageProcessing.applyHistogramEqualization(originalData);
    procCtx.putImageData(result, 0, 0);

    // Draw per-channel histograms (before and after)
    const isDark = document.documentElement.classList.contains('dark');
    const bgColor = isDark ? '#1f2937' : '#f8fafc';
    const borderColor = isDark ? '#374151' : '#e2e8f0';

    const beforeHists = ImageProcessing.computeChannelHistograms(originalData);
    const afterHists = ImageProcessing.computeChannelHistograms(result);

    const channels = [
      { key: 'r', label: 'أحمر (Red)',  color: isDark ? 'rgba(248,113,113,0.7)' : 'rgba(239,68,68,0.6)' },
      { key: 'g', label: 'أخضر (Green)', color: isDark ? 'rgba(74,222,128,0.7)' : 'rgba(34,197,94,0.6)' },
      { key: 'b', label: 'أزرق (Blue)',  color: isDark ? 'rgba(96,165,250,0.7)' : 'rgba(59,130,246,0.6)' },
    ];

    const histContainer = document.createElement('div');
    histContainer.className = 'space-y-3 mt-4';

    for (const ch of channels) {
      const chWrapper = document.createElement('div');
      chWrapper.className = 'rounded-lg border p-3';
      chWrapper.style.borderColor = borderColor;
      chWrapper.style.background = bgColor;

      const label = document.createElement('div');
      label.className = 'text-xs font-semibold text-center mb-2';
      label.style.color = ch.color;
      label.textContent = ch.label;
      chWrapper.appendChild(label);

      const row = document.createElement('div');
      row.className = 'grid grid-cols-2 gap-3';

      // Before
      const beforeCol = document.createElement('div');
      const beforeLabel = document.createElement('div');
      beforeLabel.className = 'text-[10px] text-center text-slate-400 mb-1';
      beforeLabel.textContent = 'قبل التسوية';
      const beforeCanvas = document.createElement('canvas');
      beforeCanvas.style.width = '100%';
      beforeCanvas.style.height = '60px';
      beforeCanvas.style.borderRadius = '4px';
      beforeCol.appendChild(beforeLabel);
      beforeCol.appendChild(beforeCanvas);

      // After
      const afterCol = document.createElement('div');
      const afterLabel = document.createElement('div');
      afterLabel.className = 'text-[10px] text-center text-slate-400 mb-1';
      afterLabel.textContent = 'بعد التسوية';
      const afterCanvas = document.createElement('canvas');
      afterCanvas.style.width = '100%';
      afterCanvas.style.height = '60px';
      afterCanvas.style.borderRadius = '4px';
      afterCol.appendChild(afterLabel);
      afterCol.appendChild(afterCanvas);

      row.appendChild(beforeCol);
      row.appendChild(afterCol);
      chWrapper.appendChild(row);
      histContainer.appendChild(chWrapper);

      requestAnimationFrame(() => {
        drawSimHistBar(beforeCanvas, beforeHists[ch.key], ch.color, bgColor);
        drawSimHistBar(afterCanvas, afterHists[ch.key], ch.color, bgColor);
      });
    }

    container.appendChild(histContainer);
    initialized[containerId] = true;
  }

  /**
   * Helper: Draw a single histogram bar chart on canvas.
   */
  function drawSimHistBar(canvas, hist, barColor, bgColor) {
    const w = canvas.width = canvas.offsetWidth || 180;
    const h = canvas.height = 60;
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

  // Public API
  return {
    initNegative,
    initLog,
    initGamma,
    initThreshold,
    initContrast,
    initBitPlane,
    initHistEq,
  };
})();
