const fs = require('fs');
const file = 'js/sharpen-playground.js';

let content = fs.readFileSync(file, 'utf8');

// 1. controlsMap Sobel update
const sobelControlsTarget = `      sobel: \`
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <label class="text-sm font-medium text-slate-700 dark:text-slate-300">حجم الـ Kernel</label>
            <span id="shpg-sobel-val" class="text-sm font-mono text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/30 px-2 py-0.5 rounded">3×3</span>
          </div>
          <input type="range" id="shpg-sobel-size" min="3" max="5" step="2" value="3" class="w-full">
          \${getAdvancedControls('shpg-sobel')}
        </div>
      \`,`;

const sobelControlsNew = `      sobel: \`
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <label class="text-sm font-medium text-slate-700 dark:text-slate-300">حجم الـ Kernel</label>
            <span id="shpg-sobel-val" class="text-sm font-mono text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/30 px-2 py-0.5 rounded">3×3</span>
          </div>
          <input type="range" id="shpg-sobel-size" min="3" max="5" step="2" value="3" class="w-full">
          
          <div class="space-y-1 mt-3">
            <label class="text-sm font-medium text-slate-700 dark:text-slate-300">الاتجاه (Direction)</label>
            <select id="shpg-sobel-axis" class="w-full px-2 py-1.5 bg-white dark:bg-gray-800 border border-slate-300 dark:border-gray-600 rounded-lg text-sm text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-rose-500 outline-none">
              <option value="mag">المقدار (Magnitude: X+Y)</option>
              <option value="x">أفقي (Sobel-X)</option>
              <option value="y">عمودي (Sobel-Y)</option>
              <option value="diag1">القطر الرئيسي (\\)</option>
              <option value="diag2">القطر الثانوي (/)</option>
            </select>
          </div>
          \${getAdvancedControls('shpg-sobel')}
        </div>
      \`,`;

content = content.replace(sobelControlsTarget, sobelControlsNew);

// 2. controlsMap Add Canny
const hbControlsTarget = `          </div>
        </div>
      \`,
    };`;

const hbControlsNew = `          </div>
        </div>
      \`,
      canny: \`
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <label class="text-sm font-medium text-slate-700 dark:text-slate-300">الحد الأدنى (Low Threshold)</label>
            <span id="shpg-canny-low-val" class="text-sm font-mono text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/30 px-2 py-0.5 rounded">50</span>
          </div>
          <input type="range" id="shpg-canny-low" min="0" max="255" step="1" value="50" class="w-full">
          
          <div class="flex items-center justify-between mt-3">
            <label class="text-sm font-medium text-slate-700 dark:text-slate-300">الحد الأعلى (High Threshold)</label>
            <span id="shpg-canny-high-val" class="text-sm font-mono text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/30 px-2 py-0.5 rounded">150</span>
          </div>
          <input type="range" id="shpg-canny-high" min="0" max="255" step="1" value="150" class="w-full">
          
          <div class="flex items-center justify-between mt-3">
            <label class="text-sm font-medium text-slate-700 dark:text-slate-300">قوة التنعيم (Sigma)</label>
            <span id="shpg-canny-sigma-val" class="text-sm font-mono text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/30 px-2 py-0.5 rounded">1.0</span>
          </div>
          <input type="range" id="shpg-canny-sigma" min="0.1" max="5.0" step="0.1" value="1.0" class="w-full">

          <div class="p-2 bg-rose-50 dark:bg-rose-900/20 rounded-lg border border-rose-200 dark:border-rose-700/50 mt-2">
            <p class="text-xs text-rose-700 dark:text-rose-300">
              <strong>ملاحظة:</strong> خوارزمية Canny مكونة من 5 مراحل ولا تستخدم خصائص Padding و Stride الافتراضية.
            </p>
          </div>
        </div>
      \`,
    };`;

content = content.replace(hbControlsTarget, hbControlsNew);

// 3. bindControlEvents
const sobelBindTarget = `      case 'sobel':
        attachCommon('shpg-sobel');
        break;`;

