const fs = require('fs');
const file = 'js/sharpen-simulations.js';

let content = fs.readFileSync(file, 'utf8');

const unsharpTarget = `  /* ----------------------------------------------------------
   * 3. Unsharp Masking Simulation
   * ---------------------------------------------------------- */`;

const newSimulations = `  /* ----------------------------------------------------------
   * Prewitt Filter Simulation
   * ---------------------------------------------------------- */
  function initPrewitt(containerId) {
    if (initialized[containerId]) return;
    const container = document.getElementById(containerId);
    if (!container) return;

    const { origCtx, procCtx, procCanvas } = setupCanvasPair(container, SIM_W, SIM_H, 'حواف Prewitt');
    const originalData = SharpenProcessing.generateEdgeSample(SIM_W, SIM_H);
    origCtx.putImageData(originalData, 0, 0);

    const result = SharpenProcessing.applyPrewittFilter(originalData);
    procCanvas.width = result.width;
    procCanvas.height = result.height;
    procCtx.putImageData(result, 0, 0);

    initialized[containerId] = true;
  }

  /* ----------------------------------------------------------
   * High-Boost Simulation
   * ---------------------------------------------------------- */
  function initHighBoost(containerId, sigmaId, aId, sigmaValId, aValId) {
    if (initialized[containerId]) return;
    const container = document.getElementById(containerId);
    const sigmaSlider = document.getElementById(sigmaId);
    const aSlider = document.getElementById(aId);
    const sigmaValue = document.getElementById(sigmaValId);
    const aValue = document.getElementById(aValId);
    if (!container || !sigmaSlider || !aSlider) return;

    const { origCtx, procCtx, procCanvas } = setupCanvasPair(container, SIM_W, SIM_H, 'High-Boost');
    const originalData = SharpenProcessing.generateEdgeSample(SIM_W, SIM_H);
    origCtx.putImageData(originalData, 0, 0);

    function update() {
      const sigma = parseFloat(sigmaSlider.value);
      const A = parseFloat(aSlider.value);
      if (sigmaValue) sigmaValue.textContent = sigma.toFixed(1);
      if (aValue) aValue.textContent = A.toFixed(1);
      const result = SharpenProcessing.applyHighBoost(originalData, 3, sigma, A);
      procCanvas.width = result.width;
      procCanvas.height = result.height;
      procCtx.putImageData(result, 0, 0);
    }

    sigmaSlider.addEventListener('input', update);
    aSlider.addEventListener('input', update);
    update();
    initialized[containerId] = true;
  }

  /* ----------------------------------------------------------
   * 3. Unsharp Masking Simulation
   * ---------------------------------------------------------- */`;

content = content.replace(unsharpTarget, newSimulations);

const exportTarget = `    initUnsharpMask,
    initCanny,
  };`;

const newExport = `    initUnsharpMask,
    initCanny,
    initPrewitt,
    initHighBoost,
  };`;

content = content.replace(exportTarget, newExport);

fs.writeFileSync(file, content);
console.log('sharpen-simulations.js updated successfully');
