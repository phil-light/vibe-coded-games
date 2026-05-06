const GAME_CONFIG = {
  title:        'ULTRIS',
  storageKey:   'vcg_ultris_v1',
  canvasWidth:  720,
  canvasHeight: 480,
  subtitle:     'Match-3 Tetris with explosive red tiles',
  background:   'grid',
  controls: [
    '== Controls ==',
    '← →            Move',
    '↓              Soft drop',
    '↑              Rotate',
    'Space          Hard drop',
    'C              Hold piece',
    '1-5 or click   Use power-up',
    '',
    '== How to Play ==',
    'Match 3+ same-color tiles to clear them',
    '3+ adjacent RED tiles BOOM in a 3-tile radius',
    'Match 3+ U tiles = a random power-up',
    'Or blast 3+ U tiles at once — same reward',
    'H tiles look like U but only blasts destroy them',
    'Every 5th power-up (then every 10th) is ULTRIS EXPLODE',
    'Power-up inventory caps at 5; a 6th auto-fires the oldest',
    'Top out and ALL stored power-ups fire to save you',
    '',
    '== Tips ==',
    'Land a piece within 2s of a clear to chain combos',
    'Hold (C) to bank tricky pieces for later',
    'Convert turns a color into U tiles — set up big clears',
    'Garbage rows push up from level 2',
    'H tiles arrive at level 10',
  ],
  theme: 'neon',
};

// ----- Grid layout -----
const COLS = 10;
const ROWS = 20;
const CELL = 22;
const PFX = 60;
const PFY = 30;

// ----- Tile colors -----
const C_EMPTY  = 0;
const C_BLUE   = 1;
const C_YELLOW = 2;
const C_GREEN  = 3;
const C_PURPLE = 4;
const C_RED    = 5;
const C_ULTRIS = 6;
const C_HARD   = 7;          // looks identical to ULTRIS — only blasts destroy them
const HEX = {
  1: '#3da9fc',
  2: '#ffd166',
  3: '#06d6a0',
  4: '#c77dff',
  5: '#ef476f',
  6: '#7d8ca8',
  7: '#7d8ca8',
};
const COLOR_NAMES = {
  1: 'BLUE',
  2: 'YELLOW',
  3: 'GREEN',
  4: 'PURPLE',
  5: 'RED',
};

// ----- Tuning -----
const MATCH_MIN = 3;
const RED_MIN = 3;
const ULTRIS_BLAST_MIN = 3;
const BLAST_RADIUS = 3;
const RESOLVE_DELAY = 220;
const TILES_PER_LEVEL = 100;
const MOVE_INITIAL = 180;
const MOVE_REPEAT = 80;
const BOOM_DURATION = 700;
const CELEBRATE_DURATION = 3500;
const CHAIN_POPUP_DURATION = 1100;
const CHAIN_CARRY_WINDOW = 2000;
const RED_RATE = 0.10;
const GARBAGE_BASE_INTERVAL = 45000;
const GARBAGE_MIN_INTERVAL = 5000;
const LOCK_DELAY = 500;
const MAX_LOCK_RESETS = 15;
const BASE_DROP_INTERVAL = 700;
const DROP_PER_LEVEL = 50;
const MIN_DROP_INTERVAL = 100;
const ULTRIS_FLASH_DURATION = 380;
const ULTRIS_STEP_INTERVAL = 50;
const MAX_POWERUPS = 5;
const ULTRIS_EXPLODE_FIRST = 5;
const ULTRIS_EXPLODE_INTERVAL = 10;
const ULTRIS_BASE_RATE = 0.05;
const ULTRIS_RATE_PER_LEVEL = 0.01;
const ULTRIS_MAX_RATE = 0.10;
// Hard tiles: visually identical to ULTRIS but cannot be color-matched.
const HARD_START_LEVEL    = 10;
const HARD_BASE_RATE      = 0.01;
const HARD_RATE_PER_LEVEL = 0.014;
const HARD_MAX_RATE       = 0.20;
const POWERUP_FANFARE_DURATION = 1400;
const BOOM_STEP_INTERVAL = 30;
const CONVERT_STEP_INTERVAL = 25;
const BOOM_FLASH_DURATION = 220;
const BOOM_FLASH_COLOR = [255, 220, 80];
const CONVERT_FLASH_COLOR = [125, 200, 240];
const LIFE_SAVE_DURATION = 1500;

const POWERUP_TYPES = [
  'EXPLODE_REDS',
  'EXPLODE_COLOR',
  'EXPLODE_BOTTOM',
  'EXPLODE_RANDOM',
  'CONVERT_COLOR',
];

const POWERUP_WEIGHTS = {
  'EXPLODE_REDS':   2,
  'EXPLODE_COLOR':  2,
  'EXPLODE_BOTTOM': 2,
  'EXPLODE_RANDOM': 2,
  'CONVERT_COLOR':  1,
};

// ----- Tetromino shapes -----
const SHAPES = [
  [[0,0],[1,0],[2,0],[3,0]],
  [[0,0],[1,0],[0,1],[1,1]],
  [[1,0],[0,1],[1,1],[2,1]],
  [[1,0],[2,0],[0,1],[1,1]],
  [[0,0],[1,0],[1,1],[2,1]],
  [[0,0],[0,1],[1,1],[2,1]],
  [[2,0],[0,1],[1,1],[2,1]],
];

// ----- State -----
let grid;
let current;
let nextPiece;
let heldPiece = null;
let canHold = true;
let dropTimer = 0;
let dropInterval = BASE_DROP_INTERVAL;
let level = 1;
let tilesCleared = 0;
let resolving = false;
let resolveTimer = 0;
let resolveTriggeredBy = 'lock';
let leftHold = 0;
let rightHold = 0;
let boomTimer = 0;
let celebrating = false;
let celebrateTimer = 0;
let celebrateLevel = 1;
let celebrateChanges = [];
let chainCount = 0;
let chainPopupTimer = 0;
let chainPopupValue = 0;
let chainCarryTimer = 0;
let chainStartValue = 0;
let chainToneOn = false;
let garbageTimer = 0;
let groundedTimer = 0;
let lockResets = 0;
let powerups = [];
let powerupsEarned = 0;
let pendingAutoPowerups = [];
let pendingAfterAutoFire = null;
let lifeSaveTimer = 0;
let ultrisFlash = [];
let ultrisActive = false;
let ultrisStepTimer = 0;
let powerupFanfare = null;
let pendingFanfareData = null;
let boomSequence = null;
let boomFlash = [];

function dropIntervalForLevel(lv) {
  return max(MIN_DROP_INTERVAL, BASE_DROP_INTERVAL - (lv - 1) * DROP_PER_LEVEL);
}

function ultrisRate(lv) {
  if (lv === undefined) lv = level;
  if (lv < 1) return 0;
  return min(ULTRIS_MAX_RATE, ULTRIS_BASE_RATE + ULTRIS_RATE_PER_LEVEL * (lv - 1));
}

function hardRate(lv) {
  if (lv === undefined) lv = level;
  if (lv < HARD_START_LEVEL) return 0;
  return min(HARD_MAX_RATE, HARD_BASE_RATE + HARD_RATE_PER_LEVEL * (lv - HARD_START_LEVEL));
}

function getGarbageInterval(lv) {
  if (lv === undefined) lv = level;
  if (lv < 2) return Infinity;
  const dropAmount = 5000 * floor((lv - 2) / 2);
  return max(GARBAGE_MIN_INTERVAL, GARBAGE_BASE_INTERVAL - dropAmount);
}

function getUltrisProgress() {
  if (powerupsEarned < ULTRIS_EXPLODE_FIRST) {
    return {
      remaining: ULTRIS_EXPLODE_FIRST - powerupsEarned,
      cycleSize: ULTRIS_EXPLODE_FIRST,
      progressed: powerupsEarned,
    };
  }
  const offset = (powerupsEarned - ULTRIS_EXPLODE_FIRST) % ULTRIS_EXPLODE_INTERVAL;
  return {
    remaining: ULTRIS_EXPLODE_INTERVAL - offset,
    cycleSize: ULTRIS_EXPLODE_INTERVAL,
    progressed: offset,
  };
}

