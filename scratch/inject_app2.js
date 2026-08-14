const fs = require('fs');
const appFile = 'js/app.js';

let content = fs.readFileSync(appFile, 'utf8');

// Fix 1: Add Canny to routes
const routesTarget = `    'sharpen-filters/unsharp': 'section-concept-unsharp'
  };`;

const newRoutes = `    'sharpen-filters/unsharp': 'section-concept-unsharp',
    'sharpen-filters/canny': 'section-concept-canny'
  };`;

content = content.replace(routesTarget, newRoutes);

// Fix 2: Inject initSharpenSimulation right before downloadCanvasImage
const initFuncTarget = `  /* ----------------------------------------------------------
   * Utility to Download Canvas Image
   * ---------------------------------------------------------- */`;

const sharpenInitFunc = `  /* ----------------------------------------------------------
   * Sharpening Filters Simulations Initializer
   * ---------------------------------------------------------- */
  
  function initSharpenSimulation(concept) {
    if (typeof SharpenSimulations === 'undefined') return;

    switch(concept) {
      case 'laplacian':
        SharpenSimulations.initLaplacian('sim-laplacian-container', 'sim-lap-type', 'sim-lap-val');
        break;
      case 'sobel':
        SharpenSimulations.initSobel('sim-sobel-container', 'sim-sobel-size', 'sim-sobel-axis', 'sim-sobel-val');
        break;
      case 'unsharp':
        SharpenSimulations.initUnsharpMask('sim-unsharp-container', 'sim-unsharp-sigma', 'sim-unsharp-k', 'sim-unsharp-sigma-val', 'sim-unsharp-k-val');
        break;
      case 'canny':
        SharpenSimulations.initCanny('sim-canny-container', 'sim-canny-low', 'sim-canny-high', 'sim-canny-low-val', 'sim-canny-high-val');
        break;
    }
  }

  /* ----------------------------------------------------------
   * Utility to Download Canvas Image
   * ---------------------------------------------------------- */`;

if (!content.includes('function initSharpenSimulation')) {
  content = content.replace(initFuncTarget, sharpenInitFunc);
} else {
  // If it already exists, just update it with Canny
  const oldInit = `      case 'unsharp':
        SharpenSimulations.initUnsharpMask('sim-unsharp-container', 'sim-unsharp-sigma', 'sim-unsharp-k', 'sim-unsharp-sigma-val', 'sim-unsharp-k-val');
        break;
    }
  }`;
  const updatedInit = `      case 'unsharp':
        SharpenSimulations.initUnsharpMask('sim-unsharp-container', 'sim-unsharp-sigma', 'sim-unsharp-k', 'sim-unsharp-sigma-val', 'sim-unsharp-k-val');
        break;
      case 'canny':
        SharpenSimulations.initCanny('sim-canny-container', 'sim-canny-low', 'sim-canny-high', 'sim-canny-low-val', 'sim-canny-high-val');
        break;
    }
  }`;
  content = content.replace(oldInit, updatedInit);
}

fs.writeFileSync(appFile, content);
console.log('App.js Canny routing added and initSharpenSimulation fixed.');
