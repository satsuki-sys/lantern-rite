// Lantern Rite, the rules: a match is a duel over three lantern barges.
// Each round lasts six turns. On a turn a keeper draws a card and plays one
// card into a barge, or holds to draw an extra card instead. When the round
// ends, each barge is scored: the higher total lights it, and the keeper who
// lights two barges wins the round and a lantern. The loser loses spirit
// equal to the margins. Three lanterns, or a rival spirit of zero, wins the
// match. A barge's total is its cards' power plus a harmony bonus when every
// card on one side shares a suit, plus a run bonus for values one apart.

import { cardName, resolvedPower, resolvedSuit } from './cards.js';
import { drawCard, dealOpeningHand, discardCard, newDeck } from './deck.js';
import {
  HARMONY_BONUS,
  LANES,
  LANTERNS_TO_WIN,
  RUN_BONUS,
  START_SPIRIT,
  TURNS_PER_ROUND,
} from './config.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_ROUND = 'round';
export const SCREEN_MATCH = 'match';

/** A fresh match, unplayed: hands empty, spirit full, no lantern lit. */
export function createMatch(rng) {
  return {
    rng,
    screen: SCREEN_TITLE,
    deck: newDeck(rng),
    you: { hand: [], spirit: START_SPIRIT, lanterns: 0 },
    rival: { hand: [], spirit: START_SPIRIT, lanterns: 0 },
    lanes: LANES.map(() => ({ you: [], rival: [] })),
    round: 1,
    turn: 1,
    phase: 'player',
    selected: null,
    laneFocus: 1,
    message: '',
    log: [],
    roundResult: null,
    matchWinner: null,
    rivalTell: null,
    lastRivalMove: null,
    roundCount: 0,
  };
}

/** Deal opening hands and open the first round. */
export function startMatch(state) {
  state.deck = newDeck(state.rng);
  state.you = { hand: [], spirit: START_SPIRIT, lanterns: 0 };
  state.rival = { hand: [], spirit: START_SPIRIT, lanterns: 0 };
  state.lanes = LANES.map(() => ({ you: [], rival: [] }));
  state.round = 1;
  state.turn = 1;
  state.roundCount = 0;
  state.roundResult = null;
  state.matchWinner = null;
  state.rivalTell = null;
  state.lastRivalMove = null;
  state.selected = null;
  state.log = [];
  dealOpeningHand(state.deck, state.you.hand);
  dealOpeningHand(state.deck, state.rival.hand);
  state.screen = SCREEN_PLAY;
  state.phase = 'player';
  say(state, 'The lanterns are lit. Play a card into a barge — or hold to draw.');
}

/** Open a new round: return the barges' cards to the discard pile, clear them, draw for the first turn. */
export function startRound(state) {
  for (const lane of state.lanes) {
    for (const side of ['you', 'rival']) {
      for (const entry of lane[side]) discardCard(state.deck, entry.card);
    }
  }
  state.lanes = LANES.map(() => ({ you: [], rival: [] }));
  state.turn = 1;
  state.roundResult = null;
  state.rivalTell = null;
  state.lastRivalMove = null;
  state.selected = null;
  state.screen = SCREEN_PLAY;
  state.phase = 'player';
  say(state, `Round ${state.round} — the barges drift out onto the river.`);
}

/** Both keepers draw at the start of a turn (not the match's first turn). */
export function drawForTurn(state) {
  const yours = drawCard(state.deck, state.you.hand);
  const theirs = drawCard(state.deck, state.rival.hand);
  if (yours && !yours.kept) say(state, 'Your hand is full — the drawn card drifts away.');
  if (theirs && !theirs.kept) say(state, 'The rival\u2019s hand is full.');
}

/** One side's cards in a lane, as played entries {card, power, suit, ...}. */
function laneSide(state, laneIndex, side) {
  return state.lanes[laneIndex][side];
}

/** A side's total on one barge: power, harmony, run and ember kindling. */
export function laneTotal(state, laneIndex, side) {
  const entries = laneSide(state, laneIndex, side);
  let power = 0;
  let bonus = 0;
  const suits = new Set();
  const values = [];
  for (const entry of entries) {
    power += entry.power;
    bonus += entry.bonus;
    suits.add(entry.suit);
    values.push(entry.value);
  }
  let harmony = 0;
  if (entries.length >= 2 && suits.size === 1) harmony = HARMONY_BONUS;
  let run = 0;
  for (let a = 0; a < values.length && run === 0; a += 1) {
    for (let b = a + 1; b < values.length; b += 1) {
      if (Math.abs(values[a] - values[b]) === 1) {
        run = RUN_BONUS;
        break;
      }
    }
  }
  return { power, bonus, harmony, run, total: power + bonus + harmony + run };
}

/**
 * Play a card from `side`'s hand into a barge. Mirror Kite copies the rival's
 * strongest card already there; Gale Fan blows the rival's weakest card there
 * away; Ember Charm kindles +2 on your side of the barge. Returns a note of
 * what happened, for the table's log line.
 */