function pickWeightedPowerupType() {
  let total = 0;
  for (const t of POWERUP_TYPES) total += POWERUP_WEIGHTS[t];
  let r = random(total);
  for (const t of POWERUP_TYPES) {
    r -= POWERUP_WEIGHTS[t];
    if (r <= 0) return t;
  }
  return POWERUP_TYPES[0];
}

function pickColor() {
  const ult = ultrisRate();
  const hrd = hardRate();
  const matchEach = (1 - RED_RATE - ult - hrd) / 4;
  const r = random();
  let acc = 0;
  acc += matchEach; if (r < acc) return C_BLUE;
  acc += matchEach; if (r < acc) return C_YELLOW;
  acc += matchEach; if (r < acc) return C_GREEN;
  acc += matchEach; if (r < acc) return C_PURPLE;
  acc += RED_RATE;  if (r < acc) return C_RED;
  acc += ult;       if (r < acc) return C_ULTRIS;
  return C_HARD;
}

function pickGarbageColor() {
  let c;
  do { c = pickColor(); } while (c === C_RED || c === C_ULTRIS || c === C_HARD);
  return c;
}

function getLevelUpChanges(newLevel) {
  const changes = [];
  const oldLevel = newLevel - 1;
  if (dropIntervalForLevel(newLevel) < dropIntervalForLevel(oldLevel)) {
    changes.push('Pieces fall faster');
  }
  if (newLevel === 2) {
    changes.push(`Garbage rows: a new row every ${GARBAGE_BASE_INTERVAL/1000} seconds`);
  } else if (newLevel >= 3) {
    const oldInt = getGarbageInterval(oldLevel);
    const newInt = getGarbageInterval(newLevel);
    if (oldInt !== Infinity && newInt < oldInt) {
      changes.push(`Garbage rows now every ${newInt/1000} seconds`);
    }
  }
  const oldRate = ultrisRate(oldLevel);
  const newRate = ultrisRate(newLevel);
  if (newRate > oldRate) {
    changes.push(`ULTRIS tiles now ${(newRate*100).toFixed(0)}% of all blocks`);
  }
  if (newLevel === HARD_START_LEVEL) {
    changes.push('HARD tiles appear — look like ULTRIS, only blasts destroy them');
  } else if (newLevel > HARD_START_LEVEL) {
    const oldHard = hardRate(oldLevel);
    const newHard = hardRate(newLevel);
    if (newHard > oldHard) {
      changes.push(`Hard tiles now ${(newHard*100).toFixed(0)}% of all blocks`);
    }
  }
  if (changes.length === 0) {
    changes.push('No new mechanics — keep your streak alive!');
  }
  return changes;
}

function newPiece() {
  const shapeIdx = floor(random(SHAPES.length));
  const shape = SHAPES[shapeIdx].map(c => [c[0], c[1]]);
  const colors = shape.map(() => pickColor());
  return { shape, colors, shapeIdx, x: 0, y: 0 };
}

function placePieceAtSpawn(p) {
  let mx = 0;
  for (const [x] of p.shape) mx = max(mx, x);
  p.x = floor((COLS - mx - 1) / 2);
  p.y = 0;
}

function resetPieceState() {
  groundedTimer = 0;
  lockResets = 0;
  dropTimer = 0;
}

function tryLifeSave(after) {
  if (powerups.length === 0) return false;
  while (powerups.length > 0) pendingAutoPowerups.push(powerups.shift());
  pendingAfterAutoFire = after || null;
  lifeSaveTimer = LIFE_SAVE_DURATION;
  popupText('LIFE SAVED!', PFX + COLS*CELL/2, PFY + ROWS*CELL/2 - 90, getTheme().accent);
  popupText(`Auto-firing ${pendingAutoPowerups.length} power-ups`,
            PFX + COLS*CELL/2, PFY + ROWS*CELL/2 - 60, getTheme().muted);
  playSfx('highScore');
  playSfx('confirm');
  playSfx('laser');
  screenShake(20, 600);
  // Fire first powerup synchronously so we enter boom state immediately
  // (prevents one frame where the invalid piece would otherwise be drawn)
  const p = pendingAutoPowerups.shift();
  firePowerup(p);
  return true;
}

function spawnNextPiece() {
  current = nextPiece;
  placePieceAtSpawn(current);
  nextPiece = newPiece();
  resetPieceState();
  if (!valid(current, 0, 0)) {
    if (tryLifeSave(() => {
      if (!valid(current, 0, 0)) endGame();
    })) return;
    endGame();
  }
}

function tryHold() {
  if (!canHold || resolving || celebrating || ultrisActive || boomSequence) return;
  if (heldPiece === null) {
    heldPiece = { shapeIdx: current.shapeIdx, colors: current.colors.slice() };
    spawnNextPiece();
  } else {
    const old = heldPiece;
    heldPiece = { shapeIdx: current.shapeIdx, colors: current.colors.slice() };
    const freshShape = SHAPES[old.shapeIdx].map(c => [c[0], c[1]]);
    current = { shape: freshShape, colors: old.colors, shapeIdx: old.shapeIdx, x: 0, y: 0 };
    placePieceAtSpawn(current);
    resetPieceState();
    if (!valid(current, 0, 0)) {
      if (tryLifeSave(() => {
        if (!valid(current, 0, 0)) endGame();
      })) { canHold = false; return; }
      endGame();
      return;
    }
  }
  canHold = false;
  playSfx('menu');
}

function valid(p, dx, dy, shape) {
  const s = shape || p.shape;
  for (const [cx, cy] of s) {
    const nx = p.x + cx + dx;
    const ny = p.y + cy + dy;
    if (nx < 0 || nx >= COLS || ny >= ROWS) return false;
    if (ny >= 0 && grid[ny][nx] !== C_EMPTY) return false;
  }
  return true;
}

function rotated(p) {
  let mx = 0;
  for (const [x] of p.shape) mx = max(mx, x);
  return p.shape.map(([x, y]) => [y, mx - x]);
}

function tryRotate() {
  const ns = rotated(current);
  for (const dx of [0, -1, 1, -2, 2]) {
    if (valid(current, dx, 0, ns)) {
      current.x += dx;
      current.shape = ns;
      playSfx('menu');
      bumpLockDelay();
      return;
    }
  }
}

function bumpLockDelay() {
  if (groundedTimer > 0 && lockResets < MAX_LOCK_RESETS) {
    groundedTimer = 0;
    lockResets++;
  }
}

function startResolve(triggeredBy) {
  if (chainCarryTimer <= 0) chainCount = 0;
  chainStartValue = chainCount;
  resolveTriggeredBy = triggeredBy;
  resolving = true;
  resolveTimer = RESOLVE_DELAY;
}

function lockPiece() {
  let topOut = false;
  for (let i = 0; i < current.shape.length; i++) {
    const [cx, cy] = current.shape[i];
    const nx = current.x + cx;
    const ny = current.y + cy;
    if (ny < 0) { topOut = true; continue; }
    grid[ny][nx] = current.colors[i];
  }
  playSfx('confirm');
  if (topOut) {
    if (tryLifeSave(spawnNextPiece)) {
      canHold = true;
      return;
    }
    endGame();
    return;
  }
  canHold = true;
  startResolve('lock');
}

