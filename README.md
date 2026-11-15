# CARROM POOL – GAMERKIE EDITION

A mobile-first, offline 2D carrom game built with plain HTML, CSS and JavaScript.

## Included

- Four play modes: Classic, Disc Pool, Freestyle and local 2-player Pass & Play.
- Single-player opponent with Easy / Medium / Hard shot-strength settings.
- A 19-piece board: nine white coins, nine black coins and the red queen.
- Custom Canvas 2D board, wood grain, brass frame, pockets, glossy coins and gold striker. No external image files are required.
- Drag-back aiming, power ring, trajectory guide, target-contact preview and striker-position slider.
- Fixed-step collision simulation, friction, cushion bounce, pocket capture and particle effects.
- Synthesized sound effects using Web Audio API; optional vibration where the browser supports it.
- Turn clock, pause, rules, rematch, coins, XP, level and local win statistics.
- Mobile portrait and landscape responsive layouts. No backend, account, API key or external library is needed.

## Run locally

Open `index.html` in a modern browser. An internet connection is not required.

## GitHub Pages

Upload `index.html` to the root of a GitHub repository, then open **Settings → Pages**. Select **Deploy from a branch**, choose branch **main** and folder **/(root)**, and save. GitHub Pages will publish the game at the repository's Pages address.

See `GITHUB-UPLOAD-HINDI.md` for the step-by-step Hindi instructions.

## Controls

1. Use the striker-position slider to move the striker left or right on the baseline.
2. Touch/click the striker, drag in the opposite direction from the intended shot, then release.
3. Longer drag = more power. The guide shows the aim direction and approximate first contact.
4. Pocket your own colour to keep the turn. The AI takes the black side in the one-player modes.

## Modes and rules in this edition

- **Classic:** White versus black. The queen is worth 50 points and must be covered by pocketing one of your own coins on the same or following shot.
- **Disc Pool:** Clear all nine of your colour to win. There is no queen-cover bonus.
- **Freestyle:** The shooter receives 20 for a white coin, 10 for a black coin and 50 for the queen. First to 120 wins.
- **2 Player:** Two people take turns on the same device. Pass the device after each turn.
- **Foul:** Pocketing the striker returns one of the shooter's previously pocketed own coins to the centre and passes the turn.

The game uses a custom lightweight carrom ruleset inspired by familiar pool-style carrom games; it is not an official tournament referee implementation or a copy of another game's proprietary assets.

## Saved data and online features

Coins, gems, level, XP, wins and sound preferences are stored in that browser's `localStorage`. They do not sync between devices. This build is offline single-player / local multiplayer only; it does not include online matchmaking, accounts, leaderboards, cloud saves, payments or a server.

## Automated smoke test

Node.js 18 or newer is required only for the test. From this folder run:

```bash
node tests/smoke.test.js
```

The dependency-free smoke test checks startup, board rendering calls, the rack count, turn rotation, queen-cover flow, foul respot, Freestyle scoring, physics settling, AI shot entry and local Player 2 shot entry. It is a logic smoke test, not a substitute for checking the live game on a physical phone.
