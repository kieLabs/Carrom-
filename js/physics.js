(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.CarromPhysics = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const TABLE = Object.freeze({
    minX: 116, maxX: 884, minY: 116, maxY: 884,
    pockets: [
      { x: 120, y: 120 }, { x: 880, y: 120 },
      { x: 120, y: 880 }, { x: 880, y: 880 }
    ],
    pocketRadius: 36,
    friction: 1.42,
    restitution: 0.91,
    maxSpeed: 12.5
  });

  function createRack() {
    const coins = [];
    let index = 0;
    const add = (x, y, colorId) => {
      const colors = { white: '#f4eddb', black: '#252833', queen: '#d9434b' };
      coins.push({
        id: `coin-${index++}`, type: 'coin', colorId, color: colors[colorId],
        x, y, vx: 0, vy: 0, radius: 17.5, mass: 1, pocketed: false
      });
    };
    add(500, 500, 'queen');
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
      add(500 + Math.cos(angle) * 37, 500 + Math.sin(angle) * 37, i % 2 === 0 ? 'white' : 'black');
    }
    for (let i = 0; i < 12; i++) {
      const angle = (Math.PI * 2 * i) / 12;
      add(500 + Math.cos(angle) * 73, 500 + Math.sin(angle) * 73, i % 2 === 0 ? 'black' : 'white');
    }
    return coins;
  }

  function resolvePair(a, b, restitution = TABLE.restitution) {
    if (!a || !b || a.pocketed || b.pocketed) return;
    let dx = b.x - a.x;
    let dy = b.y - a.y;
    let distSq = dx * dx + dy * dy;
    const minDist = a.radius + b.radius;
    if (distSq >= minDist * minDist) return;
    if (distSq < 0.000001) { dx = 0.001; dy = 0; distSq = dx * dx; }
    const dist = Math.sqrt(distSq);
    const nx = dx / dist;
    const ny = dy / dist;
    const invMassA = 1 / (a.mass || (a.type === 'striker' ? 1.3 : 1));
    const invMassB = 1 / (b.mass || (b.type === 'striker' ? 1.3 : 1));
    const invTotal = invMassA + invMassB;
    const overlap = minDist - dist;
    const correction = Math.max(overlap - 0.015, 0) * 0.82 / invTotal;
    a.x -= nx * correction * invMassA;
    a.y -= ny * correction * invMassA;
    b.x += nx * correction * invMassB;
    b.y += ny * correction * invMassB;
    const relativeVelocity = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
    if (relativeVelocity >= 0) return;
    const impulse = -(1 + restitution) * relativeVelocity / invTotal;
    a.vx -= impulse * invMassA * nx;
    a.vy -= impulse * invMassA * ny;
    b.vx += impulse * invMassB * nx;
    b.vy += impulse * invMassB * ny;
  }

  function resolveWalls(body) {
    if (!body || body.pocketed) return;
    const minX = TABLE.minX + body.radius;
    const maxX = TABLE.maxX - body.radius;
    const minY = TABLE.minY + body.radius;
    const maxY = TABLE.maxY - body.radius;
    if (body.x < minX) { body.x = minX; if (body.vx < 0) body.vx *= -0.88; }
    if (body.x > maxX) { body.x = maxX; if (body.vx > 0) body.vx *= -0.88; }
    if (body.y < minY) { body.y = minY; if (body.vy < 0) body.vy *= -0.88; }
    if (body.y > maxY) { body.y = maxY; if (body.vy > 0) body.vy *= -0.88; }
  }

  function checkPocket(body) {
    if (!body || body.pocketed) return false;
    for (const pocket of TABLE.pockets) {
      const dx = body.x - pocket.x;
      const dy = body.y - pocket.y;
      if (dx * dx + dy * dy <= TABLE.pocketRadius * TABLE.pocketRadius) {
        body.pocketed = true;
        body.vx = 0;
        body.vy = 0;
        body.x = pocket.x;
        body.y = pocket.y;
        return true;
      }
    }
    return false;
  }

  function applyFriction(body, dt) {
    if (!body || body.pocketed) return;
    const damping = Math.exp(-TABLE.friction * dt);
    body.vx *= damping;
    body.vy *= damping;
    const speed = Math.hypot(body.vx, body.vy);
    if (speed < 0.035) { body.vx = 0; body.vy = 0; }
    else if (speed > TABLE.maxSpeed) {
      const scale = TABLE.maxSpeed / speed;
      body.vx *= scale;
      body.vy *= scale;
    }
  }

  function step(bodies, dt = 1 / 60) {
    const safeDt = Math.min(Math.max(dt, 0), 1 / 20);
    if (!safeDt) return [];
    const substeps = 3;
    const subDt = safeDt / substeps;
    const pocketed = [];
    for (let s = 0; s < substeps; s++) {
      for (const b of bodies) {
        if (b.pocketed) continue;
        b.x += b.vx * subDt * 60;
        b.y += b.vy * subDt * 60;
        if (checkPocket(b)) pocketed.push(b);
        else resolveWalls(b);
      }
      for (let i = 0; i < bodies.length; i++) {
        for (let j = i + 1; j < bodies.length; j++) resolvePair(bodies[i], bodies[j]);
      }
      for (const b of bodies) applyFriction(b, subDt);
    }
    return pocketed;
  }

  function allStopped(bodies) {
    return bodies.every(b => b.pocketed || Math.hypot(b.vx, b.vy) < 0.035);
  }

  return { TABLE, createRack, resolvePair, resolveWalls, checkPocket, applyFriction, step, allStopped };
});
