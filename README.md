# CARROM KING – GAMERKIE EDITION

**PLAY. STRIKE. POCKET. BECOME THE KING.**

A premium royal-themed, 2D top-down carrom game built with plain HTML, CSS and JavaScript Canvas. It is designed for static hosting on GitHub Pages and can be embedded in Blogger through an iframe.

## Play modes

- Classic vs AI — six difficulty levels: Beginner, Easy, Medium, Hard, Expert and Master.
- 2 Player Local — pass-and-play on one device.
- 2 vs 2 Local — four local seats across two teams.
- Practice Room — relaxed solo practice.
- Player setup screen with names for local opponents and four local team seats.
- Online Multiplayer is shown as server-required and is intentionally not enabled. Real online play needs a backend, matchmaking and a real-time transport service.

## Game features

- Dark royal wood, gold trim, corner pockets and a top-down Canvas board.
- Striker drag-to-aim, variable shot power, trajectory guide, keyboard-free touch controls and striker-position slider.
- Coin-to-coin collisions, rebounds, cushion bounces, surface friction and pocket detection.
- Queen-cover logic, striker foul handling, turns, scoring and match results.
- Unlockable board, striker and coin-accent looks.
- Local wallet, daily bonus, missions, achievements, player profile, match history and local leaderboard.
- Sound effects, optional ambient tone and vibration settings.
- Responsive layouts for desktop, mobile portrait menus and mobile landscape gameplay.
- Saves locally in the browser with `localStorage`. No account or API key is required.

## Run locally

Open `index.html` in a modern browser. For a local web server, run:

```bash
python -m http.server 8000
```

Then visit `http://localhost:8000`.

## Publish on GitHub Pages

1. Create a **public** repository named `Carrom-King-GamerKie` (or choose another name and update the URL accordingly).
2. Upload the **contents** of this folder to the repository root. `index.html` must be at the root, alongside `css/`, `js/` and `assets/`.
3. Open **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select branch `main` and folder `/ (root)`, then Save.
6. After GitHub Pages publishes the site, open the displayed URL. For the `kielabs` account and the suggested repository name, the URL will be:

   `https://kielabs.github.io/Carrom-King-GamerKie/`

The URL only works after that repository has been created and Pages has finished deploying.

For phone-specific upload steps and Blogger code, see `GITHUB-UPLOAD-HINDI.md` and `blogger-iframe.html`.

## Tests

No package installation is needed. With Node.js installed, run:

```bash
npm test
```

The tests cover rack setup, collisions, wall rebound, pockets, friction/settling, foul/queen-turn rules and local profile persistence.

## Project structure

```text
Carrom-King-GamerKie/
├── index.html
├── css/
│   └── styles.css
├── js/
│   ├── physics.js
│   ├── rules.js
│   ├── storage.js
│   └── game.js
├── assets/
│   └── favicon.svg
├── tests/
│   ├── physics.test.cjs
│   ├── rules.test.cjs
│   └── storage.test.cjs
├── blogger-iframe.html
├── GITHUB-UPLOAD-HINDI.md
├── package.json
└── README.md
```

## Notes

- Progress is saved on the same browser/device. It does not sync between devices.
- The leaderboard is local to the device; it is not a global online leaderboard.
- Online multiplayer is not active and is not simulated. It requires a separately deployed backend and real-time server.
- The game uses an original lightweight Canvas physics implementation and does not load a third-party game engine or remote game assets.
