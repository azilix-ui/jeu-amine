#!/usr/bin/env python3
"""Vérifie la syntaxe de TOUT le JavaScript du site (fichiers .js et scripts écrits dans les pages .html) avec node --check.
Ajouté le 21/11 après une panne du Jasmin (un commentaire // avait avalé la fin d'une ligne).
Usage : python3 docs/outils/verifie_js.py   (à lancer avant chaque commit qui touche du code)"""
import re, subprocess, sys, os, tempfile, glob
racine = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
mauvais = 0
def check(code, module, nom):
    global mauvais
    with tempfile.NamedTemporaryFile('w', suffix='.mjs' if module else '.js', delete=False) as f: f.write(code); t = f.name
    r = subprocess.run(['node', '--check', t], capture_output=True, text=True); os.unlink(t)
    if r.returncode:
        mauvais += 1; ligne = (re.search(r':(\d+)\n', r.stderr) or [None, '?'])[1]
        print(f'✗ {nom} (ligne {ligne}) : ' + (r.stderr.strip().splitlines() or ['?'])[-1 if 'Error' in r.stderr else 0][:160])
for p in sorted(glob.glob(os.path.join(racine, '**', '*.html'), recursive=True)):
    if '/node_modules/' in p or '/dist/' in p or '/lib/' in p: continue
    s = open(p, encoding='utf-8', errors='replace').read()
    for i, m in enumerate(re.finditer(r'<script([^>]*)>(.*?)</script>', s, re.S)):
        a, b = m.group(1), m.group(2)
        if 'src=' in a or not b.strip() or 'application/json' in a or 'ld+json' in a or 'text/template' in a: continue
        check(b, 'module' in a, os.path.relpath(p, racine) + f' (script {i}, ligne de page {s[:m.start(2)].count(chr(10)) + 1})')
for p in sorted(glob.glob(os.path.join(racine, '**', '*.js'), recursive=True)):
    if '/node_modules/' in p or '/dist/' in p or '/lib/' in p or p.endswith('.min.js'): continue
    s = open(p, encoding='utf-8', errors='replace').read()
    check(s, bool(re.search(r'^\s*(import|export)\s', s, re.M)), os.path.relpath(p, racine))
print('JavaScript : ' + ('tout est bon ✓' if not mauvais else f'{mauvais} problème(s)'))
sys.exit(1 if mauvais else 0)
