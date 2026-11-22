// Small sounds, synthesised with WebAudio — no audio files, no network.
// Each is a short blip or chime, created only after the player has acted,
// so a quiet browser never blocks the game.

let audio = null;

function context() {
  if (audio) return audio;
  try {
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return null;
    audio = new Ctor();
  } catch {
    return null;
  }
  return audio;
}

/** One note: an oscillator that fades out over `seconds`. */
function note(frequency, seconds, type = 'sine', volume = 0.08) {
  const ctx = context();
  if (!ctx) return;
  try {
    if (ctx.state === 'suspended') void ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + seconds);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + seconds);
  } catch {
    // Sound is garnish: a failure here never stops the game.
  }
}

/** A card landing on a barge. */
export function playSound() {
  note(520, 0.09, 'triangle', 0.07);
  setTimeout(() => note(780, 0.12, 'triangle', 0.05), 60);
}

/** A round won: a small rising chime. */
export function winSound() {
  [523, 659, 784].forEach((frequency, index) => {
    setTimeout(() => note(frequency, 0.25, 'sine', 0.08), index * 110);
  });
}

/** A round lost: a low falling tone. */
export function loseSound() {
  note(330, 0.3, 'sine', 0.07);
  setTimeout(() => note(220, 0.4, 'sine', 0.06), 140);
}
