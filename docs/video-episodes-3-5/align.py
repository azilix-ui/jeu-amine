"""Regroupe les morceaux de parole d'une prise en N phrases, au mieux des longueurs attendues (programmation dynamique)."""
import math
def align(sp, texts):
    n = len(texts); m = len(sp)
    if m < n: return None
    w = [len(t) + 8 for t in texts]                       # 8 : un peu de temps fixe par phrase
    speech = sum(b - a for a, b in sp); per = speech / sum(w)
    INF = 1e18; best = [[INF] * (m + 1) for _ in range(n + 1)]; prev = [[0] * (m + 1) for _ in range(n + 1)]
    best[0][0] = 0
    for i in range(1, n + 1):
        for j in range(i, m - (n - i) + 1):
            for k in range(i - 1, j):
                if best[i - 1][k] == INF: continue
                dur = sum(b - a for a, b in sp[k:j]); gap_in = sp[j - 1][1] - sp[k][0] - dur
                c = best[i - 1][k] + math.log(max(dur, .05) / (w[i - 1] * per)) ** 2 + 0.25 * gap_in + 1.5 * max(0, max([sp[q + 1][0] - sp[q][1] for q in range(k, j - 1)] or [0]) - 1.2)
                if c < best[i][j]: best[i][j] = c; prev[i][j] = k
    out = []; j = m
    for i in range(n, 0, -1):
        k = prev[i][j]; out.append([sp[k][0], sp[j - 1][1]]); j = k
    return out[::-1], best[n][m]
