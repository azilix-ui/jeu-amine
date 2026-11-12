"""Prépare les bruitages ElevenLabs pour le site.

Entrée : un dossier de MP3 téléchargés depuis ElevenLabs (nom « <début du prompt>_#<n>-<horodatage>.mp3 »)
et docs/sons/sons.json (nom du son -> prompt).
Sortie : jeux/sons/<nom>.mp3 (variante choisie, mono, silences coupés, niveau égalisé)
         jeux/sons/variantes/<nom>-<n>.mp3 (les 4 variantes, pour la page d'écoute)
Choix : docs/sons/choix.json (nom -> numéro de variante, 1 par défaut).

python3 docs/sons/prepare.py <dossier des mp3>
"""
import json, os, re, subprocess, sys, glob

ICI = os.path.dirname(os.path.abspath(__file__))
SITE = os.path.join(ICI, '..', '..', 'jeux', 'sons')
src = sys.argv[1]
sons = json.load(open(os.path.join(ICI, 'sons.json')))
cf = os.path.join(ICI, 'choix.json')
choix = json.load(open(cf)) if os.path.exists(cf) else {}
os.makedirs(os.path.join(SITE, 'variantes'), exist_ok=True)


def conv(entree, sortie, amb):
    if amb:   # ambiance en boucle : on garde tout, stéréo, niveau doux
        af = 'loudnorm=I=-24:TP=-3:LRA=11'
        args = ['-ac', '2', '-b:a', '96k']
    else:     # bruitage court : silences coupés, crête à -2 dB
        mx = MAX.get(nom_court(sortie), 4)
        af = ('loudnorm=I=-16:TP=-2:LRA=11,'
              'silenceremove=start_periods=1:start_threshold=-45dB,'
              'areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse,'
              f'atrim=0:{mx},afade=t=out:st={max(0, mx - .35):.2f}:d=0.35')
        args = ['-ac', '1', '-b:a', '80k']
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', entree, '-af', af, '-ar', '44100', *args, sortie], check=True)


# durée idéale (s) : sans choix manuel, on prend la variante la plus proche ; MAX coupe (fondu) les trop longues
CIBLE = {'saut': .5, 'atterrir': .3, 'piece': .8, 'gemme': 1.2, 'brique': .8, 'bonus': 1.5, 'ecrase': .5, 'aie': .8, 'feu': .8,
  'ressort': .7, 'lampe': 1.8, 'boss': 1.8, 'portail': 1.5, 'plouf': 1, 'chute': 1, 'victoire': 3, 'prendre': .4, 'poser': .4,
  'porte-ouvre': 1.5, 'porte-ferme': 1, 'eau': 2, 'croque': 1, 'gorgee': 1, 'doum': .8, 'tek': .4, 'miaou': .8, 'oiseau': 2,
  'habit': .8, 'etoile': 1.2}
MAX = {'eau': 2.5, 'oiseau': 2.5, 'victoire': 4, 'lampe': 2.5, 'boss': 2.5, 'chute': 1.5, 'porte-ouvre': 2.5, 'porte-ferme': 1.5,
  'croque': 1.5, 'habit': 1.5, 'gorgee': 1.5, 'doum': 1.2, 'tek': .6, 'plouf': 1.5, 'bonus': 1.8, 'portail': 1.8}


def nom_court(chemin):
    b = os.path.basename(chemin)[:-4]
    b = re.sub(r'-\d$', '', b) if '/variantes/' in chemin else b
    return b.split('-', 1)[1]


def duree(f):
    r = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f], capture_output=True, text=True)
    try: return float(r.stdout.strip())
    except ValueError: return 0


manque = []
for nom, prompt in sons:
    debut = re.sub(r'[^A-Za-z0-9]+', '_', prompt[:20])
    fichiers = {}
    for f in glob.glob(os.path.join(src, '*.mp3')):
        b = os.path.basename(f)
        m = re.match(r'(.+)_#(\d)-\d+\.mp3$', b)
        if m and re.sub(r'[^A-Za-z0-9]+', '_', m.group(1)) == debut:
            fichiers.setdefault(int(m.group(2)), f)
    if not fichiers:
        manque.append(nom); continue
    amb = '-amb-' in nom
    for n, f in sorted(fichiers.items()):
        conv(f, os.path.join(SITE, 'variantes', f'{nom}-{n}.mp3'), amb)
    court = nom.split('-', 1)[1]
    d = {k: duree(os.path.join(SITE, 'variantes', f'{nom}-{k}.mp3')) for k in fichiers}
    ok = [k for k in fichiers if d[k] > .05] or list(fichiers)
    n = choix.get(nom)
    if n not in ok:
        n = min(ok, key=lambda k: abs(d[k] - CIBLE.get(court, 1))) if court in CIBLE else min(ok)
    conv(fichiers[n], os.path.join(SITE, f'{nom}.mp3'), amb)
    choix[nom] = n
    print(nom, {k: round(v, 2) for k, v in d.items()}, 'choisie', n)

json.dump(choix, open(cf, 'w'), indent=1, ensure_ascii=False)
json.dump({k: choix[k] for k, _ in sons if k in choix}, open(os.path.join(SITE, 'choix.json'), 'w'), indent=1)   # pour la page d'écoute
if manque: print('MANQUANTS :', ', '.join(manque))
