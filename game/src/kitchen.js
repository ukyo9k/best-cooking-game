// kitchen.js — draws the whole kitchen scene on one canvas and owns the layout
// (hit zones) the input module clicks against. All art is drawn, never loaded.

import { INGREDIENTS, BIN_ORDER } from './recipes.js';
import { drawIngredient, drawPlate } from './food.js';
import { patienceLeft } from './orders.js';

export const W = 1280;
export const H = 720;

/** Every clickable zone, in canvas pixels. */
export const LAYOUT = {
  // Ticket rail across the top.
  tickets: { x: 16, y: 12, w: 800, h: 96, gap: 8, ticketW: 192 },
  // Shift timer + score panel, top right.
  timer: { x: 836, y: 12, w: 200, h: 96 },
  score: { x: 1052, y: 12, w: 212, h: 96 },
  // Work stations, middle band.
  grill: { x: 40, y: 150, w: 330, h: 250 },
  grillSlots: [
    { x: 78, y: 210, w: 120, h: 120 },
    { x: 218, y: 210, w: 120, h: 120 },
  ],
  board: { x: 430, y: 150, w: 400, h: 250 },
  boardSpot: { x: 560, y: 225, w: 140, h: 140 },
  plate: { x: 890, y: 150, w: 350, h: 250 },
  plateSpot: { x: 1000, y: 245, w: 150, h: 120 },
  bell: { x: 1150, y: 314, w: 72, h: 56 },
  // Ingredient counter along the bottom.
  bins: { x: 40, y: 470, w: 108, h: 150, gap: 10 },
  trash: { x: 1116, y: 470, w: 124, h: 150 },
  // Hand slot (what the cook carries), bottom right of the counter row.
  hand: { x: 990, y: 470, w: 110, h: 150 },
};

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function inRect(px, py, r) {
  return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
}

/** Which zone a canvas point falls in: 'bin:<id>' | 'grill:0|1' | 'board' | 'plate' | 'bell' | 'trash' | 'ticket:<id>' | 'hand' | null. */
export function hitZone(px, py, state) {
  const L = LAYOUT;
  for (let i = 0; i < BIN_ORDER.length; i++) {
    const bx = L.bins.x + i * (L.bins.w + L.bins.gap);
    if (inRect(px, py, { x: bx, y: L.bins.y, w: L.bins.w, h: L.bins.h })) return `bin:${BIN_ORDER[i]}`;
  }
  for (let i = 0; i < L.grillSlots.length; i++) {
    if (inRect(px, py, L.grillSlots[i])) return `grill:${i}`;
  }
  if (inRect(px, py, L.boardSpot)) return 'board';
  if (inRect(px, py, L.plateSpot)) return 'plate';
  if (inRect(px, py, L.bell)) return 'bell';
  if (inRect(px, py, L.trash)) return 'trash';
  if (inRect(px, py, L.hand)) return 'hand';
  if (py >= L.tickets.y && py <= L.tickets.y + L.tickets.h) {
    for (let i = 0; i < state.orders.length; i++) {
      const tx = L.tickets.x + i * (L.tickets.ticketW + L.tickets.gap);
      if (px >= tx && px <= tx + L.tickets.ticketW) return `ticket:${state.orders[i].id}`;
    }
  }
  return null;
}

// ---------------------------------------------------------------- background

function drawRoom(ctx) {
  // Cream wall, terracotta tile band, wooden floor.
  ctx.fillStyle = '#f6e7c8';
  ctx.fillRect(0, 0, W, 430);
  ctx.fillStyle = '#e8d3a8';
  ctx.fillRect(0, 420, W, 12);
  ctx.fillStyle = '#b06a3b';
  ctx.fillRect(0, 432, W, H - 432);
  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  for (let x = 0; x < W; x += 96) ctx.fillRect(x, 432, 2, H - 432);
  ctx.fillStyle = '#7a4a2b';
  ctx.fillRect(0, 0, W, 6);
  // Sign in the gap between the ticket rail and the stations.
  ctx.fillStyle = '#5d3a1a';
  ctx.font = 'bold 24px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('~ Ember & Ladle ~', 640, 138);
}

// ---------------------------------------------------------------- tickets

