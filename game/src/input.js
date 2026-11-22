// Keyboard and mouse, read as actions: the game loop polls them each frame,
// so a key held down never repeats a move and a click lands exactly once.

import { TABLE } from './config.js';

export const ACTION_CONFIRM = 1 << 0;
export const ACTION_HOLD = 1 << 1;
export const ACTION_RESTART = 1 << 2;
export const ACTION_PREV_CARD = 1 << 3;
export const ACTION_NEXT_CARD = 1 << 4;
export const ACTION_PREV_LANE = 1 << 5;
export const ACTION_NEXT_LANE = 1 << 6;
export const ACTION_PLAY = 1 << 7;

/** Key names to actions. Enter doubles as play while a card is selected. */
const KEY_ACTIONS = {
  ' ': ACTION_CONFIRM,
  Enter: ACTION_CONFIRM,
  h: ACTION_HOLD,
  H: ACTION_HOLD,
  r: ACTION_RESTART,
  R: ACTION_RESTART,
  ArrowLeft: ACTION_PREV_CARD,
  ArrowRight: ACTION_NEXT_CARD,
  ArrowUp: ACTION_PREV_LANE,
  ArrowDown: ACTION_NEXT_LANE,
};

/** Listen on the canvas and the window; hand the loop queued actions and clicks. */
export function createInput(canvas) {
  let queued = 0;
  const clicks = [];

  function toLogical(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const scale = Math.min(rect.width / TABLE.width, rect.height / TABLE.height);
    const offsetX = (rect.width - TABLE.width * scale) / 2;
    const offsetY = (rect.height - TABLE.height * scale) / 2;
    return {
      x: (clientX - rect.left - offsetX) / scale,
      y: (clientY - rect.top - offsetY) / scale,
    };
  }

  window.addEventListener('keydown', (event) => {
    const action = KEY_ACTIONS[event.key];
    if (action === undefined) return;
    if ([' ', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
      event.preventDefault();
    }
    queued |= action;
  });

  canvas.addEventListener('pointerdown', (event) => {
    clicks.push(toLogical(event.clientX, event.clientY));
  });

  function takeActions() {
    const actions = queued;
    queued = 0;
    return actions;
  }

  function takeClicks() {
    return clicks.splice(0, clicks.length);
  }

  return { takeActions, takeClicks, toLogical };
}
