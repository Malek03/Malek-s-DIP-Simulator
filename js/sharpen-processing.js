/* ============================================================
   Vision Studio — Sharpening Filters Processing Engine
   Laplacian, Sobel, Prewitt, Unsharp Masking, High-Boost, Canny
   ============================================================ */

const SharpenProcessing = (() => {
  'use strict';

  /* ----------------------------------------------------------
   * Kernel Generation
   * ---------------------------------------------------------- */

  /**
   * Create a Laplacian kernel.
   * @param {string} type — '4' (4-connected) or '8' (8-connected)
   * @returns {number[][]}
   */
  function createLaplacianKernel(type = '4') {
    if (type === '8') {
      return [
        [-1, -1, -1],
        [-1,  8, -1],
        [-1, -1, -1]
      ];
    }
    // 4-connected (default)
    return [
      [ 0, -1,  0],
      [-1,  4, -1],
      [ 0, -1,  0]
    ];
  }

  /**
   * Create Sobel kernels (Gx, Gy, and Diagonals).
   * @param {number} size — 3 or 5
   * @returns {Object}
   */
  function createSobelKernels(size = 3) {
    if (size === 5) {
      return {
        kx: [
          [-1, -2, 0, 2, 1],
          [-4, -8, 0, 8, 4],
          [-6,-12, 0,12, 6],
          [-4, -8, 0, 8, 4],
          [-1, -2, 0, 2, 1]
        ],
        ky: [
          [-1, -4, -6, -4, -1],
          [-2, -8,-12, -8, -2],
          [ 0,  0,  0,  0,  0],
          [ 2,  8, 12,  8,  2],
          [ 1,  4,  6,  4,  1]
        ],
        kx_diag1: [ // Main Diagonal Approximation for 5x5
          [ 0,  1,  2,  3,  4],
          [-1,  0,  1,  2,  3],
          [-2, -1,  0,  1,  2],
          [-3, -2, -1,  0,  1],
          [-4, -3, -2, -1,  0]
        ],
        ky_diag2: [ // Secondary Diagonal Approximation for 5x5
          [-4, -3, -2, -1,  0],
          [-3, -2, -1,  0,  1],
          [-2, -1,  0,  1,  2],
          [-1,  0,  1,  2,  3],
          [ 0,  1,  2,  3,  4]
        ]
      };
    }
    // 3×3 (default)
    return {
      kx: [
        [-1, 0, 1],
        [-2, 0, 2],
        [-1, 0, 1]
      ],
      ky: [
        [-1, -2, -1],
        [ 0,  0,  0],
        [ 1,  2,  1]
      ],
      kx_diag1: [
        [ 0,  1,  2],
        [-1,  0,  1],
        [-2, -1,  0]
      ],
      ky_diag2: [
        [-2, -1,  0],
        [-1,  0,  1],
        [ 0,  1,  2]
      ]
    };
  }

  /**
   * Create Prewitt kernels (Gx and Gy). Always 3×3.
   * @returns {{ kx: number[][], ky: number[][] }}
   */
  function createPrewittKernels() {
    return {
      kx: [
        [-1, 0, 1],
        [-1, 0, 1],
        [-1, 0, 1]
      ],
      ky: [
        [-1, -1, -1],
        [ 0,  0,  0],
        [ 1,  1,  1]
      ]
    };
  }

  /* ----------------------------------------------------------
   * 2D Convolution (reuse from SmoothProcessing)
   * ---------------------------------------------------------- */

  /**
   * Apply gradient-based filter. If only one kernel provided, returns its magnitude.
   * If both provided, returns |Gx| + |Gy|.
   */
  function gradientFilter2D(matrix, kx, ky, paddingType = 'zero', stride = 1) {
    const gx = kx ? SmoothProcessing.convolve2D(matrix, kx, paddingType, stride) : null;
    const gy = ky ? SmoothProcessing.convolve2D(matrix, ky, paddingType, stride) : null;

    const ref = gx || gy;
    const h = ref.length;
    const w = ref[0].length;
    const output = [];

    for (let i = 0; i < h; i++) {
      const row = [];
      for (let j = 0; j < w; j++) {
        let mag = 0;
        if (gx && gy) {
          mag = Math.abs(gx[i][j]) + Math.abs(gy[i][j]);
        } else if (gx) {
          mag = Math.abs(gx[i][j]);
        } else if (gy) {
          mag = Math.abs(gy[i][j]);
        }
        row.push(Math.floor(Math.max(0, Math.min(255, mag))));
      }
      output.push(row);
    }
    return output;
  }

  /* ----------------------------------------------------------
   * Apply filters on full ImageData
   * ---------------------------------------------------------- */

  /**
   * Extract channels from ImageData → array of 3 2D matrices.
   */
  function extractChannels(imageData) {
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

  /**
   * Build ImageData from 3 filtered channel matrices.
   */
  function channelsToImageData(filtered) {
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

  /**
   * Convert ImageData to a single grayscale 2D array.
   */
  function toGrayscale(imageData) {
    const src = imageData.data;
    const w = imageData.width;
    const h = imageData.height;
    const gray = [];
    for (let i = 0; i < h; i++) {
      const row = [];
      for (let j = 0; j < w; j++) {
        const idx = (i * w + j) * 4;
        const val = 0.299 * src[idx] + 0.587 * src[idx+1] + 0.114 * src[idx+2];
        row.push(val);
      }
      gray.push(row);
    }
    return gray;
  }

  /**
   * Apply Laplacian filter on ImageData.
   */
  function applyLaplacianFilter(imageData, type = '4', paddingType = 'zero', stride = 1) {
    const kernel = createLaplacianKernel(type);
    const channels = extractChannels(imageData);
    const filtered = channels.map(ch => {
      const edges = SmoothProcessing.convolve2D(ch, kernel, paddingType, stride);
      if (stride > 1) {
        return edges.map(row => row.map(v => Math.floor(Math.max(0, Math.min(255, Math.abs(v))))));
      }
      const h = edges.length;
      const w = edges[0].length;
      const result = [];
      for (let i = 0; i < h; i++) {
        const row = [];
        for (let j = 0; j < w; j++) {
          row.push(Math.floor(Math.max(0, Math.min(255, ch[i][j] + edges[i][j]))));
        }
        result.push(row);
      }
      return result;
    });
    return channelsToImageData(filtered);
  }

  /**
   * Apply Sobel filter on ImageData (supports directions).
   */
  function applySobelFilter(imageData, size = 3, axis = 'mag', paddingType = 'zero', stride = 1) {
    const kernels = createSobelKernels(size);
    let kx = null, ky = null;
    
    if (axis === 'mag') {
      kx = kernels.kx; ky = kernels.ky;
    } else if (axis === 'x') {
      kx = kernels.kx;
    } else if (axis === 'y') {
      ky = kernels.ky;
    } else if (axis === 'diag1') {
      kx = kernels.kx_diag1;
    } else if (axis === 'diag2') {
      kx = kernels.ky_diag2;
    }

    const channels = extractChannels(imageData);
    const filtered = channels.map(ch => gradientFilter2D(ch, kx, ky, paddingType, stride));
    return channelsToImageData(filtered);
  }

  /**
   * Apply Prewitt filter on ImageData.
   */
  function applyPrewittFilter(imageData, paddingType = 'zero', stride = 1) {
    const { kx, ky } = createPrewittKernels();
    const channels = extractChannels(imageData);
    const filtered = channels.map(ch => gradientFilter2D(ch, kx, ky, paddingType, stride));
    return channelsToImageData(filtered);
  }

  /**
   * Apply Unsharp Masking on ImageData.
   */
  function applyUnsharpMask(imageData, kSize = 3, sigma = 1.0, k = 1.0, paddingType = 'zero', stride = 1) {
    const channels = extractChannels(imageData);
    const gaussKernel = SmoothProcessing.createGaussianKernel(kSize, kSize, sigma);

    const filtered = channels.map(ch => {
      const blurred = SmoothProcessing.convolve2D(ch, gaussKernel, paddingType, stride);
      const h = blurred.length;
      const w = blurred[0].length;
      const result = [];

      for (let i = 0; i < h; i++) {
        const row = [];
        for (let j = 0; j < w; j++) {
          const origI = stride > 1 ? i * stride : i;
          const origJ = stride > 1 ? j * stride : j;
          const origVal = (origI < ch.length && origJ < ch[0].length) ? ch[origI][origJ] : 0;
          const diff = origVal - blurred[i][j];
          const val = origVal + k * diff;
          row.push(Math.floor(Math.max(0, Math.min(255, val))));
        }
        result.push(row);
      }
      return result;
    });
    return channelsToImageData(filtered);
  }

  /**
   * Apply High-Boost filter on ImageData.
   */
  function applyHighBoost(imageData, kSize = 3, sigma = 1.0, A = 1.5, paddingType = 'zero', stride = 1) {
    const channels = extractChannels(imageData);
    const gaussKernel = SmoothProcessing.createGaussianKernel(kSize, kSize, sigma);

    const filtered = channels.map(ch => {
      const blurred = SmoothProcessing.convolve2D(ch, gaussKernel, paddingType, stride);
      const h = blurred.length;
      const w = blurred[0].length;
      const result = [];

      for (let i = 0; i < h; i++) {
        const row = [];
        for (let j = 0; j < w; j++) {
          const origI = stride > 1 ? i * stride : i;
          const origJ = stride > 1 ? j * stride : j;
          const origVal = (origI < ch.length && origJ < ch[0].length) ? ch[origI][origJ] : 0;
          const val = A * origVal - blurred[i][j];
          row.push(Math.floor(Math.max(0, Math.min(255, val))));
        }
        result.push(row);
      }
      return result;
    });
    return channelsToImageData(filtered);
  }

  /**
   * Apply Canny Edge Detection Filter (Pure JS implementation).
   */
  function applyCannyFilter(imageData, lowThresh = 50, highThresh = 150, sigma = 1.0) {
    const w = imageData.width;
    const h = imageData.height;
    let gray = toGrayscale(imageData);
    
    // 1. Gaussian Blur
    const kSize = Math.max(3, Math.ceil(sigma * 3));
    const size = kSize % 2 === 0 ? kSize + 1 : kSize;
    const gaussKernel = SmoothProcessing.createGaussianKernel(size, size, sigma);
    gray = SmoothProcessing.convolve2D(gray, gaussKernel, 'replicate');
    
    // 2. Sobel Gradients
    const sobel = createSobelKernels(3);
    const gx = SmoothProcessing.convolve2D(gray, sobel.kx, 'replicate');
    const gy = SmoothProcessing.convolve2D(gray, sobel.ky, 'replicate');
    
    const mag = [];
    const angle = [];
    for (let i = 0; i < h; i++) {
      mag.push(new Float32Array(w));
      angle.push(new Float32Array(w));
      for (let j = 0; j < w; j++) {
        mag[i][j] = Math.sqrt(gx[i][j]*gx[i][j] + gy[i][j]*gy[i][j]);
        let ang = Math.atan2(gy[i][j], gx[i][j]) * (180 / Math.PI);
        if (ang < 0) ang += 180;
        angle[i][j] = ang;
      }
    }
    
    // 3. Non-maximum suppression
    const nms = [];
    for (let i = 0; i < h; i++) {
      nms.push(new Float32Array(w));
      for (let j = 0; j < w; j++) {
        if (i === 0 || i === h - 1 || j === 0 || j === w - 1) {
          nms[i][j] = 0;
          continue;
        }
        const ang = angle[i][j];
        const m = mag[i][j];
        let q = 255, r = 255;
        
        // angle 0
        if ((ang >= 0 && ang < 22.5) || (ang >= 157.5 && ang <= 180)) {
          q = mag[i][j+1]; r = mag[i][j-1];
        }
        // angle 45
        else if (ang >= 22.5 && ang < 67.5) {
          q = mag[i-1][j+1]; r = mag[i+1][j-1]; // Note: y goes down
        }
        // angle 90
        else if (ang >= 67.5 && ang < 112.5) {
          q = mag[i-1][j]; r = mag[i+1][j];
        }
        // angle 135
        else if (ang >= 112.5 && ang < 157.5) {
          q = mag[i-1][j-1]; r = mag[i+1][j+1];
        }
        
        if (m >= q && m >= r) {
          nms[i][j] = m;
        } else {
          nms[i][j] = 0;
        }
      }
    }
    
    // 4. Double threshold
    const out = [];
    const strong = 255;
    const weak = 50;
    
    for (let i = 0; i < h; i++) {
      out.push(new Uint8Array(w));
      for (let j = 0; j < w; j++) {
        if (nms[i][j] >= highThresh) {
          out[i][j] = strong;
        } else if (nms[i][j] >= lowThresh) {
          out[i][j] = weak;
        } else {
          out[i][j] = 0;
        }
      }
    }
    
    // 5. Hysteresis (Edge Tracking)
    // A simple multi-pass approach to propagate strong edges
    let changed = true;
    while(changed) {
      changed = false;
      for (let i = 1; i < h - 1; i++) {
        for (let j = 1; j < w - 1; j++) {
          if (out[i][j] === weak) {
            if (out[i+1][j-1] === strong || out[i+1][j] === strong || out[i+1][j+1] === strong ||
                out[i][j-1] === strong || out[i][j+1] === strong ||
                out[i-1][j-1] === strong || out[i-1][j] === strong || out[i-1][j+1] === strong) {
              out[i][j] = strong;
              changed = true;
            }
          }
        }
      }
    }
    
    // Clean up remaining weak edges
    for (let i = 0; i < h; i++) {
      for (let j = 0; j < w; j++) {
        if (out[i][j] === weak) out[i][j] = 0;
      }
    }
    
    // Convert out to ImageData
    const dst = new Uint8ClampedArray(w * h * 4);
    for (let i = 0; i < h; i++) {
      for (let j = 0; j < w; j++) {
        const idx = (i * w + j) * 4;
        const v = out[i][j];
        dst[idx] = v;
        dst[idx+1] = v;
        dst[idx+2] = v;
        dst[idx+3] = 255;
      }
    }
    return new ImageData(dst, w, h);
  }

  /* ----------------------------------------------------------
   * Generate a sample image with clear edges (for simulations)
   * ---------------------------------------------------------- */
  function generateEdgeSample(width, height) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // Base gradient
    ctx.fillStyle = '#888';
    ctx.fillRect(0, 0, width, height);

    // Sharp-edged geometric shapes
    ctx.fillStyle = '#222';
    ctx.fillRect(15, 15, 70, 55);

    ctx.fillStyle = '#ddd';
    ctx.fillRect(width * 0.45, 10, 60, 70);

    ctx.fillStyle = '#555';
    ctx.beginPath();
    ctx.arc(width * 0.25, height * 0.7, 25, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#bbb';
    ctx.beginPath();
    ctx.arc(width * 0.75, height * 0.65, 30, 0, Math.PI * 2);
    ctx.fill();

    // Diagonal line
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(width * 0.1, height * 0.9);
    ctx.lineTo(width * 0.9, height * 0.1);
    ctx.stroke();

    // Cross pattern
    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(width * 0.5, 0);
    ctx.lineTo(width * 0.5, height);
    ctx.moveTo(0, height * 0.5);
    ctx.lineTo(width, height * 0.5);
    ctx.stroke();

    return ctx.getImageData(0, 0, width, height);
  }

  // Public API
  return {
    createLaplacianKernel,
    createSobelKernels,
    createPrewittKernels,
    gradientFilter2D,
    extractChannels,
    channelsToImageData,
    toGrayscale,
    applyLaplacianFilter,
    applySobelFilter,
    applyPrewittFilter,
    applyUnsharpMask,
    applyHighBoost,
    applyCannyFilter,
    generateEdgeSample,
  };
})();
