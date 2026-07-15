/* ============================================================
   Vision Studio — Representation Simulations
   Canvas-based interactive demos for Image Representation
   ============================================================ */

const RepSimulations = (() => {
  'use strict';

  const SIM_W = 400;
  const SIM_H = 200;
  const initialized = {};

  /**
   * Helper: Draw a colorful sample image to demonstrate RGB and color clearly.
   */
  function drawColorfulSampleImage(ctx, w, h) {
    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#ff9a9e');
    grad.addColorStop(0.5, '#fecfef');
    grad.addColorStop(1, '#a1c4fd');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Red Circle
    ctx.fillStyle = '#ff0000';
    ctx.beginPath();
    ctx.arc(w * 0.3, h * 0.5, h * 0.3, 0, Math.PI * 2);
    ctx.fill();

    // Green Triangle
    ctx.fillStyle = '#00ff00';
    ctx.beginPath();
    ctx.moveTo(w * 0.5, h * 0.2);
    ctx.lineTo(w * 0.4, h * 0.8);
    ctx.lineTo(w * 0.6, h * 0.8);
    ctx.closePath();
    ctx.fill();

    // Blue Square
    ctx.fillStyle = '#0000ff';
    ctx.fillRect(w * 0.65, h * 0.3, h * 0.4, h * 0.4);

    // Mixed Color text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('RGB Colors', w * 0.5, h * 0.15);
  }

  function createOrigCanvas(container) {
    const origCanvas = document.createElement('canvas');
    origCanvas.width = SIM_W;
    origCanvas.height = SIM_H;
    origCanvas.className = 'rounded-lg border border-slate-200 dark:border-gray-700 shadow-sm max-w-full block mx-auto mb-4';
    container.appendChild(origCanvas);
    const ctx = origCanvas.getContext('2d');
    drawColorfulSampleImage(ctx, SIM_W, SIM_H);
    return origCanvas;
  }

  /* ----------------------------------------------------------
   * RGB Decomposition Simulation
   * ---------------------------------------------------------- */
  function initRGB(containerId, animateBtnId) {
    if (initialized[containerId]) return;
    const container = document.getElementById(containerId);
    const btn = document.getElementById(animateBtnId);
    if (!container || !btn) return;

    container.innerHTML = '';
    const origCanvas = createOrigCanvas(container);

    // Create wrapper for the 3 separated canvases
    const channelsWrap = document.createElement('div');
    channelsWrap.className = 'flex flex-col sm:flex-row gap-4 justify-center items-center mt-6 transition-all duration-700 ease-in-out relative h-[200px] sm:h-auto';
    container.appendChild(channelsWrap);

    const rWrap = createChannelCanvasWrap('Red', 'text-red-500');
    const gWrap = createChannelCanvasWrap('Green', 'text-green-500');
    const bWrap = createChannelCanvasWrap('Blue', 'text-blue-500');

    channelsWrap.appendChild(rWrap.wrap);
    channelsWrap.appendChild(gWrap.wrap);
    channelsWrap.appendChild(bWrap.wrap);

    RepProcessing.decomposeRGB(origCanvas, rWrap.canvas, gWrap.canvas, bWrap.canvas);

    // Initial state: stacked
    let isStacked = true;
    function applyStacking() {
      if (isStacked) {
        // Stack them
        channelsWrap.classList.remove('sm:gap-4');
        rWrap.wrap.style.position = 'absolute';
        gWrap.wrap.style.position = 'absolute';
        bWrap.wrap.style.position = 'absolute';
        
        rWrap.wrap.style.transform = 'translate(-10px, -10px)';
        gWrap.wrap.style.transform = 'translate(0px, 0px)';
        bWrap.wrap.style.transform = 'translate(10px, 10px)';

        rWrap.wrap.style.zIndex = '3';
        gWrap.wrap.style.zIndex = '2';
        bWrap.wrap.style.zIndex = '1';
        
        btn.innerHTML = `<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"/></svg> تفكيك الطبقات (Animate)`;
      } else {
        // Spread them
        channelsWrap.classList.add('sm:gap-4');
        rWrap.wrap.style.position = 'relative';
        gWrap.wrap.style.position = 'relative';
        bWrap.wrap.style.position = 'relative';

        rWrap.wrap.style.transform = 'translate(0, 0)';
        gWrap.wrap.style.transform = 'translate(0, 0)';
        bWrap.wrap.style.transform = 'translate(0, 0)';
        
        btn.innerHTML = `<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 4h16M4 12h16M4 20h16"/></svg> دمج الطبقات`;
      }
    }

    applyStacking(); // Setup initial

    btn.addEventListener('click', () => {
      isStacked = !isStacked;
      applyStacking();
    });

    initialized[containerId] = true;
  }

  function createChannelCanvasWrap(label, colorClass) {
    const wrap = document.createElement('div');
    wrap.className = 'text-center transition-transform duration-700 ease-in-out bg-white dark:bg-gray-800 p-2 rounded-xl shadow-md border border-slate-200 dark:border-gray-700';
    
    const labelEl = document.createElement('div');
    labelEl.className = `text-sm font-bold mb-2 ${colorClass}`;
    labelEl.textContent = label;
    
    const canvas = document.createElement('canvas');
    // Using a smaller size for the separated canvases to fit side-by-side
    canvas.width = SIM_W * 0.7; 
    canvas.height = SIM_H * 0.7;
    canvas.className = 'rounded border border-slate-100 dark:border-gray-600 bg-black';
    
    wrap.appendChild(labelEl);
    wrap.appendChild(canvas);
    return { wrap, canvas };
  }

  /* ----------------------------------------------------------
   * Sampling Simulation
   * ---------------------------------------------------------- */
  function initSampling(containerId, rowsId, colsId, valueId) {
    if (initialized[containerId]) return;
    const container = document.getElementById(containerId);
    const rowsSlider = document.getElementById(rowsId);
    const colsSlider = document.getElementById(colsId);
    const valueDisplay = document.getElementById(valueId);
    if (!container || !rowsSlider || !colsSlider) return;

    container.innerHTML = '';
    const origCanvas = createOrigCanvas(container);
    origCanvas.style.display = 'none'; // hide orig, only show processed

    const procCanvas = document.createElement('canvas');
    procCanvas.width = SIM_W;
    procCanvas.height = SIM_H;
    procCanvas.className = 'rounded-lg border border-slate-200 dark:border-gray-700 shadow-sm max-w-full block mx-auto';
    container.appendChild(procCanvas);

    function update() {
      const rows = parseInt(rowsSlider.value);
      const cols = parseInt(colsSlider.value);
      if (valueDisplay) valueDisplay.textContent = `${cols} × ${rows}`;
      
      RepProcessing.applySampling(origCanvas, procCanvas, rows, cols);
    }

    rowsSlider.addEventListener('input', () => {
      // Keep them somewhat proportional or let user do what they want
      update();
    });
    colsSlider.addEventListener('input', update);
    update();
    initialized[containerId] = true;
  }

  /* ----------------------------------------------------------
   * Quantization Simulation
   * ---------------------------------------------------------- */
  function initQuantization(containerId, levelsId, valueId) {
    if (initialized[containerId]) return;
    const container = document.getElementById(containerId);
    const levelsSlider = document.getElementById(levelsId);
    const valueDisplay = document.getElementById(valueId);
    if (!container || !levelsSlider) return;

    container.innerHTML = '';
    const origCanvas = createOrigCanvas(container);
    origCanvas.style.display = 'none';

    const procCanvas = document.createElement('canvas');
    procCanvas.width = SIM_W;
    procCanvas.height = SIM_H;
    procCanvas.className = 'rounded-lg border border-slate-200 dark:border-gray-700 shadow-sm max-w-full block mx-auto';
    container.appendChild(procCanvas);

    function update() {
      const levels = parseInt(levelsSlider.value);
      if (valueDisplay) valueDisplay.textContent = levels;
      
      RepProcessing.applyQuantization(origCanvas, procCanvas, levels);
    }

    levelsSlider.addEventListener('input', update);
    update();
    initialized[containerId] = true;
  }

  /* ----------------------------------------------------------
   * Color Mixing Simulation
   * ---------------------------------------------------------- */
  function initColorMix(containerId, colorInputId) {
    if (initialized[containerId]) return;
    const container = document.getElementById(containerId);
    const colorInput = document.getElementById(colorInputId);
    if (!container || !colorInput) return;

    container.innerHTML = '';
    
    // We will do drawing interactively on a single canvas
    const wrapper = document.createElement('div');
    wrapper.className = 'relative inline-block';
    container.appendChild(wrapper);

    const canvas = document.createElement('canvas');
    canvas.width = SIM_W;
    canvas.height = SIM_H;
    canvas.className = 'rounded-lg border border-slate-200 dark:border-gray-700 shadow-sm block';
    canvas.style.cursor = 'crosshair';
    wrapper.appendChild(canvas);

    // Keep an original hidden canvas to redraw from
    const origCanvas = document.createElement('canvas');
    origCanvas.width = SIM_W;
    origCanvas.height = SIM_H;
    const origCtx = origCanvas.getContext('2d');
    drawColorfulSampleImage(origCtx, SIM_W, SIM_H);

    // Overlay for selection
    const overlay = document.createElement('div');
    overlay.className = 'absolute border-2 border-dashed border-indigo-500 bg-indigo-500/10 pointer-events-none';
    overlay.style.display = 'none';
    wrapper.appendChild(overlay);

    let isDragging = false;
    let startX = 0, startY = 0;
    let rect = {x: 0, y: 0, w: 0, h: 0};
    let hasSelection = false;

    function updateView() {
      if (hasSelection) {
        RepProcessing.applyColorMixing(origCanvas, canvas, rect, colorInput.value, 'color');
      } else {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, SIM_W, SIM_H);
        ctx.drawImage(origCanvas, 0, 0);
      }
    }

    canvas.addEventListener('mousedown', (e) => {
      isDragging = true;
      hasSelection = false;
      const r = canvas.getBoundingClientRect();
      startX = (e.clientX - r.left) / r.width;
      startY = (e.clientY - r.top) / r.height;
      rect = { x: startX, y: startY, w: 0, h: 0 };
      
      overlay.style.display = 'block';
      overlay.style.left = (startX * r.width) + 'px';
      overlay.style.top = (startY * r.height) + 'px';
      overlay.style.width = '0px';
      overlay.style.height = '0px';
      
      updateView();
    });

    canvas.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const r = canvas.getBoundingClientRect();
      const currentX = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
      const currentY = Math.max(0, Math.min(1, (e.clientY - r.top) / r.height));
      
      rect.x = Math.min(startX, currentX);
      rect.y = Math.min(startY, currentY);
      rect.w = Math.abs(currentX - startX);
      rect.h = Math.abs(currentY - startY);
      
      overlay.style.left = (rect.x * r.width) + 'px';
      overlay.style.top = (rect.y * r.height) + 'px';
      overlay.style.width = (rect.w * r.width) + 'px';
      overlay.style.height = (rect.h * r.height) + 'px';
    });

    window.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        if (rect.w > 0.05 && rect.h > 0.05) {
          hasSelection = true;
          updateView();
        } else {
          overlay.style.display = 'none';
        }
      }
    });

    colorInput.addEventListener('input', () => {
      if (hasSelection) updateView();
    });

    updateView(); // initial draw
    initialized[containerId] = true;
  }

  // Public API
  return {
    initRGB,
    initSampling,
    initQuantization,
    initColorMix
  };
})();
