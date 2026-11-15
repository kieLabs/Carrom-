const assert = require('node:assert/strict');
const S = require('../js/storage.js');
const data = new Map();
const fakeStorage = {
  getItem: key => data.has(key) ? data.get(key) : null,
  setItem: (key, value) => data.set(key, value)
};

const first = S.load(fakeStorage);
assert.equal(first.coins, 350);
first.playerName = 'Test Champion';
first.coins = 500;
S.save(first, fakeStorage);
const loaded = S.load(fakeStorage);
assert.equal(loaded.playerName, 'Test Champion');
assert.equal(loaded.coins, 500);

const daily = S.claimDaily(loaded, '2026-11-15');
assert.equal(daily.claimed, true);
assert.equal(daily.reward, 100);
assert.equal(daily.profile.coins, 600);
const repeat = S.claimDaily(daily.profile, '2026-11-15');
assert.equal(repeat.claimed, false);
assert.equal(repeat.profile.coins, 600);

const brokenStorage = { getItem: () => '{not valid json', setItem: () => {} };
assert.equal(S.load(brokenStorage).coins, 350, 'corrupt saved data should recover to defaults');

console.log('Carrom storage tests passed.');
