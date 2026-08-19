/* ============================================================
   Vision Studio — Morphological Processing Engine
   Erode, Dilate, Open, Close, TopHat, BlackHat on Canvas ImageData
   ============================================================ */

const MorphProcessing = (() => {
  'use strict';

  /* ----------------------------------------------------------
   * Structuring Element (SE) Generation
   * ---------------------------------------------------------- */

  /**
   * Create a structuring element (SE).
   * @param {number} rows - Number of rows (odd)
   * @param {number} cols - Number of cols (odd)
   * @param {string} shape - 'rect' | 'cross' | 'ellipse'
   * @returns {number[][]} - 2D array of 0s and 1s
   */
  function createStructuringElement(rows, cols, shape = 'rect') {
    const se = Array.from({ length: rows }, () => Array(cols).fill(0));
    const cy = Math.floor(rows / 2);
    const cx = Math.floor(cols / 2);

    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        if (shape === 'rect') {
          se[i][j] = 1;
        } else if (shape === 'cross') {
          if (i === cy || j === cx) se[i][j] = 1;
        } else if (shape === 'ellipse') {
          const ry = rows / 2;
          const rx = cols / 2;
          const dy = (i - cy) / ry;
          const dx = (j - cx) / rx;
          if (dx * dx + dy * dy <= 1) se[i][j] = 1;
        }
      }
    }
    return se;
  }

  /* ----------------------------------------------------------
   * Core Morphological Operations on 2D Matrix (grayscale)
   * ---------------------------------------------------------- */

  /**
   * Erode: Output pixel = min of input pixels under SE.
   */
  function erode2D(matrix, se) {
    const h = matrix.length;
    const w = matrix[0].length;
    const kH = se.length;
    const kW = se[0].length;
    const padH = Math.floor(kH / 2);
    const padW = Math.floor(kW / 2);

    const output = [];
    for (let i = 0; i < h; i++) {
      const row = [];
      for (let j = 0; j < w; j++) {
        let minVal = 255;
        for (let ki = 0; ki < kH; ki++) {
          for (let kj = 0; kj < kW; kj++) {
            if (se[ki][kj] === 0) continue;
            const ni = i + ki - padH;
            const nj = j + kj - padW;
            if (ni >= 0 && ni < h && nj >= 0 && nj < w) {
              minVal = Math.min(minVal, matrix[ni][nj]);
            } else {
              // Border treated as 0 → min will be 0
              minVal = 0;
            }
          }
        }
        row.push(minVal);
      }
      output.push(row);
    }
    return output;
  }

  /**
   * Dilate: Output pixel = max of input pixels under SE.
   */
  function dilate2D(matrix, se) {
    const h = matrix.length;
    const w = matrix[0].length;
    const kH = se.length;
    const kW = se[0].length;
    const padH = Math.floor(kH / 2);
    const padW = Math.floor(kW / 2);

    const output = [];
    for (let i = 0; i < h; i++) {
      const row = [];
      for (let j = 0; j < w; j++) {
        let maxVal = 0;
        for (let ki = 0; ki < kH; ki++) {
          for (let kj = 0; kj < kW; kj++) {
            if (se[ki][kj] === 0) continue;
            const ni = i + ki - padH;
            const nj = j + kj - padW;
            if (ni >= 0 && ni < h && nj >= 0 && nj < w) {
              maxVal = Math.max(maxVal, matrix[ni][nj]);
            }
            // Border treated as 0 → max stays unchanged
          }
        }
        row.push(maxVal);
      }
      output.push(row);
    }
    return output;
  }

  /**
   * Opening = Erode then Dilate (removes small bright spots / noise)
   */
  function open2D(matrix, se) {
    return dilate2D(erode2D(matrix, se), se);
  }

  /**
   * Closing = Dilate then Erode (fills small dark holes)
   */
  function close2D(matrix, se) {
    return erode2D(dilate2D(matrix, se), se);
  }

  /**
   * Top Hat = Original - Opening (extracts bright details)
   */
  function topHat2D(matrix, se) {
    const opened = open2D(matrix, se);
    const h = matrix.length;
    const w = matrix[0].length;
    const output = [];
    for (let i = 0; i < h; i++) {
      const row = [];
      for (let j = 0; j < w; j++) {
        row.push(Math.max(0, matrix[i][j] - opened[i][j]));
      }
      output.push(row);
    }
    return output;
  }

  /**
   * Black Hat = Closing - Original (extracts dark details)
   */
  function blackHat2D(matrix, se) {
    const closed = close2D(matrix, se);
    const h = matrix.length;
    const w = matrix[0].length;
    const output = [];
    for (let i = 0; i < h; i++) {
      const row = [];
      for (let j = 0; j < w; j++) {
        row.push(Math.max(0, closed[i][j] - matrix[i][j]));
      }
      output.push(row);
    }
    return output;
  }

  /* ----------------------------------------------------------
   * Apply morphological ops on full ImageData (per-channel)
   * ---------------------------------------------------------- */

  function imageDataToChannels(imageData) {
    const src = imageData.data;
    const w = imageData.width;
    const h = imageData.height;
    const channels = [[], [], []];
    for (let i = 0; i < h; i++) {
      channels[0].push([]);
      channels[1].push([]);
      channels[2].push([]);
      for (let j = 0; j < w; j++) {
        const idx = (i * w + j) * 4;
        channels[0][i].push(src[idx]);
        channels[1][i].push(src[idx + 1]);
        channels[2][i].push(src[idx + 2]);
      }
    }
    return channels;
  }

  function channelsToImageData(channels) {
    const outH = channels[0].length;
    const outW = channels[0][0].length;
    const dst = new Uint8ClampedArray(outH * outW * 4);
    for (let i = 0; i < outH; i++) {
      for (let j = 0; j < outW; j++) {
        const idx = (i * outW + j) * 4;
        dst[idx]     = Math.max(0, Math.min(255, channels[0][i][j]));
        dst[idx + 1] = Math.max(0, Math.min(255, channels[1][i][j]));
        dst[idx + 2] = Math.max(0, Math.min(255, channels[2][i][j]));
        dst[idx + 3] = 255;
      }
    }
    return new ImageData(dst, outW, outH);
  }

  function applyMorphOp(imageData, rows, cols, shape, opFunc, iterations = 1) {
    const se = createStructuringElement(rows, cols, shape);
    let channels = imageDataToChannels(imageData);

    for (let iter = 0; iter < iterations; iter++) {
      channels = channels.map(ch => opFunc(ch, se));
    }
    return channelsToImageData(channels);
  }

  function applyErode(imageData, rows = 3, cols = 3, shape = 'rect', iterations = 1) {
    return applyMorphOp(imageData, rows, cols, shape, erode2D, iterations);
  }

  function applyDilate(imageData, rows = 3, cols = 3, shape = 'rect', iterations = 1) {
    return applyMorphOp(imageData, rows, cols, shape, dilate2D, iterations);
  }

  function applyOpen(imageData, rows = 3, cols = 3, shape = 'rect', iterations = 1) {
    return applyMorphOp(imageData, rows, cols, shape, open2D, iterations);
  }

  function applyClose(imageData, rows = 3, cols = 3, shape = 'rect', iterations = 1) {
    return applyMorphOp(imageData, rows, cols, shape, close2D, iterations);
  }

  function applyTopHat(imageData, rows = 3, cols = 3, shape = 'rect', iterations = 1) {
    return applyMorphOp(imageData, rows, cols, shape, topHat2D, iterations);
  }

  function applyBlackHat(imageData, rows = 3, cols = 3, shape = 'rect', iterations = 1) {
    return applyMorphOp(imageData, rows, cols, shape, blackHat2D, iterations);
  }

  /* ----------------------------------------------------------
   * Generate a binary sample image for simulations
   * ---------------------------------------------------------- */
  function generateBinarySample(width, height) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // Black background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);

    // White shapes
    ctx.fillStyle = '#fff';
    // Rectangle
    ctx.fillRect(30, 20, 70, 50);
    // Circle
    ctx.beginPath();
    ctx.arc(width * 0.55, height * 0.45, 30, 0, Math.PI * 2);
    ctx.fill();
    // Small triangle
    ctx.beginPath();
    ctx.moveTo(width * 0.78, 25);
    ctx.lineTo(width * 0.88, height * 0.65);
    ctx.lineTo(width * 0.68, height * 0.65);
    ctx.closePath();
    ctx.fill();
    // Small dots (noise-like)
    for (let k = 0; k < 15; k++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      ctx.fillRect(x, y, 3, 3);
    }
    // Small holes in the rectangle
    ctx.fillStyle = '#000';
    ctx.fillRect(45, 30, 5, 5);
    ctx.fillRect(60, 40, 4, 4);
    ctx.fillRect(80, 35, 6, 6);

    return ctx.getImageData(0, 0, width, height);
  }

  // Public API
  return {
    createStructuringElement,
    erode2D,
    dilate2D,
    open2D,
    close2D,
    topHat2D,
    blackHat2D,
    applyErode,
    applyDilate,
    applyOpen,
    applyClose,
    applyTopHat,
    applyBlackHat,
    generateBinarySample,
  };
})();
