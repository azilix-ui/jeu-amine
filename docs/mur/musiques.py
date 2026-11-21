"""Le studio vidéo du mur (21/11) : les « musiques libres » maison, composées et synthétisées ici (aucun échantillon extérieur,
donc libres de droits : © 2026 Famille Missaoui). 6 morceaux de 32 s, prêts à boucler sous une vidéo ou des photos animées.
Usage : python3 docs/mur/musiques.py  → mur/musique/<id>.mp3 (et la liste est dans mur/musique/liste.js, écrite à la main)."""
import os, subprocess, numpy as np
from scipy.signal import fftconvolve, butter, lfilter

SR = 44100
R = os.path.join(os.path.dirname(__file__), '..', '..'); D = os.path.join(R, 'mur', 'musique'); os.makedirs(D, exist_ok=True)
rng = np.random.default_rng(7)
hz = lambda m: 440 * 2 ** ((m - 69) / 12)

def env(n, a=.005, d=.0, s=1., r=.05, dur=None):
    t = np.arange(n) / SR; e = np.ones(n)
    na = max(1, int(a * SR)); e[:na] = np.linspace(0, 1, na)
    if d: nd = int(d * SR); e[na:na + nd] = np.linspace(1, s, len(e[na:na + nd])); e[na + nd:] = s
    nr = int(r * SR)
    if nr and nr < n: e[-nr:] *= np.linspace(1, 0, nr)
    return e
def lp(x, f): b, a = butter(2, min(.99, f / (SR / 2))); return lfilter(b, a, x)
def hp(x, f): b, a = butter(2, f / (SR / 2), 'high'); return lfilter(b, a, x)
def bp(x, f1, f2): b, a = butter(2, [f1 / (SR / 2), f2 / (SR / 2)], 'band'); return lfilter(b, a, x)

# ---------- les instruments ----------
def pluck(f, dur, bright=.5):   # guitare / ukulélé (Karplus-Strong, une période à la fois)
    n = int(dur * SR); p = max(2, int(SR / f)); buf = rng.uniform(-1, 1, p); blocs = []; k = .985 + bright * .012
    while sum(len(b) for b in blocs) < n: blocs.append(buf); buf = k * .5 * (buf + np.roll(buf, -1))
    return np.concatenate(blocs)[:n] * env(n, .002, r=.03) * .6
def boite(f, dur):   # boîte à musique / célesta
    n = int(max(dur, 1.2) * SR); t = np.arange(n) / SR
    return (np.sin(2 * np.pi * f * t) + .35 * np.sin(2 * np.pi * f * 4 * t) * np.exp(-t * 6)) * np.exp(-t * 2.8) * .45
def cloche(f, dur):
    n = int(max(dur, 1.6) * SR); t = np.arange(n) / SR
    return (np.sin(2 * np.pi * f * t) + .5 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t * 3) + .25 * np.sin(2 * np.pi * f * 5.4 * t) * np.exp(-t * 6)) * np.exp(-t * 1.8) * .3
def nappe(f, dur):   # cordes douces : 3 dents de scie désaccordées, filtrées
    n = int(dur * SR); t = np.arange(n) / SR; x = sum(((t * f * d) % 1) * 2 - 1 for d in (1, 1.004, .996)) / 3
    return lp(x, 1800) * env(n, .35, r=.4) * .22
def basse(f, dur):
    n = int(dur * SR); t = np.arange(n) / SR; x = np.sin(2 * np.pi * f * t) + .3 * np.sin(4 * np.pi * f * t)
    return x * env(n, .005, r=.06) * np.exp(-t * 1.5) * .5
def carre(f, dur, vib=0):   # le basson rigolo / le mizmar (anche)
    n = int(dur * SR); t = np.arange(n) / SR; ph = 2 * np.pi * f * t + (vib * np.sin(2 * np.pi * 5.5 * t) if vib else 0)
    x = np.sign(np.sin(ph)) * .5 + .5 * np.sin(ph); return lp(x, 2600) * env(n, .015, r=.05) * .22
