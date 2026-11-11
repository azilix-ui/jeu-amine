"""Découpe une prise en N phrases aux N-1 plus grands silences ; dit si le découpage est sûr."""
import subprocess, re, sys, json, os
def segs(f, n=-40, d=0.08):
    out = subprocess.run(['ffmpeg', '-i', f, '-af', f'silencedetect=n={n}dB:d={d}', '-f', 'null', '-'], capture_output=True, text=True).stderr
    dur = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f], capture_output=True, text=True).stdout)
    st = [float(x) for x in re.findall(r'silence_start: (-?[\d.]+)', out)]; en = [float(x) for x in re.findall(r'silence_end: ([\d.]+)', out)]
    sp = []; cur = 0.0
    for s, e in zip(st, en + [dur]):
        if s - cur > 0.05: sp.append([cur, s])
        cur = e
    if dur - cur > 0.05: sp.append([cur, dur])
    return sp, dur
def split(f, names, outdir):
    sp, dur = segs(f)
    merged = []
    while len(sp) > len(names):
        g = min(range(len(sp) - 1), key=lambda i: sp[i + 1][0] - sp[i][1]); merged.append(sp[g + 1][0] - sp[g][1]); sp[g][1] = sp[g + 1][1]; del sp[g + 1]
    kept = [sp[i + 1][0] - sp[i][1] for i in range(len(sp) - 1)]
    ok = len(sp) == len(names) and (not merged or not kept or min(kept) > 1.4 * max(merged))
    info = dict(file=os.path.basename(f), n=len(sp), want=len(names), min_kept=round(min(kept), 2) if kept else None, max_merged=round(max(merged), 2) if merged else None, ok=ok)
    if ok:
        for (a, b), nm in zip(sp, names):
            s = max(0, a - 0.06); e = min(dur, b + 0.12)
            subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', f'{s:.3f}', '-t', f'{e - s:.3f}', '-i', f, '-af', f'afade=t=out:st={max(0, e - s - 0.06):.3f}:d=0.06', '-ac', '1', '-ar', '44100', '-b:a', '64k', os.path.join(outdir, nm + '.mp3')], check=True)
    return info
if __name__ == '__main__':
    print(json.dumps(split(sys.argv[1], json.loads(sys.argv[2]), sys.argv[3])))
