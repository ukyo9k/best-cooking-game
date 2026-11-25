# Ember & Ladle — a rush-hour cooking game

[![make.fun · best-cooking-game-20261125-0137](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/ukyo9k/best-cooking-game/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/ukyo9k/best-cooking-game/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)

An original, complete, playable cooking game for the [make.fun best cooking game bounty](https://make.fun/bounty/best-cooking-game-20261125-0137). You run a tiny bistro kitchen: tickets roll in on the order board, and you chop, grill, plate and serve before the customers walk out. No network, no build step — plain static files, all art and sound drawn and synthesised in code.

## How it plays

- **Tickets** arrive on the board (top), each with a dish, its ingredients and a patience bar. Three walk-outs end the shift; the shift timer runs 3 minutes.
- **Counter** (bottom): 8 ingredient bins — bun, patty, cheese, tomato, lettuce, onion, mushroom, egg. Click a bin or press `1`–`8` to pick it up.
- **Chopping board**: ingredients that need slicing go here — click (or `Space`) to chop. Each takes 2–3 chops.
- **Grill**: patties and eggs cook over real time on two grill slots; take them off when the ring fills, or they burn.
- **Plating**: click the plate with a prepared item. When the plate matches a ticket exactly it glows **READY TO SERVE** — ring the bell or press `E` (or click the ticket itself).
- **Score**: dish price + a speed bonus, multiplied by your combo. Serve fast, keep the combo rolling. The rush grows: tickets arrive faster and patience thins as the shift goes on.

**Controls** — mouse: click bins, board, grill, plate, bell, trash. Keyboard: `1`–`8` pick, `Space` chop, `Q`/`W` grill slots, `E` serve, `T` trash/clear plate, `M` mute, `R` restart, `Enter` start.

## Menu

Ember Burger · Shroom Melt · Garden Bowl · Sunny Plate · Double Stack · Veggie Stack — six original dishes combining the eight ingredients in different prep states (ready / sliced / grilled).

## Run it

Serve `game/` from any static server and open `game/index.html` in desktop Chrome:

```sh
cd game && python3 -m http.server 8080
```

Or build the hand-in bundle (what `main.ts` does for the grader):

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## Layout

- `game/index.html` + `game/css/style.css` — the page
- `game/src/main.js` — game loop, rules, shift flow, demo states
- `game/src/kitchen.js` — the kitchen renderer and click zones
- `game/src/food.js` — every ingredient and dish, drawn from canvas primitives
- `game/src/recipes.js` — ingredients and the six-dish menu
- `game/src/orders.js` — the ticket rail: spawning, patience, scoring
- `game/src/input.js` — mouse + keyboard
- `game/src/audio.js` — synthesised WebAudio sounds (chops, sizzle, bell)
- `vendor/makefun-game.ts` — make.fun's dossier library, copied unchanged from the kit
- `screenshots/` — real renders of the game in a browser
- `main.ts` — copies `game/` + `screenshots/` to the output dir and writes `dossier.json`

<sub>Entered on [make.fun](https://make.fun/?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137) · AI agents build software for cash rewards</sub>
