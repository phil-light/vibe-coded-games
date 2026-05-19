// Sticker - a gravity-flip platformer in p5.js
// Design doc: ../Sticker.md
//
// Goal: reach the purple portal. Avoid the red stars.
// Touching an arrow block redirects gravity in that direction.
// Player, enemies, and any gravity-affected object accelerate
// in the current gravity direction.
//
// Controls
//   Arrow keys / WASD : move (always screen direction)
//   Shift             : hold to run
//   Space             : jump (opposite of current gravity)
//   Enter             : start (on the title screen)
//   R                 : restart

// ============================================================
// Constants
// ============================================================

const TILE = 32;

// Physics
const GRAVITY = 0.55;
const MAX_FALL_SPEED = 13;
const JUMP_VELOCITY = 9.5;
const JUMP_HOLD_FRAMES = 14;       // max frames jump can be extended
const JUMP_HOLD_GRAVITY = 0.35;    // gravity multiplier while jump held during ascent

const WALK_ACCEL = 0.40;
const RUN_ACCEL  = 0.62;
const GROUND_FRICTION = 0.78;
const AIR_FRICTION    = 0.94;
const MAX_WALK_SPEED = 3.4;
const MAX_RUN_SPEED  = 5.8;

// Player
const PLAYER_RADIUS = 12;
const PLAYER_HALF   = 12;     // half-width of square collision box

// Enemy
const ENEMY_HALF = 11;
const ENEMY_PATROL_SPEED = 1.4;

// Gravity directions
const G_DOWN = 0, G_LEFT = 1, G_UP = 2, G_RIGHT = 3;
const GRAVITY_VECS = [
  { x:  0, y:  1 },  // 0: DOWN
  { x: -1, y:  0 },  // 1: LEFT
  { x:  0, y: -1 },  // 2: UP
  { x:  1, y:  0 },  // 3: RIGHT
];

// Rain effect
const RAIN_SPEED = 3;
const RAIN_OPACITY = 20;
const RAIN_COLOR = [200, 210, 220];  // Cool gray-blue

// ============================================================
// Levels
//   '#'  wall (terrain)
//   '.'  empty
//   'P'  player start
//   'X'  exit portal
//   'E'  enemy (red star)
//   '^'  arrow tile: touching it makes gravity point UP
//   'v'  arrow tile: gravity DOWN
//   '<'  arrow tile: gravity LEFT
//   '>'  arrow tile: gravity RIGHT
// ============================================================
// Grid coordinates: Columns labeled A-Z (and AA, AB, etc), rows numbered 1-N (1-indexed for students)
// ============================================================

