// ============================================================
//  Vibe-Coded Games — Game Framework
// ============================================================
//
//  A reusable shell that gives every game a consistent, polished
//  presentation: animated title screen, mouse + keyboard menus,
//  pause overlay, settings (volume sliders), high-score persistence,
//  scene fades, screen shake, score popups, sound helpers, optional
//  lives system, and themeable colors.
//
//  Built on p5.js + p5.play 3.x. Loaded once via index.html; each game
//  defines a GAME_CONFIG object and the four lifecycle hooks.
//
// ------------------------------------------------------------
//  GAME_CONFIG schema (everything optional except marked *)
// ------------------------------------------------------------
//    title:        string   *   shown on title screen
//    storageKey:   string   *   unique key for localStorage saves
//    canvasWidth:  number       default 720
//    canvasHeight: number       default 480
//    subtitle:     string       small text under the title
//    controlsHint: string       one-liner shown on title screen
//    background:  'stars' | 'grid' | 'solid' | false   default 'stars'
//    startLives:  number        if > 0, framework tracks lives & shows them
//    theme: {
//      bg, primary, accent, text, muted, danger      partial override OK
//    }
//    sounds: {                  optional; framework loads with loadSound()
//      <name>: 'path/to/file.mp3', ...
//      // 'music' is treated as background music (looping)
//    }
//
// ------------------------------------------------------------
//  Hooks the game defines (all optional)
// ------------------------------------------------------------
//    onPreload()             load images / extra sounds via p5
//    onGameStart()           a new run begins — create sprites, reset state
//    onGameUpdate()          per-frame logic + input (during play only)
//    onGameDraw()            per-frame drawing layered ABOVE sprites
//    onGameDrawBackground()  per-frame drawing layered BELOW sprites
//    onGameEnd(finalScore)   the run just ended
//    onPause(), onResume()   pause/unpause notifications
//    drawCustomHud()         override the default HUD entirely
//
// ------------------------------------------------------------
//  Helpers the game can call
// ------------------------------------------------------------
//    addScore(n)                 increase score
//    endGame()                   end the run; framework records high score
//    setLives(n) / loseLife() / addLife()
//    popupText(text, x, y, [color])    floating "+10"-style label
//    screenShake(intensity, durationMs)
//    playSfx(name) / playMusic(name) / stopMusic()
//    getTheme()                  resolved theme object
//
//  Globals available (read-only by convention)
//    score, highScore, lives, settings, state
// ============================================================


// ============================================================
//  Defaults
// ============================================================
const STATE_TITLE       = 'title';
const STATE_PLAYING     = 'playing';
const STATE_PAUSED      = 'paused';
const STATE_SETTINGS    = 'settings';
const STATE_GAME_OVER   = 'game_over';
const STATE_HOW_TO_PLAY = 'how_to_play';
const STATE_ENTER_NAME  = 'enter_name';

const HIGH_SCORE_LIMIT  = 5;
const HIGH_SCORE_NAME_MAX = 10;

const DEFAULT_THEME = {
  bg:      '#0b0d12',
  primary: '#5eb0ff',
  accent:  '#ffc857',
  text:    '#eef2f6',
  muted:   '#8a93a3',
  danger:  '#ff6b6b',
};

// Preset palettes — students pass `theme: 'arcade'` (etc.) for a one-line
// shortcut, or use the object form for fine control. They can also combine:
//   theme: { preset: 'space', accent: '#ff00ff' }
const PRESET_THEMES = {
  arcade: { bg: '#1a0033', primary: '#ff5cd0', accent: '#52e1ff',
            text: '#ffffff', muted: '#a878b8', danger: '#ff4060' },
  retro:  { bg: '#1a1a0a', primary: '#88c070', accent: '#f8d878',
            text: '#e8e8c8', muted: '#806c50', danger: '#d05050' },
  neon:   { bg: '#0a0a14', primary: '#39ff14', accent: '#ff10f0',
            text: '#f2fff2', muted: '#5e8ea0', danger: '#ff3b3b' },
  space:  { bg: '#0a0d1a', primary: '#7aa2f7', accent: '#ffd84a',
            text: '#e6e9f0', muted: '#9098b0', danger: '#ff7a7a' },
};

// ----- Theme-aware procedural music ------------------------
// Each entry: { bpm, stepLength (in beats), phrases: [{ type, env: [a,d,sPct,r],
// gain (peak amp), noteDuration (sec held in sustain), sequence (MIDI notes; 0 = rest) }] }
// p5.sound's Oscillator + Envelope + Phrase + Part assemble the playback graph.
const THEME_MUSIC = {
  arcade: {
    bpm: 132, stepLength: 1/8,
    phrases: [
      { type: 'square',   env: [0.02, 0.18, 0.0, 0.08], gain: 0.16, noteDuration: 0,
        sequence: [36,0,0,0, 36,0,0,0, 43,0,0,0, 43,0,0,0] },
      { type: 'square',   env: [0.01, 0.12, 0.0, 0.05], gain: 0.09, noteDuration: 0,
        sequence: [60,64,67,72, 67,64,60,0, 60,65,69,72, 69,65,60,0] },
    ],
  },
  retro: {
    bpm: 100, stepLength: 1/8,
    phrases: [
      { type: 'triangle', env: [0.03, 0.30, 0.0, 0.12], gain: 0.20, noteDuration: 0,
        sequence: [40,0,47,0, 43,0,50,0, 41,0,48,0, 45,0,52,0] },
      { type: 'sine',     env: [0.05, 0.40, 0.4, 0.20], gain: 0.10, noteDuration: 0.15,
        sequence: [0,0,0,0, 64,0,67,0, 0,0,0,0, 65,0,69,0] },
    ],
  },
  neon: {
    bpm: 124, stepLength: 1/8,
    phrases: [
      { type: 'sawtooth', env: [0.02, 0.10, 0.0, 0.05], gain: 0.13, noteDuration: 0,
        sequence: [40,40,40,40, 47,47,47,47, 43,43,43,43, 38,38,38,38] },
      { type: 'sine',     env: [0.50, 0.50, 0.6, 0.50], gain: 0.07, noteDuration: 1.0,
        sequence: [64,0,0,0, 0,0,0,0, 67,0,0,0, 0,0,0,0] },
    ],
  },
  space: {
    bpm: 56, stepLength: 1/4,
    phrases: [
      { type: 'sine',     env: [1.00, 0.60, 0.7, 1.20], gain: 0.13, noteDuration: 2.0,
        sequence: [60,0,0,0, 0,0,0,0, 65,0,0,0, 0,0,0,0] },
      { type: 'sine',     env: [0.005, 1.5, 0.0, 0.30], gain: 0.06, noteDuration: 0,
        sequence: [0,0,0,0, 84,0,0,0, 0,0,0,0, 88,0,0,0] },
    ],
  },
  default: {
    bpm: 80, stepLength: 1/8,
    phrases: [
      { type: 'sine',     env: [0.30, 0.50, 0.5, 0.40], gain: 0.10, noteDuration: 0.4,
        sequence: [60,0,0,0, 64,0,0,0, 67,0,0,0, 64,0,0,0] },
    ],
  },
};

const DEFAULT_CONFIG = {
  title:        'Untitled Game',
  storageKey:   'vcg_untitled',
  canvasWidth:  720,
  canvasHeight: 480,
  subtitle:     null,
  controls:     null,         // array of strings shown on the title screen
  controlsHint: null,         // back-compat: single-string variant of `controls`
  background:   'stars',
  startLives:   0,
  timeLimit:    0,            // seconds; if > 0 the run ends at 0:00 (timed mode)
  music:        true,         // set false to silence procedural background music entirely
  theme:        DEFAULT_THEME,
  sounds:       {},
};


// ============================================================
//  Public state (readable from game code)
// ============================================================
let state      = STATE_TITLE;
let score      = 0;
let highScore  = 0;            // synced mirror of highScores[0].score for game code
let highScores = [];           // top-5 list of { name, score } sorted descending
let lives      = 0;
let settings  = {
  masterVolume: 0.8,
  musicVolume:  0.15,
  sfxVolume:    1.0,
  musicChoice:  null,      // resolved at setup time: 'arcade' | 'retro' | 'neon' | 'space' | 'off'
  timeChoice:   'default', // 'default' | 'off' | '30' | '60' | '120' | '180' | '300' | '600' (seconds)
};


