(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.CarromRules = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  function evaluateShot({ player, pocketed = [], practice = false }) {
    const strikerPocketed = pocketed.some(item => item.type === 'striker');
    const ownPocketed = pocketed.filter(item => item.type === 'coin' && item.colorId === player.colorId);
    const queenPocketed = pocketed.some(item => item.type === 'coin' && item.colorId === 'queen');
    const foul = strikerPocketed;
    const queenCoveredThisShot = queenPocketed && ownPocketed.length > 0 && !foul;
    const returnQueen = queenPocketed && !queenCoveredThisShot;
    return {
      foul,
      ownPocketed,
      queenPocketed,
      queenCoveredThisShot,
      returnQueen,
      retainTurn: practice || (!foul && ownPocketed.length > 0)
    };
  }
  return { evaluateShot };
});
