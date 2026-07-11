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
    'coming-soon': 'section-coming-soon',
    // Concept details
    'point-processing/negatives': 'section-concept-negatives',
    'point-processing/log': 'section-concept-log',
    'point-processing/gamma': 'section-concept-gamma',
    'point-processing/threshold': 'section-concept-threshold',
    'point-processing/contrast': 'section-concept-contrast',
    'point-processing/bitplane': 'section-concept-bitplane'
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

    // Trigger specific initializations based on route
    if (view.startsWith('point-processing/')) {
      initConceptSimulation(view.split('/')[1]);
    } else if (view === 'playground' && window.Playground) {
      // Ensure playground is initialized and layouts are refreshed if needed
      if (!Playground.isInitialized) {
        Playground.init();
      }
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
    if (!window.Simulations) return;
    
    // Call the respective simulation init if it hasn't been done
    switch(concept) {
      case 'negatives':
        Simulations.initNegative();
        break;
      case 'log':
        Simulations.initLog();
        break;
      case 'gamma':
        Simulations.initGamma();
        break;
      case 'threshold':
        Simulations.initThreshold();
        break;
      case 'contrast':
        Simulations.initContrast();
        break;
      case 'bitplane':
        Simulations.initBitplane();
        break;
    }
  }

  /* ----------------------------------------------------------
   * Initialize Application
   * ---------------------------------------------------------- */

  function init() {
    // Theme
    initTheme();
    const themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) themeBtn.addEventListener('click', toggleTheme);

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