// ============================================================
//  Private state
// ============================================================
let _cfg;                                      // resolved GAME_CONFIG
let _theme;                                    // resolved theme
let _prevState = STATE_TITLE;                  // where settings was opened from
let _menuIndex = { title: 0, pause: 0, settings: 0, game_over: 0 };
let _menuHover     = -1;                       // mouse-hover index for current menu (this frame)
let _prevMenuHover = -1;                       // mouse-hover index from previous frame
                                               //   (used so a stationary mouse doesn't keep
                                               //    overriding keyboard navigation)
let _popups   = [];                            // floating texts
let _shake    = { intensity: 0, until: 0 };
let _bgStars  = [];                            // starfield particles
let _sounds   = {};                            // loaded p5.SoundFile by name
let _music    = null;                          // currently playing music handle
let _transition = { t: 18, dur: 18 };          // visual fade-in counter (t >= dur means done)
let _justEnteredScene = true;                  // suppress click-through on scene change
let _newHighEntryIndex = -1;                   // index in highScores of the run that just qualified, or -1
let _pendingHighScore  = 0;                    // score awaiting a name during STATE_ENTER_NAME
let _enteredName       = '';                   // the name being typed during STATE_ENTER_NAME

// Hold-to-repeat for menu navigation (Up/Down)
let _navHoldDir      = 0;                      // -1 (up), 0 (none), 1 (down)
let _navHoldRepeatAt = 0;                      // millis() time of next repeat
const NAV_HOLD_DELAY    = 350;                 // ms before repeats start
const NAV_HOLD_INTERVAL = 90;                  // ms between repeats while held

// Scroll position on the How to Play screen (in pixels)
let _howtoScroll = 0;

// Smooth score count-up: HUD draws _displayScore, lerps toward `score`
let _displayScore = 0;

// Mute hotkey state (M): remember the volume to restore when unmuting
let _preMuteVolume = 0.8;

// Timed mode (GAME_CONFIG.timeLimit > 0)
let _timeLimitMs   = 0;       // total run length in ms; 0 = untimed mode
let _timeRemaining = 0;       // ms left in this run
let _timeUpFired   = false;   // guard so endGame() only fires once per run

// Procedural theme music — built lazily on _startGame() via p5.sound.
// We schedule beats ourselves via deltaTime (more reliable than p5.Part).
let _themeVoices     = [];    // [{ osc, env, sequence, noteDuration }]
let _themeMixGain    = null;  // p5.Gain — single fade target for the music sub-mix
let _themeMixCurrent = 0;     // current ramped amp value (lerps toward target each frame)
let _themeStepDuration = 0;   // ms per step
let _themeStepIndex    = 0;   // current position in pattern
let _themeBeatTimer    = 0;   // ms accumulated since last step

// Unified music dispatcher: tracks which source is currently allocated.
// 'game' (= asset music) | 'arcade' | 'retro' | 'neon' | 'space' | null (silent)
let _activeTrack    = null;
let _assetMusicVol  = 0;      // ramped volume for asset music (procedural uses _themeMixCurrent)

function _resolveConfig() {
  const c  = (typeof GAME_CONFIG !== 'undefined') ? GAME_CONFIG : {};
  const cf = Object.assign({}, DEFAULT_CONFIG, c);

  let baseTheme = DEFAULT_THEME;
  let themeOverride = {};
  let presetName = null;
  if (typeof c.theme === 'string') {
    presetName = c.theme;
    baseTheme = PRESET_THEMES[c.theme] || DEFAULT_THEME;
  } else if (c.theme && typeof c.theme === 'object') {
    if (typeof c.theme.preset === 'string' && PRESET_THEMES[c.theme.preset]) {
      presetName = c.theme.preset;
      baseTheme = PRESET_THEMES[c.theme.preset];
    }
    const { preset, ...rest } = c.theme;
    themeOverride = rest;
  }
  cf.theme = Object.assign({}, baseTheme, themeOverride);
  cf.themePreset = presetName;       // null when no preset was named
  cf.sounds = c.sounds || {};
  return cf;
}

function getTheme() { return _theme; }

function _resolveControlsList() {
  let lines = [];
  if (Array.isArray(_cfg.controls))   lines = _cfg.controls.slice();
  else if (_cfg.controlsHint)         lines = [_cfg.controlsHint];
  lines.push('P or Esc to pause');    // framework-provided universal control
  return lines;
}

// Word-wrap a string to a max pixel width using the current p5 text settings.
// Returns an array of lines (always at least one).
function _wrapText(str, maxWidth) {
  const s = String(str);
  if (!s) return [''];
  if (textWidth(s) <= maxWidth) return [s];
  const words = s.split(/\s+/);
  if (words.length === 1) return [s];   // one long word — let it overflow rather than break a word
  const out = [];
  let cur = words[0];
  for (let i = 1; i < words.length; i++) {
    const test = cur + ' ' + words[i];
    if (textWidth(test) <= maxWidth) {
      cur = test;
    } else {
      out.push(cur);
      cur = words[i];
    }
  }
  out.push(cur);
  return out;
}

// Detect a "section header" line: either `## Header` or `== Header ==`.
// Returns the header text (without decoration) or null if not a header.
function _parseHeader(line) {
  const t = String(line).trim();
  if (t.startsWith('## ')) return t.slice(3).trim();
  const m = t.match(/^==\s*(.+?)\s*==$/);
  return m ? m[1].trim() : null;
}


// ============================================================
//  p5 entry points
// ============================================================
function preload() {
  _cfg   = _resolveConfig();
  _theme = _cfg.theme;

  // Auto-load any sounds declared in GAME_CONFIG.sounds
  for (const name in _cfg.sounds) {
    try {
      _sounds[name] = loadSound(_cfg.sounds[name]);
    } catch (e) {
      console.warn(`[framework] could not load sound "${name}":`, e);
    }
  }

  if (typeof onPreload === 'function') onPreload();
}

function setup() {
  new Canvas(_cfg.canvasWidth, _cfg.canvasHeight);
  textFont('sans-serif');
  world.gravity.y = 0;
  loadProgress();

  // Resolve the music choice so Settings opens with the actual track selected.
  // Migrates legacy / unknown / asset-missing values to a sensible default:
  //   - if the game shipped a music asset, default to 'game'
  //   - otherwise the game's declared theme preset
  //   - otherwise 'arcade'
  const active = _activeMusicChoices();
  if (active.indexOf(settings.musicChoice) < 0) {
    if (_sounds.music)              settings.musicChoice = 'game';
    else if (_cfg.themePreset)      settings.musicChoice = _cfg.themePreset;
    else                            settings.musicChoice = 'arcade';
  }

  _initStarfield();

  // Auto-pause when the browser tab/window loses focus
  window.addEventListener('blur', () => {
    if (state === STATE_PLAYING) _pause();
  });
}

function draw() {
  _drawBackground();
  _applyShake();
  _processNavHold();

  // Smooth score count-up (lerp toward the real score; snap on reset)
  if (_displayScore < score) {
    const diff = score - _displayScore;
    _displayScore = Math.min(score, _displayScore + Math.max(1, diff * 0.18));
  } else if (_displayScore > score) {
    _displayScore = score;
  }

  // Music: pick the right source (asset vs procedural) for the current
  // settings choice, then schedule beats and ramp the sub-mix volume.
  _updateMusicSync();
  _tickThemeMusic();
  _updateThemeMusicMix();

  switch (state) {
    case STATE_TITLE:       _drawTitle();      break;
    case STATE_PLAYING:     _tickGame();       break;
    case STATE_PAUSED:      _drawPaused();     break;
    case STATE_SETTINGS:    _drawSettings();   break;
    case STATE_GAME_OVER:   _drawGameOver();   break;
    case STATE_HOW_TO_PLAY: _drawHowToPlay();  break;
    case STATE_ENTER_NAME:  _drawEnterName();  break;
  }

  _drawPopups();
  _drawTransition();
  _justEnteredScene = false;
  _prevMenuHover = _menuHover;
}

function _isMenuState(s) {
  return s === STATE_TITLE || s === STATE_PAUSED ||
         s === STATE_SETTINGS || s === STATE_GAME_OVER;
}

function _processNavHold() {
  if (!_isMenuState(state)) { _navHoldDir = 0; return; }

  let dir = 0;
  if      (keyIsDown(UP_ARROW))   dir = -1;
  else if (keyIsDown(DOWN_ARROW)) dir =  1;

  if (dir === 0 || dir !== _navHoldDir) { _navHoldDir = 0; return; }

  if (millis() >= _navHoldRepeatAt) {
    const len = _menuLength(state);
    if (len > 0) {
      _setMenuIndex(state, (_getMenuIndex(state) + dir + len) % len);
      playSfx('menu');
    }
    _navHoldRepeatAt = millis() + NAV_HOLD_INTERVAL;
  }
}