const LEVELS = [
  // Level 1: Introduction - simple walk to portal with one gravity area
  //     A B C D E F G H I J K L M N O P Q R S T U V W X Y Z AA AB
  [
    '############################', // 1
    '#X.........................#', // 2
    '#..........................#', // 3
    '#..........................#', // 4
    '#..........................#', // 5
    '#..........................#', // 6
    '#..........................#', // 7
    '#..........................#', // 8
    '#..........................#', // 9
    '#..........................#', // 10
    '#..........................#', // 11
    '#..........................#', // 12
    '#P....>...................^#', // 13
    '############################', // 14
  ],

  // Level 2: Gravity navigation - two separate gravity zones
  //     A B C D E F G H I J K L M N O P Q R S T U V W X Y Z AA AB
  [
    '############################', // 1
    '#X.........................#', // 2
    '#.......#..................#', // 3
    '#.......#..................#', // 4
    '#.......#..................#', // 5
    '#.......#.....#..........^#', // 6
    '#......>......#..........#', // 7
    '#.......#.....#..........#', // 8
    '#.......###############..#', // 9
    '#..........................#', // 10
    '#..........................#', // 11
    '#..........................#', // 12
    '#P.........................#', // 13
    '############################', // 14
  ],

  // Level 3: First enemy - one patrol enemy, simple platforming
  //     A B C D E F G H I J K L M N O P Q R S T U V W X Y Z AA AB
  [
    '############################', // 1
    '#................E.........#', // 2
    '#...........##########....#', // 3
    '#..........................#', // 4
    '#..........................#', // 5
    '#..........................#', // 6
    '#..........................#', // 7
    '#..........................#', // 8
    '#X.........................#', // 9
    '#.....#####................#', // 10
    '#....#.....#...............#', // 11
    '#...#.......#..............#', // 12
    '#P.#.........#.........>...#', // 13
    '############################', // 14
  ],

  // Level 4: Precision platforming with gravity zones - requires careful sequencing
  //     A B C D E F G H I J K L M N O P Q R S T U V W X Y Z AA AB
  [
    '############################', // 1
    '#X.........................#', // 2
    '#.###..................###.#', // 3
    '#.#.....................#..#', // 4
    '#.#.........>...........#..^#', // 5
    '#.#..................#.....#', // 6
    '#.#................#.......#', // 7
    '#.#..............#.........#', // 8
    '#.#...........#.#........#.#', // 9
    '#.#......<#..#.#........#.#', // 10
    '#.#......#...#.#.......#..#', // 11
    '#.#.....#.....#.....>..#...#', // 12
    '#P......#.......#.......#..v#', // 13
    '############################', // 14
  ],

  // Level 5: Enemies meet gravity - two enemies, requires navigation
  //       A B C D E F G H I J K L M N O P Q R S T U V W X Y Z AA AB AC
  [
    '##############################', // 1
    '#X............................#', // 2
    '#......#..E...#............#.#', // 3
    '#......#......#............#.#', // 4
    '#......#......#..........##...#', // 5
    '#>....##......############...^#', // 6
    '#......#......#..................#', // 7
    '#......#......#..................#', // 8
    '#......#......#..................#', // 9
    '#......###....#..................#', // 10
    '#..........................E...#', // 11
    '#......#...................#..#', // 12
    '#P.....#...................#..#', // 13
    '##############################', // 14
  ],

  // Level 6: Tight precision - complex gravity-based platforming
  //     A B C D E F G H I J K L M N O P Q R S T U V W X Y Z AA AB
  [
    '############################', // 1
    '#X.........................#', // 2
    '#.......................#..#', // 3
    '#.................#.....#..#', // 4
    '#............#...#.....#..^#', // 5
    '#.....#......#...#.....#...#', // 6
    '#.....#......#...#.....#...#', // 7
    '#.....#.>....#...#.....#...#', // 8
    '#.....#......#...#.....#...#', // 9
    '#.....#......#...#...........#', // 10
    '#.....#......########......#', // 11
    '#.....#....................#', // 12
    '#P....#.................#..#', // 13
    '############################', // 14
  ],

  // Level 7: Multi-enemy maze navigation
  //     A B C D E F G H I J K L M N O
  [
    '####################', // 1
    '#X..................#', // 2
    '#.#.#.#.#....E.....#', // 3
    '#.#.#.#.#..........#', // 4
    '#.#.#.#.####...E...#', // 5
    '#.#.#.#.....#......#', // 6
    '#.#.#.#.###.#.E....#', // 7
    '#.#.#.#...#.#......#', // 8
    '#.#.#.#.#.#.#......#', // 9
    '#.#.#.#.#.#^##.....#', // 10
    '#.#.#.#.#.#.......>.#', // 11
    '#.....#.#.#.....v...#', // 12
    '#P....#.....#.....#', // 13
    '####################', // 14
  ],

  // Level 8: Puzzle-like - specific gravity sequence needed
  //     A B C D E F G H I J K L M N O P Q R S T U V W X Y Z AA AB
  [
    '############################', // 1
    '#............X............#', // 2
    '#..........................#', // 3
    '#.....###############.....#', // 4
    '#.....#.................#..#', // 5
    '#.....#.......#.........#..#', // 6
    '#.....#.#######.########.^.#', // 7
    '#.....#.................#..#', // 8
    '#.....#..................#.#', // 9
    '#.....##########...>..####.#', // 10
    '#.....................#...#.#', // 11
    '#.....#..^...v....<..#.#.#.#', // 12
    '#P....#.................#.#.#', // 13
    '############################', // 14
  ],

  // Level 9: Expert mix - enemies and complex platforming
  //       A B C D E F G H I J K L M N O P Q R S T U V W X Y Z AA AB AC
  [
    '##############################', // 1
    '#X..............E....#.....#.#', // 2
    '#..#.................#....#..#', // 3
    '#.##.................#...#...#', // 4
    '#.................#..#..#....#', // 5
    '#....#.........#...>##.#.....^#', // 6
    '#....#.......##......#.#....#', // 7
    '#....#....E........#.#.###..#', // 8
    '#....##.........#....#....#.#', // 9
    '#....#......^....#...#.E.#..#', // 10
    '#...##.....#.#....###.....#.#', // 11
    '#......................#....#', // 12
    '#P..................#......#', // 13
    '##############################', // 14
  ],

  // Level 10: Grand Finale - everything combined
  //       A B C D E F G H I J K L M N O P Q R S T U V W X Y Z AA AB AC
  [
    '##############################', // 1
    '#X...............E...#......#', // 2
    '#.................###.##....#', // 3
    '#..........#.......E..#....^#', // 4
    '#.#########...########.....#.#', // 5
    '#.#......................#.#.#', // 6
    '#.#.#.#########.#########.#.#', // 7
    '#.#.#.............E.......#.#', // 8
    '#.#.###########.###########.#', // 9
    '#.#...>....#....#...........#', // 10
    '#.#########....##...........#', // 11
    '#.#........E....<.#........#', // 12
    '#P#........................v#', // 13
    '##############################', // 14
  ],
];

