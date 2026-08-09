/* ============================================================
   Vision Studio — Smoothing Filters Concept Simulations
   Canvas-based interactive demos for Mean, Gaussian, Median
   ============================================================ */

const SmoothSimulations = (() => {
  'use strict';

  const SIM_W = 400;
  const SIM_H = 150;
  const initialized = {};

  /**
   * Set up a pair of canvases (original + processed).
   */
  function setupCanvasPair(container, w, h) {
    container.innerHTML = '';

    const wrapper = document.createElement('div');
    wrapper.className = 'sim-canvas-wrap';

    const origWrap = document.createElement('div');
    origWrap.className = 'text-center';
    const origLabel = document.createElement('div');
    origLabel.className = 'text-xs text-slate-500 dark:text-slate-400 mb-1 font-semibold';
    origLabel.textContent = 'الصورة الأصلية (مع ضوضاء)';
    const origCanvas = document.createElement('canvas');
    origCanvas.width = w;
    origCanvas.height = h;
    origCanvas.style.maxWidth = '100%';
    origCanvas.style.height = 'auto';
    origWrap.appendChild(origLabel);
    origWrap.appendChild(origCanvas);

    const procWrap = document.createElement('div');
    procWrap.className = 'text-center';
    const procLabel = document.createElement('div');
    procLabel.className = 'text-xs text-slate-500 dark:text-slate-400 mb-1 font-semibold';
    procLabel.textContent = 'بعد التنعيم';
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
   * 1. Mean Filter Simulation
   * ---------------------------------------------------------- */
  function initMean(containerId, sliderId, valueId) {
    if (initialized[containerId]) return;
    const container = document.getElementById(containerId);
    const slider = document.getElementById(sliderId);
    const valueDisplay = document.getElementById(valueId);
    if (!container || !slider) return;

    const { origCtx, procCtx, procCanvas } = setupCanvasPair(container, SIM_W, SIM_H);
    const originalData = SmoothProcessing.generateNoisySample(SIM_W, SIM_H);
    origCtx.putImageData(originalData, 0, 0);

    function update() {
      const size = parseInt(slider.value);
      // Ensure odd
      const actualSize = size % 2 === 0 ? size + 1 : size;
      if (valueDisplay) valueDisplay.textContent = `${actualSize}×${actualSize}`;
      const result = SmoothProcessing.applyMeanFilter(originalData, actualSize, actualSize, true);
      // Resize processed canvas if needed
      procCanvas.width = result.width;
      procCanvas.height = result.height;
      procCtx.putImageData(result, 0, 0);
    }

    slider.addEventListener('input', update);
    update();
    initialized[containerId] = true;
  }

  /* ----------------------------------------------------------
   * 2. Gaussian Filter Simulation
   * ---------------------------------------------------------- */
  function initGaussian(containerId, sliderSizeId, sliderSigmaId, sizeValueId, sigmaValueId) {
    if (initialized[containerId]) return;
    const container = document.getElementById(containerId);
    const sizeSlider = document.getElementById(sliderSizeId);
    const sigmaSlider = document.getElementById(sliderSigmaId);
    const sizeValue = document.getElementById(sizeValueId);
    const sigmaValue = document.getElementById(sigmaValueId);
    if (!container || !sizeSlider || !sigmaSlider) return;

    const { origCtx, procCtx, procCanvas } = setupCanvasPair(container, SIM_W, SIM_H);
    const originalData = SmoothProcessing.generateNoisySample(SIM_W, SIM_H);
    origCtx.putImageData(originalData, 0, 0);

    function update() {
      let size = parseInt(sizeSlider.value);
      size = size % 2 === 0 ? size + 1 : size;
      const sigma = parseFloat(sigmaSlider.value);
      if (sizeValue) sizeValue.textContent = `${size}×${size}`;
      if (sigmaValue) sigmaValue.textContent = sigma.toFixed(1);
      const result = SmoothProcessing.applyGaussianFilter(originalData, size, size, sigma, true);
      procCanvas.width = result.width;
      procCanvas.height = result.height;
      procCtx.putImageData(result, 0, 0);
    }

    sizeSlider.addEventListener('input', update);
    sigmaSlider.addEventListener('input', update);
    update();
    initialized[containerId] = true;
  }

  /* ----------------------------------------------------------
   * 3. Median Filter Simulation
   * ---------------------------------------------------------- */
  function initMedian(containerId, sliderId, valueId) {
    if (initialized[containerId]) return;
    const container = document.getElementById(containerId);
    const slider = document.getElementById(sliderId);
    const valueDisplay = document.getElementById(valueId);
    if (!container || !slider) return;

    const { origCtx, procCtx, procCanvas } = setupCanvasPair(container, SIM_W, SIM_H);
    const originalData = SmoothProcessing.generateNoisySample(SIM_W, SIM_H);
    origCtx.putImageData(originalData, 0, 0);

    function update() {
      let size = parseInt(slider.value);
      size = size % 2 === 0 ? size + 1 : size;
      if (valueDisplay) valueDisplay.textContent = `${size}×${size}`;
      const result = SmoothProcessing.applyMedianFilter(originalData, size, size, true);
      procCanvas.width = result.width;
      procCanvas.height = result.height;
      procCtx.putImageData(result, 0, 0);
    }

    slider.addEventListener('input', update);
    update();
    initialized[containerId] = true;
  }

  // Public API
  return {
    initMean,
    initGaussian,
    initMedian,
  };
})();
