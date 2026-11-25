// main.js — Ember & Ladle: the game loop, the rules and the shift.
// One cook, one kitchen: tickets come in, you chop, grill, plate and serve.

import { INGREDIENTS, RECIPES, recipeById } from './recipes.js';
import { drawScene, W, H } from './kitchen.js';
import { makeOrder, tickOrders, spawnIntervalSecs, serveScore, plateMatchesOrder, plateHints } from './orders.js';
import { bindInput } from './input.js';
import { sfx, setSizzle, toggleMute, isMuted } from './audio.js';

const SHIFT_SECS = 180;
const MAX_ORDERS = 4;

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = W;
canvas.height = H;

const state = {
  phase: 'title',
  timeLeft: SHIFT_SECS,
  elapsed: 0,
  score: 0,
  combo: 0,
  bestCombo: 0,
  served: 0,
  failed: 0,
  bestScore: loadBest(),
  orders: [],
  hand: null, // { ing, state } the cook carries
  board: null, // { ing, state, hits, hitsNeeded }
  grill: [null, null], // { ing, state, progress, cookSecs, burnIn }
  plate: [], // [{ ing, state }] stacked on the plate
  plateReady: false,
  plateHint: '',
  popups: [],
  message: '',
  messageT: 0,
  spawnIn: 5,
  rushLabel: 'Steady pace',
  lastWholeSecond: -1,
};

function loadBest() {
  try {
    return Number(window.localStorage.getItem('ember-ladle-best') ?? 0) || 0;
  } catch {
    return 0;
  }
}

function saveBest() {
  try {
    window.localStorage.setItem('ember-ladle-best', String(state.bestScore));
  } catch {
    /* storage unavailable: best score just lives for this session */
  }
}

function say(msg, secs = 2.2) {
  state.message = msg;
  state.messageT = secs;
}

function popup(x, y, text, color = '#2e7d32') {
  state.popups.push({ x, y, text, color, life: 1.2 });
}

/** Recompute whether the plate completes an order, and the hint line under it. */
function refreshPlate() {
  const waiting = state.orders.filter((o) => o.state === 'waiting');
  state.plateReady = waiting.some((o) => plateMatchesOrder(state.plate, o));
  if (state.plateReady) {
    state.plateHint = '';
    return;
  }
  if (state.plate.length === 0) {
    state.plateHint = '';
    return;
  }
  // Hint: what the first waiting order still needs.
  const first = waiting[0];
  if (!first) {
    state.plateHint = 'No tickets waiting — clear the plate?';
    return;
  }
  const { missing } = plateHints(state.plate, first);
  state.plateHint = missing.length > 0 ? `Ticket #${first.id} still needs: ${missing.map((m) => INGREDIENTS[m.ing].name).join(', ')}` : '';
}

// ---------------------------------------------------------------- actions

function pickBin(id) {
  const ing = INGREDIENTS[id];
  if (!ing) return;
  if (state.hand) {
    say('Hands full — plate it or trash it first');
    sfx.error();
    return;
  }
  state.hand = { ing: id, state: ing.prep === 'none' ? 'ready' : 'raw' };
  sfx.pick();
}

function boardClick() {
  if (state.board) {
    if (state.board.state === 'chopped') {
      if (state.hand) {
        say('Hands full — plate it or trash it first');
        sfx.error();
        return;
      }
      state.hand = { ing: state.board.ing, state: 'chopped' };
      state.board = null;
      sfx.pick();
    } else {
      chopBoard();
    }
    return;
  }
  if (!state.hand) {
    say('Pick an ingredient from the counter first');
    return;
  }
  const ing = INGREDIENTS[state.hand.ing];
  if (ing.prep !== 'chop' || state.hand.state !== 'raw') {
    say(`${ing.name} does not need chopping`);
    sfx.error();
    return;
  }
  state.board = { ing: state.hand.ing, state: 'raw', hits: 0, hitsNeeded: ing.chopHits };
  state.hand = null;
  sfx.place();
}

function chopBoard() {
  const item = state.board;
  if (!item || item.state === 'chopped') return;
  item.hits += 1;
  sfx.chop();
  if (item.hits >= item.hitsNeeded) {
    item.state = 'chopped';
    sfx.chopped();
    say(`${INGREDIENTS[item.ing].name} sliced — click the board to pick it up`);
  }
}

function grillClick(i) {
  const slot = state.grill[i];
  if (!slot) {
    if (!state.hand) {
      say('Pick a patty or an egg from the counter first');
      return;
    }
    const ing = INGREDIENTS[state.hand.ing];
    if (ing.prep !== 'cook' || state.hand.state !== 'raw') {
      say(`${ing.name} does not go on the grill`);
      sfx.error();
      return;
    }
    state.grill[i] = { ing: state.hand.ing, state: 'raw', progress: 0, cookSecs: ing.cookSecs, burnIn: 4 };
    state.hand = null;
    sfx.place();
    return;
  }
  if (slot.state === 'burnt') {
    state.grill[i] = null;
    say('Burnt food tossed — the grill is free again');
    return;
  }
  if (slot.state === 'cooked') {
    if (state.hand) {
      say('Hands full — plate it or trash it first');
      sfx.error();
      return;
    }
    state.hand = { ing: slot.ing, state: 'cooked' };
    state.grill[i] = null;
    sfx.pick();
    return;
  }
  say('Still grilling — watch the ring fill up');
}