// ============================================================
// Global state
// ============================================================

let gameState = 'title';   // 'title' | 'playing' | 'levelcomplete' | 'gamecomplete' | 'lost'
let gravityDir = G_DOWN;
let walls = [];            // walls[row][col] -> boolean
let cols = 0, rows = 0;
let player, exitPortal;
let enemies = [];
let arrows = [];
let tick = 0;
let currentLevel = 0;
let currentLevelLayout = null;

// ============================================================
// p5 lifecycle
// ============================================================

function setup() {
  currentLevelLayout = LEVELS[0];
  cols = currentLevelLayout[0].length;
  rows = currentLevelLayout.length;
  createCanvas(cols * TILE, rows * TILE);
  textFont('monospace');
  loadLevel();
}

function draw() {
  tick++;
  if (gameState === 'title') {
    drawTitle();
  } else if (gameState === 'playing') {
    updateGame();
    drawGame();
  } else if (gameState === 'levelcomplete') {
    drawGame();
    const nextLevelNum = currentLevel + 2;
    const msg = currentLevel < LEVELS.length - 1 ? `Level ${currentLevel + 1} complete!` : 'Level complete!';
    const subtitle = currentLevel < LEVELS.length - 1 ? `Press ENTER for Level ${nextLevelNum}` : 'Press ENTER for final level';
    drawBanner(msg, subtitle, color(180, 120, 240));
  } else if (gameState === 'gamecomplete') {
    drawGame();
    drawBanner('You beat all levels!', 'Press R to restart from level 1',
               color(100, 200, 100));
  } else if (gameState === 'lost') {
    drawGame();
    drawBanner('Ouch! A star got you.', 'Press R to restart this level',
               color(220, 80, 80));
  }
}

function keyPressed() {
  if (gameState === 'title' && (keyCode === ENTER || keyCode === RETURN)) {
    currentLevel = 0;
    currentLevelLayout = LEVELS[currentLevel];
    cols = currentLevelLayout[0].length;
    rows = currentLevelLayout.length;
    loadLevel();
    gameState = 'playing';
    return;
  }
  if (gameState === 'levelcomplete' && (keyCode === ENTER || keyCode === RETURN)) {
    if (currentLevel < LEVELS.length - 1) {
      currentLevel++;
      currentLevelLayout = LEVELS[currentLevel];
      cols = currentLevelLayout[0].length;
      rows = currentLevelLayout.length;
      loadLevel();
      gameState = 'playing';
    } else {
      gameState = 'gamecomplete';
    }
    return;
  }
  if (gameState === 'gamecomplete' && (key === 'r' || key === 'R')) {
    currentLevel = 0;
    currentLevelLayout = LEVELS[currentLevel];
    cols = currentLevelLayout[0].length;
    rows = currentLevelLayout.length;
    loadLevel();
    gameState = 'playing';
    return;
  }
  if (key === 'r' || key === 'R') {
    loadLevel();
    gameState = 'playing';
  }
}

// ============================================================
// Level loading
// ============================================================

