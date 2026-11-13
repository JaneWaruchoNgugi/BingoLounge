import React, { useEffect, useRef, useState } from 'react';
import type { FieldProps } from '../shared/Shell';
import { colOf, letterOf } from '../shared/engine';
import { sfx } from '../shared/sfx';

// Ball shells follow the card's column colours: B red, I blue, N purple, G orange, O green.
const SHELL = [
  ['#ff8fd0', '#ff2fa8', '#8a0a55'],
  ['#9ae9ff', '#22c8ff', '#0a5a86'],
  ['#d4ff8a', '#7ee02a', '#2f6a06'],
  ['#ffc78a', '#ff8a1f', '#8a3a00'],
  ['#c6b0ff', '#8b5cff', '#3a1a94'],
];
const GAP = 950; // ms between drops
const COUNTDOWN = 3000;

interface Ball { i: number; n: number; x: number; y: number; vy: number; born: number; state: 'wait' | 'fall' | 'caught' | 'lost'; t: number; spin: number }
interface Pop { x: number; y: number; t: number; text: string; hit: boolean }

const mmss = (ms: number) => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};

export function CatchField({ state, reveal, lose }: FieldProps) {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const cb = useRef({ reveal, lose });
  cb.current = { reveal, lose };
  const target = useRef<number | null>(null);
  const keys = useRef({ l: false, r: false });
  const live = state.phase === 'playing';
  const total = state.tokens.length || 45;
  const [hud, setHud] = useState({ count: null as number | null, left: live ? COUNTDOWN + (total - 1) * GAP + 2500 : 0, dropped: 0 });
  // A blip for each count of the 3-2-1 before the balls drop, then one at each of the last ten seconds.
  useEffect(() => {
    if (live && hud.count != null && hud.count > 0) sfx.tick();
  }, [hud.count]);
  const secLeft = Math.ceil(hud.left / 1000);
  useEffect(() => {
    if (live && hud.count == null && secLeft > 0 && secLeft <= 10) sfx.tick();
  }, [secLeft]);

  useEffect(() => {
    const c = canvas.current!;
    const ctx = c.getContext('2d')!;
    let w = 0;
    let h = 0;
    const size = () => {
      const b = wrap.current!.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      w = b.width;
      h = b.height;
      c.width = Math.round(w * dpr);
      c.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    size();
    const ro = new ResizeObserver(size);
    ro.observe(wrap.current!);

    const onCard = new Set(state.card);
    let seed = state.roundId * 9973 + 17;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const balls: Ball[] = live
      ? state.tokens.map((t) => ({ i: t.i, n: t.n!, x: 0.1 + rnd() * 0.8, y: -0.1, vy: 0, born: COUNTDOWN + t.i * GAP, state: 'wait', t: 0, spin: rnd() * 0.6 - 0.3 }))
      : [];
    const sparks = Array.from({ length: 46 }, () => ({ x: rnd(), y: rnd(), s: 0.6 + rnd() * 1.6, v: 0.01 + rnd() * 0.03, p: rnd() * 6 }));
    const bokeh = Array.from({ length: 7 }, (_, k) => ({ x: rnd(), y: 0.15 + rnd() * 0.6, r: 14 + rnd() * 22, c: k % 5, p: rnd() * 6 }));
    const pops: Pop[] = [];
    let basket = 0.5;
    let clock = 0;
    let prev = performance.now();
    let raf = 0;
    let lastHud = '';

    const drawBall = (n: number, x: number, y: number, r: number, alpha = 1, rot = 0) => {
      const [hi, base, dark] = SHELL[colOf(n)];
      const hit = onCard.has(n);
      ctx.save();
      ctx.globalAlpha = alpha;
      // soft shadow / gold glow for numbers on your cards
      ctx.shadowColor = hit ? 'rgba(182, 255, 59, .95)' : 'rgba(0,0,0,.45)';
      ctx.shadowBlur = hit ? 22 : 10;
      ctx.shadowOffsetY = hit ? 0 : 4;
      const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r);
      g.addColorStop(0, hi);
      g.addColorStop(0.55, base);
      g.addColorStop(1, dark);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;
      if (hit) {
        ctx.strokeStyle = '#b6ff3b';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x, y, r + 2.5, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.translate(x, y);
      ctx.rotate(rot);
      const wg = ctx.createRadialGradient(-r * 0.15, -r * 0.2, r * 0.05, 0, 0, r * 0.64);
      wg.addColorStop(0, '#ffffff');
      wg.addColorStop(1, '#e8e4f2');
      ctx.fillStyle = wg;
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.62, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#16102a';
      ctx.font = `900 ${Math.round(r * (n > 9 ? 0.72 : 0.8))}px 'Plus Jakarta Sans', system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(n), 0, r * 0.05);
      ctx.rotate(-rot);
      // specular highlight
      ctx.fillStyle = 'rgba(255,255,255,.55)';
      ctx.beginPath();
      ctx.ellipse(-r * 0.42, -r * 0.55, r * 0.28, r * 0.14, -0.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    const drawBasket = (bx: number, rimY: number, bw: number) => {
      const bh = bw * 0.5;
      const rx = bw / 2;
      const ry = bw * 0.11;
      // floor glow + pedestal ring under the basket
      ctx.save();
      const fg = ctx.createRadialGradient(bx, rimY + bh + 6, 4, bx, rimY + bh + 6, bw * 0.9);
      fg.addColorStop(0, 'rgba(34, 230, 255, .45)');
      fg.addColorStop(1, 'rgba(34, 230, 255, 0)');
      ctx.fillStyle = fg;
      ctx.beginPath();
      ctx.ellipse(bx, rimY + bh + 6, bw * 0.9, bw * 0.16, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 47, 168, .8)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(bx, rimY + bh + 6, bw * 0.68, bw * 0.1, 0, 0, Math.PI * 2);
      ctx.stroke();
      // body
      ctx.beginPath();
      ctx.moveTo(bx - rx, rimY);
      ctx.bezierCurveTo(bx - rx, rimY + bh * 0.7, bx - rx * 0.78, rimY + bh, bx - rx * 0.6, rimY + bh);
      ctx.lineTo(bx + rx * 0.6, rimY + bh);
      ctx.bezierCurveTo(bx + rx * 0.78, rimY + bh, bx + rx, rimY + bh * 0.7, bx + rx, rimY);
      ctx.closePath();
      const bg = ctx.createLinearGradient(bx - rx, 0, bx + rx, 0);
      bg.addColorStop(0, '#a8620c');
      bg.addColorStop(0.35, '#f7c24a');
      bg.addColorStop(0.65, '#e9a52a');
      bg.addColorStop(1, '#94530a');
      ctx.fillStyle = bg;
      ctx.fill();
      ctx.save();
      ctx.clip();
      // weave: staggered rounded strands
      const rowH = bh / 5;
      const cellW = bw / 9;
      for (let row = 0; row < 6; row++) {
        for (let k = -1; k < 11; k++) {
          const x0 = bx - rx + k * cellW + (row % 2 ? cellW / 2 : 0);
          const y0 = rimY + row * rowH + 2;
          ctx.fillStyle = 'rgba(255, 235, 170, .32)';
          ctx.beginPath();
          ctx.roundRect(x0 + 1.5, y0, cellW - 3, rowH - 3, 3);
          ctx.fill();
          ctx.fillStyle = 'rgba(90, 45, 0, .28)';
          ctx.fillRect(x0 + 1.5, y0 + rowH - 4, cellW - 3, 1.5);
        }
      }
      ctx.restore();
      // rim
      const rg = ctx.createLinearGradient(0, rimY - ry, 0, rimY + ry);
      rg.addColorStop(0, '#ffe7a0');
      rg.addColorStop(1, '#c98416');
      ctx.fillStyle = rg;
      ctx.beginPath();
      ctx.ellipse(bx, rimY, rx + 4, ry + 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#5e3306';
      ctx.beginPath();
      ctx.ellipse(bx, rimY + 1, rx - 5, ry - 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    const frame = (now: number) => {
      const dt = Math.min(50, now - prev);
      prev = now;
      if (balls.length) clock += dt;
      const bw = Math.max(96, Math.min(170, w * 0.3));
      const rimY = h - bw * 0.5 - 34;
      const r = Math.max(18, Math.min(30, w * 0.058));
      const step = (dt / 1000) * 1.7;
      if (keys.current.l) basket -= step;
      if (keys.current.r) basket += step;
      if (target.current != null) basket += (target.current - basket) * Math.min(1, dt / 55);
      basket = Math.max(bw / 2 / w, Math.min(1 - bw / 2 / w, basket));
      const bx = basket * w;

      // stage
      const sg = ctx.createLinearGradient(0, 0, 0, h);
      sg.addColorStop(0, '#060a24');
      sg.addColorStop(0.6, '#0a1036');
      sg.addColorStop(1, '#1a0830');
      ctx.fillStyle = sg;
      ctx.fillRect(0, 0, w, h);
      // fan of light rays from the top
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (let k = 0; k < 9; k++) {
        const a = -0.9 + k * 0.225 + Math.sin(now / 4000 + k) * 0.03;
        ctx.fillStyle = `rgba(34, 230, 255, ${k % 2 ? 0.03 : 0.05})`;
        ctx.beginPath();
        ctx.moveTo(w / 2, -20);
        ctx.lineTo(w / 2 + Math.tan(a - 0.06) * h * 1.2, h);
        ctx.lineTo(w / 2 + Math.tan(a + 0.06) * h * 1.2, h);
        ctx.closePath();
        ctx.fill();
      }
      // spotlight that follows the basket
      const beam = ctx.createLinearGradient(0, 0, 0, rimY);
      beam.addColorStop(0, 'rgba(34, 230, 255, .0)');
      beam.addColorStop(0.25, 'rgba(34, 230, 255, .14)');
      beam.addColorStop(1, 'rgba(120, 245, 255, .3)');
      ctx.fillStyle = beam;
      ctx.beginPath();
      ctx.moveTo(bx - 16, 0);
      ctx.lineTo(bx + 16, 0);
      ctx.lineTo(bx + bw * 0.5, rimY);
      ctx.lineTo(bx - bw * 0.5, rimY);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      // bokeh balls in the background
      for (const b of bokeh) {
        const y = b.y * h + Math.sin(now / 1800 + b.p) * 6;
        const g = ctx.createRadialGradient(b.x * w, y, 0, b.x * w, y, b.r);
        g.addColorStop(0, SHELL[b.c][1] + '55');
        g.addColorStop(1, SHELL[b.c][1] + '00');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(b.x * w, y, b.r, 0, Math.PI * 2);
        ctx.fill();
      }
      // sparkles
      for (const s of sparks) {
        s.y -= (s.v * dt) / 1000;
        if (s.y < -0.02) s.y = 1.02;
        const tw = 0.35 + 0.65 * Math.abs(Math.sin(now / 600 + s.p));
        ctx.fillStyle = `rgba(150, 245, 255, ${0.55 * tw})`;
        ctx.beginPath();
        ctx.arc(s.x * w, s.y * h, s.s, 0, Math.PI * 2);
        ctx.fill();
      }
      // neon arcade grid floor scrolling towards the player
      {
        const hz = h * 0.6;
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 47, 168, .32)';
        ctx.lineWidth = 1;
        const off = (now / 1400) % 1;
        for (let k = 0; k < 9; k++) {
          const t = (k + off) / 9;
          const y = hz + (h - hz) * t * t;
          ctx.globalAlpha = 0.25 + 0.75 * t;
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(w, y);
          ctx.stroke();
        }
        ctx.globalAlpha = 0.6;
        for (let k = -8; k <= 8; k++) {
          ctx.beginPath();
          ctx.moveTo(w / 2 + k * w * 0.04, hz);
          ctx.lineTo(w / 2 + k * w * 0.22, h);
          ctx.stroke();
        }
        const hg = ctx.createLinearGradient(0, hz - 30, 0, hz + 4);
        hg.addColorStop(0, 'rgba(255, 47, 168, 0)');
        hg.addColorStop(1, 'rgba(255, 47, 168, .35)');
        ctx.globalAlpha = 1;
        ctx.fillStyle = hg;
        ctx.fillRect(0, hz - 30, w, 34);
        ctx.restore();
      }
      // stage floor
      ctx.fillStyle = 'rgba(34, 230, 255, .1)';
      ctx.beginPath();
      ctx.ellipse(w / 2, h + 10, w * 0.75, 60, 0, 0, Math.PI * 2);
      ctx.fill();

      let dropped = 0;
      for (const b of balls) {
        if (b.state === 'wait' && clock >= b.born) {
          b.state = 'fall';
          b.y = -r;
          b.vy = h * (0.36 + b.i * 0.004);
        }
        if (b.state !== 'wait') dropped++;
        if (b.state === 'fall') {
          b.y += (b.vy * dt) / 1000;
          const x = b.x * w;
          if (b.y + r * 0.3 >= rimY - 4 && b.y < rimY + 16 && Math.abs(x - bx) <= bw / 2 - r * 0.2) {
            b.state = 'caught';
            b.t = clock;
            sfx.catch();
            pops.push({ x: bx, y: rimY - 20, t: clock, text: `${letterOf(b.n)} ${b.n}`, hit: onCard.has(b.n) });
            cb.current.reveal(b.i);
          } else if (b.y - r > h) {
            b.state = 'lost';
            b.t = clock;
            sfx.miss();
            cb.current.lose(b.i);
          }
        }
      }
      // caught balls sink into the basket, behind its front
      for (const b of balls)
        if (b.state === 'caught' && clock - b.t < 280) {
          const k = (clock - b.t) / 280;
          drawBall(b.n, bx + (b.x * w - bx) * (1 - k), rimY + k * 14, r * (1 - k * 0.45), 1 - k * 0.6, b.spin * k);
        }
      drawBasket(bx, rimY, bw);
      for (const b of balls) if (b.state === 'fall') drawBall(b.n, b.x * w, b.y, r, 1, b.spin * (b.y / h) * 3);

      // idle preview, like the lobby art
      if (!live) {
        const bob = (k: number) => Math.sin(now / 700 + k) * 6;
        drawBall(28, w * 0.2, h * 0.36 + bob(1), r);
        drawBall(70, w * 0.5, h * 0.24 + bob(2), r * 1.35);
        drawBall(43, w * 0.8, h * 0.4 + bob(3), r * 1.05);
      }

      // "+B 12" pops above the basket
      for (let k = pops.length - 1; k >= 0; k--) {
        const p = pops[k];
        const age = clock - p.t;
        if (age > 900) {
          pops.splice(k, 1);
          continue;
        }
        ctx.globalAlpha = 1 - age / 900;
        ctx.fillStyle = p.hit ? '#b6ff3b' : '#ffffff';
        ctx.font = `800 ${p.hit ? 18 : 15}px 'Plus Jakarta Sans', system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(p.hit ? `${p.text} ✓` : p.text, p.x, p.y - age * 0.05);
        ctx.globalAlpha = 1;
      }

      // HUD, refreshed only when its text changes
      if (balls.length) {
        const last = balls[balls.length - 1];
        const end = last.state === 'wait' ? last.born + h / (h * (0.36 + last.i * 0.004)) * 1000 : last.state === 'fall' ? clock + ((h - last.y) / last.vy) * 1000 : clock;
        const count = clock < COUNTDOWN ? Math.ceil((COUNTDOWN - clock) / 1000) : null;
        const key = `${count}|${mmss(end - clock)}|${dropped}`;
        if (key !== lastHud) {
          lastHud = key;
          setHud({ count, left: end - clock, dropped });
        }
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    const vis = () => (prev = performance.now());
    document.addEventListener('visibilitychange', vis);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      document.removeEventListener('visibilitychange', vis);
    };
  }, []);

  const aim = (e: React.PointerEvent) => {
    const b = wrap.current!.getBoundingClientRect();
    target.current = (e.clientX - b.left) / b.width;
  };
  const caught = state.revealed.filter(Boolean).length;
  const missed = state.lost.filter(Boolean).length;

  return (
    <div className="field catch-field" ref={wrap}>
      <canvas
        ref={canvas}
        tabIndex={0}
        aria-label="Play area. Drag or use the arrow keys to move the basket"
        onPointerDown={(e) => {
          (e.target as HTMLElement).setPointerCapture(e.pointerId);
          aim(e);
        }}
        onPointerMove={(e) => (e.buttons || e.pointerType === 'mouse') && aim(e)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft') (keys.current.l = true), (target.current = null), e.preventDefault();
          if (e.key === 'ArrowRight') (keys.current.r = true), (target.current = null), e.preventDefault();
        }}
        onKeyUp={(e) => {
          if (e.key === 'ArrowLeft') keys.current.l = false;
          if (e.key === 'ArrowRight') keys.current.r = false;
        }}
      />
      <div className="hud">
        <div className="hud-box">
          <svg className="hud-ico" viewBox="0 0 32 32" aria-hidden="true">
            <circle cx="16" cy="18" r="11" fill="none" stroke="#22e6ff" strokeWidth="3" />
            <path d="M16 18V12M16 18l4 3" stroke="#22e6ff" strokeWidth="2.6" strokeLinecap="round" />
            <rect x="12" y="2" width="8" height="4" rx="1.5" fill="#22e6ff" />
          </svg>
          <div>
            <small>Time left</small>
            <b>{mmss(live ? hud.left : (total - 1) * GAP + COUNTDOWN + 2500)}</b>
          </div>
        </div>
        <div className="hud-box right">
          <svg className="hud-ico" viewBox="0 0 32 32" aria-hidden="true">
            <defs>
              <radialGradient id="hb" cx="35%" cy="30%">
                <stop offset="0" stopColor="#ff9be0" />
                <stop offset=".6" stopColor="#d23cb4" />
                <stop offset="1" stopColor="#7a1468" />
              </radialGradient>
            </defs>
            <circle cx="16" cy="16" r="14" fill="url(#hb)" />
            <circle cx="16" cy="16" r="8" fill="#fff" opacity=".9" />
          </svg>
          <div>
            <small>Balls in play</small>
            <b>
              {live || state.phase === 'done' ? (state.phase === 'done' ? total : hud.dropped) : 0} / {total}
            </b>
          </div>
        </div>
      </div>
      {(live || state.phase === 'done') && (
        <div className="hud-sub" aria-live="polite">
          <span>Caught {caught}</span>
          <span>Missed {missed}</span>
        </div>
      )}
      {live && hud.count != null && hud.count > 0 && (
        <div className="countdown" aria-live="polite">
          <b>{hud.count}</b>
          <span>Drag to move the basket</span>
        </div>
      )}
    </div>
  );
}
