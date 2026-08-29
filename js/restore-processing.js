/* ============================================================
   Vision Studio — Image Restoration Processing Engine
   Noise Generation + Restoration Filters (Spatial Domain)
   ============================================================ */

const RestoreProcessing = (() => {
  'use strict';

  /* ----------------------------------------------------------
   * NOISE GENERATION
   * ---------------------------------------------------------- */

  /**
   * Generate a random number from a Gaussian distribution
   * using the Box-Muller transform.
   */
  function gaussianRandom(mean, sigma) {
    let u1 = Math.random();
    let u2 = Math.random();
    // Avoid log(0)
    while (u1 === 0) u1 = Math.random();
    const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    return mean + sigma * z;
  }

  /**
   * Add Gaussian noise to an ImageData object.
   * @param {ImageData} imageData — source image
   * @param {number} mean — mean of Gaussian (default 0)
   * @param {number} sigma — standard deviation (default 25)
   * @returns {ImageData} — new noisy ImageData
   */
  function addGaussianNoise(imageData, mean = 0, sigma = 25) {
    const src = imageData.data;
    const out = new Uint8ClampedArray(src.length);
    for (let i = 0; i < src.length; i += 4) {
      out[i]     = src[i]     + gaussianRandom(mean, sigma); // R
      out[i + 1] = src[i + 1] + gaussianRandom(mean, sigma); // G
      out[i + 2] = src[i + 2] + gaussianRandom(mean, sigma); // B
      out[i + 3] = src[i + 3]; // Alpha
    }
    return new ImageData(out, imageData.width, imageData.height);
  }

  /**
   * Add Salt & Pepper noise to an ImageData object.
   * @param {ImageData} imageData — source image
   * @param {number} saltProb — probability of salt (white) noise (0–1)
   * @param {number} pepperProb — probability of pepper (black) noise (0–1)
   * @returns {ImageData} — new noisy ImageData
   */
  function addSaltPepperNoise(imageData, saltProb = 0.02, pepperProb = 0.02) {
    const src = imageData.data;
    const out = new Uint8ClampedArray(src);
    for (let i = 0; i < src.length; i += 4) {
      const r = Math.random();
      if (r < pepperProb) {
        // Pepper (black)
        out[i] = 0; out[i + 1] = 0; out[i + 2] = 0;
      } else if (r < pepperProb + saltProb) {
        // Salt (white)
        out[i] = 255; out[i + 1] = 255; out[i + 2] = 255;
      }
    }
    return new ImageData(out, imageData.width, imageData.height);
  }

  /**
   * Add Uniform noise to an ImageData object.
   * @param {ImageData} imageData — source image
   * @param {number} low — lower bound of uniform distribution
   * @param {number} high — upper bound of uniform distribution
   * @returns {ImageData} — new noisy ImageData
   */
  function addUniformNoise(imageData, low = -30, high = 30) {
    const src = imageData.data;
    const out = new Uint8ClampedArray(src.length);
    const range = high - low;
    for (let i = 0; i < src.length; i += 4) {
      out[i]     = src[i]     + low + Math.random() * range;
      out[i + 1] = src[i + 1] + low + Math.random() * range;
      out[i + 2] = src[i + 2] + low + Math.random() * range;
      out[i + 3] = src[i + 3];
    }
    return new ImageData(out, imageData.width, imageData.height);
  }

  /* ----------------------------------------------------------
   * HELPER: Extract channel matrix from ImageData
   * ---------------------------------------------------------- */

  /**
   * Extract a single color channel as a 2D array from ImageData.
   * @param {ImageData} imageData
   * @param {number} channel — 0=R, 1=G, 2=B
   * @returns {number[][]} — 2D array [height][width]
   */
  function extractChannel(imageData, channel) {
    const w = imageData.width;
    const h = imageData.height;
    const data = imageData.data;
    const matrix = [];
    for (let y = 0; y < h; y++) {
      const row = [];
      for (let x = 0; x < w; x++) {
        row.push(data[(y * w + x) * 4 + channel]);
      }
      matrix.push(row);
    }
    return matrix;
  }

  /**
   * Combine three channel matrices into a new ImageData.
   * @param {number[][]} r — Red channel matrix
   * @param {number[][]} g — Green channel matrix
   * @param {number[][]} b — Blue channel matrix
   * @param {number} width
   * @param {number} height
   * @returns {ImageData}
   */
  function combineChannels(r, g, b, width, height) {
    const out = new Uint8ClampedArray(width * height * 4);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        out[idx]     = Math.max(0, Math.min(255, Math.round(r[y][x])));
        out[idx + 1] = Math.max(0, Math.min(255, Math.round(g[y][x])));
        out[idx + 2] = Math.max(0, Math.min(255, Math.round(b[y][x])));
        out[idx + 3] = 255;
      }
    }
    return new ImageData(out, width, height);
  }

  /**
   * Get the padded value from a matrix using reflection at borders.
   */
  function getPaddedValue(matrix, y, x, h, w) {
    if (y < 0) y = -y;
    if (x < 0) x = -x;
    if (y >= h) y = 2 * h - y - 2;
    if (x >= w) x = 2 * w - x - 2;
    // Clamp for safety
    y = Math.max(0, Math.min(h - 1, y));
    x = Math.max(0, Math.min(w - 1, x));
    return matrix[y][x];
  }

  /**
   * Extract a window of values from a channel matrix at position (cy, cx).
   * Uses reflection padding.
   */
  function getWindow(matrix, cy, cx, kSize, h, w) {
    const half = Math.floor(kSize / 2);
    const values = [];
    for (let ky = -half; ky <= half; ky++) {
      for (let kx = -half; kx <= half; kx++) {
        values.push(getPaddedValue(matrix, cy + ky, cx + kx, h, w));
      }
    }
    return values;
  }

  /* ----------------------------------------------------------
   * RESTORATION FILTERS — applied per channel
   * ---------------------------------------------------------- */

  /**
   * Apply a filter function to each channel of an ImageData.
   * @param {ImageData} imageData — input
   * @param {Function} filterFn — function(channelMatrix, kSize, ...params) → resultMatrix
   * @param {number} kSize — kernel size
   * @param  {...any} params — extra parameters for the filter
   * @returns {ImageData}
   */
  function applyFilterPerChannel(imageData, filterFn, kSize, ...params) {
    const w = imageData.width;
    const h = imageData.height;
    const rCh = extractChannel(imageData, 0);
    const gCh = extractChannel(imageData, 1);
    const bCh = extractChannel(imageData, 2);

    const rOut = filterFn(rCh, kSize, w, h, ...params);
    const gOut = filterFn(gCh, kSize, w, h, ...params);
    const bOut = filterFn(bCh, kSize, w, h, ...params);

    return combineChannels(rOut, gOut, bOut, w, h);
  }

  /* ----------------------------------------------------------
   * 1. Arithmetic Mean Filter
   * f_hat(x,y) = (1/mn) * Σ g(s,t)
   * ---------------------------------------------------------- */

  function arithmeticMeanChannel(matrix, kSize, w, h) {
    const result = [];
    const mn = kSize * kSize;
    const half = Math.floor(kSize / 2);
    for (let y = 0; y < h; y++) {
      const row = [];
      for (let x = 0; x < w; x++) {
        let sum = 0;
        for (let ky = -half; ky <= half; ky++) {
          for (let kx = -half; kx <= half; kx++) {
            sum += getPaddedValue(matrix, y + ky, x + kx, h, w);
          }
        }
        row.push(sum / mn);
      }
      result.push(row);
    }
    return result;
  }

  function arithmeticMeanFilter(imageData, kSize = 3) {
    return applyFilterPerChannel(imageData, arithmeticMeanChannel, kSize);
  }

  /* ----------------------------------------------------------
   * 2. Geometric Mean Filter
   * f_hat(x,y) = (Π g(s,t))^(1/mn)
   * ---------------------------------------------------------- */

  function geometricMeanChannel(matrix, kSize, w, h) {
    const result = [];
    const mn = kSize * kSize;
    const half = Math.floor(kSize / 2);
    for (let y = 0; y < h; y++) {
      const row = [];
      for (let x = 0; x < w; x++) {
        // Use log-sum to avoid overflow
        let logSum = 0;
        for (let ky = -half; ky <= half; ky++) {
          for (let kx = -half; kx <= half; kx++) {
            const val = getPaddedValue(matrix, y + ky, x + kx, h, w);
            logSum += Math.log(Math.max(val, 1e-10)); // Avoid log(0)
          }
        }
        row.push(Math.exp(logSum / mn));
      }
      result.push(row);
    }
    return result;
  }

  function geometricMeanFilter(imageData, kSize = 3) {
    return applyFilterPerChannel(imageData, geometricMeanChannel, kSize);
  }

  /* ----------------------------------------------------------
   * 3. Harmonic Mean Filter
   * f_hat(x,y) = mn / Σ(1/g(s,t))
   * ---------------------------------------------------------- */

  function harmonicMeanChannel(matrix, kSize, w, h) {
    const result = [];
    const mn = kSize * kSize;
    const half = Math.floor(kSize / 2);
    for (let y = 0; y < h; y++) {
      const row = [];
      for (let x = 0; x < w; x++) {
        let reciprocalSum = 0;
        for (let ky = -half; ky <= half; ky++) {
          for (let kx = -half; kx <= half; kx++) {
            const val = getPaddedValue(matrix, y + ky, x + kx, h, w);
            reciprocalSum += 1.0 / Math.max(val, 1e-10);
          }
        }
        row.push(mn / reciprocalSum);
      }
      result.push(row);
    }
    return result;
  }

  function harmonicMeanFilter(imageData, kSize = 3) {
    return applyFilterPerChannel(imageData, harmonicMeanChannel, kSize);
  }

  /* ----------------------------------------------------------
   * 4. Contra-Harmonic Mean Filter
   * f_hat(x,y) = Σ g(s,t)^(Q+1) / Σ g(s,t)^Q
   * Q > 0 → eliminates pepper noise
   * Q < 0 → eliminates salt noise
   * Q = 0 → arithmetic mean
   * Q = -1 → harmonic mean
   * ---------------------------------------------------------- */

  function contraHarmonicMeanChannel(matrix, kSize, w, h, Q) {
    const result = [];
    const half = Math.floor(kSize / 2);
    for (let y = 0; y < h; y++) {
      const row = [];
      for (let x = 0; x < w; x++) {
        let numerator = 0;
        let denominator = 0;
        for (let ky = -half; ky <= half; ky++) {
          for (let kx = -half; kx <= half; kx++) {
            const val = Math.max(getPaddedValue(matrix, y + ky, x + kx, h, w), 1e-10);
            numerator += Math.pow(val, Q + 1);
            denominator += Math.pow(val, Q);
          }
        }
        row.push(denominator !== 0 ? numerator / denominator : 0);
      }
      result.push(row);
    }
    return result;
  }

  function contraHarmonicMeanFilter(imageData, kSize = 3, Q = 1.5) {
    return applyFilterPerChannel(imageData, contraHarmonicMeanChannel, kSize, Q);
  }

  /* ----------------------------------------------------------
   * 5. Alpha-Trimmed Mean Filter
   * Sort mn values, delete d/2 smallest and d/2 largest,
   * then average the remaining (mn - d) values.
   * d = 0 → arithmetic mean
   * d = mn - 1 → median filter
   * ---------------------------------------------------------- */

  function alphaTrimmedMeanChannel(matrix, kSize, w, h, d) {
    const result = [];
    const mn = kSize * kSize;
    const half = Math.floor(kSize / 2);
    // Clamp d: must be even and < mn
    const dClamped = Math.min(Math.max(0, d), mn - 1);
    const trim = Math.floor(dClamped / 2);
    const count = mn - 2 * trim;

    for (let y = 0; y < h; y++) {
      const row = [];
      for (let x = 0; x < w; x++) {
        const values = getWindow(matrix, y, x, kSize, h, w);
        values.sort((a, b) => a - b);
        // Sum middle values (excluding trim from each end)
        let sum = 0;
        for (let i = trim; i < trim + count; i++) {
          sum += values[i];
        }
        row.push(sum / count);
      }
      result.push(row);
    }
    return result;
  }

  function alphaTrimmedMeanFilter(imageData, kSize = 5, d = 4) {
    return applyFilterPerChannel(imageData, alphaTrimmedMeanChannel, kSize, d);
  }

  /* ----------------------------------------------------------
   * 6. Adaptive Local Wiener Filter (Spatial Domain)
   * Estimates local mean and variance in a window,
   * then applies: f_hat = g - (σn² / σL²) * (g - μL)
   * where σn² is estimated global noise variance,
   *       σL² is local variance, μL is local mean.
   * If σL² < σn², output = μL (pure smoothing)
   * ---------------------------------------------------------- */

  function wienerChannel(matrix, kSize, w, h, noiseVariance) {
    const result = [];
    const mn = kSize * kSize;
    const half = Math.floor(kSize / 2);

    for (let y = 0; y < h; y++) {
      const row = [];
      for (let x = 0; x < w; x++) {
        const values = getWindow(matrix, y, x, kSize, h, w);

        // Local mean
        let localMean = 0;
        for (let i = 0; i < values.length; i++) {
          localMean += values[i];
        }
        localMean /= mn;

        // Local variance
        let localVar = 0;
        for (let i = 0; i < values.length; i++) {
          const diff = values[i] - localMean;
          localVar += diff * diff;
        }
        localVar /= mn;

        // Wiener estimate
        const g = matrix[y][x];
        if (localVar <= noiseVariance) {
          // If local variance <= noise variance, output local mean (pure smoothing)
          row.push(localMean);
        } else {
          // f_hat = g - (σn² / σL²) * (g - μL)
          const ratio = noiseVariance / localVar;
          row.push(g - ratio * (g - localMean));
        }
      }
      result.push(row);
    }
    return result;
  }

  function wienerFilter(imageData, kSize = 5, noiseVariance = 500) {
    return applyFilterPerChannel(imageData, wienerChannel, kSize, noiseVariance);
  }

  /* ----------------------------------------------------------
   * Estimate noise variance from an ImageData.
   * Uses Median Absolute Deviation (MAD) on a Laplacian.
   * Simple method: variance of the entire grayscale image.
   * ---------------------------------------------------------- */

  function estimateNoiseVariance(imageData) {
    const data = imageData.data;
    const n = data.length / 4;
    let sum = 0;
    let sumSq = 0;
    for (let i = 0; i < data.length; i += 4) {
      const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      sum += gray;
      sumSq += gray * gray;
    }
    const mean = sum / n;
    return (sumSq / n) - (mean * mean);
  }

  /* ----------------------------------------------------------
   * PSNR Calculation
   * PSNR = 10 * log10(MAX² / MSE)
   * ---------------------------------------------------------- */

  function calculatePSNR(original, restored) {
    const src = original.data;
    const res = restored.data;
    const n = src.length / 4;
    let mse = 0;
    for (let i = 0; i < src.length; i += 4) {
      for (let c = 0; c < 3; c++) {
        const diff = src[i + c] - res[i + c];
        mse += diff * diff;
      }
    }
    mse /= (n * 3);
    if (mse === 0) return Infinity;
    return 10 * Math.log10((255 * 255) / mse);
  }

  /* ----------------------------------------------------------
   * Public API
   * ---------------------------------------------------------- */

  return {
    // Noise generation
    addGaussianNoise,
    addSaltPepperNoise,
    addUniformNoise,
    // Restoration filters
    arithmeticMeanFilter,
    geometricMeanFilter,
    harmonicMeanFilter,
    contraHarmonicMeanFilter,
    alphaTrimmedMeanFilter,
    wienerFilter,
    // Utilities
    estimateNoiseVariance,
    calculatePSNR
  };

})();
