/* ============================================================
   Vision Studio — Basics Processing Engine
   Geometric Operations: Scale, Rotate, Translate, Crop
   ============================================================ */

const BasicsProcessing = (() => {
  'use strict';

  /**
   * Scales an image (from origCanvas) by given factors and draws onto procCanvas.
   * Maintains original canvas size or resizes procCanvas based on options.
   * For simplicity in UI, we'll keep procCanvas size fixed to original size,
   * drawing the scaled image from the top-left or centered.
   */
  function scaleImage(origCanvas, procCanvas, scale) {
    const ctx = procCanvas.getContext('2d');
    const w = origCanvas.width;
    const h = origCanvas.height;
    
    procCanvas.width = w;
    procCanvas.height = h;
    
    ctx.clearRect(0, 0, w, h);
    
    // Calculate new dimensions
    const newW = w * scale;
    const newH = h * scale;
    
    // Draw centered or from top-left. Let's center it for better visualization.
    const dx = (w - newW) / 2;
    const dy = (h - newH) / 2;

    // Enable image smoothing for better quality
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    ctx.drawImage(origCanvas, 0, 0, w, h, dx, dy, newW, newH);
  }

  /**
   * Rotates an image by `angle` (in degrees) around `(cx, cy)` (normalized 0-1).
   */
  function rotateImage(origCanvas, procCanvas, angleDeg, cxRatio = 0.5, cyRatio = 0.5) {
    const ctx = procCanvas.getContext('2d');
    const w = origCanvas.width;
    const h = origCanvas.height;
    
    procCanvas.width = w;
    procCanvas.height = h;
    
    ctx.clearRect(0, 0, w, h);
    
    const angleRad = angleDeg * Math.PI / 180;
    
    // Center of rotation in pixels
    const cx = w * cxRatio;
    const cy = h * cyRatio;
    
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angleRad);
    ctx.translate(-cx, -cy);
    
    ctx.drawImage(origCanvas, 0, 0);
    ctx.restore();
  }

  /**
   * Translates (shifts) an image by `tx` and `ty` pixels.
   */
  function translateImage(origCanvas, procCanvas, tx, ty) {
    const ctx = procCanvas.getContext('2d');
    const w = origCanvas.width;
    const h = origCanvas.height;
    
    procCanvas.width = w;
    procCanvas.height = h;
    
    ctx.clearRect(0, 0, w, h);
    
    ctx.save();
    ctx.translate(tx, ty);
    ctx.drawImage(origCanvas, 0, 0);
    ctx.restore();
  }

  /**
   * Crops a region from the image and draws it.
   * `rect` = {x, y, w, h} in normalized coordinates (0.0 to 1.0).
   */
  function cropImage(origCanvas, procCanvas, rect) {
    const ctx = procCanvas.getContext('2d');
    const cw = origCanvas.width;
    const ch = origCanvas.height;
    
    procCanvas.width = cw;
    procCanvas.height = ch;
    
    ctx.clearRect(0, 0, cw, ch);
    
    if (rect && rect.w > 0 && rect.h > 0) {
      const sx = rect.x * cw;
      const sy = rect.y * ch;
      const sw = rect.w * cw;
      const sh = rect.h * ch;
      
      // Draw the cropped region centered in the new canvas
      // or scale it up to fit? We'll draw it centered at original scale.
      const dx = (cw - sw) / 2;
      const dy = (ch - sh) / 2;
      
      ctx.drawImage(origCanvas, sx, sy, sw, sh, dx, dy, sw, sh);
    } else {
      // If no valid rect, just draw original or clear
      ctx.drawImage(origCanvas, 0, 0);
    }
  }

  // Public API
  return {
    scaleImage,
    rotateImage,
    translateImage,
    cropImage
  };
})();
