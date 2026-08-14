/* ============================================================
   Vision Studio — Smoothing Filters Python Code Generator
   Generates Python (OpenCV/NumPy) code for Mean, Gaussian, Median, Min, Max
   ============================================================ */

const SmoothCodeGenerator = (() => {
  'use strict';

  /* ----------------------------------------------------------
   * Helper Functions
   * ---------------------------------------------------------- */

  function getBorderCode(paddingType) {
    switch (paddingType) {
      case 'zero': return 'cv2.BORDER_CONSTANT';
      case 'replicate': return 'cv2.BORDER_REPLICATE';
      case 'reflect': return 'cv2.BORDER_REFLECT';
      case 'none': return 'cv2.BORDER_CONSTANT # OpenCV pads by default, slicing required for "valid"';
      default: return 'cv2.BORDER_CONSTANT';
    }
  }

  function getStrideCode(stride, varName) {
    if (stride && stride > 1) {
      return `\n\n# تطبيق الخطوة (Stride = ${stride})\n${varName} = ${varName}[::${stride}, ::${stride}]`;
    }
    return '';
  }

  /* ----------------------------------------------------------
   * Code Templates
   * ---------------------------------------------------------- */

  function generateMean(rows = 3, cols = 3, paddingType = 'zero', stride = 1) {
    const borderCode = getBorderCode(paddingType);
    const strideCode = getStrideCode(stride, 'mean_filtered');

    return `import cv2
import numpy as np

# قراءة الصورة
img = cv2.imread('image.jpg')

# تطبيق فلتر المتوسط (Mean Filter)
# حجم الـ Kernel: ${rows}×${cols}
kernel_size = (${rows}, ${cols})
border_type = ${borderCode}

mean_filtered = cv2.blur(img, kernel_size, borderType=border_type)${strideCode}

# عرض النتائج
cv2.imshow('Original', img)
cv2.imshow('Mean Filtered', mean_filtered)
cv2.waitKey(0)
cv2.destroyAllWindows()

# حفظ الناتج
cv2.imwrite('mean_filtered.jpg', mean_filtered)`;
  }

  function generateGaussian(rows = 3, cols = 3, sigma = 1.0, paddingType = 'zero', stride = 1) {
    const borderCode = getBorderCode(paddingType);
    const strideCode = getStrideCode(stride, 'gaussian_filtered');

    return `import cv2
import numpy as np

# قراءة الصورة
img = cv2.imread('image.jpg')

# تطبيق فلتر جاوس (Gaussian Filter)
# حجم الـ Kernel: ${rows}×${cols}, σ = ${sigma.toFixed(2)}
kernel_size = (${rows}, ${cols})
sigma = ${sigma.toFixed(2)}
border_type = ${borderCode}

gaussian_filtered = cv2.GaussianBlur(img, kernel_size, sigmaX=sigma, borderType=border_type)${strideCode}

# عرض النتائج
cv2.imshow('Original', img)
cv2.imshow('Gaussian Filtered', gaussian_filtered)
cv2.waitKey(0)
cv2.destroyAllWindows()

# حفظ الناتج
cv2.imwrite('gaussian_filtered.jpg', gaussian_filtered)`;
  }

  function generateMedian(size = 3, paddingType = 'zero', stride = 1) {
    // OpenCV requires odd size for median
    const actualSize = size % 2 === 0 ? size + 1 : size;
    const strideCode = getStrideCode(stride, 'median_filtered');

    return `import cv2
import numpy as np

# قراءة الصورة
img = cv2.imread('image.jpg')

# تطبيق فلتر الوسيط (Median Filter)
# حجم النافذة: ${actualSize}×${actualSize}
# ملاحظة: cv2.medianBlur يستخدم BORDER_REPLICATE داخلياً بشكل افتراضي

median_filtered = cv2.medianBlur(img, ${actualSize})${strideCode}

# عرض النتائج
cv2.imshow('Original', img)
cv2.imshow('Median Filtered', median_filtered)
cv2.waitKey(0)
cv2.destroyAllWindows()

# حفظ الناتج
cv2.imwrite('median_filtered.jpg', median_filtered)`;
  }

  function generateMin(size = 3, paddingType = 'zero', stride = 1) {
    const borderCode = getBorderCode(paddingType);
    const strideCode = getStrideCode(stride, 'min_filtered');

    return `import cv2
import numpy as np

# قراءة الصورة
img = cv2.imread('image.jpg')

# تطبيق فلتر الحد الأدنى (Min Filter)
# مكافئ لعملية Erode في المورفولوجيا
# حجم النافذة: ${size}×${size}
kernel = np.ones((${size}, ${size}), np.uint8)
border_type = ${borderCode}

min_filtered = cv2.erode(img, kernel, borderType=border_type)${strideCode}

# عرض النتائج
cv2.imshow('Original', img)
cv2.imshow('Min Filtered', min_filtered)
cv2.waitKey(0)
cv2.destroyAllWindows()

# حفظ الناتج
cv2.imwrite('min_filtered.jpg', min_filtered)`;
  }

  function generateMax(size = 3, paddingType = 'zero', stride = 1) {
    const borderCode = getBorderCode(paddingType);
    const strideCode = getStrideCode(stride, 'max_filtered');

    return `import cv2
import numpy as np

# قراءة الصورة
img = cv2.imread('image.jpg')

# تطبيق فلتر الحد الأقصى (Max Filter)
# مكافئ لعملية Dilate في المورفولوجيا
# حجم النافذة: ${size}×${size}
kernel = np.ones((${size}, ${size}), np.uint8)
border_type = ${borderCode}

max_filtered = cv2.dilate(img, kernel, borderType=border_type)${strideCode}

# عرض النتائج
cv2.imshow('Original', img)
cv2.imshow('Max Filtered', max_filtered)
cv2.waitKey(0)
cv2.destroyAllWindows()

# حفظ الناتج
cv2.imwrite('max_filtered.jpg', max_filtered)`;
  }

  /* ----------------------------------------------------------
   * Public Generate API
   * ---------------------------------------------------------- */

  function generate(type, params = {}) {
    let raw = '';
    const pad = params.paddingType || 'zero';
    const st = params.stride || 1;

    switch (type) {
      case 'mean':
        raw = generateMean(params.rows ?? 3, params.cols ?? 3, pad, st);
        break;
      case 'gaussian':
        raw = generateGaussian(params.rows ?? 3, params.cols ?? 3, params.sigma ?? 1.0, pad, st);
        break;
      case 'median':
        raw = generateMedian(params.size ?? 3, pad, st);
        break;
      case 'min':
        raw = generateMin(params.size ?? 3, pad, st);
        break;
      case 'max':
        raw = generateMax(params.size ?? 3, pad, st);
        break;
      default:
        raw = '# اختر نوع الفلتر من القائمة';
    }
    return { raw, highlighted: CodeGenerator.highlight(raw) };
  }

  // Public API
  return { generate };
})();
