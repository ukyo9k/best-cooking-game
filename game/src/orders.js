// orders.js — the ticket rail: orders arrive, wait, get served or walk out.
// Pressure grows as the shift goes on: tickets arrive faster and patience thins.

import { RECIPES } from './recipes.js';

let nextOrderId = 1;

/** Pick a recipe, weighted so early orders are simpler. */
export function pickRecipe(elapsedSecs, rng) {
  const pool = RECIPES.filter((r) => r.steps.length <= (elapsedSecs < 45 ? 3 : elapsedSecs < 100 ? 4 : 5));
  return pool[Math.floor(rng() * pool.length)];
}

/** Create a fresh order ticket. */
export function makeOrder(elapsedSecs, rng) {
  const recipe = pickRecipe(elapsedSecs, rng);
  const patience = Math.max(28, 52 - elapsedSecs * 0.12);
  return {
    id: nextOrderId++,
    recipe,
    patience, // seconds the customer will wait
    waited: 0,
    state: 'waiting', // waiting | served | failed
    flash: 0, // seconds left of the "new ticket" highlight
  };
}

/** Seconds between ticket arrivals at this point in the shift. */
export function spawnIntervalSecs(elapsedSecs) {
  return Math.max(7, 14 - elapsedSecs * 0.045);
}

/** Advance all tickets; returns the orders that just expired. */
export function tickOrders(orders, dt) {
  const expired = [];
  for (const o of orders) {
    if (o.state !== 'waiting') continue;
    o.waited += dt;
    if (o.flash > 0) o.flash -= dt;
    if (o.waited >= o.patience) {
      o.state = 'failed';
      expired.push(o);
    }
  }
  return expired;
}

/** Fraction of patience left, 1 = fresh, 0 = walked out. */
export function patienceLeft(order) {
  return Math.max(0, 1 - order.waited / order.patience);
}

/** Score for serving an order: base price + speed bonus, times the combo. */
export function serveScore(order, combo) {
  const speedBonus = Math.round(order.recipe.price * 0.6 * patienceLeft(order));
  return Math.round((order.recipe.price + speedBonus) * (1 + 0.15 * (combo - 1)));
}

/** Does the plate's steps match this order's recipe, in any order? */
export function plateMatchesOrder(plateSteps, order) {
  const want = order.recipe.steps.map((s) => `${s.ing}:${s.state}`).sort();
  const got = plateSteps.map((s) => `${s.ing}:${s.state}`).sort();
  if (want.length !== got.length) return false;
  return want.every((w, i) => w === got[i]);
}

/** Which steps of the plate are wrong for this order (for the hint line). */
export function plateHints(plateSteps, order) {
  const want = [...order.recipe.steps];
  const extra = [];
  for (const got of plateSteps) {
    const idx = want.findIndex((w) => w.ing === got.ing && w.state === got.state);
    if (idx >= 0) want.splice(idx, 1);
    else extra.push(got);
  }
  return { missing: want, extra };
}
