import { useEffect, useRef, useState } from 'react';
import { getSound, getTheme, onSound, setSound, sfx, type SoundSettings as S } from './sfx';

/** The gear button and its panel: music, sound effects, volume and vibration. */
export function SoundSettings() {
  const [s, setS] = useState<S>(getSound());
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const theme = getTheme();
  useEffect(() => onSound(setS), []);
  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === 'Escape' : !box.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('pointerdown', close);
      document.removeEventListener('keydown', close);
    };
  }, [open]);

  const row = (label: string, hint: string, on: boolean, toggle: () => void) => (
    <button className="srow" role="switch" aria-checked={on} onClick={toggle}>
      <span>
        <b>{label}</b>
        <small>{hint}</small>
      </span>
      <i className={'sw' + (on ? ' on' : '')} />
    </button>
  );
  const silent = !s.music && !s.sfx;
  const canVibrate = typeof navigator !== 'undefined' && 'vibrate' in navigator;

  return (
    <div className="settings" ref={box}>
      <button
        className={'ghost gear' + (open ? ' open' : '') + (silent ? ' off' : '')}
        onClick={() => setOpen((o) => !o)}
        aria-label="Sound settings"
        aria-expanded={open}
      >
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          {silent ? (
            <path d="M3 10v4h3l5 4V6L6 10H3zm13.6 2 2.7-2.7-1.4-1.4-2.7 2.7-2.7-2.7-1.4 1.4 2.7 2.7-2.7 2.7 1.4 1.4 2.7-2.7 2.7 2.7 1.4-1.4z" fill="currentColor" />
          ) : (
            <path d="M3 10v4h3l5 4V6L6 10H3zm11.5 2a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4zM12 3.2v2.1a7 7 0 0 1 0 13.4v2.1a9 9 0 0 0 0-17.6z" fill="currentColor" />
          )}
        </svg>
        <span className="gear-label">Sound</span>
      </button>
      {open && (
        <div className="spanel" role="dialog" aria-label="Sound settings">
          <div className="shead">
            <b>Sound settings</b>
            <button className="sx" onClick={() => setOpen(false)} aria-label="Close sound settings">
              ×
            </button>
          </div>
          {theme?.bar && row('Music', theme?.musicHint ?? 'Background tune', s.music, () => setSound({ music: !s.music }))}
          {row('Sound effects', theme?.sfxHint ?? 'Taps, daubs and wins', s.sfx, () => {
            setSound({ sfx: !s.sfx });
            if (!s.sfx) setTimeout(sfx.daub, 30);
          })}
          <label className="srow vol">
            <span>
              <b>Volume</b>
              <small>{Math.round(s.volume * 100)}%</small>
            </span>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={Math.round(s.volume * 100)}
              disabled={silent}
              onChange={(e) => setSound({ volume: +e.target.value / 100 })}
              onPointerUp={() => sfx.daub()}
              onKeyUp={() => sfx.daub()}
              aria-label="Volume"
            />
          </label>
          {canVibrate && row('Vibration', 'Buzz on cracks, lines and wins', s.vibrate, () => setSound({ vibrate: !s.vibrate }))}
        </div>
      )}
    </div>
  );
}
