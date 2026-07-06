const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

// Replace PixelCard colors
content = content.replace('colors="#f8fafc,#f1f5f9,#e2e8f0"', 'colors={isDark ? "#0f172a,#1e293b,#334155" : "#f8fafc,#f1f5f9,#e2e8f0"}');
content = content.replace('colors="#e0f2fe,#bae6fd,#7dd3fc"', 'colors={isDark ? "#0c4a6e,#075985,#0369a1" : "#e0f2fe,#bae6fd,#7dd3fc"}');
content = content.replace('colors="#fef3c7,#fde68a,#fcd34d"', 'colors={isDark ? "#78350f,#92400e,#b45309" : "#fef3c7,#fde68a,#fcd34d"}');
content = content.replace('colors="#f3e8ff,#e9d5ff,#d8b4fe"', 'colors={isDark ? "#581c87,#6b21a8,#7e22ce" : "#f3e8ff,#e9d5ff,#d8b4fe"}');
content = content.replace('colors="#d1fae5,#a7f3d0,#6ee7b7"', 'colors={isDark ? "#064e3b,#065f46,#047857" : "#d1fae5,#a7f3d0,#6ee7b7"}');
content = content.replace('colors="#ffe4e6,#fecdd3,#fda4af"', 'colors={isDark ? "#881337,#9f1239,#be123c" : "#ffe4e6,#fecdd3,#fda4af"}');

fs.writeFileSync('src/App.tsx', content);
