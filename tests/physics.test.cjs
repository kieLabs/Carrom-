const assert = require('node:assert/strict');
const P = require('../js/physics.js');

function body(id, x, y, vx = 0, vy = 0, radius = 18, type = 'coin') {
  return { id, x, y, vx, vy, radius, type, color: type === 'striker' ? '#d7e5f2' : '#ffffff', pocketed: false };
}

// Rack composition and unique IDs.
{
  const rack = P.createRack();
  assert.equal(rack.filter(x => x.colorId === 'white').length, 9);
  assert.equal(rack.filter(x => x.colorId === 'black').length, 9);
  assert.equal(rack.filter(x => x.colorId === 'queen').length, 1);
  assert.equal(new Set(rack.map(x => x.id)).size, rack.length);
}

// Equal-mass head-on collision transfers most of the moving body's momentum.
{
  const a = body('a', 400, 500, 5, 0);
  const b = body('b', 435, 500, 0, 0);
  P.resolvePair(a, b, 0.94);
  assert.ok(b.vx > 3.5, `expected b to receive momentum, got ${b.vx}`);
  assert.ok(a.vx < 1.5, `expected a to slow down, got ${a.vx}`);
  assert.ok(a.x < b.x, 'collision resolution should separate overlapping bodies');
}

// Wall collision reverses velocity and keeps the body inside the playing area.
{
  const b = body('wall', 870, 500, 8, 0);
  P.resolveWalls(b);
  assert.ok(b.vx < 0);
  assert.ok(b.x <= 884 - b.radius + 0.001);
}

// Pocket detection marks a coin as pocketed and removes its motion.
{
  const b = body('pocket', 128, 128, 2, 1);
  const pocketed = P.checkPocket(b);
  assert.equal(pocketed, true);
  assert.equal(b.pocketed, true);
  assert.equal(b.vx, 0);
}

// Friction eventually slows a moving body without reversing it.
{
  const b = body('friction', 500, 500, 2, 0);
  P.applyFriction(b, 1 / 60);
  assert.ok(b.vx > 0 && b.vx < 2);
}

// Fixed-step simulation advances a shot and eventually settles it.
{
  const moving = body('moving', 500, 500, 4, 0);
  for (let i = 0; i < 600 && !P.allStopped([moving]); i++) P.step([moving], 1 / 60);
  assert.equal(P.allStopped([moving]), true, 'friction should settle a shot');
  assert.ok(moving.x > 500, 'the moving body should advance before it stops');
}

console.log('Carrom physics tests passed.');