function addGarbageRow() {
  for (let x = 0; x < COLS; x++) {
    if (grid[0][x] !== C_EMPTY) {
      if (tryLifeSave(() => {
        // After life save, recheck — if still pinned to top, end run
        for (let xx = 0; xx < COLS; xx++) {
          if (grid[0][xx] !== C_EMPTY) { endGame(); return; }
        }
      })) return;
      endGame();
      return;
    }
  }
  for (let y = 0; y < ROWS - 1; y++) {
    for (let x = 0; x < COLS; x++) {
      grid[y][x] = grid[y + 1][x];
    }
  }
  for (let x = 0; x < COLS; x++) {
    grid[ROWS - 1][x] = pickGarbageColor();
  }
  if (current) {
    current.y -= 1;
    if (!valid(current, 0, 0)) {
      if (tryLifeSave(() => {
        if (!valid(current, 0, 0)) endGame();
      })) return;
      endGame();
      return;
    }
  }
  screenShake(10, 250);
  playSfx('miss');
  popupText('PUSH UP!', PFX + COLS*CELL/2, PFY + ROWS*CELL/2 + 10, getTheme().muted);
  startResolve('garbage');
}

function findComponents() {
  const seen = Array.from({length: ROWS}, () => Array(COLS).fill(false));
  const out = [];
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (seen[y][x] || grid[y][x] === C_EMPTY) continue;
      const c = grid[y][x];
      const cells = [];
      const stack = [[x, y]];
      while (stack.length) {
        const [cx, cy] = stack.pop();
        if (cx < 0 || cx >= COLS || cy < 0 || cy >= ROWS) continue;
        if (seen[cy][cx] || grid[cy][cx] !== c) continue;
        seen[cy][cx] = true;
        cells.push([cx, cy]);
        stack.push([cx+1, cy], [cx-1, cy], [cx, cy+1], [cx, cy-1]);
      }
      out.push({ color: c, cells });
    }
  }
  return out;
}

function applyGravity() {
  for (let x = 0; x < COLS; x++) {
    let writeY = ROWS - 1;
    for (let y = ROWS - 1; y >= 0; y--) {
      if (grid[y][x] !== C_EMPTY) {
        const v = grid[y][x];
        if (writeY !== y) {
          grid[writeY][x] = v;
          grid[y][x] = C_EMPTY;
        }
        writeY--;
      }
    }
  }
}

function maybeShowChainPopup() {
  if (chainCount >= 2) {
    chainPopupTimer = CHAIN_POPUP_DURATION;
    chainPopupValue = chainCount;
    if (chainCount >= 3) {
      screenShake(8 + chainCount * 2, 250);
      playSfx('highScore');
    } else {
      playSfx('confirm');
    }
  }
}

function tickLevelUpCheck(removedCount) {
  tilesCleared += removedCount;
  while (tilesCleared >= TILES_PER_LEVEL) {
    tilesCleared -= TILES_PER_LEVEL;
    level++;
    dropInterval = dropIntervalForLevel(level);
    celebrating = true;
    celebrateTimer = CELEBRATE_DURATION;
    celebrateLevel = level;
    celebrateChanges = getLevelUpChanges(level);
    playSfx('highScore');
  }
}