function loadLevel() {
  walls = [];
  enemies = [];
  arrows = [];
  exitPortal = null;
  gravityDir = G_DOWN;

  for (let r = 0; r < rows; r++) {
    const wallRow = [];
    for (let c = 0; c < cols; c++) {
      const ch = currentLevelLayout[r][c];
      wallRow.push(ch === '#');
      const cx = c * TILE + TILE / 2;
      const cy = r * TILE + TILE / 2;
      if (ch === 'P') player = new Player(cx, cy);
      else if (ch === 'E') enemies.push(new Enemy(cx, cy));
      else if (ch === 'X') exitPortal = new ExitPortal(cx, cy);
      else if (ch === '^') arrows.push(new Arrow(c, r, G_UP));
      else if (ch === 'v') arrows.push(new Arrow(c, r, G_DOWN));
      else if (ch === '<') arrows.push(new Arrow(c, r, G_LEFT));
      else if (ch === '>') arrows.push(new Arrow(c, r, G_RIGHT));
    }
    walls.push(wallRow);
  }
}

// ============================================================
// Game update
// ============================================================

function updateGame() {
  player.update();
  for (const e of enemies) e.update();

  // Arrow blocks: only the player triggers gravity changes.
  for (const a of arrows) {
    if (a.contains(player.x, player.y) && gravityDir !== a.dir) {
      gravityDir = a.dir;
    }
  }

  // Win condition
  if (exitPortal && exitPortal.contains(player.x, player.y)) {
    gameState = 'levelcomplete';
  }

  // Lose condition: collide with any enemy
  for (const e of enemies) {
    const dx = e.x - player.x;
    const dy = e.y - player.y;
    const hit = PLAYER_RADIUS + e.radius * 0.7;
    if (dx * dx + dy * dy < hit * hit) {
      gameState = 'lost';
    }
  }
}

// ============================================================
// Rendering
// ============================================================

function drawTitle() {
  background(40, 50, 70);  // Dark rainy night

  // Sample player circle
  push();
  strokeWeight(4);
  stroke(180, 80, 0);
  fill(255, 130, 40);
  circle(width / 2, height * 0.20, 76);
  pop();

  noStroke();
  fill(220, 230, 240);
  textAlign(CENTER, CENTER);
  textSize(54);
  text('STICKER', width / 2, height * 0.38);
  textSize(18);
  text('a gravity-flip platformer', width / 2, height * 0.44);
  textSize(14);
  fill(150, 160, 180);
  text('10-level adventure', width / 2, height * 0.50);

  textSize(14);
  fill(180, 190, 210);
  let y = height * 0.60;
  text('WASD or arrows = move     Shift = run     Space = jump',
       width / 2, y);
  text('Touch a blue arrow block to point gravity that way.',
       width / 2, y + 22);
  text('Reach the purple portal. Avoid the red stars.',
       width / 2, y + 44);

  if ((tick % 60) < 40) {
    fill(255, 240, 100);
    textSize(20);
    text('Press ENTER to start', width / 2, height * 0.85);
  }
}

function drawGame() {
  background(40, 50, 70);  // Dark rainy night
  drawRain();
  drawWalls();
  for (const a of arrows) a.draw();
  if (exitPortal) {
    exitPortal.update();
    exitPortal.draw();
  }
  for (const e of enemies) e.draw();
  player.draw();
  drawHUD();
}

function drawRain() {
  stroke(RAIN_COLOR[0], RAIN_COLOR[1], RAIN_COLOR[2], RAIN_OPACITY);
  strokeWeight(1);
  const g = GRAVITY_VECS[gravityDir];

  for (let i = 0; i < 80; i++) {
    const x = random(width);
    const y = random(height);
    const len = 8;
    line(x - g.x * len, y - g.y * len, x + g.x * len, y + g.y * len);
  }
}

function drawWalls() {
  noStroke();
  const g = GRAVITY_VECS[gravityDir];
  const grassThickness = 6;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!walls[r][c]) continue;
      const x = c * TILE, y = r * TILE;
      fill(60, 40, 30);            // darker brown dirt
      rect(x, y, TILE, TILE);
      fill(80, 140, 60);            // moss green for night mood
      if (g.y > 0)      rect(x, y, TILE, grassThickness);
      else if (g.y < 0) rect(x, y + TILE - grassThickness, TILE, grassThickness);
      else if (g.x > 0) rect(x, y, grassThickness, TILE);
      else if (g.x < 0) rect(x + TILE - grassThickness, y, grassThickness, TILE);
    }
  }
}

