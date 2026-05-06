// ============================================================
//  Game Framework — interactive demo
// ============================================================
//
//  A small UFO shooting gallery. Aim with the mouse OR the arrow
//  keys, fire with click OR Space. Each shot fires four laser beams
//  from the corners of the screen, converging on your aim point.
//  UFOs cloak quickly — the smaller the saucer when you hit it, the
//  more points you score.
//
//  Demonstrates the framework helpers your game can use:
//      addScore, loseLife, popupText, screenShake, playSfx, getTheme
// ============================================================

const GAME_CONFIG = {
  title:        'Sample Game',
  storageKey:   'vcg_framework_demo',
  canvasWidth:  720,
  canvasHeight: 480,
  subtitle:     'A UFO shooting gallery demo of the game framework',
  background:   'stars',
  startLives:   5,
  controls: [
    'Mouse or arrow keys — aim',
    'Click or Space — fire',
    'Smaller UFOs are worth more points',
  ],
};


// ----- Game-specific state ----------------------------------
let target = null;
let targetLife = 0;

// Difficulty endpoints (lerped by getDifficulty()):
//   At low difficulty UFOs are slow, big-and-near-center, and stay
//   on screen for ~4 seconds. By max difficulty they're fast and
//   spawn anywhere with under 2 seconds to react.
const TARGET_LIFE_EASY = 240;
const TARGET_LIFE_HARD = 90;
const SPEED_MULT_EASY  = 0.35;
const SPEED_MULT_HARD  = 1.4;
const SPAWN_HALF_EASY  = 70;     // half-extent of spawn box around center
const DIFFICULTY_SCORE = 800;    // score at which difficulty hits 1.0

function getDifficulty() {
  return Math.min(1, score / DIFFICULTY_SCORE);
}

let crosshair = { x: 0, y: 0 };
let _lastMouseX = -1, _lastMouseY = -1;
let _wasMouseDown = false;
let _wasFireKeyDown = false;
const KEY_AIM_SPEED = 7;

// Player's shot — four converging lasers from the screen corners
let shots = [];
const SHOT_LIFETIME = 14;        // frames a beam stays visible


// ============================================================
//  Lifecycle
// ============================================================
function onGameStart() {
  target = null;
  crosshair.x = width / 2;
  crosshair.y = height / 2;
  _lastMouseX = mouseX;
  _lastMouseY = mouseY;
  _wasMouseDown = false;
  _wasFireKeyDown = false;
  shots = [];
  spawnTarget();
}

function spawnTarget() {
  const d = getDifficulty();

  // Restrict to slow styles at low difficulty so the player gets a clean look
  const slowStyles = ['drifter', 'orbiter'];
  const allStyles  = ['drifter', 'zigzag', 'streaker', 'orbiter'];
  const styles = (d < 0.3) ? slowStyles : allStyles;
  const style  = random(styles);

  // Spawn box grows with difficulty: tight cluster around center → full canvas
  const margin     = 110;
  const halfWmax   = width  / 2 - margin;
  const halfHmax   = height / 2 - margin;
  const halfW      = lerp(SPAWN_HALF_EASY, halfWmax, d);
  const halfH      = lerp(SPAWN_HALF_EASY, halfHmax, d);
  const x          = width  / 2 + random(-halfW, halfW);
  const y          = height / 2 + random(-halfH, halfH);

  const speedMult = lerp(SPEED_MULT_EASY, SPEED_MULT_HARD, d);
  let baseSpeed;
  if      (style === 'streaker') baseSpeed = random(3.0, 4.6);
  else if (style === 'zigzag')   baseSpeed = random(1.6, 2.6);
  else if (style === 'orbiter')  baseSpeed = random(0.6, 1.2);
  else                           baseSpeed = random(1.0, 2.2);   // drifter
  const speed = baseSpeed * speedMult;

  const angle = random(TWO_PI);

  target = {
    x, y,
    vx:           Math.cos(angle) * speed,
    vy:           Math.sin(angle) * speed,
    style,
    phase:        random(TWO_PI),
    homeX:        x,
    homeY:        y,
    orbitRadius:  random(30, 60),
    orbitSpeed:   random(0.04, 0.08) * (random() < 0.5 ? -1 : 1) * speedMult,
    wobbleAmp:    random(1.4, 2.4),
    d:            70,
    lifeMax:      Math.floor(lerp(TARGET_LIFE_EASY, TARGET_LIFE_HARD, d)),
  };
  targetLife = target.lifeMax;
}

