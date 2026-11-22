// Lantern Rite, boot and the one loop: input is read every frame, played
// cards slide in over a few frames, Rin thinks for a beat (showing her tell)
// before she plays, and the renderer paints what is there. The game moves
// between four screens: title, play, round result and match end.
//
// ?seed=N fixes the deal. ?shot=title|play|win|loss (with &seed=N) stages
// that scene instead of running the loop, paints it twice and sets
// window.__shotReady for a screenshot.

import { createRandom } from './random.js';
import { chooseMove, favouredLane } from './ai.js';
import { playSound, winSound, loseSound } from './sound.js';
import {
  advanceAnimations,
  applyRoundResult,
  createMatch,
  drawForTurn,
  endTurn,
  holdTurn,
  matchWinner,
  playCard,
  resolveRound,
  SCREEN_MATCH,
  SCREEN_PLAY,
  SCREEN_ROUND,
  SCREEN_TITLE,
  startMatch,
  startRound,
} from './game.js';
import {
  ACTION_CONFIRM,
  ACTION_HOLD,
  ACTION_NEXT_CARD,
  ACTION_NEXT_LANE,
  ACTION_PREV_CARD,
  ACTION_PREV_LANE,
  ACTION_RESTART,
  createInput,
} from './input.js';
import { createRenderer } from './render.js';
import { stageShot } from './shots.js';

/** How long Rin studies the barges before she plays, in seconds. */
const RIVAL_THINK_SECONDS = 0.9;
/** How long the scored barges stay on the table before the round panel. */
const RESOLVE_SECONDS = 1.8;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const renderer = createRenderer(canvas);

/** The status line screen readers announce. */
function announce(message) {
  status.textContent = message;
}

