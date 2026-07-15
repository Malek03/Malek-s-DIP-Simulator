/* ============================================================
   Vision Studio — Basics Simulations
   Canvas-based interactive demos for Image Basics
   ============================================================ */

const BasicsSimulations = (() => {
  'use strict';

  // Default sample image size for simulations
  const SIM_W = 400;
  const SIM_H = 200;

  // Track which simulations have been initialized
  const initialized = {};

  /**
   * Draws a sample image for geometry operations (a house, trees, or shapes to see rotation/scaling).
   */
  function drawSampleGeometryImage(ctx, w, h) {
    // Background sky
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, w, h);

    // Ground
    ctx.fillStyle = '#8FBC8F';
    ctx.fillRect(0, h * 0.7, w, h * 0.3);

    // Sun
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(w * 0.85, h * 0.25, 25, 0, Math.PI * 2);
    ctx.fill();

    // House Body
    ctx.fillStyle = '#F5DEB3';
    ctx.fillRect(w * 0.2, h * 0.4, w * 0.3, h * 0.3);

    // House Roof
    ctx.fillStyle = '#CD5C5C';
    ctx.beginPath();
    ctx.moveTo(w * 0.15, h * 0.4);
    ctx.lineTo(w * 0.35, h * 0.15);
    ctx.lineTo(w * 0.55, h * 0.4);
    ctx.closePath();
    ctx.fill();

    // Door
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(w * 0.3, h * 0.55, w * 0.08, h * 0.15);

    // Tree Trunk
    ctx.fillStyle = '#A0522D';
    ctx.fillRect(w * 0.7, h * 0.5, w * 0.05, h * 0.2);

    // Tree Leaves
    ctx.fillStyle = '#228B22';
    ctx.beginPath();
    ctx.arc(w * 0.725, h * 0.4, 35, 0, Math.PI * 2);
    ctx.fill();

    // Text to see orientation easily
    ctx.fillStyle = '#333';
    ctx.font = 'bold 20px Arial';
    ctx.fillText('Vision Studio', 10, 30);
  }

  /**
   * Helper: Set up a pair of canvases (original + processed).
   */
  function setupCanvasPair(container, w, h) {
    container.innerHTML = '';

    const wrapper = document.createElement('div');
    wrapper.className = 'sim-canvas-wrap flex flex-col md:flex-row gap-4 justify-center items-center';

    // Original canvas
    const origWrap = document.createElement('div');
    origWrap.className = 'text-center relative';
    const origLabel = document.createElement('div');
    origLabel.className = 'text-xs text-slate-500 dark:text-slate-400 mb-1 font-semibold';
    origLabel.textContent = 'الصورة الأصلية';
    const origCanvas = document.createElement('canvas');
    origCanvas.width = w;
    origCanvas.height = h;
    origCanvas.className = 'rounded-lg border border-slate-200 dark:border-gray-700 shadow-sm max-w-full';
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
    procCanvas.className = 'rounded-lg border border-slate-200 dark:border-gray-700 shadow-sm max-w-full';
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
      origWrap
    };
  }

  /* ----------------------------------------------------------
   * Scale Simulation
   * ---------------------------------------------------------- */
  function initScale(containerId, sliderId, valueId) {
    if (initialized[containerId]) return;
    const container = document.getElementById(containerId);
    const slider = document.getElementById(sliderId);
    const valueDisplay = document.getElementById(valueId);
    if (!container || !slider) return;

    const { origCtx, procCtx, origCanvas, procCanvas } = setupCanvasPair(container, SIM_W, SIM_H);
    drawSampleGeometryImage(origCtx, SIM_W, SIM_H);

    function update() {
      const scale = parseFloat(slider.value);
      if (valueDisplay) valueDisplay.textContent = scale.toFixed(2) + 'x';
      BasicsProcessing.scaleImage(origCanvas, procCanvas, scale);
    }

    slider.addEventListener('input', update);
    update();
    initialized[containerId] = true;
  }

  /* ----------------------------------------------------------
   * Rotate Simulation
   * ---------------------------------------------------------- */
  function initRotate(containerId, angleSliderId, angleValueId) {
    if (initialized[containerId]) return;
    const container = document.getElementById(containerId);
    const angleSlider = document.getElementById(angleSliderId);
    const angleValueDisplay = document.getElementById(angleValueId);
    if (!container || !angleSlider) return;

    const { origCtx, procCtx, origCanvas, procCanvas } = setupCanvasPair(container, SIM_W, SIM_H);
    drawSampleGeometryImage(origCtx, SIM_W, SIM_H);

    function update() {
      const angle = parseFloat(angleSlider.value);
      if (angleValueDisplay) angleValueDisplay.textContent = angle + '°';
      
      // Center of rotation is center of image
      BasicsProcessing.rotateImage(origCanvas, procCanvas, angle, 0.5, 0.5);
    }

    angleSlider.addEventListener('input', update);
    update();
    initialized[containerId] = true;
  }

  /* ----------------------------------------------------------
   * Translate Simulation
   * ---------------------------------------------------------- */
  function initTranslate(containerId, txSliderId, txValueId, tySliderId, tyValueId) {
    if (initialized[containerId]) return;
    const container = document.getElementById(containerId);
    const txSlider = document.getElementById(txSliderId);
    const txValueDisplay = document.getElementById(txValueId);
    const tySlider = document.getElementById(tySliderId);
    const tyValueDisplay = document.getElementById(tyValueId);
    if (!container || !txSlider || !tySlider) return;

    const { origCtx, procCtx, origCanvas, procCanvas } = setupCanvasPair(container, SIM_W, SIM_H);
    drawSampleGeometryImage(origCtx, SIM_W, SIM_H);

    function update() {
      const tx = parseInt(txSlider.value);
      const ty = parseInt(tySlider.value);
      
      if (txValueDisplay) txValueDisplay.textContent = tx + 'px';
      if (tyValueDisplay) tyValueDisplay.textContent = ty + 'px';
      
      BasicsProcessing.translateImage(origCanvas, procCanvas, tx, ty);
    }

    txSlider.addEventListener('input', update);
    tySlider.addEventListener('input', update);
    update();
    initialized[containerId] = true;
  }

  /* ----------------------------------------------------------
   * Crop Simulation
   * ---------------------------------------------------------- */
  function initCrop(containerId) {
    if (initialized[containerId]) return;
    const container = document.getElementById(containerId);
    if (!container) return;

    const { origCtx, procCtx, origCanvas, procCanvas, origWrap } = setupCanvasPair(container, SIM_W, SIM_H);
    drawSampleGeometryImage(origCtx, SIM_W, SIM_H);

    // Setup interactive crop rectangle on the original canvas
    let isDragging = false;
    let startX = 0, startY = 0;
    let cropRect = { x: 0.25, y: 0.25, w: 0.5, h: 0.5 }; // normalized

    // Overlay for crop selection
    const overlay = document.createElement('div');
    overlay.className = 'absolute border-2 border-indigo-500 bg-indigo-500/20 cursor-crosshair';
    overlay.style.pointerEvents = 'none'; // let mouse events pass to canvas
    origWrap.appendChild(overlay);

    function updateOverlay() {
      const rect = origCanvas.getBoundingClientRect();
      const sw = rect.width;
      const sh = rect.height;
      
      overlay.style.left = (cropRect.x * sw) + 'px';
      // Adjust top considering the label height (assuming label is first child)
      const labelHeight = origWrap.children[0].offsetHeight || 20; 
      overlay.style.top = (cropRect.y * sh + labelHeight + 4) + 'px'; // +4 for spacing
      overlay.style.width = (cropRect.w * sw) + 'px';
      overlay.style.height = (cropRect.h * sh) + 'px';
      
      BasicsProcessing.cropImage(origCanvas, procCanvas, cropRect);
    }

    origCanvas.addEventListener('mousedown', (e) => {
      isDragging = true;
      const rect = origCanvas.getBoundingClientRect();
      startX = (e.clientX - rect.left) / rect.width;
      startY = (e.clientY - rect.top) / rect.height;
      
      cropRect.x = startX;
      cropRect.y = startY;
      cropRect.w = 0;
      cropRect.h = 0;
      updateOverlay();
    });

    origCanvas.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const rect = origCanvas.getBoundingClientRect();
      const currentX = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const currentY = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
      
      cropRect.x = Math.min(startX, currentX);
      cropRect.y = Math.min(startY, currentY);
      cropRect.w = Math.abs(currentX - startX);
      cropRect.h = Math.abs(currentY - startY);
      
      updateOverlay();
    });

    origCanvas.addEventListener('mouseup', () => {
      isDragging = false;
      if (cropRect.w < 0.05 || cropRect.h < 0.05) {
        // Reset if too small
        cropRect = { x: 0.25, y: 0.25, w: 0.5, h: 0.5 };
        updateOverlay();
      }
    });

    origCanvas.addEventListener('mouseleave', () => {
      isDragging = false;
    });

    // Make original canvas cursor crosshair
    origCanvas.style.cursor = 'crosshair';

    // Small delay to ensure layout is done for overlay positioning
    setTimeout(updateOverlay, 100);
    
    // Also update on window resize
    window.addEventListener('resize', updateOverlay);

    initialized[containerId] = true;
  }

  // Public API
  return {
    initScale,
    initRotate,
    initTranslate,
    initCrop
  };
})();
