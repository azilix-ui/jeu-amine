"""Montage des épisodes « Les fractions » : images Higgsfield + voix off + sous-titres mot à mot + titres jaunes + schémas exacts."""
import subprocess, re, os, json, unicodedata
D = os.path.dirname(os.path.abspath(__file__)); os.chdir(D); import sys; EP = sys.argv[1]; TMP = 'tmp' + EP
W, H, FPS = 1080, 1920, 30
GAP = 0.5

J = json.load(open('scripts.json'))[EP]
P = {
'1': (['01', '02', '03', '04', '05', '06', '06', '07', '08', '08', '09'],
      [None, 'e1-quart', 'e1-mots', None, 'e1-huit', 'e1-egal', 'e1-fois', 'e1-amplifier', 'e1-simplifier', 'e1-simplifier', None],
      [[('gâteau', 'L’AÏD', '4 enfants, 1 gâteau'), ('partager', 'COMMENT PARTAGER ?', '')],
       [('quart.', '1/4', 'UN QUART')],
       [('dénominateur', 'DÉNOMINATEUR', 'en bas'), ('numérateur', 'NUMÉRATEUR', 'en haut')],
       [('cousins', '8 ENFANTS', '1 seul gâteau')],
       [('deux', '2/8', 'DEUX HUITIÈMES')],
       [('même', '1/4 = 2/8', ''), ('égales.', 'FRACTIONS ÉGALES', 'même quantité')],
       [('multiplie', '× 2 EN HAUT ET EN BAS', '')],
       [('amplifier.', 'AMPLIFIER', ''), ('trois', '3/4 = 6/8 = 9/12', '')],
       [('six', 'IL RESTE 6/8', ''), ('divises', '÷ 2', 'en haut et en bas'), ('trois', '6/8 = 3/4', '')],
       [('simplifier', 'SIMPLIFIER', 'autant de gâteau')],
       [('Félicitations', 'BRAVO !', 'l’outil secret pour additionner')]],
      ['in', 'down', 'in', 'up', 'in', 'out', 'right', 'in', 'down', 'out', 'out'], 'les fractions égales', 'fractions-1-gateau-de-l-aid.mp4'),
'2': (['01', '02', '03', '04', '05', '06', '07', '07', '08', '08', '09'],
      [None, 'e2-cinquiemes', 'e2-regle', 'e2-question', 'e2-piege', 'e2-six', 'e2-amplifie', 'e2-somme', 'e2-huitiemes', 'e2-moins', None],
      [[('potager.', 'LE POTAGER DE JEDDI', ''), ('Quelle', 'QUELLE PART ?', '')],
       [('trois', '1/5 + 2/5 = 3/5', 'mêmes parts')],
       [('numérateurs.', 'HAUT + HAUT', 'le bas ne bouge pas')],
       [('moitié', '1/2 + 1/3 = ?', 'oignons et fèves')],
       [('taille.', 'PAS LA MÊME TAILLE', ''), ('cinquièmes.', '≠ 2/5', 'piège !')],
       [('six', 'EN 6 PARTS', '6 = 2 × 3')],
       [('moitié,', '1/2 = 3/6', ''), ('tiers,', '1/3 = 2/6', '')],
       [('cinq', '3/6 + 2/6 = 5/6', ''), ('dénominateur.', 'MÊME DÉNOMINATEUR', '')],
       [('quart', '1/4 + 3/8', ''), ('total', '= 5/8', '1/4 = 2/8')],
       [('soustraire,', 'SOUSTRAIRE', 'même règle'), ('moitié', '5/6 − 2/6 = 1/2', '')],
       [('Félicitations', 'BRAVO !', 'd’abord le même dénominateur')]],
      ['in', 'down', 'in', 'up', 'in', 'right', 'down', 'out', 'in', 'out', 'out'], 'additionner les fractions', 'fractions-2-potager-de-jeddi.mp4'),
'3': (['01', '02', '03', '04', '04', '04', '05', '05', '07', '08', '09'],
      [None, 'e3-fois', 'e3-dessin', 'e3-resultat', 'e3-regle', 'e3-regle', None, 'e3-verres', 'e3-inverse', 'e3-calcul', None],
      [[('citronnade.', 'LA CITRONNADE', ''), ('moitié', 'LA MOITIÉ DES 3/4', '')],
       [('demi.', '× 1/2', 'la moitié de'), ('fois', '1/2 × 3/4', '')],
       [('quatre', '4 PARTS', ''), ('deux,', 'CHAQUE PART EN 2', '')],
       [('trois', '3/8 DE LITRE', '')],
       [('multiplier', 'MULTIPLIER', ''), ('haut', 'HAUT × HAUT, BAS × BAS', '')],
       [('besoin', 'PAS BESOIN !', 'du même dénominateur')],
       [('trois', '3/2 LITRES', ''), ('quart', 'VERRES DE 1/4', ''), ('Combien', '3/2 ÷ 1/4 = ?', '')],
       [('Diviser,', 'DIVISER', 'combien de fois…'), ('six', '6 VERRES', '')],
       [('inverse.', 'L’INVERSE', ''), ('quatre', '1/4 → 4/1', 'on retourne la fraction')],
       [('douze', '12/2 = 6', '')],
       [('Félicitations', 'BRAVO !', 'multiplier et diviser')]],
      ['in', 'down', 'in', 'in', 'out', 'up', 'in', 'out', 'in', 'right', 'out'], 'multiplier et diviser', 'fractions-3-citronnade.mp4')}