function drawTicket(ctx, order, x, y, w, h, now) {
  const left = patienceLeft(order);
  const urgent = left < 0.35;
  const flash = order.flash > 0 ? 0.5 + 0.5 * Math.sin(now * 12) : 0;
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.25)';
  ctx.shadowBlur = 6;
  ctx.shadowOffsetY = 3;
  ctx.fillStyle = urgent ? '#ffe3d6' : '#fffdf4';
  roundRect(ctx, x, y, w, h, 8);
  ctx.fill();
  ctx.restore();
  if (flash > 0) {
    ctx.fillStyle = `rgba(255,183,3,${0.35 * flash})`;
    roundRect(ctx, x, y, w, h, 8);
    ctx.fill();
  }
  ctx.strokeStyle = urgent ? '#d9382b' : '#c9b48a';
  ctx.lineWidth = urgent ? 3 : 2;
  roundRect(ctx, x, y, w, h, 8);
  ctx.stroke();
  // Perforated top edge.
  ctx.fillStyle = '#fffdf4';
  for (let px = x + 10; px < x + w - 8; px += 14) {
    ctx.beginPath();
    ctx.arc(px, y, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#3a2a18';
  ctx.font = 'bold 15px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText(`#${order.id} ${order.recipe.name}`, x + 10, y + 24);
  ctx.font = '11px Georgia, serif';
  ctx.fillStyle = '#8a6a45';
  ctx.fillText(`$${order.recipe.price}`, x + w - 44, y + 24);
  // Ingredient icons in recipe order.
  order.recipe.steps.forEach((step, i) => {
    const ix = x + 26 + i * 34;
    const iy = y + 52;
    drawIngredient(ctx, step.ing, ix, iy, 13, step.state === 'cooked' ? 'cooked' : step.state === 'chopped' ? 'chopped' : 'ready');
    if (step.state === 'cooked') {
      ctx.fillStyle = '#d9382b';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('GRILL', ix, iy + 24);
    } else if (step.state === 'chopped') {
      ctx.fillStyle = '#5da53a';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('CHOP', ix, iy + 24);
    }
  });
  // Patience bar.
  const bw = w - 20;
  ctx.fillStyle = '#e8dcc8';
  roundRect(ctx, x + 10, y + h - 16, bw, 8, 4);
  ctx.fill();
  ctx.fillStyle = left > 0.5 ? '#7ec850' : left > 0.25 ? '#f7b731' : '#d9382b';
  roundRect(ctx, x + 10, y + h - 16, bw * left, 8, 4);
  ctx.fill();
  if (urgent) {
    ctx.fillStyle = '#d9382b';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('HURRY!', x + w - 10, y + h - 22);
  }
}

// ---------------------------------------------------------------- stations

function drawGrill(ctx, state, now) {
  const g = LAYOUT.grill;
  ctx.fillStyle = '#8a8f96';
  roundRect(ctx, g.x, g.y, g.w, g.h, 12);
  ctx.fill();
  ctx.fillStyle = '#6e737a';
  roundRect(ctx, g.x + 8, g.y + 8, g.w - 16, g.h - 16, 8);
  ctx.fill();
  ctx.fillStyle = '#f6e7c8';
  ctx.font = 'bold 15px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText('GRILL', g.x + 16, g.y + 30);
  ctx.font = '12px Georgia, serif';
  ctx.fillStyle = '#e8e2d4';
  ctx.fillText('click a raw patty / egg, then pick it up', g.x + 16, g.y + g.h - 14);
  state.grill.forEach((slot, i) => {
    const s = LAYOUT.grillSlots[i];
    // Grate.
    ctx.fillStyle = '#3c3f45';
    roundRect(ctx, s.x, s.y, s.w, s.h, 10);
    ctx.fill();
    ctx.strokeStyle = '#565b63';
    ctx.lineWidth = 3;
    for (let gx = s.x + 14; gx < s.x + s.w - 8; gx += 16) {
      ctx.beginPath();
      ctx.moveTo(gx, s.y + 8);
      ctx.lineTo(gx, s.y + s.h - 8);
      ctx.stroke();
    }
    if (!slot) return;
    // Flames while cooking.
    if (slot.state === 'raw') {
      const flick = Math.sin(now * 9 + i * 2) * 3;
      ctx.fillStyle = '#ff8c1a';
      ctx.beginPath();
      ctx.moveTo(s.x + 20, s.y + s.h - 6);
      ctx.quadraticCurveTo(s.x + s.w / 2, s.y + s.h - 34 - flick, s.x + s.w - 20, s.y + s.h - 6);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#ffd23f';
      ctx.beginPath();
      ctx.moveTo(s.x + 34, s.y + s.h - 6);
      ctx.quadraticCurveTo(s.x + s.w / 2, s.y + s.h - 22 - flick, s.x + s.w - 34, s.y + s.h - 6);
      ctx.closePath();
      ctx.fill();
    }
    const cooking = slot.state === 'raw';
    drawIngredient(ctx, slot.ing, s.x + s.w / 2, s.y + s.h / 2 - 6, 34, cooking ? 'raw' : slot.state);
    // Cook progress ring.
    const p = slot.state === 'raw' ? slot.progress : 1;
    ctx.strokeStyle = slot.state === 'burnt' ? '#d9382b' : '#7ec850';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(s.x + s.w / 2, s.y + s.h / 2 - 6, 46, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * p);
    ctx.stroke();
    if (slot.state === 'burnt') {
      ctx.fillStyle = '#d9382b';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('BURNT!', s.x + s.w / 2, s.y + s.h - 4);
    } else if (slot.state === 'cooked') {
      ctx.fillStyle = '#7ec850';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('READY — click to take', s.x + s.w / 2, s.y + s.h - 4);
    }
  });
}

function drawBoard(ctx, state, now) {
  const b = LAYOUT.board;
  // Wooden counter.
  ctx.fillStyle = '#a4713e';
  roundRect(ctx, b.x, b.y, b.w, b.h, 12);
  ctx.fill();
  ctx.fillStyle = '#c08a4e';
  roundRect(ctx, b.x + 8, b.y + 8, b.w - 16, b.h - 16, 8);
  ctx.fill();
  ctx.fillStyle = '#f6e7c8';
  ctx.font = 'bold 15px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText('CHOPPING BOARD', b.x + 16, b.y + 30);
  // The board itself.
  const s = LAYOUT.boardSpot;
  ctx.fillStyle = '#e8c98f';
  roundRect(ctx, s.x - 20, s.y - 20, s.w + 40, s.h + 40, 10);
  ctx.fill();
  ctx.strokeStyle = '#b98a5e';
  ctx.lineWidth = 2;
  roundRect(ctx, s.x - 20, s.y - 20, s.w + 40, s.h + 40, 10);
  ctx.stroke();
  const item = state.board;
  if (item) {
    const shake = item.hits > 0 ? Math.sin(now * 40) * 1.5 : 0;
    ctx.save();
    ctx.translate(shake, 0);
    drawIngredient(ctx, item.ing, s.x + s.w / 2, s.y + s.h / 2, 52, item.state === 'chopped' ? 'chopped' : 'raw');
    ctx.restore();
    // Chop progress.
    const p = item.hits / item.hitsNeeded;
    ctx.fillStyle = '#d9c49a';
    roundRect(ctx, s.x, s.y + s.h + 26, s.w, 12, 6);
    ctx.fill();
    ctx.fillStyle = '#5da53a';
    roundRect(ctx, s.x, s.y + s.h + 26, s.w * p, 12, 6);
    ctx.fill();
    ctx.fillStyle = '#5d3a1a';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${item.hitsNeeded - item.hits} more chop${item.hitsNeeded - item.hits === 1 ? '' : 's'} — SPACE`, s.x + s.w / 2, s.y + s.h + 58);
  } else {
    ctx.fillStyle = '#a8814f';
    ctx.font = 'italic 14px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('empty board', s.x + s.w / 2, s.y + s.h / 2);
  }
  ctx.font = '12px Georgia, serif';
  ctx.fillStyle = '#7a5a34';
  ctx.textAlign = 'left';
  ctx.fillText('click an ingredient, then SPACE (or click) to chop', b.x + 16, b.y + b.h - 14);
}

function drawPlateStation(ctx, state, now) {
  const p = LAYOUT.plate;
  ctx.fillStyle = '#7a5a8a';
  roundRect(ctx, p.x, p.y, p.w, p.h, 12);
  ctx.fill();
  ctx.fillStyle = '#9370a8';
  roundRect(ctx, p.x + 8, p.y + 8, p.w - 16, p.h - 16, 8);
  ctx.fill();
  ctx.fillStyle = '#f6e7c8';
  ctx.font = 'bold 15px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText('PLATING', p.x + 16, p.y + 30);
  const s = LAYOUT.plateSpot;
  const ready = state.plateReady;
  if (ready) {
    const glow = 0.5 + 0.5 * Math.sin(now * 5);
    ctx.save();
    ctx.shadowColor = `rgba(255,183,3,${0.55 + 0.4 * glow})`;
    ctx.shadowBlur = 26;
    ctx.fillStyle = '#fff3d6';
    ctx.beginPath();
    ctx.ellipse(s.x + s.w / 2, s.y + s.h / 2, 92, 74, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  drawPlate(ctx, state.plate, s.x + s.w / 2, s.y + s.h / 2 + 6, 78);
  if (state.plate.length === 0) {
    ctx.fillStyle = '#d8cfbe';
    ctx.font = 'italic 14px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('empty plate', s.x + s.w / 2, s.y + s.h / 2 + 6);
  }
  if (ready) {
    ctx.fillStyle = '#2e7d32';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('✓ READY TO SERVE', s.x + s.w / 2, s.y - 26);
    ctx.fillStyle = '#5d3a1a';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText('ring the bell or press E', s.x + s.w / 2, s.y + s.h + 8);
  } else if (state.plate.length > 0 && state.plateHint) {
    ctx.fillStyle = '#5d3a1a';
    ctx.font = '13px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText(state.plateHint, s.x + s.w / 2, s.y + s.h + 8);
  }
  // Serve bell.
  const bell = LAYOUT.bell;
  ctx.fillStyle = '#c9a227';
  ctx.beginPath();
  ctx.moveTo(bell.x + 8, bell.y + bell.h - 10);
  ctx.lineTo(bell.x + bell.w - 8, bell.y + bell.h - 10);
  ctx.lineTo(bell.x + bell.w - 18, bell.y + 14);
  ctx.lineTo(bell.x + 18, bell.y + 14);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#8a6d1a';
  ctx.fillRect(bell.x, bell.y + bell.h - 10, bell.w, 6);
  ctx.fillStyle = '#5d3a1a';
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('SERVE', bell.x + bell.w / 2, bell.y + bell.h + 14);
}

function drawBins(ctx, state) {
  const L = LAYOUT;
  BIN_ORDER.forEach((id, i) => {
    const bx = L.bins.x + i * (L.bins.w + L.bins.gap);
    const by = L.bins.y;
    const ing = INGREDIENTS[id];
    ctx.fillStyle = '#8a5a34';
    roundRect(ctx, bx, by, L.bins.w, L.bins.h, 10);
    ctx.fill();
    ctx.fillStyle = '#f6e7c8';
    roundRect(ctx, bx + 6, by + 6, L.bins.w - 12, 96, 8);
    ctx.fill();
    drawIngredient(ctx, id, bx + L.bins.w / 2, by + 54, 34, ing.prep === 'cook' ? 'raw' : 'ready');
    ctx.fillStyle = '#3a2a18';
    ctx.font = 'bold 14px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText(ing.name, bx + L.bins.w / 2, by + 122);
    ctx.font = '11px sans-serif';
    ctx.fillStyle = '#8a6a45';
    const tag = ing.prep === 'chop' ? 'chop it' : ing.prep === 'cook' ? 'grill it' : 'ready';
    ctx.fillText(`[${ing.key}]  ${tag}`, bx + L.bins.w / 2, by + 140);
  });
  // Hand slot.
  const h = L.hand;
  ctx.fillStyle = state.hand ? '#fff3d6' : '#6e4a28';
  roundRect(ctx, h.x, h.y, h.w, h.h, 10);
  ctx.fill();
  ctx.strokeStyle = '#f7b731';
  ctx.lineWidth = 2;
  roundRect(ctx, h.x, h.y, h.w, h.h, 10);
  ctx.stroke();
  ctx.fillStyle = '#3a2a18';
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('IN HAND', h.x + h.w / 2, h.y + 20);
  if (state.hand) {
    drawIngredient(ctx, state.hand.ing, h.x + h.w / 2, h.y + 74, 30, state.hand.state);
    ctx.fillStyle = '#5d3a1a';
    ctx.font = 'bold 13px Georgia, serif';
    const label = state.hand.state === 'cooked' ? 'grilled' : state.hand.state === 'chopped' ? 'sliced' : 'ready';
    ctx.fillText(`${INGREDIENTS[state.hand.ing].name} · ${label}`, h.x + h.w / 2, h.y + 128);
  } else {
    ctx.fillStyle = '#a8814f';
    ctx.font = 'italic 13px Georgia, serif';
    ctx.fillText('empty', h.x + h.w / 2, h.y + 74);
    ctx.font = '11px sans-serif';
    ctx.fillText('click a bin', h.x + h.w / 2, h.y + 96);
  }
  // Trash.
  const t = L.trash;
  ctx.fillStyle = '#4a4a4a';
  roundRect(ctx, t.x, t.y, t.w, t.h, 10);
  ctx.fill();
  ctx.fillStyle = '#333';
  roundRect(ctx, t.x + 8, t.y + 8, t.w - 16, t.h - 16, 8);
  ctx.fill();
  ctx.fillStyle = '#f6e7c8';
  ctx.font = 'bold 26px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('🗑', t.x + t.w / 2, t.y + 66);
  ctx.font = 'bold 12px sans-serif';
  ctx.fillText('TRASH', t.x + t.w / 2, t.y + 96);
  ctx.font = '11px sans-serif';
  ctx.fillStyle = '#c9b48a';
  ctx.fillText('click to toss', t.x + t.w / 2, t.y + 116);
  ctx.fillText('what is in hand', t.x + t.w / 2, t.y + 132);
}

// ---------------------------------------------------------------- HUD

function drawHud(ctx, state) {
  const L = LAYOUT;
  // Shift timer.
  const t = L.timer;
  const urgent = state.timeLeft <= 30;
  ctx.fillStyle = urgent ? '#ffe3d6' : '#fffdf4';
  roundRect(ctx, t.x, t.y, t.w, t.h, 10);
  ctx.fill();
  ctx.strokeStyle = urgent ? '#d9382b' : '#c9b48a';
  ctx.lineWidth = 2;
  roundRect(ctx, t.x, t.y, t.w, t.h, 10);
  ctx.stroke();
  const mins = Math.floor(Math.max(0, state.timeLeft) / 60);
  const secs = Math.floor(Math.max(0, state.timeLeft) % 60);
  ctx.fillStyle = urgent ? '#d9382b' : '#3a2a18';
  ctx.font = 'bold 34px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText(`${mins}:${String(secs).padStart(2, '0')}`, t.x + t.w / 2, t.y + 46);
  ctx.font = '12px Georgia, serif';
  ctx.fillStyle = '#8a6a45';
  ctx.fillText('SHIFT TIMER', t.x + t.w / 2, t.y + 68);
  ctx.font = 'bold 13px sans-serif';
  ctx.fillStyle = urgent ? '#d9382b' : '#5da53a';
  ctx.fillText(urgent ? 'LAST ORDERS — RUSH!' : state.rushLabel, t.x + t.w / 2, t.y + 88);
  // Score panel.
  const s = L.score;
  ctx.fillStyle = '#3a2a18';
  roundRect(ctx, s.x, s.y, s.w, s.h, 10);
  ctx.fill();
  ctx.fillStyle = '#f7b731';
  ctx.font = 'bold 30px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText(`$${state.score}`, s.x + s.w / 2, s.y + 40);
  ctx.fillStyle = '#f6e7c8';
  ctx.font = '13px Georgia, serif';
  ctx.fillText(`served ${state.served} · combo x${state.combo}`, s.x + s.w / 2, s.y + 64);
  // Hearts (failed orders).
  for (let i = 0; i < 3; i++) {
    const hx = s.x + 52 + i * 56;
    const hy = s.y + 84;
    ctx.fillStyle = i < 3 - state.failed ? '#e63946' : '#5d4a34';
    ctx.font = '20px sans-serif';
    ctx.fillText('♥', hx, hy);
  }
}

// ---------------------------------------------------------------- popups & overlays

function drawPopups(ctx, state) {
  ctx.textAlign = 'center';
  for (const p of state.popups) {
    const a = Math.max(0, Math.min(1, p.life / 0.5));
    ctx.globalAlpha = a;
    ctx.fillStyle = p.color;
    ctx.font = 'bold 22px Georgia, serif';
    ctx.fillText(p.text, p.x, p.y - (1.2 - p.life) * 40);
    ctx.globalAlpha = 1;
  }
  if (state.message && state.messageT > 0) {
    ctx.globalAlpha = Math.min(1, state.messageT);
    ctx.fillStyle = '#3a2a18';
    ctx.font = 'bold 18px Georgia, serif';
    ctx.fillText(state.message, W / 2, 448);
    ctx.globalAlpha = 1;
  }
}

function drawTitle(ctx, state) {
  ctx.fillStyle = 'rgba(40,20,8,0.72)';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#fff3d6';
  ctx.font = 'bold 64px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('Ember & Ladle', W / 2, 190);
  ctx.font = 'italic 24px Georgia, serif';
  ctx.fillStyle = '#f7b731';
  ctx.fillText('a rush-hour cooking game', W / 2, 232);
  ctx.fillStyle = '#f6e7c8';
  ctx.font = '18px Georgia, serif';
  const lines = [
    'Tickets roll in on the board — build each dish before the customer walks out.',
    'Pick ingredients from the counter, chop on the board, grill on the stove,',
    'plate it up, and ring the bell. Three failed orders end the shift.',
    '',
    'Mouse: click bins, board, grill, plate and bell.   Keys: 1–8 pick, SPACE chop,',
    'E serve, T trash, M mute.   Shift: 3 minutes.   The rush grows as you serve.',
  ];
  lines.forEach((l, i) => ctx.fillText(l, W / 2, 300 + i * 28));
  ctx.fillStyle = '#f7b731';
  ctx.font = 'bold 26px Georgia, serif';
  ctx.fillText('Click anywhere or press ENTER to start the shift', W / 2, 540);
  ctx.fillStyle = '#c9b48a';
  ctx.font = '14px Georgia, serif';
  ctx.fillText(`Best shift so far: $${state.bestScore}`, W / 2, 580);
}

function drawGameOver(ctx, state) {
  ctx.fillStyle = 'rgba(40,20,8,0.72)';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#fff3d6';
  ctx.font = 'bold 52px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText(state.failed >= 3 ? 'Shift over — too many walk-outs!' : 'Shift complete!', W / 2, 200);
  ctx.font = '26px Georgia, serif';
  ctx.fillStyle = '#f7b731';
  ctx.fillText(`You earned $${state.score}`, W / 2, 260);
  ctx.fillStyle = '#f6e7c8';
  ctx.font = '19px Georgia, serif';
  ctx.fillText(`Dishes served: ${state.served}    Failed orders: ${state.failed}    Best combo: x${state.bestCombo}`, W / 2, 310);
  ctx.fillText(`Best shift: $${state.bestScore}`, W / 2, 344);
  ctx.fillStyle = '#f7b731';
  ctx.font = 'bold 24px Georgia, serif';
  ctx.fillText('Press R to cook again', W / 2, 420);
}

/** Draw the whole scene for the current state. `now` is seconds since page load. */
export function drawScene(ctx, state, now) {
  ctx.clearRect(0, 0, W, H);
  drawRoom(ctx);
  // Ticket rail.
  state.orders.forEach((order, i) => {
    const x = LAYOUT.tickets.x + i * (LAYOUT.tickets.ticketW + LAYOUT.tickets.gap);
    drawTicket(ctx, order, x, LAYOUT.tickets.y, LAYOUT.tickets.ticketW, LAYOUT.tickets.h, now);
  });
  drawHud(ctx, state);
  drawGrill(ctx, state, now);
  drawBoard(ctx, state, now);
  drawPlateStation(ctx, state, now);
  drawBins(ctx, state);
  drawPopups(ctx, state);
  if (state.phase === 'title') drawTitle(ctx, state);
  if (state.phase === 'over') drawGameOver(ctx, state);
}
