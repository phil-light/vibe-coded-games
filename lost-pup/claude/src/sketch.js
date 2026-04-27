// ============================================================
//  LOST PUP – a simple RPG in p5.js
//  A dog gets lost at a state fair and must find its family.
//  Paste into editor.p5js.org and click Play.
// ============================================================

// -- Game states --
const STATE_TITLE = 0;
const STATE_MAP   = 1;
let gameState = STATE_TITLE;

// -- Player --
let pupName = "";
let nameInput;
let startButton;
let typingName = true;
let cursorBlink = 0;

// -- Map / Camera --
const TILE = 32;
const MAP_COLS = 40;
const MAP_ROWS = 30;
const MAP_W = MAP_COLS * TILE;
const MAP_H = MAP_ROWS * TILE;

let camX = 0;
let camY = 0;

// -- Pup (overworld) --
let pup = { x: 20 * TILE, y: 25 * TILE, dir: 0, frame: 0, speed: 2.5 };
// dir: 0=down, 1=left, 2=right, 3=up
let moving = false;

// -- Fair booths / landmarks (colored rectangles for now) --
let landmarks = [];

// ============================================================
//  SETUP
// ============================================================
function setup() {
  createCanvas(640, 480);
  textFont("monospace");
  buildLandmarks();
}

// ============================================================
//  DRAW
// ============================================================
function draw() {
  if (gameState === STATE_TITLE) {
    drawTitle();
  } else if (gameState === STATE_MAP) {
    updateMap();
    drawMap();
  }
}

// ============================================================
//  TITLE SCREEN
// ============================================================
function drawTitle() {
  // Sky gradient
  for (let y = 0; y < height; y++) {
    let t = y / height;
    let r = lerp(60, 20, t);
    let g = lerp(120, 50, t);
    let b = lerp(200, 100, t);
    stroke(r, g, b);
    line(0, y, width, y);
  }

  // Stars
  noStroke();
  randomSeed(42);
  for (let i = 0; i < 60; i++) {
    let sx = random(width);
    let sy = random(height * 0.5);
    let twinkle = 150 + 105 * sin(frameCount * 0.03 + i);
    fill(255, 255, 220, twinkle);
    ellipse(sx, sy, random(1.5, 3));
  }

  // Ferris wheel silhouette (background detail)
  drawFerrisWheel(width * 0.75, height * 0.42, 80);

  // Title
  noStroke();
  textAlign(CENTER, CENTER);

  // Shadow
  fill(0, 0, 0, 80);
  textSize(52);
  text("LOST PUP", width / 2 + 2, 102);

  // Main title
  fill(255, 230, 130);
  textSize(52);
  text("LOST PUP", width / 2, 100);

  // Subtitle
  fill(200, 200, 220, 180);
  textSize(14);
  text("a state fair adventure", width / 2, 145);

  // Dog sprite on title
  drawPupSprite(width / 2, 210, 3, 0, true);

  // Name prompt
  fill(255, 255, 255, 220);
  textSize(16);
  text("Name your pup:", width / 2, 280);

  // Name input box
  let boxW = 220;
  let boxH = 36;
  let boxX = width / 2 - boxW / 2;
  let boxY = 300;

  fill(20, 20, 40, 200);
  stroke(180, 180, 220, 150);
  strokeWeight(2);
  rect(boxX, boxY, boxW, boxH, 6);

  // Name text
  noStroke();
  fill(255, 255, 255);
  textSize(20);
  textAlign(CENTER, CENTER);
  let displayName = pupName;
  cursorBlink += 0.06;
  if (sin(cursorBlink) > 0 && typingName) {
    displayName += "_";
  }
  text(displayName, width / 2, boxY + boxH / 2);

  // Start hint
  if (pupName.length > 0) {
    let alpha = 150 + 100 * sin(frameCount * 0.05);
    fill(255, 230, 130, alpha);
    textSize(15);
    text("[ press ENTER to start ]", width / 2, 380);
  } else {
    fill(160, 160, 180, 120);
    textSize(13);
    text("type a name to begin", width / 2, 380);
  }

  // Footer
  fill(140, 140, 160, 100);
  textSize(10);
  text("SNIFF · BARK · BITE", width / 2, height - 20);
}

