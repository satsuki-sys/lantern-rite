// Rin, the rival keeper: reads the barges, weighs every card in every lane,
// and plays the move that swings the most lanterns her way. Her skill sets
// how much noise clouds that reading — strong Rin plays near her best, weak
// Rin often drifts. The lane her best move favours is her tell: the table
// shows it before she plays, so a keeper watching closely can contest it.
// The same reading drives the autopilot that stages the screenshot scenes,
// for either keeper.

import { resolvedPower } from './cards.js';
import { laneTotal } from './game.js';
import { LANES } from './config.js';

/** How much noise each skill level adds to a move's score. */
const NOISE = { strong: 0.5, fair: 4, weak: 12 };

/** Score one candidate: `side` plays `card` (hand index) into `laneIndex`. */
function scoreMove(state, side, handIndex, laneIndex) {
  const other = side === 'you' ? 'rival' : 'you';
  const card = state[side].hand[handIndex];
  const lane = state.lanes[laneIndex];
  const beforeMine = laneTotal(state, laneIndex, side);
  const beforeTheirs = laneTotal(state, laneIndex, other);
  const power = resolvedPower(card, lane[other].map((entry) => entry.card));
  let score = 0;

  // Winning a barge matters most; flipping one from lost to won most of all.
  const afterMine = beforeMine.total + power + (card.trick === 'ember' ? 2 : 0);
  if (beforeMine.total <= beforeTheirs.total && afterMine > beforeTheirs.total) score += 12;
  else if (afterMine > beforeTheirs.total) score += 4;
  else if (afterMine === beforeTheirs.total) score += 2;
  else score += (afterMine - beforeTheirs.total) * 0.4;

  // Harmony: a card whose suit matches the barge's own cards kindles the bonus.
  if (lane[side].length > 0 && lane[side].every((entry) => entry.suit === card.suit)) score += 3.5;
  // Run: a value one apart from a card already on the barge.
  if (lane[side].some((entry) => Math.abs(entry.value - power) === 1)) score += 2;
  // Gale Fan is worth the card it blows away; Mirror Kite, what it copies.
  if (card.trick === 'gale' && lane[other].length > 0) {
    const weakest = Math.min(...lane[other].map((entry) => entry.power));
    score += weakest * 1.2;
  }
  if (card.trick === 'mirror') score += Math.max(0, power - 3);
  if (card.trick === 'ember') score += 2;
  // A strong card is worth more where the barge is still contested.
  score += power * 0.3;
  // Spread the duel: a barge already won by a wide margin needs no more cards,
  // and a strong card wasted there is a card lost.
  if (beforeMine.total - beforeTheirs.total > 6) score -= 3;
  if (beforeMine.total - beforeTheirs.total > 4) score -= power * 0.5;
  return score;
}

/**
 * A move for `side` this turn: { kind: 'play', handIndex, laneIndex } or
 * { kind: 'hold' }. The keeper holds when the hand is thin and every play
 * is poor.
 */
export function chooseMove(state, side, skill = 'fair') {
  const rng = state.rng;
  let best = null;
  let bestScore = -Infinity;
  for (let handIndex = 0; handIndex < state[side].hand.length; handIndex += 1) {
    for (let laneIndex = 0; laneIndex < LANES.length; laneIndex += 1) {
      const score = scoreMove(state, side, handIndex, laneIndex) + (rng.next() - 0.5) * 2 * NOISE[skill];
      if (score > bestScore) {
        bestScore = score;
        best = { kind: 'play', handIndex, laneIndex };
      }
    }
  }
  if (best === null) return { kind: 'hold' };
  if (bestScore < -2 && state[side].hand.length <= 3) return { kind: 'hold' };
  return best;
}

/** The lane Rin's best move favours — her tell, shown before she plays. */
export function favouredLane(state, skill = 'fair') {
  const move = chooseMove(state, 'rival', skill);
  return move.kind === 'play' ? move.laneIndex : null;
}

/** An autopilot move for either keeper, at the given skill. */
export function autopilotMove(state, side, skill) {
  return chooseMove(state, side, skill);
}