function startBoomSequence(cells, onComplete, options) {
  if (!cells || cells.size === 0) {
    if (onComplete) onComplete();
    return;
  }
  options = options || {};
  const arr = Array.from(cells);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = floor(random(i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  boomSequence = {
    cells: arr,
    index: 0,
    timer: 0,
    stepInterval: options.stepInterval || BOOM_STEP_INTERVAL,
    sfxEach: options.sfxEach !== undefined ? options.sfxEach : 'menu',
    shakeEach: options.shakeEach !== undefined ? options.shakeEach : 2,
    action: options.action || 'remove',
    convertTo: options.convertTo,
    flashColor: options.flashColor || BOOM_FLASH_COLOR,
    onComplete: onComplete,
  };
}

function tickBoomSequence() {
  boomSequence.timer += deltaTime;
  if (boomSequence.timer < boomSequence.stepInterval) return;
  boomSequence.timer = 0;

  if (boomSequence.index >= boomSequence.cells.length) {
    const cb = boomSequence.onComplete;
    boomSequence = null;
    if (cb) cb();
    return;
  }

  const idx = boomSequence.cells[boomSequence.index++];
  const x = idx % COLS, y = floor(idx / COLS);
  if (boomSequence.action === 'convert') {
    if (grid[y][x] !== C_EMPTY) {
      grid[y][x] = boomSequence.convertTo;
      boomFlash.push({ x, y, timer: BOOM_FLASH_DURATION, color: boomSequence.flashColor });
    }
  } else {
    if (grid[y][x] !== C_EMPTY) {
      grid[y][x] = C_EMPTY;
      boomFlash.push({ x, y, timer: BOOM_FLASH_DURATION, color: boomSequence.flashColor });
    }
  }
  if (boomSequence.shakeEach > 0) screenShake(boomSequence.shakeEach, 50);
  if (boomSequence.sfxEach) playSfx(boomSequence.sfxEach);
}

function resolveStep() {
  const comps = findComponents();
  const remove = new Set();
  const matchedUltris = new Set();
  const blastedUltris = new Set();
  let exploded = false;
  let ultrisMatched = false;

  for (const c of comps) {
    if (c.color === C_RED) {
      if (c.cells.length >= RED_MIN) {
        exploded = true;
        for (const [cx, cy] of c.cells) {
          for (let dy = -BLAST_RADIUS; dy <= BLAST_RADIUS; dy++) {
            for (let dx = -BLAST_RADIUS; dx <= BLAST_RADIUS; dx++) {
              const nx = cx + dx, ny = cy + dy;
              if (nx >= 0 && nx < COLS && ny >= 0 && ny < ROWS) {
                const idx = ny * COLS + nx;
                if (grid[ny][nx] === C_ULTRIS) blastedUltris.add(idx);
                remove.add(idx);
              }
            }
          }
        }
      }
    } else if (c.color === C_ULTRIS) {
      if (c.cells.length >= MATCH_MIN) {
        ultrisMatched = true;
        grantRandomPowerup();
        for (const [cx, cy] of c.cells) {
          const idx = cy * COLS + cx;
          matchedUltris.add(idx);
          remove.add(idx);
          ultrisFlash.push({ x: cx, y: cy, timer: ULTRIS_FLASH_DURATION });
        }
      }
    } else if (c.color === C_HARD) {
      // Hard tiles cannot be matched by color — only blasts destroy them.
    } else if (c.cells.length >= MATCH_MIN) {
      for (const [cx, cy] of c.cells) remove.add(cy * COLS + cx);
    }
  }

  let blastOnlyUltris = 0;
  for (const idx of blastedUltris) {
    if (!matchedUltris.has(idx)) blastOnlyUltris++;
  }
  if (blastOnlyUltris >= ULTRIS_BLAST_MIN) {
    grantRandomPowerup();
  }

  if (remove.size === 0) return false;
  chainCount++;

  const removedCount = remove.size;

  const basePer = exploded ? 25 : (ultrisMatched ? 20 : 10);
  const points = removedCount * basePer * chainCount;
  addScore(points);

  const popupLabel = chainCount > 1 ? `+${points}  (x${chainCount})` : `+${points}`;
  if (exploded) {
    boomTimer = BOOM_DURATION;
    screenShake(28, 700);
    playSfx('lose');
    playSfx('laser');
    popupText(popupLabel, PFX + COLS*CELL/2, PFY + ROWS*CELL/2 + 50, HEX[C_RED]);
  } else if (ultrisMatched) {
    screenShake(10, 300);
    playSfx('highScore');
    popupText(popupLabel, PFX + COLS*CELL/2, PFY + ROWS*CELL/2 - 20, HEX[C_ULTRIS]);
  } else {
    screenShake(4 + chainCount, 150 + chainCount * 30);
    playSfx('score');
    popupText(popupLabel, PFX + COLS*CELL/2, PFY + ROWS*CELL/2 - 20, HEX[C_BLUE]);
  }

  maybeShowChainPopup();

  if (exploded) {
    // Defer level-up until after the boom sequence finishes
    startBoomSequence(remove, () => {
      applyGravity();
      tickLevelUpCheck(removedCount);
    }, {
      stepInterval: BOOM_STEP_INTERVAL,
      sfxEach: 'menu',
      shakeEach: 2,
    });
  } else {
    for (const idx of remove) {
      const x = idx % COLS, y = floor(idx / COLS);
      grid[y][x] = C_EMPTY;
    }
    applyGravity();
    tickLevelUpCheck(removedCount);
  }

  return true;
}

function triggerPowerupFanfare(p) {
  powerupFanfare = {
    timer: POWERUP_FANFARE_DURATION,
    label: getPowerupLabel(p),
    type: p.type,
    color: p.color,
  };
  if (p.type === 'ULTRIS_EXPLODE') {
    playSfx('highScore');
    playSfx('lose');
    playSfx('laser');
    playSfx('confirm');
    screenShake(20, 500);
  } else {
    playSfx('highScore');
    playSfx('confirm');
    playSfx('menu');
    screenShake(8, 250);
  }
}

function grantRandomPowerup() {
  const willBeUltris = getUltrisProgress().remaining === 1;
  let type;
  if (willBeUltris) {
    type = 'ULTRIS_EXPLODE';
  } else {
    type = pickWeightedPowerupType();
  }
  const p = { type };
  if (type === 'EXPLODE_COLOR' || type === 'CONVERT_COLOR') {
    const colors = [C_BLUE, C_YELLOW, C_GREEN, C_PURPLE];
    p.color = colors[floor(random(colors.length))];
  }

  if (powerups.length >= MAX_POWERUPS) {
    const evicted = powerups.shift();
    pendingAutoPowerups.push(evicted);
    popupText(`AUTO-FIRE: ${getPowerupLabel(evicted)}`,
              PFX + COLS*CELL/2, PFY + ROWS*CELL - 40, getTheme().accent);
  }

  powerups.push(p);
  powerupsEarned++;
  triggerPowerupFanfare(p);
}

function getPowerupLabel(p) {
  switch (p.type) {
    case 'EXPLODE_REDS':    return 'Boom all REDS';
    case 'EXPLODE_COLOR':   return `Boom all ${COLOR_NAMES[p.color]}`;
    case 'EXPLODE_BOTTOM':  return 'Boom bottom row';
    case 'EXPLODE_RANDOM':  return 'Boom 8 random';
    case 'CONVERT_COLOR':   return `${COLOR_NAMES[p.color]} → ULTRIS`;
    case 'ULTRIS_EXPLODE':  return 'ULTRIS EXPLODE!';
  }
  return '?';
}

function firePowerup(p) {
  switch (p.type) {
    case 'EXPLODE_REDS':    explodeAllReds(); break;
    case 'EXPLODE_COLOR':   explodeAllOfColor(p.color); break;
    case 'EXPLODE_BOTTOM':  explodeBottomRow(); break;
    case 'EXPLODE_RANDOM':  explodeRandomTiles(8); break;
    case 'CONVERT_COLOR':   convertColorToUltris(p.color); break;
    case 'ULTRIS_EXPLODE':  startUltrisExplode(); break;
  }
}

function applyPowerupRemoval(cellsSet, opts) {
  if (cellsSet.size === 0) return false;

  let ultrisExploded = 0;
  for (const idx of cellsSet) {
    const x = idx % COLS, y = floor(idx / COLS);
    if (grid[y][x] === C_ULTRIS) ultrisExploded++;
  }
  if (ultrisExploded >= ULTRIS_BLAST_MIN) {
    grantRandomPowerup();
  }

  if (chainCarryTimer <= 0) chainCount = 0;
  chainStartValue = chainCount;
  chainCount++;

  const removedCount = cellsSet.size;
  const points = removedCount * (opts.scorePerTile || 15) * chainCount;
  addScore(points);

  const label = chainCount > 1 ? `+${points} (x${chainCount})` : `+${points}`;
  popupText(label, PFX + COLS*CELL/2, PFY + ROWS*CELL/2,
            opts.popupColor || getTheme().accent);

  if (opts.boom) {
    boomTimer = BOOM_DURATION;
    playSfx('lose');
    if (opts.layerSfx) playSfx(opts.layerSfx);
  } else {
    if (opts.sfx) playSfx(opts.sfx);
    if (opts.layerSfx) playSfx(opts.layerSfx);
  }
  screenShake(opts.shake || 8, opts.shakeDuration || 250);

  startBoomSequence(cellsSet, () => {
    applyGravity();
    tickLevelUpCheck(removedCount);
    resolveTriggeredBy = 'powerup';
    resolving = true;
    resolveTimer = RESOLVE_DELAY;
  }, {
    stepInterval: opts.stepInterval || BOOM_STEP_INTERVAL,
    sfxEach: opts.sfxEach !== undefined ? opts.sfxEach : 'menu',
    shakeEach: 2,
  });

  maybeShowChainPopup();
  return true;
}

function explodeAllReds() {
  const cells = new Set();
  let hadRed = false;
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (grid[y][x] === C_RED) {
        hadRed = true;
        for (let dy = -BLAST_RADIUS; dy <= BLAST_RADIUS; dy++) {
          for (let dx = -BLAST_RADIUS; dx <= BLAST_RADIUS; dx++) {
            const nx = x + dx, ny = y + dy;
            if (nx >= 0 && nx < COLS && ny >= 0 && ny < ROWS) {
              cells.add(ny * COLS + nx);
            }
          }
        }
      }
    }
  }
  if (!hadRed) {
    popupText('No REDS on board', PFX + COLS*CELL/2, PFY + ROWS*CELL/2, getTheme().muted);
    return;
  }
  applyPowerupRemoval(cells, {
    scorePerTile: 25, popupColor: HEX[C_RED],
    boom: true, layerSfx: 'laser', shake: 30, shakeDuration: 800,
  });
}

function explodeAllOfColor(targetColor) {
  const cells = new Set();
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (grid[y][x] === targetColor) cells.add(y * COLS + x);
    }
  }
  if (cells.size === 0) {
    popupText(`No ${COLOR_NAMES[targetColor]} on board`, PFX + COLS*CELL/2, PFY + ROWS*CELL/2, getTheme().muted);
    return;
  }
  applyPowerupRemoval(cells, {
    scorePerTile: 12, popupColor: HEX[targetColor],
    sfx: 'lose', layerSfx: 'laser', shake: 12, shakeDuration: 350,
  });
}

function explodeBottomRow() {
  const cells = new Set();
  for (let x = 0; x < COLS; x++) {
    if (grid[ROWS - 1][x] !== C_EMPTY) cells.add((ROWS - 1) * COLS + x);
  }
  if (cells.size === 0) {
    popupText('Bottom row empty', PFX + COLS*CELL/2, PFY + ROWS*CELL/2, getTheme().muted);
    return;
  }
  applyPowerupRemoval(cells, {
    scorePerTile: 15, popupColor: getTheme().accent,
    sfx: 'lose', layerSfx: 'laser', shake: 14, shakeDuration: 400,
  });
}

function explodeRandomTiles(n) {
  const all = [];
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (grid[y][x] !== C_EMPTY) all.push(y * COLS + x);
    }
  }
  if (all.length === 0) {
    popupText('Board empty', PFX + COLS*CELL/2, PFY + ROWS*CELL/2, getTheme().muted);
    return;
  }
  for (let i = all.length - 1; i > 0; i--) {
    const j = floor(random(i + 1));
    [all[i], all[j]] = [all[j], all[i]];
  }
  const cells = new Set();
  for (let i = 0; i < min(n, all.length); i++) cells.add(all[i]);
  applyPowerupRemoval(cells, {
    scorePerTile: 18, popupColor: getTheme().accent,
    sfx: 'lose', layerSfx: 'laser', shake: 12, shakeDuration: 350,
  });
}