function drawFerrisWheel(cx, cy, r) {
  push();
  stroke(40, 50, 80, 120);
  strokeWeight(2);
  noFill();
  ellipse(cx, cy, r * 2, r * 2);

  // Spokes
  let spokeCount = 8;
  let rot = frameCount * 0.005;
  for (let i = 0; i < spokeCount; i++) {
    let a = rot + (TWO_PI / spokeCount) * i;
    let ex = cx + cos(a) * r;
    let ey = cy + sin(a) * r;
    line(cx, cy, ex, ey);

    // Gondola
    fill(60, 70, 100, 100);
    noStroke();
    rect(ex - 5, ey - 2, 10, 8, 2);
    stroke(40, 50, 80, 120);
    strokeWeight(2);
    noFill();
  }

  // Support
  stroke(40, 50, 80, 140);
  strokeWeight(3);
  line(cx, cy, cx - r * 0.5, cy + r + 20);
  line(cx, cy, cx + r * 0.5, cy + r + 20);
  pop();
}

// ============================================================
//  MAP LANDMARKS
// ============================================================
function buildLandmarks() {
  landmarks = [
    // Main path entrance area (bottom)
    { x: 17, y: 26, w: 6, h: 2, color: [120, 90, 60],   label: "Entrance Gate" },

    // Food row
    { x: 3,  y: 20, w: 4, h: 3, color: [220, 100, 80],  label: "Corn Dog Stand" },
    { x: 8,  y: 20, w: 4, h: 3, color: [240, 180, 60],  label: "Funnel Cakes" },
    { x: 13, y: 20, w: 4, h: 3, color: [255, 130, 50],  label: "BBQ Pit" },

    // Games row
    { x: 24, y: 20, w: 5, h: 3, color: [80, 180, 220],  label: "Ring Toss" },
    { x: 30, y: 20, w: 5, h: 3, color: [100, 200, 140], label: "Balloon Darts" },

    // Rides area
    { x: 5,  y: 10, w: 6, h: 5, color: [180, 100, 220], label: "Ferris Wheel" },
    { x: 14, y: 10, w: 5, h: 4, color: [220, 80, 150],  label: "Tilt-A-Whirl" },
    { x: 22, y: 10, w: 6, h: 5, color: [100, 120, 220], label: "Bumper Cars" },

    // Animal area
    { x: 30, y: 10, w: 6, h: 5, color: [140, 180, 80],  label: "Petting Zoo" },
    { x: 30, y: 5,  w: 6, h: 4, color: [180, 160, 100], label: "Horse Barn" },

    // Stage area
    { x: 5,  y: 3,  w: 8, h: 4, color: [200, 60, 60],   label: "Main Stage" },

    // Restrooms / info
    { x: 16, y: 3,  w: 3, h: 2, color: [100, 100, 110],  label: "Restrooms" },

    // The family's picnic spot (goal area hint)
    { x: 22, y: 2,  w: 5, h: 3, color: [255, 220, 100],  label: "Picnic Area" },
  ];
}

