// The table, painted on one canvas: a lantern-lit river at dusk, three
// barges, two hands of cards, spirit bars and lanterns. Every suit is told
// apart by colour and by its drawn shape, so the table reads at thumbnail
// size as well as full screen.

import { CARD, LANES, PALETTE, RIVAL_NAME, SUITS, TABLE } from './config.js';
import { cardName, cardText } from './cards.js';
import { laneTotal, SCREEN_MATCH, SCREEN_PLAY, SCREEN_ROUND, SCREEN_TITLE } from './game.js';

export { SCREEN_MATCH, SCREEN_PLAY, SCREEN_ROUND, SCREEN_TITLE };

const TAU = Math.PI * 2;

/** Round a rectangle path, then fill or stroke it. */
function rounded(ctx, x, y, w, h, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

/** Draw one suit's shape at (cx, cy), sized `s`, in `color`. */
export function drawSuitGlyph(ctx, suit, cx, cy, s, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(1.5, s * 0.09);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  if (suit === 'ember') {
    // A flame: a teardrop that leans and flickers.
    ctx.beginPath();
    ctx.moveTo(cx, cy - s * 0.55);
    ctx.bezierCurveTo(cx + s * 0.42, cy - s * 0.1, cx + s * 0.34, cy + s * 0.34, cx, cy + s * 0.42);
    ctx.bezierCurveTo(cx - s * 0.34, cy + s * 0.34, cx - s * 0.42, cy - s * 0.1, cx, cy - s * 0.55);
    ctx.fill();
    ctx.fillStyle = '#ffd98a';
    ctx.beginPath();
    ctx.moveTo(cx, cy - s * 0.1);
    ctx.bezierCurveTo(cx + s * 0.18, cy + s * 0.08, cx + s * 0.14, cy + s * 0.26, cx, cy + s * 0.3);
    ctx.bezierCurveTo(cx - s * 0.14, cy + s * 0.26, cx - s * 0.18, cy + s * 0.08, cx, cy - s * 0.1);
    ctx.fill();
  } else if (suit === 'tide') {
    // A wave: three stacked swells.
    for (let row = 0; row < 3; row += 1) {
      const y = cy - s * 0.3 + row * s * 0.3;
      ctx.beginPath();
      ctx.moveTo(cx - s * 0.45, y);
      ctx.quadraticCurveTo(cx - s * 0.22, y - s * 0.22, cx, y);
      ctx.quadraticCurveTo(cx + s * 0.22, y + s * 0.22, cx + s * 0.45, y);
      ctx.quadraticCurveTo(cx + s * 0.22, y + s * 0.42, cx, y + s * 0.18);
      ctx.quadraticCurveTo(cx - s * 0.22, y - s * 0.06, cx - s * 0.45, y);
      ctx.fill();
    }
  } else if (suit === 'leaf') {
    // A leaf: two arcs meeting at tip and stem.
    ctx.beginPath();
    ctx.moveTo(cx, cy - s * 0.5);
    ctx.quadraticCurveTo(cx + s * 0.5, cy - s * 0.1, cx, cy + s * 0.45);
    ctx.quadraticCurveTo(cx - s * 0.5, cy - s * 0.1, cx, cy - s * 0.5);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx, cy - s * 0.42);
    ctx.lineTo(cx, cy + s * 0.42);
    ctx.stroke();
  } else {
    // A crescent moon: a disc with a bite taken out of it.
    ctx.beginPath();
    ctx.arc(cx, cy, s * 0.45, 0, TAU);
    ctx.arc(cx + s * 0.22, cy - s * 0.1, s * 0.38, 0, TAU);
    ctx.fill('evenodd');
  }
  ctx.restore();
}

