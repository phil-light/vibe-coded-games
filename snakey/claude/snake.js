// ============================================================
//  SNAKE RUSH  –  pseudo-3D snake game in p5.js
//  Paste this into editor.p5js.org and click Play
// ============================================================

// — Snake —
//  Segments: { wx, wy, z }  –  all in 3-D world space
let snake       = [];
let snakeMaxLen = 30;
const BODY_DRIFT = 1.2;   // z units/frame each body seg drifts toward viewer

// — Pellets —
let pellets = [];
const PELLET_COUNT = 20;
const EAT_ZONE_Z   = 380; // pellets only edible below this z; shown as star

// — Particles (screen-space explosion debris) —
let particles = [];

// — Shared perspective constants —
const FL     = 280;
const FAR_Z  = 900;
const NEAR_Z =  40;

// Head z range: larger spread = more dramatic size change
const HEAD_FAR_Z  = 720;  // z when mouse is at canvas center  (small head)
const HEAD_NEAR_Z =  55;  // z when mouse is at canvas corner   (large head)

// — Score —
let score = 0;

// — Audio —
let audioCtx;
let nextNoteTime = 0;
let noteStep     = 0;
const TEMPO = 0.17;

const MELODY = [
  330, 392, 494, 392,
  440, 523, 494, 440,
  392, 494, 440, 392,
  330, 294, 330, 392,
];
const BASS = [82, 82, 98, 82];

const COLORS = [
  [255,  80,  80],
  [255, 165,  45],
  [240, 235,  55],
  [ 70, 235,  85],
  [ 55, 185, 255],
  [195,  80, 255],
];

// ============================================================
function setup() {
  createCanvas(800, 600);
  textFont('monospace');
  for (let i = 0; i < PELLET_COUNT; i++) {
    pellets.push(newPellet(true));
  }
}

// ============================================================
function draw() {
  background(8, 8, 22);

  drawTunnel();
  updateSnake();       // advance head to current mouse BEFORE collision check
  drawPellets();
  updateParticles();   // particles sit between pellets and snake
  drawSnake();
  drawHUD();

  if (audioCtx) scheduleAudio();
}

// ============================================================
//  TUNNEL
// ============================================================
function drawTunnel() {
  noFill();
  for (let r = 45; r < 530; r += 55) {
    let a = map(r, 45, 530, 20, 3);
    stroke(70, 100, 200, a);
    strokeWeight(10);
    ellipse(width / 2, height / 2, r * 2, r * 1.3);
  }
}

// ============================================================
//  PERSPECTIVE HELPERS
// ============================================================

//  Forward: 3-D world → screen + scale factor s = FL/z
function project(wx, wy, z) {
  let s = FL / z;
  return { x: width / 2 + wx * s, y: height / 2 + wy * s, s };
}

//  Inverse: mouse position → 3-D world point.
//  Screen-center distance controls z depth:
//    center → HEAD_FAR_Z (small/far),  corner → HEAD_NEAR_Z (large/close)
//  wx/wy are back-computed via inverse perspective divide.
function mouseToWorld() {
  let cx   = width  / 2;
  let cy   = height / 2;
  let d    = dist(mouseX, mouseY, cx, cy);
  let maxD = dist(0, 0, cx, cy);
  let z    = map(d, 0, maxD, HEAD_FAR_Z, HEAD_NEAR_Z);
  let s    = FL / z;
  return { wx: (mouseX - cx) / s, wy: (mouseY - cy) / s, z };
}

// ============================================================
//  PELLETS
// ============================================================
function newPellet(scatter) {
  let angle  = random(TWO_PI);
  let spread = random(25, 200);
  return {
    wx:    cos(angle) * spread,
    wy:    sin(angle) * spread,
    z:     scatter ? random(EAT_ZONE_Z + 80, FAR_Z) : FAR_Z,
    speed: random(2.5, 6),
    col:   floor(random(COLORS.length)),
  };
}

//  5-pointed star centered at (x, y)
function drawStar(x, y, outerR, innerR) {
  let angle = TWO_PI / 5;
  let half  = angle / 2;
  beginShape();
  for (let i = 0; i < 5; i++) {
    let a = -HALF_PI + i * angle;
    vertex(x + cos(a)        * outerR, y + sin(a)        * outerR);
    vertex(x + cos(a + half) * innerR, y + sin(a + half) * innerR);
  }
  endShape(CLOSE);
}