function convertColorToUltris(targetColor) {
  const cells = new Set();
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (grid[y][x] === targetColor) cells.add(y * COLS + x);
    }
  }
  if (cells.size === 0) {
    popupText(`No ${COLOR_NAMES[targetColor]} on board`, PFX + COLS*CELL/2, PFY + ROWS*CELL/2, getTheme().muted);
    return;
  }

  if (chainCarryTimer <= 0) chainCount = 0;
  chainStartValue = chainCount;

  const points = cells.size * 5;
  addScore(points);
  popupText(`${cells.size} → ULTRIS!  +${points}`, PFX + COLS*CELL/2, PFY + ROWS*CELL/2 - 30, HEX[C_ULTRIS]);
  playSfx('confirm');
  playSfx('highScore');
  screenShake(8, 300);

  startBoomSequence(cells, () => {
    resolveTriggeredBy = 'powerup';
    resolving = true;
    resolveTimer = RESOLVE_DELAY;
  }, {
    action: 'convert',
    convertTo: C_ULTRIS,
    stepInterval: CONVERT_STEP_INTERVAL,
    sfxEach: 'menu',
    shakeEach: 1,
    flashColor: CONVERT_FLASH_COLOR,
  });
}

function startUltrisExplode() {
  let hasTiles = false;
  for (let y = 0; y < ROWS && !hasTiles; y++) {
    for (let x = 0; x < COLS; x++) {
      if (grid[y][x] !== C_EMPTY) { hasTiles = true; break; }
    }
  }
  if (!hasTiles) {
    popupText('Board empty', PFX + COLS*CELL/2, PFY + ROWS*CELL/2, getTheme().muted);
    return;
  }
  if (chainCarryTimer <= 0) chainCount = 0;
  chainStartValue = chainCount;
  chainCount++;
  ultrisActive = true;
  ultrisStepTimer = 0;
  popupText('ULTRIS EXPLODE!', PFX + COLS*CELL/2, PFY + 80, getTheme().accent);
  playSfx('highScore');
  playSfx('lose');
  playSfx('laser');
  screenShake(20, 500);
}

function ultrisStep() {
  ultrisStepTimer = 0;
  const tiles = [];
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (grid[y][x] !== C_EMPTY) tiles.push([x, y]);
    }
  }
  if (tiles.length === 0) {
    ultrisActive = false;
    if (chainCount > chainStartValue) {
      chainCarryTimer = CHAIN_CARRY_WINDOW;
    }
    popupText('CLEARED!', PFX + COLS*CELL/2, PFY + ROWS*CELL/2, getTheme().accent);
    playSfx('highScore');
    return;
  }
  const [tx, ty] = tiles[floor(random(tiles.length))];
  grid[ty][tx] = C_EMPTY;
  boomFlash.push({ x: tx, y: ty, timer: BOOM_FLASH_DURATION, color: BOOM_FLASH_COLOR });
  addScore(50);
  screenShake(2 + floor(random(3)), 60);
  playSfx('score');
}

function activatePowerup(index) {
  if (resolving || celebrating || ultrisActive || boomSequence) return;
  if (index < 0 || index >= powerups.length) return;
  const p = powerups.splice(index, 1)[0];
  firePowerup(p);
}

function handleInput() {
  if (kb.presses('left')) {
    if (valid(current, -1, 0)) { current.x--; bumpLockDelay(); }
    leftHold = MOVE_INITIAL;
  } else if (kb.pressing('left')) {
    leftHold -= deltaTime;
    if (leftHold <= 0) {
      leftHold = MOVE_REPEAT;
      if (valid(current, -1, 0)) { current.x--; bumpLockDelay(); }
    }
  }
  if (kb.presses('right')) {
    if (valid(current, 1, 0)) { current.x++; bumpLockDelay(); }
    rightHold = MOVE_INITIAL;
  } else if (kb.pressing('right')) {
    rightHold -= deltaTime;
    if (rightHold <= 0) {
      rightHold = MOVE_REPEAT;
      if (valid(current, 1, 0)) { current.x++; bumpLockDelay(); }
    }
  }
  if (kb.presses('up')) tryRotate();
  if (kb.presses('c')) tryHold();
  if (kb.pressing('down')) dropTimer += deltaTime * 4;
  if (kb.presses('space')) {
    while (valid(current, 0, 1)) current.y++;
    playSfx('laser');
    lockPiece();
  }
  for (let i = 1; i <= MAX_POWERUPS; i++) {
    if (kb.presses(i.toString())) activatePowerup(i - 1);
  }
  if (mouse.presses('left')) {
    const px = mouse.x, py = mouse.y;
    const sx = PFX + COLS*CELL + 160;
    const slotW = 230;
    const slotH = 26;
    const startY = PFY + 70;
    for (let i = 0; i < powerups.length; i++) {
      const sy = startY + i * slotH;
      if (px > sx - 4 && px < sx + slotW &&
          py > sy - 2 && py < sy + slotH - 2) {
        activatePowerup(i);
        break;
      }
    }
  }
}

function updateChainTone() {
  if (chainCarryTimer > 0) {
    const t = chainCarryTimer / CHAIN_CARRY_WINDOW;
    const baseFreq = 350 + (1 - t) * 350;
    const pulseSpeed = 0.008 + (1 - t) * 0.017;
    const pulse = 0.5 + 0.5 * sin(millis() * pulseSpeed);
    const vol = 0.04 + 0.07 * pulse;
    setTone(baseFreq, vol);
    chainToneOn = true;
  } else if (chainToneOn) {
    stopTone();
    chainToneOn = false;
  }
}

// ----- Lifecycle -----
function onGameStart() {
  grid = Array.from({length: ROWS}, () => Array(COLS).fill(C_EMPTY));
  level = 1;
  tilesCleared = 0;
  dropInterval = dropIntervalForLevel(1);
  resolving = false;
  resolveTimer = 0;
  resolveTriggeredBy = 'lock';
  leftHold = 0;
  rightHold = 0;
  boomTimer = 0;
  celebrating = false;
  celebrateTimer = 0;
  celebrateChanges = [];
  chainCount = 0;
  chainPopupTimer = 0;
  chainPopupValue = 0;
  chainCarryTimer = 0;
  chainStartValue = 0;
  garbageTimer = 0;
  heldPiece = null;
  canHold = true;
  powerups = [];
  powerupsEarned = 0;
  pendingAutoPowerups = [];
  pendingAfterAutoFire = null;
  lifeSaveTimer = 0;
  ultrisFlash = [];
  ultrisActive = false;
  ultrisStepTimer = 0;
  powerupFanfare = null;
  pendingFanfareData = null;
  boomSequence = null;
  boomFlash = [];
  resetPieceState();
  if (chainToneOn) { stopTone(); chainToneOn = false; }
  nextPiece = newPiece();
  spawnNextPiece();
}

