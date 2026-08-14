/* ============================================================
   Vision Studio — Sharpening Filters Python Code Generator
   Generates Python (OpenCV/NumPy) code for Laplacian, Sobel,
   Prewitt, Unsharp Masking, High-Boost, Canny
   ============================================================ */

const SharpenCodeGenerator = (() => {
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

  function generateLaplacian(type = '4', paddingType = 'zero', stride = 1) {
    const borderCode = getBorderCode(paddingType);
    const strideCode = getStrideCode(stride, 'sharpened');
    const ddepth = 'cv2.CV_64F';
    const kernelComment = type === '8'
      ? '# Kernel 8-connected:\n# [[-1, -1, -1],\n#  [-1,  8, -1],\n#  [-1, -1, -1]]'
      : '# Kernel 4-connected:\n# [[ 0, -1,  0],\n#  [-1,  4, -1],\n#  [ 0, -1,  0]]';

    return `import cv2
import numpy as np

# قراءة الصورة
img = cv2.imread('image.jpg')

# تطبيق فلتر لابلاسيان (Laplacian Filter)
# النوع: ${type === '8' ? '8-connected' : '4-connected'}
${kernelComment}
border_type = ${borderCode}

# حساب مشتقة لابلاس
laplacian = cv2.Laplacian(img, ${ddepth}, borderType=border_type)

# إضافة الحواف للصورة الأصلية لزيادة الحدة
# sharpened = original + laplacian
sharpened = cv2.convertScaleAbs(img.astype(np.float64) + laplacian)${strideCode}

# عرض النتائج
cv2.imshow('Original', img)
cv2.imshow('Laplacian Edges', cv2.convertScaleAbs(laplacian))
cv2.imshow('Sharpened', sharpened)
cv2.waitKey(0)
cv2.destroyAllWindows()

# حفظ الناتج
cv2.imwrite('sharpened_laplacian.jpg', sharpened)`;
  }

  function generateSobel(size = 3, axis = 'mag', paddingType = 'zero', stride = 1) {
    const borderCode = getBorderCode(paddingType);
    const strideCode = getStrideCode(stride, 'edges');
    
    let pythonCode = `import cv2\nimport numpy as np\n\n# قراءة الصورة\nimg = cv2.imread('image.jpg')\n\n# تطبيق فلتر سوبل (Sobel Filter)\n# حجم الـ Kernel: ${size}×${size}\n# الاتجاه: ${axis}\nborder_type = ${borderCode}\n\n`;

    if (axis === 'mag') {
      pythonCode += `# حساب المشتقة الأفقية (Gx) والعمودية (Gy)
sobel_x = cv2.Sobel(img, cv2.CV_64F, 1, 0, ksize=${size}, borderType=border_type)
sobel_y = cv2.Sobel(img, cv2.CV_64F, 0, 1, ksize=${size}, borderType=border_type)

# حساب شدة الحواف: G = |Gx| + |Gy|
edges = cv2.convertScaleAbs(np.abs(sobel_x) + np.abs(sobel_y))${strideCode}

# عرض النتائج
cv2.imshow('Original', img)
cv2.imshow('Sobel X', cv2.convertScaleAbs(sobel_x))
cv2.imshow('Sobel Y', cv2.convertScaleAbs(sobel_y))
cv2.imshow('Sobel Edges (Magnitude)', edges)`;
    } else if (axis === 'x') {
      pythonCode += `# حساب المشتقة الأفقية (Gx)
sobel_x = cv2.Sobel(img, cv2.CV_64F, 1, 0, ksize=${size}, borderType=border_type)
edges = cv2.convertScaleAbs(np.abs(sobel_x))${strideCode}

# عرض النتائج
cv2.imshow('Original', img)
cv2.imshow('Sobel X Edges', edges)`;
    } else if (axis === 'y') {
      pythonCode += `# حساب المشتقة العمودية (Gy)
sobel_y = cv2.Sobel(img, cv2.CV_64F, 0, 1, ksize=${size}, borderType=border_type)
edges = cv2.convertScaleAbs(np.abs(sobel_y))${strideCode}

# عرض النتائج
cv2.imshow('Original', img)
cv2.imshow('Sobel Y Edges', edges)`;
    } else if (axis === 'diag1') {
      let kArr = size === 3 ? "[[0, 1, 2], [-1, 0, 1], [-2, -1, 0]]" : "[[0, 1, 2, 3, 4], [-1, 0, 1, 2, 3], [-2, -1, 0, 1, 2], [-3, -2, -1, 0, 1], [-4, -3, -2, -1, 0]]";
      pythonCode += `# القطر الرئيسي لا يدعمه cv2.Sobel مباشرة، نستخدم filter2D
kernel_diag1 = np.array(${kArr}, dtype=np.float64)

sobel_diag1 = cv2.filter2D(img, cv2.CV_64F, kernel_diag1, borderType=border_type)
edges = cv2.convertScaleAbs(np.abs(sobel_diag1))${strideCode}

# عرض النتائج
cv2.imshow('Original', img)
cv2.imshow('Sobel Main Diagonal Edges', edges)`;
    } else if (axis === 'diag2') {
      let kArr = size === 3 ? "[[-2, -1, 0], [-1, 0, 1], [0, 1, 2]]" : "[[-4, -3, -2, -1, 0], [-3, -2, -1, 0, 1], [-2, -1, 0, 1, 2], [-1, 0, 1, 2, 3], [0, 1, 2, 3, 4]]";
      pythonCode += `# القطر الثانوي لا يدعمه cv2.Sobel مباشرة، نستخدم filter2D
kernel_diag2 = np.array(${kArr}, dtype=np.float64)

sobel_diag2 = cv2.filter2D(img, cv2.CV_64F, kernel_diag2, borderType=border_type)
edges = cv2.convertScaleAbs(np.abs(sobel_diag2))${strideCode}

# عرض النتائج
cv2.imshow('Original', img)
cv2.imshow('Sobel Secondary Diagonal Edges', edges)`;
    }

    pythonCode += `\ncv2.waitKey(0)\ncv2.destroyAllWindows()\n\n# حفظ الناتج\ncv2.imwrite('sobel_edges.jpg', edges)`;
    return pythonCode;
  }

  function generatePrewitt(paddingType = 'zero', stride = 1) {
    const borderCode = getBorderCode(paddingType);
    const strideCode = getStrideCode(stride, 'edges');

    return `import cv2
import numpy as np

# قراءة الصورة
img = cv2.imread('image.jpg', cv2.IMREAD_GRAYSCALE)

# تطبيق فلتر بريويت (Prewitt Filter)
# ملاحظة: لا يوجد دالة مباشرة في OpenCV — نستخدم filter2D
border_type = ${borderCode}

# بناء الـ Kernels يدوياً
prewitt_x = np.array([[-1, 0, 1],
                       [-1, 0, 1],
                       [-1, 0, 1]], dtype=np.float64)

prewitt_y = np.array([[-1, -1, -1],
                       [ 0,  0,  0],
                       [ 1,  1,  1]], dtype=np.float64)

# تطبيق المشتقات
gx = cv2.filter2D(img, cv2.CV_64F, prewitt_x, borderType=border_type)
gy = cv2.filter2D(img, cv2.CV_64F, prewitt_y, borderType=border_type)

# حساب شدة الحواف: G = |Gx| + |Gy|
edges = cv2.convertScaleAbs(np.abs(gx) + np.abs(gy))${strideCode}

# عرض النتائج
cv2.imshow('Original', img)
cv2.imshow('Prewitt X', cv2.convertScaleAbs(gx))
cv2.imshow('Prewitt Y', cv2.convertScaleAbs(gy))
cv2.imshow('Prewitt Edges', edges)
cv2.waitKey(0)
cv2.destroyAllWindows()

# حفظ الناتج
cv2.imwrite('prewitt_edges.jpg', edges)`;
  }

  function generateUnsharpMask(kSize = 3, sigma = 1.0, k = 1.0, paddingType = 'zero', stride = 1) {
    const borderCode = getBorderCode(paddingType);
    const strideCode = getStrideCode(stride, 'sharpened');

    return `import cv2
import numpy as np

# قراءة الصورة
img = cv2.imread('image.jpg')

# تطبيق Unsharp Masking (قناع عدم الوضوح)
# حجم Gaussian: ${kSize}×${kSize}, σ = ${sigma.toFixed(2)}, k = ${k.toFixed(2)}
border_type = ${borderCode}

# الخطوة 1: تنعيم الصورة باستخدام Gaussian
blurred = cv2.GaussianBlur(img, (${kSize}, ${kSize}), sigmaX=${sigma.toFixed(2)}, borderType=border_type)

# الخطوة 2: حساب القناع (الفرق بين الأصلية والمنعّمة)
# mask = original - blurred
mask = img.astype(np.float64) - blurred.astype(np.float64)

# الخطوة 3: إضافة القناع مع معامل الحدة k
# sharpened = original + k × mask
k = ${k.toFixed(2)}
sharpened = np.clip(img.astype(np.float64) + k * mask, 0, 255).astype(np.uint8)${strideCode}

# عرض النتائج
cv2.imshow('Original', img)
cv2.imshow('Blurred', blurred)
cv2.imshow('Mask', cv2.convertScaleAbs(mask))
cv2.imshow('Sharpened', sharpened)
cv2.waitKey(0)
cv2.destroyAllWindows()

# حفظ الناتج
cv2.imwrite('unsharp_mask.jpg', sharpened)`;
  }

  function generateHighBoost(kSize = 3, sigma = 1.0, A = 1.5, paddingType = 'zero', stride = 1) {
    const borderCode = getBorderCode(paddingType);
    const strideCode = getStrideCode(stride, 'high_boost');

    return `import cv2
import numpy as np

# قراءة الصورة
img = cv2.imread('image.jpg')

# تطبيق High-Boost Filtering (فلترة التعزيز العالي)
# حجم Gaussian: ${kSize}×${kSize}, σ = ${sigma.toFixed(2)}, A = ${A.toFixed(2)}
border_type = ${borderCode}

# الخطوة 1: تنعيم الصورة
blurred = cv2.GaussianBlur(img, (${kSize}, ${kSize}), sigmaX=${sigma.toFixed(2)}, borderType=border_type)

# الخطوة 2: High-Boost = A × original - blurred
# عندما A=1 → Unsharp Mask، عندما A>1 → تعزيز عالي
A = ${A.toFixed(2)}
high_boost = np.clip(A * img.astype(np.float64) - blurred.astype(np.float64), 0, 255).astype(np.uint8)${strideCode}

# عرض النتائج
cv2.imshow('Original', img)
cv2.imshow('Blurred', blurred)
cv2.imshow('High-Boost', high_boost)
cv2.waitKey(0)
cv2.destroyAllWindows()

# حفظ الناتج
cv2.imwrite('high_boost.jpg', high_boost)`;
  }

  function generateCanny(lowThresh = 50, highThresh = 150, sigma = 1.0) {
    return `import cv2
import numpy as np

# قراءة الصورة
img = cv2.imread('image.jpg', cv2.IMREAD_GRAYSCALE)

# تطبيق خوارزمية Canny Edge Detection
low_threshold = ${lowThresh}
high_threshold = ${highThresh}

# 1. التنعيم لإزالة الضوضاء أولاً (لأن Canny حساس جداً للضوضاء)
# Canny في OpenCV يستخدم Sobel 3x3 داخلياً بدون تنعيم قوي مسبق، لذا ننعمه بـ Gaussian
sigma = ${sigma.toFixed(2)}
ksize = max(3, int(np.ceil(sigma * 3)))
ksize = ksize + 1 if ksize % 2 == 0 else ksize
blurred = cv2.GaussianBlur(img, (ksize, ksize), sigmaX=sigma)

# 2. تطبيق Canny (تقوم بالـ Gradient, NMS, Double Threshold, Hysteresis داخلياً)
edges = cv2.Canny(blurred, low_threshold, high_threshold)

# عرض النتائج
cv2.imshow('Original Grayscale', img)
cv2.imshow('Blurred', blurred)
cv2.imshow('Canny Edges', edges)
cv2.waitKey(0)
cv2.destroyAllWindows()

# حفظ الناتج
cv2.imwrite('canny_edges.jpg', edges)`;
  }

  /* ----------------------------------------------------------
   * Public Generate API
   * ---------------------------------------------------------- */

  function generate(type, params = {}) {
    let raw = '';
    const pad = params.paddingType || 'zero';
    const st = params.stride || 1;

    switch (type) {
      case 'laplacian':
        raw = generateLaplacian(params.lapType ?? '4', pad, st);
        break;
      case 'sobel':
        raw = generateSobel(params.size ?? 3, params.axis ?? 'mag', pad, st);
        break;
      case 'prewitt':
        raw = generatePrewitt(pad, st);
        break;
      case 'unsharp':
        raw = generateUnsharpMask(params.kSize ?? 3, params.sigma ?? 1.0, params.k ?? 1.0, pad, st);
        break;
      case 'highboost':
        raw = generateHighBoost(params.kSize ?? 3, params.sigma ?? 1.0, params.A ?? 1.5, pad, st);
        break;
      case 'canny':
        raw = generateCanny(params.lowThresh ?? 50, params.highThresh ?? 150, params.sigma ?? 1.0);
        break;
      default:
        raw = '# اختر نوع الفلتر من القائمة';
    }
    return { raw, highlighted: CodeGenerator.highlight(raw) };
  }

  // Public API
  return { generate };
})();