function drawPellets() {
  pellets.sort((a, b) => b.z - a.z);  // far → near

  for (let i = 0; i < pellets.length; i++) {
    let p      = pellets[i];
    p.z       -= p.speed;
    let proj   = project(p.wx, p.wy, p.z);
    let base   = 12 * proj.s;         // apparent radius at this depth
    let edible = p.z < EAT_ZONE_Z;

    // Cull
    if (p.z < NEAR_Z
     || proj.x < -80 || proj.x > width  + 80
     || proj.y < -80 || proj.y > height + 80) {
      pellets[i] = newPellet(false);
      continue;
    }

    // Eat check — only when in edible zone, and z-proximity required
    if (edible && snake.length > 0) {
      let head       = snake[0];
      let headProj   = project(head.wx, head.wy, head.z);
      let headRadius   = max(4, (FL / head.z) * 25 / 2); // matches drawSnake formula
      let pelletRadius = base / 2;
      // Screen-space only: if they visually overlap, they collide.
      // No z-proximity gate — it contradicts the star visual and breaks edge hits.
      if (dist(headProj.x, headProj.y, proj.x, proj.y) < headRadius + pelletRadius) {
        spawnExplosion(proj.x, proj.y, COLORS[p.col]);
        score++;
        snakeMaxLen += 15;
        pellets[i] = newPellet(false);
        onEat();
        continue;
      }
    }

    let c = COLORS[p.col];
    noStroke();

    if (edible) {
      // Star shape with gentle size pulse
      let pulse = 1 + 0.12 * sin(frameCount * 0.15 + i);
      let outer = base * 0.65 * pulse;
      let inner = outer * 0.42;
      // soft circular bloom
      fill(c[0], c[1], c[2], 40);
      ellipse(proj.x, proj.y, outer * 4, outer * 4);
      // star body
      fill(c[0], c[1], c[2], 210);
      drawStar(proj.x, proj.y, outer, inner);
      // specular
      fill(255, 255, 255, 160);
      ellipse(proj.x - outer * 0.28, proj.y - outer * 0.28, outer * 0.28, outer * 0.28);
    } else {
      // Circle — dimmer, indicating not yet edible
      fill(c[0], c[1], c[2], 22);
      ellipse(proj.x, proj.y, base * 2.4, base * 2.4);
      fill(c[0], c[1], c[2], 120);
      ellipse(proj.x, proj.y, base, base);
      fill(255, 255, 255, 70);
      ellipse(proj.x - base * 0.18, proj.y - base * 0.18, base * 0.33, base * 0.33);
    }
  }
}

// ============================================================
//  PARTICLES  –  screen-space debris on eat
// ============================================================
function spawnExplosion(x, y, col) {
  for (let i = 0; i < 18; i++) {
    let a     = random(TWO_PI);
    let speed = random(1.5, 7);
    particles.push({
      x, y,
      vx: cos(a) * speed,
      vy: sin(a) * speed,
      life:  1.0,
      decay: random(0.025, 0.06),
      col,
      size: random(3, 10),
    });
  }
}

function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    let p = particles[i];
    p.x    += p.vx;
    p.y    += p.vy;
    p.vx   *= 0.93;   // air drag
    p.vy   *= 0.93;
    p.life -= p.decay;
    if (p.life <= 0) { particles.splice(i, 1); continue; }

    let c = p.col;
    let s = p.size * p.life;
    noStroke();
    fill(c[0], c[1], c[2], p.life * 230);
    ellipse(p.x, p.y, s, s);
    // white core that fades quickly
    fill(255, 255, 255, p.life * p.life * 180);
    ellipse(p.x, p.y, s * 0.45, s * 0.45);
  }
}

// ============================================================
//  SNAKE  –  body segments drift toward viewer like pellets
// ============================================================
function updateSnake() {
  // Every existing segment moves slightly toward the viewer each frame
  for (let seg of snake) {
    seg.z = max(seg.z - BODY_DRIFT, NEAR_Z + 5);
  }
  // New head position from mouse (overwrites whatever z we just set for [0])
  snake.unshift(mouseToWorld());
  while (snake.length > snakeMaxLen) snake.pop();
}