function plateClick() {
  if (!state.hand) {
    say('Nothing in hand — pick an ingredient first');
    return;
  }
  const item = state.hand;
  // Only plate what some waiting ticket still needs.
  const waiting = state.orders.filter((o) => o.state === 'waiting');
  const needed = waiting.some((o) => {
    const { missing } = plateHints(state.plate, o);
    return missing.some((m) => m.ing === item.ing && m.state === item.state);
  });
  if (!needed) {
    say('No open ticket needs that right now');
    sfx.error();
    return;
  }
  state.plate.push({ ing: item.ing, state: item.state });
  state.hand = null;
  sfx.place();
  refreshPlate();
  if (state.plateReady) {
    sfx.cooked();
    say('Plate complete — ring the bell!');
  }
}

function serve() {
  const order = state.orders.find((o) => o.state === 'waiting' && plateMatchesOrder(state.plate, o));
  if (!order) {
    if (state.plate.length === 0) say('The plate is empty — build a dish first');
    else say('That plate does not match any ticket yet');
    sfx.error();
    return;
  }
  serveOrder(order);
}

function serveTicket(id) {
  const order = state.orders.find((o) => o.id === id && o.state === 'waiting');
  if (!order) return;
  if (!plateMatchesOrder(state.plate, order)) {
    say(`Ticket #${id} wants ${order.recipe.name} — the plate is not there yet`);
    sfx.error();
    return;
  }
  serveOrder(order);
}

function serveOrder(order) {
  state.combo += 1;
  state.bestCombo = Math.max(state.bestCombo, state.combo);
  const pts = serveScore(order, state.combo);
  state.score += pts;
  state.served += 1;
  order.state = 'served';
  state.orders = state.orders.filter((o) => o.state === 'waiting');
  state.plate = [];
  refreshPlate();
  popup(640, 300, `+$${pts}  ${order.recipe.name}!`, '#2e7d32');
  if (state.combo >= 3) popup(640, 340, `Combo x${state.combo} — keep it rolling!`, '#b26a00');
  sfx.serve();
}

function trashHand() {
  if (state.hand) {
    state.hand = null;
    sfx.place();
    say('Tossed it');
    return;
  }
  if (state.plate.length > 0) {
    state.plate = [];
    refreshPlate();
    sfx.place();
    say('Plate cleared');
  }
}

// ---------------------------------------------------------------- shift flow

function startShift() {
  state.phase = 'playing';
  state.timeLeft = SHIFT_SECS;
  state.elapsed = 0;
  state.score = 0;
  state.combo = 0;
  state.bestCombo = 0;
  state.served = 0;
  state.failed = 0;
  state.orders = [];
  state.hand = null;
  state.board = null;
  state.grill = [null, null];
  state.plate = [];
  state.plateReady = false;
  state.plateHint = '';
  state.popups = [];
  state.spawnIn = 4;
  state.lastWholeSecond = -1;
  spawnOrder();
  spawnOrder();
  say('First tickets are in — get cooking!');
}

function spawnOrder() {
  if (state.orders.length >= MAX_ORDERS) return;
  const order = makeOrder(state.elapsed, Math.random);
  order.flash = 1.2;
  state.orders.push(order);
  sfx.newOrder();
}

function endShift(walkouts) {
  state.phase = 'over';
  setSizzle(0);
  if (state.score > state.bestScore) {
    state.bestScore = state.score;
    saveBest();
  }
  if (walkouts) sfx.fail();
}

function tick(dt) {
  if (state.phase !== 'playing') return;
  state.elapsed += dt;
  state.timeLeft -= dt;
  const whole = Math.ceil(state.timeLeft);
  if (whole !== state.lastWholeSecond) {
    state.lastWholeSecond = whole;
    if (whole <= 10 && whole > 0) sfx.tick();
  }
  // Rush grows: faster tickets, thinner patience.
  state.rushLabel = state.elapsed < 60 ? 'Steady pace' : state.elapsed < 120 ? 'Lunch rush!' : 'DINNER RUSH!!';
  // New tickets.
  state.spawnIn -= dt;
  if (state.spawnIn <= 0) {
    spawnOrder();
    state.spawnIn = spawnIntervalSecs(state.elapsed) * (0.85 + Math.random() * 0.3);
  }
  // Tickets age; walk-outs break the combo and cost a heart.
  const expired = tickOrders(state.orders, dt);
  for (const o of expired) {
    state.failed += 1;
    state.combo = 0;
    popup(640, 200, `Ticket #${o.id} walked out!`, '#d9382b');
    sfx.fail();
    refreshPlate();
  }
  state.orders = state.orders.filter((o) => o.state === 'waiting');
  // Grill cooks (and burns).
  let cooking = 0;
  for (const slot of state.grill) {
    if (!slot) continue;
    if (slot.state === 'raw') {
      cooking += 1;
      slot.progress += dt / slot.cookSecs;
      if (slot.progress >= 1) {
        slot.progress = 1;
        slot.state = 'cooked';
        sfx.cooked();
        say(`${INGREDIENTS[slot.ing].name} is grilled — take it off before it burns!`);
      }
    } else if (slot.state === 'cooked') {
      slot.burnIn -= dt;
      if (slot.burnIn <= 0) {
        slot.state = 'burnt';
        sfx.burnt();
        say('Something burnt on the grill — click it to toss it');
      }
    }
  }
  setSizzle(cooking);
  // Popups and messages fade.
  for (const p of state.popups) p.life -= dt;
  state.popups = state.popups.filter((p) => p.life > 0);
  if (state.messageT > 0) state.messageT -= dt;
  // End of shift.
  if (state.failed >= 3) endShift(true);
  else if (state.timeLeft <= 0) endShift(false);
}

