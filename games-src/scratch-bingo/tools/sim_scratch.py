"""Scratch Bingo odds: S called numbers out of 75 against a 5x5 card (free centre).
A ticket pays the better of its line prize and its match prize. Prints the hit rate and return."""
import random, sys
from collections import Counter
LINES=[[r*5+c for c in range(5)] for r in range(5)]+[[r*5+c for r in range(5)] for c in range(5)]+[[i*6 for i in range(5)],[i*4+4 for i in range(5)]]
CELLS=[i for i in range(25) if i!=12]
S=30
LINE_PAY={1:2.5,2:15,3:150}            # x stake by lines (3 = 3 or more)
MATCH_PAY={k:0.5+0.15*(k-10) for k in range(10,25)}   # x stake: 10 matched 0.5, +0.15 per extra number
def pay(lines,matches):
    lp=LINE_PAY[min(lines,3)] if lines else 0
    mp=MATCH_PAY.get(matches,0)
    return max(lp,mp)
def run(N=400000):
    c=Counter(); tot=0; hits=0
    for _ in range(N):
        called=random.sample(range(75),S)
        mine=[x for x in called if x<24]
        m={12}|{CELLS[x] for x in mine}
        nl=sum(all(k in m for k in L) for L in LINES)
        p=pay(nl,len(mine)); tot+=p; hits+=p>0; c[p]+=1
    return tot/N,hits/N,{k:v/N for k,v in sorted(c.items())}
if __name__=='__main__':
    r,h,d=run(); print('return %.3f  hit rate %.3f'%(r,h)); print(' '.join(f'x{k}:{v:.4f}' for k,v in d.items()))