IM, DG, TT, MV, TAG, OUTF = P[EP]
SEG = [(f's{EP}/{k + 1:02d}.wav', f'img{EP}/{IM[k]}.png', J[k], TT[k], f'diag/{DG[k]}.png' if DG[k] else None, MV[k]) for k in range(len(J))]

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
def norm(w): return unicodedata.normalize('NFC', w).replace('\u00a0', ' ').split(' ')[0].strip('.,:;!?…«»"').lower()

os.makedirs(TMP, exist_ok=True)
events, t0, aud_parts, vid_parts = [], 0.0, [], []
for k, (af, img, text, titles, diag, mv) in enumerate(SEG):
    # audio : on enlève le blanc du début, on garde la fin (complète)
    sp, dur = speech(af)
    a0 = max(0, sp[0][0] - 0.08); a1 = min(dur, sp[-1][1] + 0.15)
    clip = f'{TMP}/a{k:02d}.wav'
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
        events.append(('Title', ts, te, '{\\fs%d\\fad(150,120)' % min(118, int(118 * 15 / max(1, len(big)))) + '\\t(0,180,\\fscx112\\fscy112)\\t(180,320,\\fscx100\\fscy100)}' + big))
        if small: events.append(('Small', ts + 0.1, te, '{\\fad(200,120)}' + small))
    # image animée (zoom lent) + schéma
    n = int(round(L * FPS)); seg = f'{TMP}/v{k:02d}.mp4'
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
subprocess.run(['ffmpeg', '-v', 'error', '-y'] + inputs + ['-filter_complex', ';'.join(flt), '-map', '[aout]', '-ar', '44100', f'{TMP}/voix.wav'], check=True)
open(f'{TMP}/list.txt', 'w').write(''.join(f"file '{os.path.basename(p)}'\n" for p in vid_parts))
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', f'{TMP}/list.txt', '-c', 'copy', f'{TMP}/images.mp4'], check=True)
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
lines = [f'Dialogue: 0,{ass_time(0)},{ass_time(TOTAL)},Tag,,0,0,0,,{{\\c&H0033D2FF&}}PAS À PAS{{\\c&H00FFFFFF&}} · ' + TAG + '']
for st, s, e, txt in events:
    pos = '{\\pos(540,1010)}' if st == 'Word' else ''
    lines.append(f'Dialogue: 1,{ass_time(s)},{ass_time(e)},{st},,0,0,0,,{pos}{txt}')
open(f'{TMP}/subs.ass', 'w').write(hdr + '\n'.join(lines) + '\n')
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', f'{TMP}/images.mp4', '-i', f'{TMP}/voix.wav', '-vf', f'ass={TMP}/subs.ass:fontsdir=/usr/share/fonts/truetype/google-fonts', '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', '-shortest', OUTF], check=True)
print('durée', round(TOTAL, 1), 's')
