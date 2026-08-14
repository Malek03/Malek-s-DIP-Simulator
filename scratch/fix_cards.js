const fs = require('fs');
const file = 'index.html';

let content = fs.readFileSync(file, 'utf8');

// Fix Prewitt Card
content = content.replace(
  '<a href="#sharpen-playground" data-route="sharpen-playground" class="concept-card bg-white dark:bg-gray-800 rounded-2xl p-6 border border-slate-200 dark:border-gray-700 shadow-sm block relative overflow-hidden group hover:border-rose-300 dark:hover:border-rose-600 transition-all">\n            <div class="w-12 h-12 rounded-xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">\n              <span class="text-xl font-bold text-rose-600 dark:text-rose-400">P</span>\n            </div>\n            <h3 class="text-lg font-bold text-slate-900 dark:text-white mb-2 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">فلتر بريويت</h3>\n            <p class="text-sm text-slate-400 dark:text-slate-500 mb-1">Prewitt Filter</p>\n            <p class="text-xs text-slate-500 dark:text-slate-400">مشابه لفلتر سوبل ولكن بأوزان متساوية. (يُمكن تجربته مباشرة في المختبر)</p>\n          </a>',
  '<a href="#sharpen-filters/prewitt" data-route="sharpen-filters/prewitt" class="concept-card bg-white dark:bg-gray-800 rounded-2xl p-6 border border-slate-200 dark:border-gray-700 shadow-sm block relative overflow-hidden group hover:border-rose-300 dark:hover:border-rose-600 transition-all">\n            <div class="w-12 h-12 rounded-xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">\n              <span class="text-xl font-bold text-rose-600 dark:text-rose-400">P</span>\n            </div>\n            <h3 class="text-lg font-bold text-slate-900 dark:text-white mb-2 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">فلتر بريويت</h3>\n            <p class="text-sm text-slate-400 dark:text-slate-500 mb-1">Prewitt Filter</p>\n            <p class="text-xs text-slate-500 dark:text-slate-400">مشابه لفلتر سوبل ولكن بأوزان متساوية.</p>\n          </a>'
);

// Fix High-Boost Card Text (href was already fixed by inject_html3.js)
content = content.replace(
  '<p class="text-xs text-slate-500 dark:text-slate-400">امتداد لتقنية Unsharp Masking يُعطي وزناً أكبر للصورة الأصلية. (يُمكن تجربته مباشرة في المختبر)</p>',
  '<p class="text-xs text-slate-500 dark:text-slate-400">امتداد لتقنية Unsharp Masking يُعطي وزناً أكبر للصورة الأصلية.</p>'
);

// Oh wait, what was the exact text of High-Boost card? 
// Let's use regex to remove "(يُمكن تجربته مباشرة في المختبر)" from any paragraph
content = content.replace(/ \(\s*يُمكن تجربته مباشرة في المختبر\s*\)/g, '');

fs.writeFileSync(file, content);
console.log('index.html cards fixed');
