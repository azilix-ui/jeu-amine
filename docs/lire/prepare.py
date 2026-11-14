"""Je lis ! : range les voix enregistrées avec ElevenLabs (14/11).
Entrée : un fichier JSON exporté depuis la page Text to Speech d'ElevenLabs (navigateur intégré) : {"<voix>/<clé>": "data:audio/mpeg;base64,…"}.
Pour chaque phrase : silence enlevé au début et à la fin, volume égalisé, mono 64 kb/s → amine/lire/voix/<voix>/<clé>.mp3,
puis amine/lire/voix.js = la liste des phrases disponibles pour chaque voix (lue par amine/je-lis.html).
Usage : python3 docs/lire/prepare.py <export.json> [<export2.json> …]"""
import sys, os, json, base64, subprocess, tempfile, glob
ICI = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(ICI, '..', '..', 'amine', 'lire', 'voix')
for f in sys.argv[1:]:
    D = json.load(open(f))
    for k, v in D.items():
        voix, cle = k.split('/', 1)
        if not (voix.isalnum() and cle.replace('-', '').isalnum()): continue
        os.makedirs(os.path.join(OUT, voix), exist_ok=True)
        with tempfile.NamedTemporaryFile(suffix='.mp3', delete=False) as t: t.write(base64.b64decode(v.split(',', 1)[1])); src = t.name
        dst = os.path.join(OUT, voix, cle + '.mp3')
        filtre = 'silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.05,areverse,silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.08,areverse,loudnorm=I=-16:TP=-1.5:LRA=11'
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-af', filtre, '-ac', '1', '-ar', '44100', '-b:a', '64k', dst], check=True)
        os.unlink(src)
dispo = {v: sorted(os.path.basename(x)[:-4] for x in glob.glob(os.path.join(OUT, v, '*.mp3'))) for v in sorted(os.listdir(OUT)) if os.path.isdir(os.path.join(OUT, v))}
open(os.path.join(OUT, '..', 'voix.js'), 'w', encoding='utf-8').write('// fait par docs/lire/prepare.py : les phrases enregistrées pour chaque voix de « Je lis ! »\nwindow.LIRE_VOIX = ' + json.dumps(dispo, separators=(',', ':')) + ';\n')
print({v: len(l) for v, l in dispo.items()})