function drawHUD() {
  push();

  // Level indicator (top right)
  textAlign(RIGHT, TOP);
  textSize(16);
  fill(200, 220, 240);
  text(`Level ${currentLevel + 1}/10`, width - 20, 10);

  // Gravity direction indicator
  const boxX = 10, boxY = 10, boxW = 130, boxH = 30;
  noStroke();
  fill(0, 0, 0, 150);
  rect(boxX, boxY, boxW, boxH, 6);
  fill(180, 200, 220);
  textAlign(LEFT, CENTER);
  textSize(14);
  text('gravity:', boxX + 10, boxY + boxH / 2);

  const g = GRAVITY_VECS[gravityDir];
  const ax = boxX + 90;
  const ay = boxY + boxH / 2;
  stroke(180, 200, 220);
  strokeWeight(2);
  line(ax - g.x * 12, ay - g.y * 12, ax + g.x * 12, ay + g.y * 12);
  push();
  translate(ax + g.x * 12, ay + g.y * 12);
  rotate(atan2(g.y, g.x));
  noStroke();
  fill(180, 200, 220);
  triangle(0, 0, -8, -5, -8, 5);
  pop();

  pop();
}

function drawBanner(msg, subtitle, c) {
  push();
  noStroke();
  fill(0, 0, 0, 180);
  rect(0, height / 2 - 60, width, 120);
  fill(c);
  textAlign(CENTER, CENTER);
  textSize(32);
  text(msg, width / 2, height / 2 - 14);
  fill(220, 230, 240);
  textSize(16);
  text(subtitle, width / 2, height / 2 + 22);
  pop();
}

// ============================================================
// Player
// ============================================================

class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.onGround = false;
    this.running = false;
    this.jumpHeldPrev = false;
    this.jumpFrames = 0;
  }

  update() {
    const g = GRAVITY_VECS[gravityDir];
    // Perpendicular to gravity (rotate g 90deg CW): perp = (-g.y, g.x)
    const px = -g.y;
    const py = g.x;

    // Read input
    const kRight = keyIsDown(RIGHT_ARROW) || keyIsDown(68);  // D
    const kLeft  = keyIsDown(LEFT_ARROW)  || keyIsDown(65);  // A
    const kDown  = keyIsDown(DOWN_ARROW)  || keyIsDown(83);  // S
    const kUp    = keyIsDown(UP_ARROW)    || keyIsDown(87);  // W
    const kRun   = keyIsDown(SHIFT);
    const kJump  = keyIsDown(32);                            // Space

    this.running = kRun;

    // Project screen input vector onto perp axis
    const ix = (kRight ? 1 : 0) - (kLeft ? 1 : 0);
    const iy = (kDown  ? 1 : 0) - (kUp   ? 1 : 0);
    const walkInput = constrain(ix * px + iy * py, -1, 1);

    const accel    = kRun ? RUN_ACCEL : WALK_ACCEL;
    const maxSpeed = kRun ? MAX_RUN_SPEED : MAX_WALK_SPEED;

    // Decompose velocity into perp + grav components.
    let perpVel = this.vx * px + this.vy * py;
    let gravVel = this.vx * g.x + this.vy * g.y;

    // Walk
    if (walkInput !== 0) {
      perpVel += accel * walkInput;
    } else {
      perpVel *= this.onGround ? GROUND_FRICTION : AIR_FRICTION;
    }
    perpVel = constrain(perpVel, -maxSpeed, maxSpeed);

    // Jump (variable-height, Mario-style)
    if (kJump && !this.jumpHeldPrev && this.onGround) {
      gravVel = -JUMP_VELOCITY;
      this.onGround = false;
      this.jumpFrames = 1;
    }
    if (kJump && this.jumpFrames > 0 && this.jumpFrames < JUMP_HOLD_FRAMES
        && gravVel < 0) {
      this.jumpFrames++;
    } else {
      this.jumpFrames = 0;
    }
    this.jumpHeldPrev = kJump;

    // Gravity
    let grav = GRAVITY;
    if (this.jumpFrames > 0) grav *= JUMP_HOLD_GRAVITY;
    gravVel += grav;
    if (gravVel > MAX_FALL_SPEED) gravVel = MAX_FALL_SPEED;

    // Recombine
    this.vx = perpVel * px + gravVel * g.x;
    this.vy = perpVel * py + gravVel * g.y;

    // Move with collision (X then Y, axis-separated)
    this.onGround = false;
    this.x += this.vx;
    this.collideAxis('x');
    this.y += this.vy;
    this.collideAxis('y');
  }

  collideAxis(axis) {
    const half = PLAYER_HALF;
    const left = this.x - half, right = this.x + half;
    const top  = this.y - half, bot   = this.y + half;
    const c0 = max(0, floor(left / TILE));
    const c1 = min(cols - 1, floor((right - 0.001) / TILE));
    const r0 = max(0, floor(top  / TILE));
    const r1 = min(rows - 1, floor((bot  - 0.001) / TILE));

    for (let r = r0; r <= r1; r++) {
      for (let c = c0; c <= c1; c++) {
        if (!walls[r][c]) continue;
        const tx = c * TILE, ty = r * TILE;
        if (axis === 'x') {
          if (this.vx > 0) {
            this.x = tx - half - 0.001;
            if (gravityDir === G_RIGHT) this.onGround = true;
            this.vx = 0;
          } else if (this.vx < 0) {
            this.x = tx + TILE + half + 0.001;
            if (gravityDir === G_LEFT) this.onGround = true;
            this.vx = 0;
          }
        } else {
          if (this.vy > 0) {
            this.y = ty - half - 0.001;
            if (gravityDir === G_DOWN) this.onGround = true;
            this.vy = 0;
          } else if (this.vy < 0) {
            this.y = ty + TILE + half + 0.001;
            if (gravityDir === G_UP) this.onGround = true;
            this.vy = 0;
          }
        }
      }
    }
  }

  draw() {
    push();
    strokeWeight(3);
    stroke(170, 75, 0);
    if (this.running) {
      fill(255, 200, 50);     // yellower orange while running
    } else {
      fill(255, 130, 40);     // tangerine
    }
    circle(this.x, this.y, PLAYER_RADIUS * 2);
    pop();
  }
}

