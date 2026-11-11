"""Découpe les prises « une phrase + … Voilà » : on garde la phrase, on enlève « Voilà » et les petits bruits."""
import split2, json, os, subprocess
S = json.load(open('scripts.json'))
for ep in '123':
  os.makedirs(f's{ep}', exist_ok=True)
  for k, x in enumerate(S[ep]):
    f = f'single/{ep}{k+1:02d}.mp3'; sp, d = split2.segs(f, n=-42, d=0.1)
    while sp[-1][1] - sp[-1][0] < 0.2: sp.pop()
    v = sp.pop()                                                       # « Voilà »
    if sp[-1][1] - sp[-1][0] < 0.3 and v[0] - sp[-1][1] < 0.6: sp.pop()                          # « Voi- » coupé en deux
    while sp[-1][1] - sp[-1][0] < 0.12: sp.pop()                       # souffle
    a = max(0, sp[0][0] - 0.05); e = min(d, sp[-1][1] + 0.15)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', f'{a:.3f}', '-t', f'{e-a:.3f}', '-i', f, '-af', f'afade=t=out:st={max(0, e-a-0.06):.3f}:d=0.06', '-ac', '1', '-ar', '44100', f's{ep}/{k+1:02d}.wav'], check=True)
    print(ep, k + 1, 'ratio %.2f' % ((sp[-1][1] - sp[0][0]) / (0.6 + 0.055 * len(x))), 'fin', round(sp[-1][1], 2))