def anche(f, dur):
    n = int(dur * SR); t = np.arange(n) / SR; v = .006 * np.sin(2 * np.pi * 5.8 * t) * np.clip(t * 3, 0, 1)
    ph = 2 * np.pi * f * np.cumsum(1 + v) / SR; x = sum(np.sin(k * ph) / k ** .8 for k in range(1, 9))
    return bp(x, 400, 4000) * env(n, .03, r=.06) * .16
def kick(): n = int(.35 * SR); t = np.arange(n) / SR; return np.sin(2 * np.pi * (50 + 90 * np.exp(-t * 30)) * t) * np.exp(-t * 9) * .9
def caisse(): n = int(.2 * SR); t = np.arange(n) / SR; return (hp(rng.normal(0, 1, n), 1200) * .5 + .4 * np.sin(2 * np.pi * 190 * t)) * np.exp(-t * 22) * .5
def clap():
    n = int(.25 * SR); t = np.arange(n) / SR; x = bp(rng.normal(0, 1, n), 900, 3500); e = np.exp(-t * 18)
    for d in (.0, .011, .022): e += np.where(t > d, np.exp(-(t - d) * 120), 0) * .6
    return x * e * .35
def charley(o=False): n = int((.25 if o else .05) * SR); t = np.arange(n) / SR; return hp(rng.normal(0, 1, n), 7000) * np.exp(-t * (12 if o else 70)) * .18
def doum(): n = int(.4 * SR); t = np.arange(n) / SR; return np.sin(2 * np.pi * (80 + 60 * np.exp(-t * 25)) * t) * np.exp(-t * 7) * .85
def tek(): n = int(.12 * SR); t = np.arange(n) / SR; return (bp(rng.normal(0, 1, n), 2500, 7000) * .6 + .3 * np.sin(2 * np.pi * 820 * t)) * np.exp(-t * 45) * .5
def tchik(): n = int(.08 * SR); t = np.arange(n) / SR; return hp(rng.normal(0, 1, n), 5000) * np.exp(-t * 60) * .15

def reverb(x, sec=1.4, mix=.18):
    n = int(sec * SR); ir = rng.normal(0, 1, n) * np.exp(-np.arange(n) / SR * 5 / sec); ir = lp(ir, 5000); ir /= np.sqrt((ir ** 2).sum())
    return x + mix * fftconvolve(x, ir)[:len(x)]

class Piste:
    def __init__(s, bpm, mesures, temps=4): s.b = 60 / bpm; s.n = int((mesures * temps * s.b + 3) * SR); s.x = np.zeros(s.n); s.temps = temps; s.mes = mesures
    def pose(s, beat, son, vol=1.):
        i = int(beat * s.b * SR); j = min(s.n, i + len(son));
        if i < s.n: s.x[i:j] += son[:j - i] * vol

def ecrit(nom, x, fin_s):
    x = x[:int(fin_s * SR)]; f = int(1.5 * SR); x[-f:] *= np.linspace(1, 0, f); x[:int(.01 * SR)] *= np.linspace(0, 1, int(.01 * SR))
    x = x / (np.abs(x).max() + 1e-9) * .89; x = np.tanh(x * 1.1) / np.tanh(1.1) * .92
    pcm = (x * 32767).astype(np.int16).tobytes()
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-f', 's16le', '-ar', str(SR), '-ac', '1', '-i', '-', '-ac', '2', '-b:a', '128k', os.path.join(D, nom + '.mp3')], input=pcm, check=True)
    print(nom, round(len(x) / SR, 1), 's')

ACC = { 'C':[60, 64, 67], 'G':[55, 59, 62], 'Am':[57, 60, 64], 'F':[53, 57, 60], 'Dm':[50, 53, 57], 'Em':[52, 55, 59], 'E':[52, 56, 59] }
def melodie(prog, rythme, tierce=0, haut=12, graine=0):
    """Une mélodie qui chante : sur chaque temps fort une note de l'accord, entre deux une note de la gamme (pentatonique)."""
    g = np.random.default_rng(graine); notes = []; penta = [0, 2, 4, 7, 9]
    for m, a in enumerate(prog):
        b0 = m * 4; ac = [n + haut for n in ACC[a]]
        for (d, l) in rythme[m % len(rythme)]:
            if d % 1 == 0: n = ac[(g.integers(0, 3) + tierce) % 3]
            else: n = 60 + haut + penta[g.integers(0, 5)] + (12 if g.random() < .2 else 0)
            notes.append((b0 + d, n, l))
    return notes

