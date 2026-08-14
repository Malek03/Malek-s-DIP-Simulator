const fs = require('fs');
const file = 'index.html';

let content = fs.readFileSync(file, 'utf8');

// 1. Replace all Back Buttons in Sharpening sections
const oldBackButton1 = `<button class="nav-btn mb-6 text-slate-500 hover:text-rose-600 flex items-center gap-2" data-route="sharpen-filters">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
          العودة للقائمة
        </button>`;

const oldBackButton2 = `<button class="nav-btn mb-6 text-slate-500 hover:text-rose-600 flex items-center gap-2" 
data-route="sharpen-filters">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" 
stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
          العودة للقائمة
        </button>`;

const newBackButton = `<a href="#sharpen-filters" data-route="sharpen-filters" class="inline-flex items-center gap-2 text-sm text-rose-600 dark:text-rose-400 hover:text-rose-800 dark:hover:text-rose-300 mb-8 font-medium">
          <svg class="w-4 h-4 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg>
          العودة إلى فلاتر الحدة
        </a>`;

content = content.replace(new RegExp(oldBackButton1.replace(/[.*+?^$\\{\\}|()[\\]\\\\]/g, '\\\\$&'), 'g'), newBackButton);

// 2. Update "Go to Playground" button in Sharpen Filters overview
const oldBannerTarget = `<div class="mt-10 text-center">
          <a href="#sharpen-playground" data-route="sharpen-playground" class="inline-flex items-center justify-center px-8 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all gap-2 group">
            <svg class="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/>
            </svg>
            الدخول إلى المختبر الافتراضي
          </a>
        </div>`;

const newBannerTarget = `<div class="mt-12 bg-gradient-to-r from-rose-500 to-pink-600 rounded-2xl p-8 text-center text-white shadow-lg relative overflow-hidden">
          <div class="relative z-10">
            <h3 class="text-2xl font-bold mb-3">مختبر الحدة</h3>
            <p class="text-rose-100 mb-6 max-w-xl mx-auto">جرب جميع فلاتر الحدة وكشف الحواف مع إمكانية تعديل حجم الـ Kernel وتتبع القيم خطوة بخطوة.</p>
            <a href="#sharpen-playground" data-route="sharpen-playground" class="inline-flex items-center gap-2 px-6 py-3 bg-white text-rose-600 hover:bg-slate-50 font-bold rounded-xl shadow-md transition-all">
              الانتقال لمختبر الحدة
              <svg class="w-5 h-5 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
              </svg>
            </a>
          </div>
          <div class="absolute -top-24 -right-24 w-48 h-48 bg-white/10 rounded-full blur-2xl"></div>
          <div class="absolute -bottom-24 -left-24 w-48 h-48 bg-pink-900/20 rounded-full blur-2xl"></div>
        </div>`;

content = content.replace(oldBannerTarget, newBannerTarget);

// 3. Add Prewitt and High-boost Concept pages right after Sobel
const sobelEndTarget = `</div>
    </section>
  </div>

  <!-- Unsharp Masking Concept -->`;

const prewittConcept = `</div>
    </section>
  </div>

  <!-- Prewitt Concept -->
  <div id="section-concept-prewitt" class="section-view">
    <section class="py-12 px-4 sm:px-6">
      <div class="max-w-4xl mx-auto">
        ${newBackButton}
        <div class="bg-white dark:bg-gray-800 rounded-2xl p-6 md:p-10 shadow-sm border border-slate-200 dark:border-gray-700">
          <h2 class="text-3xl font-bold text-slate-900 dark:text-white mb-4">فلتر بريويت (Prewitt)</h2>
          <p class="text-slate-600 dark:text-slate-300 leading-relaxed mb-6">يشبه فلتر Prewitt فلتر Sobel إلى حد كبير حيث يستخدم المشتقة الأولى، لكنه يستخدم أوزاناً متساوية (بدل 2 في المركز). هذا يجعله أبسط من ناحية الحسابات ولكنه قد يكون أكثر حساسية للضوضاء قليلاً من Sobel. يتم تطبيقه بحجم 3×3 فقط عادةً.</p>
          
          <div class="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl mb-8 border border-slate-200 dark:border-slate-700/50">
            <div class="grid grid-cols-2 gap-4 text-center">
              <div>
                <p class="text-xs text-slate-500 mb-2">Prewitt X</p>
                <div class="font-mono text-sm">
                  [-1,  0,  1]<br>
                  [-1,  0,  1]<br>
                  [-1,  0,  1]
                </div>
              </div>
              <div>
                <p class="text-xs text-slate-500 mb-2">Prewitt Y</p>
                <div class="font-mono text-sm">
                  [-1, -1, -1]<br>
                  [ 0,  0,  0]<br>
                  [ 1,  1,  1]
                </div>
              </div>
            </div>
          </div>
          <div id="sim-prewitt-container" class="mb-8"></div>
        </div>
      </div>
    </section>
  </div>

  <!-- Unsharp Masking Concept -->`;

