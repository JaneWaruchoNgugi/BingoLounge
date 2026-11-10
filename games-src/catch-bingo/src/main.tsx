import './shared/shell.css';
import './shared/bright.css';
import './game/catch.css';
import { mount } from './shared/Shell';
import { numberTokens } from './shared/engine';
import { CatchField } from './game/CatchField';

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
  Field: CatchField,
  revealAllLabel: false,
  calls: 45,
  inlineCards: true,
  theme: 'bright',
});