// ============================================================
//  Scene transitions — state changes immediately; the fade is purely
//  visual and never blocks game logic or input.
// ============================================================
function _changeState(next) {
  if (next !== STATE_PLAYING) stopTone();   // auto-stop any continuous tone on state exit
  state = next;
  _transition.t = 0;
  _justEnteredScene = true;
}

function _drawTransition() {
  if (_transition.t >= _transition.dur) return;
  _transition.t++;
  const alpha = (1 - _transition.t / _transition.dur) * 220;
  push(); camera.off();
  noStroke(); fill(0, 0, 0, alpha);
  rect(0, 0, width, height);
  camera.on(); pop();
}


// ============================================================
//  Animated backgrounds
// ============================================================
function _initStarfield() {
  _bgStars = [];
  for (let i = 0; i < 80; i++) {
    _bgStars.push({
      x: random(width),
      y: random(height),
      r: random(0.6, 2.2),
      v: random(0.15, 0.6),
      a: random(80, 200),
    });
  }
}

function _drawBackground() {
  const bg = _cfg.background;

  // Solid fill always first, even for stars/grid
  background(_theme.bg);

  if (bg === 'stars') {
    push(); camera.off();
    noStroke();
    for (const s of _bgStars) {
      s.y += s.v;
      if (s.y > height) { s.y = 0; s.x = random(width); }
      fill(255, 255, 255, s.a);
      circle(s.x, s.y, s.r * 2);
    }
    camera.on(); pop();
  } else if (bg === 'grid') {
    push(); camera.off();
    stroke(red(color(_theme.muted)),
           green(color(_theme.muted)),
           blue(color(_theme.muted)),
           60);
    strokeWeight(1);
    const step = 40;
    const off = (frameCount * 0.4) % step;
    for (let x = -off; x < width + step; x += step) line(x, 0, x, height);
    for (let y = -off; y < height + step; y += step) line(0, y, width, y);
    camera.on(); pop();
  }
}


// ============================================================
//  Title screen
// ============================================================
const TITLE_MENU = ['title_play', 'title_howto', 'title_settings'];

function _drawTitle() {
  push(); camera.off();

  textAlign(CENTER, CENTER);
  const cx = width / 2;

  // Title with a subtle glow
  const glow = 6 + Math.sin(frameCount * 0.04) * 2;
  drawingContext.shadowBlur = glow * 2;
  drawingContext.shadowColor = _theme.primary;
  fill(_theme.text);
  textSize(48);
  textStyle(BOLD);
  text(_cfg.title, cx, 80);
  drawingContext.shadowBlur = 0;
  textStyle(NORMAL);

  if (_cfg.subtitle) {
    fill(_theme.muted);
    textSize(14);
    text(_cfg.subtitle, cx, 118);
  }

  // Top scores list — header at 150, up to 5 rows below
  _drawTopScores(cx, 150, -1);

  // Menu items
  const items = [
    { id: 'title_play',     label: 'Play',         y: 295 },
    { id: 'title_howto',    label: 'How to Play',  y: 340 },
    { id: 'title_settings', label: 'Settings',     y: 385 },
  ];
  _drawMenu(items, TITLE_MENU);

  // Pulsing footer prompt
  const pulse = 180 + Math.sin(frameCount * 0.1) * 60;
  fill(red(color(_theme.muted)),
       green(color(_theme.muted)),
       blue(color(_theme.muted)),
       pulse);
  textSize(11);
  text('↑ ↓ to choose · ENTER to confirm · or click', cx, height - 22);

  camera.on(); pop();
}

function _activateTitleItem() {
  const id = TITLE_MENU[_menuIndex.title];
  if (id === 'title_play')     _startGame();
  if (id === 'title_howto')    _changeState(STATE_HOW_TO_PLAY);
  if (id === 'title_settings') _openSettings();
}


// ============================================================
//  Top scores list (shared by title + game over)
// ============================================================
function _drawTopScores(cx, headerY, highlightIdx) {
  push();
  textAlign(CENTER, CENTER);

  fill(_theme.muted);
  textSize(11);
  textStyle(BOLD);
  text('— top scores —', cx, headerY);
  textStyle(NORMAL);

  if (highScores.length === 0) {
    textSize(13);
    fill(_theme.muted);
    text('(no scores yet — be the first)', cx, headerY + 22);
    pop();
    return;
  }

  textSize(14);
  const startY = headerY + 22;
  const lineH = 18;
  for (let i = 0; i < highScores.length; i++) {
    const e = highScores[i];
    if (i === highlightIdx) {
      // Pulsing accent for the new entry
      const pulse = 200 + Math.sin(frameCount * 0.18) * 55;
      const c = color(_theme.accent);
      fill(red(c), green(c), blue(c), pulse);
      textStyle(BOLD);
    } else {
      fill(_theme.text);
    }
    const rowY = startY + i * lineH;
    textAlign(LEFT,  CENTER); text(`${i + 1}.`,            cx - 110, rowY);
    textAlign(LEFT,  CENTER); text(e.name,                  cx -  90, rowY);
    textAlign(RIGHT, CENTER); text(e.score.toLocaleString(),cx + 110, rowY);
    textStyle(NORMAL);
  }
  pop();
}


// ============================================================
//  Enter Name (high-score entry)
// ============================================================
function _drawEnterName() {
  push(); camera.off();

  fill(0, 0, 0, 160); rect(0, 0, width, height);

  textAlign(CENTER, CENTER);
  textStyle(BOLD);

  // Pulsing celebration header
  const pulse = 200 + Math.sin(frameCount * 0.18) * 55;
  const accentC = color(_theme.accent);
  fill(red(accentC), green(accentC), blue(accentC), pulse);
  textSize(38);
  text('★ New High Score! ★', width/2, 90);

  fill(_theme.text);
  textSize(28);
  text(_pendingHighScore.toLocaleString(), width/2, 140);
  textStyle(NORMAL);

  fill(_theme.muted);
  textSize(15);
  text('Enter your name:', width/2, 195);

  // Input box
  const boxW = 320, boxH = 56;
  const boxX = width/2 - boxW/2;
  const boxY = 220;
  push();
  noFill();
  stroke(_theme.accent);
  strokeWeight(2);
  rect(boxX, boxY, boxW, boxH, 8);
  pop();

  // Typed name + blinking cursor
  fill(_theme.text);
  textSize(28);
  textStyle(BOLD);
  const cursor = (frameCount % 60 < 30) ? '|' : ' ';
  text(_enteredName + cursor, width/2, boxY + boxH/2);
  textStyle(NORMAL);

  fill(_theme.muted);
  textSize(13);
  text('ENTER to save · ESC to skip · BACKSPACE to edit',
       width/2, boxY + boxH + 30);

  camera.on(); pop();
}


