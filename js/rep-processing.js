/* ============================================================
   Vision Studio — Representation Processing Engine
   Concepts: RGB Decomposition, Sampling, Quantization, Color Mixing
   ============================================================ */

const RepProcessing = (() => {
  'use strict';

  /**
   * Decomposes an image into its Red, Green, and Blue channels.
   * Renders the result tinted onto three separate canvases.
   */
  function decomposeRGB(origCanvas, rCanvas, gCanvas, bCanvas) {
    const w = origCanvas.width;
    const h = origCanvas.height;
    
    // Setup dimensions
    [rCanvas, gCanvas, bCanvas].forEach(canvas => {
      canvas.width = w;
      canvas.height = h;
    });

    const ctx = origCanvas.getContext('2d');
    const imgData = ctx.getImageData(0, 0, w, h);
    const data = imgData.data;

    // Create empty image data arrays for each channel
    const rCtx = rCanvas.getContext('2d');
    const gCtx = gCanvas.getContext('2d');
    const bCtx = bCanvas.getContext('2d');

    const rData = rCtx.createImageData(w, h);
    const gData = gCtx.createImageData(w, h);
    const bData = bCtx.createImageData(w, h);

    for (let i = 0; i < data.length; i += 4) {
      // Red channel
      rData.data[i] = data[i];       // R
      rData.data[i+1] = 0;           // G
      rData.data[i+2] = 0;           // B
      rData.data[i+3] = data[i+3];   // Alpha

      // Green channel
      gData.data[i] = 0;
      gData.data[i+1] = data[i+1];
      gData.data[i+2] = 0;
      gData.data[i+3] = data[i+3];

      // Blue channel
      bData.data[i] = 0;
      bData.data[i+1] = 0;
      bData.data[i+2] = data[i+2];
      bData.data[i+3] = data[i+3];
    }

    rCtx.putImageData(rData, 0, 0);
    gCtx.putImageData(gData, 0, 0);
    bCtx.putImageData(bData, 0, 0);
  }

  /**
   * Reduces spatial resolution (Sampling) using Nearest Neighbor.
   * `rows` and `cols` define the new low-resolution grid.
   */
  function applySampling(origCanvas, procCanvas, rows, cols) {
    const w = origCanvas.width;
    const h = origCanvas.height;
    
    procCanvas.width = w;
    procCanvas.height = h;
    const pCtx = procCanvas.getContext('2d');
    
    // Ensure rows and cols are at least 1
    rows = Math.max(1, rows);
    cols = Math.max(1, cols);

    // Create a tiny intermediate canvas
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = cols;
    tempCanvas.height = rows;
    const tCtx = tempCanvas.getContext('2d');

    // Draw original image onto tiny canvas (downsampling)
    tCtx.drawImage(origCanvas, 0, 0, cols, rows);

    // Draw tiny canvas back onto original-sized canvas (upsampling with nearest neighbor)
    pCtx.imageSmoothingEnabled = false; // Disable smoothing for pixelated effect
    pCtx.clearRect(0, 0, w, h);
    pCtx.drawImage(tempCanvas, 0, 0, cols, rows, 0, 0, w, h);
  }

  /**
   * Reduces the number of colors (Quantization).
   * `levels` specifies how many discrete values per channel (e.g., 2 to 256).
   */
  function applyQuantization(origCanvas, procCanvas, levels) {
    const w = origCanvas.width;
    const h = origCanvas.height;
    
    // Read original data BEFORE modifying procCanvas in case they are the same
    const oCtx = origCanvas.getContext('2d');
    const imgData = oCtx.getImageData(0, 0, w, h);
    const data = imgData.data;

    // Now it's safe to set width/height on procCanvas
    if (origCanvas !== procCanvas) {
      procCanvas.width = w;
      procCanvas.height = h;
    }
    
    const pCtx = procCanvas.getContext('2d');

    // Ensure levels is between 2 and 256
    levels = Math.max(2, Math.min(256, levels));
    const step = 255 / (levels - 1);

    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.round(data[i] / step) * step;       // R
      data[i+1] = Math.round(data[i+1] / step) * step;   // G
      data[i+2] = Math.round(data[i+2] / step) * step;   // B
      // data[i+3] is Alpha, keep as is
    }

    pCtx.putImageData(imgData, 0, 0);
  }

  /**
   * Applies a color to a selected region.
   * `rect` = {x, y, w, h} normalized (0 to 1).
   * `color` = hex string (e.g., "#ff0000").
   */
  function applyColorMixing(origCanvas, procCanvas, rect, colorHex, mixMode = 'color') {
    const w = origCanvas.width;
    const h = origCanvas.height;
    
    procCanvas.width = w;
    procCanvas.height = h;
    const pCtx = procCanvas.getContext('2d');
    
    // 1. Draw original image
    pCtx.clearRect(0, 0, w, h);
    pCtx.drawImage(origCanvas, 0, 0);

    // 2. Draw colored rectangle over the selected region using blending
    if (rect && rect.w > 0 && rect.h > 0) {
      const sx = rect.x * w;
      const sy = rect.y * h;
      const sw = rect.w * w;
      const sh = rect.h * h;

      pCtx.save();
      // 'color' blending mode tints the image while preserving luminosity
      // 'multiply' is also good, or we can just use globalAlpha
      if (mixMode === 'solid') {
        pCtx.globalAlpha = 1.0;
      } else {
        pCtx.globalCompositeOperation = mixMode || 'color';
      }
      pCtx.fillStyle = colorHex;
      pCtx.fillRect(sx, sy, sw, sh);
      pCtx.restore();
    }
  }

  /**
   * Generates a small (cols x rows) quantized ImageData.
   */
  function getSampledQuantizedData(origCanvas, rows, cols, levels) {
    rows = Math.max(1, rows);
    cols = Math.max(1, cols);
    levels = Math.max(2, Math.min(256, levels));
    
    const smallCanvas = document.createElement('canvas');
    smallCanvas.width = cols;
    smallCanvas.height = rows;
    const ctx = smallCanvas.getContext('2d');
    
    ctx.drawImage(origCanvas, 0, 0, cols, rows);
    const imgData = ctx.getImageData(0, 0, cols, rows);
    const data = imgData.data;
    const step = 255 / (levels - 1);

    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.round(data[i] / step) * step;       // R
      data[i+1] = Math.round(data[i+1] / step) * step;   // G
      data[i+2] = Math.round(data[i+2] / step) * step;   // B
    }
    return imgData;
  }

  /**
   * Draws a numerical matrix of a specific channel onto a canvas.
   * channel: 0=R, 1=G, 2=B
   */
  function drawChannelMatrix(targetCanvas, imgData, channel, isFullscreen = false) {
    const cols = imgData.width;
    const rows = imgData.height;
    
    // Auto-scale cell size based on number of columns/rows
    let cellSize;
    if (isFullscreen) {
      // Set reasonable cell size so it's not overly huge, but readable
      cellSize = Math.max(22, Math.min(45, Math.floor((window.innerWidth * 0.28) / cols)));
    } else {
      cellSize = Math.max(16, Math.min(30, Math.floor(600 / cols)));
    }
    
    targetCanvas.width = cols * cellSize;
    targetCanvas.height = rows * cellSize;
    const ctx = targetCanvas.getContext('2d');
    
    ctx.font = `${Math.floor(cellSize * 0.4)}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const data = imgData.data;
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const i = (y * cols + x) * 4;
        const val = data[i + channel]; // 0:R, 1:G, 2:B
        
        let bgStyle;
        if (channel === 0) bgStyle = `rgb(${val}, 0, 0)`;
        else if (channel === 1) bgStyle = `rgb(0, ${val}, 0)`;
        else if (channel === 2) bgStyle = `rgb(0, 0, ${val})`;
        
        ctx.fillStyle = bgStyle;
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
        
        // Text color contrast: if cell is bright, use black text. Otherwise white.
        // For pure colors, R and B are darker than G visually, but mathematically:
        let isBright = val > 128;
        if (channel === 2) isBright = val > 180; // Blue is dark
        ctx.fillStyle = isBright ? '#000000' : '#ffffff';
        
        ctx.fillText(Math.round(val), x * cellSize + cellSize/2, y * cellSize + cellSize/2);
        
        // Draw grid lines
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x * cellSize, y * cellSize, cellSize, cellSize);
      }
    }
  }

  // Public API
  return {
    decomposeRGB,
    applySampling,
    applyQuantization,
    applyColorMixing,
    getSampledQuantizedData,
    drawChannelMatrix
  };
})();
