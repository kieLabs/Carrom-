(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.CarromStorage = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const KEY = 'gamerkie.carromking.profile.v1';
  const DEFAULT_PROFILE = Object.freeze({
    version: 1, playerName: 'Carrom Champ', coins: 350, gems: 0,
    wins: 0, losses: 0, matches: 0, coinsPocketed: 0, bestStreak: 0,
    currentStreak: 0, lastDaily: '',
    settings: { sound: true, music: false, vibration: true, guide: true },
    selectedBoard: 'royal', selectedStriker: 'classic', selectedCoin: 'ivory',
    owned: { boards: ['royal'], strikers: ['classic'], coins: ['ivory'] },
    missionProgress: { pocket: 0, win: 0, play: 0 }, missionDate: '',
    claimedMissions: [], achievements: [],
    history: []
  });
  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function normalise(profile) {
    const p = { ...clone(DEFAULT_PROFILE), ...(profile && typeof profile === 'object' ? profile : {}) };
    p.settings = { ...clone(DEFAULT_PROFILE.settings), ...(p.settings || {}) };
    p.owned = { ...clone(DEFAULT_PROFILE.owned), ...(p.owned || {}) };
    p.missionProgress = { ...clone(DEFAULT_PROFILE.missionProgress), ...(p.missionProgress || {}) };
    p.claimedMissions = Array.isArray(p.claimedMissions) ? p.claimedMissions : [];
    p.achievements = Array.isArray(p.achievements) ? p.achievements : [];
    p.history = Array.isArray(p.history) ? p.history.slice(0, 30) : [];
    p.coins = Math.max(0, Number(p.coins) || 0);
    p.gems = Math.max(0, Number(p.gems) || 0);
    return p;
  }
  function load(storage) {
    try {
      const raw = (storage || (typeof localStorage !== 'undefined' ? localStorage : null))?.getItem(KEY);
      return normalise(raw ? JSON.parse(raw) : null);
    } catch (_) { return normalise(null); }
  }
  function save(profile, storage) {
    const clean = normalise(profile);
    try {
      const target = storage || (typeof localStorage !== 'undefined' ? localStorage : null);
      target?.setItem(KEY, JSON.stringify(clean));
    } catch (_) { /* Private browsing or quota restrictions: play remains available for this session. */ }
    return clean;
  }
  function claimDaily(profile, dateKey) {
    const p = normalise(profile);
    if (p.lastDaily === dateKey) return { profile: p, claimed: false, reward: 0 };
    const reward = 100;
    p.lastDaily = dateKey;
    p.coins += reward;
    return { profile: p, claimed: true, reward };
  }
  return { KEY, DEFAULT_PROFILE, normalise, load, save, claimDaily };
});