/** A screenshot scene: stage it, paint it twice, flag it ready. */
function runShot(name) {
  const staged = stageShot(name, seed);
  let painted = 0;
  function paint() {
    renderer.draw(staged.state);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

/** The live game: one loop, one match, Rin's turns on a timer. */
function runGame() {
  const input = createInput(canvas);
  const state = createMatch(createRandom(seed));
  let rivalMove = null;
  let phaseUntil = 0;
  let resolvingResult = null;

  /** Rin's turn begins: her move is chosen now, so her tell names it truly. */
  function beginRivalTurn() {
    state.phase = 'rival';
    rivalMove = chooseMove(state, 'rival', 'fair');
    state.rivalTell = rivalMove.kind === 'play' ? rivalMove.laneIndex : favouredLane(state, 'fair');
    phaseUntil = performance.now() / 1000 + RIVAL_THINK_SECONDS;
  }

  /** After a keeper's move: advance the turn, or score the round. */
  function afterMove() {
    if (endTurn(state)) {
      resolvingResult = resolveRound(state);
      state.roundResult = resolvingResult;
      state.phase = 'resolving';
      phaseUntil = performance.now() / 1000 + RESOLVE_SECONDS;
      return;
    }
    drawForTurn(state);
    state.phase = 'player';
  }

  /** Play the selected card into the focused barge. */
  function playSelected() {
    if (state.phase !== 'player' || state.selected === null) return;
    const slot = state.layout ? state.layout.playerHand[state.selected] : null;
    const fromX = slot ? slot.x + slot.w / 2 : 640;
    const fromY = slot ? slot.y + slot.h / 2 : 700;
    playCard(state, 'you', state.selected, state.laneFocus, fromX, fromY);
    playSound();
    beginRivalTurn();
  }

  /** Hold: draw an extra card and hand the turn to Rin. */
  function hold() {
    if (state.phase !== 'player') return;
    holdTurn(state, 'you');
    beginRivalTurn();
  }

  function startNewMatch() {
    startMatch(state);
    announce('A new duel. Play a card into a barge — or hold to draw.');
  }

  function handleActions(now) {
    const actions = input.takeActions();
    if (actions & ACTION_RESTART && state.screen !== SCREEN_TITLE) {
      startNewMatch();
      return;
    }
    if (state.screen === SCREEN_TITLE) {
      if (actions & ACTION_CONFIRM) startNewMatch();
      return;
    }
    if (state.screen === SCREEN_ROUND) {
      if (actions & ACTION_CONFIRM) {
        startRound(state);
        drawForTurn(state);
        state.phase = 'player';
        announce(`Round ${state.round}. Your move.`);
      }
      return;
    }
    if (state.screen === SCREEN_MATCH) {
      if (actions & ACTION_CONFIRM) startNewMatch();
      return;
    }
    // Screen is play.
    if (state.phase !== 'player') return;
    if (actions & ACTION_HOLD) {
      hold();
      return;
    }
    if (actions & ACTION_PREV_CARD) {
      const count = state.you.hand.length;
      state.selected = state.selected === null ? 0 : (state.selected + count - 1) % count;
    }
    if (actions & ACTION_NEXT_CARD) {
      const count = state.you.hand.length;
      state.selected = state.selected === null ? 0 : (state.selected + 1) % count;
    }
    if (actions & ACTION_PREV_LANE) {
      state.laneFocus = (state.laneFocus + 2) % 3;
    }
    if (actions & ACTION_NEXT_LANE) {
      state.laneFocus = (state.laneFocus + 1) % 3;
    }
    if (actions & ACTION_CONFIRM) playSelected();
  }

  function handleClicks() {
    for (const click of input.takeClicks()) {
      if (state.actionButton) {
        const btn = state.actionButton;
        if (click.x >= btn.x && click.x <= btn.x + btn.w && click.y >= btn.y && click.y <= btn.y + btn.h) {
          if (state.screen === SCREEN_TITLE) startNewMatch();
          else if (state.screen === SCREEN_ROUND) {
            startRound(state);
            drawForTurn(state);
            state.phase = 'player';
          } else if (state.screen === SCREEN_MATCH) startNewMatch();
          continue;
        }
      }
      if (state.screen === SCREEN_TITLE) {
        startNewMatch();
        continue;
      }
      if (state.screen !== SCREEN_PLAY || state.phase !== 'player') continue;
      const layoutOut = state.layout;
      if (!layoutOut) continue;
      // The Hold button.
      const holdBtn = layoutOut.holdBtn;
      if (click.x >= holdBtn.x && click.x <= holdBtn.x + holdBtn.w && click.y >= holdBtn.y && click.y <= holdBtn.y + holdBtn.h) {
        hold();
        continue;
      }
      // The player's hand: a click selects that card.
      let picked = null;
      for (const slot of layoutOut.playerHand) {
        const raised = state.selected === slot.index ? 26 : 0;
        if (click.x >= slot.x && click.x <= slot.x + slot.w && click.y >= slot.y - raised && click.y <= slot.y + slot.h) {
          picked = slot.index;
        }
      }
      if (picked !== null) {
        state.selected = picked;
        continue;
      }
      // A barge: a click with a card selected plays it there.
      for (let index = 0; index < layoutOut.lanes.length; index += 1) {
        const lane = layoutOut.lanes[index];
        if (click.x >= lane.x && click.x <= lane.x + lane.w && click.y >= lane.y && click.y <= lane.y + lane.h) {
          state.laneFocus = index;
          if (state.selected !== null) playSelected();
        }
      }
    }
  }

  function frame(nowMs) {
    requestAnimationFrame(frame);
    const now = nowMs / 1000;
    const dt = 1 / 60;
    advanceAnimations(state, dt);
    handleActions(now);
    handleClicks();
    if (state.screen === SCREEN_PLAY && state.phase === 'rival' && now >= phaseUntil && rivalMove) {
      const move = rivalMove;
      rivalMove = null;
      if (move.kind === 'play') {
        playCard(state, 'rival', move.handIndex, move.laneIndex, 640, 120);
        playSound();
        state.lastRivalMove = move;
      } else {
        holdTurn(state, 'rival');
      }
      afterMove();
    }
    if (state.screen === SCREEN_PLAY && state.phase === 'resolving' && now >= phaseUntil && resolvingResult) {
      const result = resolvingResult;
      resolvingResult = null;
      const winner = applyRoundResult(state, result);
      if (winner === 'you') winSound();
      else if (winner === 'rival') loseSound();
      else if (result.roundWinner === 'you') winSound();
      else if (result.roundWinner === 'rival') loseSound();
      if (winner) announce(matchWinner(state) === 'you' ? 'You win the match!' : 'Rin wins the match.');
      else announce('Round over. Press Space to continue.');
    }
    renderer.draw(state);
  }

  announce('Lantern Rite. Press Space or click to begin.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
