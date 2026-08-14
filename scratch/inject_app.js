const fs = require('fs');
const appFile = 'js/app.js';

let content = fs.readFileSync(appFile, 'utf8');

// 1. Add to routes object
const routesTarget = `    'smooth-playground': 'section-smooth-playground',
    'smooth-filters/mean': 'section-concept-mean',
    'smooth-filters/gaussian': 'section-concept-gaussian',
    'smooth-filters/median': 'section-concept-median'
  };`;

const newRoutes = `    'smooth-playground': 'section-smooth-playground',
    'smooth-filters/mean': 'section-concept-mean',
    'smooth-filters/gaussian': 'section-concept-gaussian',
    'smooth-filters/median': 'section-concept-median',
    // Sharpening Filters
    'sharpen-filters': 'section-sharpen-filters',
    'sharpen-playground': 'section-sharpen-playground',
    'sharpen-filters/laplacian': 'section-concept-laplacian',
    'sharpen-filters/sobel': 'section-concept-sobel',
    'sharpen-filters/unsharp': 'section-concept-unsharp'
  };`;

content = content.replace(routesTarget, newRoutes);

// 2. Add to navigate function conditionals
const navigateTarget = `    } else if (view.startsWith('smooth-filters/')) {
      setTimeout(() => {
        initSmoothSimulation(view.split('/')[1]);
      }, 100);
    } else if (view === 'playground' && typeof Playground !== 'undefined') {`;

const newNavigate = `    } else if (view.startsWith('smooth-filters/')) {
      setTimeout(() => {
        initSmoothSimulation(view.split('/')[1]);
      }, 100);
    } else if (view.startsWith('sharpen-filters/')) {
      setTimeout(() => {
        initSharpenSimulation(view.split('/')[1]);
      }, 100);
    } else if (view === 'playground' && typeof Playground !== 'undefined') {`;

content = content.replace(navigateTarget, newNavigate);

// 3. Add to playground initializers
const playgroundTarget = `    } else if (view === 'smooth-playground' && typeof SmoothPlayground !== 'undefined') {
      setTimeout(() => SmoothPlayground.init(), 100);
    }`;

const newPlayground = `    } else if (view === 'smooth-playground' && typeof SmoothPlayground !== 'undefined') {
      setTimeout(() => SmoothPlayground.init(), 100);
    } else if (view === 'sharpen-playground' && typeof SharpenPlayground !== 'undefined') {
      setTimeout(() => SharpenPlayground.init(), 100);
    }`;

content = content.replace(playgroundTarget, newPlayground);

// 4. Add initSharpenSimulation function
const initFuncsTarget = `  function initSmoothSimulation(concept) {
    if (typeof SmoothSimulations === 'undefined') return;

    switch(concept) {
      case 'mean':
        SmoothSimulations.initMeanFilter('sim-mean-container', 'sim-mean-size', 'sim-mean-val');
        break;
      case 'gaussian':
        SmoothSimulations.initGaussianFilter('sim-gaussian-container', 'sim-gaussian-size', 'sim-gaussian-sigma', 'sim-gaussian-size-val', 'sim-gaussian-sigma-val');
        break;
      case 'median':
        SmoothSimulations.initMedianFilter('sim-median-container', 'sim-median-size', 'sim-median-val');
        break;
    }
  }`;

const newInitFunc = initFuncsTarget + `

  function initSharpenSimulation(concept) {
    if (typeof SharpenSimulations === 'undefined') return;

    switch(concept) {
      case 'laplacian':
        SharpenSimulations.initLaplacian('sim-laplacian-container', 'sim-lap-type', 'sim-lap-val');
        break;
      case 'sobel':
        SharpenSimulations.initSobel('sim-sobel-container', 'sim-sobel-size', 'sim-sobel-val');
        break;
      case 'unsharp':
        SharpenSimulations.initUnsharpMask('sim-unsharp-container', 'sim-unsharp-sigma', 'sim-unsharp-k', 'sim-unsharp-sigma-val', 'sim-unsharp-k-val');
        break;
    }
  }`;

content = content.replace(initFuncsTarget, newInitFunc);

// 5. Add save button binding
const saveBindingTarget = `    const smoothSaveBtn = document.getElementById('smooth-playground-save');
    if (smoothSaveBtn) smoothSaveBtn.addEventListener('click', () => downloadCanvasImage('smooth-playground-processed', 'smooth_filter_result.png'));`;

const newSaveBinding = `    const smoothSaveBtn = document.getElementById('smooth-playground-save');
    if (smoothSaveBtn) smoothSaveBtn.addEventListener('click', () => downloadCanvasImage('smooth-playground-processed', 'smooth_filter_result.png'));

    const sharpenSaveBtn = document.getElementById('sharpen-playground-save');
    if (sharpenSaveBtn) sharpenSaveBtn.addEventListener('click', () => downloadCanvasImage('sharpen-playground-processed', 'sharpen_filter_result.png'));`;

content = content.replace(saveBindingTarget, newSaveBinding);

fs.writeFileSync(appFile, content);
console.log('App.js updated successfully!');