function updateTargetMotion() {
  if (!target) return;

  target.phase += 0.06;

  if (target.style === 'orbiter') {
    target.phase += target.orbitSpeed - 0.06;          // cancel the +0.06 above for orbiters
    target.x = target.homeX + Math.cos(target.phase) * target.orbitRadius;
    target.y = target.homeY + Math.sin(target.phase) * target.orbitRadius;
    return;
  }

  // Linear styles: drifter / streaker / zigzag
  let dx = target.vx, dy = target.vy;
  if (target.style === 'zigzag') {
    const speed = Math.hypot(target.vx, target.vy) || 1;
    const perpX = -target.vy / speed;
    const perpY =  target.vx / speed;
    const w = Math.sin(target.phase * 2.2) * target.wobbleAmp;
    dx += perpX * w;
    dy += perpY * w;
  }
  target.x += dx;
  target.y += dy;

  // Bounce off the canvas edges
  const m = target.d / 2;
  if (target.x < m)             { target.x = m;             target.vx =  Math.abs(target.vx); }
  if (target.x > width  - m)    { target.x = width  - m;    target.vx = -Math.abs(target.vx); }
  if (target.y < m)             { target.y = m;             target.vy =  Math.abs(target.vy); }
  if (target.y > height - m)    { target.y = height - m;    target.vy = -Math.abs(target.vy); }
}

function fireShot(targetX, targetY, hit) {
  const corners = [[0, 0], [width, 0], [0, height], [width, height]];
  for (const [cx, cy] of corners) {
    shots.push({ x1: cx, y1: cy, x2: targetX, y2: targetY, age: 0, hit });
  }
}

function onGameUpdate() {
  if (!target) return;

  // ----- Aim: arrow keys move the crosshair; mouse motion overrides -----
  if (keyIsDown(LEFT_ARROW))  crosshair.x -= KEY_AIM_SPEED;
  if (keyIsDown(RIGHT_ARROW)) crosshair.x += KEY_AIM_SPEED;
  if (keyIsDown(UP_ARROW))    crosshair.y -= KEY_AIM_SPEED;
  if (keyIsDown(DOWN_ARROW))  crosshair.y += KEY_AIM_SPEED;

  if (mouseX !== _lastMouseX || mouseY !== _lastMouseY) {
    crosshair.x = mouse.x;
    crosshair.y = mouse.y;
  }
  _lastMouseX = mouseX;
  _lastMouseY = mouseY;

  crosshair.x = constrain(crosshair.x, 0, width);
  crosshair.y = constrain(crosshair.y, 0, height);

  // ----- UFO cloaks/shrinks and drifts over its lifetime -----
  targetLife--;
  updateTargetMotion();

  // ----- Age the visible shot beams -----
  for (let i = shots.length - 1; i >= 0; i--) {
    shots[i].age++;
    if (shots[i].age >= SHOT_LIFETIME) shots.splice(i, 1);
  }

  // ----- Fire: edge-detect mouse click and Space -----
  const mouseFire = mouseIsPressed && !_wasMouseDown;
  _wasMouseDown = mouseIsPressed;
  const fireKey = keyIsDown(32);   // space
  const keyFire = fireKey && !_wasFireKeyDown;
  _wasFireKeyDown = fireKey;

  if (mouseFire || keyFire) {
    const t = max(0.05, targetLife / target.lifeMax);
    const r = (target.d / 2) * t;
    const onTarget = dist(crosshair.x, crosshair.y, target.x, target.y) <= r;

    // Beams converge on the UFO if you're on target, else on the crosshair itself
    const aimX = onTarget ? target.x : crosshair.x;
    const aimY = onTarget ? target.y : crosshair.y;
    fireShot(aimX, aimY, onTarget);
    playSfx('laser');

    if (onTarget) {
      const points = round((1 - t) * 90) + 10;
      addScore(points);
      popupText('+' + points, target.x, target.y - 20, getTheme().accent);
      screenShake(3, 120);
      playSfx('score');
      stopTone();
      spawnTarget();
      return;
    }
  }

  // ----- UFO escaped without being shot -----
  if (targetLife <= 0) {
    popupText('Escaped', target.x, target.y, getTheme().danger);
    screenShake(7, 220);
    playSfx('miss');
    stopTone();
    loseLife();   // framework auto-ends the run when lives reaches 0
    if (lives > 0) spawnTarget();
    return;
  }

  // ----- Siren: pitch climbs as the UFO cloaks; tremolo for warble -----
  if (target && targetLife > 0) {
    const t = max(0.05, targetLife / target.lifeMax);
    const baseFreq = lerp(700, 130, t);                        // high when escaping, low when fresh
    const warble   = Math.sin(frameCount * 0.42) * 35;
    setTone(baseFreq + warble, 0.10);
  }
}