// ============================================================
//  How to Play screen
// ============================================================
function _drawHowToPlay() {
  if (_justEnteredScene) _howtoScroll = 0;

  push(); camera.off();

  textAlign(CENTER, CENTER);
  fill(_theme.text);
  textSize(40); textStyle(BOLD);
  text('How to Play', width/2, 70);
  textStyle(NORMAL);

  const controls   = _resolveControlsList();
  const viewTop    = 115;
  const viewBot    = height - 100;
  const viewH      = viewBot - viewTop;
  const maxTextW   = width - 120;
  const bodyLineH  = 24;
  const headerH    = 38;
  const blankH     = 14;

  // Pre-compute layout: for each control entry, decide kind and measured height
  const layout = [];
  for (const raw of controls) {
    const trimmed = String(raw).trim();
    if (trimmed.length === 0) {
      layout.push({ kind: 'blank', height: blankH });
      continue;
    }
    const headerText = _parseHeader(trimmed);
    if (headerText) {
      layout.push({ kind: 'header', text: headerText, height: headerH });
      continue;
    }
    // Body line — word-wrap (textWidth needs textSize set first)
    textSize(18);
    const wrapped = _wrapText(trimmed, maxTextW);
    layout.push({ kind: 'body', lines: wrapped, height: wrapped.length * bodyLineH + 6 });
  }

  const contentH  = layout.reduce((sum, e) => sum + e.height, 0);
  const maxScroll = Math.max(0, contentH - viewH);

  if (keyIsDown(UP_ARROW))   _howtoScroll -= 4;
  if (keyIsDown(DOWN_ARROW)) _howtoScroll += 4;
  _howtoScroll = constrain(_howtoScroll, 0, maxScroll);

  // Clip rendering to the visible band
  drawingContext.save();
  drawingContext.beginPath();
  drawingContext.rect(0, viewTop, width, viewH);
  drawingContext.clip();

  let y = viewTop + 6 - _howtoScroll;
  for (const entry of layout) {
    const top = y;
    const bot = y + entry.height;
    if (bot >= viewTop - 40 && top <= viewBot + 40) {  // visible-band check
      if (entry.kind === 'header') {
        textAlign(CENTER, CENTER);
        fill(_theme.accent);
        textStyle(BOLD);
        textSize(20);
        text(entry.text, width/2, y + 14);
        // Divider underneath
        stroke(_theme.muted);
        strokeWeight(1);
        const lw = Math.min(maxTextW, 280);
        line(width/2 - lw/2, y + 30, width/2 + lw/2, y + 30);
        noStroke();
        textStyle(NORMAL);
      } else if (entry.kind === 'body') {
        textAlign(CENTER, CENTER);
        fill(_theme.text);
        textSize(18);
        for (let i = 0; i < entry.lines.length; i++) {
          text(entry.lines[i], width/2, y + 14 + i * bodyLineH);
        }
      }
      // 'blank' entries draw nothing — they're just spacing
    }
    y += entry.height;
  }
  drawingContext.restore();

  // Scroll indicators when there's content above / below the view
  if (maxScroll > 0) {
    const pulse = 0.6 + 0.4 * Math.abs(Math.sin(frameCount * 0.12));
    fill(_theme.muted);
    textAlign(CENTER, CENTER);
    textSize(14);
    if (_howtoScroll > 1) {
      const c = color(_theme.muted);
      fill(red(c), green(c), blue(c), 255 * pulse);
      text('▲', width/2, viewTop - 4);
    }
    if (_howtoScroll < maxScroll - 1) {
      const c = color(_theme.muted);
      fill(red(c), green(c), blue(c), 255 * pulse);
      text('▼', width/2, viewBot + 14);
    }
    // Subtle hint about how to scroll
    fill(_theme.muted);
    textSize(11);
    text('↑ ↓ or scroll wheel', width/2, viewBot + 32);
  }

  // "Back" — always-highlighted single menu item with animated arrows
  const cx = width / 2;
  const backY = height - 50;

  fill(_theme.accent);
  textAlign(CENTER, CENTER);
  textSize(26);
  textStyle(BOLD);
  text('Back', cx, backY);
  textStyle(NORMAL);

  const dx = 6 * Math.abs(Math.sin(frameCount * 0.12));
  textSize(20);
  text('▶', cx - 70 - dx, backY);
  text('◀', cx + 70 + dx, backY);

  camera.on(); pop();
}


// ============================================================
//  Playing
// ============================================================
function _startGame() {
  allSprites.removeAll();
  score = 0;
  _displayScore = 0;
  if (_cfg.startLives > 0) lives = _cfg.startLives;
  _popups = [];
  _shake = { intensity: 0, until: 0 };
  _newHighEntryIndex = -1;
  // Time limit precedence: explicit settings choice > GAME_CONFIG.timeLimit
  let activeTimeLimit;
  const tc = settings.timeChoice || 'default';
  if      (tc === 'default') activeTimeLimit = _cfg.timeLimit || 0;
  else if (tc === 'off')     activeTimeLimit = 0;
  else                       activeTimeLimit = parseInt(tc, 10) || 0;
  _timeLimitMs   = (activeTimeLimit > 0) ? activeTimeLimit * 1000 : 0;
  _timeRemaining = _timeLimitMs;
  _timeUpFired   = false;
  world.timeScale = 1;
  _changeState(STATE_PLAYING);
  if (typeof onGameStart === 'function') onGameStart();

  // Music: _updateMusicSync runs every draw frame and will pick the right
  // source for settings.musicChoice. Calling it here once kicks the music in
  // immediately, no first-frame gap.
  _updateMusicSync();
}

function _tickGame() {
  if (typeof onGameDrawBackground === 'function') onGameDrawBackground();
  if (typeof onGameUpdate         === 'function') onGameUpdate();
  if (typeof onGameDraw           === 'function') onGameDraw();
  _drawHUD();

  // Tick the run timer last, so the player's last-frame scoring counts.
  if (_timeLimitMs > 0 && !_timeUpFired) {
    _timeRemaining -= deltaTime;
    if (_timeRemaining <= 0) {
      _timeRemaining = 0;
      _timeUpFired = true;
      popupText('TIME!', width/2, height/2 - 60, _theme.accent);
      endGame();
    }
  }
}

function getTimeRemaining() {
  return Math.max(0, _timeRemaining);
}

function addTime(seconds) {
  if (_timeLimitMs <= 0 || _timeUpFired) return;
  _timeRemaining = Math.max(0, _timeRemaining + seconds * 1000);
  if (seconds > 0)      popupText(`+${seconds}s`, width/2, 44, _theme.accent);
  else if (seconds < 0) popupText(`${seconds}s`,  width/2, 44, _theme.danger);
}

function _drawHUD() {
  push(); camera.off();

  // Timer always renders when enabled, regardless of custom HUD overrides
  if (_timeLimitMs > 0) _drawTimer();

  if (typeof drawCustomHud === 'function') {
    drawCustomHud();
  } else {
    noStroke();
    textSize(18);
    textStyle(BOLD);

    fill(_theme.text);
    textAlign(LEFT, TOP);
    text(`Score  ${Math.floor(_displayScore).toLocaleString()}`, 14, 12);

    if (_cfg.startLives > 0) {
      textAlign(LEFT, TOP);
      fill(_theme.danger);
      text('♥'.repeat(Math.max(0, lives)), 14, 38);
    }

    fill(_theme.muted);
    textAlign(RIGHT, TOP);
    textSize(14);
    text(`HI  ${highScore.toLocaleString()}`, width - 14, 14);

    textStyle(NORMAL);
  }

  camera.on(); pop();
}

function addScore(n) { score += n; }

