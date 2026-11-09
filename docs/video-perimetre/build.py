"""Montage de « La clôture des chèvres » : images Higgsfield + voix off + sous-titres mot à mot + titres jaunes + schémas exacts."""
import subprocess, re, os, json, unicodedata
D = os.path.dirname(os.path.abspath(__file__)); os.chdir(D)
W, H, FPS = 1080, 1920, 30
GAP = 0.5
SEG = [  # audio, image, texte dit, titres [(mot déclencheur, texte, sous-texte)], schéma, sens du mouvement
  ('celine/v01.mp3', 'img/01.png', "Tu as trois chèvres et un champ carré. Mais chaque nuit, elles s'échappent.", [], None, 'in'),
  ('celine/v02.mp3', 'img/02.png', "Alors tu poses une clôture tout autour. Mais il te faut combien de grillage ?", [('combien', 'COMBIEN DE GRILLAGE ?', '')], None, 'up'),
  ('celine/v03.mp3', 'img/03.png', "Tu mesures un côté : vingt-cinq mètres. Et un carré a quatre côtés égaux.", [('vingt-cinq', '25 MÈTRES', 'un côté')], 'diag/carre1.png', 'right'),
  ('celine/04.mp3', 'img/04.png', "Quatre fois vingt-cinq : cent mètres de clôture. Ça s'appelle le périmètre : la longueur du tour.", [('Quatre', '4 × 25 = 100 m', ''), ('périmètre', 'PÉRIMÈTRE', 'la longueur du tour')], 'diag/carre4.png', 'out'),
  ('celine/05.mp3', 'img/05.png', "Mais ton voisin a un champ rectangulaire : trente mètres de long, quinze mètres de large.", [('trente', '30 m × 15 m', 'un rectangle')], 'diag/rect.png', 'down'),
  ('celine/06.mp3', 'img/06.png', "Alors tu fais le tour : trente, plus quinze, plus trente, plus quinze. Deux fois la longueur plus la largeur : quatre-vingt-dix mètres.", [('Deux', 'P = 2 × (L + l)', ''), ('quatre-vingt-dix', '90 MÈTRES', 'P = 2 × (30 + 15)')], 'diag/rectt.png', 'in'),
  ('celine/07.mp3', 'img/07.png', "Mais le jardin de ta tante a une forme en L, avec six côtés.", [('six', '6 CÔTÉS', 'une forme en L')], 'diag/L.png', 'left'),
  ('celine/08.mp3', 'img/08.png', "Alors, pas de formule magique : tu additionnes tous les côtés, un par un, sans en oublier.", [('additionnes', 'ON ADDITIONNE TOUT', '76 mètres')], 'diag/Lt.png', 'in'),
  ('celine/09.mp3', 'img/09.png', "Mais le chameau, lui, vit dans un enclos tout rond. Impossible de mesurer un côté !", [('rond', 'UN CERCLE', 'pas de côté…')], None, 'out'),
  ('celine/10.mp3', 'img/10.png', "Alors tu fais le tour avec une corde. Puis tu tends une autre corde à travers le cercle, en passant par le centre : c'est le diamètre.", [('diamètre', 'DIAMÈTRE', 'il passe par le centre')], 'diag/cercle-diam.png', 'in'),
  ('celine/11.mp3', 'img/11.png', "Surprise : la corde du tour est toujours un peu plus de trois fois plus longue que le diamètre. Trois virgule quatorze fois.", [('virgule', '3,14 × d', 'toujours !')], 'diag/deroule.png', 'right'),
  ('celine/12.mp3', 'img/09.png', "Ça s'appelle pi. Le périmètre d'un cercle, c'est pi fois le diamètre. Ici, dix mètres de diamètre : environ trente et un mètres de clôture.", [('pi.', 'π ≈ 3,14', 'le nombre pi'), ('fois', 'P = π × d', ''), ('environ', '≈ 31,4 MÈTRES', 'P = 3,14 × 10')], 'diag/cercle-formule.png', 'in'),
  ('celine/13.mp3', 'img/12.png', "Félicitations : tu as inventé le périmètre !", [('Félicitations', 'BRAVO !', 'tu as inventé le PÉRIMÈTRE')], None, 'out'),
]

