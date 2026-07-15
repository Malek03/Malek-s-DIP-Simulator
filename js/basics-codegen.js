/* ============================================================
   Vision Studio — Basics CodeGen
   Generates Python/OpenCV code for geometry concepts
   ============================================================ */

const BasicsCodeGen = (() => {
  'use strict';

  function getBaseCode(title, cv2Import = true) {
    let code = `import numpy as np\n`;
    if (cv2Import) code += `import cv2\n`;
    code += `import matplotlib.pyplot as plt\n\n`;
    code += `# ${title}\n`;
    code += `# ==========================================\n\n`;
    code += `# 1. قراءة الصورة\n`;
    code += `img = cv2.imread('image.jpg')\n`;
    code += `img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)\n`;
    code += `h, w = img.shape[:2]\n\n`;
    return code;
  }

  function getPlotCode() {
    return `
# 3. عرض النتائج
fig, axes = plt.subplots(1, 2, figsize=(10, 5))
axes[0].imshow(img)
axes[0].set_title('Original Image')
axes[0].axis('off')

axes[1].imshow(result)
axes[1].set_title('Processed Image')
axes[1].axis('off')

plt.tight_layout()
plt.show()`;
  }

  /* ----------------------------------------------------------
   * Code Generators
   * ---------------------------------------------------------- */

  function generateScale(scale) {
    let code = getBaseCode('Scale (تكبير/تصغير)');
    code += `# 2. تطبيق التكبير/التصغير بمعامل ${scale}\n`;
    code += `result = cv2.resize(img, None, fx=${scale}, fy=${scale}, interpolation=cv2.INTER_LINEAR)\n`;
    code += getPlotCode();
    return code;
  }

  function generateRotate(angle) {
    let code = getBaseCode('Rotate (التدوير)');
    code += `# 2. تدوير الصورة بزاوية ${angle}° حول المركز\n`;
    code += `center = (w // 2, h // 2)\n`;
    code += `M = cv2.getRotationMatrix2D(center, angle=${angle}, scale=1.0)\n`;
    code += `result = cv2.warpAffine(img, M, (w, h))\n`;
    code += getPlotCode();
    return code;
  }

  function generateTranslate(tx, ty) {
    let code = getBaseCode('Translate (الإزاحة)');
    code += `# 2. إزاحة الصورة بمقدار tx=${tx}, ty=${ty}\n`;
    code += `M = np.float32([[1, 0, ${tx}], [0, 1, ${ty}]])\n`;
    code += `result = cv2.warpAffine(img, M, (w, h))\n`;
    code += getPlotCode();
    return code;
  }

  function generateCrop(rect) {
    // rect has {x, y, w, h} normalized
    let code = getBaseCode('Crop (القص)');
    code += `# 2. قص الصورة حسب الإحداثيات\n`;
    code += `start_x = int(w * ${rect.x.toFixed(2)})\n`;
    code += `start_y = int(h * ${rect.y.toFixed(2)})\n`;
    code += `end_x = int(w * ${(rect.x + rect.w).toFixed(2)})\n`;
    code += `end_y = int(h * ${(rect.y + rect.h).toFixed(2)})\n\n`;
    code += `result = img[start_y:end_y, start_x:end_x]\n`;
    code += getPlotCode();
    return code;
  }

  // Public API
  return {
    generateScale,
    generateRotate,
    generateTranslate,
    generateCrop
  };
})();