// ---------------------------------------------------------------- demo states for screenshots

/** Seed a real mid-game state from ?shot=kitchen|assembly|serve|rush (used for screenshots). */
function seedDemo(shot) {
  startShift();
  const byId = (id) => RECIPES.find((r) => r.id === id);
  const forceOrder = (recipeId, waited, patience) => {
    const o = makeOrder(0, Math.random);
    o.recipe = byId(recipeId);
    o.waited = waited;
    o.patience = patience;
    o.flash = 0;
    state.orders.push(o);
    return o;
  };
  state.orders = [];
  if (shot === 'kitchen') {
    forceOrder('ember-burger', 4, 50);
    forceOrder('garden-bowl', 12, 48);
    forceOrder('sunny-plate', 2, 52);
    state.grill[0] = { ing: 'patty', state: 'raw', progress: 0.55, cookSecs: 6, burnIn: 4 };
    state.board = { ing: 'tomato', state: 'raw', hits: 1, hitsNeeded: 3 };
    state.timeLeft = 152;
    state.elapsed = 28;
  } else if (shot === 'assembly') {
    forceOrder('ember-burger', 8, 50);
    forceOrder('shroom-melt', 3, 48);
    state.plate = [
      { ing: 'bun', state: 'ready' },
      { ing: 'patty', state: 'cooked' },
    ];
    state.board = { ing: 'lettuce', state: 'raw', hits: 1, hitsNeeded: 2 };
    state.hand = { ing: 'tomato', state: 'chopped' };
    state.timeLeft = 131;
    state.elapsed = 49;
    refreshPlate();
  } else if (shot === 'serve') {
    forceOrder('ember-burger', 10, 50);
    forceOrder('double-stack', 20, 46);
    state.plate = [
      { ing: 'bun', state: 'ready' },
      { ing: 'patty', state: 'cooked' },
      { ing: 'cheese', state: 'ready' },
      { ing: 'lettuce', state: 'chopped' },
    ];
    state.timeLeft = 118;
    state.elapsed = 62;
    state.score = 340;
    state.served = 3;
    state.combo = 2;
    refreshPlate();
  } else if (shot === 'rush') {
    forceOrder('double-stack', 30, 40);
    forceOrder('ember-burger', 34, 38);
    forceOrder('garden-bowl', 12, 48);
    forceOrder('veggie-stack', 2, 52);
    state.grill[0] = { ing: 'patty', state: 'raw', progress: 0.8, cookSecs: 6, burnIn: 4 };
    state.grill[1] = { ing: 'egg', state: 'cooked', progress: 1, cookSecs: 5, burnIn: 2.5 };
    state.plate = [
      { ing: 'bun', state: 'ready' },
      { ing: 'mushroom', state: 'chopped' },
    ];
    state.hand = { ing: 'cheese', state: 'ready' };
    state.timeLeft = 44;
    state.elapsed = 136;
    state.score = 890;
    state.served = 8;
    state.combo = 4;
    refreshPlate();
  }
}

// ---------------------------------------------------------------- loop

let last = performance.now();
function frame(nowMs) {
  const dt = Math.min(0.1, (nowMs - last) / 1000);
  last = nowMs;
  tick(dt);
  drawScene(ctx, state, nowMs / 1000);
  requestAnimationFrame(frame);
}

const game = {
  state,
  canvas,
  pickBin,
  boardClick,
  chopBoard,
  grillClick,
  plateClick,
  serve,
  serveTicket,
  trashHand,
  startShift,
  restart: startShift,
  toggleMute: () => {
    const m = toggleMute();
    say(m ? 'Sound off (M to turn back on)' : 'Sound on');
  },
};

bindInput(game);

// Debug/test handle: lets automated checks read the live state (and nothing else).
window.__emberLadle = game;

// A ?shot= parameter jumps straight into a mid-game state (for screenshots and testing).
const shot = new URLSearchParams(window.location.search).get('shot');
if (shot && ['kitchen', 'assembly', 'serve', 'rush'].includes(shot)) {
  seedDemo(shot);
} else {
  // Title screen shows a live kitchen behind it: one quiet ticket, nothing cooking.
  state.orders = [makeOrder(0, Math.random)];
  state.orders[0].flash = 0;
}

requestAnimationFrame(frame);