function _drawTimer() {
  const ms = Math.max(0, _timeRemaining);
  const totalSec = Math.ceil(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  const timeStr = `${m}:${s.toString().padStart(2, '0')}`;
  const lowTime = ms < 10000;

  push();
  textAlign(CENTER, TOP);
  textSize(20);
  textStyle(BOLD);
  if (lowTime) {
    const pulse = 200 + Math.sin(frameCount * 0.4) * 55;
    const c = color(_theme.danger);
    fill(red(c), green(c), blue(c), pulse);
  } else {
    fill(_theme.text);
  }
  text(timeStr, width / 2, 10);
  textStyle(NORMAL);
  pop();
}

function setLives(n) {
  lives = n;
  if (lives <= 0 && state === STATE_PLAYING) endGame();
}
function loseLife() { setLives(lives - 1); }
function addLife()  { setLives(lives + 1); }

function endGame() {
  if (typeof onGameEnd === 'function') onGameEnd(score);
  stopMusic();
  _stopThemeMusic();
  _activeTrack = null;
  _assetMusicVol = 0;
  screenShake(6, 350);

  if (_qualifiesForHighScore(score)) {
    _pendingHighScore = score;
    _enteredName = '';
    playSfx('highScore');
    _changeState(STATE_ENTER_NAME);
  } else {
    _newHighEntryIndex = -1;
    playSfx('gameOver');
    _changeState(STATE_GAME_OVER);
  }
}

function _qualifiesForHighScore(s) {
  if (s <= 0) return false;
  if (highScores.length < HIGH_SCORE_LIMIT) return true;
  return s > highScores[highScores.length - 1].score;
}

function _refreshHighScore() {
  highScore = (highScores.length > 0) ? highScores[0].score : 0;
}

function _submitHighScore(name) {
  const cleanName = (name || '').trim().slice(0, HIGH_SCORE_NAME_MAX) || 'Anon';
  const entry = { name: cleanName, score: _pendingHighScore };
  highScores.push(entry);
  highScores.sort((a, b) => b.score - a.score);
  highScores = highScores.slice(0, HIGH_SCORE_LIMIT);
  _newHighEntryIndex = highScores.indexOf(entry);
  _refreshHighScore();
  saveProgress();
  playSfx('confirm');
  _changeState(STATE_GAME_OVER);
}


// ============================================================
//  Pause
// ============================================================
const PAUSE_MENU = ['pause_resume', 'pause_settings', 'pause_quit'];

function _drawPaused() {
  // Draw the frozen game underneath
  if (typeof onGameDrawBackground === 'function') onGameDrawBackground();
  if (typeof onGameDraw           === 'function') onGameDraw();
  _drawHUD();

  // Dim overlay
  push(); camera.off();
  fill(0, 0, 0, 200); rect(0, 0, width, height);

  textAlign(CENTER, CENTER);
  fill(_theme.text);
  textSize(40); textStyle(BOLD);
  text('Paused', width/2, height/2 - 100);
  textStyle(NORMAL);

  const items = [
    { id: 'pause_resume',   label: 'Resume',    y: height/2 - 20 },
    { id: 'pause_settings', label: 'Settings',  y: height/2 + 30 },
    { id: 'pause_quit',     label: 'Home',      y: height/2 + 80 },
  ];
  _drawMenu(items, PAUSE_MENU);

  camera.on(); pop();
}

function _activatePauseItem() {
  const id = PAUSE_MENU[_menuIndex.pause];
  if (id === 'pause_resume')   _resume();
  if (id === 'pause_settings') _openSettings();
  if (id === 'pause_quit')     _quitToTitle();
}

function _pause() {
  if (state !== STATE_PLAYING) return;
  world.timeScale = 0;
  _changeState(STATE_PAUSED);
  if (typeof onPause === 'function') onPause();
}

function _resume() {
  if (state !== STATE_PAUSED) return;
  world.timeScale = 1;
  _changeState(STATE_PLAYING);
  if (typeof onResume === 'function') onResume();
}

function _quitToTitle() {
  allSprites.removeAll();
  world.timeScale = 1;
  stopMusic();
  _stopThemeMusic();
  _activeTrack = null;
  _assetMusicVol = 0;
  _changeState(STATE_TITLE);
}


// ============================================================
//  Settings
// ============================================================
const MUSIC_CHOICES       = ['game', 'arcade', 'retro', 'neon', 'space', 'off'];
const MUSIC_CHOICE_LABELS = {
  game:   'Game Music',
  arcade: 'Arcade',
  retro:  'Retro',
  neon:   'Neon',
  space:  'Space',
  off:    'Off',
};

// 'game' only shows up in the cycle list when the game actually loaded an asset.
function _activeMusicChoices() {
  if (_sounds && _sounds.music) return MUSIC_CHOICES;
  return MUSIC_CHOICES.filter(c => c !== 'game');
}

function _itemOptions(item) {
  if (typeof item.options === 'function') return item.options();
  return item.options || [];
}

const TIME_CHOICES       = ['default', 'off', '30', '60', '120', '180', '300', '600'];
const TIME_CHOICE_LABELS = {
  off:     'Untimed',
  '30':    '30 seconds',
  '60':    '1 minute',
  '120':   '2 minutes',
  '180':   '3 minutes',
  '300':   '5 minutes',
  '600':   '10 minutes',
};

function _formatTimeChoiceLabel(key) {
  if (key !== 'default') return TIME_CHOICE_LABELS[key] || key;
  // Resolve "default" to whatever the game actually declared.
  const t = (_cfg && _cfg.timeLimit) || 0;
  if (t <= 0) return 'Untimed';
  const exact = TIME_CHOICE_LABELS[String(t)];
  if (exact) return exact;
  const m = Math.floor(t / 60), s = t % 60;
  return s === 0 ? `${m} minute${m === 1 ? '' : 's'}` : `${m}:${s.toString().padStart(2, '0')}`;
}

function _formatMusicChoiceLabel(key) {
  return MUSIC_CHOICE_LABELS[key] || key;
}

const SETTINGS_ITEMS = [
  { id: 'time',   kind: 'select', label: 'Time Limit',
    options: TIME_CHOICES, resolveLabel: _formatTimeChoiceLabel,
    get: () => settings.timeChoice,
    set: v => { settings.timeChoice = v; } },
  { id: 'master', kind: 'slider', label: 'Master Volume',
    get: () => settings.masterVolume, set: v => { settings.masterVolume = v; } },
  { id: 'music',  kind: 'slider', label: 'Music Volume',
    get: () => settings.musicVolume,  set: v => { settings.musicVolume  = v; } },
  { id: 'track',  kind: 'select', label: 'Music Track',
    options: _activeMusicChoices, resolveLabel: _formatMusicChoiceLabel,
    get: () => settings.musicChoice,
    set: v => { settings.musicChoice = v; } },
  { id: 'sfx',    kind: 'slider', label: 'SFX Volume',
    get: () => settings.sfxVolume,    set: v => { settings.sfxVolume    = v; } },
  { id: 'back',   kind: 'action', label: 'Back',
    action: () => _closeSettings() },
];

function _openSettings() {
  _prevState = state;
  _menuIndex.settings = 0;        // always land on the first row
  _changeState(STATE_SETTINGS);
}
function _closeSettings() {
  saveProgress();
  _applyVolumesToMusic();
  _changeState(_prevState || STATE_TITLE);
}

function _drawSettings() {
  push(); camera.off();

  textAlign(CENTER, CENTER);
  fill(_theme.text);
  textSize(40); textStyle(BOLD);
  text('Settings', width/2, 70);
  textStyle(NORMAL);

  const startY = 130;
  const rowH   = 50;
  const cx     = width / 2;

  // Mouse hover detection
  _menuHover = -1;
  for (let i = 0; i < SETTINGS_ITEMS.length; i++) {
    const y = startY + i * rowH;
    if (mouseX > cx - 280 && mouseX < cx + 280 &&
        mouseY > y - 22  && mouseY < y + 22) _menuHover = i;
  }
  // Only let mouse-hover override the keyboard cursor when the mouse moves
  // to a *different* row — prevents a stationary mouse from undoing arrow-key
  // navigation every frame.
  if (_menuHover >= 0 && _menuHover !== _prevMenuHover) {
    _menuIndex.settings = _menuHover;
  }

  for (let i = 0; i < SETTINGS_ITEMS.length; i++) {
    const item = SETTINGS_ITEMS[i];
    const y = startY + i * rowH;
    const isSel = (i === _menuIndex.settings);
    const labelColor = isSel ? _theme.accent : _theme.text;

    if (item.kind === 'slider') {
      // Slider row: label on left, slider on right
      textAlign(LEFT, CENTER);
      textSize(isSel ? 22 : 19);
      if (isSel) textStyle(BOLD);
      fill(labelColor);
      text(item.label, cx - 220, y);
      textStyle(NORMAL);

      const v = item.get();
      const sx = cx + 20, sw = 200;
      _drawBar(sx, y - 8, sw, 16, v, isSel);
      fill(_theme.muted);
      textAlign(LEFT, CENTER);
      textSize(14);
      text(`${Math.round(v * 100)}%`, sx + sw + 12, y);

      if (isSel && mouseIsPressed && mouseX >= sx && mouseX <= sx + sw) {
        item.set(constrain((mouseX - sx) / sw, 0, 1));
      }
      if (isSel) {
        if (keyIsDown(LEFT_ARROW))  item.set(Math.max(0, v - 0.01));
        if (keyIsDown(RIGHT_ARROW)) item.set(Math.min(1, v + 0.01));
      }
    } else if (item.kind === 'select') {
      // Select row: label on left, current option (with ◀ ▶) on right
      textAlign(LEFT, CENTER);
      textSize(isSel ? 22 : 19);
      if (isSel) textStyle(BOLD);
      fill(labelColor);
      text(item.label, cx - 220, y);
      textStyle(NORMAL);

      const cur   = item.get();
      let label;
      if (typeof item.resolveLabel === 'function') label = item.resolveLabel(cur);
      else if (item.optionLabels)                  label = item.optionLabels[cur] || cur;
      else                                         label = cur;
      textAlign(CENTER, CENTER);
      textSize(isSel ? 18 : 16);
      fill(isSel ? _theme.accent : _theme.text);
      text(label, cx + 100, y);
      if (isSel) {
        fill(_theme.accent);
        textSize(14);
        text('◀', cx + 30,  y);
        text('▶', cx + 170, y);
      }
    } else {
      // Action / button row: centered
      textAlign(CENTER, CENTER);
      textSize(isSel ? 26 : 22);
      if (isSel) textStyle(BOLD);
      fill(labelColor);
      text(item.label, cx, y);
      textStyle(NORMAL);
    }

    // Animated selector arrows around the row
    if (isSel) {
      const dx = 6 * Math.abs(Math.sin(frameCount * 0.12));
      fill(_theme.accent);
      textAlign(CENTER, CENTER);
      textSize(20);
      text('▶', cx - 270 - dx, y);
      text('◀', cx + 270 + dx, y);
    }
  }

  fill(_theme.muted);
  textSize(13);
  textAlign(CENTER, CENTER);
  text('↑ ↓ navigate · ← → adjust · ENTER / click on Back', width/2, height - 30);

  camera.on(); pop();
}

function _activateSettingsItem() {
  const item = SETTINGS_ITEMS[_menuIndex.settings];
  if (item.action) item.action();
}


// ============================================================
//  Game over
// ============================================================
const GAME_OVER_MENU = ['go_again', 'go_quit'];

function _drawGameOver() {
  push(); camera.off();

  fill(0, 0, 0, 160); rect(0, 0, width, height);

  textAlign(CENTER, CENTER);
  textStyle(BOLD);

  fill(_theme.danger);
  textSize(48);
  text('Game Over', width/2, 70);

  fill(_theme.text);
  textSize(20);
  text(`Score   ${score.toLocaleString()}`, width/2, 112);
  textStyle(NORMAL);

  // Top scores — highlight the entry the player just earned
  _drawTopScores(width/2, 145, _newHighEntryIndex);

  const items = [
    { id: 'go_again', label: 'Play Again',  y: 320 },
    { id: 'go_quit',  label: 'Home',        y: 370 },
  ];
  _drawMenu(items, GAME_OVER_MENU);

  camera.on(); pop();
}

function _activateGameOverItem() {
  const id = GAME_OVER_MENU[_menuIndex.game_over];
  if (id === 'go_again') _startGame();
  if (id === 'go_quit')  _quitToTitle();
}


// ============================================================
//  Generic menu drawing + input
// ============================================================
function _drawMenu(items, ids) {
  const cx = width / 2;

  // Mouse hover updates selection
  _menuHover = -1;
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    if (mouseX > cx - 150 && mouseX < cx + 150 &&
        mouseY > it.y - 22 && mouseY < it.y + 22) {
      _menuHover = i;
    }
  }
  if (_menuHover >= 0 && _menuHover !== _prevMenuHover) {
    _setMenuIndex(state, _menuHover);
  }

  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    const isSel = (i === _getMenuIndex(state));
    const c = isSel ? _theme.accent : _theme.text;
    fill(c);
    textAlign(CENTER, CENTER);
    textSize(isSel ? 26 : 22);
    if (isSel) textStyle(BOLD);
    text(it.label, cx, it.y);
    textStyle(NORMAL);

    if (isSel) {
      const dx = 6 * Math.abs(Math.sin(frameCount * 0.12));
      fill(_theme.accent);
      textSize(20);
      text('▶', cx - 100 - dx, it.y);
      text('◀', cx + 100 + dx, it.y);
    }
  }
}

