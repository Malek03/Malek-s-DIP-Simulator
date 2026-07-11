/* ============================================================
   Vision Studio — Python Code Generator
   Generates Python (OpenCV/NumPy) code with syntax highlighting
   ============================================================ */

const CodeGenerator = (() => {
  'use strict';

  /* ----------------------------------------------------------
   * Code Templates — each returns a plain Python string
   * ---------------------------------------------------------- */

  function generateNegative() {
    return `import cv2
import numpy as np

# قراءة الصورة بتدرج الرمادي
img = cv2.imread('image.jpg', cv2.IMREAD_GRAYSCALE)

# تطبيق السالب: s = (L-1) - r
negative = 255 - img

# حفظ الناتج
cv2.imwrite('negative_output.jpg', negative)

# عرض الصور
cv2.imshow('Original', img)
cv2.imshow('Negative', negative)
cv2.waitKey(0)
cv2.destroyAllWindows()`;
  }

  function generateLog(c = null) {
    const cLine = c !== null
      ? `c = ${c.toFixed(2)}`
      : `c = 255 / np.log(1 + 255)  # ≈ 45.99`;
    return `import cv2
import numpy as np

# قراءة الصورة بتدرج الرمادي
img = cv2.imread('image.jpg', cv2.IMREAD_GRAYSCALE)

# التحويل اللوغاريتمي: s = c * log(1 + r)
${cLine}
log_transformed = c * np.log(1 + img.astype(np.float64))
log_transformed = np.clip(log_transformed, 0, 255).astype(np.uint8)

# حفظ الناتج
cv2.imwrite('log_output.jpg', log_transformed)

# عرض الصور
cv2.imshow('Original', img)
cv2.imshow('Log Transformed', log_transformed)
cv2.waitKey(0)
cv2.destroyAllWindows()`;
  }

  function generateGamma(gamma = 1.0, c = 1.0) {
    return `import cv2
import numpy as np

# قراءة الصورة بتدرج الرمادي
img = cv2.imread('image.jpg', cv2.IMREAD_GRAYSCALE)

# تصحيح غاما: s = c * r^γ
gamma = ${gamma.toFixed(2)}
c = ${c.toFixed(2)}
normalized = img / 255.0
gamma_corrected = c * np.power(normalized, gamma) * 255
output = np.clip(gamma_corrected, 0, 255).astype(np.uint8)

# حفظ الناتج
cv2.imwrite('gamma_output.jpg', output)

# عرض الصور
cv2.imshow('Original', img)
cv2.imshow(f'Gamma = {gamma}', output)
cv2.waitKey(0)
cv2.destroyAllWindows()`;
  }

  function generateThreshold(threshold = 128) {
    return `import cv2
import numpy as np

# قراءة الصورة بتدرج الرمادي
img = cv2.imread('image.jpg', cv2.IMREAD_GRAYSCALE)

# تطبيق العتبة: s = 0 if r < T, else 255
threshold_value = ${threshold}
_, binary = cv2.threshold(img, threshold_value, 255, cv2.THRESH_BINARY)

# حفظ الناتج
cv2.imwrite('threshold_output.jpg', binary)

# عرض الصور
cv2.imshow('Original', img)
cv2.imshow(f'Threshold = {threshold_value}', binary)
cv2.waitKey(0)
cv2.destroyAllWindows()`;
  }

  function generateContrastStretch(r1 = 70, s1 = 0, r2 = 180, s2 = 255) {
    return `import cv2
import numpy as np

# قراءة الصورة بتدرج الرمادي
img = cv2.imread('image.jpg', cv2.IMREAD_GRAYSCALE)

# تمدد التباين - تحويل خطي متعدد القطع
r1, s1 = ${r1}, ${s1}
r2, s2 = ${r2}, ${s2}

def contrast_stretch(img, r1, s1, r2, s2):
    output = np.zeros_like(img, dtype=np.float64)
    # المقطع الأول: (0,0) إلى (r1,s1)
    mask1 = img < r1
    output[mask1] = (s1 / r1) * img[mask1]
    # المقطع الثاني: (r1,s1) إلى (r2,s2)
    mask2 = (img >= r1) & (img <= r2)
    output[mask2] = s1 + ((s2 - s1) / (r2 - r1)) * (img[mask2] - r1)
    # المقطع الثالث: (r2,s2) إلى (255,255)
    mask3 = img > r2
    output[mask3] = s2 + ((255 - s2) / (255 - r2)) * (img[mask3] - r2)
    return np.clip(output, 0, 255).astype(np.uint8)

stretched = contrast_stretch(img, r1, s1, r2, s2)

# حفظ الناتج
cv2.imwrite('contrast_output.jpg', stretched)

# عرض الصور
cv2.imshow('Original', img)
cv2.imshow('Contrast Stretched', stretched)
cv2.waitKey(0)
cv2.destroyAllWindows()`;
  }

  function generateBitPlane(planes = [7]) {
    const planesList = `[${planes.join(', ')}]`;
    return `import cv2
import numpy as np

# قراءة الصورة بتدرج الرمادي
img = cv2.imread('image.jpg', cv2.IMREAD_GRAYSCALE)

# تقطيع المستوى البتّي
selected_planes = ${planesList}

# استخراج وتجميع المستويات المختارة
result = np.zeros_like(img)
for bit in selected_planes:
    plane = (img >> bit) & 1
    result = np.bitwise_or(result, plane)

# تحويل إلى صورة ثنائية
result = result * 255

# حفظ الناتج
cv2.imwrite('bitplane_output.jpg', result)

# عرض كل مستوى بتّي على حدة
fig_rows = 2
fig_cols = 4
import matplotlib.pyplot as plt
fig, axes = plt.subplots(fig_rows, fig_cols, figsize=(12, 6))
for i in range(8):
    ax = axes[i // fig_cols, i % fig_cols]
    plane = ((img >> i) & 1) * 255
    ax.imshow(plane, cmap='gray')
    ax.set_title(f'Bit Plane {i}')
    ax.axis('off')
plt.tight_layout()
plt.show()`;
  }

  /* ----------------------------------------------------------
   * Syntax Highlighter — regex-based HTML coloring
   * ---------------------------------------------------------- */

  function highlight(code) {
    // Escape HTML first
    let html = code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Order matters: comments first, then strings, then keywords, etc.

    // Comments (# ...)
    html = html.replace(/(#[^\n]*)/g, '<span class="cmt">$1</span>');

    // Strings (single and double quotes, including f-strings)
    html = html.replace(/(f?'[^']*'|f?"[^"]*")/g, '<span class="str">$1</span>');

    // Keywords
    const keywords = ['import', 'from', 'def', 'return', 'for', 'in', 'if', 'else', 'elif',
                       'True', 'False', 'None', 'and', 'or', 'not', 'as', 'class', 'with'];
    const kwRegex = new RegExp('\\b(' + keywords.join('|') + ')\\b', 'g');
    html = html.replace(kwRegex, '<span class="kw">$1</span>');

    // Library names
    const libs = ['cv2', 'np', 'numpy', 'matplotlib', 'plt'];
    const libRegex = new RegExp('\\b(' + libs.join('|') + ')\\b', 'g');
    html = html.replace(libRegex, '<span class="lib">$1</span>');

    // Built-in functions
    const fns = ['print', 'range', 'len', 'int', 'float', 'str', 'type', 'round',
                 'imread', 'imwrite', 'imshow', 'waitKey', 'destroyAllWindows',
                 'threshold', 'zeros_like', 'clip', 'astype', 'power', 'log',
                 'bitwise_or', 'subplots', 'show', 'tight_layout', 'set_title',
                 'axis', 'zeros', 'ones', 'array', 'contrast_stretch'];
    const fnRegex = new RegExp('\\b(' + fns.join('|') + ')\\b', 'g');
    html = html.replace(fnRegex, '<span class="fn">$1</span>');

    // Numbers (integers and floats)
    html = html.replace(/\b(\d+\.?\d*)\b/g, '<span class="num">$1</span>');

    // Special variables
    const specialVars = ['img', 'output', 'result', 'negative', 'binary',
                         'gamma_corrected', 'log_transformed', 'stretched',
                         'normalized', 'plane', 'fig', 'axes', 'ax', 'mask1', 'mask2', 'mask3'];
    const varRegex = new RegExp('\\b(' + specialVars.join('|') + ')\\b', 'g');
    html = html.replace(varRegex, '<span class="var">$1</span>');

    return html;
  }

  /**
   * Generate code for a given transformation type and parameters.
   * @param {string} type - 'negative'|'log'|'gamma'|'threshold'|'contrast'|'bitplane'
   * @param {object} params - transformation parameters
   * @returns {{ raw: string, highlighted: string }}
   */
  function generate(type, params = {}) {
    let raw = '';
    switch (type) {
      case 'negative':
        raw = generateNegative();
        break;
      case 'log':
        raw = generateLog(params.c ?? null);
        break;
      case 'gamma':
        raw = generateGamma(params.gamma ?? 1.0, params.c ?? 1.0);
        break;
      case 'threshold':
        raw = generateThreshold(params.threshold ?? 128);
        break;
      case 'contrast':
        raw = generateContrastStretch(
          params.r1 ?? 70, params.s1 ?? 0,
          params.r2 ?? 180, params.s2 ?? 255
        );
        break;
      case 'bitplane':
        raw = generateBitPlane(params.planes ?? [7]);
        break;
      default:
        raw = '# اختر نوع المعالجة من القائمة';
    }
    return { raw, highlighted: highlight(raw) };
  }

  // Public API
  return { generate, highlight };
})();
