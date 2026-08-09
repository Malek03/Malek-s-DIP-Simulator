/* ============================================================
   Vision Studio — Smoothing Filters Processing Engine
   Mean, Gaussian, Median filters with Convolution on Canvas ImageData
   ============================================================ */

const SmoothProcessing = (() => {
  'use strict';

  /* ----------------------------------------------------------
   * Kernel Generation
   * ---------------------------------------------------------- */

  /**
   * Create a Mean (Box) filter kernel.
   * Each element = 1 / (rows * cols)
   */
  function createMeanKernel(rows, cols) {
    const val = 1 / (rows * cols);
    return Array.from({ length: rows }, () => Array(cols).fill(val));
  }

  /**
   * Create a Gaussian kernel using G(x,y) = e^(-(x²+y²)/(2σ²))
   * Then normalize so all values sum to 1.
   */
  function createGaussianKernel(rows, cols, sigma) {
    const kernel = [];
    const cx = (cols - 1) / 2;
    const cy = (rows - 1) / 2;
    let sum = 0;

    for (let i = 0; i < rows; i++) {
      const row = [];
      for (let j = 0; j < cols; j++) {
        const x = j - cx;
        const y = i - cy;
        const val = Math.exp(-(x * x + y * y) / (2 * sigma * sigma));
        row.push(val);
        sum += val;
      }
      kernel.push(row);
    }

    // Normalize
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        kernel[i][j] /= sum;
      }
    }
    return kernel;
  }

  /* ----------------------------------------------------------
   * Zero Padding
   * ---------------------------------------------------------- */

  /**
   * Add zero padding around a 2D matrix.
   * padH = number of rows to add on top/bottom
   * padW = number of cols to add on left/right
   */
  function addZeroPadding(matrix, padH, padW) {
    const h = matrix.length;
    const w = matrix[0].length;
    const newH = h + 2 * padH;
    const newW = w + 2 * padW;
    const padded = Array.from({ length: newH }, () => Array(newW).fill(0));

    for (let i = 0; i < h; i++) {
      for (let j = 0; j < w; j++) {
        padded[i + padH][j + padW] = matrix[i][j];
      }
    }
    return padded;
  }

  /* ----------------------------------------------------------
   * Pixel Matrix Extraction (for visualization)
   * ---------------------------------------------------------- */

  /**
   * Extract a small grayscale pixel matrix from ImageData.
   * Resizes image to size×size and converts to grayscale.
   * Returns 2D array of integers [0..255].
   */
  function extractPixelMatrix(imageData, size = 10) {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = size;
    tempCanvas.height = size;
    const tempCtx = tempCanvas.getContext('2d');

    // Draw the original image scaled down
    const srcCanvas = document.createElement('canvas');
    srcCanvas.width = imageData.width;
    srcCanvas.height = imageData.height;
    const srcCtx = srcCanvas.getContext('2d');
    srcCtx.putImageData(imageData, 0, 0);

    tempCtx.drawImage(srcCanvas, 0, 0, size, size);
    const data = tempCtx.getImageData(0, 0, size, size).data;

    const matrix = [];
    for (let i = 0; i < size; i++) {
      const row = [];
      for (let j = 0; j < size; j++) {
        const idx = (i * size + j) * 4;
        const gray = Math.floor(0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2]);
        row.push(gray);
      }
      matrix.push(row);
    }
    return matrix;
  }

  /* ----------------------------------------------------------
   * 2D Convolution
   * ---------------------------------------------------------- */

  /**
   * Perform 2D convolution on a grayscale matrix with a kernel.
   * @param {number[][]} matrix — 2D array of pixel values
   * @param {number[][]} kernel — 2D array of kernel weights
   * @param {boolean} usePadding — whether to zero-pad (output same size as input) or not (valid convolution)
   * @returns {number[][]} — 2D output matrix
   */
  function convolve2D(matrix, kernel, usePadding = true) {
    const kRows = kernel.length;
    const kCols = kernel[0].length;
    const padH = Math.floor(kRows / 2);
    const padW = Math.floor(kCols / 2);

    const input = usePadding ? addZeroPadding(matrix, padH, padW) : matrix;
    const inH = input.length;
    const inW = input[0].length;

    const outH = inH - kRows + 1;
    const outW = inW - kCols + 1;
    const output = [];

    for (let i = 0; i < outH; i++) {
      const row = [];
      for (let j = 0; j < outW; j++) {
        let sum = 0;
        for (let ki = 0; ki < kRows; ki++) {
          for (let kj = 0; kj < kCols; kj++) {
            sum += input[i + ki][j + kj] * kernel[ki][kj];
          }
        }
        row.push(Math.floor(Math.max(0, Math.min(255, sum))));
      }
      output.push(row);
    }
    return output;
  }

  /**
   * Perform median filtering on a grayscale matrix.
   */
  function medianFilter2D(matrix, kRows, kCols, usePadding = true) {
    const padH = Math.floor(kRows / 2);
    const padW = Math.floor(kCols / 2);

    const input = usePadding ? addZeroPadding(matrix, padH, padW) : matrix;
    const inH = input.length;
    const inW = input[0].length;

    const outH = inH - kRows + 1;
    const outW = inW - kCols + 1;
    const output = [];

    for (let i = 0; i < outH; i++) {
      const row = [];
      for (let j = 0; j < outW; j++) {
        const values = [];
        for (let ki = 0; ki < kRows; ki++) {
          for (let kj = 0; kj < kCols; kj++) {
            values.push(input[i + ki][j + kj]);
          }
        }
        values.sort((a, b) => a - b);
        row.push(values[Math.floor(values.length / 2)]);
      }
      output.push(row);
    }
    return output;
  }

  /* ----------------------------------------------------------
   * Apply filters on full ImageData (for the playground output image)
   * ---------------------------------------------------------- */

  /**
   * Apply Mean filter on ImageData (per-channel convolution).
   */
  function applyMeanFilter(imageData, rows = 3, cols = 3, usePadding = true) {
    const kernel = createMeanKernel(rows, cols);
    return applyKernelToImageData(imageData, kernel, usePadding);
  }

  /**
   * Apply Gaussian filter on ImageData.
   */
  function applyGaussianFilter(imageData, rows = 3, cols = 3, sigma = 1.0, usePadding = true) {
    const kernel = createGaussianKernel(rows, cols, sigma);
    return applyKernelToImageData(imageData, kernel, usePadding);
  }

  /**
   * Apply Median filter on ImageData.
   */
  function applyMedianFilter(imageData, rows = 3, cols = 3, usePadding = true) {
    const src = imageData.data;
    const w = imageData.width;
    const h = imageData.height;

    // Extract each channel as a 2D matrix
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

    // Apply median to each channel
    const filtered = channels.map(ch => medianFilter2D(ch, rows, cols, usePadding));

    const outH = filtered[0].length;
    const outW = filtered[0][0].length;
    const dst = new Uint8ClampedArray(outH * outW * 4);

    for (let i = 0; i < outH; i++) {
      for (let j = 0; j < outW; j++) {
        const idx = (i * outW + j) * 4;
        dst[idx]     = filtered[0][i][j];
        dst[idx + 1] = filtered[1][i][j];
        dst[idx + 2] = filtered[2][i][j];
        dst[idx + 3] = 255;
      }
    }
    return new ImageData(dst, outW, outH);
  }

  /**
   * Apply a kernel to ImageData (per-channel convolution).
   * Internal helper used by Mean and Gaussian.
   */
  function applyKernelToImageData(imageData, kernel, usePadding) {
    const src = imageData.data;
    const w = imageData.width;
    const h = imageData.height;

    // Extract each channel
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

    // Convolve each channel
    const filtered = channels.map(ch => convolve2D(ch, kernel, usePadding));

    const outH = filtered[0].length;
    const outW = filtered[0][0].length;
    const dst = new Uint8ClampedArray(outH * outW * 4);

    for (let i = 0; i < outH; i++) {
      for (let j = 0; j < outW; j++) {
        const idx = (i * outW + j) * 4;
        dst[idx]     = Math.max(0, Math.min(255, filtered[0][i][j]));
        dst[idx + 1] = Math.max(0, Math.min(255, filtered[1][i][j]));
        dst[idx + 2] = Math.max(0, Math.min(255, filtered[2][i][j]));
        dst[idx + 3] = 255;
      }
    }
    return new ImageData(dst, outW, outH);
  }

  /* ----------------------------------------------------------
   * Generate a noisy sample image for simulations
   * ---------------------------------------------------------- */
  function generateNoisySample(width, height) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // Base gradient
    const grad = ctx.createLinearGradient(0, 0, width, 0);
    grad.addColorStop(0, '#1a1a1a');
    grad.addColorStop(0.3, '#555');
    grad.addColorStop(0.6, '#999');
    grad.addColorStop(1, '#ddd');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Shapes
    ctx.fillStyle = '#333';
    ctx.fillRect(20, 20, 60, 90);
    ctx.fillStyle = '#777';
    ctx.beginPath();
    ctx.arc(width * 0.4, height * 0.5, 35, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#aaa';
    ctx.fillRect(width * 0.55, 15, 65, 100);
    ctx.fillStyle = '#ccc';
    ctx.beginPath();
    ctx.arc(width * 0.82, height * 0.5, 30, 0, Math.PI * 2);
    ctx.fill();

    // Add salt-and-pepper noise
    const imgData = ctx.getImageData(0, 0, width, height);
    const d = imgData.data;
    for (let i = 0; i < d.length; i += 4) {
      if (Math.random() < 0.05) {
        const val = Math.random() < 0.5 ? 0 : 255;
        d[i] = d[i + 1] = d[i + 2] = val;
      }
    }
    ctx.putImageData(imgData, 0, 0);
    return ctx.getImageData(0, 0, width, height);
  }

  // Public API
  return {
    createMeanKernel,
    createGaussianKernel,
    addZeroPadding,
    extractPixelMatrix,
    convolve2D,
    medianFilter2D,
    applyMeanFilter,
    applyGaussianFilter,
    applyMedianFilter,
    generateNoisySample,
  };
})();
