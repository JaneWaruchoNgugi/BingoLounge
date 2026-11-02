"""Scratch Bingo with the bonus star: with chance P one of the 30 spots is a star instead of a number,
and the player marks any cell with it (the sim assumes the best cell). Prints return and hit rate."""
import random, sys
sys.path.insert(0, __file__.rsplit('/',1)[0])
from sim_scratch import LINES, CELLS, pay
def best(m, nm):
    b = pay(sum(all(k in m for k in L) for L in LINES), nm)
    for c in CELLS:
        if c in m: continue
        m2 = m | {c}
        b = max(b, pay(sum(all(k in m2 for k in L) for L in LINES), nm + 1))
    return b
def run(P, N=200000, S=30):
    tot = hits = 0
    for _ in range(N):
        star = random.random() < P
        called = random.sample(range(75), S - star)
        mine = [x for x in called if x < 24]
        m = {12} | {CELLS[x] for x in mine}
        p = best(m, len(mine)) if star else pay(sum(all(k in m for k in L) for L in LINES), len(mine))
        tot += p; hits += p > 0
    return tot / N, hits / N
for P in map(float, sys.argv[1:]):
    r, h = run(P); print(f'P={P}: return {r:.3f} hit {h:.3f}')
