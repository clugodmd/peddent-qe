import { copyFileSync, existsSync } from 'node:fs';

if (!existsSync('dist/index.html')) {
  throw new Error('dist/index.html not found; run vite build first');
}

// GitHub Pages serves 404.html for unknown direct routes (/quiz, /exam, etc.).
// Copy the freshly-built app shell so React/HashRouter can boot instead of showing GitHub's 404 page.
copyFileSync('dist/index.html', 'dist/404.html');
console.log('Created dist/404.html SPA fallback');