function _getMenuIndex(s) {
  if (s === STATE_TITLE)     return _menuIndex.title;
  if (s === STATE_PAUSED)    return _menuIndex.pause;
  if (s === STATE_SETTINGS)  return _menuIndex.settings;
  if (s === STATE_GAME_OVER) return _menuIndex.game_over;
  return 0;
}

function _setMenuIndex(s, i) {
  if (s === STATE_TITLE)     _menuIndex.title     = i;
  if (s === STATE_PAUSED)    _menuIndex.pause     = i;
  if (s === STATE_SETTINGS)  _menuIndex.settings  = i;
  if (s === STATE_GAME_OVER) _menuIndex.game_over = i;
}

function _menuLength(s) {
  if (s === STATE_TITLE)     return TITLE_MENU.length;
  if (s === STATE_PAUSED)    return PAUSE_MENU.length;
  if (s === STATE_SETTINGS)  return SETTINGS_ITEMS.length;
  if (s === STATE_GAME_OVER) return GAME_OVER_MENU.length;
  return 0;
}

function _activateCurrentMenuItem() {
  if (state === STATE_TITLE)     _activateTitleItem();
  if (state === STATE_PAUSED)    _activatePauseItem();
  if (state === STATE_SETTINGS)  _activateSettingsItem();
  if (state === STATE_GAME_OVER) _activateGameOverItem();
}


// ============================================================
//  Input handlers
// ============================================================
function keyPressed() {
  _unlockAudio();

  // Global mute toggle — works in any state except name entry
  // (where 'm' is a typeable name character)
  if ((key === 'm' || key === 'M') && state !== STATE_ENTER_NAME) {
    if (settings.masterVolume > 0) {
      _preMuteVolume = settings.masterVolume;
      settings.masterVolume = 0;
      popupText('Muted', width/2, 60, _theme.muted);
    } else {
      settings.masterVolume = _preMuteVolume || 0.8;
      popupText('Unmuted', width/2, 60, _theme.muted);
    }
    saveProgress();
    _applyVolumesToMusic();
    return;
  }

  // Name-entry screen — handle this before anything else
  if (state === STATE_ENTER_NAME) {
    if (keyCode === ENTER || keyCode === RETURN) { _submitHighScore(_enteredName); return false; }
    if (keyCode === ESCAPE)                      { _submitHighScore('');           return false; }
    if (keyCode === BACKSPACE) {
      if (_enteredName.length > 0) {
        _enteredName = _enteredName.slice(0, -1);
        playSfx('menu');
      }
      return false;   // prevent browser back-navigation on Backspace
    }
    if (typeof key === 'string' && key.length === 1 &&
        _enteredName.length < HIGH_SCORE_NAME_MAX &&
        /[A-Za-z0-9 _\-]/.test(key)) {
      _enteredName += key;
      playSfx('menu');
    }
    return false;
  }

  // Pause toggle is universal during play / paused
  if ((key === 'p' || key === 'P') && state === STATE_PLAYING) { _pause(); return; }
  if ((key === 'p' || key === 'P') && state === STATE_PAUSED)  { _resume(); return; }
  if (keyCode === ESCAPE) {
    if (state === STATE_PLAYING)    { _pause(); return; }
    if (state === STATE_SETTINGS)   { _closeSettings(); return; }
    if (state === STATE_PAUSED)     { _resume(); return; }
    if (state === STATE_HOW_TO_PLAY){ playSfx('menu'); _changeState(STATE_TITLE); return; }
  }

  // How-to-play screen: any key returns to title
  if (state === STATE_HOW_TO_PLAY) {
    if (key === 'b' || key === 'B' ||
        keyCode === ENTER || keyCode === RETURN || key === ' ') {
      playSfx('menu');
      _changeState(STATE_TITLE);
    }
    return;
  }

  if (_isMenuState(state)) {
    const len = _menuLength(state);
    if (keyCode === UP_ARROW) {
      _setMenuIndex(state, (_getMenuIndex(state) - 1 + len) % len);
      playSfx('menu');
      _navHoldDir = -1;
      _navHoldRepeatAt = millis() + NAV_HOLD_DELAY;
    }
    if (keyCode === DOWN_ARROW) {
      _setMenuIndex(state, (_getMenuIndex(state) + 1) % len);
      playSfx('menu');
      _navHoldDir = 1;
      _navHoldRepeatAt = millis() + NAV_HOLD_DELAY;
    }
    if (keyCode === ENTER || keyCode === RETURN || key === ' ') {
      playSfx('confirm');
      _activateCurrentMenuItem();
    }
  }

  // Settings: one-shot Left/Right cycles through options on `select` items.
  // (Sliders use keyIsDown for continuous adjust, so they don't conflict here.)
  if (state === STATE_SETTINGS &&
      (keyCode === LEFT_ARROW || keyCode === RIGHT_ARROW)) {
    const item = SETTINGS_ITEMS[_menuIndex.settings];
    if (item && item.kind === 'select') {
      const dir = (keyCode === RIGHT_ARROW) ? 1 : -1;
      const opts = _itemOptions(item);
      const idx = opts.indexOf(item.get());
      const newIdx = ((idx < 0 ? 0 : idx) + dir + opts.length) % opts.length;
      item.set(opts[newIdx]);
      playSfx('menu');
    }
  }
}

function mouseWheel(event) {
  if (state === STATE_HOW_TO_PLAY) {
    _howtoScroll += event.delta * 0.6;
    return false;   // prevent the page itself from scrolling
  }
}

