const fs = require('fs');
const htmlFile = 'index.html';
const sharpenHtmlFile = 'scratch/sharpen_html.txt';

let content = fs.readFileSync(htmlFile, 'utf8');
const sharpenHtml = fs.readFileSync(sharpenHtmlFile, 'utf8');

content = content.replace('  <!-- Full Screen Matrices Modal -->', sharpenHtml + '\n  <!-- Full Screen Matrices Modal -->');

const scripts = `  <!-- Sharpening Filters Scripts -->
  <script src="js/sharpen-processing.js"></script>
  <script src="js/sharpen-codegen.js"></script>
  <script src="js/sharpen-simulations.js"></script>
  <script src="js/sharpen-playground.js"></script>

  <script src="js/ui-enhancements.js"></script>`;

content = content.replace('  <script src="js/ui-enhancements.js"></script>', scripts);

// Now the card
const activeCard = `          <!-- Card 5: Sharpening Filters (Active) -->
          <a href="#sharpen-filters" data-route="sharpen-filters" class="concept-card bg-white dark:bg-gray-800 rounded-2xl p-6 border border-slate-200 dark:border-gray-700 shadow-sm cursor-pointer block relative overflow-hidden group hover:border-rose-300 dark:hover:border-rose-600 transition-all">
            <div class="absolute top-4 left-4">
              <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-medium">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
                متاح الآن
              </span>
            </div>
            <div class="w-12 h-12 rounded-xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <svg class="w-6 h-6 text-rose-500/80 dark:text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg>
            </div>
            <h3 class="text-lg font-bold text-slate-900 dark:text-white mb-2 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">فلاتر الحدة</h3>
            <p class="text-sm text-slate-400 dark:text-slate-500 mb-1">Sharpening Filters</p>
            <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              فلاتر لابلاسيان، سوبل، وقناع عدم الوضوح لتحسين حواف وتفاصيل الصورة.
            </p>
          </a>

          <!-- Coming Soon 3: Morphological Processing -->`;

content = content.replace('          <!-- Coming Soon 3: Morphological Processing -->', activeCard);

fs.writeFileSync(htmlFile, content);
console.log('HTML updated successfully!');
