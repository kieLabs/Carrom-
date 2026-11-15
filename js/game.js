(function () {
  'use strict';
  const P = window.CarromPhysics;
  const S = window.CarromStorage;
  const R = window.CarromRules;
  const $ = (id) => document.getElementById(id);
  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
  const todayKey = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
  const modeNames = { ai: 'CLASSIC VS AI', local: '2 PLAYER LOCAL', team: '2 VS 2 TEAM', practice: 'PRACTICE ROOM' };
  const difficultyInfo = {
    beginner: { speed: 5.4, error: 0.24 }, easy: { speed: 6.2, error: 0.16 },
    medium: { speed: 7.1, error: 0.095 }, hard: { speed: 8.0, error: 0.052 },
    expert: { speed: 8.8, error: 0.028 }, master: { speed: 9.4, error: 0.014 }
  };
  const shopItems = {
    boards: [
      { id: 'royal', name: 'Royal Walnut', detail: 'The original royal table.', price: 0, icon: '♛' },
      { id: 'emerald', name: 'Emerald Hall', detail: 'Deep green felt with warm gold rails.', price: 250, icon: '✦' },
      { id: 'midnight', name: 'Midnight Gold', detail: 'A dark premium table for night matches.', price: 300, icon: '◈' }
    ],
    strikers: [
      { id: 'classic', name: 'Classic Striker', detail: 'Balanced and timeless.', price: 0, icon: '◉' },
      { id: 'gold', name: 'Royal Gold', detail: 'A bright gold edge finish.', price: 120, icon: '✧' },
      { id: 'jade', name: 'Jade Striker', detail: 'A deep emerald accent.', price: 180, icon: '❖' }
    ],
    coins: [
      { id: 'ivory', name: 'Ivory Classic', detail: 'Warm ivory and charcoal pieces.', price: 0, icon: '●' },
      { id: 'obsidian', name: 'Obsidian Edge', detail: 'Cool silver trim on every coin.', price: 150, icon: '◐' },
      { id: 'ruby', name: 'Ruby Royale', detail: 'A crimson accent ring.', price: 220, icon: '♦' }
    ]
  };
  const missionDefs = [
    { id: 'pocket', title: 'Pocket three coins', detail: 'Pocket 3 of your colour in any match.', target: 3, reward: 30 },
    { id: 'win', title: 'Claim a victory', detail: 'Win 1 match in any mode.', target: 1, reward: 50 },
    { id: 'play', title: 'Take your seat', detail: 'Complete 2 matches.', target: 2, reward: 40 }
  ];
  const achievementDefs = [
    { id: 'first-win', title: 'First Crown', detail: 'Win your first match.', icon: '♛' },
    { id: 'pocket-10', title: 'Pocket Artist', detail: 'Pocket 10 of your coins.', icon: '◎' },
    { id: 'streak-3', title: 'On a Roll', detail: 'Win 3 matches in a row.', icon: '✦' }
  ];

  let profile = S.load();
  if (profile.missionDate !== todayKey()) {
    profile.missionDate = todayKey();
    profile.missionProgress = { pocket: 0, win: 0, play: 0 };
    profile.claimedMissions = [];
    profile = S.save(profile);
  }
  let selectedMode = 'ai';
  let selectedCollection = 'boards';
  let toastTimer = 0;
  let game = null;
  let animationId = 0;
  let lastFrameTime = 0;
  let physicsAccumulator = 0;
  const FIXED_PHYSICS_STEP = 1 / 60;
  let musicContext = null;
  let musicNodes = [];
  const canvas = $('carrom-board');
  const ctx = canvas.getContext('2d');

  function saveProfile() {
    profile = S.save(profile);
    updateWallet();
  }
  function updateWallet() { $('wallet-coins').textContent = profile.coins.toLocaleString('en-IN'); }
  function showToast(message) {
    const toast = $('toast');
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2300);
  }
  function showView(id) {
    document.querySelectorAll('.view').forEach(v => v.classList.toggle('active', v.id === id));
    document.querySelectorAll('.nav-item').forEach(v => v.classList.toggle('active', v.dataset.view === id));
    if (id === 'home-view') updateHome();
    if (id === 'mode-view') updatePlayerSetup();
    if (id === 'profile-view') updateProfileView();
    if (id === 'leaderboard-view') updateLeaderboard();
    if (id === 'rewards-view') renderRewards();
    if (id === 'settings-view') updateSettingsView();
    if (id === 'collection-view') renderCollection();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function updatePlayerSetup() {
    $('setup-player-one').value = profile.playerName;
    const isPractice = selectedMode === 'practice';
    const isTeam = selectedMode === 'team';
    $('setup-player-two-wrap').hidden = isPractice;
    $('setup-player-three-wrap').hidden = !isTeam;
    $('setup-player-four-wrap').hidden = !isTeam;
    $('setup-player-two').disabled = selectedMode === 'ai';
    if (selectedMode === 'ai') $('setup-player-two').value = 'Royal AI';
    else if (!$('setup-player-two').value || $('setup-player-two').value === 'Royal AI') $('setup-player-two').value = 'Player 2';
  }
  function updateHome() {
    $('home-wins').textContent = profile.wins;
    $('home-coins-pocketed').textContent = profile.coinsPocketed;
    $('home-streak').textContent = profile.currentStreak;
    $('avatar-initial').textContent = (profile.playerName || 'C').charAt(0).toUpperCase();
    const claimed = profile.lastDaily === todayKey();
    $('daily-status').textContent = claimed ? 'Already collected today' : 'Claim 100 free coins';
    updateWallet();
  }
  function updateProfileView() {
    $('profile-name').textContent = profile.playerName;
    $('profile-avatar').textContent = (profile.playerName || 'C').charAt(0).toUpperCase();
    $('player-name-input').value = profile.playerName;
    $('profile-wins').textContent = profile.wins;
    $('profile-losses').textContent = profile.losses;
    $('profile-matches').textContent = profile.matches;
    $('profile-pocketed').textContent = profile.coinsPocketed;
    const history = $('match-history');
    if (!profile.history.length) history.innerHTML = '<div class="history-row"><span>No matches yet</span><small>Your results will appear here.</small></div>';
    else history.innerHTML = profile.history.slice(0, 10).map(item => `<div class="history-row"><span>${escapeHtml(item.mode)} · ${escapeHtml(item.result)}</span><small>${escapeHtml(item.date)}</small></div>`).join('');
  }
  function updateLeaderboard() {
    const rate = profile.matches ? Math.round(profile.wins / profile.matches * 100) : 0;
    $('leaderboard-rows').innerHTML = `<div class="leader-row"><span>#01</span><strong>${escapeHtml(profile.playerName)}</strong><span>${profile.wins}</span><span>${rate}%</span></div>`;
  }
  function updateSettingsView() {
    $('setting-sound').checked = !!profile.settings.sound;
    $('setting-music').checked = !!profile.settings.music;
    $('setting-vibration').checked = !!profile.settings.vibration;
    $('setting-guide').checked = !!profile.settings.guide;
  }
  function escapeHtml(text) {
    return String(text).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function claimDaily() {
    const result = S.claimDaily(profile, todayKey());
    profile = result.profile;
    if (!result.claimed) showToast('Your daily bonus is already collected. Come back tomorrow!');
    else { saveProfile(); sfx('reward'); showToast('+100 royal coins added to your wallet!'); }
    updateHome();
    renderRewards();
  }

  function renderCollection() {
    const owned = profile.owned[selectedCollection] || [];
    const selectedKey = selectedCollection === 'boards' ? 'selectedBoard' : selectedCollection === 'strikers' ? 'selectedStriker' : 'selectedCoin';
    $('collection-items').innerHTML = shopItems[selectedCollection].map(item => {
      const isOwned = owned.includes(item.id);
      const isSelected = profile[selectedKey] === item.id;
      const action = isOwned ? (isSelected ? 'EQUIPPED' : 'EQUIP') : `${item.price} ◆`;
      return `<article class="vault-item"><div class="vault-preview preview-${item.id}">${item.icon}</div><strong>${item.name}</strong><small>${item.detail}</small><div class="vault-item-footer"><span class="vault-price">${isOwned ? (isSelected ? 'CURRENTLY EQUIPPED' : 'OWNED') : `${item.price} COINS`}</span><button class="vault-action" data-action="vault-item" data-kind="${selectedCollection}" data-id="${item.id}" ${isSelected ? 'disabled' : ''}>${action}</button></div></article>`;
    }).join('');
  }
  function buyOrEquip(kind, id) {
    const item = shopItems[kind]?.find(x => x.id === id);
    if (!item) return;
    const owned = profile.owned[kind];
    const selectedKey = kind === 'boards' ? 'selectedBoard' : kind === 'strikers' ? 'selectedStriker' : 'selectedCoin';
    if (!owned.includes(id)) {
      if (profile.coins < item.price) { showToast('Not enough coins. Play matches and claim rewards.'); return; }
      profile.coins -= item.price;
      owned.push(id);
      showToast(`${item.name} unlocked!`);
      sfx('reward');
    }
    profile[selectedKey] = id;
    saveProfile();
    renderCollection();
    populateArenaSelect();
  }
  function populateArenaSelect() {
    const select = $('arena-select');
    const owned = profile.owned.boards;
    select.innerHTML = shopItems.boards.filter(item => owned.includes(item.id)).map(item => `<option value="${item.id}">${item.name}</option>`).join('');
    select.value = owned.includes(profile.selectedBoard) ? profile.selectedBoard : 'royal';
  }
  function renderRewards() {
    const claimedToday = profile.lastDaily === todayKey();
    $('mission-list').innerHTML = missionDefs.map(m => {
      const progress = Math.min(Number(profile.missionProgress[m.id] || 0), m.target);
      const claimed = profile.claimedMissions.includes(m.id);
      const percent = Math.round(progress / m.target * 100);
      return `<div class="mission-card"><div class="mission-info"><strong>${m.title}</strong><small>${m.detail} · ${progress}/${m.target}</small><div class="mission-progress"><span style="width:${percent}%"></span></div></div><div class="mission-reward">+${m.reward} COINS${claimed ? '<br><small>CLAIMED</small>' : progress >= m.target ? `<button class="vault-action" data-action="claim-mission" data-id="${m.id}">CLAIM</button>` : '<br><small>IN PROGRESS</small>'}</div></div>`;
    }).join('');
    $('achievement-list').innerHTML = achievementDefs.map(a => {
      const unlocked = profile.achievements.includes(a.id);
      return `<div class="achievement ${unlocked ? 'unlocked' : ''}"><span class="achievement-icon">${a.icon}</span><div><strong>${a.title}</strong><small>${unlocked ? 'UNLOCKED' : a.detail}</small></div></div>`;
    }).join('');
    const rewardButton = document.querySelector('#rewards-view [data-action="claim-daily"]');
    if (rewardButton) { rewardButton.disabled = claimedToday; rewardButton.textContent = claimedToday ? 'DAILY BONUS COLLECTED' : 'CLAIM DAILY BONUS ↗'; }
  }
  function claimMission(id) {
    const mission = missionDefs.find(m => m.id === id);
    if (!mission || profile.claimedMissions.includes(id) || (profile.missionProgress[id] || 0) < mission.target) return;
    profile.claimedMissions.push(id);
    profile.coins += mission.reward;
    saveProfile(); renderRewards(); sfx('reward'); showToast(`Mission complete! +${mission.reward} coins.`);
  }
  function addMissionProgress(key, amount) {
    profile.missionProgress[key] = Math.min((profile.missionProgress[key] || 0) + amount, 99);
  }
  function unlockAchievement(id) {
    if (!profile.achievements.includes(id)) {
      profile.achievements.push(id);
      const achievement = achievementDefs.find(a => a.id === id);
      if (achievement) showToast(`Achievement unlocked: ${achievement.title}`);
    }
  }

  function createStriker(player) {
    return {
      id: 'striker', type: 'striker', colorId: 'striker', color: '#d8d0c1',
      x: 500, y: player.colorId === 'white' ? 810 : 190,
      vx: 0, vy: 0, radius: 23, mass: 1.28, pocketed: false
    };
  }
  function createPlayers(mode) {
    const name = (id, fallback) => ($(id).value.trim().slice(0, 18) || fallback);
    if (mode === 'practice') return [{ name: name('setup-player-one', profile.playerName), colorId: 'white', team: 0, isAI: false }];
    if (mode === 'team') return [
      { name: name('setup-player-one', profile.playerName), colorId: 'white', team: 0, isAI: false },
      { name: name('setup-player-two', 'Player 2'), colorId: 'black', team: 1, isAI: false },
      { name: name('setup-player-three', 'Player 3'), colorId: 'white', team: 0, isAI: false },
      { name: name('setup-player-four', 'Player 4'), colorId: 'black', team: 1, isAI: false }
    ];
    return [
      { name: name('setup-player-one', profile.playerName), colorId: 'white', team: 0, isAI: false },
      { name: mode === 'ai' ? `ROYAL AI · ${$('ai-difficulty').value.toUpperCase()}` : name('setup-player-two', 'Player 2'), colorId: 'black', team: 1, isAI: mode === 'ai' }
    ];
  }
  function beginMatch() {
    selectedMode = selectedMode || 'ai';
    const requestedName = $('setup-player-one').value.trim().slice(0, 18);
    if (requestedName.length >= 2) profile.playerName = requestedName;
    profile.selectedBoard = $('arena-select').value || profile.selectedBoard;
    saveProfile();
    const players = createPlayers(selectedMode);
    const coins = P.createRack();
    const striker = createStriker(players[0]);
    game = {
      mode: selectedMode, difficulty: $('ai-difficulty').value, players,
      coins, striker, bodies: coins.concat(striker), turnIndex: 0,
      queenCovered: false, moving: false, aiming: false, placing: false,
      dragPoint: null, shotContext: null, paused: false, completed: false,
      pocketedThisMatch: 0, arena: profile.selectedBoard, lastShotAt: 0
    };
    $('game-mode-name').textContent = modeNames[selectedMode];
    $('guide-state').textContent = profile.settings.guide ? 'ON' : 'OFF';
    $('sound-state').textContent = profile.settings.sound ? 'ON' : 'OFF';
    $('striker-position').value = 500;
    $('power-fill').style.width = '0%';
    $('power-label').textContent = 'DRAG TO SET POWER';
    $('pause-modal').hidden = true;
    $('result-modal').hidden = true;
    showView('game-view');
    setTurnUI();
    cancelAnimationFrame(animationId);
    lastFrameTime = 0;
    physicsAccumulator = 0;
    animationId = requestAnimationFrame(gameLoop);
  }
  function currentPlayer() { return game?.players[game.turnIndex]; }
  function activeStrikerY() { return currentPlayer()?.colorId === 'black' ? 190 : 810; }
  function setTurnUI() {
    if (!game) return;
    const p = currentPlayer();
    const whitePlayer = game.players.find(x => x.colorId === 'white');
    const blackPlayer = game.players.find(x => x.colorId === 'black');
    $('player-one-name').textContent = game.mode === 'team' ? 'TEAM WHITE' : (whitePlayer?.name || 'YOU');
    $('player-two-name').textContent = game.mode === 'team' ? 'TEAM BLACK' : (blackPlayer?.name || 'PLAYER 2');
    $('player-one-side').textContent = game.mode === 'team' ? 'TEAM 1' : 'WHITE';
    $('player-two-side').textContent = game.mode === 'team' ? 'TEAM 2' : 'BLACK';
    $('player-one-score').textContent = game.players.filter(x => x.colorId === 'white').reduce((n, x) => n + (x.score || 0), 0);
    $('player-two-score').textContent = game.players.filter(x => x.colorId === 'black').reduce((n, x) => n + (x.score || 0), 0);
    $('player-one-card').classList.toggle('active-player', p.colorId === 'white');
    $('player-two-card').classList.toggle('active-player', p.colorId === 'black');
    const turnName = p.isAI ? 'AI THINKING' : game.mode === 'practice' ? 'YOUR PRACTICE' : `${p.name} TURN`;
    $('turn-text').textContent = turnName.toUpperCase();
    $('tip-text').textContent = p.isAI ? 'Watch the opponent choose a line and adjust your next strike.' : 'Drag backwards from your striker to aim. Release to strike.';
    game.striker.y = activeStrikerY();
    game.striker.x = 500;
    $('striker-position').value = 500;
    game.striker.vx = game.striker.vy = 0;
    game.striker.pocketed = false;
    if (p.isAI && !game.completed) scheduleAiTurn();
  }
  function scheduleAiTurn() {
    if (game.aiTimer) clearTimeout(game.aiTimer);
    game.aiTimer = setTimeout(runAiTurn, 850);
  }
  function runAiTurn() {
    if (!game || game.paused || game.completed || game.moving || !currentPlayer()?.isAI) return;
    const player = currentPlayer();
    const own = game.coins.filter(c => !c.pocketed && c.colorId === player.colorId);
    if (!own.length) { completeMatch('white'); return; }
    const pockets = P.TABLE.pockets;
    let candidates = [];
    for (const coin of own) {
      for (const pocket of pockets) {
        const dx = pocket.x - coin.x, dy = pocket.y - coin.y;
        const dist = Math.hypot(dx, dy) || 1;
        const ux = dx / dist, uy = dy / dist;
        const contact = { x: coin.x - ux * (coin.radius + game.striker.radius + 3), y: coin.y - uy * (coin.radius + game.striker.radius + 3) };
        const line = Math.hypot(contact.x - game.striker.x, contact.y - game.striker.y);
        const score = line + dist * 0.32;
        candidates.push({ contact, coin, score, pocket });
      }
    }
    candidates.sort((a, b) => a.score - b.score);
    const choice = candidates[0];
    if (!choice) return;
    game.striker.x = clamp(choice.contact.x, 190, 810);
    game.striker.y = activeStrikerY();
    const dx = choice.contact.x - game.striker.x;
    const dy = choice.contact.y - game.striker.y;
    let angle = Math.atan2(dy, dx);
    const settings = difficultyInfo[game.difficulty] || difficultyInfo.medium;
    angle += (Math.random() - 0.5) * settings.error * 2;
    const speed = settings.speed;
    game.striker.vx = Math.cos(angle) * speed;
    game.striker.vy = Math.sin(angle) * speed;
    if (Math.hypot(game.striker.vx, game.striker.vy) < 0.1) game.striker.vy = speed;
    game.shotContext = { playerIndex: game.turnIndex, pocketed: [] };
    game.moving = true;
    game.aiming = false;
    game.lastShotAt = performance.now();
    physicsAccumulator = 0;
    sfx('strike');
    updatePower(Math.round(settings.speed / 10 * 100));
  }

  function startShot(vx, vy) {
    if (!game || game.moving || game.paused || currentPlayer()?.isAI) return;
    const speed = Math.hypot(vx, vy);
    if (speed < 0.5) return;
    const limit = P.TABLE.maxSpeed;
    const scale = Math.min(1, limit / speed);
    game.striker.vx = vx * scale;
    game.striker.vy = vy * scale;
    game.shotContext = { playerIndex: game.turnIndex, pocketed: [] };
    game.moving = true;
    game.aiming = false;
    game.placing = false;
    game.dragPoint = null;
    game.lastShotAt = performance.now();
    physicsAccumulator = 0;
    updatePower(0);
    $('power-label').textContent = 'SHOT IN MOTION';
    sfx('strike');
    vibrate(9);
  }
  function finishShot() {
    if (!game || !game.moving || !game.shotContext) return;
    game.moving = false;
    updatePower(0);
    const player = game.players[game.shotContext.playerIndex];
    const result = R.evaluateShot({ player, pocketed: game.shotContext.pocketed, practice: game.mode === 'practice' });
    let successfulOwn = result.ownPocketed.length;
    if (result.foul) {
      if (successfulOwn > 0) {
        const returned = result.ownPocketed[result.ownPocketed.length - 1];
        returned.pocketed = false;
        returned.x = 500 + (Math.random() - 0.5) * 35;
        returned.y = 545 + (Math.random() - 0.5) * 35;
        returned.vx = returned.vy = 0;
        successfulOwn--;
      }
      showToast('FOUL! Striker pocketed. Turn passes.');
      sfx('foul');
      vibrate([20, 25, 20]);
    } else {
      // Keep one own coin available until the queen has been covered; this avoids an unwinnable board.
      const ownCoinsLeft = game.coins.filter(c => !c.pocketed && c.colorId === player.colorId).length;
      if (!game.queenCovered && !result.queenCoveredThisShot && ownCoinsLeft === 0 && result.ownPocketed.length > 0) {
        const returned = result.ownPocketed[result.ownPocketed.length - 1];
        returned.pocketed = false; returned.x = 520; returned.y = 560; returned.vx = returned.vy = 0;
        successfulOwn--;
        showToast('Pocket the queen before your final coin. One coin returned.');
      }
      player.score = (player.score || 0) + successfulOwn;
      profile.coinsPocketed += successfulOwn;
      profile.missionProgress.pocket = Math.min(99, profile.missionProgress.pocket + successfulOwn);
      game.pocketedThisMatch += successfulOwn;
      if (successfulOwn > 0) { sfx('pocket'); vibrate(12); }
    }
    if (result.queenPocketed) {
      const queen = game.coins.find(c => c.colorId === 'queen');
      if (result.queenCoveredThisShot && !result.foul) {
        game.queenCovered = true;
        player.score = (player.score || 0) + 3;
        showToast('QUEEN COVERED! +3 points');
        sfx('queen');
      } else if (queen && result.returnQueen) {
        queen.pocketed = false; queen.x = 500; queen.y = 500; queen.vx = queen.vy = 0;
        showToast('Queen returned to the centre. Cover it with your coin!');
      }
    }
    game.striker.vx = game.striker.vy = 0;
    game.striker.pocketed = false;
    game.striker.x = clamp(game.striker.x, 190, 810);
    game.striker.y = activeStrikerY();
    if (!result.foul && successfulOwn > 0) setTurnUI();
    else if (game.mode !== 'practice') {
      if (game.mode === 'team') game.turnIndex = (game.turnIndex + 1) % game.players.length;
      else game.turnIndex = (game.turnIndex + 1) % game.players.length;
      setTurnUI();
    } else setTurnUI();
    game.shotContext = null;
    updateScoreUI();
    saveProfile();
    updateHome();
    renderRewards();

    const active = currentPlayer();
    const remaining = game.coins.filter(c => !c.pocketed && c.colorId === active.colorId).length;
    if (remaining === 0 && game.queenCovered) {
      completeMatch(active.colorId);
      return;
    }
    if (game.mode === 'ai' && active.isAI && !game.completed) scheduleAiTurn();
  }
  function updateScoreUI() {
    if (!game) return;
    $('player-one-score').textContent = game.players.filter(x => x.colorId === 'white').reduce((n, x) => n + (x.score || 0), 0);
    $('player-two-score').textContent = game.players.filter(x => x.colorId === 'black').reduce((n, x) => n + (x.score || 0), 0);
  }
  function completeMatch(winnerColor) {
    if (!game || game.completed) return;
    game.completed = true;
    game.moving = false;
    clearTimeout(game.aiTimer);
    const practice = game.mode === 'practice';
    const userWon = winnerColor === 'white';
    let reward = practice ? 10 : userWon ? 50 : 15;
    if (!practice) {
      profile.matches++;
      addMissionProgress('play', 1);
      if (userWon) {
        profile.wins++;
        profile.currentStreak++;
        profile.bestStreak = Math.max(profile.bestStreak, profile.currentStreak);
        addMissionProgress('win', 1);
        unlockAchievement('first-win');
        if (profile.currentStreak >= 3) unlockAchievement('streak-3');
      } else {
        profile.losses++;
        profile.currentStreak = 0;
      }
    }
    if (profile.coinsPocketed >= 10) unlockAchievement('pocket-10');
    profile.coins += reward;
    profile.history.unshift({ mode: modeNames[game.mode], result: practice ? 'PRACTICE DONE' : userWon ? 'VICTORY' : 'DEFEAT', date: new Date().toLocaleDateString('en-IN') });
    profile.history = profile.history.slice(0, 30);
    saveProfile();
    updateHome();
    $('result-kicker').textContent = game.mode === 'practice' ? 'PRACTICE COMPLETE' : 'MATCH COMPLETE';
    $('result-title').textContent = game.mode === 'practice' ? 'Nice practice!' : userWon ? 'Victory!' : 'Good game.';
    $('result-copy').textContent = game.mode === 'practice' ? 'Keep training. Every strike makes you sharper.' : userWon ? 'A royal performance. The table belongs to you.' : 'The next match is yours to win. Keep practising.';
    $('result-coins').textContent = `+${reward} COINS`;
    $('result-modal').hidden = false;
    sfx(userWon ? 'win' : 'reward');
    renderRewards();
  }

  function updatePower(value) {
    $('power-fill').style.width = `${clamp(value, 0, 100)}%`;
    $('power-label').textContent = value > 0 ? `${clamp(value, 0, 100)}% POWER` : 'DRAG TO SET POWER';
  }
  function canvasPoint(event) {
    const rect = canvas.getBoundingClientRect();
    return { x: (event.clientX - rect.left) * 1000 / rect.width, y: (event.clientY - rect.top) * 1000 / rect.height };
  }
  function pointerDown(event) {
    if (!game || game.moving || game.paused || game.completed || currentPlayer()?.isAI) return;
    const point = canvasPoint(event);
    const striker = game.striker;
    const distance = Math.hypot(point.x - striker.x, point.y - striker.y);
    if (distance <= 68 && Math.abs(point.y - striker.y) < 75) {
      game.aiming = true;
      game.placing = false;
      game.dragPoint = point;
      canvas.setPointerCapture?.(event.pointerId);
      updatePower(0);
      event.preventDefault();
    } else if (Math.abs(point.y - activeStrikerY()) < 65) {
      game.placing = true;
      game.aiming = false;
      striker.x = clamp(point.x, 190, 810);
      $('striker-position').value = striker.x;
      canvas.setPointerCapture?.(event.pointerId);
      event.preventDefault();
    }
  }
  function pointerMove(event) {
    if (!game || (!game.aiming && !game.placing)) return;
    const point = canvasPoint(event);
    if (game.aiming) {
      game.dragPoint = point;
      const power = Math.min(100, Math.round(Math.hypot(point.x - game.striker.x, point.y - game.striker.y) / 2));
      updatePower(power);
    } else if (game.placing) {
      game.striker.x = clamp(point.x, 190, 810);
      $('striker-position').value = game.striker.x;
    }
    event.preventDefault();
  }
  function pointerUp(event) {
    if (!game) return;
    if (game.aiming && game.dragPoint) {
      const dx = game.striker.x - game.dragPoint.x;
      const dy = game.striker.y - game.dragPoint.y;
      const distance = Math.hypot(dx, dy);
      if (distance > 12) {
        const force = Math.min(P.TABLE.maxSpeed, distance * 0.055);
        startShot(dx / distance * force, dy / distance * force);
      } else { game.aiming = false; game.dragPoint = null; updatePower(0); }
    }
    game.placing = false;
    game.aiming = false;
    game.dragPoint = null;
  }

  function roundedRect(context, x, y, w, h, radius) {
    const r = Math.min(radius, w / 2, h / 2);
    context.beginPath(); context.moveTo(x + r, y); context.arcTo(x + w, y, x + w, y + h, r);
    context.arcTo(x + w, y + h, x, y + h, r); context.arcTo(x, y + h, x, y, r); context.arcTo(x, y, x + w, y, r); context.closePath();
  }
  function drawBoard() {
    if (!game || !ctx) return;
    ctx.clearRect(0, 0, 1000, 1000);
    const palettes = {
      royal: { rail1: '#d3a35e', rail2: '#70451f', field1: '#dbb579', field2: '#b27b40', line: '#743e25', accent: '#b43f3b' },
      emerald: { rail1: '#c69c60', rail2: '#553a20', field1: '#43836a', field2: '#1f5948', line: '#f0d49d', accent: '#e7c78b' },
      midnight: { rail1: '#b58a49', rail2: '#382a1c', field1: '#3e414d', field2: '#252832', line: '#d6b979', accent: '#bc5853' }
    };
    const pal = palettes[game.arena] || palettes.royal;
    const rail = ctx.createLinearGradient(40, 40, 960, 960); rail.addColorStop(0, pal.rail1); rail.addColorStop(0.5, '#8b5c31'); rail.addColorStop(1, pal.rail2);
    ctx.fillStyle = '#1b1109'; ctx.fillRect(0, 0, 1000, 1000);
    ctx.shadowColor = '#0009'; ctx.shadowBlur = 35; ctx.shadowOffsetY = 18;
    roundedRect(ctx, 37, 37, 926, 926, 24); ctx.fillStyle = rail; ctx.fill();
    ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
    ctx.strokeStyle = '#f0d49a'; ctx.lineWidth = 5; roundedRect(ctx, 48, 48, 904, 904, 19); ctx.stroke();
    ctx.strokeStyle = '#5f391b'; ctx.lineWidth = 3; roundedRect(ctx, 71, 71, 858, 858, 12); ctx.stroke();
    const field = ctx.createLinearGradient(110, 100, 890, 900); field.addColorStop(0, pal.field1); field.addColorStop(1, pal.field2);
    roundedRect(ctx, 91, 91, 818, 818, 5); ctx.fillStyle = field; ctx.fill();
    // Subtle board grain.
    ctx.save(); roundedRect(ctx, 96, 96, 808, 808, 4); ctx.clip();
    for (let i = 0; i < 27; i++) {
      const y = 104 + i * 30;
      ctx.beginPath(); ctx.moveTo(100, y); ctx.bezierCurveTo(330, y - 7, 670, y + 7, 900, y - 2);
      ctx.strokeStyle = `rgba(55,28,11,${0.018 + (i % 4) * 0.006})`; ctx.lineWidth = 2; ctx.stroke();
    }
    ctx.restore();
    ctx.strokeStyle = pal.line; ctx.lineWidth = 6; ctx.strokeRect(116, 116, 768, 768);
    ctx.strokeStyle = pal.accent; ctx.lineWidth = 3;
    // Baselines and striker circles.
    [190, 810].forEach(y => {
      ctx.beginPath(); ctx.moveTo(190, y); ctx.lineTo(810, y); ctx.stroke();
      [235, 765].forEach(x => { ctx.beginPath(); ctx.arc(x, y, 27, 0, Math.PI * 2); ctx.stroke(); });
      ctx.beginPath(); ctx.arc(500, y, 54, 0, Math.PI * 2); ctx.stroke();
    });
    // Centre design.
    ctx.strokeStyle = pal.line; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(500, 500, 183, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(500, 500, 88, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(500, 500, 39, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = pal.accent; ctx.beginPath(); ctx.arc(500, 500, 8, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = `${pal.line}99`; ctx.lineWidth = 2;
    for (let i = 0; i < 8; i++) {
      const a = i * Math.PI / 4;
      ctx.beginPath(); ctx.moveTo(500 + Math.cos(a) * 95, 500 + Math.sin(a) * 95); ctx.lineTo(500 + Math.cos(a) * 168, 500 + Math.sin(a) * 168); ctx.stroke();
    }
    // Corner pocket mouths and gold lips.
    P.TABLE.pockets.forEach(p => {
      ctx.beginPath(); ctx.arc(p.x, p.y, 49, 0, Math.PI * 2); ctx.fillStyle = '#57361d'; ctx.fill();
      ctx.beginPath(); ctx.arc(p.x, p.y, 43, 0, Math.PI * 2); ctx.fillStyle = '#d7b777'; ctx.fill();
      ctx.beginPath(); ctx.arc(p.x, p.y, 36, 0, Math.PI * 2); const hole = ctx.createRadialGradient(p.x - 9, p.y - 9, 3, p.x, p.y, 38); hole.addColorStop(0, '#020202'); hole.addColorStop(1, '#16100b'); ctx.fillStyle = hole; ctx.fill();
    });
    game.coins.forEach(drawCoin);
    if (game.striker && !game.striker.pocketed) drawStriker(game.striker);
    if (game.aiming && game.dragPoint && profile.settings.guide) drawAimGuide();
  }
  function drawCoin(coin) {
    if (coin.pocketed) return;
    const x = coin.x, y = coin.y, r = coin.radius;
    ctx.save(); ctx.shadowColor = '#120b05a8'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 4;
    const isWhite = coin.colorId === 'white';
    let base = coin.colorId === 'queen' ? '#c73c3e' : isWhite ? '#f5ead0' : '#20222a';
    const g = ctx.createRadialGradient(x - r * .35, y - r * .4, 2, x, y, r * 1.2);
    g.addColorStop(0, isWhite ? '#fff9e9' : coin.colorId === 'queen' ? '#f57c73' : '#777b83');
    g.addColorStop(.48, base); g.addColorStop(1, isWhite ? '#b7a789' : coin.colorId === 'queen' ? '#772024' : '#08090d');
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill();
    ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
    const coinAccent = profile.selectedCoin === 'ruby' ? '#d44f58' : profile.selectedCoin === 'obsidian' ? '#a6b4c1' : '#e3c78f';
    ctx.strokeStyle = coinAccent; ctx.lineWidth = profile.selectedCoin === 'ivory' ? 1.5 : 2.5; ctx.beginPath(); ctx.arc(x, y, r - 3, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = isWhite ? '#7b694f88' : '#eee2ca66'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(x, y, r * .55, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }
  function drawStriker(striker) {
    const x = striker.x, y = striker.y, r = striker.radius;
    ctx.save(); ctx.shadowColor = '#100a05bb'; ctx.shadowBlur = 13; ctx.shadowOffsetY = 5;
    const g = ctx.createRadialGradient(x - 9, y - 10, 2, x, y, r * 1.2);
    g.addColorStop(0, '#fffef4'); g.addColorStop(.5, '#d0c6ae'); g.addColorStop(1, '#6a5b46');
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill();
    ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
    const ring = profile.selectedStriker === 'gold' ? '#f4d17d' : profile.selectedStriker === 'jade' ? '#54ae8d' : '#9e753e';
    ctx.strokeStyle = ring; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(x, y, r - 3, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = '#52422d'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(x, y, r * .57, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }
  function drawAimGuide() {
    const dx = game.striker.x - game.dragPoint.x;
    const dy = game.striker.y - game.dragPoint.y;
    const length = Math.hypot(dx, dy);
    if (length < 3) return;
    const ux = dx / length, uy = dy / length;
    const endX = game.striker.x + ux * 280, endY = game.striker.y + uy * 280;
    ctx.save(); ctx.setLineDash([12, 10]); ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(255,244,207,.84)';
    ctx.beginPath(); ctx.moveTo(game.striker.x + ux * 26, game.striker.y + uy * 26); ctx.lineTo(endX, endY); ctx.stroke();
    ctx.setLineDash([]); ctx.fillStyle = '#f5dfa5'; ctx.beginPath(); ctx.arc(endX, endY, 6, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
  function maybeCollisionSound(now) {
    if (!game || now - (game.lastCollisionSound || 0) < 145) return;
    const active = game.bodies.filter(b => !b.pocketed);
    for (let i = 0; i < active.length; i++) {
      for (let j = i + 1; j < active.length; j++) {
        const a = active[i], b = active[j];
        const distance = Math.hypot(b.x - a.x, b.y - a.y);
        const closing = Math.hypot(a.vx - b.vx, a.vy - b.vy);
        if (distance <= a.radius + b.radius + 1.5 && closing > 1.8) {
          game.lastCollisionSound = now;
          sfx('collision');
          return;
        }
      }
    }
  }
  function gameLoop(time) {
    if (!game) return;
    const delta = lastFrameTime ? Math.min((time - lastFrameTime) / 1000, 1 / 20) : 1 / 60;
    lastFrameTime = time;
    if (!game.paused && game.moving) {
      physicsAccumulator += Math.min(delta, 0.05);
      let steps = 0;
      while (physicsAccumulator >= FIXED_PHYSICS_STEP && steps < 3 && game.moving) {
        const pocketed = P.step(game.bodies, FIXED_PHYSICS_STEP);
        physicsAccumulator -= FIXED_PHYSICS_STEP;
        steps++;
        maybeCollisionSound(performance.now());
        if (pocketed.length && game.shotContext) {
          game.shotContext.pocketed.push(...pocketed);
          pocketed.forEach(item => { if (item.type === 'coin') sfx(item.colorId === 'queen' ? 'queen' : 'pocket'); });
        }
      }
      if (steps === 3 && physicsAccumulator > FIXED_PHYSICS_STEP * 3) physicsAccumulator = 0;
      if (P.allStopped(game.bodies) && performance.now() - game.lastShotAt > 130) finishShot();
    }
    drawBoard();
    animationId = requestAnimationFrame(gameLoop);
  }

  function sfx(kind) {
    if (!profile.settings.sound) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const audio = sfx.context || (sfx.context = new AudioCtx());
      if (audio.state === 'suspended') audio.resume();
      const presets = { strike: [170, .12, 'triangle'], collision: [235, .055, 'triangle'], pocket: [410, .11, 'sine'], queen: [680, .25, 'sine'], foul: [105, .18, 'sawtooth'], reward: [760, .22, 'sine'], win: [880, .32, 'triangle'] };
      const [frequency, duration, type] = presets[kind] || presets.strike;
      const osc = audio.createOscillator(), gain = audio.createGain();
      osc.type = type; osc.frequency.setValueAtTime(frequency, audio.currentTime);
      if (kind === 'win' || kind === 'reward' || kind === 'queen') osc.frequency.exponentialRampToValueAtTime(frequency * 1.45, audio.currentTime + duration);
      gain.gain.setValueAtTime(.0001, audio.currentTime); gain.gain.exponentialRampToValueAtTime(.13, audio.currentTime + .012); gain.gain.exponentialRampToValueAtTime(.0001, audio.currentTime + duration);
      osc.connect(gain); gain.connect(audio.destination); osc.start(); osc.stop(audio.currentTime + duration + .02);
    } catch (_) { /* Audio is optional; gameplay must still work if a browser blocks it. */ }
  }
  function startMusic() {
    if (!profile.settings.music) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      musicContext = musicContext || new AudioCtx();
      if (musicContext.state === 'suspended') musicContext.resume();
      if (musicNodes.length) return;
      [110, 164.81].forEach((freq, i) => {
        const osc = musicContext.createOscillator(), gain = musicContext.createGain();
        osc.type = 'sine'; osc.frequency.value = freq;
        gain.gain.value = i === 0 ? .012 : .007;
        osc.connect(gain); gain.connect(musicContext.destination); osc.start(); musicNodes.push({ osc, gain });
      });
    } catch (_) {}
  }
  function stopMusic() {
    musicNodes.forEach(n => { try { n.osc.stop(); } catch (_) {} });
    musicNodes = [];
  }
  function vibrate(pattern) {
    if (profile.settings.vibration && navigator.vibrate) navigator.vibrate(pattern);
  }
  function leaveGame() {
    clearTimeout(game?.aiTimer);
    game = null;
    $('pause-modal').hidden = true;
    $('result-modal').hidden = true;
    cancelAnimationFrame(animationId);
    showView('home-view');
  }
  function resumeGame() {
    if (!game) return;
    game.paused = false;
    $('pause-modal').hidden = true;
    if (currentPlayer()?.isAI && !game.moving) scheduleAiTurn();
  }
  function toggleSetting(key, value) {
    profile.settings[key] = value;
    saveProfile();
    if (key === 'music') value ? startMusic() : stopMusic();
    if (key === 'guide' && game) $('guide-state').textContent = value ? 'ON' : 'OFF';
    if (key === 'sound' && game) $('sound-state').textContent = value ? 'ON' : 'OFF';
  }
  function resetProgress() {
    stopMusic();
    profile = S.save(S.DEFAULT_PROFILE);
    showToast('Local progress reset. Your table is fresh again.');
    updateHome(); updateSettingsView(); renderRewards(); populateArenaSelect(); showView('home-view');
  }

  // Navigation and controls.
  document.addEventListener('click', event => {
    const viewButton = event.target.closest('[data-view]');
    if (viewButton) { showView(viewButton.dataset.view); return; }
    const modeButton = event.target.closest('[data-mode]');
    if (modeButton && !modeButton.classList.contains('mode-locked')) {
      selectedMode = modeButton.dataset.mode;
      document.querySelectorAll('.mode-card[data-mode]').forEach(card => card.classList.toggle('selected', card === modeButton));
      $('difficulty-block').style.opacity = selectedMode === 'ai' ? '1' : '.45';
      $('ai-difficulty').disabled = selectedMode !== 'ai';
      updatePlayerSetup();
      return;
    }
    const collectionButton = event.target.closest('[data-collection]');
    if (collectionButton) {
      selectedCollection = collectionButton.dataset.collection;
      document.querySelectorAll('.tab-button').forEach(tab => tab.classList.toggle('active', tab === collectionButton));
      renderCollection(); return;
    }
    const actionButton = event.target.closest('[data-action]');
    if (!actionButton) return;
    const action = actionButton.dataset.action;
    if (action === 'home') showView('home-view');
    else if (action === 'claim-daily') claimDaily();
    else if (action === 'vault-item') buyOrEquip(actionButton.dataset.kind, actionButton.dataset.id);
    else if (action === 'claim-mission') claimMission(actionButton.dataset.id);
    else if (action === 'save-name') {
      const name = $('player-name-input').value.trim().slice(0, 18);
      if (name.length < 2) { showToast('Please enter a name with at least 2 characters.'); return; }
      profile.playerName = name; saveProfile(); updateProfileView(); updateHome(); showToast('Player name saved.');
    } else if (action === 'pause') { if (game) { game.paused = true; $('pause-modal').hidden = false; } }
    else if (action === 'resume') resumeGame();
    else if (action === 'leave-game' || action === 'home-result') leaveGame();
    else if (action === 'rematch') { $('result-modal').hidden = true; beginMatch(); }
    else if (action === 'reset-shot') { if (game && !game.moving) { game.aiming = false; game.dragPoint = null; updatePower(0); drawBoard(); } }
    else if (action === 'guide-toggle') { toggleSetting('guide', !profile.settings.guide); $('guide-state').textContent = profile.settings.guide ? 'ON' : 'OFF'; }
    else if (action === 'sound-toggle') { toggleSetting('sound', !profile.settings.sound); $('sound-state').textContent = profile.settings.sound ? 'ON' : 'OFF'; }
    else if (action === 'rotate-left' && game && !game.moving && !currentPlayer()?.isAI) { game.striker.x = clamp(game.striker.x - 35, 190, 810); $('striker-position').value = game.striker.x; drawBoard(); }
    else if (action === 'rotate-right' && game && !game.moving && !currentPlayer()?.isAI) { game.striker.x = clamp(game.striker.x + 35, 190, 810); $('striker-position').value = game.striker.x; drawBoard(); }
    else if (action === 'reset-progress') $('confirm-modal').hidden = false;
    else if (action === 'confirm-reset') { $('confirm-modal').hidden = true; resetProgress(); }
    else if (action === 'cancel-reset') $('confirm-modal').hidden = true;
  });
  $('start-match').addEventListener('click', beginMatch);
  $('striker-position').addEventListener('input', event => {
    if (game && !game.moving && !currentPlayer()?.isAI) { game.striker.x = Number(event.target.value); drawBoard(); }
  });
  [['setting-sound', 'sound'], ['setting-music', 'music'], ['setting-vibration', 'vibration'], ['setting-guide', 'guide']].forEach(([id, key]) => {
    $(id).addEventListener('change', event => toggleSetting(key, event.target.checked));
  });
  canvas.addEventListener('pointerdown', pointerDown);
  canvas.addEventListener('pointermove', pointerMove);
  canvas.addEventListener('pointerup', pointerUp);
  canvas.addEventListener('pointercancel', pointerUp);
  $('arena-select').addEventListener('change', event => { profile.selectedBoard = event.target.value; saveProfile(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden && game && !game.completed) { game.paused = true; $('pause-modal').hidden = false; } });

  // Initial screen state.
  $('ai-difficulty').disabled = false;
  updateHome(); updateProfileView(); updateSettingsView(); populateArenaSelect(); updatePlayerSetup(); renderRewards();
  if (profile.settings.music) document.addEventListener('pointerdown', startMusic, { once: true });
})();