function mousePressed() {
  _unlockAudio();
  if (_justEnteredScene) return;

  if (state === STATE_HOW_TO_PLAY) {
    playSfx('menu');
    _changeState(STATE_TITLE);
    return;
  }

  if (state === STATE_TITLE || state === STATE_PAUSED || state === STATE_GAME_OVER) {
    if (_menuHover >= 0) {
      _setMenuIndex(state, _menuHover);   // honor where the user actually clicked
      playSfx('confirm');
      _activateCurrentMenuItem();
    }
  } else if (state === STATE_SETTINGS) {
    // Sync the keyboard cursor to the row that was clicked
    if (_menuHover >= 0) _menuIndex.settings = _menuHover;

    const item = SETTINGS_ITEMS[_menuIndex.settings];

    // Click-to-cycle on a select row: left half of the option area = previous,
    // right half = next. Covers both the ◀ ▶ glyphs and the value label.
    if (item && item.kind === 'select') {
      const cx = width / 2;
      const startY = 130, rowH = 50;
      const rowY = startY + _menuIndex.settings * rowH;
      if (mouseY > rowY - 24 && mouseY < rowY + 24 &&
          mouseX > cx + 0   && mouseX < cx + 200) {
        const dir = (mouseX < cx + 100) ? -1 : 1;
        const opts = _itemOptions(item);
        const idx = opts.indexOf(item.get());
        const newIdx = ((idx < 0 ? 0 : idx) + dir + opts.length) % opts.length;
        item.set(opts[newIdx]);
        playSfx('menu');
        return;
      }
    }

    if (item && item.action) {
      playSfx('confirm');
      _activateSettingsItem();
    }
  }
}


// ============================================================
//  Visual effects
// ============================================================
function popupText(txt, x, y, col) {
  _popups.push({
    text: String(txt),
    x, y,
    vy: -0.8,
    life: 60,
    age: 0,
    color: col || _theme.accent,
  });
}

function _drawPopups() {
  push();
  for (let i = _popups.length - 1; i >= 0; i--) {
    const p = _popups[i];
    p.y += p.vy;
    p.vy *= 0.97;
    p.age++;
    const t = p.age / p.life;
    const a = 255 * (1 - t);
    const c = color(p.color);
    fill(red(c), green(c), blue(c), a);
    noStroke();
    textAlign(CENTER, CENTER);
    textStyle(BOLD);
    textSize(20 + t * 6);
    text(p.text, p.x, p.y);
    if (p.age >= p.life) _popups.splice(i, 1);
  }
  textStyle(NORMAL);
  pop();
}

function screenShake(intensity, durationMs) {
  _shake.intensity = Math.max(_shake.intensity, intensity);
  _shake.until     = millis() + durationMs;
}

function _applyShake() {
  if (millis() < _shake.until && _shake.intensity > 0) {
    camera.x = width  / 2 + random(-_shake.intensity, _shake.intensity);
    camera.y = height / 2 + random(-_shake.intensity, _shake.intensity);
  } else {
    camera.x = width  / 2;
    camera.y = height / 2;
    _shake.intensity = 0;
  }
}

function _drawBar(x, y, w, h, pct, highlighted) {
  push();
  noFill();
  stroke(highlighted ? _theme.accent : _theme.muted);
  strokeWeight(highlighted ? 2 : 1);
  rect(x, y, w, h, 4);
  noStroke();
  fill(highlighted ? _theme.accent : _theme.primary);
  rect(x + 1, y + 1, Math.max(0, (w - 2) * pct), h - 2, 3);
  pop();
}


// ============================================================
//  Sound
// ============================================================
function _effectiveVolume(channel) {
  const ch = (channel === 'music') ? settings.musicVolume : settings.sfxVolume;
  return Math.max(0, Math.min(1, settings.masterVolume * ch));
}

