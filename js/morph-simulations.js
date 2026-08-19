/* ============================================================
   Vision Studio — Morphological Processing Concept Simulations
   Canvas-based interactive demos for Erode/Dilate, Open/TopHat, Close/BlackHat
   ============================================================ */

const MorphSimulations = (() => {
  'use strict';

  const SIM_W = 400;
  const SIM_H = 150;
  const initialized = {};

  /**
   * Set up a group of canvases (original + multiple processed).
   */
  function setupCanvasGroup(container, labels, w, h) {
    container.innerHTML = '';

    const wrapper = document.createElement('div');
    wrapper.className = 'grid gap-4';
    wrapper.style.gridTemplateColumns = `repeat(${labels.length}, 1fr)`;

    const canvases = [];

    labels.forEach(label => {
      const col = document.createElement('div');
      col.className = 'text-center';
      const lbl = document.createElement('div');
      lbl.className = 'text-xs text-slate-500 dark:text-slate-400 mb-1 font-semibold';
      lbl.textContent = label;
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      canvas.style.maxWidth = '100%';
      canvas.style.height = 'auto';
      canvas.className = 'rounded-lg border border-slate-200 dark:border-gray-700';
      col.appendChild(lbl);
      col.appendChild(canvas);
      wrapper.appendChild(col);
      canvases.push(canvas);
    });

    container.appendChild(wrapper);
    return canvases;
  }

  /* ----------------------------------------------------------
   * 1. Dilate & Erode Simulation
   * ---------------------------------------------------------- */
  function initDilateErode(containerId, sliderId, valueId, shapeId) {
    if (initialized[containerId]) return;
    const container = document.getElementById(containerId);
    const slider = document.getElementById(sliderId);
    const valueDisplay = document.getElementById(valueId);
    const shapeSelect = document.getElementById(shapeId);
    if (!container || !slider) return;

    const canvases = setupCanvasGroup(container, ['الصورة الأصلية', 'التآكل (Erode)', 'التمدد (Dilate)'], SIM_W, SIM_H);
    const originalData = MorphProcessing.generateBinarySample(SIM_W, SIM_H);
    canvases[0].getContext('2d').putImageData(originalData, 0, 0);

    function update() {
      let size = parseInt(slider.value);
      size = size % 2 === 0 ? size + 1 : size;
      const shape = shapeSelect ? shapeSelect.value : 'rect';
      if (valueDisplay) valueDisplay.textContent = `${size}×${size}`;

      const eroded = MorphProcessing.applyErode(originalData, size, size, shape);
      canvases[1].width = eroded.width;
      canvases[1].height = eroded.height;
      canvases[1].getContext('2d').putImageData(eroded, 0, 0);

      const dilated = MorphProcessing.applyDilate(originalData, size, size, shape);
      canvases[2].width = dilated.width;
      canvases[2].height = dilated.height;
      canvases[2].getContext('2d').putImageData(dilated, 0, 0);
    }

    slider.addEventListener('input', update);
    if (shapeSelect) shapeSelect.addEventListener('change', update);
    update();
    initialized[containerId] = true;
  }

  /* ----------------------------------------------------------
   * 2. Open & Top Hat Simulation
   * ---------------------------------------------------------- */
  function initOpenTopHat(containerId, sliderId, valueId, shapeId) {
    if (initialized[containerId]) return;
    const container = document.getElementById(containerId);
    const slider = document.getElementById(sliderId);
    const valueDisplay = document.getElementById(valueId);
    const shapeSelect = document.getElementById(shapeId);
    if (!container || !slider) return;

    const canvases = setupCanvasGroup(container, ['الصورة الأصلية', 'الفتح (Opening)', 'Top Hat'], SIM_W, SIM_H);
    const originalData = MorphProcessing.generateBinarySample(SIM_W, SIM_H);
    canvases[0].getContext('2d').putImageData(originalData, 0, 0);

    function update() {
      let size = parseInt(slider.value);
      size = size % 2 === 0 ? size + 1 : size;
      const shape = shapeSelect ? shapeSelect.value : 'rect';
      if (valueDisplay) valueDisplay.textContent = `${size}×${size}`;

      const opened = MorphProcessing.applyOpen(originalData, size, size, shape);
      canvases[1].width = opened.width;
      canvases[1].height = opened.height;
      canvases[1].getContext('2d').putImageData(opened, 0, 0);

      const topHat = MorphProcessing.applyTopHat(originalData, size, size, shape);
      canvases[2].width = topHat.width;
      canvases[2].height = topHat.height;
      canvases[2].getContext('2d').putImageData(topHat, 0, 0);
    }

    slider.addEventListener('input', update);
    if (shapeSelect) shapeSelect.addEventListener('change', update);
    update();
    initialized[containerId] = true;
  }

  /* ----------------------------------------------------------
   * 3. Close & Black Hat Simulation
   * ---------------------------------------------------------- */
  function initCloseBlackHat(containerId, sliderId, valueId, shapeId) {
    if (initialized[containerId]) return;
    const container = document.getElementById(containerId);
    const slider = document.getElementById(sliderId);
    const valueDisplay = document.getElementById(valueId);
    const shapeSelect = document.getElementById(shapeId);
    if (!container || !slider) return;

    const canvases = setupCanvasGroup(container, ['الصورة الأصلية', 'الإغلاق (Closing)', 'Black Hat'], SIM_W, SIM_H);
    const originalData = MorphProcessing.generateBinarySample(SIM_W, SIM_H);
    canvases[0].getContext('2d').putImageData(originalData, 0, 0);

    function update() {
      let size = parseInt(slider.value);
      size = size % 2 === 0 ? size + 1 : size;
      const shape = shapeSelect ? shapeSelect.value : 'rect';
      if (valueDisplay) valueDisplay.textContent = `${size}×${size}`;

      const closed = MorphProcessing.applyClose(originalData, size, size, shape);
      canvases[1].width = closed.width;
      canvases[1].height = closed.height;
      canvases[1].getContext('2d').putImageData(closed, 0, 0);

      const bHat = MorphProcessing.applyBlackHat(originalData, size, size, shape);
      canvases[2].width = bHat.width;
      canvases[2].height = bHat.height;
      canvases[2].getContext('2d').putImageData(bHat, 0, 0);
    }

    slider.addEventListener('input', update);
    if (shapeSelect) shapeSelect.addEventListener('change', update);
    update();
    initialized[containerId] = true;
  }

  // Public API
  return {
    initDilateErode,
    initOpenTopHat,
    initCloseBlackHat,
  };
})();
