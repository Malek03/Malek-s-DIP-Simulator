/* ============================================================
   Vision Studio — Morphological Processing Interactive Playground
   Image upload, live morphological operations, code generation
   ============================================================ */

const MorphPlayground = (() => {
  'use strict';

  // State
  let originalImageData = null;
  let currentOp = 'erode';
  let isProcessing = false;

  // Morphological simulation state
  const simState = {
    interval: null,
    running: false,
    paused: false,
    currentI: 0,
    currentJ: 0,
  };

  // DOM references
  let dropZone, fileInput, originalCanvas, processedCanvas;
  let origCtx, procCtx;
  let codeBlock, controlsContainer;
  let convContainer; // Morphological visualization container

  /**
   * Initialize the Morph Playground module.
   */
  function init() {
    dropZone = document.getElementById('morph-playground-dropzone');
    fileInput = document.getElementById('morph-playground-file-input');
    originalCanvas = document.getElementById('morph-playground-original');
    processedCanvas = document.getElementById('morph-playground-processed');
    codeBlock = document.getElementById('morph-playground-code');
    controlsContainer = document.getElementById('morph-playground-controls');
    convContainer = document.getElementById('morph-conv-visualization');

    if (!originalCanvas || !processedCanvas) return;

    origCtx = originalCanvas.getContext('2d');
    procCtx = processedCanvas.getContext('2d');

    setupDropZone();

    // Operation type selector
    const typeSelect = document.getElementById('morph-playground-type-select');
    if (typeSelect) {
      typeSelect.addEventListener('change', (e) => {
        currentOp = e.target.value;
        renderControls();
        applyOp();
        updateCode();
      });
    }

    // Reset button
    const resetBtn = document.getElementById('morph-playground-reset');
    if (resetBtn) {
      resetBtn.addEventListener('click', resetPlayground);
    }

    // Copy code button
    const copyBtn = document.getElementById('morph-playground-copy-code');
    if (copyBtn) {
      copyBtn.addEventListener('click', copyCode);
    }

    // Visualize button
    const vizBtn = document.getElementById('morph-visualize-btn');
    if (vizBtn) {
      vizBtn.addEventListener('click', startVisualization);
    }

    loadSampleImage();
    renderControls();
    updateCode();
  }

  /* ----------------------------------------------------------
   * File Upload & Drag-and-Drop
   * ---------------------------------------------------------- */

  function setupDropZone() {
    if (!dropZone || !fileInput) return;

    dropZone.addEventListener('click', () => fileInput.click());

    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('drag-over');
    });

    dropZone.addEventListener('dragleave', () => {
      dropZone.classList.remove('drag-over');
    });

    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('drag-over');
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('image/')) {
        loadImageFile(file);
      }
    });

    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) loadImageFile(file);
    });
  }

  function loadImageFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 512;
        let w = img.width, h = img.height;
        if (w > maxDim || h > maxDim) {
          const scale = maxDim / Math.max(w, h);
          w = Math.round(w * scale);
          h = Math.round(h * scale);
        }

        originalCanvas.width = w;
        originalCanvas.height = h;
        processedCanvas.width = w;
        processedCanvas.height = h;

        origCtx.drawImage(img, 0, 0, w, h);
        originalImageData = origCtx.getImageData(0, 0, w, h);

        dropZone.querySelector('.drop-text').textContent = file.name;

        applyOp();
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  function loadSampleImage() {
    const w = 300, h = 200;
    originalCanvas.width = w;
    originalCanvas.height = h;
    processedCanvas.width = w;
    processedCanvas.height = h;

    const imgData = MorphProcessing.generateBinarySample(w, h);
    origCtx.putImageData(imgData, 0, 0);
    originalImageData = imgData;
    applyOp();
  }

  /* ----------------------------------------------------------
   * Dynamic Controls Rendering
   * ---------------------------------------------------------- */

  function renderControls() {
    if (!controlsContainer) return;

    const commonControls = `
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <label class="text-sm font-medium text-slate-700 dark:text-slate-300">حجم العنصر البنيوي (SE)</label>
          <span id="mpg-size-val" class="text-sm font-mono text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-900/30 px-2 py-0.5 rounded">3×3</span>
        </div>
        <input type="range" id="mpg-size" min="3" max="15" step="2" value="3" class="w-full">

        <div class="space-y-1">
          <label class="text-sm font-medium text-slate-700 dark:text-slate-300">شكل العنصر البنيوي</label>
          <select id="mpg-shape" class="w-full px-2 py-1.5 bg-white dark:bg-gray-800 border border-slate-300 dark:border-gray-600 rounded-lg text-sm text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-pink-500 outline-none">
            <option value="rect">مربع (Rectangle)</option>
            <option value="cross">صليب (Cross)</option>
            <option value="ellipse">بيضاوي (Ellipse)</option>
          </select>
        </div>

        <div class="flex items-center justify-between">
          <label class="text-sm font-medium text-slate-700 dark:text-slate-300">عدد التكرارات (Iterations)</label>
          <span id="mpg-iter-val" class="text-sm font-mono text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-900/30 px-2 py-0.5 rounded">1</span>
        </div>
        <input type="range" id="mpg-iterations" min="1" max="10" step="1" value="1" class="w-full">
      </div>
    `;

    controlsContainer.innerHTML = commonControls;

    // Add SE visualization
    updateSEVisualization();

    requestAnimationFrame(() => bindControlEvents());
  }

  function updateSEVisualization() {
    const sizeSlider = document.getElementById('mpg-size');
    const shapeSelect = document.getElementById('mpg-shape');
    if (!sizeSlider || !shapeSelect) return;

    let size = parseInt(sizeSlider.value);
    size = size % 2 === 0 ? size + 1 : size;
    const shape = shapeSelect.value;
    const se = MorphProcessing.createStructuringElement(size, size, shape);

    // Remove old SE visualization
    const existingViz = controlsContainer.querySelector('.se-viz');
    if (existingViz) existingViz.remove();

    // Only show SE grid for small sizes
    if (size <= 7) {
      const vizDiv = document.createElement('div');
      vizDiv.className = 'se-viz mt-3 p-3 bg-slate-50 dark:bg-gray-700/50 rounded-lg border border-slate-200 dark:border-gray-600';

      const title = document.createElement('p');
      title.className = 'text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 text-center';
      title.textContent = 'العنصر البنيوي (Structuring Element)';
      vizDiv.appendChild(title);

      const grid = document.createElement('div');
      grid.className = 'flex flex-col items-center gap-0.5';

      for (let i = 0; i < size; i++) {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'flex gap-0.5';
        for (let j = 0; j < size; j++) {
          const cell = document.createElement('div');
          const cellSize = size <= 5 ? 'w-6 h-6 text-xs' : 'w-4 h-4 text-[10px]';
          cell.className = `${cellSize} flex items-center justify-center rounded font-mono font-bold ${
            se[i][j] === 1
              ? 'bg-pink-500 text-white'
              : 'bg-slate-200 dark:bg-gray-600 text-slate-400 dark:text-slate-500'
          }`;
          cell.textContent = se[i][j];
          rowDiv.appendChild(cell);
        }
        grid.appendChild(rowDiv);
      }

      vizDiv.appendChild(grid);
      controlsContainer.appendChild(vizDiv);
    }
  }

  function bindControlEvents() {
    const sizeSlider = document.getElementById('mpg-size');
    const sizeVal = document.getElementById('mpg-size-val');
    const shapeSelect = document.getElementById('mpg-shape');
    const iterSlider = document.getElementById('mpg-iterations');
    const iterVal = document.getElementById('mpg-iter-val');

    const handler = () => {
      if (sizeSlider && sizeVal) {
        const size = parseInt(sizeSlider.value);
        sizeVal.textContent = `${size}×${size}`;
      }
      if (iterSlider && iterVal) {
        iterVal.textContent = iterSlider.value;
      }
      updateSEVisualization();
      applyOp();
      updateCode();
    };

    if (sizeSlider) sizeSlider.addEventListener('input', handler);
    if (shapeSelect) shapeSelect.addEventListener('change', handler);
    if (iterSlider) iterSlider.addEventListener('input', handler);
  }

  /* ----------------------------------------------------------
   * Get Current Parameters
   * ---------------------------------------------------------- */

  function getParams() {
    const sizeSlider = document.getElementById('mpg-size');
    const shapeSelect = document.getElementById('mpg-shape');
    const iterSlider = document.getElementById('mpg-iterations');

    return {
      size: sizeSlider ? parseInt(sizeSlider.value) : 3,
      shape: shapeSelect ? shapeSelect.value : 'rect',
      iterations: iterSlider ? parseInt(iterSlider.value) : 1,
    };
  }

  /* ----------------------------------------------------------
   * Apply Morphological Operation to Full Image
   * ---------------------------------------------------------- */

  function applyOp() {
    if (!originalImageData || isProcessing) return;
    isProcessing = true;

    const params = getParams();
    let result;

    switch (currentOp) {
      case 'erode':
        result = MorphProcessing.applyErode(originalImageData, params.size, params.size, params.shape, params.iterations);
        break;
      case 'dilate':
        result = MorphProcessing.applyDilate(originalImageData, params.size, params.size, params.shape, params.iterations);
        break;
      case 'open':
        result = MorphProcessing.applyOpen(originalImageData, params.size, params.size, params.shape, params.iterations);
        break;
      case 'close':
        result = MorphProcessing.applyClose(originalImageData, params.size, params.size, params.shape, params.iterations);
        break;
      case 'tophat':
        result = MorphProcessing.applyTopHat(originalImageData, params.size, params.size, params.shape, params.iterations);
        break;
      case 'blackhat':
        result = MorphProcessing.applyBlackHat(originalImageData, params.size, params.size, params.shape, params.iterations);
        break;
      default:
        result = originalImageData;
    }

    processedCanvas.width = result.width;
    processedCanvas.height = result.height;
    procCtx.putImageData(result, 0, 0);
    isProcessing = false;
  }

  /* ----------------------------------------------------------
   * Morphological Operation Visualization (Pixel-by-pixel)
   * ---------------------------------------------------------- */

  /**
   * Extract a small grayscale pixel matrix from image data.
   */
  function extractPixelMatrix(imageData, size) {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = size;
    tempCanvas.height = size;
    const tempCtx = tempCanvas.getContext('2d');

    const srcCanvas = document.createElement('canvas');
    srcCanvas.width = imageData.width;
    srcCanvas.height = imageData.height;
    const srcCtx = srcCanvas.getContext('2d');
    srcCtx.putImageData(imageData, 0, 0);

    tempCtx.drawImage(srcCanvas, 0, 0, size, size);
    const data = tempCtx.getImageData(0, 0, size, size).data;

    const matrix = [];
    for (let i = 0; i < size; i++) {
      const row = [];
      for (let j = 0; j < size; j++) {
        const idx = (i * size + j) * 4;
        const gray = Math.floor(0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2]);
        row.push(gray);
      }
      matrix.push(row);
    }
    return matrix;
  }

  function startVisualization() {
    if (!originalImageData || !convContainer) return;

    // Stop any running simulation
    stopSimulation();

    const params = getParams();
    let seSize = params.size;
    seSize = seSize % 2 === 0 ? seSize + 1 : seSize;
    const shape = params.shape;

    // Create the structuring element
    const se = MorphProcessing.createStructuringElement(seSize, seSize, shape);

    // Extract small pixel matrix
    const matrixSize = 8;
    const pixels = extractPixelMatrix(originalImageData, matrixSize);

    // Determine the operation type for simulation
    // For compound ops (open, close, tophat, blackhat), simulate the first sub-operation
    let simOp = currentOp;
    let simOpLabel = '';

    switch (currentOp) {
      case 'erode':
        simOp = 'erode';
        simOpLabel = 'التآكل (Erosion) → min';
        break;
      case 'dilate':
        simOp = 'dilate';
        simOpLabel = 'التمدد (Dilation) → max';
        break;
      case 'open':
        simOp = 'erode';
        simOpLabel = 'الفتح: الخطوة ① التآكل (Erode) → min';
        break;
      case 'close':
        simOp = 'dilate';
        simOpLabel = 'الإغلاق: الخطوة ① التمدد (Dilate) → max';
        break;
      case 'tophat':
        simOp = 'erode';
        simOpLabel = 'Top Hat: الخطوة ① التآكل (Erode) → min';
        break;
      case 'blackhat':
        simOp = 'dilate';
        simOpLabel = 'Black Hat: الخطوة ① التمدد (Dilate) → max';
        break;
    }

    const padH = Math.floor(seSize / 2);
    const padW = Math.floor(seSize / 2);

    // Compute output size (same as input, border handled as 0 for erode, ignored for dilate)
    const outH = pixels.length;
    const outW = pixels[0].length;

    // Build the visualization layout
    renderVisualizationLayout(pixels, se, outH, outW, seSize, simOp, simOpLabel, padH, padW);

    // Start the step-by-step simulation
    simulateMorphOp(pixels, se, seSize, outH, outW, simOp, padH, padW);
  }

  function renderVisualizationLayout(inputMatrix, se, outH, outW, seSize, simOp, simOpLabel, padH, padW) {
    convContainer.innerHTML = '';

    // Main wrapper
    const wrapper = document.createElement('div');
    wrapper.className = 'conv-viz-wrapper';

    // Operation label
    const opLabel = document.createElement('div');
    opLabel.className = 'text-sm font-bold text-pink-600 dark:text-pink-400 text-center mb-3 bg-pink-50 dark:bg-pink-900/20 rounded-lg py-2 px-3';
    opLabel.textContent = simOpLabel;
    wrapper.appendChild(opLabel);

    // Top row: Input ⊕/⊖ SE
    const topRow = document.createElement('div');
    topRow.className = 'conv-viz-top-row';

    // Input matrix
    const inputSection = createGridSection('المدخلات (Input)', inputMatrix, 'morph-input', false);
    topRow.appendChild(inputSection);

    // Operator symbol
    const opSymbol = document.createElement('div');
    opSymbol.className = 'conv-viz-operator';
    opSymbol.textContent = simOp === 'erode' ? '⊖' : '⊕';
    topRow.appendChild(opSymbol);

    // SE section
    const seSection = createGridSection('العنصر البنيوي (SE)', se, 'morph-se', false);
    topRow.appendChild(seSection);

    // Info section for showing values under SE
    const infoDiv = document.createElement('div');
    infoDiv.className = 'conv-viz-section';
    const infoTitle = document.createElement('div');
    infoTitle.className = 'text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 text-center';
    infoTitle.textContent = simOp === 'erode' ? 'القيم تحت SE → min' : 'القيم تحت SE → max';
    const infoContent = document.createElement('div');
    infoContent.className = 'text-xs text-slate-400 dark:text-slate-500 text-center p-4 bg-slate-50 dark:bg-gray-700/30 rounded-lg';
    infoContent.id = 'morph-values-info';
    infoContent.textContent = 'سيتم عرض القيم هنا';
    infoDiv.appendChild(infoTitle);
    infoDiv.appendChild(infoContent);
    topRow.appendChild(infoDiv);

    wrapper.appendChild(topRow);

    // Equals symbol
    const eqRow = document.createElement('div');
    eqRow.className = 'conv-viz-eq-row';
    eqRow.innerHTML = '<span class="text-2xl font-bold text-slate-400 dark:text-slate-500">=</span>';
    wrapper.appendChild(eqRow);

    // Output matrix
    const outputData = Array.from({ length: outH }, () => Array(outW).fill(''));
    const outputSection = createGridSection('الناتج (Output)', outputData, 'morph-output', false);
    wrapper.appendChild(outputSection);

    // Control buttons
    const controls = document.createElement('div');
    controls.className = 'conv-viz-controls';
    controls.innerHTML = `
      <button id="morph-pause-btn" class="conv-ctrl-btn conv-ctrl-pause">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        إيقاف مؤقت
      </button>
      <button id="morph-stop-btn" class="conv-ctrl-btn conv-ctrl-stop">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"/>
        </svg>
        إيقاف
      </button>
    `;
    wrapper.appendChild(controls);

    // Calculation display
    const calcDisplay = document.createElement('div');
    calcDisplay.id = 'morph-calc-display';
    calcDisplay.className = 'conv-calc-display';
    calcDisplay.textContent = 'ابدأ المحاكاة...';
    wrapper.appendChild(calcDisplay);

    convContainer.appendChild(wrapper);

    // Bind control buttons
    const pauseBtn = document.getElementById('morph-pause-btn');
    const stopBtn = document.getElementById('morph-stop-btn');

    if (pauseBtn) {
      pauseBtn.addEventListener('click', () => {
        if (simState.paused) {
          simState.paused = false;
          pauseBtn.innerHTML = `
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            إيقاف مؤقت
          `;
        } else {
          simState.paused = true;
          pauseBtn.innerHTML = `
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/>
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            استئناف
          `;
        }
      });
    }

    if (stopBtn) {
      stopBtn.addEventListener('click', stopSimulation);
    }
  }

  function createGridSection(title, matrix, prefix, hasPadding) {
    const section = document.createElement('div');
    section.className = 'conv-viz-section';

    const titleEl = document.createElement('div');
    titleEl.className = 'text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 text-center';
    titleEl.textContent = title;
    section.appendChild(titleEl);

    const rows = matrix.length;
    const cols = matrix[0].length;

    const grid = document.createElement('div');
    grid.className = 'matrix-grid';
    grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;

    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        const cell = document.createElement('div');
        cell.className = 'matrix-cell';
        cell.id = `${prefix}-${i}-${j}`;

        const val = matrix[i][j];
        if (prefix === 'morph-se') {
          cell.textContent = val;
          cell.classList.add('kernel-cell');
          if (val === 1) {
            cell.style.backgroundColor = 'rgb(236 72 153)'; // pink-500
            cell.style.color = 'white';
          }
        } else if (prefix === 'morph-output') {
          cell.textContent = '';
        } else {
          cell.textContent = typeof val === 'number' ? Math.floor(val) : '';
        }

        grid.appendChild(cell);
      }
    }

    section.appendChild(grid);
    return section;
  }

  function simulateMorphOp(inputMatrix, se, seSize, outH, outW, simOp, padH, padW) {
    simState.currentI = 0;
    simState.currentJ = 0;
    simState.running = true;
    simState.paused = false;

    const calcDisplay = document.getElementById('morph-calc-display');
    const inH = inputMatrix.length;
    const inW = inputMatrix[0].length;

    simState.interval = setInterval(() => {
      if (simState.paused) return;

      const i = simState.currentI;
      const j = simState.currentJ;

      if (i >= outH) {
        stopSimulation();
        if (calcDisplay) calcDisplay.textContent = '✅ اكتملت المحاكاة!';
        return;
      }

      // Clear previous highlights
      clearHighlights(inH, inW, seSize);

      // Highlight current window in input and collect values under SE
      const values = [];
      const seActivePositions = [];

      for (let ki = 0; ki < seSize; ki++) {
        for (let kj = 0; kj < seSize; kj++) {
          const ni = i + ki - padH;
          const nj = j + kj - padW;

          // Highlight SE cells that are active (value=1)
          const seCell = document.getElementById(`morph-se-${ki}-${kj}`);
          if (seCell && se[ki][kj] === 1) {
            seCell.classList.add('highlight-kernel');
          }

          // Highlight corresponding input cells
          if (ni >= 0 && ni < inH && nj >= 0 && nj < inW) {
            const inCell = document.getElementById(`morph-input-${ni}-${nj}`);
            if (inCell) {
              if (se[ki][kj] === 1) {
                inCell.classList.add('highlight-input');
                values.push(inputMatrix[ni][nj]);
                seActivePositions.push({ ki, kj, val: inputMatrix[ni][nj] });
              }
            }
          } else {
            // Out of bounds
            if (se[ki][kj] === 1) {
              if (simOp === 'erode') {
                values.push(0); // border = 0 for erode
              }
              // For dilate, border = 0, max stays unchanged
            }
          }
        }
      }

      // Compute the output value
      let outputVal;
      let calcText;

      if (simOp === 'erode') {
        outputVal = values.length > 0 ? Math.min(...values) : 0;
        calcText = `min([${values.join(', ')}]) = ${outputVal}`;
      } else {
        outputVal = values.length > 0 ? Math.max(...values) : 0;
        calcText = `max([${values.join(', ')}]) = ${outputVal}`;
      }

      // Update values info display
      const valuesInfo = document.getElementById('morph-values-info');
      if (valuesInfo) {
        const highlightedValues = values.map(v => {
          if (simOp === 'erode' && v === outputVal) {
            return `<strong class="text-pink-500">${v}</strong>`;
          } else if (simOp === 'dilate' && v === outputVal) {
            return `<strong class="text-pink-500">${v}</strong>`;
          }
          return v;
        });
        // Only highlight the first occurrence of min/max
        let firstHighlighted = false;
        const displayValues = values.map(v => {
          if (!firstHighlighted && v === outputVal) {
            firstHighlighted = true;
            return `<strong class="text-pink-500">${v}</strong>`;
          }
          return v;
        });
        valuesInfo.innerHTML = `<div class="font-mono text-[10px] leading-relaxed">[${displayValues.join(', ')}]<br>${simOp === 'erode' ? 'min' : 'max'} = <strong class="text-pink-500">${outputVal}</strong></div>`;
      }

      // Highlight output cell and write value
      const outCell = document.getElementById(`morph-output-${i}-${j}`);
      if (outCell) {
        outCell.textContent = outputVal;
        outCell.classList.add('highlight-output');
      }

      // Update calculation display
      if (calcDisplay) {
        calcDisplay.textContent = `[${i},${j}] → ${calcText}`;
      }

      // Advance to next position
      simState.currentJ++;
      if (simState.currentJ >= outW) {
        simState.currentJ = 0;
        simState.currentI++;
      }
    }, 600);
  }

  function clearHighlights(inH, inW, seSize) {
    // Clear input highlights
    for (let i = 0; i < inH; i++) {
      for (let j = 0; j < inW; j++) {
        const cell = document.getElementById(`morph-input-${i}-${j}`);
        if (cell) cell.classList.remove('highlight-input');
      }
    }
    // Clear SE highlights
    for (let i = 0; i < seSize; i++) {
      for (let j = 0; j < seSize; j++) {
        const cell = document.getElementById(`morph-se-${i}-${j}`);
        if (cell) cell.classList.remove('highlight-kernel');
      }
    }
    // Clear output highlight (only the active class, not the value)
    document.querySelectorAll('.highlight-output').forEach(el => el.classList.remove('highlight-output'));
  }

  function stopSimulation() {
    if (simState.interval) {
      clearInterval(simState.interval);
      simState.interval = null;
    }
    simState.running = false;
    simState.paused = false;
  }

  /* ----------------------------------------------------------
   * Code Generation
   * ---------------------------------------------------------- */

  function updateCode() {
    if (!codeBlock) return;
    const params = getParams();
    const { highlighted } = MorphCodeGenerator.generate(currentOp, params);
    codeBlock.innerHTML = highlighted;
  }

  function copyCode() {
    const params = getParams();
    const { raw } = MorphCodeGenerator.generate(currentOp, params);
    navigator.clipboard.writeText(raw).then(() => {
      const copyBtn = document.getElementById('morph-playground-copy-code');
      if (copyBtn) {
        const origText = copyBtn.innerHTML;
        copyBtn.innerHTML = `
          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
          </svg>
          تم النسخ!
        `;
        setTimeout(() => { copyBtn.innerHTML = origText; }, 2000);
      }
    });
  }

  /* ----------------------------------------------------------
   * Reset
   * ---------------------------------------------------------- */

  function resetPlayground() {
    stopSimulation();
    currentOp = 'erode';
    const typeSelect = document.getElementById('morph-playground-type-select');
    if (typeSelect) typeSelect.value = 'erode';
    renderControls();
    loadSampleImage();
    updateCode();

    if (convContainer) convContainer.innerHTML = '';
  }

  // Public API
  return { init };
})();
