import './shared/shell.css';
import './shared/bright.css';
import './game/lantern.css';
import './game/skin.css';
import { mount } from './shared/Shell';
import { lanternSound } from './game/sound';
import { numberTokens } from './shared/engine';
import { LanternField } from './game/LanternField';
import { LanternArt } from './game/art';

// This game's own display font, so its look differs from the other lounge games.
const font = document.createElement('link');
font.rel = 'stylesheet';
font.href = 'https://fonts.googleapis.com/css2?family=Cinzel:wght@700;900&display=swap';
document.head.appendChild(font);

mount({
  id: 'lantern',
  name: 'Lantern',
  fieldTitle: 'Light the lanterns',
  pitch: 'Tap a lantern to light it and watch it rise with a number. Light three of one colour in a row for a bonus.',
  rules: [
    'Each round has 30 lanterns and 2 minutes on the clock. Tap a lantern to light it and see its number, which is daubed on your cards if you have it. Lanterns still dark at 0:00 light by themselves.',
    'Each lantern glows amber, rose, blue or jade. Light three of the same colour one after another to open the lantern bonus, then pick one of three lanterns for an extra prize.',
  ],
  makeTokens: (calls, rng) => numberTokens(calls).map((x) => ({ ...x, tone: Math.floor(rng() * 4) })),
  sound: lanternSound,
  Field: LanternField,
  theme: 'bright',
  inlineCards: true,
  banner: 'Light the lanterns and complete your bingo cards!',
  startLabel: 'Light Lanterns',
  revealAllLabel: false,
  icon: (
    <span className="title-icon lantern-title">
      <LanternArt tone={0} lit />
    </span>
  ),
  chips: (s) => (s.bonusCash > 0 ? [{ label: `Lantern bonus KSh ${s.bonusCash.toLocaleString('en-US')}`, tone: 'gold' }] : []),
});
