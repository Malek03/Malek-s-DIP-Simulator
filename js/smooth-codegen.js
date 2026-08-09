/* ============================================================
   Vision Studio — Smoothing Filters Python Code Generator
   Generates Python (OpenCV/NumPy) code for Mean, Gaussian, Median
   ============================================================ */

const SmoothCodeGenerator = (() => {
  'use strict';

  /* ----------------------------------------------------------
   * Code Templates
   * ---------------------------------------------------------- */

  function generateMean(rows = 3, cols = 3) {
    return `import cv2
import numpy as np

# قراءة الصورة
img = cv2.imread('image.jpg')

# تطبيق فلتر المتوسط (Mean Filter)
# حجم الـ Kernel: ${rows}×${cols}
kernel_size = (${rows}, ${cols})
mean_filtered = cv2.blur(img, kernel_size)

# طريقة بديلة: بناء الـ Kernel يدوياً
kernel = np.ones((${rows}, ${cols}), np.float32) / (${rows} * ${cols})
mean_manual = cv2.filter2D(img, -1, kernel)

# عرض النتائج
cv2.imshow('Original', img)
cv2.imshow('Mean Filtered', mean_filtered)
cv2.waitKey(0)
cv2.destroyAllWindows()

# حفظ الناتج
cv2.imwrite('mean_filtered.jpg', mean_filtered)`;
  }

  function generateGaussian(rows = 3, cols = 3, sigma = 1.0) {
    return `import cv2
import numpy as np

# قراءة الصورة
img = cv2.imread('image.jpg')

# تطبيق فلتر جاوس (Gaussian Filter)
# حجم الـ Kernel: ${rows}×${cols}, σ = ${sigma.toFixed(2)}
kernel_size = (${rows}, ${cols})
sigma = ${sigma.toFixed(2)}
gaussian_filtered = cv2.GaussianBlur(img, kernel_size, sigma)

# طريقة بديلة: بناء الـ Kernel يدوياً
kernel_1d_x = cv2.getGaussianKernel(${cols}, sigma)
kernel_1d_y = cv2.getGaussianKernel(${rows}, sigma)
kernel_2d = kernel_1d_y @ kernel_1d_x.T
gaussian_manual = cv2.filter2D(img, -1, kernel_2d)

# عرض النتائج
cv2.imshow('Original', img)
cv2.imshow('Gaussian Filtered', gaussian_filtered)
cv2.waitKey(0)
cv2.destroyAllWindows()

# حفظ الناتج
cv2.imwrite('gaussian_filtered.jpg', gaussian_filtered)`;
  }

  function generateMedian(size = 3) {
    // OpenCV requires odd size for median
    const actualSize = size % 2 === 0 ? size + 1 : size;
    return `import cv2
import numpy as np

# قراءة الصورة
img = cv2.imread('image.jpg')

# تطبيق فلتر الوسيط (Median Filter)
# حجم النافذة: ${actualSize}×${actualSize}
median_filtered = cv2.medianBlur(img, ${actualSize})

# ملاحظة: فلتر الوسيط لا يستخدم Kernel رقمي
# بل يأخذ القيمة الوسطى في النافذة المحيطة بكل بكسل
# مفيد جداً لإزالة ضوضاء Salt & Pepper

# عرض النتائج
cv2.imshow('Original', img)
cv2.imshow('Median Filtered', median_filtered)
cv2.waitKey(0)
cv2.destroyAllWindows()

# حفظ الناتج
cv2.imwrite('median_filtered.jpg', median_filtered)`;
  }

  /* ----------------------------------------------------------
   * Public Generate API (matches CodeGenerator pattern)
   * ---------------------------------------------------------- */

  function generate(type, params = {}) {
    let raw = '';
    switch (type) {
      case 'mean':
        raw = generateMean(params.rows ?? 3, params.cols ?? 3);
        break;
      case 'gaussian':
        raw = generateGaussian(params.rows ?? 3, params.cols ?? 3, params.sigma ?? 1.0);
        break;
      case 'median':
        raw = generateMedian(params.size ?? 3);
        break;
      default:
        raw = '# اختر نوع الفلتر من القائمة';
    }
    return { raw, highlighted: CodeGenerator.highlight(raw) };
  }

  // Public API
  return { generate };
})();