/** A small paper lantern, lit (warm glow) or dark. */
function drawLantern(ctx, x, y, size, lit) {
  ctx.save();
  if (lit) {
    const glow = ctx.createRadialGradient(x, y, 2, x, y, size * 1.6);
    glow.addColorStop(0, 'rgba(242, 201, 76, 0.55)');
    glow.addColorStop(1, 'rgba(242, 201, 76, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, size * 1.6, 0, TAU);
    ctx.fill();
  }
  ctx.fillStyle = lit ? '#f2c94c' : '#3a4266';
  rounded(ctx, x - size * 0.42, y - size * 0.5, size * 0.84, size, size * 0.2);
  ctx.fill();
  ctx.strokeStyle = lit ? '#8a6a1d' : '#232a4a';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x, y - size * 0.5);
  ctx.lineTo(x, y - size * 0.72);
  ctx.stroke();
  ctx.fillStyle = lit ? '#fff3c4' : '#2c3355';
  ctx.fillRect(x - size * 0.42, y - size * 0.12, size * 0.84, size * 0.1);
  ctx.fillRect(x - size * 0.42, y + size * 0.14, size * 0.84, size * 0.1);
  ctx.restore();
}

/** A spirit bar: a labelled meter that drains as a keeper loses spirit. */
function drawSpirit(ctx, x, y, w, label, spirit, max, color) {
  ctx.save();
  ctx.font = '600 15px ' + '"Avenir Next", "Trebuchet MS", system-ui, sans-serif';
  ctx.fillStyle = PALETTE.text;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, x, y);
  const barX = x + 64;
  const barW = w - 64;
  rounded(ctx, barX, y - 9, barW, 18, 9);
  ctx.fillStyle = '#0a0f22';
  ctx.fill();
  const fillW = Math.max(0, (barW * spirit) / max);
  if (fillW > 0) {
    rounded(ctx, barX, y - 9, fillW, 18, 9);
    ctx.fillStyle = spirit <= 6 ? PALETTE.danger : color;
    ctx.fill();
  }
  ctx.fillStyle = PALETTE.text;
  ctx.textAlign = 'right';
  ctx.fillText(`${spirit}`, barX + barW + 34, y);
  ctx.restore();
}

/** Where everything sits on the 1280x800 table. */
export function layout(state) {
  const laneW = 384;
  const laneGap = 24;
  const laneX0 = 40;
  const lanes = LANES.map((lane, index) => ({
    ...lane,
    x: laneX0 + index * (laneW + laneGap),
    y: 204,
    w: laneW,
    h: 348,
  }));
  const hand = state.you.hand;
  const handW = CARD.handW;
  const handGap = 12;
  const totalW = hand.length * handW + (hand.length - 1) * handGap;
  const handX0 = (TABLE.width - totalW) / 2;
  const playerHand = hand.map((card, index) => ({
    card,
    index,
    x: handX0 + index * (handW + handGap),
    y: 618,
    w: handW,
    h: CARD.handH,
  }));
  const rivalCount = state.rival.hand.length;
  const backStep = Math.min(74, (TABLE.width - 560) / Math.max(1, rivalCount));
  const rivalHand = [];
  for (let index = 0; index < rivalCount; index += 1) {
    rivalHand.push({
      x: TABLE.width / 2 - ((rivalCount - 1) * backStep) / 2 + index * backStep - CARD.backW / 2,
      y: 92,
      w: CARD.backW,
      h: CARD.backH,
    });
  }
  return {
    lanes,
    playerHand,
    rivalHand,
    holdBtn: { x: TABLE.width - 158, y: 640, w: 118, h: 46 },
    deckPos: { x: TABLE.width - 118, y: 196 },
  };
}

/** Slot position of a played card inside its lane. */
function laneSlot(layoutOut, laneIndex, side, slot, count) {
  const lane = layoutOut.lanes[laneIndex];
  const w = CARD.tableW;
  const step = count <= 1 ? 0 : Math.min(96, (lane.w - 32 - w) / (count - 1));
  const x0 = lane.x + 16 + (count > 1 ? 0 : (lane.w - 32 - w) / 2);
  const x = count <= 1 ? x0 : lane.x + 16 + slot * step;
  const y = side === 'rival' ? lane.y + 46 : lane.y + 188;
  return { x, y, w, h: CARD.tableH };
}

