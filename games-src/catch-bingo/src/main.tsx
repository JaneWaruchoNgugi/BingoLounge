import './shared/shell.css';
import './shared/bright.css';
import './game/catch.css';
import './game/skin.css';
import { mount } from './shared/Shell';
import { catchSound } from './game/sound';
import { numberTokens } from './shared/engine';
import { CatchField } from './game/CatchField';

// This game's own display font, so its look differs from the other lounge games.
const font = document.createElement('link');
font.rel = 'stylesheet';
font.href = 'https://fonts.googleapis.com/css2?family=Bungee&display=swap';
document.head.appendChild(font);

mount({
  id: 'catch',
  name: 'Catch',
  fieldTitle: 'Catch the balls',
  banner: 'Catch the balls and complete your bingo cards!',
  pitch: '45 balls drop from the top. Drag the basket to catch them. Caught balls are your calls, missed ones are lost.',
  rules: [
    'After a 3-second count, 45 numbered balls fall over about 50 seconds. Drag anywhere in the play area (or use the arrow keys) to move the basket.',
    'Every ball you catch is called on your cards. Balls with a gold glow are numbers on your cards, so chase those first. Missed balls are lost.',
  ],
  makeTokens: (calls) => numberTokens(calls),
  sound: catchSound,
  Field: CatchField,
  revealAllLabel: false,
  calls: 45,
  inlineCards: true,
  theme: 'bright',
});
