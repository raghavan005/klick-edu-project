import fs from 'fs';

function updateFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace background colors
  content = content.replace(/\bbg-white\b(?! dark:bg-slate-800)/g, 'bg-white dark:bg-slate-800');
  content = content.replace(/\bbg-slate-50\b(?! dark:bg-slate-900)/g, 'bg-slate-50 dark:bg-slate-900');
  content = content.replace(/\bbg-slate-100\b(?! dark:bg-slate-800)/g, 'bg-slate-100 dark:bg-slate-800');
  content = content.replace(/\bhover:bg-slate-50\b(?! dark:hover:bg-slate-700)/g, 'hover:bg-slate-50 dark:hover:bg-slate-700');
  content = content.replace(/\bhover:bg-slate-100\b(?! dark:hover:bg-slate-700)/g, 'hover:bg-slate-100 dark:hover:bg-slate-700');
  
  // Replace border colors
  content = content.replace(/\bborder-slate-100\b(?! dark:border-slate-700)/g, 'border-slate-100 dark:border-slate-700');
  content = content.replace(/\bborder-slate-200\b(?! dark:border-slate-700)/g, 'border-slate-200 dark:border-slate-700');
  content = content.replace(/\bborder-slate-300\b(?! dark:border-slate-600)/g, 'border-slate-300 dark:border-slate-600');
  content = content.replace(/\bdivide-slate-100\b(?! dark:divide-slate-700)/g, 'divide-slate-100 dark:divide-slate-700');
  content = content.replace(/\bdivide-slate-200\b(?! dark:divide-slate-700)/g, 'divide-slate-200 dark:divide-slate-700');

  // Replace text colors
  content = content.replace(/\btext-slate-950\b(?! dark:text-slate-50)/g, 'text-slate-950 dark:text-slate-50');
  content = content.replace(/\btext-slate-900\b(?! dark:text-slate-50)/g, 'text-slate-900 dark:text-slate-50');
  content = content.replace(/\btext-slate-800\b(?! dark:text-slate-100)/g, 'text-slate-800 dark:text-slate-100');
  content = content.replace(/\btext-slate-700\b(?! dark:text-slate-200)/g, 'text-slate-700 dark:text-slate-200');
  content = content.replace(/\btext-slate-600\b(?! dark:text-slate-300)/g, 'text-slate-600 dark:text-slate-300');
  content = content.replace(/\btext-slate-500\b(?! dark:text-slate-400)/g, 'text-slate-500 dark:text-slate-400');
  content = content.replace(/\btext-slate-400\b(?! dark:text-slate-500)/g, 'text-slate-400 dark:text-slate-500');
  content = content.replace(/\btext-slate-300\b(?! dark:text-slate-600)/g, 'text-slate-300 dark:text-slate-600');

  // Placeholder
  content = content.replace(/\bplaceholder-slate-400\b(?! dark:placeholder-slate-500)/g, 'placeholder-slate-400 dark:placeholder-slate-500');

  fs.writeFileSync(filePath, content);
}

['src/App.tsx', 'src/components/LeadDetailsModal.tsx', 'src/components/LeadEditModal.tsx'].forEach(updateFile);
