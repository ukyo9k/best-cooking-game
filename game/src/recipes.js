// recipes.js — the ingredients and dishes of Ember & Ladle.
// Every dish is an original combination; no real-world restaurant's menu is copied.

/** One ingredient a cook can pick from the counter. */
export const INGREDIENTS = {
  bun: {
    id: 'bun', name: 'Bun', key: '1',
    prep: 'none', // ready as picked
    colors: { top: '#e8a34c', crumb: '#f6d49a', seed: '#fff3d6' },
    blurb: 'Toasted brioche bun',
  },
  patty: {
    id: 'patty', name: 'Patty', key: '2',
    prep: 'cook', cookSecs: 6,
    colors: { raw: '#c96a5e', cooked: '#6b3a26', edge: '#4a2718' },
    blurb: 'Beef patty, grill it',
  },
  cheese: {
    id: 'cheese', name: 'Cheese', key: '3',
    prep: 'none',
    colors: { top: '#f7c948', edge: '#e0a92e' },
    blurb: 'Melty cheddar slice',
  },
  tomato: {
    id: 'tomato', name: 'Tomato', key: '4',
    prep: 'chop', chopHits: 3,
    colors: { skin: '#d9382b', flesh: '#f2604d', seed: '#ffd9a0' },
    blurb: 'Slice it on the board',
  },
  lettuce: {
    id: 'lettuce', name: 'Lettuce', key: '5',
    prep: 'chop', chopHits: 2,
    colors: { leaf: '#7ec850', vein: '#a8e07e', edge: '#5da53a' },
    blurb: 'Shred it on the board',
  },
  onion: {
    id: 'onion', name: 'Onion', key: '6',
    prep: 'chop', chopHits: 3,
    colors: { skin: '#e8d8f0', ring: '#c9a8d8', core: '#f6ecfa' },
    blurb: 'Dice it on the board',
  },
  mushroom: {
    id: 'mushroom', name: 'Mushroom', key: '7',
    prep: 'chop', chopHits: 2,
    colors: { cap: '#b98a5e', stem: '#f2e3c8', gill: '#8a6844' },
    blurb: 'Slice it on the board',
  },
  egg: {
    id: 'egg', name: 'Egg', key: '8',
    prep: 'cook', cookSecs: 5,
    colors: { shell: '#f7ead0', white: '#fffdf4', yolk: '#ffb703' },
    blurb: 'Fry it sunny-side',
  },
};

/** The order of the bins along the counter. */
export const BIN_ORDER = ['bun', 'patty', 'cheese', 'tomato', 'lettuce', 'onion', 'mushroom', 'egg'];

/** A dish on the menu. `steps` list the ingredient id and the state it must be in when plated. */
export const RECIPES = [
  {
    id: 'ember-burger', name: 'Ember Burger', price: 120,
    steps: [
      { ing: 'bun', state: 'ready' },
      { ing: 'patty', state: 'cooked' },
      { ing: 'cheese', state: 'ready' },
      { ing: 'lettuce', state: 'chopped' },
    ],
  },
  {
    id: 'shroom-melt', name: 'Shroom Melt', price: 110,
    steps: [
      { ing: 'bun', state: 'ready' },
      { ing: 'patty', state: 'cooked' },
      { ing: 'mushroom', state: 'chopped' },
      { ing: 'cheese', state: 'ready' },
    ],
  },
  {
    id: 'garden-bowl', name: 'Garden Bowl', price: 90,
    steps: [
      { ing: 'tomato', state: 'chopped' },
      { ing: 'lettuce', state: 'chopped' },
      { ing: 'onion', state: 'chopped' },
      { ing: 'cheese', state: 'ready' },
    ],
  },
  {
    id: 'sunny-plate', name: 'Sunny Plate', price: 100,
    steps: [
      { ing: 'egg', state: 'cooked' },
      { ing: 'tomato', state: 'chopped' },
      { ing: 'mushroom', state: 'chopped' },
    ],
  },
  {
    id: 'double-stack', name: 'Double Stack', price: 160,
    steps: [
      { ing: 'bun', state: 'ready' },
      { ing: 'patty', state: 'cooked' },
      { ing: 'patty', state: 'cooked' },
      { ing: 'cheese', state: 'ready' },
      { ing: 'tomato', state: 'chopped' },
    ],
  },
  {
    id: 'veggie-stack', name: 'Veggie Stack', price: 130,
    steps: [
      { ing: 'bun', state: 'ready' },
      { ing: 'mushroom', state: 'chopped' },
      { ing: 'tomato', state: 'chopped' },
      { ing: 'lettuce', state: 'chopped' },
      { ing: 'cheese', state: 'ready' },
    ],
  },
];

/** Look a recipe up by id. */
export function recipeById(id) {
  return RECIPES.find((r) => r.id === id) ?? null;
}

/** A short label for a plated step, e.g. "Patty (grilled)". */
export function stepLabel(step) {
  const ing = INGREDIENTS[step.ing];
  if (step.state === 'cooked') return `${ing.name} · grilled`;
  if (step.state === 'chopped') return `${ing.name} · sliced`;
  return ing.name;
}