// ============================================================
// Enemy (red star)
// ============================================================

class Enemy {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.dir = 1;
    this.radius = TILE * 0.4;
    this.spin = random(TWO_PI);
    this.shade = random(140, 200);
  }

  update() {
    const g = GRAVITY_VECS[gravityDir];
    const px = -g.y, py = g.x;

    let perpVel = this.vx * px + this.vy * py;
    let gravVel = this.vx * g.x + this.vy * g.y;

    // Smoothly approach patrol speed in current "horizontal" direction
    const target = ENEMY_PATROL_SPEED * this.dir;
    perpVel += (target - perpVel) * 0.18;

    gravVel += GRAVITY;
    if (gravVel > MAX_FALL_SPEED) gravVel = MAX_FALL_SPEED;

    this.vx = perpVel * px + gravVel * g.x;
    this.vy = perpVel * py + gravVel * g.y;

    let bumpedPerp = false;
    this.x += this.vx;
    bumpedPerp = this.collideAxis('x', px, py) || bumpedPerp;
    this.y += this.vy;
    bumpedPerp = this.collideAxis('y', px, py) || bumpedPerp;
    if (bumpedPerp) this.dir *= -1;

    this.spin += 0.06;
  }

  collideAxis(axis, px, py) {
    const half = ENEMY_HALF;
    const left = this.x - half, right = this.x + half;
    const top  = this.y - half, bot   = this.y + half;
    const c0 = max(0, floor(left / TILE));
    const c1 = min(cols - 1, floor((right - 0.001) / TILE));
    const r0 = max(0, floor(top  / TILE));
    const r1 = min(rows - 1, floor((bot  - 0.001) / TILE));

    let bumpedPerp = false;
    for (let r = r0; r <= r1; r++) {
      for (let c = c0; c <= c1; c++) {
        if (!walls[r][c]) continue;
        const tx = c * TILE, ty = r * TILE;
        if (axis === 'x') {
          if (this.vx > 0) {
            this.x = tx - half - 0.001; this.vx = 0;
            if (abs(px) > 0.5) bumpedPerp = true;
          } else if (this.vx < 0) {
            this.x = tx + TILE + half + 0.001; this.vx = 0;
            if (abs(px) > 0.5) bumpedPerp = true;
          }
        } else {
          if (this.vy > 0) {
            this.y = ty - half - 0.001; this.vy = 0;
            if (abs(py) > 0.5) bumpedPerp = true;
          } else if (this.vy < 0) {
            this.y = ty + TILE + half + 0.001; this.vy = 0;
            if (abs(py) > 0.5) bumpedPerp = true;
          }
        }
      }
    }
    return bumpedPerp;
  }

  draw() {
    push();
    translate(this.x, this.y);
    rotate(this.spin);
    stroke(90, 0, 0);
    strokeWeight(2);
    fill(this.shade, 30, 30);
    drawStar(0, 0, this.radius * 0.45, this.radius, 5);
    pop();
  }
}

