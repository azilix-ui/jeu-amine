// Copie le site (pages HTML et dossiers des enfants) dans "dist" pour Hostinger.
// Aucun module à installer : le site est fait de simples fichiers HTML.
const fs = require('fs');
const path = require('path');
const root = __dirname, out = path.join(root, 'dist');
const skip = new Set(['dist', 'node_modules', '.git', 'build.js', 'package.json', 'README.md', '.gitignore']);
fs.rmSync(out, { recursive: true, force: true });
function copy(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const f of fs.readdirSync(src)) {
    if (skip.has(f)) continue;
    const s = path.join(src, f), d = path.join(dst, f);
    if (fs.statSync(s).isDirectory()) copy(s, d); else fs.copyFileSync(s, d);
  }
}
copy(root, out);
console.log('Site prêt dans dist/');