// ============================================================
//  MAP UPDATE
// ============================================================
function updateMap() {
  moving = false;
  let dx = 0;
  let dy = 0;

  if (keyIsDown(LEFT_ARROW)  || keyIsDown(65)) { dx = -1; pup.dir = 1; }
  if (keyIsDown(RIGHT_ARROW) || keyIsDown(68)) { dx =  1; pup.dir = 2; }
  if (keyIsDown(UP_ARROW)    || keyIsDown(87)) { dy = -1; pup.dir = 3; }
  if (keyIsDown(DOWN_ARROW)  || keyIsDown(83)) { dy =  1; pup.dir = 0; }

  if (dx !== 0 || dy !== 0) {
    moving = true;
    // Normalize diagonal
    if (dx !== 0 && dy !== 0) {
      dx *= 0.707;
      dy *= 0.707;
    }

    let newX = pup.x + dx * pup.speed;
    let newY = pup.y + dy * pup.speed;

    // Collision with landmarks
    let pupLeft   = newX - 8;
    let pupRight  = newX + 8;
    let pupTop    = newY - 8;
    let pupBottom = newY + 8;

    let blocked = false;
    for (let lm of landmarks) {
      let lx = lm.x * TILE;
      let ly = lm.y * TILE;
      let lw = lm.w * TILE;
      let lh = lm.h * TILE;
      if (pupRight > lx && pupLeft < lx + lw &&
          pupBottom > ly && pupTop < ly + lh) {
        blocked = true;
        break;
      }
    }

    if (!blocked) {
      newX = constrain(newX, 8, MAP_W - 8);
      newY = constrain(newY, 8, MAP_H - 8);
      pup.x = newX;
      pup.y = newY;
    }

    pup.frame += 0.15;
  }

  // Camera follows pup
  camX = pup.x - width / 2;
  camY = pup.y - height / 2;
  camX = constrain(camX, 0, MAP_W - width);
  camY = constrain(camY, 0, MAP_H - height);
}

// ============================================================
//  MAP DRAW
// ============================================================
function drawMap() {
  // Ground
  background(90, 160, 70);

  push();
  translate(-camX, -camY);

  // Ground texture (dirt paths)
  drawGroundPaths();

  // Landmarks
  for (let lm of landmarks) {
    let lx = lm.x * TILE;
    let ly = lm.y * TILE;
    let lw = lm.w * TILE;
    let lh = lm.h * TILE;

    // Shadow
    noStroke();
    fill(0, 0, 0, 40);
    rect(lx + 3, ly + 3, lw, lh, 4);

    // Building
    fill(lm.color[0], lm.color[1], lm.color[2]);
    stroke(0, 0, 0, 60);
    strokeWeight(1);
    rect(lx, ly, lw, lh, 4);

    // Roof stripe
    fill(lm.color[0] * 0.7, lm.color[1] * 0.7, lm.color[2] * 0.7);
    noStroke();
    rect(lx, ly, lw, 6, 4, 4, 0, 0);

    // Label
    fill(255, 255, 255, 200);
    noStroke();
    textAlign(CENTER, CENTER);
    textSize(9);
    text(lm.label, lx + lw / 2, ly + lh / 2);
  }

  // Draw pup
  let bobble = moving ? sin(pup.frame * 4) * 2 : 0;
  drawPupSprite(pup.x, pup.y + bobble, 1.5, pup.dir, moving);

  // Pup name tag
  noStroke();
  fill(255, 255, 255, 180);
  textAlign(CENTER, CENTER);
  textSize(10);
  text(pupName, pup.x, pup.y - 20);

  pop();

  // HUD
  drawMapHUD();
}

function drawGroundPaths() {
  // Horizontal main path
  noStroke();
  fill(180, 155, 120);
  rect(0, 18 * TILE, MAP_W, 2 * TILE);

  // Vertical main path
  rect(19 * TILE, 0, 2 * TILE, MAP_H);

  // Path borders (subtle)
  stroke(160, 135, 100);
  strokeWeight(1);
  // Horizontal
  line(0, 18 * TILE, MAP_W, 18 * TILE);
  line(0, 20 * TILE, MAP_W, 20 * TILE);
  // Vertical
  line(19 * TILE, 0, 19 * TILE, MAP_H);
  line(21 * TILE, 0, 21 * TILE, MAP_H);
}

function drawMapHUD() {
  // Top bar
  noStroke();
  fill(0, 0, 0, 120);
  rect(0, 0, width, 28);

  fill(255, 230, 130);
  textAlign(LEFT, CENTER);
  textSize(13);
  text("🐕 " + pupName, 10, 14);

  fill(200, 200, 220, 160);
  textAlign(RIGHT, CENTER);
  textSize(11);
  text("ARROW KEYS / WASD to move", width - 10, 14);
}