/** One face-up card, drawn at (x, y) with width w and height h. A played
 *  trick card shows its resolved power and suit, so a Mirror Kite reads as
 *  the card it copied. */
function drawCardFace(ctx, card, x, y, w, h, small = false, resolvedPower = null, resolvedSuit = null) {
  const shownSuit = SUITS[resolvedSuit ?? card.suit];
  const suit = shownSuit;
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 4;
  rounded(ctx, x, y, w, h, 10);
  ctx.fillStyle = '#f7f1de';
  ctx.fill();
  ctx.shadowColor = 'transparent';
  rounded(ctx, x, y, w, h, 10);
  ctx.strokeStyle = suit.deep;
  ctx.lineWidth = 2;
  ctx.stroke();
  // Suit band across the top.
  rounded(ctx, x + 2, y + 2, w - 4, h * 0.2, 8);
  ctx.fillStyle = suit.color;
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = `700 ${small ? 11 : 13}px "Avenir Next", "Trebuchet MS", system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(suit.name.toUpperCase(), x + w / 2, y + h * 0.11);
  // The value, big and centred, with the suit's shape beneath it.
  ctx.fillStyle = suit.deep;
  ctx.font = `800 ${small ? 34 : 44}px "Avenir Next", "Trebuchet MS", system-ui, sans-serif`;
  const valueText = resolvedPower !== null ? String(resolvedPower) : card.trick ? '★' : String(card.value);
  ctx.fillText(valueText, x + w / 2, y + h * 0.48);
  drawSuitGlyph(ctx, suit.key, x + w / 2, y + h * 0.68, small ? 15 : 20, suit.color);
  // Name and trick line at the foot, the trick text wrapped to two lines.
  ctx.fillStyle = '#2c2a24';
  ctx.font = `700 ${small ? 10 : 12}px "Avenir Next", "Trebuchet MS", system-ui, sans-serif`;
  ctx.fillText(cardName(card), x + w / 2, y + h * 0.84);
  if (card.trick && !small) {
    ctx.fillStyle = '#6a6252';
    ctx.font = '9px "Avenir Next", "Trebuchet MS", system-ui, sans-serif';
    const lines = wrapText(ctx, cardText(card), w - 12);
    lines.slice(0, 2).forEach((line, index) => {
      ctx.fillText(line, x + w / 2, y + h * 0.91 + index * 10);
    });
  }
  ctx.restore();
}

/** Split `text` into lines that fit `maxWidth`, word by word. */
function wrapText(ctx, text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/** One face-down card back: indigo paper, a gold crescent. */
function drawCardBack(ctx, x, y, w, h) {
  ctx.save();
  rounded(ctx, x, y, w, h, 8);
  ctx.fillStyle = '#232a5e';
  ctx.fill();
  ctx.strokeStyle = '#f2c94c';
  ctx.lineWidth = 1.5;
  rounded(ctx, x + 4, y + 4, w - 8, h - 8, 6);
  ctx.stroke();
  drawSuitGlyph(ctx, 'moon', x + w / 2, y + h / 2, 16, '#f2c94c');
  ctx.restore();
}

/** The river at dusk behind everything: sky, hills, water, lantern string. */
function drawBackdrop(ctx) {
  const sky = ctx.createLinearGradient(0, 0, 0, TABLE.height);
  sky.addColorStop(0, PALETTE.skyTop);
  sky.addColorStop(0.55, PALETTE.skyBottom);
  sky.addColorStop(0.56, PALETTE.riverTop);
  sky.addColorStop(1, PALETTE.riverBottom);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, TABLE.width, TABLE.height);
  // Stars.
  ctx.fillStyle = 'rgba(244, 239, 226, 0.7)';
  const stars = [[60, 40], [180, 90], [320, 30], [520, 70], [700, 36], [900, 80], [1080, 44], [1210, 96], [420, 120], [980, 130]];
  for (const [x, y] of stars) {
    ctx.beginPath();
    ctx.arc(x, y, 2, 0, TAU);
    ctx.fill();
  }
  // Distant hills.
  ctx.fillStyle = '#131a3d';
  ctx.beginPath();
  ctx.moveTo(0, 430);
  ctx.quadraticCurveTo(220, 380, 460, 428);
  ctx.quadraticCurveTo(760, 470, 1020, 420);
  ctx.quadraticCurveTo(1180, 396, 1280, 424);
  ctx.lineTo(1280, 470);
  ctx.lineTo(0, 470);
  ctx.closePath();
  ctx.fill();
  // A string of lanterns across the very top, clear of the header text.
  ctx.strokeStyle = '#3a4266';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 4);
  ctx.quadraticCurveTo(640, 24, 1280, 4);
  ctx.stroke();
  for (let index = 0; index < 9; index += 1) {
    const x = 80 + index * 140;
    const y = 4 + Math.sin((x / 1280) * Math.PI) * 20;
    drawLantern(ctx, x, y + 12, 14, true);
  }
}

/** The header: title, round and turn, and the rival's spirit and lanterns. */
function drawHeader(ctx, state) {
  ctx.save();
  ctx.textBaseline = 'middle';
  ctx.fillStyle = PALETTE.gold;
  ctx.font = '800 20px "Avenir Next", "Trebuchet MS", system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('LANTERN RITE', 40, 58);
  ctx.fillStyle = PALETTE.muted;
  ctx.font = '600 15px "Avenir Next", "Trebuchet MS", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`Round ${state.round} · Turn ${Math.min(state.turn, 6)} of 6`, TABLE.width / 2, 58);
  drawSpirit(ctx, TABLE.width - 460, 58, 270, RIVAL_NAME.split(',')[0], state.rival.spirit, 20, PALETTE.rival);
  for (let index = 0; index < 3; index += 1) {
    drawLantern(ctx, TABLE.width - 130 + index * 30, 58, 18, index < state.rival.lanterns);
  }
  ctx.restore();
}

/** One barge: its name, the two rows of cards, totals and the winner's glow. */
function drawLane(ctx, state, layoutOut, laneIndex) {
  const lane = layoutOut.lanes[laneIndex];
  const result = state.roundResult ? state.roundResult.lanes[laneIndex] : null;
  ctx.save();
  rounded(ctx, lane.x, lane.y, lane.w, lane.h, 16);
  ctx.fillStyle = PALETTE.felt;
  ctx.fill();
  ctx.strokeStyle = state.rivalTell === laneIndex ? PALETTE.gold : PALETTE.tableEdge;
  ctx.lineWidth = state.rivalTell === laneIndex ? 3 : 2;
  ctx.stroke();
  // Name banner. Rin's tell rides in the name: she eyes this barge.
  ctx.fillStyle = lane.tint;
  ctx.font = '800 16px "Avenir Next", "Trebuchet MS", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(state.rivalTell === laneIndex ? `${lane.name} · Rin eyes it` : lane.name, lane.x + lane.w / 2, lane.y + 22);
  // Played cards, sliding in from where they were played. A played trick
  // card shows what it resolved to, not its printed face.
  for (const side of ['rival', 'you']) {
    const entries = state.lanes[laneIndex][side];
    entries.forEach((entry, slot) => {
      const target = laneSlot(layoutOut, laneIndex, side, slot, entries.length);
      const t = entry.animT >= 1 ? 1 : entry.animT;
      const ease = 1 - (1 - t) * (1 - t);
      const x = entry.fromX + (target.x - entry.fromX) * ease;
      const y = entry.fromY + (target.y - entry.fromY) * ease;
      ctx.globalAlpha = 0.35 + 0.65 * ease;
      drawCardFace(ctx, entry.card, x, y, target.w, target.h, true, entry.power, entry.suit);
      ctx.globalAlpha = 1;
    });
  }
  // Totals strip, with a star on the side that lit the barge.
  const yours = laneTotal(state, laneIndex, 'you');
  const theirs = laneTotal(state, laneIndex, 'rival');
  const totalY = lane.y + lane.h - 26;
  ctx.font = '700 17px "Avenir Next", "Trebuchet MS", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.you;
  ctx.fillText(`${result && result.winner === 'you' ? '★ ' : ''}You ${yours.total}`, lane.x + 74, totalY);
  ctx.fillStyle = PALETTE.muted;
  ctx.fillText('—', lane.x + lane.w / 2, totalY);
  ctx.fillStyle = PALETTE.rival;
  ctx.fillText(`${theirs.total} Rin${result && result.winner === 'rival' ? ' ★' : ''}`, lane.x + lane.w - 74, totalY);
  // Harmony and run badges, where they kindled, in the gap between the rows.
  const badges = [];
  if (yours.harmony) badges.push('Harmony +3');
  if (yours.run) badges.push('Run +2');
  if (theirs.harmony) badges.push('Rin Harmony +3');
  if (theirs.run) badges.push('Rin Run +2');
  if (badges.length > 0) {
    ctx.fillStyle = PALETTE.gold;
    ctx.font = '600 12px "Avenir Next", "Trebuchet MS", system-ui, sans-serif';
    ctx.fillText(badges.join(' · '), lane.x + lane.w / 2, lane.y + 176);
  }
  ctx.restore();
}

/** The player's hand, fanned, the selected card raised and outlined. */
function drawPlayerHand(ctx, state, layoutOut) {
  ctx.save();
  for (const slot of layoutOut.playerHand) {
    const selected = state.selected === slot.index;
    const y = selected ? slot.y - 26 : slot.y;
    if (selected) {
      rounded(ctx, slot.x - 4, y - 4, slot.w + 8, slot.h + 8, 12);
      ctx.strokeStyle = PALETTE.gold;
      ctx.lineWidth = 3;
      ctx.stroke();
    }
    drawCardFace(ctx, slot.card, slot.x, y, slot.w, slot.h, false);
  }
  ctx.restore();
}

/** The footer: your spirit and lanterns, the log line, the Hold button. */
function drawFooter(ctx, state, layoutOut) {
  ctx.save();
  drawSpirit(ctx, 40, 590, 300, 'You', state.you.spirit, 20, PALETTE.you);
  for (let index = 0; index < 3; index += 1) {
    drawLantern(ctx, 400 + index * 30, 590, 18, index < state.you.lanterns);
  }
  // The log line, wrapped to the middle of the footer so it never reaches
  // the lanterns on the left or the deck count on the right.
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = PALETTE.text;
  ctx.font = '600 14px "Avenir Next", "Trebuchet MS", system-ui, sans-serif';
  const messageLines = wrapText(ctx, state.message || '', 470);
  messageLines.slice(0, 2).forEach((line, index) => {
    ctx.fillText(line, TABLE.width / 2, messageLines.length > 1 ? 582 + index * 17 : 590);
  });
  // Deck count.
  ctx.fillStyle = PALETTE.muted;
  ctx.font = '600 14px "Avenir Next", "Trebuchet MS", system-ui, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(`Deck: ${state.deck.cards.length}`, TABLE.width - 40, 590);
  // Hold button.
  const btn = layoutOut.holdBtn;
  rounded(ctx, btn.x, btn.y, btn.w, btn.h, 10);
  ctx.fillStyle = state.phase === 'player' ? '#2c3a63' : '#1a2340';
  ctx.fill();
  ctx.strokeStyle = PALETTE.panelEdge;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = PALETTE.text;
  ctx.font = '700 16px "Avenir Next", "Trebuchet MS", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Hold  (H)', btn.x + btn.w / 2, btn.y + btn.h / 2 + 1);
  // Keyboard hints.
  ctx.fillStyle = PALETTE.muted;
  ctx.font = '600 13px "Avenir Next", "Trebuchet MS", system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('← → choose card · ↑ ↓ choose barge · Enter play · H hold', 40, 786);
  ctx.restore();
}

/** A centred overlay panel for the title, round and match screens. */
function drawOverlay(ctx, state, lines, buttonLabel) {
  ctx.save();
  ctx.fillStyle = 'rgba(8, 10, 26, 0.72)';
  ctx.fillRect(0, 0, TABLE.width, TABLE.height);
  const panelW = 760;
  const panelH = 120 + lines.length * 34 + 84;
  const panelX = (TABLE.width - panelW) / 2;
  const panelY = (TABLE.height - panelH) / 2;
  rounded(ctx, panelX, panelY, panelW, panelH, 20);
  ctx.fillStyle = '#141c38';
  ctx.fill();
  ctx.strokeStyle = PALETTE.gold;
  ctx.lineWidth = 2;
  ctx.stroke();
  let y = panelY + 34;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (const line of lines) {
    ctx.fillStyle = line.color || PALETTE.text;
    ctx.font = line.font || '600 17px "Avenir Next", "Trebuchet MS", system-ui, sans-serif';
    ctx.fillText(line.text, TABLE.width / 2, y);
    y += 34;
  }
  if (buttonLabel) {
    const btn = { x: TABLE.width / 2 - 130, y: panelY + panelH - 66, w: 260, h: 48 };
    rounded(ctx, btn.x, btn.y, btn.w, btn.h, 12);
    ctx.fillStyle = PALETTE.gold;
    ctx.fill();
    ctx.fillStyle = '#1a1405';
    ctx.font = '800 18px "Avenir Next", "Trebuchet MS", system-ui, sans-serif';
    ctx.fillText(buttonLabel, TABLE.width / 2, btn.y + btn.h / 2 + 1);
    state.actionButton = btn;
  } else {
    state.actionButton = null;
  }
  ctx.restore();
}

/** The title screen: a dimmed table behind the name, the rules, and the invitation to begin. */
function drawTitle(ctx, state) {
  ctx.save();
  ctx.fillStyle = 'rgba(8, 10, 26, 0.62)';
  ctx.fillRect(0, 0, TABLE.width, TABLE.height);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = PALETTE.gold;
  ctx.font = '800 84px "Avenir Next", "Trebuchet MS", system-ui, sans-serif';
  ctx.fillText('LANTERN RITE', TABLE.width / 2, 236);
  ctx.fillStyle = PALETTE.text;
  ctx.font = '600 24px "Avenir Next", "Trebuchet MS", system-ui, sans-serif';
  ctx.fillText('A card duel on the river, under three lantern barges', TABLE.width / 2, 296);
  const rules = [
    'Play one card a turn into a barge — the higher total lights it.',
    'Match a suit for Harmony +3 · values one apart for a Run +2.',
    'Trick cards bend the duel: Mirror Kite copies, Gale Fan blows away, Ember Charm kindles.',
    'Light two barges to win the round. Three lanterns — or a spent spirit — wins the match.',
  ];
  ctx.font = '600 17px "Avenir Next", "Trebuchet MS", system-ui, sans-serif';
  ctx.fillStyle = PALETTE.muted;
  rules.forEach((line, index) => {
    ctx.fillText(line, TABLE.width / 2, 366 + index * 30);
  });
  ctx.fillStyle = PALETTE.gold;
  ctx.font = '800 22px "Avenir Next", "Trebuchet MS", system-ui, sans-serif';
  const pulse = 0.65 + 0.35 * Math.sin(Date.now() / 400);
  ctx.globalAlpha = pulse;
  ctx.fillText('Click or press Space to begin', TABLE.width / 2, 574);
  ctx.globalAlpha = 1;
  ctx.restore();
}

/** The round result: which barges lit, the damage, the lantern. */
function drawRound(ctx, state) {
  const result = state.roundResult;
  const lines = [];
  if (result.roundWinner === 'you') {
    lines.push({ text: `You take Round ${state.round - 1}!`, color: PALETTE.you, font: '800 30px "Avenir Next", "Trebuchet MS", system-ui, sans-serif' });
    lines.push({ text: `Rin loses ${result.damage} spirit · you light a lantern`, color: PALETTE.text });
  } else if (result.roundWinner === 'rival') {
    lines.push({ text: `Rin takes Round ${state.round - 1}`, color: PALETTE.rival, font: '800 30px "Avenir Next", "Trebuchet MS", system-ui, sans-serif' });
    lines.push({ text: `You lose ${result.damage} spirit · Rin lights a lantern`, color: PALETTE.text });
  } else {
    lines.push({ text: `Round ${state.round - 1} is a draw`, color: PALETTE.text, font: '800 30px "Avenir Next", "Trebuchet MS", system-ui, sans-serif' });
    lines.push({ text: 'No lantern, no spirit lost', color: PALETTE.text });
  }
  for (const lane of result.lanes) {
    const name = LANES[lane.index].name;
    const outcome = lane.winner === 'you' ? `yours, ${lane.you.total} — ${lane.rival.total}` : lane.winner === 'rival' ? `Rin's, ${lane.rival.total} — ${lane.you.total}` : `tied, ${lane.you.total} — ${lane.rival.total}`;
    lines.push({ text: `${name}: ${outcome}`, color: PALETTE.muted, font: '600 15px "Avenir Next", "Trebuchet MS", system-ui, sans-serif' });
  }
  lines.push({ text: `Lanterns — You ${state.you.lanterns} · Rin ${state.rival.lanterns}    Spirit — You ${state.you.spirit} · Rin ${state.rival.spirit}`, color: PALETTE.text });
  drawOverlay(ctx, state, lines, 'Continue  (Space)');
}

