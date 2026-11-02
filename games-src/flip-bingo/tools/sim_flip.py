"""Flip Bingo balance check. Board: 40 tiles = your 24 card numbers + decoys + C cracks.
Pot = stake x R x prod (24-i+C)/(24-i) over hits so far (fair at every flip, like mines), lost on a crack.
Each completed line banks LINE[C] x stake at once (kept even on a crack).
Prints the return of 'collect after h hits' strategies and of 'never collect'."""
import random
LINES=[[r*5+c for c in range(5)] for r in range(5)]+[[r*5+c for r in range(5)] for c in range(5)]+[[i*6 for i in range(5)],[i*4+4 for i in range(5)]]
CELLS=[i for i in range(25) if i!=12]
R=0.90; LEVELS={1:0.03,3:0.25,5:1.0}
def mult(h,C):
    m=R
    for i in range(h): m*=(24-i+C)/(24-i)
    return m
def play(C,stop):
    items=list(range(24))+['d']*(16-C)+['X']*C; random.shuffle(items)
    marked={12}; h=0; nl=0; bank=0.0
    for it in items:
        if h>=stop: return bank+mult(h,C)
        if it=='X': return bank
        if it=='d': continue
        marked.add(CELLS[it]); h+=1
        k=sum(all(c in marked for c in L) for L in LINES)
        bank+=(k-nl)*LEVELS[C]; nl=k
    return bank+mult(h,C)
if __name__=='__main__':
    N=200000
    for C in LEVELS:
        print(f'cracks {C} (line bonus x{LEVELS[C]}):', ', '.join(f'stop@{s}:{sum(play(C,s) for _ in range(N))/N:.3f}' for s in (1,3,6,10,15,24)))
        print('   pot after 5/10/15 hits: x%.2f x%.2f x%.2f'%(mult(5,C),mult(10,C),mult(15,C)))