// ============================================================
//  PUP SPRITE (simple pixel-art style)
// ============================================================
function drawPupSprite(x, y, scale, dir, isMoving) {
  push();
  translate(x, y);

  let s = scale;

  // Body
  noStroke();
  fill(180, 130, 70);  // brown dog
  ellipse(0, 0, 14 * s, 10 * s);

  // Head
  let hx = 0, hy = -5 * s;
  if (dir === 0) { hx = 0;  hy = 5 * s; }   // down
  if (dir === 1) { hx = -6 * s; hy = 0; }    // left
  if (dir === 2) { hx = 6 * s;  hy = 0; }    // right
  if (dir === 3) { hx = 0;  hy = -5 * s; }   // up

  fill(200, 150, 80);
  ellipse(hx, hy, 10 * s, 9 * s);

  // Ears
  fill(150, 100, 50);
  if (dir === 1 || dir === 3) {
    ellipse(hx - 4 * s, hy - 3 * s, 4 * s, 6 * s);
    ellipse(hx + 4 * s, hy - 3 * s, 4 * s, 6 * s);
  } else if (dir === 2) {
    ellipse(hx - 3 * s, hy - 3 * s, 4 * s, 6 * s);
    ellipse(hx + 4 * s, hy - 3 * s, 4 * s, 6 * s);
  } else {
    ellipse(hx - 4 * s, hy - 2 * s, 4 * s, 6 * s);
    ellipse(hx + 4 * s, hy - 2 * s, 4 * s, 6 * s);
  }

  // Eyes (not when facing away)
  if (dir !== 3) {
    fill(30, 30, 30);
    let eyeSpread = 2.5 * s;
    if (dir === 1) {
      ellipse(hx - 2 * s, hy - 1 * s, 2 * s, 2.5 * s);
      ellipse(hx + 1.5 * s, hy - 1 * s, 1.5 * s, 2 * s);
    } else if (dir === 2) {
      ellipse(hx + 2 * s, hy - 1 * s, 2 * s, 2.5 * s);
      ellipse(hx - 1.5 * s, hy - 1 * s, 1.5 * s, 2 * s);
    } else {
      ellipse(hx - eyeSpread, hy - 1 * s, 2 * s, 2.5 * s);
      ellipse(hx + eyeSpread, hy - 1 * s, 2 * s, 2.5 * s);
    }

    // Nose
    fill(50, 30, 30);
    if (dir === 0) {
      ellipse(hx, hy + 2.5 * s, 2.5 * s, 2 * s);
    } else if (dir === 1) {
      ellipse(hx - 3.5 * s, hy + 1 * s, 2 * s, 1.5 * s);
    } else if (dir === 2) {
      ellipse(hx + 3.5 * s, hy + 1 * s, 2 * s, 1.5 * s);
    }
  }

  // Tail
  noFill();
  stroke(180, 130, 70);
  strokeWeight(2 * s);
  let tailWag = isMoving ? sin(frameCount * 0.3) * 0.5 : 0.2;
  if (dir === 0 || dir === 3) {
    let tx = 6 * s;
    arc(tx, -2 * s, 6 * s, 8 * s, -HALF_PI + tailWag, HALF_PI + tailWag);
  }

  // Legs (simple dots when walking)
  if (isMoving) {
    noStroke();
    fill(150, 100, 50);
    let step = sin(frameCount * 0.3) * 2 * s;
    ellipse(-4 * s, 5 * s + step, 3 * s, 3 * s);
    ellipse(4 * s, 5 * s - step, 3 * s, 3 * s);
  }

  pop();
}

// ============================================================
//  INPUT
// ============================================================
function keyPressed() {
  if (gameState === STATE_TITLE) {
    if (keyCode === ENTER && pupName.length > 0) {
      gameState = STATE_MAP;
      typingName = false;
      return;
    }
    if (keyCode === BACKSPACE) {
      pupName = pupName.slice(0, -1);
      return;
    }
    // Allow letters, numbers, spaces
    if (key.length === 1 && pupName.length < 12) {
      if (key.match(/[a-zA-Z0-9 ]/)) {
        pupName += key;
      }
    }
  }
}
