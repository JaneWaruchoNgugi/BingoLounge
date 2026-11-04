import {
  BadgeDollarSign,
  CircleDot,
  Coins,
  Dices,
  Gem,
  Grid3x3,
  Hand,
  Layers,
  Lightbulb,
  ListChecks,
  type LucideIcon,
  Snowflake,
  Sparkles,
  Spade,
  Star,
  Target,
  Ticket,
  Timer,
  Trophy,
  Volume2,
} from 'lucide-react'

/** One step of a game's guided tour. */
export interface TourStep {
  Icon: LucideIcon
  title: string
  body: string
  /** an optional short pro tip shown under the step */
  tip?: string
}

/** The step every tour ends on: practice money and sound. */
const finish: TourStep = {
  Icon: Volume2,
  title: 'Sound, settings and practice play',
  body: 'Music and sound effects are set from the gear or speaker button inside the game. Balances in the lounge are practice amounts, so take your time learning.',
  tip: 'You can reopen this tour at any time from the How to play button at the top of the screen.',
}

/** Shared steps for the classic 75-ball hall games (Quick Bingo, Bingo 35). */
const hallStake: TourStep = {
  Icon: Coins,
  title: 'Choose your stake',
  body: 'Pick a card price of KES 10, 20, 50 or 100. Every prize on the card is paid in proportion to the stake you choose.',
}
const hallCards: TourStep = {
  Icon: Ticket,
  title: 'Pick your cards before the timer ends',
  body: 'Tap Take a card to buy, or use Next card and Previous card to browse first. You can play more than one card in a round. Cards bought after the draw starts play in the next round.',
  tip: 'More cards means more numbers covered, but also a bigger total stake.',
}
const hallWins: TourStep = {
  Icon: Trophy,
  title: 'Lines and the Full House',
  body: 'Complete any row, column or diagonal for a Line win. Double and Triple lines pay more, and covering the whole card is the Full House. Winnings are shown at the end of the round. Tap Collect winnings to add them to your balance.',
}