/** The match end: a win or a loss, the final score, and a fresh duel. */
function drawMatch(ctx, state) {
  const won = state.matchWinner === 'you';
  const lines = [
    { text: won ? 'THE RIVER IS YOURS' : 'THE LANTERNS DIM', color: won ? PALETTE.gold : PALETTE.rival, font: '800 44px "Avenir Next", "Trebuchet MS", system-ui, sans-serif' },
    { text: won ? 'Every lantern on the river burns for you tonight.' : 'Rin keeps the river tonight. The barges drift home dark.', color: PALETTE.text },
    { text: `Final — Lanterns: You ${state.you.lanterns} · Rin ${state.rival.lanterns}    Spirit: You ${state.you.spirit} · Rin ${state.rival.spirit}`, color: PALETTE.muted },
    { text: `Rounds played: ${state.roundCount}`, color: PALETTE.muted, font: '600 15px "Avenir Next", "Trebuchet MS", system-ui, sans-serif' },
  ];
  drawOverlay(ctx, state, lines, 'Play again  (R)');
}

/** Create the renderer for a canvas: draw(state) paints the current screen. */
export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  function draw(state) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const scale = Math.min(canvas.width / TABLE.width, canvas.height / TABLE.height);
    const offsetX = (canvas.width - TABLE.width * scale) / 2;
    const offsetY = (canvas.height - TABLE.height * scale) / 2;
    ctx.setTransform(scale, 0, 0, scale, offsetX, offsetY);
    drawBackdrop(ctx);
    const layoutOut = layout(state);
    state.layout = layoutOut;
    drawHeader(ctx, state);
    for (const slot of layoutOut.rivalHand) drawCardBack(ctx, slot.x, slot.y, slot.w, slot.h);
    for (let index = 0; index < LANES.length; index += 1) drawLane(ctx, state, layoutOut, index);
    drawPlayerHand(ctx, state, layoutOut);
    drawFooter(ctx, state, layoutOut);
    if (state.screen === SCREEN_TITLE) drawTitle(ctx, state);
    else if (state.screen === SCREEN_ROUND) drawRound(ctx, state);
    else if (state.screen === SCREEN_MATCH) drawMatch(ctx, state);
    else state.actionButton = null;
  }
  return { draw };
}
