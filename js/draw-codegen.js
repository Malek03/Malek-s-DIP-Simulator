/* ============================================================
   Vision Studio — Drawing Code Generator
   Generates Python OpenCV code based on drawn shapes
   ============================================================ */

const DrawCodegen = (() => {
  'use strict';

  function generateCode(shapes, imageMode) {
    let code = `import cv2\nimport numpy as np\n\n`;

    if (imageMode === 'upload') {
      code += `# تحميل الصورة\n`;
      code += `image = cv2.imread('image.jpg')\n\n`;
    } else if (imageMode === 'white') {
      code += `# إنشاء لوحة بيضاء (500x500)\n`;
      code += `image = np.ones((500, 500, 3), dtype=np.uint8) * 255\n\n`;
    } else if (imageMode === 'black') {
      code += `# إنشاء لوحة سوداء (500x500)\n`;
      code += `image = np.zeros((500, 500, 3), dtype=np.uint8)\n\n`;
    }

    if (shapes.length > 0) {
      code += `# عمليات الرسم\n`;
      
      shapes.forEach((shape, index) => {
        const color = DrawProcessing.hexToBGRString(shape.color || '#000000');
        const thick = shape.thickness || 2;
        
        switch (shape.type) {
          case 'rectangle':
            let x1 = Math.round(shape.x);
            let y1 = Math.round(shape.y);
            let x2 = Math.round(shape.x + shape.width);
            let y2 = Math.round(shape.y + shape.height);
            code += `cv2.rectangle(image, (${x1}, ${y1}), (${x2}, ${y2}), ${color}, ${thick})\n`;
            break;
          case 'circle':
            let cx = Math.round(shape.cx);
            let cy = Math.round(shape.cy);
            let r = Math.round(shape.radius);
            code += `cv2.circle(image, (${cx}, ${cy}), ${r}, ${color}, ${thick})\n`;
            break;
          case 'line':
            let lx1 = Math.round(shape.x1);
            let ly1 = Math.round(shape.y1);
            let lx2 = Math.round(shape.x2);
            let ly2 = Math.round(shape.y2);
            code += `cv2.line(image, (${lx1}, ${ly1}), (${lx2}, ${ly2}), ${color}, ${thick})\n`;
            break;
          case 'polygon':
            if (shape.points && shape.points.length > 0) {
              const ptsStr = shape.points.map(p => `[${Math.round(p.x)}, ${Math.round(p.y)}]`).join(', ');
              code += `pts_${index} = np.array([${ptsStr}], np.int32)\n`;
              code += `pts_${index} = pts_${index}.reshape((-1, 1, 2))\n`;
              const isClosed = shape.isClosed ? 'True' : 'False';
              code += `cv2.polylines(image, [pts_${index}], ${isClosed}, ${color}, ${thick})\n`;
            }
            break;
          case 'text':
            let tx = Math.round(shape.x);
            let ty = Math.round(shape.y);
            let font = shape.font || 'cv2.FONT_HERSHEY_SIMPLEX';
            code += `cv2.putText(image, "${shape.text}", (${tx}, ${ty}), ${font}, 1.0, ${color}, ${thick}, cv2.LINE_AA)\n`;
            break;
        }
      });
      code += `\n`;
    }

    code += `# عرض النتيجة\n`;
    code += `cv2.imshow('Drawing Result', image)\n`;
    code += `cv2.waitKey(0)\n`;
    code += `cv2.destroyAllWindows()\n`;

    return code;
  }

  return {
    generateCode
  };
})();
