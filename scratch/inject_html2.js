const fs = require('fs');
const file = 'index.html';

let content = fs.readFileSync(file, 'utf8');

// 1. Add Canny Card to grid
const highBoostCardTarget = `          <a href="#sharpen-playground" data-route="sharpen-playground" class="concept-card bg-white dark:bg-gray-800 rounded-2xl p-6 border border-slate-200 dark:border-gray-700 shadow-sm block relative overflow-hidden group hover:border-rose-300 dark:hover:border-rose-600 transition-all">
            <div class="w-12 h-12 rounded-xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <svg class="w-6 h-6 text-rose-600 dark:text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/>
              </svg>
            </div>
            <h3 class="text-lg font-bold text-slate-900 dark:text-white mb-2 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">التعزيز العالي</h3>
            <p class="text-sm text-slate-400 dark:text-slate-500 mb-1">High-Boost Filtering</p>
            <p class="text-xs text-slate-500 dark:text-slate-400">نسخة معززة من Unsharp Masking تعطي وزناً أكبر للصورة الأصلية. (يُمكن تجربته في المختبر)</p>
          </a>`;

const cannyCard = `          <a href="#sharpen-filters/canny" data-route="sharpen-filters/canny" class="concept-card bg-white dark:bg-gray-800 rounded-2xl p-6 border border-slate-200 dark:border-gray-700 shadow-sm block relative overflow-hidden group hover:border-rose-300 dark:hover:border-rose-600 transition-all">
            <div class="w-12 h-12 rounded-xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <svg class="w-6 h-6 text-rose-600 dark:text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5"/>
              </svg>
            </div>
            <h3 class="text-lg font-bold text-slate-900 dark:text-white mb-2 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">كشف حواف Canny</h3>
            <p class="text-sm text-slate-400 dark:text-slate-500 mb-1">Canny Edge Detection</p>
            <p class="text-xs text-slate-500 dark:text-slate-400">الخوارزمية الأكثر دقة لكشف الحواف بفضل التنعيم، والكبح، والعتبة المزدوجة.</p>
          </a>`;

content = content.replace(highBoostCardTarget, highBoostCardTarget + '\n' + cannyCard);

// 2. Update Sobel Concept
const sobelConceptTarget = `          <div class="mb-6">
            <div class="flex items-center justify-between mb-2">
              <label class="text-sm font-bold text-slate-700 dark:text-slate-300">حجم الـ Kernel</label>
              <span id="sim-sobel-val" class="text-sm font-mono text-rose-600 font-bold"></span>
            </div>
            <input type="range" id="sim-sobel-size" min="3" max="5" step="2" value="3" class="w-full">
          </div>`;

const sobelConceptNew = `          <div class="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div class="flex items-center justify-between mb-2">
                <label class="text-sm font-bold text-slate-700 dark:text-slate-300">حجم الـ Kernel</label>
              </div>
              <input type="range" id="sim-sobel-size" min="3" max="5" step="2" value="3" class="w-full">
            </div>
            <div>
              <label class="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 block">الاتجاه (Direction)</label>
              <select id="sim-sobel-axis" class="w-full px-3 py-1.5 border border-slate-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 outline-none text-sm text-slate-800 dark:text-slate-200">
                <option value="mag">المقدار (Magnitude)</option>
                <option value="x">أفقي (Sobel-X)</option>
                <option value="y">عمودي (Sobel-Y)</option>
                <option value="diag1">القطر الرئيسي (\\)</option>
                <option value="diag2">القطر الثانوي (/)</option>
              </select>
            </div>
            <div class="md:col-span-2 text-center mt-2">
              <span id="sim-sobel-val" class="text-sm font-mono text-rose-600 font-bold bg-rose-50 dark:bg-rose-900/30 px-3 py-1 rounded-full"></span>
            </div>
          </div>`;

content = content.replace(sobelConceptTarget, sobelConceptNew);

// 3. Add Canny Concept Section right before Playground
const playgroundSectionTarget = `  <!-- Playground -->
  <div id="section-sharpen-playground" class="section-view">`;

const cannyConceptSection = `  <!-- Canny Concept -->
  <div id="section-concept-canny" class="section-view">
    <section class="py-12 px-4 sm:px-6">
      <div class="max-w-4xl mx-auto">
        <button class="nav-btn mb-6 text-slate-500 hover:text-rose-600 flex items-center gap-2" data-route="sharpen-filters">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
          العودة للقائمة
        </button>
        <div class="bg-white dark:bg-gray-800 rounded-2xl p-6 md:p-10 shadow-sm border border-slate-200 dark:border-gray-700">
          <h2 class="text-3xl font-bold text-slate-900 dark:text-white mb-4">كشف حواف Canny</h2>
          <p class="text-slate-600 dark:text-slate-300 leading-relaxed mb-6">خوارزمية Canny (1st Derivative) تعتبر المعيار الذهبي في كشف الحواف. تتكون من 5 خطوات متتابعة: (1) تنعيم Gaussian لإزالة الضوضاء، (2) حساب تدرج Sobel (مقدار وزاوية)، (3) الكبح غير الأقصى لتنحيف الحواف العريضة، (4) العتبة المزدوجة لتصنيف الحواف كقوية أو ضعيفة، و (5) تتبع الحواف لربط الضعيفة بالقوية. هذه الخطوات تجعلها ممتازة في توفير حواف دقيقة متصلة وبأقل ضوضاء ممكنة.</p>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <div class="flex items-center justify-between mb-2">
                <label class="text-sm font-bold text-slate-700 dark:text-slate-300">الحد الأدنى (Low)</label>
                <span id="sim-canny-low-val" class="text-sm font-mono text-rose-600 font-bold"></span>
              </div>
              <input type="range" id="sim-canny-low" min="0" max="255" step="1" value="50" class="w-full">
            </div>
            <div>
              <div class="flex items-center justify-between mb-2">
                <label class="text-sm font-bold text-slate-700 dark:text-slate-300">الحد الأعلى (High)</label>
                <span id="sim-canny-high-val" class="text-sm font-mono text-rose-600 font-bold"></span>
              </div>
              <input type="range" id="sim-canny-high" min="0" max="255" step="1" value="150" class="w-full">
            </div>
          </div>
          <div id="sim-canny-container" class="mb-8"></div>
        </div>
      </div>
    </section>
  </div>

`;

content = content.replace(playgroundSectionTarget, cannyConceptSection + playgroundSectionTarget);

// 4. Update Playground dropdown
const playgroundDropdownTarget = `                <option value="highboost">فلترة التعزيز العالي (High-Boost)</option>
              </select>`;

const playgroundDropdownNew = `                <option value="highboost">فلترة التعزيز العالي (High-Boost)</option>
                <option value="canny">كشف الحواف (Canny Edge Detection)</option>
              </select>`;

content = content.replace(playgroundDropdownTarget, playgroundDropdownNew);

fs.writeFileSync(file, content);
console.log('HTML file updated successfully');