function onGameUpdate() {
  for (let i = ultrisFlash.length - 1; i >= 0; i--) {
    ultrisFlash[i].timer -= deltaTime;
    if (ultrisFlash[i].timer <= 0) ultrisFlash.splice(i, 1);
  }
  for (let i = boomFlash.length - 1; i >= 0; i--) {
    boomFlash[i].timer -= deltaTime;
    if (boomFlash[i].timer <= 0) boomFlash.splice(i, 1);
  }
  if (boomTimer > 0) boomTimer = max(0, boomTimer - deltaTime);
  if (chainPopupTimer > 0) chainPopupTimer = max(0, chainPopupTimer - deltaTime);
  if (lifeSaveTimer > 0) lifeSaveTimer = max(0, lifeSaveTimer - deltaTime);
  if (powerupFanfare) {
    powerupFanfare.timer -= deltaTime;
    if (powerupFanfare.timer <= 0) powerupFanfare = null;
  }

  if (ultrisActive) {
    ultrisStepTimer += deltaTime;
    if (ultrisStepTimer >= ULTRIS_STEP_INTERVAL) ultrisStep();
    if (chainToneOn) { stopTone(); chainToneOn = false; }
    return;
  }

  if (boomSequence) {
    tickBoomSequence();
    if (chainToneOn) { stopTone(); chainToneOn = false; }
    return;
  }

  if (celebrating) {
    if (powerupFanfare) {
      pendingFanfareData = {
        type: powerupFanfare.type,
        color: powerupFanfare.color,
      };
      powerupFanfare = null;
    }
    if (kb.presses('space') || kb.presses('enter')) celebrateTimer = 0;
    celebrateTimer -= deltaTime;
    if (celebrateTimer <= 0) {
      celebrating = false;
      if (pendingFanfareData) {
        const p = { type: pendingFanfareData.type };
        if (pendingFanfareData.color !== undefined) p.color = pendingFanfareData.color;
        triggerPowerupFanfare(p);
        pendingFanfareData = null;
      }
    }
    if (chainToneOn) { stopTone(); chainToneOn = false; }
    return;
  }

  if (resolving) {
    resolveTimer += deltaTime;
    if (resolveTimer >= RESOLVE_DELAY) {
      resolveTimer = 0;
      const more = resolveStep();
      if (!more) {
        resolving = false;
        if (chainCount > chainStartValue) {
          chainCarryTimer = CHAIN_CARRY_WINDOW;
        } else {
          chainCount = 0;
          chainCarryTimer = 0;
        }
        if (resolveTriggeredBy === 'lock') spawnNextPiece();
      }
    }
    if (chainToneOn) { stopTone(); chainToneOn = false; }
    return;
  }

  if (pendingAutoPowerups.length > 0) {
    const p = pendingAutoPowerups.shift();
    firePowerup(p);
    return;
  }

  if (pendingAfterAutoFire) {
    const cb = pendingAfterAutoFire;
    pendingAfterAutoFire = null;
    cb();
    return;
  }

  if (chainCarryTimer > 0) {
    chainCarryTimer = max(0, chainCarryTimer - deltaTime);
    if (chainCarryTimer <= 0) chainCount = 0;
  }
  updateChainTone();

  if (level >= 2) {
    garbageTimer += deltaTime;
    const interval = getGarbageInterval();
    if (garbageTimer >= interval) {
      garbageTimer = 0;
      addGarbageRow();
      return;
    }
  }

  handleInput();

  const canFall = valid(current, 0, 1);
  if (canFall) {
    groundedTimer = 0;
    dropTimer += deltaTime;
    if (dropTimer >= dropInterval) {
      dropTimer = 0;
      if (valid(current, 0, 1)) current.y++;
    }
  } else {
    groundedTimer += deltaTime;
    if (groundedTimer >= LOCK_DELAY || lockResets >= MAX_LOCK_RESETS) {
      lockPiece();
    }
  }
}

function onGameDraw() {
  push();

  noStroke();
  fill(0, 0, 0, 110);
  rect(PFX, PFY, COLS*CELL, ROWS*CELL, 4);

  noFill();
  stroke(getTheme().muted);
  strokeWeight(2);
  rect(PFX - 2, PFY - 2, COLS*CELL + 4, ROWS*CELL + 4, 4);

  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (grid[y][x] !== C_EMPTY) drawTile(x, y, grid[y][x]);
    }
  }

  if (!resolving && !celebrating && !ultrisActive && !boomSequence &&
      pendingAutoPowerups.length === 0 && !pendingAfterAutoFire && current) {
    let ghost = 0;
    while (valid(current, 0, ghost + 1)) ghost++;
    for (let i = 0; i < current.shape.length; i++) {
      const [cx, cy] = current.shape[i];
      const colorCode = current.colors[i];
      const px = PFX + (current.x + cx) * CELL;
      const py = PFY + (current.y + cy + ghost) * CELL;
      noFill();
      stroke(HEX[colorCode]);
      strokeWeight(1);
      rect(px + 2, py + 2, CELL - 4, CELL - 4, 3);
      if (colorCode === C_ULTRIS || colorCode === C_HARD) {
        const uc = color(HEX[C_ULTRIS]);
        push();
        noStroke();
        fill(red(uc), green(uc), blue(uc), 150);
        textAlign(CENTER, CENTER);
        textStyle(BOLD);
        textSize(CELL * 0.78);
        text(colorCode === C_HARD ? 'H' : 'U', px + CELL/2, py + CELL/2 + 1);
        pop();
      }
    }
    for (let i = 0; i < current.shape.length; i++) {
      const [cx, cy] = current.shape[i];
      drawTile(current.x + cx, current.y + cy, current.colors[i]);
    }
    if (groundedTimer > 0) {
      const lt = groundedTimer / LOCK_DELAY;
      const pulse = 70 * lt * (0.7 + 0.3 * sin(millis() * 0.025));
      noStroke();
      fill(255, 255, 255, pulse);
      for (const [cx, cy] of current.shape) {
        const px = PFX + (current.x + cx) * CELL;
        const py = PFY + (current.y + cy) * CELL;
        rect(px + 1, py + 1, CELL - 2, CELL - 2, 3);
      }
    }
  }

  for (const f of ultrisFlash) {
    const t = f.timer / ULTRIS_FLASH_DURATION;
    const px = PFX + f.x * CELL;
    const py = PFY + f.y * CELL;
    noStroke();
    fill(255, 255, 255, 230 * t);
    rect(px, py, CELL, CELL, 3);
    push();
    fill(20, 30, 80, 230 * t);
    textAlign(CENTER, CENTER);
    textStyle(BOLD);
    textSize(CELL * 0.85);
    text('U', px + CELL/2, py + CELL/2 + 1);
    pop();
  }

  for (const f of boomFlash) {
    const t = f.timer / BOOM_FLASH_DURATION;
    const px = PFX + f.x * CELL;
    const py = PFY + f.y * CELL;
    const c = f.color || BOOM_FLASH_COLOR;
    noStroke();
    fill(c[0], c[1], c[2], 220 * t);
    rect(px + 1, py + 1, CELL - 2, CELL - 2, 3);
    fill(255, 255, 255, 200 * t);
    const r = (1 - t) * CELL * 0.6;
    circle(px + CELL/2, py + CELL/2, r);
  }

  drawSidePanel();
  drawPowerupsPanel();
  drawChainOverlay();
  drawBoomOverlay();
  drawPowerupFanfareOverlay();
  drawLifeSaveOverlay();
  drawUltrisActiveOverlay();
  drawCelebrateOverlay();

  pop();
}

function drawTile(x, y, color) {
  const px = PFX + x * CELL;
  const py = PFY + y * CELL;
  noStroke();
  fill(HEX[color]);
  rect(px + 1, py + 1, CELL - 2, CELL - 2, 3);
  fill(255, 255, 255, 60);
  rect(px + 2, py + 2, CELL - 4, 4, 2);
  if (color === C_RED) {
    fill(255, 220, 80, 200);
    circle(px + CELL/2, py + CELL/2, 6);
  }
  if (color === C_ULTRIS || color === C_HARD) {
    push();
    fill(20, 30, 60, 230);
    textAlign(CENTER, CENTER);
    textStyle(BOLD);
    textSize(CELL * 0.78);
    text(color === C_HARD ? 'H' : 'U', px + CELL/2, py + CELL/2 + 1);
    pop();
  }
}

function drawPreviewTile(tx, ty, cs, color) {
  fill(HEX[color]);
  rect(tx, ty, cs - 1, cs - 1, 2);
  if (color === C_ULTRIS || color === C_HARD) {
    push();
    fill(20, 30, 60, 230);
    textAlign(CENTER, CENTER);
    textStyle(BOLD);
    textSize(cs * 0.85);
    text(color === C_HARD ? 'H' : 'U', tx + (cs-1)/2, ty + (cs-1)/2);
    pop();
  }
}