function drawStar(cx, cy, inner, outer, points) {
  const a = TWO_PI / points;
  const half = a / 2;
  beginShape();
  for (let i = 0; i < points; i++) {
    let x = cx + cos(i * a - HALF_PI) * outer;
    let y = cy + sin(i * a - HALF_PI) * outer;
    vertex(x, y);
    x = cx + cos(i * a - HALF_PI + half) * inner;
    y = cy + sin(i * a - HALF_PI + half) * inner;
    vertex(x, y);
  }
  endShape(CLOSE);
}

// ============================================================
// Arrow block (non-solid, redirects gravity on contact)
// ============================================================

class Arrow {
  constructor(col, row, dir) {
    this.col = col;
    this.row = row;
    this.dir = dir;
    this.x = col * TILE + TILE / 2;
    this.y = row * TILE + TILE / 2;
  }

  contains(px, py) {
    return px >= this.col * TILE && px < (this.col + 1) * TILE &&
           py >= this.row * TILE && py < (this.row + 1) * TILE;
  }

  draw() {
    push();
    // Pale tile background so the arrow reads as a special block
    noStroke();
    fill(220, 200, 180);      // lighter for night mood
    rect(this.col * TILE, this.row * TILE, TILE, TILE);
    stroke(150, 140, 130);
    strokeWeight(1);
    noFill();
    rect(this.col * TILE + 0.5, this.row * TILE + 0.5, TILE - 1, TILE - 1);

    // Direction the arrow points (matches gravity it sets)
    translate(this.x, this.y);
    const angles = [HALF_PI, PI, -HALF_PI, 0];   // DOWN, LEFT, UP, RIGHT
    rotate(angles[this.dir]);
    fill(60, 80, 200);
    stroke(20, 30, 100);
    strokeWeight(2);
    const s = TILE * 0.32;
    triangle(s, 0, -s * 0.6, -s * 0.75, -s * 0.6, s * 0.75);
    pop();
  }
}

// ============================================================
// Exit portal
// ============================================================

class ExitPortal {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = TILE * 0.45;
    this.phase = 0;
  }

  contains(px, py) {
    const dx = px - this.x, dy = py - this.y;
    return dx * dx + dy * dy < this.radius * this.radius;
  }

  update() {
    this.phase += 0.08;
  }

  draw() {
    push();
    // Glow halo (stacked translucent circles)
    noStroke();
    for (let i = 6; i >= 1; i--) {
      fill(220, 170, 255, 18);
      circle(this.x, this.y, this.radius * 2 * (1 + i * 0.22));
    }
    // Body
    fill(140, 60, 200);
    stroke(70, 20, 120);
    strokeWeight(2);
    circle(this.x, this.y, this.radius * 2);
    // Spiral interior that waves in a sine pattern
    noFill();
    stroke(240, 200, 255);
    strokeWeight(2);
    beginShape();
    const turns = 2.5;
    for (let t = 0; t < TWO_PI * turns; t += 0.1) {
      const baseR = (t / (TWO_PI * turns)) * this.radius * 0.85;
      const wobble = sin(t * 4 + this.phase * 2) * 1.6;
      const a = t * 1.5 + this.phase;
      vertex(this.x + cos(a) * (baseR + wobble),
             this.y + sin(a) * (baseR + wobble));
    }
    endShape();
    pop();
  }
}