function drawSnake() {
  if (snake.length < 2) return;

  // Project all segments once
  let proj = snake.map(seg => project(seg.wx, seg.wy, seg.z));

  // Ribbon: tail → head so head paints on top
  for (let i = snake.length - 1; i >= 1; i--) {
    let t    = 1 - i / snake.length;           // 0 at tail, 1 at head
    let avgS = (proj[i].s + proj[i - 1].s) / 2; // depth scale for this span
    let w    = max(1, avgS * (2 + t * 7));       // perspective-scaled width
    let g    = (85 + t * 170) | 0;               // green fades at tail
    stroke(30, g, 60, 215);
    strokeWeight(w);
    line(proj[i].x, proj[i].y, proj[i - 1].x, proj[i - 1].y);
  }

  // Head — multiplier 25 gives a dramatic 14× size range center-to-corner
  let hp       = proj[0];
  let headDiam = max(8, proj[0].s * 25);

  noStroke();
  fill( 55, 220,  95,  50); ellipse(hp.x, hp.y, headDiam * 2.4, headDiam * 2.4);
  fill( 75, 255, 115, 215); ellipse(hp.x, hp.y, headDiam,       headDiam      );

  // Eyes — oriented toward direction of travel
  if (snake.length > 4) {
    let tp    = proj[4];
    let angle = atan2(hp.y - tp.y, hp.x - tp.x);
    let er    = max(3, headDiam * 0.3);
    let ew    = max(2, headDiam * 0.22);
    fill(5, 5, 5);
    ellipse(hp.x + cos(angle - 0.5) * er, hp.y + sin(angle - 0.5) * er, ew, ew);
    ellipse(hp.x + cos(angle + 0.5) * er, hp.y + sin(angle + 0.5) * er, ew, ew);
  }
}

// ============================================================
//  HUD
// ============================================================
function drawHUD() {
  noStroke();
  fill(255, 255, 255, 200);
  textSize(18);
  textAlign(LEFT, TOP);
  text('SCORE: ' + score, 14, 14);

  let barW = map(snake.length, 0, snakeMaxLen, 0, 160);
  fill(55, 200, 80, 110);
  rect(14, 42, barW, 6, 3);
  stroke(55, 200, 80, 55); strokeWeight(1); noFill();
  rect(14, 42, 160, 6, 3);

  if (!audioCtx) {
    noStroke();
    textAlign(CENTER, CENTER);
    fill(255, 235, 75, 210);
    textSize(14);
    text('[ click anywhere to start music ]', width / 2, height - 24);
  }
}

// ============================================================
//  AUDIO
// ============================================================
function mousePressed() {
  if (!audioCtx) {
    audioCtx     = new (window.AudioContext || window.webkitAudioContext)();
    nextNoteTime = audioCtx.currentTime;
  }
}

function scheduleAudio() {
  while (nextNoteTime < audioCtx.currentTime + 0.25) {
    let i = noteStep % MELODY.length;

    synthNote(MELODY[i], TEMPO * 0.65, nextNoteTime, 'square', 0.055);

    if (noteStep % 16 === 0)
      synthNote(BASS[(noteStep / 16 | 0) % BASS.length],
                TEMPO * 14, nextNoteTime, 'triangle', 0.08);

    if (noteStep % 16 === 8)
      synthNote(BASS[(noteStep / 16 | 0) % BASS.length] * 1.5,
                TEMPO * 1.8, nextNoteTime, 'triangle', 0.05);

    hihat(nextNoteTime, 0.025);
    if (noteStep % 8 === 0) kick(nextNoteTime, 0.11);

    nextNoteTime += TEMPO;
    noteStep++;
  }
}

function synthNote(freq, dur, t, type, vol) {
  let o = audioCtx.createOscillator();
  let g = audioCtx.createGain();
  o.connect(g); g.connect(audioCtx.destination);
  o.type = type;
  o.frequency.value = freq;
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.start(t); o.stop(t + dur + 0.01);
}

function hihat(t, vol) {
  let len = Math.ceil(audioCtx.sampleRate * 0.05);
  let buf = audioCtx.createBuffer(1, len, audioCtx.sampleRate);
  let d   = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  let src = audioCtx.createBufferSource(); src.buffer = buf;
  let hp  = audioCtx.createBiquadFilter();
  hp.type = 'highpass'; hp.frequency.value = 7500;
  let g = audioCtx.createGain();
  src.connect(hp); hp.connect(g); g.connect(audioCtx.destination);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);
  src.start(t); src.stop(t + 0.06);
}

function kick(t, vol) {
  let o = audioCtx.createOscillator();
  let g = audioCtx.createGain();
  o.connect(g); g.connect(audioCtx.destination);
  o.frequency.setValueAtTime(160, t);
  o.frequency.exponentialRampToValueAtTime(0.01, t + 0.35);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
  o.start(t); o.stop(t + 0.36);
}

function onEat() {
  if (!audioCtx) return;
  let now  = audioCtx.currentTime;
  let freq = 440 + (score % 12) * 80;
  synthNote(freq,       0.07, now,        'square', 0.13);
  synthNote(freq * 1.5, 0.06, now + 0.07, 'square', 0.11);
}