function drawChainOverlay() {
  if (chainPopupTimer <= 0) return;
  const t = chainPopupTimer / CHAIN_POPUP_DURATION;
  const alpha = 255 * (t > 0.2 ? 1 : t / 0.2);
  const grow = (1 - t) * 0.4;
  const wobble = sin((CHAIN_POPUP_DURATION - chainPopupTimer) * 0.025) * 0.05;
  const scale = 1.0 + grow + wobble;
  const baseSize = 32 + min(chainPopupValue - 2, 5) * 6;
  const cx = PFX + COLS*CELL/2;
  const cy = PFY + 60;
  const ox = chainPopupValue >= 3 ? random(-3, 3) : 0;
  const oy = chainPopupValue >= 3 ? random(-3, 3) : 0;
  push();
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  textSize(baseSize * scale);
  noStroke();
  fill(0, 0, 0, alpha * 0.5);
  text(`x${chainPopupValue} CHAIN!`, cx + 3 + ox, cy + 3 + oy);
  const accent = color(getTheme().accent);
  if (chainPopupValue >= 3) {
    fill(255, 220, 80, alpha);
    text(`x${chainPopupValue} CHAIN!`, cx + 1 + ox, cy + 1 + oy);
  }
  fill(red(accent), green(accent), blue(accent), alpha);
  text(`x${chainPopupValue} CHAIN!`, cx + ox, cy + oy);
  pop();
}

function drawBoomOverlay() {
  if (boomTimer <= 0) return;
  const t = boomTimer / BOOM_DURATION;
  const alpha = 255 * (t > 0.25 ? 1 : t / 0.25);
  const scale = 1.6 - t * 0.6;
  const ox = random(-5, 5);
  const oy = random(-5, 5);
  const cx = PFX + COLS*CELL/2;
  const cy = PFY + ROWS*CELL/2;
  push();
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  textSize(80 * scale);
  noStroke();
  fill(0, 0, 0, alpha * 0.6);
  text('BOOM!', cx + 5 + ox, cy + 5 + oy);
  fill(255, 220, 80, alpha);
  text('BOOM!', cx + 2 + ox, cy + 2 + oy);
  fill(239, 71, 111, alpha);
  text('BOOM!', cx + ox, cy + oy);
  pop();
}

function drawPowerupFanfareOverlay() {
  if (!powerupFanfare || powerupFanfare.timer <= 0) return;
  const t = powerupFanfare.timer / POWERUP_FANFARE_DURATION;
  const fadeIn = constrain((1 - t) / 0.10, 0, 1);
  const fadeOut = constrain(t / 0.20, 0, 1);
  const alpha = 255 * min(fadeIn, fadeOut);

  const wob = sin((POWERUP_FANFARE_DURATION - powerupFanfare.timer) * 0.018) * 4;
  const grow = (1 - t) * 0.35;
  const scale = 1.0 + grow;
  const sparkle = 0.7 + 0.3 * sin(millis() * 0.02);

  const cx = PFX + COLS*CELL/2;
  const cy = PFY + 150 + wob;
  const isUltris = powerupFanfare.type === 'ULTRIS_EXPLODE';

  push();
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  noStroke();

  const bannerW = isUltris ? 360 : 300;
  const bannerH = isUltris ? 92 : 80;
  fill(0, 0, 0, alpha * 0.55);
  rect(cx - bannerW/2, cy - bannerH/2, bannerW, bannerH, 8);

  const mainSize = (isUltris ? 40 : 34) * scale;
  textSize(mainSize);
  fill(0, 0, 0, alpha * 0.7);
  text('POWER-UP!', cx + 3, cy - 12 + 3);
  fill(255, 220, 80, alpha * sparkle);
  text('POWER-UP!', cx + 1, cy - 12 + 1);
  fill(239, 71, 111, alpha);
  text('POWER-UP!', cx, cy - 12);

  textSize(isUltris ? 22 : 18);
  fill(0, 0, 0, alpha * 0.6);
  text(powerupFanfare.label, cx + 2, cy + 22 + 2);
  if ((powerupFanfare.type === 'EXPLODE_COLOR' || powerupFanfare.type === 'CONVERT_COLOR')
      && powerupFanfare.color !== undefined) {
    const c = color(HEX[powerupFanfare.color]);
    fill(red(c), green(c), blue(c), alpha);
  } else if (isUltris) {
    fill(255, 220, 80, alpha);
  } else {
    fill(255, 255, 255, alpha);
  }
  text(powerupFanfare.label, cx, cy + 22);

  pop();
}

function drawLifeSaveOverlay() {
  if (lifeSaveTimer <= 0) return;
  const t = lifeSaveTimer / LIFE_SAVE_DURATION;
  const fadeIn = constrain((1 - t) / 0.08, 0, 1);
  const fadeOut = constrain(t / 0.20, 0, 1);
  const alpha = 255 * min(fadeIn, fadeOut);
  const wob = sin((LIFE_SAVE_DURATION - lifeSaveTimer) * 0.018) * 4;
  const scale = 1.4 - t * 0.3;
  const cx = PFX + COLS*CELL/2;
  const cy = PFY + ROWS*CELL/2 - 60 + wob;
  push();
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  noStroke();
  textSize(46 * scale);
  fill(0, 0, 0, alpha * 0.7);
  text('LIFE SAVED!', cx + 4, cy + 4);
  fill(255, 220, 80, alpha);
  text('LIFE SAVED!', cx + 2, cy + 2);
  fill(94, 176, 255, alpha);
  text('LIFE SAVED!', cx, cy);
  pop();
}

function drawUltrisActiveOverlay() {
  if (!ultrisActive) return;
  push();
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  const wob = sin(millis() * 0.008) * 4;
  textSize(32);
  noStroke();
  fill(0, 0, 0, 180);
  text('ULTRIS EXPLODE!', PFX + COLS*CELL/2 + 2, 20 + wob + 2);
  fill(getTheme().accent);
  text('ULTRIS EXPLODE!', PFX + COLS*CELL/2, 20 + wob);
  pop();
}

function drawCelebrateOverlay() {
  if (!celebrating) return;
  if (boomSequence) return;
  const t = celebrateTimer / CELEBRATE_DURATION;
  const fadeIn = constrain((1 - t) / 0.10, 0, 1);
  const fadeOut = constrain(t / 0.10, 0, 1);
  const a = min(fadeIn, fadeOut);
  push();
  noStroke();
  fill(0, 0, 0, 220 * a);
  rect(0, 0, width, height);
  const accent = color(getTheme().accent);
  const muted = color(getTheme().muted);
  const wob = sin((CELEBRATE_DURATION - celebrateTimer) * 0.012) * 6;
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  fill(red(accent), green(accent), blue(accent), 255 * a);
  textSize(42);
  text(`LEVEL ${celebrateLevel - 1}`, width/2, 75 + wob);
  fill(255, 255, 255, 255 * a);
  textSize(24);
  text('COMPLETE!', width/2, 115);
  textStyle(NORMAL);
  fill(red(muted), green(muted), blue(muted), 230 * a);
  textSize(13);
  text(`Entering Level ${celebrateLevel}:`, width/2, 165);
  const startY = 200;
  const lineH = 26;
  textSize(15);
  for (let i = 0; i < celebrateChanges.length; i++) {
    fill(red(accent), green(accent), blue(accent), 255 * a);
    circle(width/2 - textWidth(celebrateChanges[i])/2 - 14, startY + i * lineH, 6);
    fill(255, 255, 255, 245 * a);
    text(celebrateChanges[i], width/2, startY + i * lineH);
  }
  fill(red(muted), green(muted), blue(muted), 200 * a);
  textSize(11);
  text('SPACE to skip', width/2, height - 25);
  pop();
}

