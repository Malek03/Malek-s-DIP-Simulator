/* ============================================================
   Vision Studio — Core Application
   SPA Router, Theme Toggle, Navigation, Section Transitions
   ============================================================ */

const App = (() => {
  'use strict';

  // All valid routes and their corresponding section IDs
  const routes = {
    'home': 'section-home',
    'point-processing': 'section-point-processing',
    'playground': 'section-playground',
    // Concept details
    'point-processing/negatives': 'section-concept-negatives',
    'point-processing/log': 'section-concept-log',
    'point-processing/gamma': 'section-concept-gamma',
    'point-processing/threshold': 'section-concept-threshold',
    'point-processing/contrast': 'section-concept-contrast',
    'point-processing/bitplane': 'section-concept-bitplane',
    'point-processing/histeq': 'section-concept-histeq',
    // Image Basics
    'image-basics': 'section-image-basics',
    'basics-playground': 'section-basics-playground',
    'image-basics/scale': 'section-concept-scale',
    'image-basics/rotate': 'section-concept-rotate',
    'image-basics/translate': 'section-concept-translate',
    'image-basics/crop': 'section-concept-crop',
    // Image Representation
    'image-rep': 'section-image-rep',
    'rep-playground': 'section-rep-playground',
    'image-rep/rgb': 'section-concept-rgb',
    'image-rep/sampling': 'section-concept-sampling',
    'image-rep/quantization': 'section-concept-quantization',
    'image-rep/colormix': 'section-concept-colormix'
  };

  let currentRoute = 'home';

  /* ----------------------------------------------------------
   * Theme Management
   * ---------------------------------------------------------- */

  function initTheme() {
    const saved = localStorage.getItem('vs-theme');
    // Check OS preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (saved === 'dark' || (!saved && prefersDark)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    updateThemeIcon();
  }

  function toggleTheme() {
    document.documentElement.classList.toggle('dark');
    const isDark = document.documentElement.classList.contains('dark');
    localStorage.setItem('vs-theme', isDark ? 'dark' : 'light');
    updateThemeIcon();
  }

  function updateThemeIcon() {
    const isDark = document.documentElement.classList.contains('dark');
    const sunIcon = document.getElementById('icon-sun');
    const moonIcon = document.getElementById('icon-moon');
    if (sunIcon && moonIcon) {
      sunIcon.style.display = isDark ? 'none' : 'block';
      moonIcon.style.display = isDark ? 'block' : 'none';
    }
  }

  /* ----------------------------------------------------------
   * SPA Router
   * ---------------------------------------------------------- */

  function navigate(route) {
    // Determine if it's a known route
    let view = routes[route] ? route : 'home';

    // Update active state on nav links
    document.querySelectorAll('.nav-link').forEach(link => {
      // Check if the link matches the top-level section
      const topLevelRoute = view.split('/')[0]; 
      if (link.dataset.route === topLevelRoute) {
        link.classList.add('text-indigo-600', 'dark:text-indigo-400');
        link.classList.remove('text-slate-600', 'dark:text-slate-300');
      } else {
        link.classList.remove('text-indigo-600', 'dark:text-indigo-400');
        link.classList.add('text-slate-600', 'dark:text-slate-300');
      }
    });

    // Hide all sections
    document.querySelectorAll('.section-view').forEach(el => {
      el.classList.remove('active', 'visible');
    });

    // Show target section
    const targetId = routes[view];
    const target = document.getElementById(targetId);
    if (target) {
      target.classList.add('active');
      // Small delay to allow display:block to apply before adding opacity
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          target.classList.add('visible');
        });
      });
    }

    // Scroll to top when changing views
    window.scrollTo({ top: 0, behavior: 'smooth' });

    currentRoute = view;

    // Trigger specific initializations AFTER section is visible
    // Canvas rendering fails inside display:none elements, so we delay
    if (view.startsWith('point-processing/')) {
      setTimeout(() => {
        initConceptSimulation(view.split('/')[1]);
      }, 100);
    } else if (view.startsWith('image-basics/')) {
      setTimeout(() => {
        initBasicsSimulation(view.split('/')[1]);
      }, 100);
    } else if (view.startsWith('image-rep/')) {
      setTimeout(() => {
        initRepSimulation(view.split('/')[1]);
      }, 100);
    } else if (view === 'playground' && typeof Playground !== 'undefined') {
      setTimeout(() => Playground.init(), 100);
    } else if (view === 'basics-playground' && typeof BasicsPlayground !== 'undefined') {
      setTimeout(() => BasicsPlayground.init(), 100);
    } else if (view === 'rep-playground' && typeof RepPlayground !== 'undefined') {
      setTimeout(() => RepPlayground.init(), 100);
    }
  }

  function handleHashChange() {
    const hash = window.location.hash.slice(1);
    navigate(hash || 'home');
  }

  /* ----------------------------------------------------------
   * Mobile Menu
   * ---------------------------------------------------------- */

  function toggleMobileMenu() {
    const menu = document.getElementById('mobile-menu');
    if (menu) {
      menu.classList.toggle('hidden');
    }
  }

  /* ----------------------------------------------------------
   * Concept Simulations Initializer
   * ---------------------------------------------------------- */
  
  function initConceptSimulation(concept) {
    if (typeof Simulations === 'undefined') return;
    
    // Call the respective simulation init with the correct DOM element IDs
    switch(concept) {
      case 'negatives':
        Simulations.initNegative('sim-negative-canvas');
        break;
      case 'log':
        Simulations.initLog('sim-log-canvas', 'sim-log-slider', 'sim-log-value');
        break;
      case 'gamma':
        Simulations.initGamma('sim-gamma-canvas', 'sim-gamma-slider', 'sim-gamma-value');
        break;
      case 'threshold':
        Simulations.initThreshold('sim-threshold-canvas', 'sim-threshold-slider', 'sim-threshold-value');
        break;
      case 'contrast':
        Simulations.initContrast('sim-contrast-canvas', 'sim-contrast-r1', 'sim-contrast-s1', 'sim-contrast-r2', 'sim-contrast-s2', 'sim-contrast-values');
        break;
      case 'bitplane':
        Simulations.initBitPlane('sim-bitplane-canvas', 'sim-bitplane-btns');
        break;
      case 'histeq':
        Simulations.initHistEq('sim-histeq-canvas');
        break;
    }
  }

  /* ----------------------------------------------------------
   * Basics Simulations Initializer
   * ---------------------------------------------------------- */
  
  function initBasicsSimulation(concept) {
    if (typeof BasicsSimulations === 'undefined') return;
    
    switch(concept) {
      case 'scale':
        BasicsSimulations.initScale('sim-scale-canvas', 'sim-scale-slider', 'sim-scale-value');
        break;
      case 'rotate':
        BasicsSimulations.initRotate('sim-rotate-canvas', 'sim-rotate-slider', 'sim-rotate-value');
        break;
      case 'translate':
        BasicsSimulations.initTranslate('sim-translate-canvas', 'sim-translate-x-slider', 'sim-translate-x-value', 'sim-translate-y-slider', 'sim-translate-y-value');
        break;
      case 'crop':
        BasicsSimulations.initCrop('sim-crop-canvas');
        break;
    }
  }

  /* ----------------------------------------------------------
   * Representation Simulations Initializer
   * ---------------------------------------------------------- */
  
  function initRepSimulation(concept) {
    if (typeof RepSimulations === 'undefined') return;
    
    switch(concept) {
      case 'rgb':
        RepSimulations.initRGB('sim-rgb-container', 'sim-rgb-animate-btn');
        break;
      case 'sampling':
        RepSimulations.initSampling('sim-sampling-container', 'sim-sampling-rows', 'sim-sampling-cols', 'sim-sampling-value');
        break;
      case 'quantization':
        RepSimulations.initQuantization('sim-quantization-container', 'sim-quantization-slider', 'sim-quantization-value');
        break;
      case 'colormix':
        RepSimulations.initColorMix('sim-colormix-container', 'sim-colormix-input');
        break;
    }
  }

  /* ----------------------------------------------------------
   * Utility to Download Canvas Image
   * ---------------------------------------------------------- */
  function downloadCanvasImage(canvasId, defaultFilename) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    
    // Create a temporary link element
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = defaultFilename || 'processed_image.png';
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /* ----------------------------------------------------------
   * Initialize Application
   * ---------------------------------------------------------- */

  function init() {
    // Theme
    initTheme();
    const themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) themeBtn.addEventListener('click', toggleTheme);

    // Save Buttons Event Listeners
    const playSaveBtn = document.getElementById('playground-save');
    if (playSaveBtn) playSaveBtn.addEventListener('click', () => downloadCanvasImage('playground-processed', 'point_processing_result.png'));

    const basicsSaveBtn = document.getElementById('basics-playground-save');
    if (basicsSaveBtn) basicsSaveBtn.addEventListener('click', () => downloadCanvasImage('basics-playground-processed', 'image_basics_result.png'));

    const repSaveBtn = document.getElementById('rep-playground-save');
    if (repSaveBtn) repSaveBtn.addEventListener('click', () => downloadCanvasImage('rep-playground-processed', 'image_rep_result.png'));

    // Mobile Menu
    const menuBtn = document.getElementById('mobile-menu-btn');
    if (menuBtn) menuBtn.addEventListener('click', toggleMobileMenu);

    // Close mobile menu on click
    document.querySelectorAll('#mobile-menu .nav-link').forEach(link => {
      link.addEventListener('click', () => {
        document.getElementById('mobile-menu').classList.add('hidden');
      });
    });

    // Routing
    window.addEventListener('hashchange', handleHashChange);
    
    // On load, check if there's a hash, otherwise go home
    if (window.location.hash) {
      handleHashChange();
    } else {
      navigate('home');
    }
  }

  // Expose public API
  return {
    init,
    navigate,
    toggleTheme
  };

})();

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', App.init);