// ----- Web Audio synthesis (no asset files required) --------
let _audioCtx = null;
function _ac() {
  if (!_audioCtx) {
    try { _audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
    catch (e) { return null; }
  }
  return _audioCtx;
}

let _audioUnlocked = false;
function _unlockAudio() {
  if (_audioUnlocked) return;
  const ctx = _ac();
  if (ctx && ctx.state === 'suspended') ctx.resume();
  _audioUnlocked = true;
}

function _beep(freq, duration, vol, type) {
  const ctx = _ac();
  if (!ctx) return;
  const v = Math.max(0.0001, vol * _effectiveVolume('sfx'));
  const osc  = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type || 'sine';
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(v, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + duration);
}

function _sweep(freqStart, freqEnd, duration, vol, type) {
  const ctx = _ac();
  if (!ctx) return;
  const v = Math.max(0.0001, vol * _effectiveVolume('sfx'));
  const osc  = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type || 'sawtooth';
  osc.frequency.setValueAtTime(freqStart, ctx.currentTime);
  // exponentialRampToValueAtTime gives a more natural pitch-glide curve;
  // its target must be > 0, so clamp the destination.
  osc.frequency.exponentialRampToValueAtTime(
    Math.max(40, freqEnd), ctx.currentTime + duration
  );
  gain.gain.setValueAtTime(v, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + duration);
}

function _synthSfx(name) {
  if (_effectiveVolume('sfx') <= 0) return;
  switch (name) {
    case 'menu':
      _beep(660, 0.05, 0.12, 'square');
      break;
    case 'confirm':
      _beep(880, 0.06, 0.16, 'square');
      setTimeout(() => _beep(1320, 0.08, 0.16, 'square'), 50);
      break;
    case 'score':
      _beep(880,  0.08, 0.18, 'triangle');
      setTimeout(() => _beep(1320, 0.12, 0.16, 'triangle'), 60);
      break;
    case 'lose':
    case 'miss':
      _beep(220, 0.18, 0.20, 'sawtooth');
      break;
    case 'highScore':
      _beep(880,  0.10, 0.20, 'triangle');
      setTimeout(() => _beep(1100, 0.10, 0.20, 'triangle'),  80);
      setTimeout(() => _beep(1320, 0.10, 0.20, 'triangle'), 160);
      setTimeout(() => _beep(1760, 0.32, 0.25, 'triangle'), 240);
      break;
    case 'gameOver':
      _beep(440, 0.14, 0.22, 'sawtooth');
      setTimeout(() => _beep(330, 0.14, 0.22, 'sawtooth'),  90);
      setTimeout(() => _beep(220, 0.50, 0.25, 'sawtooth'), 200);
      break;
    case 'laser': {
      // Classic "pew" — descending sawtooth sweep with a sparkly square
      // chirp riding on top. Slight random jitter so consecutive shots
      // don't sound identical.
      const f0 = 1200 + (Math.random() * 350 - 100);
      _sweep(f0,       200,       0.14, 0.16, 'sawtooth');
      setTimeout(() => _sweep(f0 * 1.7, f0 * 0.9, 0.04, 0.08, 'square'), 8);
      break;
    }
    default:
      _beep(440, 0.05, 0.10, 'sine');
  }
}

function playSfx(name) {
  // A loaded SoundFile (declared in GAME_CONFIG.sounds) wins over the synth.
  const s = _sounds[name];
  if (s && s.isLoaded && s.isLoaded()) {
    try {
      s.setVolume(_effectiveVolume('sfx'));
      s.play();
      return;
    } catch (e) { /* fall through to synthesizer */ }
  }
  _synthSfx(name);
}

// ----- Continuous tone (e.g. siren) -------------------------
//   Call setTone(freq, vol) every frame the tone should be active —
//   each call smoothly ramps the live oscillator's frequency and
//   gain toward the new targets. Call stopTone() to fade it out.
//   Volume is gated by the master + SFX sliders in settings.
let _tone = null;

function setTone(freq, vol) {
  const ctx = _ac();
  if (!ctx) return;
  const target = Math.max(0, vol) * _effectiveVolume('sfx');
  if (target <= 0) { stopTone(); return; }

  if (!_tone) {
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.value = freq;
    gain.gain.value = 0;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    _tone = { osc, gain };
  }
  _tone.osc.frequency.linearRampToValueAtTime(freq,   ctx.currentTime + 0.08);
  _tone.gain.gain.linearRampToValueAtTime(target,     ctx.currentTime + 0.06);
}

function stopTone() {
  if (!_tone) return;
  const ctx = _ac();
  const fade = 0.08;
  if (ctx) _tone.gain.gain.linearRampToValueAtTime(0, ctx.currentTime + fade);
  const t = _tone;
  _tone = null;
  setTimeout(() => { try { t.osc.stop(); } catch (e) {} }, fade * 1000 + 50);
}

function playMusic(name) {
  const s = _sounds[name];
  if (!s || !s.isLoaded || !s.isLoaded()) return;
  if (_music && _music.isPlaying && _music.isPlaying()) _music.stop();
  _music = s;
  try {
    _music.setLoop(true);
    _music.setVolume(_effectiveVolume('music'));
    _music.play();
  } catch (e) { /* ignore */ }
}

function stopMusic() {
  if (_music && _music.isPlaying && _music.isPlaying()) _music.stop();
  _music = null;
}

function _applyVolumesToMusic() {
  if (_music && _music.setVolume) _music.setVolume(_effectiveVolume('music'));
}

// ----- Procedural theme music ------------------------------
// Built on p5.sound: each phrase gets its own Oscillator + Envelope, all routed
// through a shared p5.Gain so we can fade the whole sub-mix in/out per state.
function _resolveThemeMusicName() {
  const choice = settings.musicChoice;
  if (!choice || choice === 'off') return null;
  if (MUSIC_CHOICES.indexOf(choice) >= 0) return choice;
  return _cfg.themePreset || 'arcade';            // fallback if a stale value somehow survived
}

function _startThemeMusic() {
  _stopThemeMusic();                                                // belt-and-suspenders cleanup
  if (typeof p5 === 'undefined' || typeof p5.Oscillator === 'undefined') return;  // p5.sound missing

  const themeName = _resolveThemeMusicName();
  if (themeName === null) return;                  // music explicitly off in settings
  const pattern = THEME_MUSIC[themeName] || THEME_MUSIC.default;
  if (!pattern || !pattern.phrases || pattern.phrases.length === 0) return;

  try {
    // Make sure p5.sound's audio context is running. Its context is separate
    // from the AudioContext we use for synth SFX, so unlocking ours doesn't
    // unlock p5.sound's. userStartAudio() resumes p5.sound's context.
    if (typeof userStartAudio === 'function') userStartAudio();

    _themeMixGain = new p5.Gain();
    _themeMixGain.connect();                       // explicit route to main output
    _themeMixGain.amp(0);
    _themeMixCurrent = 0;

    _themeVoices = [];
    let stepCount = 16;
    for (const spec of pattern.phrases) {
      stepCount = Math.max(stepCount, spec.sequence.length);

      const osc = new p5.Oscillator(spec.type || 'sine');
      osc.start();
      osc.disconnect();
      osc.connect(_themeMixGain);

      const env = new p5.Envelope();
      env.setADSR(spec.env[0], spec.env[1], spec.env[2], spec.env[3]);
      env.setRange(spec.gain || 0.1, 0);
      osc.amp(env);

      _themeVoices.push({
        osc, env,
        sequence:     spec.sequence.slice(),
        noteDuration: spec.noteDuration || 0,
      });
    }

    _themeStepDuration = (60000 / (pattern.bpm || 100)) * (pattern.stepLength || 1/8);
    _themeStepIndex    = 0;
    _themeBeatTimer    = 0;
  } catch (e) {
    console.warn('[framework] theme music init failed:', e);
    _stopThemeMusic();
  }
}

function _stopThemeMusic() {
  for (const v of _themeVoices) {
    try { v.osc.stop(); }       catch (e) { /* ignore */ }
    try { v.osc.disconnect(); } catch (e) { /* ignore */ }
  }
  _themeVoices = [];
  if (_themeMixGain) {
    try { _themeMixGain.amp(0); }       catch (e) { /* ignore */ }
    try { _themeMixGain.disconnect(); } catch (e) { /* ignore */ }
    _themeMixGain = null;
  }
  _themeMixCurrent   = 0;
  _themeStepIndex    = 0;
  _themeBeatTimer    = 0;
  _themeStepDuration = 0;
}

// Frame-driven beat scheduler. Replaces p5.Part for reliability — p5.Part can
// silently fail if the audio context isn't fully running when loop() is called.
function _isMusicPreviewing() {
  if (state !== STATE_SETTINGS) return false;
  const item = SETTINGS_ITEMS[_menuIndex.settings];
  return !!(item && item.id === 'track' && settings.musicChoice !== 'off');
}

function _tickThemeMusic() {
  if (_themeVoices.length === 0 || _themeStepDuration <= 0) return;
  if (state !== STATE_PLAYING && !_isMusicPreviewing()) return;

  _themeBeatTimer += deltaTime;
  while (_themeBeatTimer >= _themeStepDuration) {
    _themeBeatTimer -= _themeStepDuration;
    for (const v of _themeVoices) {
      const note = v.sequence[_themeStepIndex % v.sequence.length];
      if (note > 0) {
        try {
          v.osc.freq(midiToFreq(note));
          v.env.play(v.osc, 0, v.noteDuration);
        } catch (e) { /* ignore */ }
      }
    }
    _themeStepIndex++;
  }
}

// ----- Unified music dispatcher -----
// Each frame, _updateMusicSync compares what should be playing (settings.musicChoice
// and the current state) to what's currently allocated, and switches if needed.
// This handles asset music (`'game'`) and the four procedural presets through a
// single code path so the Music Track setting actually drives both.

function _desiredTrack() {
  if (_cfg.music === false) return null;
  const c = settings.musicChoice;
  if (!c || c === 'off')                  return null;
  if (c === 'game' && !_sounds.music)     return null;
  return c;
}

function _shouldPlayMusic() {
  return state === STATE_PLAYING || _isMusicPreviewing();
}

function _updateMusicSync() {
  const desired = _desiredTrack();

  // Track changed → tear down the old source and (if appropriate) start the new one
  if (_activeTrack !== desired) {
    if (_activeTrack === 'game')      stopMusic();
    else if (_activeTrack)             _stopThemeMusic();
    _activeTrack = null;
    _assetMusicVol = 0;

    if (desired && _shouldPlayMusic()) {
      if (desired === 'game') {
        playMusic('music');
        if (_music && _music.setVolume) {
          try { _music.setVolume(0); } catch (e) { /* ramp from 0 */ }
        }
        _activeTrack = 'game';
      } else {
        _startThemeMusic();
        _activeTrack = desired;
      }
    }
  } else if (desired && _activeTrack === null && _shouldPlayMusic()) {
    // Nothing allocated but we want to play (e.g., new game after explicit teardown)
    if (desired === 'game') {
      playMusic('music');
      if (_music && _music.setVolume) {
        try { _music.setVolume(0); } catch (e) { /* ramp from 0 */ }
      }
      _activeTrack = 'game';
    } else {
      _startThemeMusic();
      _activeTrack = desired;
    }
  }

  // Asset volume ramp (procedural is ramped by _updateThemeMusicMix)
  if (_activeTrack === 'game' && _music && _music.setVolume) {
    let target;
    if (state === STATE_PLAYING)         target = _effectiveVolume('music');
    else if (_isMusicPreviewing())       target = _effectiveVolume('music') * 0.7;
    else                                 target = 0;
    _assetMusicVol += (target - _assetMusicVol) * 0.12;
    if (_assetMusicVol < 0.0005 && target === 0) _assetMusicVol = 0;
    try { _music.setVolume(Math.max(0, _assetMusicVol)); } catch (e) { /* ignore */ }
  }
}

function _updateThemeMusicMix() {
  // Allocation is handled by _updateMusicSync; this function only ramps the
  // procedural sub-mix's gain to the right target each frame.
  if (!_themeMixGain) return;
  let target;
  if (state === STATE_PLAYING)        target = _effectiveVolume('music');
  else if (_isMusicPreviewing())      target = _effectiveVolume('music') * 0.7;   // a touch quieter for preview
  else                                target = 0;
  _themeMixCurrent += (target - _themeMixCurrent) * 0.12;
  if (_themeMixCurrent < 0.0005 && target === 0) _themeMixCurrent = 0;
  try { _themeMixGain.amp(Math.max(0, _themeMixCurrent)); } catch (e) { /* ignore */ }
}


// ============================================================
//  Persistence
// ============================================================
function loadProgress() {
  const raw = localStorage.getItem(_cfg.storageKey);
  if (!raw) return;
  try {
    const data = JSON.parse(raw);
    if (Array.isArray(data.highScores)) {
      highScores = data.highScores
        .filter(e => e && typeof e.score === 'number')
        .slice(0, HIGH_SCORE_LIMIT);
    } else if (typeof data.highScore === 'number' && data.highScore > 0) {
      // Migrate the old single-value format into a one-entry list
      highScores = [{ name: '—', score: data.highScore }];
    }
    if (data.settings) Object.assign(settings, data.settings);
  } catch (e) { /* ignore corrupted save */ }
  _refreshHighScore();
}

function saveProgress() {
  localStorage.setItem(
    _cfg.storageKey,
    JSON.stringify({ highScores, settings })
  );
}