content = content.replace(sobelEndTarget, prewittConcept);

const unsharpEndTarget = `</div>
    </section>
  </div>

  <!-- Canny Concept -->`;

const highBoostConcept = `</div>
    </section>
  </div>

  <!-- High-Boost Concept -->
  <div id="section-concept-highboost" class="section-view">
    <section class="py-12 px-4 sm:px-6">
      <div class="max-w-4xl mx-auto">
        ${newBackButton}
        <div class="bg-white dark:bg-gray-800 rounded-2xl p-6 md:p-10 shadow-sm border border-slate-200 dark:border-gray-700">
          <h2 class="text-3xl font-bold text-slate-900 dark:text-white mb-4">التعزيز العالي (High-Boost)</h2>
          <p class="text-slate-600 dark:text-slate-300 leading-relaxed mb-6">يعتبر امتداداً لتقنية Unsharp Masking، حيث يُعطى وزن أكبر (A > 1) للصورة الأصلية المضروبة بالبكسل. الهدف هو تعزيز الحواف بقوة أكبر مع الحفاظ على وضوح الصورة وتفاصيلها الأساسية دون جعلها داكنة.</p>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <div class="flex items-center justify-between mb-2">
                <label class="text-sm font-bold text-slate-700 dark:text-slate-300">مستوى الضبابية (σ)</label>
                <span id="sim-highboost-sigma-val" class="text-sm font-mono text-rose-600 font-bold"></span>
              </div>
              <input type="range" id="sim-highboost-sigma" min="0.1" max="5.0" step="0.1" value="1.0" class="w-full">
            </div>
            <div>
              <div class="flex items-center justify-between mb-2">
                <label class="text-sm font-bold text-slate-700 dark:text-slate-300">معامل التعزيز (A)</label>
                <span id="sim-highboost-a-val" class="text-sm font-mono text-rose-600 font-bold"></span>
              </div>
              <input type="range" id="sim-highboost-a" min="1.0" max="5.0" step="0.1" value="1.5" class="w-full">
            </div>
          </div>
          <div id="sim-highboost-container" class="mb-8"></div>
        </div>
      </div>
    </section>
  </div>

  <!-- Canny Concept -->`;

content = content.replace(unsharpEndTarget, highBoostConcept);

// Wait! Prewitt card link update: it needs to link to #sharpen-filters/prewitt
content = content.replace(/href="#sharpen-playground" data-route="sharpen-playground"([^>]+)>[\s]*<div class="w-12 h-12[^>]+>[\s]*<svg[^>]+>[\s]*<path[^>]+>[\s]*<\/svg>[\s]*<\/div>[\s]*<h3[^>]+>فلتر بريويت/g, 'href="#sharpen-filters/prewitt" data-route="sharpen-filters/prewitt"$1>\n            <div class="w-12 h-12 rounded-xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">\n              <svg class="w-6 h-6 text-rose-600 dark:text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">\n                <path stroke-linecap="round" stroke-linejoin="round" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"></path>\n              </svg>\n            </div>\n            <h3 class="text-lg font-bold text-slate-900 dark:text-white mb-2 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">فلتر بريويت');

// High-Boost card link update: it needs to link to #sharpen-filters/highboost
content = content.replace(/href="#sharpen-playground" data-route="sharpen-playground"([^>]+)>[\s]*<div class="w-12 h-12[^>]+>[\s]*<svg[^>]+>[\s]*<path[^>]+>[\s]*<\/svg>[\s]*<\/div>[\s]*<h3[^>]+>التعزيز العالي/g, 'href="#sharpen-filters/highboost" data-route="sharpen-filters/highboost"$1>\n            <div class="w-12 h-12 rounded-xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">\n              <svg class="w-6 h-6 text-rose-600 dark:text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">\n                <path stroke-linecap="round" stroke-linejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path>\n              </svg>\n            </div>\n            <h3 class="text-lg font-bold text-slate-900 dark:text-white mb-2 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">التعزيز العالي');

fs.writeFileSync(file, content);
console.log('index.html updated successfully');
