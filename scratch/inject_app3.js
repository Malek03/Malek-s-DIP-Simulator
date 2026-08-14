const fs = require('fs');
const file = 'js/app.js';

let content = fs.readFileSync(file, 'utf8');

const routesTarget = `    'sharpen-filters/unsharp': 'section-concept-unsharp',
    'sharpen-filters/canny': 'section-concept-canny'
  };`;

const newRoutes = `    'sharpen-filters/unsharp': 'section-concept-unsharp',
    'sharpen-filters/canny': 'section-concept-canny',
    'sharpen-filters/prewitt': 'section-concept-prewitt',
    'sharpen-filters/highboost': 'section-concept-highboost'
  };`;

content = content.replace(routesTarget, newRoutes);

const initTarget = `      case 'unsharp':
        SharpenSimulations.initUnsharpMask('sim-unsharp-container', 'sim-unsharp-sigma', 'sim-unsharp-k', 'sim-unsharp-sigma-val', 'sim-unsharp-k-val');
        break;
      case 'canny':
        SharpenSimulations.initCanny('sim-canny-container', 'sim-canny-low', 'sim-canny-high', 'sim-canny-low-val', 'sim-canny-high-val');
        break;
    }
  }`;

const newInit = `      case 'unsharp':
        SharpenSimulations.initUnsharpMask('sim-unsharp-container', 'sim-unsharp-sigma', 'sim-unsharp-k', 'sim-unsharp-sigma-val', 'sim-unsharp-k-val');
        break;
      case 'canny':
        SharpenSimulations.initCanny('sim-canny-container', 'sim-canny-low', 'sim-canny-high', 'sim-canny-low-val', 'sim-canny-high-val');
        break;
      case 'prewitt':
        SharpenSimulations.initPrewitt('sim-prewitt-container');
        break;
      case 'highboost':
        SharpenSimulations.initHighBoost('sim-highboost-container', 'sim-highboost-sigma', 'sim-highboost-a', 'sim-highboost-sigma-val', 'sim-highboost-a-val');
        break;
    }
  }`;

content = content.replace(initTarget, newInit);

fs.writeFileSync(file, content);
console.log('app.js updated successfully');
