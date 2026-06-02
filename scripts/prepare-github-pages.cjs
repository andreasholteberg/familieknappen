const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, '..', 'dist');
const indexPath = path.join(distDir, 'index.html');

if (!fs.existsSync(indexPath)) {
  throw new Error('Fant ikke dist/index.html. Kjor expo export for GitHub Pages-forberedelse.');
}

fs.copyFileSync(indexPath, path.join(distDir, '404.html'));
fs.writeFileSync(path.join(distDir, '.nojekyll'), '');

console.log('GitHub Pages: laget 404.html fallback og .nojekyll.');
