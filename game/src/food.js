// food.js — every ingredient and dish is drawn from canvas primitives.
// No image files, no borrowed art: each shape is original code.

import { INGREDIENTS } from './recipes.js';

/** Draw a soft shadow ellipse under an item. */
function shadow(ctx, x, y, rx, ry = rx * 0.32) {
  ctx.save();
  ctx.fillStyle = 'rgba(40,20,8,0.25)';
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/**
 * Draw one ingredient.
 * @param {CanvasRenderingContext2D} ctx
 * @param {string} id ingredient id
 * @param {number} x centre x
 * @param {number} y centre y
 * @param {number} s radius-ish size in px
 * @param {'raw'|'chopped'|'cooked'|'ready'|'burnt'} state
 */
export function drawIngredient(ctx, id, x, y, s, state = 'ready') {
  const ing = INGREDIENTS[id];
  if (!ing) return;
  const c = ing.colors;
  ctx.save();
  ctx.translate(x, y);
  if (state === 'burnt') {
    // A sad charred lump.
    ctx.fillStyle = '#241a12';
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.9, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#4a3524';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-s * 0.4, -s * 0.2);
    ctx.lineTo(-s * 0.1, s * 0.1);
    ctx.moveTo(s * 0.3, -s * 0.35);
    ctx.lineTo(s * 0.1, s * 0.25);
    ctx.stroke();
    ctx.restore();
    return;
  }
  switch (id) {
    case 'bun': {
      // Golden dome with sesame seeds.
      ctx.fillStyle = c.top;
      ctx.beginPath();
      ctx.arc(0, s * 0.15, s, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = c.crumb;
      roundRect(ctx, -s, s * 0.1, s * 2, s * 0.42, s * 0.18);
      ctx.fill();
      ctx.fillStyle = c.seed;
      for (const [dx, dy] of [[-0.45, -0.45], [0, -0.7], [0.45, -0.45], [-0.2, -0.25], [0.25, -0.3]]) {
        ctx.beginPath();
        ctx.ellipse(dx * s, dy * s, s * 0.09, s * 0.06, 0.4, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case 'patty': {
      const cooked = state === 'cooked';
      ctx.fillStyle = cooked ? c.cooked : c.raw;
      roundRect(ctx, -s, -s * 0.42, s * 2, s * 0.84, s * 0.4);
      ctx.fill();
      ctx.strokeStyle = cooked ? c.edge : '#a34a3e';
      ctx.lineWidth = 2;
      ctx.stroke();
      // Grill marks when cooked.
      if (cooked) {
        ctx.strokeStyle = 'rgba(30,15,5,0.55)';
        ctx.lineWidth = s * 0.12;
        for (const dx of [-0.5, 0, 0.5]) {
          ctx.beginPath();
          ctx.moveTo(dx * s, -s * 0.3);
          ctx.lineTo(dx * s, s * 0.3);
          ctx.stroke();
        }
      }
      break;
    }
    case 'cheese': {
      ctx.fillStyle = c.top;
      ctx.beginPath();
      ctx.moveTo(-s, -s * 0.55);
      ctx.lineTo(s, -s * 0.55);
      ctx.lineTo(s * 0.55, s * 0.55);
      ctx.lineTo(-s * 0.55, s * 0.55);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = c.edge;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = c.edge;
      for (const [dx, dy] of [[-0.4, 0], [0.35, -0.2], [0.1, 0.3]]) {
        ctx.beginPath();
        ctx.arc(dx * s, dy * s, s * 0.09, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case 'tomato': {
      if (state === 'chopped') {
        // Two slices, seeds showing.
        for (const dx of [-0.45, 0.45]) {
          ctx.fillStyle = c.flesh;
          ctx.beginPath();
          ctx.arc(dx * s, 0, s * 0.55, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = c.skin;
          ctx.lineWidth = s * 0.12;
          ctx.stroke();
          ctx.fillStyle = c.seed;
          for (const a of [0.5, 2.2, 3.9]) {
            ctx.beginPath();
            ctx.arc(dx * s + Math.cos(a) * s * 0.22, Math.sin(a) * s * 0.22, s * 0.08, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      } else {
        ctx.fillStyle = c.skin;
        ctx.beginPath();
        ctx.arc(0, 0, s, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#7cb342';
        ctx.beginPath();
        ctx.ellipse(0, -s * 0.85, s * 0.28, s * 0.14, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        ctx.beginPath();
        ctx.ellipse(-s * 0.35, -s * 0.4, s * 0.22, s * 0.14, -0.6, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case 'lettuce': {
      ctx.fillStyle = c.leaf;
      ctx.beginPath();
      for (let k = 0; k < 8; k++) {
        const a = (k / 8) * Math.PI * 2;
        const r = s * (k % 2 === 0 ? 1 : 0.72);
        const px = Math.cos(a) * r;
        const py = Math.sin(a) * r;
        if (k === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = c.edge;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.strokeStyle = c.vein;
      ctx.lineWidth = s * 0.08;
      for (let k = 0; k < 4; k++) {
        const a = (k / 4) * Math.PI * 2 + 0.4;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(a) * s * 0.7, Math.sin(a) * s * 0.7);
        ctx.stroke();
      }
      break;
    }
    case 'onion': {
      if (state === 'chopped') {
        ctx.strokeStyle = c.ring;
        ctx.lineWidth = s * 0.22;
        for (const r of [0.85, 0.55, 0.28]) {
          ctx.beginPath();
          ctx.arc(0, 0, s * r, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.fillStyle = c.core;
        ctx.beginPath();
        ctx.arc(0, 0, s * 0.14, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = c.skin;
        ctx.beginPath();
        ctx.arc(0, 0, s * 0.92, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = c.ring;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, s * 0.6, 0.4, Math.PI - 0.4);
        ctx.stroke();
        ctx.fillStyle = '#9dbb6a';
        ctx.beginPath();
        ctx.moveTo(0, -s * 0.85);
        ctx.quadraticCurveTo(s * 0.25, -s * 1.25, s * 0.1, -s * 1.05);
        ctx.quadraticCurveTo(-s * 0.1, -s * 1.2, 0, -s * 0.85);
        ctx.fill();
      }
      break;
    }
    case 'mushroom': {
      if (state === 'chopped') {
        ctx.fillStyle = c.stem;
        for (const dx of [-0.4, 0.35]) {
          roundRect(ctx, dx * s - s * 0.3, -s * 0.5, s * 0.6, s, s * 0.2);
          ctx.fill();
        }
        ctx.fillStyle = c.cap;
        roundRect(ctx, -s, -s * 0.75, s * 2, s * 0.45, s * 0.2);
        ctx.fill();
      } else {
        ctx.fillStyle = c.stem;
        roundRect(ctx, -s * 0.32, -s * 0.1, s * 0.64, s * 0.95, s * 0.25);
        ctx.fill();
        ctx.fillStyle = c.cap;
        ctx.beginPath();
        ctx.arc(0, -s * 0.1, s, Math.PI, 0);
        ctx.fill();
        ctx.fillStyle = c.gill;
        ctx.beginPath();
        ctx.ellipse(0, -s * 0.08, s * 0.9, s * 0.18, 0, 0, Math.PI);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.beginPath();
        ctx.ellipse(-s * 0.35, -s * 0.55, s * 0.25, s * 0.14, -0.5, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case 'egg': {
      if (state === 'cooked') {
        ctx.fillStyle = c.white;
        ctx.beginPath();
        ctx.ellipse(0, 0, s, s * 0.78, 0.15, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#e8dcc0';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = c.yolk;
        ctx.beginPath();
        ctx.arc(s * 0.1, -s * 0.05, s * 0.45, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.beginPath();
        ctx.arc(-s * 0.05, -s * 0.2, s * 0.12, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = c.shell;
        ctx.beginPath();
        ctx.ellipse(0, 0, s * 0.72, s * 0.95, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#d9c49a';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.strokeStyle = '#c9b183';
        ctx.beginPath();
        ctx.moveTo(-s * 0.3, -s * 0.1);
        ctx.quadraticCurveTo(0, s * 0.15, s * 0.3, -s * 0.05);
        ctx.stroke();
      }
      break;
    }
    default:
      break;
  }
  ctx.restore();
}

/**
 * Draw a plated dish: the recipe's steps stacked on a plate, bottom step first.
 * @param {CanvasRenderingContext2D} ctx
 * @param {Array<{ing: string, state: string}>} steps
 * @param {number} x centre x
 * @param {number} y plate centre y
 * @param {number} s plate radius
 */
export function drawPlate(ctx, steps, x, y, s) {
  ctx.save();
  // Plate.
  shadow(ctx, x, y + s * 0.28, s * 1.05);
  const grad = ctx.createRadialGradient(x - s * 0.3, y - s * 0.3, s * 0.1, x, y, s);
  grad.addColorStop(0, '#ffffff');
  grad.addColorStop(0.75, '#f1ece2');
  grad.addColorStop(1, '#d8cfbe');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(x, y, s, s * 0.82, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#b8ab8d';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(x, y, s * 0.72, s * 0.58, 0, 0, Math.PI * 2);
  ctx.stroke();
  // Stack the steps, squashed vertically like a real plate build.
  const n = steps.length;
  steps.forEach((step, i) => {
    const layerY = y - s * 0.12 - (n - 1 - i) * s * 0.16;
    const size = s * (step.ing === 'bun' ? 0.62 : 0.5);
    // Bun sits on top of the stack; draw it as a lid when it is the last step.
    drawIngredient(ctx, step.ing, x, layerY, size, step.state);
  });
  ctx.restore();
}
