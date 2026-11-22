// The deck of Lantern Rite: what a card is, what the special cards do, and the
// names the table shows. Nothing here names another game: the suits, the
// barges and the three tricks are invented for this duel.

import { SUIT_KEYS, SUITS } from './config.js';

/** The three trick cards, each with its own play effect. */
export const TRICKS = {
  mirror: {
    key: 'mirror',
    name: 'Mirror Kite',
    text: 'Copies the rival\u2019s strongest card in this lane',
    suit: 'moon',
  },
  gale: {
    key: 'gale',
    name: 'Gale Fan',
    text: 'Power 4. Blows away the rival\u2019s weakest card here',
    suit: 'tide',
  },
  ember: {
    key: 'ember',
    name: 'Ember Charm',
    text: 'Power 2, and kindles +2 on this lane',
    suit: 'ember',
  },
};

/** Build one card object. `value` is its face power; `trick` names a trick card. */
export function makeCard(id, suit, value, trick = null) {
  return { id, suit, value, trick, bonus: 0 };
}

/** The full 42-card deck, unshuffled: values 1-9 in each of the four suits,
 *  plus two of each trick card. */
export function buildDeck() {
  const deck = [];
  let id = 0;
  for (const suit of SUIT_KEYS) {
    for (let value = 1; value <= 9; value += 1) {
      deck.push(makeCard(id, suit, value));
      id += 1;
    }
  }
  for (const trick of Object.keys(TRICKS)) {
    for (let copy = 0; copy < 2; copy += 1) {
      deck.push(makeCard(id, TRICKS[trick].suit, 0, trick));
      id += 1;
    }
  }
  return deck;
}

/** The name printed on a card: a suit card names its value, a trick its title. */
export function cardName(card) {
  if (card.trick) return TRICKS[card.trick].name;
  return `${SUITS[card.suit].name} ${card.value}`;
}

/** The small line of rules text printed under a trick card's name. */
export function cardText(card) {
  if (card.trick) return TRICKS[card.trick].text;
  return `${SUITS[card.suit].name} of the river festival`;
}

/**
 * The power a card counts for once played in `laneCards` (the rival cards
 * already in that lane). Mirror Kite copies the rival's strongest card there;
 * Ember Charm counts 2 and Gale Fan 4, as their faces say; every other card
 * counts its face value.
 */
export function resolvedPower(card, laneCards) {
  if (card.trick === 'mirror') {
    let best = 0;
    for (const other of laneCards) {
      if (other.value > best) best = other.value;
    }
    return Math.max(1, best);
  }
  if (card.trick === 'ember') return 2;
  if (card.trick === 'gale') return 4;
  return card.value;
}

/** The suit a card counts as once played (a Mirror Kite takes its copy's suit). */
export function resolvedSuit(card, laneCards) {
  if (card.trick === 'mirror') {
    let best = null;
    for (const other of laneCards) {
      if (best === null || other.value > best.value) best = other;
    }
    return best ? best.suit : card.suit;
  }
  return card.suit;
}
