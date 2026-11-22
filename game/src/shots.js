// The screenshot scenes behind ?shot=title|play|win|loss. Each one plays the
// real rules forward from a fresh match, steered by the same autopilot that
// drives Rin, so the frame is what a real game looks like and the same seed
// always gives the same frame. No scene is drawn by hand: every card on the
// table got there through playCard.

import { autopilotMove, favouredLane } from './ai.js';
import { createRandom } from './random.js';
import {
  applyRoundResult,
  createMatch,
  drawForTurn,
  endTurn,
  holdTurn,
  playCard,
  resolveRound,
  SCREEN_MATCH,
  SCREEN_PLAY,
  SCREEN_TITLE,
  startMatch,
  startRound,
} from './game.js';

/** Settle a played card's slide-in at once, so the shot shows it placed. */
function settle(state, side, laneIndex) {
  const entries = state.lanes[laneIndex][side];
  if (entries.length > 0) entries[entries.length - 1].animT = 1;
}

/** Make one keeper's move with the autopilot, settling its animation. */
function autoMove(state, side, skill, fromX, fromY) {
  const move = autopilotMove(state, side, skill);
  if (move.kind === 'play') {
    playCard(state, side, move.handIndex, move.laneIndex, fromX, fromY);
    settle(state, side, move.laneIndex);
  } else {
    holdTurn(state, side);
  }
  return move;
}

/** Play one full turn for both keepers; returns 'done' when the match ends. */
function playTurn(state, youSkill, rivalSkill) {
  if (!(state.round === 1 && state.turn === 1)) drawForTurn(state);
  autoMove(state, 'you', youSkill, 640, 700);
  autoMove(state, 'rival', rivalSkill, 640, 120);
  if (endTurn(state)) {
    const result = resolveRound(state);
    const winner = applyRoundResult(state, result);
    if (winner) return 'done';
    startRound(state);
  }
  return 'playing';
}

/** Play turns until `stop` says so, or the match ends; at most 200 turns. */
function playUntil(state, youSkill, rivalSkill, stop) {
  for (let index = 0; index < 200; index += 1) {
    if (stop(state)) return 'stopped';
    if (playTurn(state, youSkill, rivalSkill) === 'done') return 'done';
  }
  return 'done';
}

/**
 * Set `state` to the named scene (title, play, win or loss; any other name
 * is title) and return the screen to draw over it.
 */
export function stageShot(name, seed) {
  const state = createMatch(createRandom(seed));
  startMatch(state);
  if (name === 'play') {
    // A full mid-match table: round three, fifth turn, barges well stocked.
    playUntil(state, 'strong', 'fair', (s) => s.round === 3 && s.turn === 5);
    state.selected = Math.min(2, state.you.hand.length - 1);
    state.laneFocus = 1;
    state.rivalTell = favouredLane(state, 'fair');
    return { state, screen: SCREEN_PLAY };
  }
  if (name === 'win' || name === 'loss') {
    // A full match, played out: a strong keeper beats a weak Rin, and a weak
    // keeper loses to a strong one.
    const youSkill = name === 'win' ? 'strong' : 'weak';
    const rivalSkill = name === 'win' ? 'weak' : 'strong';
    playUntil(state, youSkill, rivalSkill, () => false);
    return { state, screen: SCREEN_MATCH };
  }
  // Title: a table already mid-duel behind the title, dealt by the real rules.
  playUntil(state, 'fair', 'fair', (s) => s.round === 1 && s.turn === 3);
  state.screen = SCREEN_TITLE;
  state.message = '';
  return { state, screen: SCREEN_TITLE };
}
