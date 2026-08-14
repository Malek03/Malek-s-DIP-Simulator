document.addEventListener('DOMContentLoaded', () => {
  function upgradeRangeInput(range) {
    // Prevent double wrapping
    if (range.dataset.upgraded) return;
    range.dataset.upgraded = "true";

    // Build UI wrapper
    const wrapper = document.createElement('div');
    wrapper.className = 'flex items-center gap-3 w-full mt-2 mb-2';

    // Minus Button
    const minusBtn = document.createElement('button');
    minusBtn.type = 'button';
    minusBtn.className = 'w-8 h-8 flex-shrink-0 flex items-center justify-center bg-indigo-100 dark:bg-indigo-900/30 hover:bg-indigo-200 dark:hover:bg-indigo-800/50 text-indigo-700 dark:text-indigo-400 rounded-lg transition-colors font-bold text-lg';
    minusBtn.textContent = '-';

    // Plus Button
    const plusBtn = document.createElement('button');
    plusBtn.type = 'button';
    plusBtn.className = 'w-8 h-8 flex-shrink-0 flex items-center justify-center bg-indigo-100 dark:bg-indigo-900/30 hover:bg-indigo-200 dark:hover:bg-indigo-800/50 text-indigo-700 dark:text-indigo-400 rounded-lg transition-colors font-bold text-lg';
    plusBtn.textContent = '+';

    // Number Input
    const numInput = document.createElement('input');
    numInput.type = 'number';
    numInput.className = 'w-20 flex-shrink-0 text-center bg-white dark:bg-gray-800 border border-slate-300 dark:border-gray-600 rounded-lg px-2 py-1 text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow';
    numInput.min = range.min || '0';
    if (range.hasAttribute('max')) numInput.max = range.max;
    numInput.step = range.step || '1';
    numInput.value = range.value;

    // Insert wrapper before range
    range.parentNode.insertBefore(wrapper, range);
    
    // Build the layout: [ - ] [ === Slider === ] [ + ] [ Number ]
    wrapper.appendChild(minusBtn);
    wrapper.appendChild(range); // Move range inside wrapper
    wrapper.appendChild(plusBtn);
    wrapper.appendChild(numInput);

    // Syncing logic
    function triggerRangeInput() {
      const event = new Event('input', { bubbles: true });
      range.dispatchEvent(event);
    }

    range.addEventListener('input', () => {
      numInput.value = range.value;
    });

    numInput.addEventListener('input', () => {
      let val = parseFloat(numInput.value);
      const min = parseFloat(range.min || '0');
      const max = range.hasAttribute('max') ? parseFloat(range.max) : Infinity;
      if (!isNaN(val)) {
        if (val < min) val = min;
        if (val > max) val = max;
        range.value = val;
        triggerRangeInput();
      }
    });

    // Correct out of bounds when user leaves the number input
    numInput.addEventListener('change', () => {
      let val = parseFloat(numInput.value);
      const min = parseFloat(range.min || '0');
      const max = range.hasAttribute('max') ? parseFloat(range.max) : Infinity;
      if (isNaN(val) || val < min) val = min;
      if (val > max) val = max;
      numInput.value = val;
      range.value = val;
      triggerRangeInput();
    });

    function stepSlider(direction) {
      let val = parseFloat(range.value);
      const step = parseFloat(range.step) || 1;
      const min = parseFloat(range.min || '0');
      const max = range.hasAttribute('max') ? parseFloat(range.max) : Infinity;

      val += direction * step;
      if (val < min) val = min;
      if (val > max) val = max;

      // Check step's decimal places to avoid float precision issues
      const stepStr = (range.step || '1').toString();
      let decimals = 0;
      if (stepStr.includes('.')) {
        decimals = stepStr.split('.')[1].length;
      }
      
      val = parseFloat(val.toFixed(decimals));
      
      range.value = val;
      numInput.value = val;
      triggerRangeInput();
    }

    minusBtn.addEventListener('click', () => stepSlider(-1));
    plusBtn.addEventListener('click', () => stepSlider(1));
  }

  // 1. Upgrade existing inputs on load
  document.querySelectorAll('input[type="range"]').forEach(upgradeRangeInput);

  // 2. Observe the DOM for dynamically added sliders (e.g. from innerHTML updates)
  const observer = new MutationObserver((mutations) => {
    let shouldUpgrade = [];
    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(node => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          // If the added node itself is a range input
          if (node.matches && node.matches('input[type="range"]')) {
            shouldUpgrade.push(node);
          }
          // Search within the added node
          if (node.querySelectorAll) {
            const ranges = node.querySelectorAll('input[type="range"]');
            ranges.forEach(r => shouldUpgrade.push(r));
          }
        }
      });
    });
    shouldUpgrade.forEach(upgradeRangeInput);
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
});
