// input.js — mouse and keyboard for Ember & Ladle.
// Clicks hit the kitchen zones; keys mirror them so the game plays either way.

import { hitZone } from './kitchen.js';
import { INGREDIENTS, BIN_ORDER } from './recipes.js';
import { unlockAudio } from './audio.js';

/**
 * Wire the canvas up. `game` is the object main.js exposes:
 * { state, canvas, pickBin, chopBoard, grillClick, plateClick, serve, trashHand,
 *   startShift, restart, toggleMute, clearHand }
 */
export function bindInput(game) {
  const { canvas } = game;

  function toCanvas(e) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height,
    };
  }

  canvas.addEventListener('pointerdown', (e) => {
    unlockAudio();
    const p = toCanvas(e);
    if (game.state.phase === 'title') {
      game.startShift();
      return;
    }
    if (game.state.phase === 'over') return;
    const zone = hitZone(p.x, p.y, game.state);
    if (!zone) return;
    if (zone.startsWith('bin:')) {
      game.pickBin(zone.slice(4));
      return;
    }
    if (zone === 'board') {
      game.boardClick();
      return;
    }
    if (zone.startsWith('grill:')) {
      game.grillClick(Number(zone.slice(6)));
      return;
    }
    if (zone === 'plate') {
      game.plateClick();
      return;
    }
    if (zone === 'bell') {
      game.serve();
      return;
    }
    if (zone === 'trash') {
      game.trashHand();
      return;
    }
    if (zone.startsWith('ticket:')) {
      game.serveTicket(Number(zone.slice(7)));
    }
  });

  window.addEventListener('keydown', (e) => {
    if (e.repeat && e.code !== 'Space') return;
    unlockAudio();
    const st = game.state;
    if (e.code === 'Enter' && st.phase === 'title') {
      game.startShift();
      return;
    }
    if (e.code === 'KeyR' && st.phase === 'over') {
      game.restart();
      return;
    }
    if (st.phase !== 'playing') return;
    if (e.code === 'Space') {
      e.preventDefault();
      game.chopBoard();
      return;
    }
    if (e.code === 'KeyE') {
      game.serve();
      return;
    }
    if (e.code === 'KeyT') {
      game.trashHand();
      return;
    }
    if (e.code === 'KeyM') {
      game.toggleMute();
      return;
    }
    // Number keys 1-8 pick from the counter bins.
    const digit = e.key >= '1' && e.key <= '8' ? Number(e.key) - 1 : -1;
    if (digit >= 0 && digit < BIN_ORDER.length) {
      game.pickBin(BIN_ORDER[digit]);
    }
    // Q/W take from grill slots 1/2.
    if (e.code === 'KeyQ') game.grillClick(0);
    if (e.code === 'KeyW') game.grillClick(1);
  });
}

/** A hint line for the key the player just pressed (shown under the plate). */
export function keyName(ing) {
  return INGREDIENTS[ing]?.name ?? ing;
}