function drawSidePanel() {
  const t = getTheme();
  const accent = color(t.accent);
  const x = PFX + COLS*CELL + 30;
  const cs = 16;
  noStroke();
  textAlign(LEFT, TOP);

  fill(t.text);
  textSize(13);
  text('NEXT', x, PFY + 8);
  for (let i = 0; i < nextPiece.shape.length; i++) {
    const [cx, cy] = nextPiece.shape[i];
    drawPreviewTile(x + cx * cs, PFY + 30 + cy * cs, cs, nextPiece.colors[i]);
  }

  const holdX = x + 84;
  fill(t.text);
  text('HOLD', holdX, PFY + 8);
  if (heldPiece) {
    const heldShape = SHAPES[heldPiece.shapeIdx];
    for (let i = 0; i < heldShape.length; i++) {
      const [cx, cy] = heldShape[i];
      drawPreviewTile(holdX + cx * cs, PFY + 30 + cy * cs, cs, heldPiece.colors[i]);
    }
    if (!canHold) {
      fill(0, 0, 0, 140);
      rect(holdX - 2, PFY + 28, cs * 4 + 4, cs * 2 + 4, 3);
    }
  } else {
    fill(t.muted);
    textSize(10);
    text('press C', holdX, PFY + 35);
  }

  if (level >= 2) {
    const interval = getGarbageInterval();
    const remaining = max(0, interval - garbageTimer);
    const frac = constrain(remaining / interval, 0, 1);
    const warn = remaining < 5000;
    const labelCol = warn ? accent : color(t.text);
    fill(red(labelCol), green(labelCol), blue(labelCol),
         warn ? 200 + 55 * sin(millis() * 0.012) : 255);
    textSize(11);
    text(`PUSH UP IN ${(remaining/1000).toFixed(1)}s`, x, PFY + 75);
    const bw = 110;
    noFill();
    stroke(t.muted);
    strokeWeight(1);
    rect(x, PFY + 92, bw, 5, 1);
    noStroke();
    fill(red(accent), green(accent), blue(accent), 220);
    rect(x, PFY + 92, bw * (1 - frac), 5, 1);
  }

  if (chainCarryTimer > 0 && chainCount > 0) {
    const pulse = 0.7 + 0.3 * sin(millis() * 0.012);
    fill(red(accent), green(accent), blue(accent), 255 * pulse);
    textSize(13);
    textStyle(BOLD);
    text(`x${chainCount} CHAIN!`, x, PFY + 108);
    textStyle(NORMAL);
    const bw = 110;
    noFill();
    stroke(t.muted);
    strokeWeight(1);
    rect(x, PFY + 124, bw, 4);
    noStroke();
    fill(red(accent), green(accent), blue(accent), 220);
    rect(x, PFY + 124, bw * (chainCarryTimer / CHAIN_CARRY_WINDOW), 4);
  }

  fill(t.text);
  textSize(13);
  text('LEVEL', x, PFY + 142);
  fill(t.accent);
  textSize(22);
  text(level, x, PFY + 158);

  fill(t.text);
  textSize(13);
  text('TILES THIS LEVEL', x, PFY + 196);
  textSize(15);
  text(`${tilesCleared} / ${TILES_PER_LEVEL}`, x, PFY + 213);

  const bw = 110;
  noFill();
  stroke(t.muted);
  strokeWeight(1);
  rect(x, PFY + 235, bw, 8, 2);
  noStroke();
  fill(t.accent);
  rect(x, PFY + 235, bw * (tilesCleared / TILES_PER_LEVEL), 8, 2);

  fill(t.text);
  textSize(11);
  text('LEGEND', x, PFY + 256);

  const lY = PFY + 272;
  fill(HEX[C_BLUE]);   rect(x,      lY, 14, 14, 2);
  fill(HEX[C_YELLOW]); rect(x + 18, lY, 14, 14, 2);
  fill(HEX[C_GREEN]);  rect(x + 36, lY, 14, 14, 2);
  fill(HEX[C_PURPLE]); rect(x + 54, lY, 14, 14, 2);
  fill(t.text);
  textSize(11);
  text(`Connect ${MATCH_MIN}+ same color`, x, lY + 18);

  fill(HEX[C_RED]); rect(x, lY + 34, 14, 14, 2);
  fill(t.text);
  text(`Red x${RED_MIN}+ = BOOM!`, x + 20, lY + 35);

  drawPreviewTile(x, lY + 52, 14, C_ULTRIS);
  fill(t.text);
  text("ULTRIS: match or", x + 20, lY + 49);
  text(`boom ${ULTRIS_BLAST_MIN}+ = power-up`, x + 20, lY + 61);
}

function drawPowerupsPanel() {
  const t = getTheme();
  const accent = color(t.accent);
  const x = PFX + COLS*CELL + 160;
  noStroke();
  textAlign(LEFT, TOP);

  fill(t.text);
  textSize(13);
  textStyle(BOLD);
  text('POWER-UPS', x, PFY + 8);
  textStyle(NORMAL);

  const prog = getUltrisProgress();
  const bw = 220;
  if (prog.remaining === 1) {
    const pulse = 0.65 + 0.35 * sin(millis() * 0.014);
    fill(red(accent), green(accent), blue(accent), 255 * pulse);
    textSize(11);
    textStyle(BOLD);
    text('ULTRIS EXPLODE NEXT!', x, PFY + 30);
    textStyle(NORMAL);
  } else {
    fill(t.muted);
    textSize(10);
    text(`ULTRIS EXPLODE in ${prog.remaining} power-ups`, x, PFY + 30);
  }
  noFill();
  stroke(t.muted);
  strokeWeight(1);
  rect(x, PFY + 46, bw, 4, 1);
  noStroke();
  fill(red(accent), green(accent), blue(accent), 220);
  rect(x, PFY + 46, bw * (prog.progressed / prog.cycleSize), 4, 1);

  if (powerups.length === 0) {
    fill(t.muted);
    textSize(11);
    text('Match or blast 3+ ULTRIS', x, PFY + 70);
    text('to earn power-ups', x, PFY + 86);
    return;
  }

  const slotW = 230;
  const slotH = 26;
  const startY = PFY + 70;
  const isFull = powerups.length >= MAX_POWERUPS;

  for (let i = 0; i < powerups.length; i++) {
    const p = powerups[i];
    const sy = startY + i * slotH;
    const hovered = mouse.x > x - 4 && mouse.x < x + slotW &&
                    mouse.y > sy - 2 && mouse.y < sy + slotH - 2;
    const isNextAuto = isFull && i === 0;

    if (hovered) {
      fill(red(accent), green(accent), blue(accent), 100);
    } else if (isNextAuto) {
      const pulse = 0.4 + 0.3 * sin(millis() * 0.012);
      fill(red(accent), green(accent), blue(accent), 60 + 60 * pulse);
    } else {
      fill(0, 0, 0, 70);
    }
    rect(x - 4, sy - 2, slotW, slotH - 2, 4);

    fill(t.accent);
    textSize(13);
    textStyle(BOLD);
    text(`${i + 1}`, x + 4, sy + 5);
    textStyle(NORMAL);

    fill(t.text);
    textSize(12);
    text(getPowerupLabel(p), x + 24, sy + 6);

    if (p.type === 'EXPLODE_COLOR' || p.type === 'CONVERT_COLOR') {
      fill(HEX[p.color]);
      rect(x + slotW - 22, sy + 4, 14, 14, 2);
    }
  }

  fill(t.muted);
  textSize(10);
  if (isFull) {
    fill(red(accent), green(accent), blue(accent), 220);
    text(`FULL — next earned auto-fires #1`,
         x, startY + powerups.length * slotH + 6);
  } else {
    text(`Click or press 1-${MAX_POWERUPS}  (max ${MAX_POWERUPS})`,
         x, startY + powerups.length * slotH + 6);
  }
}

function onGameEnd(finalScore) {
  if (chainToneOn) { stopTone(); chainToneOn = false; }
  powerupFanfare = null;
  pendingFanfareData = null;
  boomSequence = null;
  boomFlash = [];
  pendingAutoPowerups = [];
  pendingAfterAutoFire = null;
  lifeSaveTimer = 0;
}