# 1 · Joyeux (ukulélé, claps, glockenspiel)
def joyeux():
    P = Piste(116, 16); prog = ['C', 'G', 'Am', 'F'] * 4
    for m, a in enumerate(prog):
        for k, d in enumerate([0, .5, 1, 1.5, 2, 2.5, 3, 3.5]):
            P.pose(m * 4 + d, sum(pluck(hz(n + 12), .35, .6) for n in ACC[a]) / 2.2, .55 if k % 2 else .8)
        P.pose(m * 4, basse(hz(ACC[a][0] - 12), .9)); P.pose(m * 4 + 2, basse(hz(ACC[a][0] - 12), .9), .8)
        P.pose(m * 4 + 1, clap()); P.pose(m * 4 + 3, clap())
        for d in range(8): P.pose(m * 4 + d / 2, charley(), .8)
        if m >= 4: P.pose(m * 4, kick(), .7); P.pose(m * 4 + 2, kick(), .6)
    if True:
        ry = [[(0, 1), (1, .5), (1.5, .5), (2, 1.5)], [(0, .5), (.5, .5), (1, 1), (2, 1), (3, .5), (3.5, .5)]]
        for (b, n, l) in melodie(prog[4:], ry, graine=3): P.pose(b + 16, boite(hz(n + 12), l * P.b), .55)
    ecrit('joyeux', reverb(P.x, 1.2, .12), 32)

# 2 · L'aventure (cordes, tambours, mineur)
def aventure():
    P = Piste(100, 13); prog = ['Am', 'F', 'C', 'G'] * 4
    for m, a in enumerate(prog[:13]):
        P.pose(m * 4, sum(nappe(hz(n), 4 * P.b + .3) for n in ACC[a]))
        for d in (0, 1.5, 2, 3, 3.5) if m >= 2 else (0, 2): P.pose(m * 4 + d, doum() if d in (0, 2) else tek(), .9)
        for d in range(8): P.pose(m * 4 + d / 2, basse(hz(ACC[a][0] - 12), .2), .5)
        if m >= 4:
            for d in range(4): P.pose(m * 4 + d, caisse() if d % 2 else kick(), .55)
    ry = [[(0, .75), (.75, .25), (1, 1), (2, .5), (2.5, .5), (3, 1)], [(0, 2), (2, 1), (3, 1)]]
    for (b, n, l) in melodie(prog[4:13], ry, haut=12, graine=11): P.pose(b + 16, anche(hz(n), l * P.b), .9)
    ecrit('aventure', reverb(P.x, 2, .25), 32)

# 3 · Tout doux (boîte à musique, berceuse à 3 temps)
def doux():
    P = Piste(84, 15, 3); prog = ['C', 'Am', 'F', 'G', 'C', 'Em', 'F', 'G'] * 2
    for m, a in enumerate(prog[:15]):
        ac = ACC[a]; b0 = m * 3
        P.pose(b0, basse(hz(ac[0] - 12), 2.4), .55)
        for k, n in enumerate([ac[0], ac[1], ac[2]]): P.pose(b0 + k, boite(hz(n + 12), 1), .35)
        if m >= 2:
            g = np.random.default_rng(m); n = ac[g.integers(0, 3)] + 24
            P.pose(b0, cloche(hz(n), 1.6), .55)
            if m % 2: P.pose(b0 + 2, cloche(hz(ac[(g.integers(0, 3))] + 24), 1), .4)
    ecrit('doux', reverb(P.x, 2.5, .3), 32)

