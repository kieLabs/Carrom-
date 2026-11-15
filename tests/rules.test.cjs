const assert = require('node:assert/strict');
const R = require('../js/rules.js');
const player = { colorId: 'white' };
const coin = (colorId) => ({ type: 'coin', colorId });
const striker = { type: 'striker' };

const successful = R.evaluateShot({ player, pocketed: [coin('white'), coin('queen')] });
assert.equal(successful.queenCoveredThisShot, true);
assert.equal(successful.returnQueen, false);
assert.equal(successful.retainTurn, true);
assert.equal(successful.ownPocketed.length, 1);

const queenOnly = R.evaluateShot({ player, pocketed: [coin('queen')] });
assert.equal(queenOnly.returnQueen, true);
assert.equal(queenOnly.queenCoveredThisShot, false);

const foul = R.evaluateShot({ player, pocketed: [coin('white'), striker] });
assert.equal(foul.foul, true);
assert.equal(foul.retainTurn, false);
assert.equal(foul.queenCoveredThisShot, false);

const opponentOnly = R.evaluateShot({ player, pocketed: [coin('black')] });
assert.equal(opponentOnly.retainTurn, false);

console.log('Carrom rules tests passed.');