def probe(f): return float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f], capture_output=True, text=True).stdout)
def speech(f, d=0.12, n=-38):
    out = subprocess.run(['ffmpeg', '-i', f, '-af', f'silencedetect=n={n}dB:d={d}', '-f', 'null', '-'], capture_output=True, text=True).stderr
    dur = probe(f); st = [float(x) for x in re.findall(r'silence_start: (-?[\d.]+)', out)]; en = [float(x) for x in re.findall(r'silence_end: ([\d.]+)', out)]
    sp = []; cur = 0.0
    for s, e in zip(st, en + [dur]):
        if s - cur > 0.06: sp.append([cur, s])
        cur = e
    if dur - cur > 0.06: sp.append([cur, dur])
    while len(sp) > 1 and sp[-1][1] - sp[-1][0] < 0.45 and sp[-1][0] - sp[-2][1] > 0.3: sp.pop()   # petit bruit ou « Voilà » final : on l'enlève
    return sp, dur

def ass_time(t): t = max(0, t); h = int(t // 3600); m = int(t % 3600 // 60); s = t % 60; return f'{h}:{m:02d}:{s:05.2f}'
def norm(w): return unicodedata.normalize('NFC', w).strip('.,:;!?…«»"').lower()

os.makedirs('tmp', exist_ok=True)
events, t0, aud_parts, vid_parts = [], 0.0, [], []
for k, (af, img, text, titles, diag, mv) in enumerate(SEG):
    # audio : on enlève le blanc du début, on garde la fin (complète)
    sp, dur = speech(af)
    a0 = max(0, sp[0][0] - 0.08); a1 = min(dur, sp[-1][1] + 0.15)
    clip = f'tmp/a{k:02d}.wav'
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', af, '-ss', f'{a0:.3f}', '-to', f'{a1:.3f}', '-ac', '1', '-ar', '44100', clip], check=True)
    sp = [[max(0, a - a0), b - a0] for a, b in sp]
    L = (a1 - a0) + GAP + (0.6 if k == 0 else 0) + (1.2 if k == len(SEG) - 1 else 0)
    lead = 0.6 if k == 0 else 0
    # mots : poids = longueur, placés sur le temps de parole (sans les blancs)
    words = []
    for w in text.split():
        if words and not any(ch.isalnum() for ch in w): words[-1] += '\u00a0' + w   # « : », « ! », « ? » restent collés au mot d'avant
        else: words.append(w)
    wts = [len(w) + 1 for w in words]; tot = sum(wts); talk = sum(b - a for a, b in sp)
    def at(x):   # x = temps de parole cumulé -> temps réel dans le clip
        for a, b in sp:
            if x <= b - a: return a + x
            x -= b - a
        return sp[-1][1]
    acc = 0; wt = []
    for w, p in zip(words, wts):
        s = at(acc / tot * talk); acc += p; e = at(acc / tot * talk); wt.append((w, s, e))
    for i, (w, s, e) in enumerate(wt):
        e2 = wt[i + 1][1] if i + 1 < len(wt) else e + 0.25
        events.append(('Word', t0 + lead + s, t0 + lead + min(e2, e + 0.35), w.replace('{', '').replace('}', '')))
    # titres : à partir du mot déclencheur, jusqu'au titre suivant ou la fin du plan
    tts = []
    for trig, big, small in titles:
        hit = next((s for w, s, e in wt if norm(w) == norm(trig)), 0.0) if trig else 0.0
        if trig and norm(trig) == 'trois' : pass
        tts.append([t0 + lead + hit, big, small])
    for i, (ts, big, small) in enumerate(tts):
        te = tts[i + 1][0] if i + 1 < len(tts) else t0 + L - 0.05
        events.append(('Title', ts, te, '{\\fad(150,120)\\t(0,180,\\fscx112\\fscy112)\\t(180,320,\\fscx100\\fscy100)}' + big))
        if small: events.append(('Small', ts + 0.1, te, '{\\fad(200,120)}' + small))
    # image animée (zoom lent) + schéma
    n = int(round(L * FPS)); seg = f'tmp/v{k:02d}.mp4'
    z = {'in': ('1.0+0.10*on/{n}', 'iw/2-(iw/zoom/2)', 'ih/2-(ih/zoom/2)'), 'out': ('1.10-0.10*on/{n}', 'iw/2-(iw/zoom/2)', 'ih/2-(ih/zoom/2)'),
         'up': ('1.08', 'iw/2-(iw/zoom/2)', '(ih-ih/zoom)*(1-on/{n})'), 'down': ('1.08', 'iw/2-(iw/zoom/2)', '(ih-ih/zoom)*on/{n}'),
         'left': ('1.08', '(iw-iw/zoom)*(1-on/{n})', 'ih/2-(ih/zoom/2)'), 'right': ('1.08', '(iw-iw/zoom)*on/{n}', 'ih/2-(ih/zoom/2)')}[mv]
    zz, xx, yy = [s.replace('{n}', str(n)) for s in z]
    base = f"[0:v]scale=2160:3840:flags=lanczos,zoompan=z='{zz}':x='{xx}':y='{yy}':d={n}:s={W}x{H}:fps={FPS},format=yuva420p[bg]"
    if diag:
        flt = base + f";[1:v]scale=780:-1,format=rgba,fade=t=in:st={lead + 0.5}:d=0.4:alpha=1[dg];[bg][dg]overlay=(W-w)/2:H-h-110:format=auto,format=yuv420p[v]"
        cmd = ['ffmpeg', '-v', 'error', '-y', '-loop', '1', '-i', img, '-loop', '1', '-i', diag, '-filter_complex', flt, '-map', '[v]', '-frames:v', str(n), '-c:v', 'libx264', '-preset', 'medium', '-crf', '19', '-pix_fmt', 'yuv420p', seg]
    else:
        cmd = ['ffmpeg', '-v', 'error', '-y', '-loop', '1', '-i', img, '-filter_complex', base + ';[bg]format=yuv420p[v]', '-map', '[v]', '-frames:v', str(n), '-c:v', 'libx264', '-preset', 'medium', '-crf', '19', '-pix_fmt', 'yuv420p', seg]
    subprocess.run(cmd, check=True)
    vid_parts.append(seg); aud_parts.append((clip, t0 + lead))
    t0 += n / FPS
TOTAL = t0
# la bande-son : chaque phrase posée à son instant
inputs, flt = [], []
for i, (c, at0) in enumerate(aud_parts):
    inputs += ['-i', c]; flt.append(f'[{i}:a]adelay={int(at0 * 1000)}|{int(at0 * 1000)},volume=1.6[a{i}]')
flt.append(''.join(f'[a{i}]' for i in range(len(aud_parts))) + f'amix=inputs={len(aud_parts)}:normalize=0,apad,atrim=0:{TOTAL:.3f},loudnorm=I=-16:TP=-1.5[aout]')
subprocess.run(['ffmpeg', '-v', 'error', '-y'] + inputs + ['-filter_complex', ';'.join(flt), '-map', '[aout]', '-ar', '44100', 'tmp/voix.wav'], check=True)
open('tmp/list.txt', 'w').write(''.join(f"file '{os.path.basename(p)}'\n" for p in vid_parts))
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', 'tmp/list.txt', '-c', 'copy', 'tmp/images.mp4'], check=True)
# sous-titres ASS
hdr = f"""[Script Info]
ScriptType: v4.00+
PlayResX: {W}
PlayResY: {H}
WrapStyle: 2

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Word,Poppins,92,&H00FFFFFF,&H00FFFFFF,&H00000000,&H64000000,1,0,0,0,100,100,0,0,1,7,3,5,60,60,0,1
Style: Title,Poppins,118,&H0033D2FF,&H0033D2FF,&H00202A44,&H64000000,1,0,0,0,100,100,0,0,1,8,4,8,50,50,230,1
Style: Small,Poppins,58,&H00FFFFFF,&H00FFFFFF,&H00202A44,&H64000000,1,0,0,0,100,100,0,0,1,6,2,8,50,50,375,1
Style: Tag,Poppins,40,&H00FFFFFF,&H00FFFFFF,&H00202A44,&H50000000,1,0,0,0,100,100,2,0,1,4,0,7,56,50,70,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
lines = [f'Dialogue: 0,{ass_time(0)},{ass_time(TOTAL)},Tag,,0,0,0,,{{\\c&H0033D2FF&}}PAS À PAS{{\\c&H00FFFFFF&}} · le périmètre']
for st, s, e, txt in events:
    pos = '{\\pos(540,1010)}' if st == 'Word' else ''
    lines.append(f'Dialogue: 1,{ass_time(s)},{ass_time(e)},{st},,0,0,0,,{pos}{txt}')
open('tmp/subs.ass', 'w').write(hdr + '\n'.join(lines) + '\n')
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', 'tmp/images.mp4', '-i', 'tmp/voix.wav', '-vf', 'ass=tmp/subs.ass:fontsdir=/usr/share/fonts/truetype/google-fonts', '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', '-shortest', 'perimetre-cloture-des-chevres-celine.mp4'], check=True)
print('durée', round(TOTAL, 1), 's')
