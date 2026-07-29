/* ============================================================
   Vision Studio — Image Processing Engine
   6 Point Processing algorithms on Canvas ImageData
   ============================================================ */

const ImageProcessing = (() => {
  'use strict';

  /**
   * Helper: iterate over every pixel and apply a per-channel transform.
   * transformFn receives (value, index, channel) and returns new value.
   * Channels: 0=R, 1=G, 2=B  (alpha is preserved).
   */
  function processPixels(imageData, transformFn) {
    const src = imageData.data;
    const dst = new Uint8ClampedArray(src.length);
    for (let i = 0; i < src.length; i += 4) {
      dst[i]     = transformFn(src[i],   i, 0);   // R
      dst[i + 1] = transformFn(src[i+1], i, 1);   // G
      dst[i + 2] = transformFn(src[i+2], i, 2);   // B
      dst[i + 3] = src[i + 3];                     // A (preserve)
    }
    return new ImageData(dst, imageData.width, imageData.height);
  }

  /**
   * Build a lookup table (LUT) for O(1) per-pixel transforms.
   * mapFn(r) → s, where r ∈ [0,255], returns a float that will be clamped.
   */
  function buildLUT(mapFn) {
    const lut = new Uint8ClampedArray(256);
    for (let r = 0; r < 256; r++) {
      lut[r] = Math.round(mapFn(r));
    }
    return lut;
  }

  function applyLUT(imageData, lut) {
    const src = imageData.data;
    const dst = new Uint8ClampedArray(src.length);
    for (let i = 0; i < src.length; i += 4) {
      dst[i]     = lut[src[i]];
      dst[i + 1] = lut[src[i + 1]];
      dst[i + 2] = lut[src[i + 2]];
      dst[i + 3] = src[i + 3];
    }
    return new ImageData(dst, imageData.width, imageData.height);
  }

  /* ----------------------------------------------------------
   * 1. Image Negatives  —  s = (L-1) - r
   * ---------------------------------------------------------- */
  function applyNegative(imageData) {
    const lut = buildLUT(r => 255 - r);
    return applyLUT(imageData, lut);
  }

  /* ----------------------------------------------------------
   * 2. Log Transformation  —  s = c * log(1 + r)
   * c is typically 255 / log(1+255) ≈ 45.99 to normalize
   * ---------------------------------------------------------- */
  function applyLog(imageData, c = null) {
    if (c === null) {
      c = 255 / Math.log(1 + 255);
    }
    const lut = buildLUT(r => c * Math.log(1 + r));
    return applyLUT(imageData, lut);
  }

  /* ----------------------------------------------------------
   * 3. Power-Law (Gamma) Correction  —  s = c * r^γ
   * r is normalized to [0,1], result scaled back to [0,255]
   * ---------------------------------------------------------- */
  function applyGamma(imageData, gamma = 1.0, c = 1.0) {
    const lut = buildLUT(r => c * Math.pow(r / 255, gamma) * 255);
    return applyLUT(imageData, lut);
  }

  /* ----------------------------------------------------------
   * 4. Thresholding  —  s = 0 if r < T, else 255
   * ---------------------------------------------------------- */
  function applyThreshold(imageData, threshold = 128) {
    const lut = buildLUT(r => (r < threshold) ? 0 : 255);
    return applyLUT(imageData, lut);
  }

  /* ----------------------------------------------------------
   * 5. Contrast Stretching  —  Piecewise linear mapping
   * Points: (r1, s1) and (r2, s2)
   *   r < r1  → slope from (0,0) to (r1,s1)
   *   r1..r2  → slope from (r1,s1) to (r2,s2)
   *   r > r2  → slope from (r2,s2) to (255,255)
   * ---------------------------------------------------------- */
  function applyContrastStretch(imageData, r1 = 70, s1 = 0, r2 = 180, s2 = 255) {
    // Ensure valid control points
    r1 = Math.max(1, Math.min(254, r1));
    r2 = Math.max(r1 + 1, Math.min(255, r2));
    s1 = Math.max(0, Math.min(255, s1));
    s2 = Math.max(0, Math.min(255, s2));

    const lut = buildLUT(r => {
      if (r < r1) {
        return (s1 / r1) * r;
      } else if (r <= r2) {
        return s1 + ((s2 - s1) / (r2 - r1)) * (r - r1);
      } else {
        return s2 + ((255 - s2) / (255 - r2)) * (r - r2);
      }
    });
    return applyLUT(imageData, lut);
  }

  /* ----------------------------------------------------------
   * 6. Bit-plane Slicing  —  Extract specific bit planes
   * planes: array of bit indices (0..7) to keep, e.g. [7,6]
   * Output: composite of selected bit planes
   * ---------------------------------------------------------- */
  function applyBitPlane(imageData, planes = [7]) {
    const src = imageData.data;
    const dst = new Uint8ClampedArray(src.length);

    for (let i = 0; i < src.length; i += 4) {
      for (let ch = 0; ch < 3; ch++) {
        let val = 0;
        for (const bit of planes) {
          val |= (src[i + ch] >> bit) & 1;
        }
        // If any selected bit is set, output 255; else 0
        dst[i + ch] = val ? 255 : 0;
      }
      dst[i + 3] = src[i + 3]; // alpha
    }
    return new ImageData(dst, imageData.width, imageData.height);
  }

  /**
   * Extract a single bit plane as a binary image.
   * Returns ImageData where pixel = 255 if bit k is set, else 0.
   */
  function extractBitPlane(imageData, k) {
    return applyBitPlane(imageData, [k]);
  }

  /* ----------------------------------------------------------
   * Utility: Convert to grayscale (luminance)
   * ---------------------------------------------------------- */
  function toGrayscale(imageData) {
    const src = imageData.data;
    const dst = new Uint8ClampedArray(src.length);
    for (let i = 0; i < src.length; i += 4) {
      const gray = Math.round(0.299 * src[i] + 0.587 * src[i+1] + 0.114 * src[i+2]);
      dst[i] = dst[i+1] = dst[i+2] = gray;
      dst[i + 3] = src[i + 3];
    }
    return new ImageData(dst, imageData.width, imageData.height);
  }

  /* ----------------------------------------------------------
   * Utility: Compute histogram (grayscale)
   * Returns array[256] of frequencies
   * ---------------------------------------------------------- */
  function computeHistogram(imageData) {
    const hist = new Array(256).fill(0);
    const src = imageData.data;
    for (let i = 0; i < src.length; i += 4) {
      const gray = Math.round(0.299 * src[i] + 0.587 * src[i+1] + 0.114 * src[i+2]);
      hist[gray]++;
    }
    return hist;
  }

  /* ----------------------------------------------------------
   * 7. Histogram Equalization  —  s = T(r) = (L-1) · CDF(r)
   * Applies equalization on each channel (R, G, B) independently
   * ---------------------------------------------------------- */
  function applyHistogramEqualization(imageData) {
    const src = imageData.data;
    const dst = new Uint8ClampedArray(src.length);
    const totalPixels = imageData.width * imageData.height;

    // Compute histogram for each channel
    const histR = new Array(256).fill(0);
    const histG = new Array(256).fill(0);
    const histB = new Array(256).fill(0);

    for (let i = 0; i < src.length; i += 4) {
      histR[src[i]]++;
      histG[src[i + 1]]++;
      histB[src[i + 2]]++;
    }

    // Build CDF-based LUT for each channel
    function buildEqualizationLUT(hist) {
      const cdf = new Array(256);
      cdf[0] = hist[0];
      for (let i = 1; i < 256; i++) {
        cdf[i] = cdf[i - 1] + hist[i];
      }
      // Find cdf_min (first non-zero CDF value)
      let cdfMin = 0;
      for (let i = 0; i < 256; i++) {
        if (cdf[i] > 0) { cdfMin = cdf[i]; break; }
      }
      // Build LUT: s = round((cdf(r) - cdf_min) / (totalPixels - cdf_min) * 255)
      const lut = new Uint8ClampedArray(256);
      const denom = totalPixels - cdfMin;
      if (denom === 0) {
        for (let i = 0; i < 256; i++) lut[i] = i;
      } else {
        for (let i = 0; i < 256; i++) {
          lut[i] = Math.round(((cdf[i] - cdfMin) / denom) * 255);
        }
      }
      return lut;
    }

    const lutR = buildEqualizationLUT(histR);
    const lutG = buildEqualizationLUT(histG);
    const lutB = buildEqualizationLUT(histB);

    for (let i = 0; i < src.length; i += 4) {
      dst[i]     = lutR[src[i]];
      dst[i + 1] = lutG[src[i + 1]];
      dst[i + 2] = lutB[src[i + 2]];
      dst[i + 3] = src[i + 3]; // alpha
    }
    return new ImageData(dst, imageData.width, imageData.height);
  }

  /* ----------------------------------------------------------
   * Utility: Compute per-channel histograms (R, G, B)
   * Returns { r: array[256], g: array[256], b: array[256] }
   * ---------------------------------------------------------- */
  function computeChannelHistograms(imageData) {
    const histR = new Array(256).fill(0);
    const histG = new Array(256).fill(0);
    const histB = new Array(256).fill(0);
    const src = imageData.data;
    for (let i = 0; i < src.length; i += 4) {
      histR[src[i]]++;
      histG[src[i + 1]]++;
      histB[src[i + 2]]++;
    }
    return { r: histR, g: histG, b: histB };
  }

  /* ----------------------------------------------------------
   * Utility: Generate a sample grayscale gradient image
   * Used for concept simulations when no image is uploaded
   * ---------------------------------------------------------- */
  function generateGradient(width, height) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    for (let x = 0; x < width; x++) {
      const val = Math.round((x / (width - 1)) * 255);
      ctx.fillStyle = `rgb(${val},${val},${val})`;
      ctx.fillRect(x, 0, 1, height);
    }
    return ctx.getImageData(0, 0, width, height);
  }

  // Public API
  return {
    applyNegative,
    applyLog,
    applyGamma,
    applyThreshold,
    applyContrastStretch,
    applyBitPlane,
    applyHistogramEqualization,
    extractBitPlane,
    toGrayscale,
    computeHistogram,
    computeChannelHistograms,
    generateGradient,
    buildLUT,
    applyLUT,
  };
})();
