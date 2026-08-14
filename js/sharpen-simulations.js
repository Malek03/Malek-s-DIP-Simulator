/* ============================================================
   Vision Studio — Sharpening Filters Concept Simulations
   Canvas-based interactive demos for Laplacian, Sobel, Unsharp, Canny
   ============================================================ */

const SharpenSimulations = (() => {
  'use strict';

  const SIM_W = 400;
  const SIM_H = 150;
  const initialized = {};

  /**
   * Set up a pair of canvases (original + processed).
   */
  function setupCanvasPair(container, w, h, procLabel) {
    container.innerHTML = '';

    const wrapper = document.createElement('div');
    wrapper.className = 'sim-canvas-wrap';

    const origWrap = document.createElement('div');
    origWrap.className = 'text-center';
    const origLabelEl = document.createElement('div');
    origLabelEl.className = 'text-xs text-slate-500 dark:text-slate-400 mb-1 font-semibold';
    origLabelEl.textContent = 'الصورة الأصلية';
    const origCanvas = document.createElement('canvas');
    origCanvas.width = w;
    origCanvas.height = h;
    origCanvas.style.maxWidth = '100%';
    origCanvas.style.height = 'auto';
    origWrap.appendChild(origLabelEl);
    origWrap.appendChild(origCanvas);

    const procWrap = document.createElement('div');
    procWrap.className = 'text-center';
    const procLabelEl = document.createElement('div');
    procLabelEl.className = 'text-xs text-slate-500 dark:text-slate-400 mb-1 font-semibold';
    procLabelEl.textContent = procLabel || 'بعد المعالجة';
    const procCanvas = document.createElement('canvas');
    procCanvas.width = w;
    procCanvas.height = h;
    procCanvas.style.maxWidth = '100%';
    procCanvas.style.height = 'auto';
    procWrap.appendChild(procLabelEl);
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
   * 1. Laplacian Filter Simulation
   * ---------------------------------------------------------- */
  function initLaplacian(containerId, selectId, valueId) {
    if (initialized[containerId]) return;
    const container = document.getElementById(containerId);
    const select = document.getElementById(selectId);
    const valueDisplay = document.getElementById(valueId);
    if (!container || !select) return;

    const { origCtx, procCtx, procCanvas } = setupCanvasPair(container, SIM_W, SIM_H, 'بعد Laplacian');
    const originalData = SharpenProcessing.generateEdgeSample(SIM_W, SIM_H);
    origCtx.putImageData(originalData, 0, 0);

    function update() {
      const type = select.value;
      if (valueDisplay) valueDisplay.textContent = type === '8' ? '8-connected' : '4-connected';
      const result = SharpenProcessing.applyLaplacianFilter(originalData, type);
      procCanvas.width = result.width;
      procCanvas.height = result.height;
      procCtx.putImageData(result, 0, 0);
    }

    select.addEventListener('change', update);
    update();
    initialized[containerId] = true;
  }

  /* ----------------------------------------------------------
   * 2. Sobel Filter Simulation
   * ---------------------------------------------------------- */
  function initSobel(containerId, sliderId, axisId, valueId) {
    if (initialized[containerId]) return;
    const container = document.getElementById(containerId);
    const slider = document.getElementById(sliderId);
    const axisSelect = document.getElementById(axisId);
    const valueDisplay = document.getElementById(valueId);
    if (!container || !slider || !axisSelect) return;

    const { origCtx, procCtx, procCanvas } = setupCanvasPair(container, SIM_W, SIM_H, 'حواف Sobel');
    const originalData = SharpenProcessing.generateEdgeSample(SIM_W, SIM_H);
    origCtx.putImageData(originalData, 0, 0);

    function update() {
      const size = parseInt(slider.value);
      const axis = axisSelect.value;
      const actualSize = size % 2 === 0 ? size + 1 : size;
      if (valueDisplay) valueDisplay.textContent = `${actualSize}×${actualSize} | ${axisSelect.options[axisSelect.selectedIndex].text}`;
      const result = SharpenProcessing.applySobelFilter(originalData, actualSize, axis);
      procCanvas.width = result.width;
      procCanvas.height = result.height;
      procCtx.putImageData(result, 0, 0);
    }

    slider.addEventListener('input', update);
    axisSelect.addEventListener('change', update);
    update();
    initialized[containerId] = true;
  }

  /* ----------------------------------------------------------
   * Prewitt Filter Simulation
   * ---------------------------------------------------------- */
  function initPrewitt(containerId) {
    if (initialized[containerId]) return;
    const container = document.getElementById(containerId);
    if (!container) return;

    const { origCtx, procCtx, procCanvas } = setupCanvasPair(container, SIM_W, SIM_H, 'حواف Prewitt');
    const originalData = SharpenProcessing.generateEdgeSample(SIM_W, SIM_H);
    origCtx.putImageData(originalData, 0, 0);

    const result = SharpenProcessing.applyPrewittFilter(originalData);
    procCanvas.width = result.width;
    procCanvas.height = result.height;
    procCtx.putImageData(result, 0, 0);

    initialized[containerId] = true;
  }

  /* ----------------------------------------------------------
   * High-Boost Simulation
   * ---------------------------------------------------------- */
  function initHighBoost(containerId, sigmaId, aId, sigmaValId, aValId) {
    if (initialized[containerId]) return;
    const container = document.getElementById(containerId);
    const sigmaSlider = document.getElementById(sigmaId);
    const aSlider = document.getElementById(aId);
    const sigmaValue = document.getElementById(sigmaValId);
    const aValue = document.getElementById(aValId);
    if (!container || !sigmaSlider || !aSlider) return;

    const { origCtx, procCtx, procCanvas } = setupCanvasPair(container, SIM_W, SIM_H, 'High-Boost');
    const originalData = SharpenProcessing.generateEdgeSample(SIM_W, SIM_H);
    origCtx.putImageData(originalData, 0, 0);

    function update() {
      const sigma = parseFloat(sigmaSlider.value);
      const A = parseFloat(aSlider.value);
      if (sigmaValue) sigmaValue.textContent = sigma.toFixed(1);
      if (aValue) aValue.textContent = A.toFixed(1);
      const result = SharpenProcessing.applyHighBoost(originalData, 3, sigma, A);
      procCanvas.width = result.width;
      procCanvas.height = result.height;
      procCtx.putImageData(result, 0, 0);
    }

    sigmaSlider.addEventListener('input', update);
    aSlider.addEventListener('input', update);
    update();
    initialized[containerId] = true;
  }

  /* ----------------------------------------------------------
   * 3. Unsharp Masking Simulation
   * ---------------------------------------------------------- */
  function initUnsharpMask(containerId, sigmaId, kId, sigmaValId, kValId) {
    if (initialized[containerId]) return;
    const container = document.getElementById(containerId);
    const sigmaSlider = document.getElementById(sigmaId);
    const kSlider = document.getElementById(kId);
    const sigmaValue = document.getElementById(sigmaValId);
    const kValue = document.getElementById(kValId);
    if (!container || !sigmaSlider || !kSlider) return;

    const { origCtx, procCtx, procCanvas } = setupCanvasPair(container, SIM_W, SIM_H, 'Unsharp Masking');
    const originalData = SharpenProcessing.generateEdgeSample(SIM_W, SIM_H);
    origCtx.putImageData(originalData, 0, 0);

    function update() {
      const sigma = parseFloat(sigmaSlider.value);
      const k = parseFloat(kSlider.value);
      if (sigmaValue) sigmaValue.textContent = sigma.toFixed(1);
      if (kValue) kValue.textContent = k.toFixed(1);
      const result = SharpenProcessing.applyUnsharpMask(originalData, 3, sigma, k);
      procCanvas.width = result.width;
      procCanvas.height = result.height;
      procCtx.putImageData(result, 0, 0);
    }

    sigmaSlider.addEventListener('input', update);
    kSlider.addEventListener('input', update);
    update();
    initialized[containerId] = true;
  }

  /* ----------------------------------------------------------
   * 4. Canny Edge Detection Simulation
   * ---------------------------------------------------------- */
  function initCanny(containerId, lowId, highId, lowValId, highValId) {
    if (initialized[containerId]) return;
    const container = document.getElementById(containerId);
    const lowSlider = document.getElementById(lowId);
    const highSlider = document.getElementById(highId);
    const lowValue = document.getElementById(lowValId);
    const highValue = document.getElementById(highValId);
    if (!container || !lowSlider || !highSlider) return;

    const { origCtx, procCtx, procCanvas } = setupCanvasPair(container, SIM_W, SIM_H, 'حواف Canny');
    const originalData = SharpenProcessing.generateEdgeSample(SIM_W, SIM_H);
    origCtx.putImageData(originalData, 0, 0);

    function update() {
      const low = parseInt(lowSlider.value);
      let high = parseInt(highSlider.value);
      // High threshold must be strictly greater than low threshold
      if (high <= low) {
        high = low + 1;
        highSlider.value = high;
      }
      if (lowValue) lowValue.textContent = low;
      if (highValue) highValue.textContent = high;
      const result = SharpenProcessing.applyCannyFilter(originalData, low, high, 1.0);
      procCanvas.width = result.width;
      procCanvas.height = result.height;
      procCtx.putImageData(result, 0, 0);
    }

    lowSlider.addEventListener('input', update);
    highSlider.addEventListener('input', update);
    update();
    initialized[containerId] = true;
  }

  // Public API
  return {
    initLaplacian,
    initSobel,
    initUnsharpMask,
    initCanny,
    initPrewitt,
    initHighBoost,
  };
})();