export function playCard(state, side, handIndex, laneIndex, fromX = 0, fromY = 0) {
  const keeper = state[side];
  const card = keeper.hand[handIndex];
  if (!card) return null;
  const lane = state.lanes[laneIndex];
  const otherSide = side === 'you' ? 'rival' : 'you';
  const rivalEntries = lane[otherSide];
  const power = resolvedPower(card, rivalEntries.map((entry) => entry.card));
  const suit = resolvedSuit(card, rivalEntries.map((entry) => entry.card));
  const bonus = card.trick === 'ember' ? 2 : 0;
  keeper.hand.splice(handIndex, 1);
  lane[side].push({ card, power, suit, value: power, bonus, fromX, fromY, animT: 0 });
  let note = `${side === 'you' ? 'You play' : 'Rin plays'} ${cardName(card)} on ${LANES[laneIndex].name}.`;
  if (card.trick === 'gale' && rivalEntries.length > 0) {
    let weakest = 0;
    for (let index = 1; index < rivalEntries.length; index += 1) {
      if (rivalEntries[index].power < rivalEntries[weakest].power) weakest = index;
    }
    const blown = rivalEntries.splice(weakest, 1)[0];
    discardCard(state.deck, blown.card);
    note += ` The gale blows away ${cardName(blown.card)}.`;
  }
  if (card.trick === 'mirror') note += ` It mirrors ${power} power.`;
  if (card.trick === 'ember') note += ' It kindles +2.';
  say(state, note);
  return { card, laneIndex, note };
}

/** Hold: draw an extra card and pass the turn without playing. */
export function holdTurn(state, side) {
  const keeper = state[side];
  const drawn = drawCard(state.deck, keeper.hand);
  say(state, side === 'you' ? 'You hold, and draw an extra card.' : 'Rin holds, and draws an extra card.');
  return drawn;
}

/** Advance the turn counter; true when the round has run its six turns. */
export function endTurn(state) {
  state.turn += 1;
  state.selected = null;
  state.rivalTell = null;
  return state.turn > TURNS_PER_ROUND;
}

/** Score every barge and name the round's winner and the spirit it costs. */
export function resolveRound(state) {
  const lanes = [];
  let youLanes = 0;
  let rivalLanes = 0;
  let youPower = 0;
  let rivalPower = 0;
  for (let index = 0; index < LANES.length; index += 1) {
    const yours = laneTotal(state, index, 'you');
    const theirs = laneTotal(state, index, 'rival');
    youPower += yours.total;
    rivalPower += theirs.total;
    let winner = null;
    let margin = 0;
    if (yours.total > theirs.total) {
      winner = 'you';
      youLanes += 1;
      margin = yours.total - theirs.total;
    } else if (theirs.total > yours.total) {
      winner = 'rival';
      rivalLanes += 1;
      margin = theirs.total - yours.total;
    }
    lanes.push({ index, you: yours, rival: theirs, winner, margin });
  }
  let roundWinner = null;
  if (youLanes > rivalLanes) roundWinner = 'you';
  else if (rivalLanes > youLanes) roundWinner = 'rival';
  else if (youPower !== rivalPower) roundWinner = youPower > rivalPower ? 'you' : 'rival';
  // Spirit lost is the winner's margins, capped so one round never ends the
  // match outright: a duel should last three or four rounds, not one.
  let damage = 0;
  if (roundWinner) {
    for (const lane of lanes) {
      if (lane.winner === roundWinner) damage += lane.margin;
    }
    damage = Math.min(6, damage);
  }
  return { lanes, youLanes, rivalLanes, youPower, rivalPower, roundWinner, damage };
}

/** Apply a resolved round: lanterns, spirit, and the next screen. */
export function applyRoundResult(state, result) {
  state.roundResult = result;
  if (result.roundWinner === 'you') {
    state.you.lanterns += 1;
    state.rival.spirit = Math.max(0, state.rival.spirit - result.damage);
    say(state, `You take the round! Rin loses ${result.damage} spirit.`);
  } else if (result.roundWinner === 'rival') {
    state.rival.lanterns += 1;
    state.you.spirit = Math.max(0, state.you.spirit - result.damage);
    say(state, `Rin takes the round. You lose ${result.damage} spirit.`);
  } else {
    say(state, 'The round is a draw — no lantern, no spirit lost.');
  }
  state.roundCount += 1;
  const winner = matchWinner(state);
  if (winner) {
    state.matchWinner = winner;
    state.screen = SCREEN_MATCH;
    say(state, winner === 'you' ? 'The river is yours — every lantern burns for you.' : 'The lanterns dim. Rin keeps the river tonight.');
  } else {
    state.round += 1;
    state.screen = SCREEN_ROUND;
  }
  return winner;
}

/** The match winner, if the match is over: three lanterns, or a spent spirit. */
export function matchWinner(state) {
  if (state.you.lanterns >= LANTERNS_TO_WIN) return 'you';
  if (state.rival.lanterns >= LANTERNS_TO_WIN) return 'rival';
  if (state.you.spirit <= 0) return 'rival';
  if (state.rival.spirit <= 0) return 'you';
  return null;
}

/** Advance every played card's slide-in animation by `dt` seconds. */
export function advanceAnimations(state, dt) {
  for (const lane of state.lanes) {
    for (const side of ['you', 'rival']) {
      for (const entry of lane[side]) {
        if (entry.animT < 1) entry.animT = Math.min(1, entry.animT + dt / 0.28);
      }
    }
  }
}

/** Write a line to the table's log, keeping the last few. */
export function say(state, message) {
  state.message = message;
  state.log.unshift(message);
  if (state.log.length > 4) state.log.length = 4;
}
