// Copie les pages du site dans le dossier "dist" (utilisé par Hostinger).
// Aucun module à installer : le site est fait de simples fichiers HTML.
const fs = require('fs');
const path = require('path');
const out = path.join(__dirname, 'dist');
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out);
const files = fs.readdirSync(__dirname).filter(f => f.endsWith('.html'));
for (const f of files) fs.copyFileSync(path.join(__dirname, f), path.join(out, f));
console.log('Site prêt dans dist/ :', files.join(', '));