function onGameDraw() {
  // UFO + escape timer ring (drawn first so beams strike it visibly)
  if (target && targetLife > 0) {
    const t = max(0.05, targetLife / target.lifeMax);
    const bob = Math.sin(frameCount * 0.09 + target.phase) * 2.5 * t;
    drawUFO(target.x, target.y + bob, t, getTheme().primary);

    push();
    noFill();
    stroke(getTheme().accent);
    strokeWeight(3);
    const angle = (targetLife / target.lifeMax) * TWO_PI;
    arc(target.x, target.y, 92, 92, -HALF_PI, -HALF_PI + angle);
    pop();
  }

  // Player's shot beams from the four corners
  for (const s of shots) drawShot(s);

  // Rifle-scope crosshair on top of everything
  drawCrosshair(crosshair.x, crosshair.y);
}

function onGameEnd(finalScore) {
  // Framework handles high score, sound, and shake.
}


// ============================================================
//  Drawing helpers
// ============================================================
function drawUFO(x, y, scale, baseColor) {
  push();
  translate(x, y);
  noStroke();

  const w = 70 * scale;
  const h = 24 * scale;

  // Tractor beam (subtle glow downward)
  fill(180, 240, 255, 35);
  triangle(-w * 0.22, h * 0.4,
            w * 0.22, h * 0.4,
            0,        h * 0.4 + 38 * scale);

  // Dome (glass)
  fill(150, 200, 255, 210);
  ellipse(0, -h * 0.45, w * 0.55, h * 1.05);
  // Dome highlight
  fill(255, 255, 255, 140);
  ellipse(-w * 0.12, -h * 0.55, w * 0.18, h * 0.4);

  // Saucer body
  fill(baseColor);
  ellipse(0, 0, w, h);

  // Bottom rim shadow gives the saucer some depth
  fill(20, 30, 50, 200);
  ellipse(0, h * 0.35, w * 0.65, h * 0.32);

  // Pulsing perimeter lights
  const lightCount = 5;
  for (let i = 0; i < lightCount; i++) {
    const px = lerp(-w * 0.4, w * 0.4, i / (lightCount - 1));
    const pulse = 0.5 + 0.5 * Math.sin(frameCount * 0.15 + i * 0.7);
    const lc = (i % 2 === 0) ? color(255, 220, 100) : color(255, 130, 220);
    lc.setAlpha(150 + 105 * pulse);
    fill(lc);
    circle(px, 0, 5 * scale);
  }

  pop();
}

function drawShot(s) {
  const t = s.age / SHOT_LIFETIME;       // 0 (just fired) to 1 (gone)
  const fade = 1 - t;
  if (fade <= 0) return;

  const col = color(s.hit ? getTheme().accent : getTheme().danger);

  push();
  // Outer glow
  stroke(red(col), green(col), blue(col), 200 * fade);
  strokeWeight(8 * fade);
  line(s.x1, s.y1, s.x2, s.y2);

  // Bright core
  stroke(255, 255, 255, 240 * fade);
  strokeWeight(2.5 * fade);
  line(s.x1, s.y1, s.x2, s.y2);

  // Impact bloom at the convergence point on the first few frames
  if (s.age < 6) {
    noStroke();
    fill(red(col), green(col), blue(col), 160 * fade);
    circle(s.x2, s.y2, (16 + s.age * 4) * fade);
  }
  pop();
}

function drawCrosshair(x, y) {
  push();
  const danger = getTheme().danger;
  const c = color(danger);

  noFill();
  stroke(danger);
  strokeWeight(1.5);
  circle(x, y, 90);

  stroke(red(c), green(c), blue(c), 130);
  strokeWeight(1);
  circle(x, y, 46);

  stroke(danger);
  strokeWeight(2);
  line(x - 50, y, x - 14, y);
  line(x + 14, y, x + 50, y);
  line(x, y - 50, x, y - 14);
  line(x, y + 14, x, y + 50);

  noStroke();
  fill(danger);
  circle(x, y, 3);
  pop();
}
