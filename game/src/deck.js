// Drawing and discarding: the deck, the discard pile and the hand limit live
// here, so the game rules never touch an array directly.

import { buildDeck } from './cards.js';
import { MAX_HAND, OPENING_HAND } from './config.js';

/** A fresh shuffled deck and an empty discard pile, from the given source. */
export function newDeck(rng) {
  return { cards: rng.shuffle(buildDeck()), discard: [] };
}

/** Draw one card into `hand` (at the hand ceiling the card is discarded instead). */
export function drawCard(deck, hand) {
  if (deck.cards.length === 0) {
    if (deck.discard.length === 0) return null;
    deck.cards = deck.discard.splice(0);
    deck.discard = [];
  }
  const card = deck.cards.pop();
  if (hand.length >= MAX_HAND) {
    deck.discard.push(card);
    return { drawn: card, kept: false };
  }
  hand.push(card);
  return { drawn: card, kept: true };
}

/** Deal the opening hand of five cards. */
export function dealOpeningHand(deck, hand) {
  for (let index = 0; index < OPENING_HAND; index += 1) drawCard(deck, hand);
}

/** Send a card to the discard pile. */
export function discardCard(deck, card) {
  deck.discard.push(card);
}

/** How many cards are left to draw. */
export function cardsLeft(deck) {
  return deck.cards.length;
}
