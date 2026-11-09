import json, subprocess, os, sys
sys.path.insert(0, '../eg'); import split2, align
S = json.load(open('scripts.json'))
for line in open('urls.txt'):
    idx, u = line.split(); idx = int(idx); ep, k = idx // 100, idx % 100
    f = f'takes/{idx}.mp3'
    if not os.path.exists(f): subprocess.run(['curl', '-sS', '-o', f, u], check=True)
    L = S[str(ep)][k:k + 4]; n = len(L) + 1   # + « Voilà »
    sp, d = split2.segs(f, n=-42, d=0.1)
    raw = len(sp)
    res = align.align(sp, L + ['Voilà.'])
    if not res: print(idx, 'MANQUE', raw, n); continue
    sp, cost = res
    gaps = [round(sp[i + 1][0] - sp[i][1], 2) for i in range(len(sp) - 1)]
    r = [(b - a) / (0.6 + 0.055 * len(x)) for x, (a, b) in zip(L, sp)]
    print(idx, 'ratios', ' '.join('%.2f' % v for v in r), 'gaps', gaps, 'voila', round(sp[-1][1] - sp[-1][0], 2))
    os.makedirs(f'ep{ep}', exist_ok=True)
    for j, ((a, b), x) in enumerate(zip(sp, L)):
        s = max(0, a - 0.05); e = min(d, b + 0.15)
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', f'{s:.3f}', '-t', f'{e - s:.3f}', '-i', f, '-af', f'afade=t=out:st={max(0, e - s - 0.06):.3f}:d=0.06', '-ac', '1', '-ar', '44100', f'ep{ep}/{k + j + 1:02d}.wav'], check=True)