export const TOURS: Record<string, TourStep[]> = {
  'scratch-bingo': [
    { Icon: Target, title: 'The goal', body: 'Scratch off 30 called numbers and match them on your bingo card. Matched numbers and completed lines both pay.' },
    {
      Icon: Ticket,
      title: 'Choose your card',
      body: 'Pick one or two cards per ticket, priced from KES 10 to 100. Browse with Previous and Next, then tap Take this card. To change your mind, put a card back and take another.',
    },
    {
      Icon: Hand,
      title: 'Scratch the calls',
      body: 'Rub the foil with your finger or mouse to reveal the 30 calls. Every revealed number that is on your card is daubed for you.',
      tip: 'Scratch at your own pace. Nothing is decided by how fast you go.',
    },
    {
      Icon: Star,
      title: 'The bonus star',
      body: 'About one ticket in 40 hides a bonus star. When you find it, tap any number on your card to daub it for free.',
      tip: 'Place the star where it finishes a line, or where it brings you closest to one.',
    },
    {
      Icon: Trophy,
      title: 'How it pays',
      body: 'Prizes are a multiple of the card price, and each card pays its single best prize. Big, Super and Mega wins are the top tiers.',
    },
    finish,
  ],

  'flip-bingo': [
    { Icon: Target, title: 'The goal', body: 'Flip ice tiles to call your own numbers. Every number that hits your card grows the pot. Collect before you hit a crack.' },
    {
      Icon: Gem,
      title: 'Pick a level and a stake',
      body: 'Choose KES 10, 20, 50 or 100, then pick a level. Easy hides 1 crack, Medium hides 3 and Hard hides 5. More cracks mean more risk, and bigger pots and line bonuses.',
    },
    {
      Icon: Snowflake,
      title: 'Flip the tiles',
      body: '40 ice tiles hide numbers and cracks. Press Play, then tap tiles one at a time. A number on your card is a hit and is daubed.',
    },
    {
      Icon: Grid3x3,
      title: 'Hits and line bonuses',
      body: 'The first hit already pays, and every hit after it raises the pot. Complete a row, column or diagonal on your card for a line bonus.',
    },
    {
      Icon: BadgeDollarSign,
      title: 'Collect or keep going',
      body: 'Tap Collect whenever you like to bank the current pot. If you flip a crack, the round ends and the pot is lost.',
      tip: 'Watch the Crack risk meter. The fewer safe tiles left, the closer the next flip is to a crack.',
    },
    finish,
  ],

  'reel-bingo': [
    { Icon: Target, title: 'The goal', body: 'Five slot reels call your numbers, one reel for each B-I-N-G-O column. Complete lines, and the Full House, on your cards.' },
    hallStake,
    { ...hallCards, body: 'Tap Take a card to buy, or browse with Next card and Previous card. You can play up to four cards. Cards bought after the round starts play in the next one.' },
    {
      Icon: Dices,
      title: 'Seven spins, five numbers each',
      body: 'Each of the 7 spins stops the reels on five numbers at once, one per column, and they are daubed on every card.',
    },
    {
      Icon: Star,
      title: 'Star symbols',
      body: 'When a reel lands on a star, every card gets a free daub in that column.',
    },
    hallWins,
    finish,
  ],

  'deal-bingo': [
    { Icon: Target, title: 'The goal', body: 'A dealer turns playing cards on the felt, and each card calls a bingo number. Complete lines, and the Full House, on your bingo cards.' },
    hallStake,
    hallCards,
    {
      Icon: Spade,
      title: '12 hands of 3 cards',
      body: 'The dealer turns 36 cards in 12 hands. The value of each card is the number and its suit is the letter, so each suit stands for one B-I-N-G-O column.',
    },
    {
      Icon: Sparkles,
      title: 'Face cards are wild',
      body: 'A Jack, Queen or King gives every one of your cards a free daub in that letter.',
      tip: 'Wild daubs land where they help most, so face cards late in the round can finish lines.',
    },
    hallWins,
    finish,
  ],

  'quick-bingo': [
    { Icon: Target, title: 'The goal', body: 'The classic hall round. 36 balls are drawn from 75. Complete lines, and the Full House, on your cards.' },
    hallStake,
    hallCards,
    {
      Icon: Timer,
      title: 'Watch the draw',
      body: 'When the timer runs out, six pipes drop the balls one by one. Called numbers are lit on the board and daubed on your cards.',
      tip: 'The numbers you still need light up, so you can see at a glance how close you are.',
    },
    hallWins,
    finish,
  ],

  bingo35: [
    { Icon: Target, title: 'The goal', body: 'A faster hall round. 35 balls are drawn from 75 through five tubes. Lines pay by how many you complete.' },
    hallStake,
    hallCards,
    {
      Icon: CircleDot,
      title: 'Five tubes, 35 calls',
      body: 'When the timer ends, the balls drop through five tubes. Every call on your card is daubed, and the numbers you need are highlighted.',
    },
    {
      Icon: Layers,
      title: 'Lines pay by how many you complete',
      body: 'One line pays, a Double line pays more, and a Triple line pays more again. Covering the whole card is the Full House. Tap Collect winnings at the end of the round.',
    },
    finish,
  ],

  bingo90: [
    { Icon: Target, title: 'The goal', body: 'Traditional 90-ball bingo on strips. 56 balls are called, and every card pays from one line up to five.' },
    {
      Icon: Coins,
      title: 'Choose a stake or pick your own cards',
      body: 'Choose a stake for a quick pick, or tap Pick your own cards to browse them yourself, before the timer ends. Cards bought during a round play in the next one.',
    },
    {
      Icon: ListChecks,
      title: 'The call',
      body: 'The caller draws 56 balls, with classic calls like "Two little ducks" for 22 and "Key of the door" for 21. Called numbers are dotted on the board and on your cards.',
    },
    {
      Icon: Trophy,
      title: 'One line up to five',
      body: 'Each card pays for the lines it completes, from one line up to five. Your winnings are shown at the end of the round.',
      tip: 'Every card can win, so more cards gives you more chances in each round.',
    },
    {
      Icon: Lightbulb,
      title: 'Demo credit',
      body: 'If your practice balance runs low, use Add demo credit to top up KES 500. It is not real money.',
    },
    finish,
  ],
}

/** Remembers which games' tours a player has seen, so a tour opens by itself only the first time. */
const SEEN_KEY = 'bl-tours-seen'
export function tourSeen(id: string): boolean {
  try {
    return (JSON.parse(localStorage.getItem(SEEN_KEY) || '[]') as string[]).includes(id)
  } catch {
    return true
  }
}
export function markTourSeen(id: string) {
  try {
    const seen = new Set(JSON.parse(localStorage.getItem(SEEN_KEY) || '[]') as string[])
    seen.add(id)
    localStorage.setItem(SEEN_KEY, JSON.stringify([...seen]))
  } catch {
    /* storage blocked: the tour simply opens again next time */
  }
}
