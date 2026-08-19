/* ============================================================
   Vision Studio — Morphological Processing Python Code Generator
   Generates Python (OpenCV/NumPy) code for Erode, Dilate, Open, Close, TopHat, BlackHat
   ============================================================ */

const MorphCodeGenerator = (() => {
  'use strict';

  /* ----------------------------------------------------------
   * Helper Functions
   * ---------------------------------------------------------- */

  function getShapeCode(shape) {
    switch (shape) {
      case 'rect': return 'cv2.MORPH_RECT';
      case 'cross': return 'cv2.MORPH_CROSS';
      case 'ellipse': return 'cv2.MORPH_ELLIPSE';
      default: return 'cv2.MORPH_RECT';
    }
  }

  function getShapeName(shape) {
    switch (shape) {
      case 'rect': return 'مربع (Rectangle)';
      case 'cross': return 'صليب (Cross)';
      case 'ellipse': return 'بيضاوي (Ellipse)';
      default: return 'مربع (Rectangle)';
    }
  }

  /* ----------------------------------------------------------
   * Code Templates
   * ---------------------------------------------------------- */

  function generateErode(size = 3, shape = 'rect', iterations = 1) {
    const shapeCode = getShapeCode(shape);
    const shapeName = getShapeName(shape);

    return `import cv2
import numpy as np

# قراءة الصورة
img = cv2.imread('image.jpg')

# تعريف العنصر البنيوي (Structuring Element)
# الشكل: ${shapeName}، الحجم: ${size}×${size}
kernel = cv2.getStructuringElement(${shapeCode}, (${size}, ${size}))

# تطبيق التآكل (Erosion)
# التآكل يُصغّر المناطق البيضاء (الأمامية) ويُوسّع المناطق السوداء (الخلفية)
# عدد التكرارات: ${iterations}
eroded = cv2.erode(img, kernel, iterations=${iterations})

# عرض النتائج
cv2.imshow('Original', img)
cv2.imshow('Eroded', eroded)
cv2.waitKey(0)
cv2.destroyAllWindows()

# حفظ الناتج
cv2.imwrite('eroded.jpg', eroded)`;
  }

  function generateDilate(size = 3, shape = 'rect', iterations = 1) {
    const shapeCode = getShapeCode(shape);
    const shapeName = getShapeName(shape);

    return `import cv2
import numpy as np

# قراءة الصورة
img = cv2.imread('image.jpg')

# تعريف العنصر البنيوي (Structuring Element)
# الشكل: ${shapeName}، الحجم: ${size}×${size}
kernel = cv2.getStructuringElement(${shapeCode}, (${size}, ${size}))

# تطبيق التمدد (Dilation)
# التمدد يُوسّع المناطق البيضاء (الأمامية) ويُصغّر المناطق السوداء (الخلفية)
# عدد التكرارات: ${iterations}
dilated = cv2.dilate(img, kernel, iterations=${iterations})

# عرض النتائج
cv2.imshow('Original', img)
cv2.imshow('Dilated', dilated)
cv2.waitKey(0)
cv2.destroyAllWindows()

# حفظ الناتج
cv2.imwrite('dilated.jpg', dilated)`;
  }

  function generateOpen(size = 3, shape = 'rect', iterations = 1) {
    const shapeCode = getShapeCode(shape);
    const shapeName = getShapeName(shape);

    return `import cv2
import numpy as np

# قراءة الصورة
img = cv2.imread('image.jpg')

# تعريف العنصر البنيوي (Structuring Element)
# الشكل: ${shapeName}، الحجم: ${size}×${size}
kernel = cv2.getStructuringElement(${shapeCode}, (${size}, ${size}))

# تطبيق الفتح (Opening) = Erode ثم Dilate
# الفتح يُزيل الضوضاء البيضاء الصغيرة (النقاط الساطعة) مع الحفاظ على الأشكال الكبيرة
opened = cv2.morphologyEx(img, cv2.MORPH_OPEN, kernel, iterations=${iterations})

# مكافئ يدوي:
# opened_manual = cv2.dilate(cv2.erode(img, kernel), kernel)

# عرض النتائج
cv2.imshow('Original', img)
cv2.imshow('Opened', opened)
cv2.waitKey(0)
cv2.destroyAllWindows()

# حفظ الناتج
cv2.imwrite('opened.jpg', opened)`;
  }

  function generateClose(size = 3, shape = 'rect', iterations = 1) {
    const shapeCode = getShapeCode(shape);
    const shapeName = getShapeName(shape);

    return `import cv2
import numpy as np

# قراءة الصورة
img = cv2.imread('image.jpg')

# تعريف العنصر البنيوي (Structuring Element)
# الشكل: ${shapeName}، الحجم: ${size}×${size}
kernel = cv2.getStructuringElement(${shapeCode}, (${size}, ${size}))

# تطبيق الإغلاق (Closing) = Dilate ثم Erode
# الإغلاق يملأ الثقوب السوداء الصغيرة داخل الأشكال البيضاء
closed = cv2.morphologyEx(img, cv2.MORPH_CLOSE, kernel, iterations=${iterations})

# مكافئ يدوي:
# closed_manual = cv2.erode(cv2.dilate(img, kernel), kernel)

# عرض النتائج
cv2.imshow('Original', img)
cv2.imshow('Closed', closed)
cv2.waitKey(0)
cv2.destroyAllWindows()

# حفظ الناتج
cv2.imwrite('closed.jpg', closed)`;
  }

  function generateTopHat(size = 3, shape = 'rect', iterations = 1) {
    const shapeCode = getShapeCode(shape);
    const shapeName = getShapeName(shape);

    return `import cv2
import numpy as np

# قراءة الصورة
img = cv2.imread('image.jpg')

# تعريف العنصر البنيوي (Structuring Element)
# الشكل: ${shapeName}، الحجم: ${size}×${size}
kernel = cv2.getStructuringElement(${shapeCode}, (${size}, ${size}))

# تطبيق Top Hat = الصورة الأصلية - الفتح (Opening)
# يستخرج التفاصيل الساطعة (الأصغر من SE) من الصورة
tophat = cv2.morphologyEx(img, cv2.MORPH_TOPHAT, kernel)

# مكافئ يدوي:
# opened = cv2.morphologyEx(img, cv2.MORPH_OPEN, kernel)
# tophat_manual = cv2.subtract(img, opened)

# عرض النتائج
cv2.imshow('Original', img)
cv2.imshow('Top Hat', tophat)
cv2.waitKey(0)
cv2.destroyAllWindows()

# حفظ الناتج
cv2.imwrite('tophat.jpg', tophat)`;
  }

  function generateBlackHat(size = 3, shape = 'rect', iterations = 1) {
    const shapeCode = getShapeCode(shape);
    const shapeName = getShapeName(shape);

    return `import cv2
import numpy as np

# قراءة الصورة
img = cv2.imread('image.jpg')

# تعريف العنصر البنيوي (Structuring Element)
# الشكل: ${shapeName}، الحجم: ${size}×${size}
kernel = cv2.getStructuringElement(${shapeCode}, (${size}, ${size}))

# تطبيق Black Hat = الإغلاق (Closing) - الصورة الأصلية
# يستخرج التفاصيل المظلمة (الأصغر من SE) من الصورة
blackhat = cv2.morphologyEx(img, cv2.MORPH_BLACKHAT, kernel)

# مكافئ يدوي:
# closed = cv2.morphologyEx(img, cv2.MORPH_CLOSE, kernel)
# blackhat_manual = cv2.subtract(closed, img)

# عرض النتائج
cv2.imshow('Original', img)
cv2.imshow('Black Hat', blackhat)
cv2.waitKey(0)
cv2.destroyAllWindows()

# حفظ الناتج
cv2.imwrite('blackhat.jpg', blackhat)`;
  }

  /* ----------------------------------------------------------
   * Public Generate API
   * ---------------------------------------------------------- */

  function generate(type, params = {}) {
    let raw = '';
    const size = params.size ?? 3;
    const shape = params.shape || 'rect';
    const iterations = params.iterations ?? 1;

    switch (type) {
      case 'erode':
        raw = generateErode(size, shape, iterations);
        break;
      case 'dilate':
        raw = generateDilate(size, shape, iterations);
        break;
      case 'open':
        raw = generateOpen(size, shape, iterations);
        break;
      case 'close':
        raw = generateClose(size, shape, iterations);
        break;
      case 'tophat':
        raw = generateTopHat(size, shape, iterations);
        break;
      case 'blackhat':
        raw = generateBlackHat(size, shape, iterations);
        break;
      default:
        raw = '# اختر نوع العملية المورفولوجية من القائمة';
    }
    return { raw, highlighted: CodeGenerator.highlight(raw) };
  }

  // Public API
  return { generate };
})();
