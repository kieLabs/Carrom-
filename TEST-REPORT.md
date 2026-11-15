# Build verification record

Date: 16 November 2026

## Passed

- Inline JavaScript extracted from `index.html` passes `node --check`.
- `node tests/smoke.test.js` passes.
- The smoke test verifies: initial 9 white + 9 black + queen rack; render path executes against a Canvas API stub; turn changes after an empty shot; same-turn/next-shot queen cover; foul coin respot; Freestyle white/black scoring; a simulated physics shot settles; AI turn can enter a shot; and local Player 2 can enter a shot.
- The page contains no external image, audio, script or stylesheet imports. Game artwork is drawn on Canvas and sound is generated with Web Audio.

## Not claimed as tested

- A complete manual end-to-end test on Android/iPhone hardware has not been performed here.
- Tournament-perfect carrom adjudication, official rule edge cases, online multiplayer, server sync and cloud account persistence are outside this offline build.
- Browser frame rate depends on the user's device and browser.
