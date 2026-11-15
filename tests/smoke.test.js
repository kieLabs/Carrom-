/* Lightweight, dependency-free game-logic smoke tests. Run: node tests/smoke.test.js */
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const html = fs.readFileSync(new URL('../index.html', `file://${__filename}`), 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script, 'inline game script is present');

class FakeClassList {
  constructor() { this.values = new Set(); }
  add(v) { this.values.add(v); }
  remove(v) { this.values.delete(v); }
  contains(v) { return this.values.has(v); }
  toggle(v, force) {
    const on = force === undefined ? !this.values.has(v) : !!force;
    if (on) this.values.add(v); else this.values.delete(v);
    return on;
  }
}
class FakeElement {
  constructor(id = '') {
    this.id = id; this.textContent = ''; this.innerHTML = ''; this.value = '50';
    this.style = { setProperty() {} }; this.classList = new FakeClassList();
    this.handlers = {}; this.children = []; this.dataset = {};
  }
  addEventListener(type, fn) { this.handlers[type] = fn; }
  appendChild(node) { this.children.push(node); }
  setPointerCapture() {}
  getBoundingClientRect() { return { left: 0, top: 0, width: 900, height: 900 }; }
}
const ids = ['board','coins','gems','winsLabel','levelLabel','xpLabel','levelProgress','soundBtn','lobby','game','modeLabel','status','player0','player1','playerName0','playerName1','playerScore0','playerScore1','tray0','tray1','meter0','meter1','time0','time1','position','positionLabel','pauseBtn','difficultyBtn','dialogTitle','dialogText','dialogPrimary','dialogSecondary','settingsArea','dialogOverlay','toast','homeBtn','homeGameBtn','resetBtn','quickPlay','howBtn','settingsBtn','rulesBtn','newMatchBtn'];
const elements = new Map(ids.map(id => [id, new FakeElement(id)]));
const fakeContext = new Proxy({}, {
  get(_target, prop) {
    if (prop === 'createLinearGradient' || prop === 'createRadialGradient') return () => ({ addColorStop() {} });
    if (prop === 'measureText') return () => ({ width: 10 });
    return () => {};
  },
  set() { return true; }
});
const canvas = elements.get('board');
canvas.getContext = () => fakeContext;
const document = {
  querySelector(selector) { return elements.get(selector.replace(/^#/, '')) || new FakeElement(selector); },
  querySelectorAll() { return []; },
  createElement() { return new FakeElement(); }
};
const local = new Map([['gk-carrom-sound','0']]);
const localStorage = { getItem: k => local.has(k) ? local.get(k) : null, setItem: (k,v) => local.set(k,String(v)) };
let timerId = 0;
const window = { navigator: { vibrate() {} } };
const sandbox = {
  document, window, localStorage, navigator: window.navigator, console, Math,
  requestAnimationFrame: () => ++timerId, cancelAnimationFrame() {},
  setTimeout: () => ++timerId, clearTimeout() {}, setInterval: () => ++timerId, clearInterval() {},
  AudioContext: undefined
};
vm.runInNewContext(script, sandbox, { timeout: 3000 });
const game = window.__GAMERKIE_CARROM__;
assert.ok(game, 'game test API is available');

// Fresh rack: one queen plus nine pieces per colour.
game.newGame('classic');
let state = game.debugState();
assert.equal(state.pieces, 19);
assert.equal(state.white, 9);
assert.equal(state.black, 9);
assert.equal(state.queenAlive, true);
game.debugDraw();

// A legal own-colour pocket keeps the player turn.
assert.equal(game.debugPocket('white'), true);
game.debugFinish();
state = game.debugState();
assert.equal(state.turn, 0);
assert.equal(state.white, 8);

// Queen can be pocketed first and covered on the next shot.
assert.equal(game.debugPocket('red'), true);
game.debugFinish();
state = game.debugState();
assert.equal(state.turn, 0);
assert.equal(state.queenAlive, false);
assert.equal(game.debugPocket('white'), true);
game.debugFinish();
state = game.debugState();
assert.equal(state.turn, 0);
assert.equal(state.score0, 50);

// Foul returns one of the shooter's own previously pocketed coins.
game.newGame('classic');
game.debugPocket('white');
game.debugFinish();
game.debugFoul();
state = game.debugState();
assert.equal(state.white, 9);
assert.equal(state.turn, 1);

// Freestyle point values: white +20, black +10; queen +50.
game.newGame('free');
game.debugPocket('white');
game.debugFinish();
game.debugPocket('black');
game.debugFinish();
state = game.debugState();
assert.equal(state.score0, 30);
assert.equal(state.turn, 1);

// Real physics advances and settles a shot; AI-controlled turn can issue its own shot.
game.newGame('classic');
game.debugShoot(0, -760);
assert.equal(game.debugState().moving, true);
const simulated = game.debugAdvance(8);
assert.equal(simulated.moving, false);
assert.ok(simulated.elapsed <= 8);
game.newGame('classic');
game.debugFinish();
assert.equal(game.debugState().turn, 1);
game.debugShoot(0, 600);
assert.equal(game.debugState().moving, true);
game.newGame('local');
game.debugFinish();
assert.equal(game.debugState().turn, 1);
game.debugShoot(0, 600);
assert.equal(game.debugState().moving, true);

console.log('PASS: lobby/game boot, board rendering, 9+9+queen rack, turn rotation, queen cover, foul respot, freestyle scoring, physics settling, AI shot entry, local player-two shot entry.');
