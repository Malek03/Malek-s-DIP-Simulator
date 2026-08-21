/* ============================================================
   Vision Studio — Drawing Processing Module
   Contains math helpers and pure drawing functions.
   ============================================================ */

const DrawProcessing = (() => {
  'use strict';

  // Draw functions
  function drawShape(ctx, shape) {
    ctx.beginPath();
    ctx.strokeStyle = shape.color || '#000000';
    ctx.lineWidth = shape.thickness || 2;

    switch (shape.type) {
      case 'rectangle':
        ctx.rect(shape.x, shape.y, shape.width, shape.height);
        ctx.stroke();
        break;
      case 'circle':
        ctx.arc(shape.cx, shape.cy, shape.radius, 0, Math.PI * 2);
        ctx.stroke();
        break;
      case 'line':
        ctx.moveTo(shape.x1, shape.y1);
        ctx.lineTo(shape.x2, shape.y2);
        ctx.stroke();
        break;
      case 'polygon':
        if (shape.points && shape.points.length > 0) {
          ctx.moveTo(shape.points[0].x, shape.points[0].y);
          for (let i = 1; i < shape.points.length; i++) {
            ctx.lineTo(shape.points[i].x, shape.points[i].y);
          }
          if (shape.isClosed) {
            ctx.closePath();
          }
          ctx.stroke();
        }
        break;
      case 'text':
        ctx.font = `${shape.fontSize || 24}px Tajawal, sans-serif`;
        ctx.fillStyle = shape.color || '#000000';
        ctx.fillText(shape.text, shape.x, shape.y);
        break;
    }
  }

  // Hit detection functions
  function isPointInShape(pX, pY, shape) {
    const tolerance = Math.max(5, (shape.thickness || 2) + 2);

    switch (shape.type) {
      case 'rectangle': {
        const x1 = Math.min(shape.x, shape.x + shape.width);
        const x2 = Math.max(shape.x, shape.x + shape.width);
        const y1 = Math.min(shape.y, shape.y + shape.height);
        const y2 = Math.max(shape.y, shape.y + shape.height);
        return pX >= x1 - tolerance && pX <= x2 + tolerance &&
               pY >= y1 - tolerance && pY <= y2 + tolerance;
      }
      case 'circle': {
        const dx = pX - shape.cx;
        const dy = pY - shape.cy;
        const dist = Math.sqrt(dx*dx + dy*dy);
        return dist <= shape.radius + tolerance;
      }
      case 'line': {
        const d1 = dist(pX, pY, shape.x1, shape.y1);
        const d2 = dist(pX, pY, shape.x2, shape.y2);
        const lineLen = dist(shape.x1, shape.y1, shape.x2, shape.y2);
        return (d1 + d2) >= lineLen - tolerance && (d1 + d2) <= lineLen + tolerance;
      }
      case 'polygon': {
        if (!shape.points || shape.points.length === 0) return false;
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        shape.points.forEach(p => {
          if (p.x < minX) minX = p.x;
          if (p.x > maxX) maxX = p.x;
          if (p.y < minY) minY = p.y;
          if (p.y > maxY) maxY = p.y;
        });
        return pX >= minX - tolerance && pX <= maxX + tolerance &&
               pY >= minY - tolerance && pY <= maxY + tolerance;
      }
      case 'text': {
        const estHeight = shape.fontSize || 24;
        const estWidth = shape.text.length * (estHeight * 0.5); // rough approx
        return pX >= shape.x && pX <= shape.x + estWidth &&
               pY >= shape.y - estHeight && pY <= shape.y;
      }
    }
    return false;
  }

  function dist(x1, y1, x2, y2) {
    return Math.sqrt((x1-x2)*(x1-x2) + (y1-y2)*(y1-y2));
  }

  // Generate python compatible BGR color tuple string from hex
  function hexToBGRString(hex) {
    let r = parseInt(hex.substring(1, 3), 16) || 0;
    let g = parseInt(hex.substring(3, 5), 16) || 0;
    let b = parseInt(hex.substring(5, 7), 16) || 0;
    return `(${b}, ${g}, ${r})`;
  }

  return {
    drawShape,
    isPointInShape,
    hexToBGRString
  };
})();