const sobelBindNew = `      case 'sobel': {
        const handler = attachCommon('shpg-sobel');
        const axisSel = document.getElementById('shpg-sobel-axis');
        if (axisSel) axisSel.addEventListener('change', handler);
        break;
      }
      case 'canny': {
        const lowSlider = document.getElementById('shpg-canny-low');
        const lowVal = document.getElementById('shpg-canny-low-val');
        const highSlider = document.getElementById('shpg-canny-high');
        const highVal = document.getElementById('shpg-canny-high-val');
        const sigmaSlider = document.getElementById('shpg-canny-sigma');
        const sigmaVal = document.getElementById('shpg-canny-sigma-val');

        const handler = () => {
          let low = parseInt(lowSlider.value);
          let high = parseInt(highSlider.value);
          if (high <= low) {
            high = low + 1;
            highSlider.value = high;
          }
          if (lowVal) lowVal.textContent = low;
          if (highVal) highVal.textContent = high;
          if (sigmaVal) sigmaVal.textContent = parseFloat(sigmaSlider.value).toFixed(1);
          applyFilter();
          updateCode();
        };

        if (lowSlider) lowSlider.addEventListener('input', handler);
        if (highSlider) highSlider.addEventListener('input', handler);
        if (sigmaSlider) sigmaSlider.addEventListener('input', handler);
        break;
      }`;

content = content.replace(sobelBindTarget, sobelBindNew);

// 4. getParams
const sobelParamsTarget = `      case 'sobel': {
        const sizeSlider = document.getElementById('shpg-sobel-size');
        const common = getCommonPadStride('shpg-sobel');
        return { size: sizeSlider ? parseInt(sizeSlider.value) : 3, ...common };
      }`;

const sobelParamsNew = `      case 'sobel': {
        const sizeSlider = document.getElementById('shpg-sobel-size');
        const axisSel = document.getElementById('shpg-sobel-axis');
        const common = getCommonPadStride('shpg-sobel');
        return { 
          size: sizeSlider ? parseInt(sizeSlider.value) : 3, 
          axis: axisSel ? axisSel.value : 'mag',
          ...common 
        };
      }
      case 'canny': {
        const lowSlider = document.getElementById('shpg-canny-low');
        const highSlider = document.getElementById('shpg-canny-high');
        const sigmaSlider = document.getElementById('shpg-canny-sigma');
        return {
          lowThresh: lowSlider ? parseInt(lowSlider.value) : 50,
          highThresh: highSlider ? parseInt(highSlider.value) : 150,
          sigma: sigmaSlider ? parseFloat(sigmaSlider.value) : 1.0,
        };
      }`;

content = content.replace(sobelParamsTarget, sobelParamsNew);

// 5. applyFilter
const applyTarget = `      case 'sobel':
        result = SharpenProcessing.applySobelFilter(originalImageData, params.size, params.paddingType, params.stride);
        break;`;

const applyNew = `      case 'sobel':
        result = SharpenProcessing.applySobelFilter(originalImageData, params.size, params.axis, params.paddingType, params.stride);
        break;
      case 'canny':
        result = SharpenProcessing.applyCannyFilter(originalImageData, params.lowThresh, params.highThresh, params.sigma);
        break;`;

content = content.replace(applyTarget, applyNew);

// 6. startVisualization
const vizTarget = `      case 'sobel': {
        kSize = params.size || 3;
        const sobel = SharpenProcessing.createSobelKernels(kSize);
        kernel = sobel.kx; // Show Gx for viz
        kernelLabel = 'Sobel Gx';
        isGradient = true;
        break;
      }`;

const vizNew = `      case 'sobel': {
        kSize = params.size || 3;
        const sobel = SharpenProcessing.createSobelKernels(kSize);
        const axis = params.axis || 'mag';
        if (axis === 'y') {
          kernel = sobel.ky; kernelLabel = 'Sobel Gy';
        } else if (axis === 'diag1') {
          kernel = sobel.kx_diag1; kernelLabel = 'Sobel Main Diag';
        } else if (axis === 'diag2') {
          kernel = sobel.ky_diag2; kernelLabel = 'Sobel Sec Diag';
        } else {
          kernel = sobel.kx; kernelLabel = 'Sobel Gx'; // default for mag and x
        }
        isGradient = true;
        break;
      }
      case 'canny': {
        kSize = Math.max(3, Math.ceil((params.sigma || 1.0) * 3));
        kSize = kSize % 2 === 0 ? kSize + 1 : kSize;
        kernel = SmoothProcessing.createGaussianKernel(kSize, kSize, params.sigma || 1.0);
        kernelLabel = 'Gaussian Blur (Step 1 of Canny)';
        break;
      }`;

content = content.replace(vizTarget, vizNew);

fs.writeFileSync(file, content);
console.log('Playground updated successfully');
