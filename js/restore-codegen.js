/* ============================================================
   Vision Studio — Image Restoration Python Code Generator
   Generates Python (OpenCV/NumPy) code for noise + restoration
   ============================================================ */

const RestoreCodeGenerator = (() => {
  'use strict';

  /* ----------------------------------------------------------
   * Noise Generation Code
   * ---------------------------------------------------------- */

  function generateGaussianNoise(mean = 0, sigma = 25) {
    return `import cv2
import numpy as np

# قراءة الصورة
img = cv2.imread('image.jpg')

# إضافة ضوضاء Gaussian
# المتوسط: ${mean} — الانحراف المعياري: ${sigma}
mean = ${mean}
sigma = ${sigma}

# توليد ضوضاء بنفس أبعاد الصورة
noise = np.random.normal(mean, sigma, img.shape).astype(np.float64)

# إضافة الضوضاء وقطع القيم إلى [0, 255]
noisy = np.clip(img.astype(np.float64) + noise, 0, 255).astype(np.uint8)

cv2.imshow('Gaussian Noise', noisy)
cv2.waitKey(0)
cv2.destroyAllWindows()`;
  }

  function generateSaltPepperNoise(saltProb = 0.02, pepperProb = 0.02) {
    return `import cv2
import numpy as np

# قراءة الصورة
img = cv2.imread('image.jpg')

# إضافة ضوضاء Salt & Pepper
salt_prob = ${saltProb}    # احتمال Salt (أبيض)
pepper_prob = ${pepperProb}  # احتمال Pepper (أسود)

noisy = img.copy()
total_pixels = img.shape[0] * img.shape[1]

# إضافة Salt (بكسلات بيضاء)
num_salt = int(total_pixels * salt_prob)
salt_coords = [np.random.randint(0, i, num_salt) for i in img.shape[:2]]
noisy[salt_coords[0], salt_coords[1]] = 255

# إضافة Pepper (بكسلات سوداء)
num_pepper = int(total_pixels * pepper_prob)
pepper_coords = [np.random.randint(0, i, num_pepper) for i in img.shape[:2]]
noisy[pepper_coords[0], pepper_coords[1]] = 0

cv2.imshow('Salt & Pepper Noise', noisy)
cv2.waitKey(0)
cv2.destroyAllWindows()`;
  }

  function generateUniformNoise(low = -30, high = 30) {
    return `import cv2
import numpy as np

# قراءة الصورة
img = cv2.imread('image.jpg')

# إضافة ضوضاء Uniform
low = ${low}   # الحد الأدنى
high = ${high}  # الحد الأقصى

# توليد ضوضاء منتظمة
noise = np.random.uniform(low, high, img.shape).astype(np.float64)

# إضافة الضوضاء وقطع القيم
noisy = np.clip(img.astype(np.float64) + noise, 0, 255).astype(np.uint8)

cv2.imshow('Uniform Noise', noisy)
cv2.waitKey(0)
cv2.destroyAllWindows()`;
  }

  /* ----------------------------------------------------------
   * Restoration Filters Code
   * ---------------------------------------------------------- */

  function generateArithmeticMean(kSize = 3) {
    return `import cv2
import numpy as np

# قراءة الصورة المشوشة
img = cv2.imread('noisy_image.jpg')

# فلتر المتوسط الحسابي (Arithmetic Mean Filter)
# حجم النافذة: ${kSize}×${kSize}
# f(x,y) = (1/mn) × Σ g(s,t)
kernel_size = (${kSize}, ${kSize})

# الطريقة 1: استخدام cv2.blur() — مكافئ مباشر
result = cv2.blur(img, kernel_size, borderType=cv2.BORDER_REFLECT)

# الطريقة 2: يدوياً باستخدام Kernel
kernel = np.ones(kernel_size, np.float32) / (${kSize} * ${kSize})
result_manual = cv2.filter2D(img, -1, kernel, borderType=cv2.BORDER_REFLECT)

cv2.imshow('Arithmetic Mean Filter', result)
cv2.waitKey(0)
cv2.destroyAllWindows()`;
  }

  function generateGeometricMean(kSize = 3) {
    return `import cv2
import numpy as np

# قراءة الصورة المشوشة
img = cv2.imread('noisy_image.jpg').astype(np.float64)

# فلتر المتوسط الهندسي (Geometric Mean Filter)
# حجم النافذة: ${kSize}×${kSize}
# f(x,y) = (Π g(s,t))^(1/mn)
ksize = ${kSize}
mn = ksize * ksize
pad = ksize // 2

# تطبيق على كل قناة
result = np.zeros_like(img)
padded = cv2.copyMakeBorder(img, pad, pad, pad, pad, cv2.BORDER_REFLECT)

# تجنب log(0) بإضافة قيمة صغيرة
padded = np.maximum(padded, 1e-10)

for c in range(3):
    log_img = np.log(padded[:, :, c])
    # حساب مجموع اللوغاريتمات باستخدام فلتر متوسط
    kernel = np.ones((ksize, ksize), np.float64) / mn
    log_sum = cv2.filter2D(log_img, -1, kernel * mn)
    # استخراج المنطقة الصالحة و حساب الأس
    result[:, :, c] = np.exp(log_sum[pad:-pad, pad:-pad] / mn)

result = np.clip(result, 0, 255).astype(np.uint8)

cv2.imshow('Geometric Mean Filter', result)
cv2.waitKey(0)
cv2.destroyAllWindows()`;
  }

  function generateHarmonicMean(kSize = 3) {
    return `import cv2
import numpy as np

# قراءة الصورة المشوشة
img = cv2.imread('noisy_image.jpg').astype(np.float64)

# فلتر المتوسط التوافقي (Harmonic Mean Filter)
# حجم النافذة: ${kSize}×${kSize}
# f(x,y) = mn / Σ(1/g(s,t))
ksize = ${kSize}
mn = ksize * ksize
pad = ksize // 2

result = np.zeros_like(img)
padded = cv2.copyMakeBorder(img, pad, pad, pad, pad, cv2.BORDER_REFLECT)
padded = np.maximum(padded, 1e-10)  # تجنب القسمة على صفر

for c in range(3):
    reciprocal = 1.0 / padded[:, :, c]
    kernel = np.ones((ksize, ksize), np.float64)
    reciprocal_sum = cv2.filter2D(reciprocal, -1, kernel)
    result[:, :, c] = mn / reciprocal_sum[pad:-pad, pad:-pad]

result = np.clip(result, 0, 255).astype(np.uint8)

cv2.imshow('Harmonic Mean Filter', result)
cv2.waitKey(0)
cv2.destroyAllWindows()`;
  }

  function generateContraHarmonicMean(kSize = 3, Q = 1.5) {
    return `import cv2
import numpy as np

# قراءة الصورة المشوشة
img = cv2.imread('noisy_image.jpg').astype(np.float64)

# فلتر المتوسط التوافقي المعاكس (Contra-Harmonic Mean Filter)
# حجم النافذة: ${kSize}×${kSize} — الترتيب Q: ${Q}
# f(x,y) = Σ g(s,t)^(Q+1) / Σ g(s,t)^Q
# Q > 0 → يزيل ضوضاء Pepper (السوداء)
# Q < 0 → يزيل ضوضاء Salt (البيضاء)
ksize = ${kSize}
Q = ${Q}
pad = ksize // 2

result = np.zeros_like(img)
padded = cv2.copyMakeBorder(img, pad, pad, pad, pad, cv2.BORDER_REFLECT)
padded = np.maximum(padded, 1e-10)

kernel = np.ones((ksize, ksize), np.float64)

for c in range(3):
    numerator = cv2.filter2D(np.power(padded[:, :, c], Q + 1), -1, kernel)
    denominator = cv2.filter2D(np.power(padded[:, :, c], Q), -1, kernel)
    denominator = np.maximum(denominator, 1e-10)
    result[:, :, c] = (numerator / denominator)[pad:-pad, pad:-pad]

result = np.clip(result, 0, 255).astype(np.uint8)

cv2.imshow('Contra-Harmonic Mean Filter (Q=${Q})', result)
cv2.waitKey(0)
cv2.destroyAllWindows()`;
  }

  function generateAlphaTrimmedMean(kSize = 5, d = 4) {
    return `import cv2
import numpy as np
from scipy.ndimage import generic_filter

# قراءة الصورة المشوشة
img = cv2.imread('noisy_image.jpg').astype(np.float64)

# فلتر ألفا المقطوع (Alpha-Trimmed Mean Filter)
# حجم النافذة: ${kSize}×${kSize} — عدد القيم المحذوفة: ${d}
# يحذف d/2 قيمة من كل طرف ثم يأخذ المتوسط
# d = 0 → متوسط حسابي | d = mn-1 → وسيط
ksize = ${kSize}
d = ${d}  # عدد القيم المحذوفة (d/2 من كل طرف)
trim = d // 2

def alpha_trimmed(values):
    """دالة ألفا المقطوع لكل نافذة"""
    sorted_vals = np.sort(values)
    trimmed = sorted_vals[trim:len(sorted_vals) - trim]
    return np.mean(trimmed)

result = np.zeros_like(img)
for c in range(3):
    result[:, :, c] = generic_filter(
        img[:, :, c], alpha_trimmed, size=ksize,
        mode='reflect'
    )

result = np.clip(result, 0, 255).astype(np.uint8)

cv2.imshow('Alpha-Trimmed Mean Filter (d=${d})', result)
cv2.waitKey(0)
cv2.destroyAllWindows()`;
  }

  function generateWiener(kSize = 5, noiseVar = 500) {
    return `import cv2
import numpy as np
from scipy.signal import wiener as scipy_wiener

# قراءة الصورة المشوشة
img = cv2.imread('noisy_image.jpg').astype(np.float64)

# فلتر وينر التكيفي المحلي (Adaptive Local Wiener Filter)
# حجم النافذة: ${kSize}×${kSize} — تباين الضوضاء المقدّر: ${noiseVar}
# f(x,y) = g(x,y) - (σn²/σL²) × (g(x,y) - μL)
# σn² = تباين الضوضاء | σL² = التباين المحلي | μL = المتوسط المحلي
ksize = ${kSize}
noise_var = ${noiseVar}

# الطريقة 1: استخدام scipy.signal.wiener
result_scipy = np.zeros_like(img)
for c in range(3):
    result_scipy[:, :, c] = scipy_wiener(img[:, :, c], mysize=ksize, noise=noise_var)

# الطريقة 2: تطبيق يدوي
pad = ksize // 2
mn = ksize * ksize
padded = cv2.copyMakeBorder(img, pad, pad, pad, pad, cv2.BORDER_REFLECT)
result = np.zeros_like(img)

kernel = np.ones((ksize, ksize), np.float64) / mn

for c in range(3):
    ch = padded[:, :, c]
    # المتوسط المحلي
    local_mean = cv2.filter2D(ch, -1, kernel)[pad:-pad, pad:-pad]
    # التباين المحلي
    local_sq_mean = cv2.filter2D(ch**2, -1, kernel)[pad:-pad, pad:-pad]
    local_var = local_sq_mean - local_mean**2
    local_var = np.maximum(local_var, 0)
    
    # تطبيق فلتر وينر
    ratio = np.where(local_var > noise_var, noise_var / local_var, 1.0)
    result[:, :, c] = img[:, :, c] - ratio * (img[:, :, c] - local_mean)

result = np.clip(result, 0, 255).astype(np.uint8)

cv2.imshow('Wiener Filter', result)
cv2.waitKey(0)
cv2.destroyAllWindows()`;
  }

  /* ----------------------------------------------------------
   * Combined Code (Noise + Filter)
   * ---------------------------------------------------------- */

  function generateFullPipeline(noiseType, noiseParams, filterType, filterParams) {
    let noiseCode = '';
    switch (noiseType) {
      case 'gaussian': noiseCode = generateGaussianNoise(noiseParams.mean, noiseParams.sigma); break;
      case 'salt-pepper': noiseCode = generateSaltPepperNoise(noiseParams.saltProb, noiseParams.pepperProb); break;
      case 'uniform': noiseCode = generateUniformNoise(noiseParams.low, noiseParams.high); break;
    }

    let filterCode = '';
    switch (filterType) {
      case 'arithmetic': filterCode = generateArithmeticMean(filterParams.kSize); break;
      case 'geometric': filterCode = generateGeometricMean(filterParams.kSize); break;
      case 'harmonic': filterCode = generateHarmonicMean(filterParams.kSize); break;
      case 'contraharmonic': filterCode = generateContraHarmonicMean(filterParams.kSize, filterParams.Q); break;
      case 'alpha-trimmed': filterCode = generateAlphaTrimmedMean(filterParams.kSize, filterParams.d); break;
      case 'wiener': filterCode = generateWiener(filterParams.kSize, filterParams.noiseVar); break;
    }

    return filterCode || noiseCode;
  }

  /* ----------------------------------------------------------
   * Public API
   * ---------------------------------------------------------- */

  return {
    generateGaussianNoise,
    generateSaltPepperNoise,
    generateUniformNoise,
    generateArithmeticMean,
    generateGeometricMean,
    generateHarmonicMean,
    generateContraHarmonicMean,
    generateAlphaTrimmedMean,
    generateWiener,
    generateFullPipeline
  };

})();
