/* ============================================================
   Vision Studio — Representation CodeGen
   Generates Python/OpenCV/Matplotlib code for Representation concepts
   ============================================================ */

const RepCodeGen = (() => {
  'use strict';

  function getBaseCode(title) {
    let code = `import numpy as np\n`;
    code += `import cv2\n`;
    code += `import matplotlib.pyplot as plt\n\n`;
    code += `# ${title}\n`;
    code += `# ==========================================\n\n`;
    code += `# 1. قراءة الصورة\n`;
    code += `img = cv2.imread('image.jpg')\n`;
    code += `img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)\n`;
    code += `h, w = img.shape[:2]\n\n`;
    return code;
  }

  function getPlotCode(showResult = true) {
    let code = `\n# 3. عرض النتائج\n`;
    if (showResult) {
      code += `fig, axes = plt.subplots(1, 2, figsize=(10, 5))\n`;
      code += `axes[0].imshow(img)\n`;
      code += `axes[0].set_title('Original Image')\n`;
      code += `axes[0].axis('off')\n\n`;
      code += `axes[1].imshow(result)\n`;
      code += `axes[1].set_title('Processed Image')\n`;
      code += `axes[1].axis('off')\n\n`;
      code += `plt.tight_layout()\n`;
      code += `plt.show()`;
    } else {
      code += `plt.show()`;
    }
    return code;
  }

  /* ----------------------------------------------------------
   * Code Generators
   * ---------------------------------------------------------- */

  function generateRGB() {
    let code = getBaseCode('RGB Channel Decomposition (تفكيك قنوات RGB)');
    code += `# 2. فصل القنوات وتلوينها\n`;
    code += `R, G, B = cv2.split(img)\n\n`;
    code += `zeros = np.zeros_like(R)\n`;
    code += `img_R = cv2.merge([R, zeros, zeros])\n`;
    code += `img_G = cv2.merge([zeros, G, zeros])\n`;
    code += `img_B = cv2.merge([zeros, zeros, B])\n\n`;
    code += `# عرض القنوات\n`;
    code += `fig, axes = plt.subplots(1, 4, figsize=(16, 4))\n`;
    code += `axes[0].imshow(img); axes[0].set_title('Original')\n`;
    code += `axes[1].imshow(img_R); axes[1].set_title('Red Channel')\n`;
    code += `axes[2].imshow(img_G); axes[2].set_title('Green Channel')\n`;
    code += `axes[3].imshow(img_B); axes[3].set_title('Blue Channel')\n`;
    for(let i=0; i<4; i++) code += `axes[${i}].axis('off')\n`;
    code += getPlotCode(false);
    return code;
  }

  function generateSampling(rows, cols) {
    let code = getBaseCode('Sampling (أخذ العينات)');
    code += `# 2. تقليل الدقة المكانية (أخذ العينات)\n`;
    code += `# يتم تصغير الصورة أولاً، ثم إعادة تكبيرها لتوضيح تأثير البكسلة\n`;
    code += `from PIL import Image\n`;
    code += `img_pil = Image.fromarray(img)\n\n`;
    code += `img_small = img_pil.resize((${cols}, ${rows}), resample=Image.NEAREST)\n`;
    code += `result_pil = img_small.resize((w, h), resample=Image.NEAREST)\n`;
    code += `result = np.array(result_pil)\n`;
    code += getPlotCode(true);
    return code;
  }

  function generateQuantization(levels) {
    let code = getBaseCode('Quantization (التكميم)');
    code += `from mpl_toolkits.mplot3d import Axes3D\n\n`;
    code += `# 2. تقليل عدد الألوان (التكميم)\n`;
    code += `levels = ${levels}\n`;
    code += `step = 255.0 / (levels - 1)\n`;
    code += `result = np.round(img / step) * step\n`;
    code += `result = result.astype(np.uint8)\n\n`;
    
    code += `# رسم بياني ثلاثي الأبعاد 3D Bar Chart باستخدام Matplotlib\n`;
    code += `fig = plt.figure(figsize=(10, 5))\n\n`;
    code += `# عرض الصورة المكممة\n`;
    code += `ax1 = fig.add_subplot(121)\n`;
    code += `ax1.imshow(result)\n`;
    code += `ax1.set_title(f'Quantized ({levels} levels)')\n`;
    code += `ax1.axis('off')\n\n`;
    
    code += `# عرض المدرج التكراري ثلاثي الأبعاد\n`;
    code += `ax2 = fig.add_subplot(122, projection='3d')\n`;
    code += `hist, _ = np.histogramdd(result.reshape(-1, 3), bins=levels, range=((0, 256), (0, 256), (0, 256)))\n`;
    code += `xpos, ypos, zpos = np.nonzero(hist)\n`;
    code += `xpos, ypos, zpos = xpos*step, ypos*step, zpos*step\n`;
    code += `dz = hist[hist > 0]\n`;
    code += `ax2.bar3d(xpos, ypos, np.zeros_like(dz), step*0.8, step*0.8, dz, color='b', alpha=0.5)\n`;
    code += `ax2.set_title('3D Color Histogram')\n`;
    code += `ax2.set_xlabel('Red'); ax2.set_ylabel('Green'); ax2.set_zlabel('Count')\n`;
    code += getPlotCode(false);
    return code;
  }

  function generateColorMix(rect, colorHex) {
    // rect has {x, y, w, h} normalized
    let code = getBaseCode('Color Mixing (مزج الألوان)');
    
    // convert hex to RGB
    const hex = colorHex.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    code += `# 2. تلوين المنطقة المحددة\n`;
    code += `start_x = int(w * ${rect.x.toFixed(2)})\n`;
    code += `start_y = int(h * ${rect.y.toFixed(2)})\n`;
    code += `end_x = int(w * ${(rect.x + rect.w).toFixed(2)})\n`;
    code += `end_y = int(h * ${(rect.y + rect.h).toFixed(2)})\n\n`;
    code += `result = img.copy()\n`;
    code += `color = np.array([${r}, ${g}, ${b}], dtype=np.uint8)\n`;
    code += `# المزج بنسبة شفافية 50%\n`;
    code += `roi = result[start_y:end_y, start_x:end_x]\n`;
    code += `color_layer = np.full_like(roi, color)\n`;
    code += `result[start_y:end_y, start_x:end_x] = cv2.addWeighted(roi, 0.5, color_layer, 0.5, 0)\n`;
    code += getPlotCode();
    return code;
  }

  // Public API
  return {
    generateRGB,
    generateSampling,
    generateQuantization,
    generateColorMix
  };
})();
