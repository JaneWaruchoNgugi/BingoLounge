import './shared/shell.css';
import './shared/bright.css';
import './game/coconut.css';
import { mount } from './shared/Shell';
import { numberTokens } from './shared/engine';
import { CoconutField } from './game/CoconutField';
import { CoconutIcon } from './game/art';

mount({
  id: 'coconut',
  name: 'Coconut Crack',
  fieldTitle: 'Crack the coconuts',
  pitch: 'Tap the coconuts on the beach to crack them open. A rare milk coconut doubles your next line win.',
  rules: [
    'Each round has 30 coconuts on the beach and 2 minutes on the clock. Any coconut still closed when time runs out cracks open by itself.',
    'Tap a coconut to crack it. The number inside is daubed on your card if you have it.',
    'Some rounds hide one milk coconut. After you crack it, the next line you complete pays double.',
  ],
  makeTokens: (calls, rng) => {
    const t = numberTokens(calls);
    if (rng() < 0.7) {
      const i = 3 + Math.floor(rng() * 24);
      t[i] = { ...t[i], kind: 'double' };
    }
    return t;
  },
  Field: CoconutField,
  theme: 'bright',
  inlineCards: true,
  banner: 'Pick your cards and crack the coconuts!',
  icon: <CoconutIcon />,
  chips: (s) => (s.doubleArmed && s.phase === 'playing' ? [{ label: 'Milk coconut: next line pays x2', tone: 'info' }] : s.lineWins.some((w) => w.doubled) ? [{ label: 'Milk bonus paid', tone: 'gold' }] : []),
});
