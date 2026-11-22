// Lantern Rite: every tuning number, suit and colour in one place.
// The table is a fixed 1280x800 logical area; the renderer scales it to the
// window, so no rule below depends on the screen size.

export const TABLE = { width: 1280, height: 800 };

/** A match ends when a keeper lights this many lanterns or a spirit hits zero. */
export const LANTERNS_TO_WIN = 3;
export const START_SPIRIT = 20;

/** Cards in the opening hand, turns in a round, and the hand-size ceiling. */
export const OPENING_HAND = 5;
export const TURNS_PER_ROUND = 6;
export const MAX_HAND = 7;

/** Harmony: every card in one lane sharing a suit. Run: two values one apart. */
export const HARMONY_BONUS = 3;
export const RUN_BONUS = 2;

/** The four suits. Each is told apart by colour AND by its drawn shape. */
export const SUITS = {
  ember: { key: 'ember', name: 'Ember', color: '#e8542f', deep: '#a83216', light: '#ffb37a' },
  tide: { key: 'tide', name: 'Tide', color: '#2f8fe8', deep: '#1a5da6', light: '#9fd2ff' },
  leaf: { key: 'leaf', name: 'Leaf', color: '#3fae5a', deep: '#22763a', light: '#a5e8b6' },
  moon: { key: 'moon', name: 'Moon', color: '#8b6fd8', deep: '#5a3fa0', light: '#d3c2ff' },
};

export const SUIT_KEYS = ['ember', 'tide', 'leaf', 'moon'];

/** The three barges the duel is fought over, left to right. */
export const LANES = [
  { key: 'paper', name: 'Paper Barge', tint: '#f2c94c' },
  { key: 'lotus', name: 'Lotus Barge', tint: '#e87aa8' },
  { key: 'moon', name: 'Moon Barge', tint: '#7ad3e8' },
];

/** The rival keeper's name, shown above the rival's hand. */
export const RIVAL_NAME = 'Rin, Keeper of the River Lights';

/** Card faces and the table. */
export const CARD = { handW: 112, handH: 152, tableW: 86, tableH: 118, backW: 64, backH: 88 };

export const PALETTE = {
  skyTop: '#0d1030',
  skyBottom: '#232a5e',
  riverTop: '#1c2a55',
  riverBottom: '#101a3a',
  table: '#14332a',
  tableEdge: '#0d241d',
  felt: '#1d4a38',
  panel: '#10182e',
  panelEdge: '#2c3a63',
  text: '#f4efe2',
  muted: '#a8b0c8',
  gold: '#f2c94c',
  danger: '#e5534b',
  you: '#7ad3e8',
  rival: '#e87aa8',
};

export const FONT = '"Avenir Next", "Trebuchet MS", system-ui, sans-serif';

/** Where the best result is kept between visits (this browser only). */
export const BEST_KEY = 'lantern-rite.best';
