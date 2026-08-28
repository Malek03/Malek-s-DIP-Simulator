/* ============================================================
   Vision Studio — Drawing Playground
   Interactive module for drawing shapes on an image or blank canvas
   ============================================================ */

const DrawPlayground = (() => {
  'use strict';

  // State
  let shapes = [];
  let history = [];
  let selectedShape = null;
  let copiedShape = null;
  let currentTool = 'select'; // 'select', 'rectangle', 'circle', 'line', 'polygon', 'text'
  let isDrawing = false;
  let isDragging = false;
  let currentShape = null;
  let draggedShape = null;
  let dragOffsetX = 0;
  let dragOffsetY = 0;
  
  let canvas, ctx;
  let backgroundImage = null; // HTMLImageElement
  let backgroundMode = 'white'; // 'white', 'black', 'upload'
  
  let currentColor = '#000000';
  let currentThickness = 2;

  // History Methods
  function saveState() {
    history.push(JSON.parse(JSON.stringify(shapes)));
    if (history.length > 50) history.shift();
  }

  function undo() {
    if (history.length > 0) {
      shapes = history.pop();
      selectedShape = null;
      draggedShape = null;
      redraw();
      updateCode();
    }
  }

  function deleteSelected() {
    if (selectedShape) {
      saveState();
      shapes = shapes.filter(s => s !== selectedShape);
      selectedShape = null;
      redraw();
      updateCode();
    }
  }

  function copySelected() {
    if (selectedShape) {
      copiedShape = JSON.parse(JSON.stringify(selectedShape));
    }
  }

  function pasteCopied() {
    if (copiedShape) {
      saveState();
      let newShape = JSON.parse(JSON.stringify(copiedShape));
      const offset = 20;
      if (newShape.x !== undefined) newShape.x += offset;
      if (newShape.y !== undefined) newShape.y += offset;
      if (newShape.cx !== undefined) { newShape.cx += offset; newShape.cy += offset; }
      if (newShape.x1 !== undefined) { newShape.x1 += offset; newShape.y1 += offset; newShape.x2 += offset; newShape.y2 += offset; }
      if (newShape.points) { newShape.points.forEach(p => { p.x += offset; p.y += offset; }); }
      
      shapes.push(newShape);
      selectedShape = newShape; // select the new copy
      copiedShape = newShape; // update copiedShape so next paste offsets again
      redraw();
      updateCode();
    }
  }

  // DOM Elements
  const els = {};

  function init() {
    // Collect DOM elements
    els.canvas = document.getElementById('draw-canvas');
    if (!els.canvas) return; // Exit if not in DOM

    ctx = els.canvas.getContext('2d');
    
    els.uploadBtn = document.getElementById('draw-upload-btn');
    els.uploadInput = document.getElementById('draw-upload-input');
    els.bgWhiteBtn = document.getElementById('draw-bg-white');
    els.bgBlackBtn = document.getElementById('draw-bg-black');
    els.clearBtn = document.getElementById('draw-clear-btn');
    els.codeBlock = document.getElementById('draw-code');
    els.copyCodeBtn = document.getElementById('draw-copy-code');
    
    els.toolBtns = document.querySelectorAll('.draw-tool-btn');
    els.colorPicker = document.getElementById('draw-color');
    els.thicknessSlider = document.getElementById('draw-thickness');
    els.thicknessValue = document.getElementById('draw-thickness-value');
    els.fontContainer = document.getElementById('draw-font-container');
    els.fontSelect = document.getElementById('draw-font');
    
    els.undoBtn = document.getElementById('draw-undo-btn');
    els.copyBtn = document.getElementById('draw-copy-btn');
    els.pasteBtn = document.getElementById('draw-paste-btn');
    els.deleteBtn = document.getElementById('draw-delete-shape-btn');
    
    bindEvents();
    resizeCanvas();
    updateCode();
    redraw();
  }

  function bindEvents() {
    // Window Resize
    window.addEventListener('resize', resizeCanvas);
    
    // Tools
    els.toolBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        els.toolBtns.forEach(b => b.classList.remove('active', 'bg-indigo-100', 'dark:bg-indigo-900/50', 'text-indigo-600', 'dark:text-indigo-400'));
        btn.classList.add('active', 'bg-indigo-100', 'dark:bg-indigo-900/50', 'text-indigo-600', 'dark:text-indigo-400');
        currentTool = btn.dataset.tool;
        // reset polygon current shape if changing tool
        if (currentTool !== 'polygon' && currentShape && currentShape.type === 'polygon' && !currentShape.isClosed) {
          shapes.pop(); // remove incomplete polygon
          currentShape = null;
          redraw();
        }
        
        if (currentTool === 'select') {
          els.canvas.style.cursor = 'default';
        } else {
          els.canvas.style.cursor = 'crosshair';
        }

        if (els.fontContainer) {
          if (currentTool === 'text') {
            els.fontContainer.classList.remove('hidden');
          } else {
            els.fontContainer.classList.add('hidden');
          }
        }
      });
    });

    // Style Controls
    if (els.colorPicker) {
      els.colorPicker.addEventListener('input', (e) => {
        currentColor = e.target.value;
      });
    }
    if (els.thicknessSlider) {
      els.thicknessSlider.addEventListener('input', (e) => {
        currentThickness = parseInt(e.target.value);
        if (els.thicknessValue) els.thicknessValue.textContent = currentThickness;
      });
    }

    // Background Controls
    if (els.bgWhiteBtn) els.bgWhiteBtn.addEventListener('click', () => setBackground('white'));
    if (els.bgBlackBtn) els.bgBlackBtn.addEventListener('click', () => setBackground('black'));
    if (els.uploadBtn) els.uploadBtn.addEventListener('click', () => els.uploadInput.click());
    if (els.uploadInput) els.uploadInput.addEventListener('change', handleUpload);
    if (els.clearBtn) els.clearBtn.addEventListener('click', () => {
      saveState();
      shapes = [];
      currentShape = null;
      selectedShape = null;
      redraw();
      updateCode();
    });

    if (els.undoBtn) els.undoBtn.addEventListener('click', undo);
    if (els.copyBtn) els.copyBtn.addEventListener('click', copySelected);
    if (els.pasteBtn) els.pasteBtn.addEventListener('click', pasteCopied);
    if (els.deleteBtn) els.deleteBtn.addEventListener('click', deleteSelected);

    // Canvas Mouse Events
    els.canvas.addEventListener('mousedown', handleMouseDown);
    els.canvas.addEventListener('mousemove', handleMouseMove);
    els.canvas.addEventListener('mouseup', handleMouseUp);
    els.canvas.addEventListener('dblclick', handleDoubleClick);

    // Canvas Touch Events (mobile support)
    els.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault(); // Prevent scrolling while drawing
      handleMouseDown(e);
    }, { passive: false });
    els.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      handleMouseMove(e);
    }, { passive: false });
    els.canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      handleMouseUp(e);
    }, { passive: false });

    // Code Copy
    if (els.copyCodeBtn) {
      els.copyCodeBtn.addEventListener('click', () => {
        if (!els.codeBlock) return;
        navigator.clipboard.writeText(els.codeBlock.textContent).then(() => {
          const originalText = els.copyCodeBtn.innerHTML;
          els.copyCodeBtn.innerHTML = '<span class="material-symbols-rounded">check</span> تم النسخ';
          setTimeout(() => els.copyCodeBtn.innerHTML = originalText, 2000);
        });
      });
    }
  }

  function resizeCanvas() {
    if (!els.canvas) return;
    const parent = els.canvas.parentElement;
    els.canvas.width = parent.clientWidth;
    els.canvas.height = 500; // fixed height for this module
    redraw();
  }

  function setBackground(mode) {
    backgroundMode = mode;
    backgroundImage = null;
    redraw();
    updateCode();
  }

  function handleUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        backgroundImage = img;
        backgroundMode = 'upload';
        redraw();
        updateCode();
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  }

  // --- Mouse / Touch Handling ---
  function getMousePos(e) {
    const rect = els.canvas.getBoundingClientRect();
    // Support both mouse and touch events
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  }

  function getTouchEndPos(e) {
    const rect = els.canvas.getBoundingClientRect();
    const touch = e.changedTouches[0];
    return {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top
    };
  }

  function handleMouseDown(e) {
    const pos = getMousePos(e);

    if (currentTool === 'select') {
      // Find shape under cursor (search backwards for z-index)
      let found = null;
      for (let i = shapes.length - 1; i >= 0; i--) {
        if (DrawProcessing.isPointInShape(pos.x, pos.y, shapes[i])) {
          found = shapes[i];
          // move shape to top
          shapes.splice(i, 1);
          shapes.push(found);
          break;
        }
      }

      if (found) {
        saveState();
        selectedShape = found;
        draggedShape = found;
        isDragging = true;
        // compute offsets
        if (draggedShape.type === 'rectangle' || draggedShape.type === 'text') {
          dragOffsetX = pos.x - draggedShape.x;
          dragOffsetY = pos.y - draggedShape.y;
        } else if (draggedShape.type === 'circle') {
          dragOffsetX = pos.x - draggedShape.cx;
          dragOffsetY = pos.y - draggedShape.cy;
        } else if (draggedShape.type === 'line') {
          dragOffsetX = pos.x - draggedShape.x1;
          dragOffsetY = pos.y - draggedShape.y1;
        } else if (draggedShape.type === 'polygon') {
          dragOffsetX = pos.x - draggedShape.points[0].x;
          dragOffsetY = pos.y - draggedShape.points[0].y;
        }
      } else {
        selectedShape = null;
      }
      redraw();
    } else if (currentTool === 'text') {
      selectedShape = null;
      const text = prompt('أدخل النص (إنجليزي):', 'Hello OpenCV');
      if (text) {
        saveState();
        const font = els.fontSelect ? els.fontSelect.value : 'cv2.FONT_HERSHEY_SIMPLEX';
        currentShape = {
          type: 'text',
          text: text,
          x: pos.x,
          y: pos.y,
          color: currentColor,
          thickness: currentThickness,
          font: font,
          fontSize: currentThickness * 10 // scale thickness to font size
        };
        shapes.push(currentShape);
        redraw();
        updateCode();
      }
    } else if (currentTool === 'polygon') {
      selectedShape = null;
      if (!currentShape || currentShape.type !== 'polygon' || currentShape.isClosed) {
        saveState();
        currentShape = {
          type: 'polygon',
          points: [{x: pos.x, y: pos.y}],
          color: currentColor,
          thickness: currentThickness,
          isClosed: false
        };
        shapes.push(currentShape);
      } else {
        saveState();
        currentShape.points.push({x: pos.x, y: pos.y});
      }
      redraw();
      updateCode();
    } else {
      // rectangle, circle, line
      selectedShape = null;
      saveState();
      isDrawing = true;
      currentShape = {
        type: currentTool,
        color: currentColor,
        thickness: currentThickness
      };
      if (currentTool === 'rectangle') {
        currentShape.x = pos.x;
        currentShape.y = pos.y;
        currentShape.width = 0;
        currentShape.height = 0;
      } else if (currentTool === 'circle') {
        currentShape.cx = pos.x;
        currentShape.cy = pos.y;
        currentShape.radius = 0;
      } else if (currentTool === 'line') {
        currentShape.x1 = pos.x;
        currentShape.y1 = pos.y;
        currentShape.x2 = pos.x;
        currentShape.y2 = pos.y;
      }
      shapes.push(currentShape);
    }
  }

  function handleMouseMove(e) {
    const pos = getMousePos(e);

    // Update cursor based on tool and hover
    if (currentTool === 'select') {
      els.canvas.style.cursor = 'default';
      for (let i = shapes.length - 1; i >= 0; i--) {
        if (DrawProcessing.isPointInShape(pos.x, pos.y, shapes[i])) {
          els.canvas.style.cursor = 'move';
          break;
        }
      }
    } else {
      els.canvas.style.cursor = 'crosshair';
    }

    if (isDragging && draggedShape) {
      if (draggedShape.type === 'rectangle' || draggedShape.type === 'text') {
        draggedShape.x = pos.x - dragOffsetX;
        draggedShape.y = pos.y - dragOffsetY;
      } else if (draggedShape.type === 'circle') {
        draggedShape.cx = pos.x - dragOffsetX;
        draggedShape.cy = pos.y - dragOffsetY;
      } else if (draggedShape.type === 'line') {
        const dx = (pos.x - dragOffsetX) - draggedShape.x1;
        const dy = (pos.y - dragOffsetY) - draggedShape.y1;
        draggedShape.x1 += dx;
        draggedShape.y1 += dy;
        draggedShape.x2 += dx;
        draggedShape.y2 += dy;
        dragOffsetX = pos.x - draggedShape.x1; // update offset for smooth dragging
        dragOffsetY = pos.y - draggedShape.y1;
      } else if (draggedShape.type === 'polygon') {
        const dx = (pos.x - dragOffsetX) - draggedShape.points[0].x;
        const dy = (pos.y - dragOffsetY) - draggedShape.points[0].y;
        draggedShape.points.forEach(p => {
          p.x += dx;
          p.y += dy;
        });
        dragOffsetX = pos.x - draggedShape.points[0].x;
        dragOffsetY = pos.y - draggedShape.points[0].y;
      }
      redraw();
    } else if (isDrawing && currentShape) {
      if (currentTool === 'rectangle') {
        currentShape.width = pos.x - currentShape.x;
        currentShape.height = pos.y - currentShape.y;
      } else if (currentTool === 'circle') {
        const dx = pos.x - currentShape.cx;
        const dy = pos.y - currentShape.cy;
        currentShape.radius = Math.sqrt(dx*dx + dy*dy);
      } else if (currentTool === 'line') {
        currentShape.x2 = pos.x;
        currentShape.y2 = pos.y;
      }
      redraw();
    }
  }

  function handleMouseUp(e) {
    if (isDragging) {
      isDragging = false;
      draggedShape = null;
      updateCode();
    }
    if (isDrawing) {
      isDrawing = false;
      currentShape = null;
      updateCode();
    }
  }

  function handleDoubleClick(e) {
    if (currentTool === 'polygon' && currentShape && currentShape.type === 'polygon') {
      currentShape.isClosed = true;
      currentShape = null;
      redraw();
      updateCode();
    }
  }

  // --- Rendering ---
  function redraw() {
    const ctx = els.canvas.getContext('2d');
    
    // Ensure width is correct (in case init ran when display was none)
    const parent = els.canvas.parentElement;
    if (parent.clientWidth > 0 && els.canvas.width !== parent.clientWidth) {
      els.canvas.width = parent.clientWidth;
    }
    
    // Clear
    ctx.clearRect(0, 0, els.canvas.width, els.canvas.height);

    // Draw Background
    if (backgroundMode === 'white') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, els.canvas.width, els.canvas.height);
    } else if (backgroundMode === 'black') {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, els.canvas.width, els.canvas.height);
    } else if (backgroundMode === 'upload' && backgroundImage) {
      ctx.drawImage(backgroundImage, 0, 0, els.canvas.width, els.canvas.height);
    }

    // Draw Shapes
    shapes.forEach(shape => {
      DrawProcessing.drawShape(ctx, shape);
      
      // Draw highlight if selected
      if (shape === selectedShape) {
        ctx.save();
        ctx.strokeStyle = '#f59e0b'; // amber
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        let padding = (shape.thickness || 2) + 4;
        
        if (shape.type === 'rectangle') {
          let minX = Math.min(shape.x, shape.x + shape.width);
          let minY = Math.min(shape.y, shape.y + shape.height);
          let w = Math.abs(shape.width);
          let h = Math.abs(shape.height);
          ctx.strokeRect(minX - padding, minY - padding, w + padding*2, h + padding*2);
        } else if (shape.type === 'circle') {
          ctx.beginPath();
          ctx.arc(shape.cx, shape.cy, shape.radius + padding, 0, Math.PI * 2);
          ctx.stroke();
        } else if (shape.type === 'line') {
          ctx.beginPath();
          ctx.moveTo(shape.x1, shape.y1);
          ctx.lineTo(shape.x2, shape.y2);
          ctx.stroke();
        } else if (shape.type === 'polygon') {
          if (shape.points && shape.points.length > 0) {
            let minX = Math.min(...shape.points.map(p => p.x));
            let maxX = Math.max(...shape.points.map(p => p.x));
            let minY = Math.min(...shape.points.map(p => p.y));
            let maxY = Math.max(...shape.points.map(p => p.y));
            ctx.strokeRect(minX - padding, minY - padding, maxX - minX + padding*2, maxY - minY + padding*2);
          }
        } else if (shape.type === 'text') {
          ctx.strokeRect(shape.x - padding, shape.y - shape.fontSize - padding, shape.text.length * (shape.fontSize/1.5) + padding*2, shape.fontSize + padding*2);
        }
        ctx.restore();
      }
    });
  }

  function updateCode() {
    if (els.codeBlock && typeof DrawCodegen !== 'undefined') {
      const code = DrawCodegen.generateCode(shapes, backgroundMode);
      
      // 1. Sanitize HTML
      let safeCode = code.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

      // 2. Add placeholders
      let highlighted = safeCode
        .replace(/#.*/g, '§C$&§c')
        .replace(/('[^']*'|"[^"]*")/g, '§S$&§s')
        .replace(/\b(def|import|from|class|return|if|else|for|while|as)\b/g, '§K$1§k')
        .replace(/\b(cv2\.[a-zA-Z0-9_]+)\b/g, '§V$1§v')
        .replace(/\b(np\.[a-zA-Z0-9_]+)\b/g, '§N$1§n')
        .replace(/\b(True|False)\b/g, '§B$1§b')
        .replace(/\b(\d+(\.\d+)?)\b/g, '§M$1§m');

      // 3. Replace placeholders with actual HTML tags
      highlighted = highlighted
        .replace(/§C/g, '<span class="text-slate-400 dark:text-gray-500">').replace(/§c/g, '</span>')
        .replace(/§S/g, '<span class="text-green-400">').replace(/§s/g, '</span>')
        .replace(/§K/g, '<span class="text-pink-500">').replace(/§k/g, '</span>')
        .replace(/§V/g, '<span class="text-blue-400">').replace(/§v/g, '</span>')
        .replace(/§N/g, '<span class="text-teal-400">').replace(/§n/g, '</span>')
        .replace(/§B/g, '<span class="text-orange-400">').replace(/§b/g, '</span>')
        .replace(/§M/g, '<span class="text-purple-400">').replace(/§m/g, '</span>');
        
      els.codeBlock.innerHTML = highlighted;
    }
  }

  return {
    init
  };
})();