# 4 · La fête (darbouka et mizmar, gamme hijaz : le rythme maqsoum D-T-T-D-T)
def fete():
    P = Piste(108, 14); HIJ = [0, 1, 4, 5, 7, 8, 10, 12]; tonique = 62
    for m in range(14):
        b0 = m * 4
        for d, s in [(0, 'D'), (.5, 'T'), (1.5, 'T'), (2, 'D'), (3, 'T')]: P.pose(b0 + d, doum() if s == 'D' else tek(), 1 if s == 'D' else .8)
        for d in range(8): P.pose(b0 + d / 2, tchik(), .9)
        P.pose(b0, basse(hz(tonique - 24), 1), .8); P.pose(b0 + 2, basse(hz(tonique - 24 + 7), 1), .6)
    g = np.random.default_rng(21); motif = []
    for m in range(4):
        pas = [(0, .5), (.5, .5), (1, .5), (1.5, .5), (2, 1), (3, .5), (3.5, .5)]
        deg = [g.integers(2, 7) for _ in pas]; deg[-1] = 0 if m % 2 else 4
        motif.append(list(zip(pas, deg)))
    for rep in range(2):
        for m, mot in enumerate(motif):
            for (d, l), k in mot: P.pose((4 + rep * 4 + m) * 4 + d, anche(hz(tonique + 12 + HIJ[k]), l * P.b * 1.05), .95)
    for m, mot in enumerate(motif[:2]):
        for (d, l), k in mot: P.pose((12 + m) * 4 + d, anche(hz(tonique + 12 + HIJ[k]), l * P.b * 1.05), .95)
    ecrit('fete', reverb(P.x, 1.1, .12), 32)

# 5 · Rigolo (basson sautillant, pizzicati)
def rigolo():
    P = Piste(126, 17); prog = ['C', 'C', 'G', 'G', 'F', 'C', 'G', 'C'] * 3
    for m, a in enumerate(prog[:17]):
        b0 = m * 4; ac = ACC[a]
        P.pose(b0, carre(hz(ac[0] - 12), .18), 1); P.pose(b0 + 1, carre(hz(ac[2] - 24), .18), .9); P.pose(b0 + 2, carre(hz(ac[0] - 12), .18), 1); P.pose(b0 + 3, carre(hz(ac[2] - 24), .18), .9)
        P.pose(b0 + 1, pluck(hz(ac[1] + 12), .2, .3), .7); P.pose(b0 + 3, pluck(hz(ac[2] + 12), .2, .3), .7)
        if m >= 2: P.pose(b0, kick(), .5); P.pose(b0 + 2, kick(), .4)
        for d in (1, 3): P.pose(b0 + d, tek(), .5)
    ry = [[(0, .5), (.5, .5), (1, .5), (2, .5), (2.5, .5), (3, .5)], [(0, .25), (.5, .25), (1, .25), (1.5, 1), (3, .5)]]
    for (b, n, l) in melodie(prog[4:17], ry, haut=12, graine=5): P.pose(b + 16, carre(hz(n), l * P.b * .7), .8)
    ecrit('rigolo', reverb(P.x, .9, .1), 32)

# 6 · Magique (arpèges, cloches, scintillements)
def magique():
    P = Piste(92, 13); prog = ['Am', 'F', 'C', 'E'] * 4
    for m, a in enumerate(prog[:13]):
        b0 = m * 4; ac = ACC[a] if a != 'E' else [52, 56, 59]
        P.pose(b0, sum(nappe(hz(n - 12), 4 * P.b + .5) for n in ac), .8)
        for k in range(8): P.pose(b0 + k / 2, boite(hz(ac[[0, 1, 2, 1][k % 4]] + 12 + (12 if k >= 4 else 0)), .5), .32)
        if m >= 4:
            g = np.random.default_rng(m)
            for _ in range(3): P.pose(b0 + g.integers(0, 8) / 2, cloche(hz(ac[g.integers(0, 3)] + 36), 1), .25)
    ecrit('magique', reverb(P.x, 3, .35), 32)

for f in (joyeux, aventure, doux, fete, rigolo, magique): f()
