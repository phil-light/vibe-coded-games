// ============================================================
//  LOST PUP – a simple RPG in p5.js
//  A dog gets lost at a state fair and must find its family.
//  Paste into editor.p5js.org and click Play.
// ============================================================

// -- Game states --
const STATE_TITLE   = 0;
const STATE_STORY   = 1;
const STATE_PADDOCK = 2;
const STATE_MAP     = 3;
let gameState = STATE_TITLE;

// -- Player --
let pupName = "";
let typingName = true;
let cursorBlink = 0;

// -- Story slideshow --
let storyIndex = 0;
let storyFrame = 0;          // frames elapsed in current beat
let storyFade  = 0;          // 0..1 fade-in for each beat
const STORY_PANEL_TOP = 0;
const STORY_PANEL_BOT = 360; // caption area below
const STORY_BEATS = 5;

// -- Paddock layout (single-screen, top-down) --
const PAD_X = 110, PAD_Y = 170;
const PAD_W = 420, PAD_H = 220;
const GATE_W = 80;
const GATE_CX = PAD_X + PAD_W / 2;

// -- Pup (shared, used in paddock) --
let pup = {
  x: PAD_X + PAD_W / 2,
  y: PAD_Y + PAD_H / 2 + 20,
  dir: 0, frame: 0, speed: 2.2
};
let moving = false;
let bumpTimer = 0;       // brief flash when hitting fence
let gateNudges = 0;      // counts how many times player has poked the gate
let gateOpen = false;    // becomes true after biting the latch
let gateSwing = 0;       // animation amount for the gate opening (0..1)

// -- Action / message system --
let actionMessage = "";
let actionMessageTimer = 0;
let animalJumpTimer = 0; // bark startles the neighbours

// -- Overworld (retained for later use; not entered in this build) --
const TILE = 32;
const MAP_COLS = 40, MAP_ROWS = 30;
const MAP_W = MAP_COLS * TILE, MAP_H = MAP_ROWS * TILE;
let camX = 0, camY = 0;
let landmarks = [];

// -- Puzzle 4: Sniff Trail --
// Four "HOT" scent locations the family left behind. Sniffing within range
// of any of them adds it to scentsFound; gathering all four fires a one-shot
// recap message that confirms the destination.
const SCENT_BREADCRUMBS = [
  { id: "spawn",    tile: [33, 10] },
  { id: "restroom", tile: [17,  6] },
  { id: "picnic",   tile: [24,  3] },
  { id: "ferris",   tile: [ 8, 14] },
];
const HOT_RADIUS_TILES  = 3;   // generous so the player isn't pixel-hunting
const WARM_RADIUS_TILES = 6;   // ring around any breadcrumb that reads WARM
let scentsFound  = new Set();
let trailComplete = false;
let recapShown   = false;

// -- Puzzle 3: Wake Up Tito --
// Tito the Ferris Wheel operator is asleep on a bench tucked south of the
// Restrooms. Digging a dust patch under the bench sneezes him awake; he
// then walks (visibly, along a fixed waypoint path) to the operator booth
// next to the Ferris Wheel and starts the wheel turning. None of the other
// verbs solve the puzzle — bark just makes him snore louder, bite unties
// his shoelaces. State persists for the rest of the game.
const TITO_BENCH_TILE = [17, 6];     // tile center of the bench
const TITO_BENCH_PX   = (TITO_BENCH_TILE[0] + 0.5) * TILE;
const TITO_BENCH_PY   = (TITO_BENCH_TILE[1] + 0.5) * TILE;
const TITO_REACH      = 36;          // pixels — pup must be this close to interact
const FERRIS_BOOTH_TILE = [11.5, 13.5]; // east edge of the Ferris Wheel landmark
const FERRIS_BOOTH_PX = FERRIS_BOOTH_TILE[0] * TILE;
const FERRIS_BOOTH_PY = FERRIS_BOOTH_TILE[1] * TILE;
// Visible path Tito walks: south off the bench, onto the central east-west
// path, west along it, then north to his booth. Tile coords; converted to
// pixels at runtime.
const TITO_PATH_TILES = [
  [17.5,  7.0],
  [17.5, 18.5],
  [11.5, 18.5],
  [11.5, 13.5],
];
const TITO_WAKE_FRAMES = 90;   // sneeze beat before he stands up
const TITO_WALK_SPEED  = 1.6;  // pixels/frame on his march to the booth
let titoAwake     = false;
let titoAtBooth   = false;
let wheelTurning  = false;
let titoState     = "asleep";  // "asleep" | "waking" | "walking" | "atBooth"
let titoX         = TITO_BENCH_PX;
let titoY         = TITO_BENCH_PY;
let titoWakeFrame = 0;
let titoWaypoint  = 0;         // index into TITO_PATH_TILES
let wheelAngle    = 0;         // radians; ticks while wheelTurning
// Until the player visits the Ferris Wheel and notices the booth is empty,
// the operator simply isn't on the bench — the player has no in-fiction
// reason to be looking for him yet. Discovery flips this flag and from
// then on Tito is drawn snoring, sniff names him, and bark/bite/dig at the
// bench all become meaningful interactions.
let operatorMissingDiscovered = false;
// Tracks which verbs the player has actually tried at the bench, so the
// HUD nudge can reference them honestly instead of accusing the player of
// failed attempts they never made.
let titoBarkTried = false;
let titoBiteTried = false;

// -- Crowd of fairgoers --
// 150 NPCs scattered across the overworld, with denser clumps at food row,
// the Main Stage, and the carnival games. They don't block movement; the
// pup walks freely through them. They DO react to verbs: sniff one for a
// "not my family" reading, bark for a 70/25/5 reaction (smile / back away /
// summon Animal Control), bite for an instant catch, dig anywhere for a
// 20% chance of finding dropped food.
const PEOPLE_COUNT      = 150;
const PERSON_REACH      = 26;   // pixels — close enough to interact with a person
let people = [];

const SKIN_TONES = [
  [255, 230, 200], [240, 215, 180], [225, 195, 160], [205, 165, 130],
  [180, 130,  95], [145, 100,  75], [110,  75,  55], [ 85,  55,  40],
];

const HAIR_COLORS = [
  [ 30,  20,  15], [ 60,  35,  20], [ 95,  55,  30], [140,  85,  40],
  [200, 170, 100], [240, 215, 130], [180,  60,  30], [200, 200, 205],
  [ 60,  60,  70], [ 80,  50,  90],
];

const SHIRT_COLORS = [
  [220,  80,  80], [220, 140,  80], [240, 200,  80], [180, 220,  80],
  [ 80, 200, 120], [ 80, 200, 200], [ 80, 140, 220], [140,  80, 220],
  [220,  80, 180], [240, 240, 240], [ 40,  40,  60], [200, 200, 200],
  [180, 100,  60], [ 60, 120,  80], [120,  60,  80], [200, 220, 240],
  [255, 165,  60], [120, 180, 220], [220, 180, 200],
];

const PANTS_COLORS = [
  [ 40,  40,  60], [ 60,  40,  30], [ 80,  80,  90], [180, 140,  90],
  [ 70,  90, 130], [110,  85,  60], [ 50,  60,  70],
];

// Crowd density centers — (tileX, tileY, weight). Higher weight = more people
// spawn near here. Tuned so food row, Main Stage, and carnival games are
// dense, while landmark-edge clumps (Petting Zoo, Horse Barn) are smaller.
const CROWD_CENTERS = [
  // Food row (south of the central east-west path)
  { x:  5, y: 23, w: 14 }, { x: 10, y: 23, w: 14 }, { x: 15, y: 23, w: 14 },
  // Main Stage front (south of the stage building)
  { x:  9, y:  8, w: 18 }, { x:  9, y:  9, w: 10 },
  // Carnival games south
  { x: 26, y: 23, w:  8 }, { x: 32, y: 23, w:  8 },
  // Rides
  { x: 16, y: 14, w:  8 }, { x: 25, y: 14, w:  8 }, { x: 33, y: 14, w:  6 },
  // Ferris Wheel queue
  { x:  8, y: 16, w:  6 },
  // Picnic & Restrooms
  { x: 24, y:  6, w:  6 }, { x: 17, y:  7, w:  4 },
  // Open paths spread thin
  { x: 19, y: 19, w:  8 }, { x: 15, y: 19, w:  6 }, { x: 25, y: 19, w:  6 },
  { x: 30, y: 19, w:  5 }, { x:  5, y: 19, w:  5 }, { x: 35, y: 19, w:  4 },
  // Far corners — sparse
  { x:  3, y: 27, w:  3 }, { x: 36, y: 27, w:  3 }, { x: 36, y:  3, w:  3 },
  // Horse barn front (low — pup spawns here, don't pile people on it)
  { x: 33, y: 12, w:  3 },
];

// Snippets of sniff flavor text for individual fairgoers. "Not my family"
// is always prepended; this is just the trailing detail.
const PERSON_FLAVORS = [
  "smells like sunscreen and corn dogs.",
  "smells like cinnamon roll glaze and motor oil.",
  "smells like dryer sheets and worry.",
  "smells like cat — three cats — and stale coffee.",
  "smells like a different dog. A small one. Yappy.",
  "smells like denim and roller-coaster fear-sweat.",
  "smells like baby powder and maple syrup.",
  "smells like aftershave with a faint pickle ghost.",
  "smells like garlic fries and a recent argument.",
  "smells like menthol gum and thirty kinds of body spray.",
  "smells like a barn — but not the right one.",
  "smells like a dad who has been holding a balloon for an hour.",
  "smells like a kid who just ate cotton candy with both hands.",
  "smells like a teenager pretending to be cool.",
  "smells like funnel cake — but not the family's funnel cake.",
  "smells like horse, lavender soap, and gum.",
  "smells like sunscreen sprayed too aggressively.",
  "smells like a vape pen and shame.",
  "smells like leather wallet and parking-lot tar.",
  "smells like wet wipes and cheap perfume.",
  "smells like a wedding ring polished today.",
  "smells like fresh grass-clippings on hiking boots.",
  "smells like a tourist's brand-new sneakers.",
  "smells like sunscreen and powdered sugar.",
  "smells like a goldfish bag in a backpack somewhere.",
  "smells like onion rings and triumph.",
  "smells like rubber boots and hand sanitizer.",
  "smells like cigarette smoke ten minutes old.",
  "smells like a different family. They have a cat.",
  "smells like a teenager who has lost his parents.",
  "smells like nail polish and gummy bears.",
  "smells like a science teacher on summer vacation.",
  "smells like dishwasher steam and cologne.",
];

// ============================================================
//  SETUP / DRAW
// ============================================================
function setup() {
  createCanvas(640, 480);
  textFont("monospace");
  buildLandmarks();
  seedPeople();
}

function draw() {
  if (gameState === STATE_TITLE) {
    drawTitle();
  } else if (gameState === STATE_STORY) {
    drawStory();
  } else if (gameState === STATE_PADDOCK) {
    updatePaddock();
    drawPaddock();
  } else if (gameState === STATE_MAP) {
    updateMap();
    drawMap();
  }
}

// ============================================================
//  TITLE SCREEN
// ============================================================
function drawTitle() {
  for (let y = 0; y < height; y++) {
    let t = y / height;
    stroke(lerp(60, 20, t), lerp(120, 50, t), lerp(200, 100, t));
    line(0, y, width, y);
  }

  noStroke();
  randomSeed(42);
  for (let i = 0; i < 60; i++) {
    let sx = random(width);
    let sy = random(height * 0.5);
    let twinkle = 150 + 105 * sin(frameCount * 0.03 + i);
    fill(255, 255, 220, twinkle);
    ellipse(sx, sy, random(1.5, 3));
  }

  drawFerrisWheel(width * 0.75, height * 0.42, 80);

  noStroke();
  textAlign(CENTER, CENTER);
  fill(0, 0, 0, 80);
  textSize(52);
  text("LOST PUP", width / 2 + 2, 102);
  fill(255, 230, 130);
  text("LOST PUP", width / 2, 100);

  fill(200, 200, 220, 180);
  textSize(14);
  text("a state fair adventure", width / 2, 145);

  drawPupSprite(width / 2, 210, 3, 0, true);

  fill(255, 255, 255, 220);
  textSize(16);
  text("Name your pup:", width / 2, 280);

  let boxW = 220, boxH = 36;
  let boxX = width / 2 - boxW / 2;
  let boxY = 300;
  fill(20, 20, 40, 200);
  stroke(180, 180, 220, 150);
  strokeWeight(2);
  rect(boxX, boxY, boxW, boxH, 6);

  noStroke();
  fill(255);
  textSize(20);
  let displayName = pupName;
  cursorBlink += 0.06;
  if (sin(cursorBlink) > 0 && typingName) displayName += "_";
  text(displayName, width / 2, boxY + boxH / 2);

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

  let spokeCount = 8;
  let rot = frameCount * 0.005;
  for (let i = 0; i < spokeCount; i++) {
    let a = rot + (TWO_PI / spokeCount) * i;
    let ex = cx + cos(a) * r;
    let ey = cy + sin(a) * r;
    line(cx, cy, ex, ey);
    fill(60, 70, 100, 100);
    noStroke();
    rect(ex - 5, ey - 2, 10, 8, 2);
    stroke(40, 50, 80, 120);
    strokeWeight(2);
    noFill();
  }

  stroke(40, 50, 80, 140);
  strokeWeight(3);
  line(cx, cy, cx - r * 0.5, cy + r + 20);
  line(cx, cy, cx + r * 0.5, cy + r + 20);
  pop();
}

// ============================================================
//  STORY SLIDESHOW
// ============================================================
function drawStory() {
  storyFrame++;
  storyFade = constrain(storyFrame / 30, 0, 1);

  background(0);

  // Each beat draws into the panel area (0..STORY_PANEL_BOT)
  if      (storyIndex === 0) drawBeatArrival();
  else if (storyIndex === 1) drawBeatFerrisWheel();
  else if (storyIndex === 2) drawBeatCowChaos();
  else if (storyIndex === 3) drawBeatFlight();
  else if (storyIndex === 4) drawBeatWakeUp();

  // Fade-in mask
  if (storyFade < 1) {
    noStroke();
    fill(0, 0, 0, 255 * (1 - storyFade));
    rect(0, 0, width, STORY_PANEL_BOT);
  }

  drawStoryUI();
}

function drawStoryUI() {
  // Caption box
  noStroke();
  fill(15, 15, 22);
  rect(0, STORY_PANEL_BOT, width, height - STORY_PANEL_BOT);
  stroke(180, 180, 220, 80);
  strokeWeight(1);
  line(0, STORY_PANEL_BOT, width, STORY_PANEL_BOT);

  noStroke();
  fill(255, 230, 200);
  textAlign(LEFT, TOP);
  textSize(13);
  text(getStoryCaption(storyIndex, pupName), 24, STORY_PANEL_BOT + 18, width - 48, 80);

  // Page count
  textAlign(RIGHT, BOTTOM);
  textSize(10);
  fill(140, 140, 160);
  text("scene " + (storyIndex + 1) + " / " + STORY_BEATS, width - 16, height - 10);

  // Advance hint
  let alpha = 150 + 100 * sin(frameCount * 0.06);
  fill(255, 230, 130, alpha);
  textAlign(LEFT, BOTTOM);
  textSize(11);
  let hint = (storyIndex < STORY_BEATS - 1)
    ? "[ press SPACE / ENTER for next ]"
    : "[ press SPACE / ENTER to play ]";
  text(hint, 16, height - 10);
}

function getStoryCaption(i, name) {
  let n = name && name.length ? name : "the pup";
  switch (i) {
    case 0: return "It was a sunny morning, and the family arrived at the state fair with " + n + " happily tagging along.";
    case 1: return "While the family climbed aboard the Ferris wheel, they tied " + n + "'s leash to a temporary barrier nearby.";
    case 2: return "A farmer paused to pose her prize cow for a photo. The flash spooked the cow — it bolted, knocking the fence over!";
    case 3: return "Caught in the panic, " + n + " slipped free and fled through the crowd, frantically searching for the family.";
    case 4: return "" + n + " awoke in a small holding pen — the fair helpers had scooped up the loose pup and locked it in the small-animal paddock.";
  }
  return "";
}

// -- Beat 1: arrival at the fair --
function drawBeatArrival() {
  // Sky gradient
  for (let y = 0; y < STORY_PANEL_BOT; y++) {
    let t = y / STORY_PANEL_BOT;
    stroke(lerp(120, 200, t), lerp(180, 220, t), lerp(240, 230, t));
    line(0, y, width, y);
  }
  noStroke();

  // Sun
  fill(255, 240, 180, 90);
  ellipse(width - 100, 70, 110);
  fill(255, 235, 150);
  ellipse(width - 100, 70, 60);

  // Distant ferris wheel
  drawFerrisWheel(110, 130, 38);

  // Distant tents
  drawTent(220, 200, 50, [220, 90, 80]);
  drawTent(290, 195, 60, [80, 140, 200]);
  drawTent(380, 200, 55, [220, 180, 70]);
  drawTent(460, 198, 50, [120, 180, 100]);

  // Ground
  fill(110, 170, 80);
  rect(0, 245, width, STORY_PANEL_BOT - 245);
  // Path leading up to entrance
  fill(190, 165, 130);
  beginShape();
  vertex(width / 2 - 90, STORY_PANEL_BOT);
  vertex(width / 2 + 90, STORY_PANEL_BOT);
  vertex(width / 2 + 35, 245);
  vertex(width / 2 - 35, 245);
  endShape(CLOSE);

  // Fair entrance arch
  drawFairArch(width / 2, 245, 230);

  // Family + pup walking in (slow bob)
  let t = storyFrame * 0.08;
  let bob = sin(t) * 1.5;
  let approach = constrain(storyFrame * 0.3, 0, 60);
  let fy = STORY_PANEL_BOT - 35 - approach * 0.1;
  drawHuman(width / 2 - 70, fy + bob, 1.0, [70, 95, 150], [220, 195, 175], "dad");
  drawHuman(width / 2 - 35, fy - bob, 0.95, [180, 80, 100], [240, 215, 195], "mom");
  drawHuman(width / 2 + 5, fy + bob, 0.7, [230, 190, 70], [255, 220, 200], "kid");
  drawPupSideView(width / 2 + 40, fy + 10 - bob * 0.6, 1.2, true);

  // Floating balloon
  let by = 235 + sin(t * 0.7) * 6;
  fill(220, 70, 90);
  ellipse(width / 2 + 20, by, 14, 17);
  stroke(40);
  strokeWeight(1);
  line(width / 2 + 20, by + 8, width / 2 + 5, fy - 12);
  noStroke();
}

// -- Beat 2: Ferris wheel & tied-up pup --
function drawBeatFerrisWheel() {
  // Sky (afternoon)
  for (let y = 0; y < STORY_PANEL_BOT; y++) {
    let t = y / STORY_PANEL_BOT;
    stroke(lerp(255, 240, t), lerp(180, 200, t), lerp(140, 180, t));
    line(0, y, width, y);
  }
  noStroke();

  // Ground
  fill(120, 165, 85);
  rect(0, 280, width, STORY_PANEL_BOT - 280);

  // Big ferris wheel center-stage
  let wcx = width * 0.5;
  let wcy = 170;
  let wr = 130;
  drawBigFerrisWheel(wcx, wcy, wr, true);

  // Crowd silhouettes walking past in the foreground
  for (let i = 0; i < 5; i++) {
    let cx = (frameCount * 0.4 + i * 130) % (width + 80) - 40;
    let cy = 320 + (i % 2) * 6;
    drawCrowdPerson(cx, cy, 0.7, 60 + i * 30);
  }

  // Barrier / fence post in foreground with pup tied to it
  let fx = width * 0.22;
  let fy = 320;
  // Fence panel (chain-link-ish vertical posts)
  stroke(80, 60, 40);
  strokeWeight(3);
  line(fx - 40, fy + 20, fx + 40, fy + 20);
  line(fx - 40, fy + 5,  fx + 40, fy + 5);
  for (let i = -2; i <= 2; i++) {
    line(fx + i * 18, fy - 8, fx + i * 18, fy + 30);
  }
  noStroke();
  // post caps
  fill(60, 40, 25);
  for (let i = -2; i <= 2; i++) {
    ellipse(fx + i * 18, fy - 8, 4, 4);
  }

  // Pup sitting tied to it
  let pupX = fx + 5;
  let pupY = fy + 36;
  drawPupSideView(pupX, pupY, 1.4, false);

  // Leash from collar to fence post
  stroke(220, 60, 60);
  strokeWeight(2);
  noFill();
  bezier(pupX - 5, pupY - 4, pupX - 12, pupY - 18, fx - 15, fy + 5, fx - 18, fy + 8);
  noStroke();
}

function drawBigFerrisWheel(cx, cy, r, animated) {
  push();
  // Wheel rim
  stroke(80, 60, 40);
  strokeWeight(4);
  noFill();
  ellipse(cx, cy, r * 2, r * 2);
  stroke(120, 90, 50);
  strokeWeight(2);
  ellipse(cx, cy, r * 1.92, r * 1.92);

  let spokeCount = 8;
  let rot = animated ? frameCount * 0.006 : 0;
  for (let i = 0; i < spokeCount; i++) {
    let a = rot + (TWO_PI / spokeCount) * i;
    let ex = cx + cos(a) * r;
    let ey = cy + sin(a) * r;
    stroke(80, 60, 40);
    strokeWeight(2);
    line(cx, cy, ex, ey);

    // Gondola
    let gColors = [
      [220, 80, 80], [240, 200, 80], [120, 200, 130],
      [80, 160, 220], [180, 110, 220], [240, 130, 170],
      [80, 200, 200], [240, 160, 80]
    ];
    let gc = gColors[i];
    noStroke();
    fill(60, 40, 30);
    line(ex, ey, ex, ey + 8);
    stroke(60, 40, 30);
    strokeWeight(1);
    line(ex, ey, ex, ey + 8);
    noStroke();
    fill(gc[0], gc[1], gc[2]);
    rect(ex - 9, ey + 8, 18, 12, 3);
    fill(220, 230, 255, 200);
    rect(ex - 7, ey + 10, 14, 5);

    // The family is in the topmost gondola (highlighted)
    if (i === 6) { // approximately top after rotation
      // tiny waving figures
      fill(60, 70, 120);
      ellipse(ex - 4, ey + 11, 3, 3);
      fill(180, 80, 100);
      ellipse(ex,    ey + 11, 3, 3);
      fill(230, 190, 70);
      ellipse(ex + 4, ey + 11, 3, 3);
    }
  }

  // Center hub
  noStroke();
  fill(60, 40, 25);
  ellipse(cx, cy, 18, 18);
  fill(200, 180, 120);
  ellipse(cx, cy, 10, 10);

  // Support legs
  stroke(80, 60, 40);
  strokeWeight(5);
  line(cx, cy, cx - r * 0.55, cy + r + 24);
  line(cx, cy, cx + r * 0.55, cy + r + 24);
  pop();
}

// -- Beat 3: Cow chaos --
function drawBeatCowChaos() {
  // Sky / background tinted by camera flash
  let flashCycle = (storyFrame % 90);
  let flashAmt = 0;
  if (flashCycle < 8) flashAmt = 1 - flashCycle / 8;

  // Sky
  for (let y = 0; y < STORY_PANEL_BOT; y++) {
    let t = y / STORY_PANEL_BOT;
    stroke(lerp(220, 230, t), lerp(180, 210, t), lerp(140, 160, t));
    line(0, y, width, y);
  }
  noStroke();

  // Ground
  fill(120, 165, 85);
  rect(0, 240, width, STORY_PANEL_BOT - 240);

  // Distant booths
  drawTent(80, 220, 55, [180, 100, 120]);
  drawTent(540, 215, 60, [110, 160, 200]);

  // Photographer (left)
  drawPhotographer(120, 290, 1.0);

  // Cow rearing in the middle
  let shake = sin(storyFrame * 0.6) * 2;
  drawCow(330 + shake, 300, 1.4, true);

  // Farmer (right) being yanked by the rope
  drawFarmer(440, 295, 1.0);
  // Rope from farmer's hand to cow's head
  stroke(220, 200, 150);
  strokeWeight(2);
  noFill();
  bezier(425, 280, 400, 270, 380, 260, 305, 260 + shake);
  noStroke();

  // Knocked-over fence pieces
  push();
  translate(220, 320);
  rotate(-0.4);
  fill(140, 100, 60);
  rect(0, 0, 60, 5);
  rect(0, 12, 60, 5);
  pop();
  push();
  translate(280, 335);
  rotate(0.2);
  fill(140, 100, 60);
  rect(0, 0, 50, 4);
  pop();

  // Tied pup in panic, leash snapping
  let panicX = 250 + sin(storyFrame * 0.4) * 3;
  drawPupSideView(panicX, 335, 1.0, false);
  // panic squiggles above pup
  stroke(40);
  strokeWeight(1.5);
  noFill();
  for (let i = 0; i < 3; i++) {
    let sx = panicX - 12 + i * 10;
    line(sx, 312, sx + 3, 308);
    line(sx + 3, 308, sx, 304);
  }
  noStroke();

  // Camera flash burst
  if (flashAmt > 0) {
    // White overlay
    fill(255, 255, 255, 220 * flashAmt);
    rect(0, 0, width, STORY_PANEL_BOT);

    // Flash rays from photographer
    push();
    translate(132, 270);
    stroke(255, 255, 200, 230 * flashAmt);
    strokeWeight(3);
    for (let a = -PI/2 - 0.6; a <= -PI/2 + 0.6; a += 0.15) {
      line(0, 0, cos(a) * 200, sin(a) * 200);
    }
    pop();
  }

  // "*FLASH!*" text
  if (flashAmt > 0.2) {
    push();
    translate(165, 230);
    rotate(-0.15);
    noStroke();
    fill(255, 240, 80);
    textAlign(CENTER, CENTER);
    textSize(28);
    text("*FLASH!*", 0, 0);
    pop();
  }
}

// -- Beat 4: The flight --
function drawBeatFlight() {
  // Sky a bit later, dustier
  for (let y = 0; y < STORY_PANEL_BOT; y++) {
    let t = y / STORY_PANEL_BOT;
    stroke(lerp(230, 220, t), lerp(170, 180, t), lerp(120, 130, t));
    line(0, y, width, y);
  }
  noStroke();

  // Ground
  fill(140, 130, 90);
  rect(0, 250, width, STORY_PANEL_BOT - 250);

  // Crowd of legs in background, jumbled
  for (let i = 0; i < 14; i++) {
    let cx = (i * 47 + (frameCount * 0.6) % 47) % width;
    let cy = 245 + (i % 3) * 10;
    drawCrowdPerson(cx, cy + 18, 0.85, 90 + i * 17);
  }

  // Dust clouds (plumes left behind by the running pup)
  for (let i = 0; i < 6; i++) {
    let dx = 380 - i * 35 + sin(frameCount * 0.1 + i) * 2;
    let dy = 330 + (i % 2) * 6;
    fill(200, 190, 160, 180 - i * 25);
    ellipse(dx, dy, 28 - i * 2, 14 - i);
  }

  // Pup running fast (offset bob)
  let runBob = sin(frameCount * 0.5) * 2;
  let runX = 200 + sin(frameCount * 0.05) * 6;
  drawRunningPup(runX, 320 + runBob, 1.6);

  // Motion lines behind the pup
  stroke(60, 50, 40, 200);
  strokeWeight(2);
  for (let i = 0; i < 5; i++) {
    let mx = runX + 30 + i * 16;
    let my = 305 + i * 5;
    line(mx, my, mx + 14, my);
  }
  noStroke();

  // Anxious "?!" above the pup
  fill(40);
  textAlign(LEFT, CENTER);
  textSize(22);
  text("?!", runX - 20, 290 - sin(frameCount * 0.2) * 2);
}

// -- Beat 5: Waking up in the holding pen --
function drawBeatWakeUp() {
  // Dim barn lighting
  background(70, 55, 45);

  // Wooden wall behind
  fill(110, 80, 55);
  rect(0, 0, width, 130);
  stroke(80, 55, 35);
  strokeWeight(1);
  for (let i = 0; i < 14; i++) {
    line(i * 50, 0, i * 50, 130);
  }
  noStroke();
  // Beam
  fill(70, 50, 30);
  rect(0, 122, width, 8);

  // Window beam of light
  fill(255, 220, 140, 60);
  beginShape();
  vertex(420, 0);
  vertex(560, 0);
  vertex(640, 240);
  vertex(360, 240);
  endShape(CLOSE);

  // Floor (dirt with hay)
  fill(150, 110, 70);
  rect(0, 130, width, STORY_PANEL_BOT - 130);
  // Hay strands
  stroke(220, 200, 130);
  strokeWeight(1);
  randomSeed(7);
  for (let i = 0; i < 60; i++) {
    let hx = random(width);
    let hy = random(140, STORY_PANEL_BOT - 5);
    let ang = random(-0.4, 0.4);
    line(hx, hy, hx + cos(ang) * 6, hy + sin(ang) * 6);
  }
  noStroke();

  // Pen fence (foreground rails)
  drawPenFence(60, 240, 520, 100);

  // Sleeping pup curled up
  drawSleepingPup(width / 2, 305, 1.6);

  // ZZZ
  push();
  let zt = storyFrame * 0.04;
  noStroke();
  fill(220, 220, 240, 200);
  textAlign(LEFT, CENTER);
  textSize(20);
  text("z", width / 2 + 30 + sin(zt) * 2, 270 - (zt * 8) % 30);
  textSize(16);
  text("z", width / 2 + 22 + sin(zt + 1) * 2, 280 - (zt * 8 + 10) % 30);
  textSize(12);
  text("z", width / 2 + 16 + sin(zt + 2) * 2, 286 - (zt * 8 + 20) % 30);
  pop();

  // A nearby caged rabbit pen for context
  drawTinyPen(70, 250, 70, 50, [240, 240, 240]); // rabbit
  drawTinyPen(515, 252, 75, 55, [230, 200, 130]); // chicken
}

// ============================================================
//  STORY HELPERS – figures and props
// ============================================================
function drawHuman(x, y, scale, shirt, skin, kind) {
  push();
  translate(x, y);
  let s = scale;

  // Shadow
  noStroke();
  fill(0, 0, 0, 60);
  ellipse(0, 18 * s, 18 * s, 4 * s);

  // Legs
  fill(40, 40, 70);
  rect(-3 * s, 0, 2.5 * s, 14 * s, 1);
  rect(0.6 * s, 0, 2.5 * s, 14 * s, 1);

  // Body
  fill(shirt[0], shirt[1], shirt[2]);
  rect(-5 * s, -16 * s, 10 * s, 18 * s, 2);

  // Arms
  fill(skin[0], skin[1], skin[2]);
  rect(-7 * s, -15 * s, 2 * s, 13 * s, 1);
  rect(5 * s, -15 * s, 2 * s, 13 * s, 1);

  // Head
  fill(skin[0], skin[1], skin[2]);
  ellipse(0, -22 * s, 9 * s, 10 * s);

  // Hair
  if (kind === "mom") {
    fill(110, 60, 30);
    arc(0, -23 * s, 11 * s, 9 * s, PI, TWO_PI);
    fill(110, 60, 30);
    rect(-5.5 * s, -23 * s, 11 * s, 5 * s, 2);
  } else if (kind === "kid") {
    fill(180, 130, 60);
    arc(0, -23 * s, 9 * s, 7 * s, PI, TWO_PI);
  } else {
    fill(60, 40, 25);
    arc(0, -23 * s, 9 * s, 6 * s, PI, TWO_PI);
  }

  // Smile
  noFill();
  stroke(50, 30, 20);
  strokeWeight(0.8);
  arc(0, -20 * s, 3 * s, 2 * s, 0, PI);
  noStroke();

  pop();
}

function drawCrowdPerson(x, y, scale, hueSeed) {
  let s = scale;
  push();
  translate(x, y);
  noStroke();
  // legs
  fill(30, 30, 50);
  rect(-3 * s, 0, 2.5 * s, 14 * s);
  rect(0.6 * s, 0, 2.5 * s, 14 * s);
  // body (varied shirt)
  let r = 80 + (hueSeed * 13) % 160;
  let g = 80 + (hueSeed * 29) % 160;
  let b = 80 + (hueSeed * 7) % 160;
  fill(r, g, b);
  rect(-5 * s, -16 * s, 10 * s, 18 * s, 2);
  // head
  fill(220, 195, 175);
  ellipse(0, -22 * s, 8 * s, 9 * s);
  // hair
  fill(40, 25, 15);
  arc(0, -23 * s, 8 * s, 6 * s, PI, TWO_PI);
  pop();
}

function drawFarmer(x, y, scale) {
  let s = scale;
  drawHuman(x, y, scale, [180, 70, 70], [230, 200, 175], "dad");
  // straw hat brim
  push();
  translate(x, y);
  noStroke();
  fill(220, 180, 110);
  ellipse(0, -28 * s, 18 * s, 4 * s);
  fill(200, 160, 90);
  rect(-4.5 * s, -32 * s, 9 * s, 5 * s, 2);
  // overalls strap
  fill(60, 80, 130);
  rect(-2 * s, -16 * s, 1.5 * s, 18 * s);
  pop();
}

function drawPhotographer(x, y, scale) {
  let s = scale;
  drawHuman(x, y, scale, [50, 60, 80], [220, 195, 175], "dad");
  // hands holding camera up to face
  push();
  translate(x, y);
  noStroke();
  fill(20, 20, 25);
  rect(-7 * s, -28 * s, 14 * s, 8 * s, 1);
  fill(70, 70, 80);
  ellipse(0, -24 * s, 5 * s, 5 * s);
  fill(220, 220, 230);
  ellipse(0, -24 * s, 2.5 * s, 2.5 * s);
  // little flash bulb on top
  fill(255, 255, 200);
  rect(3 * s, -32 * s, 4 * s, 3 * s, 1);
  pop();
}

function drawCow(x, y, scale, rearing) {
  push();
  translate(x, y);
  if (rearing) rotate(-0.45);
  let s = scale;

  noStroke();
  // body
  fill(245, 245, 240);
  ellipse(0, 0, 50 * s, 28 * s);
  // spots
  fill(40, 40, 40);
  ellipse(-10 * s, -3 * s, 12 * s, 9 * s);
  ellipse(8 * s, 4 * s, 10 * s, 7 * s);
  ellipse(16 * s, -5 * s, 9 * s, 6 * s);
  ellipse(-18 * s, 5 * s, 7 * s, 5 * s);

  // back legs (stationary)
  fill(40, 40, 40);
  rect(10 * s, 8 * s, 4 * s, 16 * s);
  rect(16 * s, 8 * s, 4 * s, 16 * s);

  // front legs (kicking up)
  rect(-12 * s, 4 * s, 4 * s, 14 * s);
  rect(-6 * s, 4 * s, 4 * s, 14 * s);

  // udder
  fill(255, 195, 200);
  ellipse(8 * s, 12 * s, 9 * s, 6 * s);

  // head
  fill(245, 245, 240);
  ellipse(-26 * s, -5 * s, 18 * s, 14 * s);
  // snout
  fill(220, 175, 175);
  ellipse(-33 * s, -2 * s, 9 * s, 7 * s);
  // nostrils
  fill(120, 80, 80);
  ellipse(-35 * s, -3 * s, 1.8 * s);
  ellipse(-35 * s, 0 * s, 1.8 * s);
  // eye (panicked, wide)
  fill(255);
  ellipse(-26 * s, -10 * s, 5 * s, 5 * s);
  fill(0);
  ellipse(-25 * s, -10 * s, 2.4 * s, 2.4 * s);
  // horns
  fill(225, 205, 165);
  triangle(-26 * s, -12 * s, -28 * s, -19 * s, -22 * s, -12 * s);
  triangle(-22 * s, -12 * s, -22 * s, -19 * s, -18 * s, -12 * s);
  // ear
  fill(40, 40, 40);
  ellipse(-19 * s, -12 * s, 6 * s, 4 * s);

  pop();
}

function drawTent(x, y, w, color) {
  push();
  translate(x, y);
  noStroke();
  // shadow
  fill(0, 0, 0, 50);
  ellipse(0, w * 0.32, w * 1.1, w * 0.18);
  // body
  fill(color[0], color[1], color[2]);
  triangle(-w / 2, w * 0.3, w / 2, w * 0.3, 0, -w * 0.45);
  // stripe
  fill(255, 255, 255, 150);
  triangle(-w / 4, w * 0.15, w / 4, w * 0.15, 0, -w * 0.2);
  // flag
  stroke(60, 40, 30);
  strokeWeight(1);
  line(0, -w * 0.45, 0, -w * 0.6);
  noStroke();
  fill(220, 50, 50);
  triangle(0, -w * 0.6, 0, -w * 0.5, w * 0.18, -w * 0.55);
  pop();
}

function drawFairArch(cx, baseY, w) {
  push();
  noStroke();
  // Posts
  fill(140, 100, 60);
  rect(cx - w / 2 - 6, baseY - 90, 12, 90);
  rect(cx + w / 2 - 6, baseY - 90, 12, 90);
  // Banner
  fill(220, 60, 60);
  rect(cx - w / 2 - 10, baseY - 110, w + 20, 30, 4);
  fill(255, 235, 130);
  textAlign(CENTER, CENTER);
  textSize(15);
  text("STATE FAIR", cx, baseY - 95);
  // Bunting
  stroke(240, 220, 80);
  strokeWeight(1.5);
  noFill();
  for (let i = 0; i < 10; i++) {
    let x1 = cx - w / 2 + i * (w / 10);
    let x2 = cx - w / 2 + (i + 1) * (w / 10);
    arc((x1 + x2) / 2, baseY - 75, x2 - x1, 8, 0, PI);
  }
  pop();
}

function drawPupSideView(x, y, scale, isMoving) {
  push();
  translate(x, y);
  let s = scale;

  // Shadow
  noStroke();
  fill(0, 0, 0, 60);
  ellipse(0, 9 * s, 22 * s, 4 * s);

  // Body
  fill(180, 130, 70);
  ellipse(0, 0, 22 * s, 12 * s);

  // Front leg
  fill(150, 100, 50);
  let stepF = isMoving ? sin(frameCount * 0.3) * 1.5 * s : 0;
  rect(-2 * s, 4 * s, 2.4 * s, 6 * s + stepF);
  rect(4 * s,  4 * s, 2.4 * s, 6 * s - stepF);
  // Back leg
  rect(-8 * s, 4 * s, 2.4 * s, 6 * s - stepF);
  rect(-5 * s, 4 * s, 2.4 * s, 6 * s + stepF);

  // Tail
  noFill();
  stroke(180, 130, 70);
  strokeWeight(2.5 * s);
  let wag = isMoving ? sin(frameCount * 0.4) * 0.4 : 0.1;
  arc(-9 * s, -2 * s, 8 * s, 10 * s, -PI - 0.3 + wag, -HALF_PI + wag);
  noStroke();

  // Head
  fill(200, 150, 80);
  ellipse(10 * s, -3 * s, 13 * s, 11 * s);

  // Ear
  fill(150, 100, 50);
  triangle(8 * s, -8 * s, 5 * s, -13 * s, 12 * s, -8 * s);

  // Collar
  fill(220, 60, 60);
  rect(4 * s, 0 * s, 5 * s, 2 * s);

  // Eye
  fill(20);
  ellipse(13 * s, -3 * s, 1.6 * s);

  // Nose
  fill(40, 25, 25);
  ellipse(16 * s, -1 * s, 2.4 * s, 1.8 * s);

  // Mouth (small smile)
  stroke(40, 25, 25);
  strokeWeight(0.8);
  noFill();
  arc(15 * s, 1 * s, 3 * s, 2 * s, 0, PI);

  pop();
}

function drawRunningPup(x, y, scale) {
  push();
  translate(x, y);
  let s = scale;

  // Body stretched
  noStroke();
  fill(0, 0, 0, 70);
  ellipse(0, 10 * s, 28 * s, 4 * s);

  fill(180, 130, 70);
  ellipse(0, 0, 26 * s, 11 * s);

  // Legs splayed (running pose)
  fill(150, 100, 50);
  let f = sin(frameCount * 0.6) * 3 * s;
  // back legs
  rect(-10 * s, 3 * s, 2.4 * s, 7 * s + f);
  rect(-7 * s, 3 * s, 2.4 * s, 7 * s - f);
  // front legs
  rect(5 * s, 3 * s, 2.4 * s, 7 * s + f);
  rect(8 * s, 3 * s, 2.4 * s, 7 * s - f);

  // Tail (straight back, fearful)
  noFill();
  stroke(180, 130, 70);
  strokeWeight(2.4 * s);
  line(-12 * s, -2 * s, -20 * s, -1 * s);
  noStroke();

  // Head
  fill(200, 150, 80);
  ellipse(12 * s, -3 * s, 13 * s, 11 * s);
  // Ears flopping
  fill(150, 100, 50);
  triangle(8 * s, -7 * s, 6 * s, -13 * s, 12 * s, -7 * s);

  // Eye wide
  fill(255);
  ellipse(15 * s, -4 * s, 4 * s, 4 * s);
  fill(0);
  ellipse(16 * s, -4 * s, 2 * s, 2 * s);

  // Nose
  fill(40, 25, 25);
  ellipse(18 * s, -1 * s, 2.4 * s, 1.8 * s);

  // Mouth open
  fill(180, 80, 80);
  ellipse(17 * s, 2 * s, 4 * s, 3 * s);

  // Tongue
  fill(230, 100, 110);
  ellipse(18 * s, 3 * s, 3 * s, 2 * s);

  pop();
}

function drawSleepingPup(x, y, scale) {
  push();
  translate(x, y);
  let s = scale;
  noStroke();
  // shadow
  fill(0, 0, 0, 80);
  ellipse(0, 10 * s, 36 * s, 6 * s);
  // curled body
  fill(180, 130, 70);
  ellipse(0, 0, 32 * s, 18 * s);
  fill(160, 110, 55);
  arc(0, 0, 32 * s, 18 * s, 0, PI);
  // head resting on body
  fill(200, 150, 80);
  ellipse(-12 * s, 2 * s, 14 * s, 11 * s);
  // ear
  fill(150, 100, 50);
  triangle(-15 * s, -3 * s, -19 * s, -8 * s, -10 * s, -3 * s);
  // closed eye (line)
  stroke(40);
  strokeWeight(1);
  line(-15 * s, 1 * s, -11 * s, 1 * s);
  noStroke();
  // nose
  fill(40, 25, 25);
  ellipse(-18 * s, 4 * s, 2.4 * s, 1.8 * s);
  // tail
  noFill();
  stroke(180, 130, 70);
  strokeWeight(3 * s);
  arc(10 * s, -2 * s, 14 * s, 14 * s, -HALF_PI, PI);
  pop();
}

function drawPenFence(x, y, w, h) {
  push();
  noStroke();
  // top rail
  fill(120, 85, 55);
  rect(x, y, w, 6);
  // bottom rail
  rect(x, y + h - 6, w, 6);
  // posts
  fill(100, 70, 45);
  for (let i = 0; i <= w; i += 50) {
    rect(x + i, y - 6, 8, h + 12);
  }
  // shadow line
  stroke(50, 30, 20, 80);
  strokeWeight(1);
  line(x, y + h, x + w, y + h);
  pop();
}

function drawTinyPen(x, y, w, h, animalColor) {
  push();
  noStroke();
  // pen ground
  fill(150, 110, 70);
  rect(x, y, w, h);
  // wire fence
  stroke(90, 70, 50);
  strokeWeight(1);
  for (let i = 0; i <= w; i += 8) {
    line(x + i, y, x + i, y + h);
  }
  for (let j = 0; j <= h; j += 10) {
    line(x, y + j, x + w, y + j);
  }
  noStroke();
  // Animal jumps when startled by a bark.
  let jump = 0;
  if (animalJumpTimer > 0) {
    let t = animalJumpTimer / 40;
    jump = -sin(t * PI) * 8;
  }
  // tiny animal
  fill(animalColor[0], animalColor[1], animalColor[2]);
  ellipse(x + w / 2, y + h / 2 + 4 + jump, w * 0.5, h * 0.45);
  fill(animalColor[0] - 20, animalColor[1] - 20, animalColor[2] - 20);
  ellipse(x + w / 2 + 6, y + h / 2 - 4 + jump, w * 0.25, h * 0.3);
  // exclamation when jumping
  if (animalJumpTimer > 20) {
    fill(40);
    textAlign(CENTER, CENTER);
    textSize(12);
    text("!", x + w / 2 - 14, y + h / 2 - 10 + jump);
  }
  pop();
}

// ============================================================
//  PADDOCK – starting gameplay state
// ============================================================
function updatePaddock() {
  if (bumpTimer > 0) bumpTimer--;
  if (actionMessageTimer > 0) actionMessageTimer--;
  if (animalJumpTimer > 0) animalJumpTimer--;
  if (gateOpen && gateSwing < 1) gateSwing = min(1, gateSwing + 0.04);

  moving = false;
  let dx = 0, dy = 0;
  if (keyIsDown(LEFT_ARROW))  { dx = -1; pup.dir = 1; }
  if (keyIsDown(RIGHT_ARROW)) { dx =  1; pup.dir = 2; }
  if (keyIsDown(UP_ARROW))    { dy = -1; pup.dir = 3; }
  if (keyIsDown(DOWN_ARROW))  { dy =  1; pup.dir = 0; }

  if (dx !== 0 || dy !== 0) {
    moving = true;
    if (dx !== 0 && dy !== 0) { dx *= 0.707; dy *= 0.707; }

    let newX = pup.x + dx * pup.speed;
    let newY = pup.y + dy * pup.speed;

    // Collision: stay inside the paddock interior, except past an open gate.
    let minX = PAD_X + 12;
    let maxX = PAD_X + PAD_W - 12;
    let minY = PAD_Y + 12;
    let maxY = PAD_Y + PAD_H - 12;

    let bumped = false;
    if (newX < minX) { newX = minX; bumped = true; }
    if (newX > maxX) { newX = maxX; bumped = true; }
    if (newY < minY) { newY = minY; bumped = true; }

    // South side: gated. Pass-through only when the gate is open AND the
    // pup is roughly within the gate width.
    let inGateGap = Math.abs(newX - GATE_CX) < GATE_W / 2 - 4;
    if (newY > maxY && !(gateOpen && inGateGap)) {
      newY = maxY;
      bumped = true;
      if (!gateOpen && Math.abs(newX - GATE_CX) < GATE_W / 2 + 4) {
        gateNudges++;
      }
    }
    if (bumped) bumpTimer = 12;

    pup.x = newX;
    pup.y = newY;
    pup.frame += 0.15;
  }

  // Once the gate is open and the pup has walked past the south fence line,
  // hand control off to the overworld.
  if (gateOpen && pup.y > PAD_Y + PAD_H + 24) {
    enterOverworld();
  }
}

// ---- Paddock actions ----------------------------------------------------
function setActionMessage(msg, duration) {
  actionMessage = msg;
  actionMessageTimer = duration || 240;
}

function pupNearFence() {
  let edge = 28;
  return (pup.x - PAD_X)            < edge
      || (PAD_X + PAD_W - pup.x)    < edge
      || (pup.y - PAD_Y)            < edge
      || (PAD_Y + PAD_H - pup.y)    < edge;
}

function pupNearGate() {
  let dy = (PAD_Y + PAD_H) - pup.y;
  let dx = pup.x - GATE_CX;
  return dy < 36 && Math.abs(dx) < GATE_W / 2 + 6;
}

function doSniff() {
  setActionMessage(
    pupName + " sniffs the air... rabbits, chickens, sun-warmed dirt, and " +
    "a faint, delicious whiff of funnel cake on the breeze!");
}

function doDig() {
  if (pupNearFence()) {
    setActionMessage(
      pupName + " scratches at the dirt by the fence... wire netting is " +
      "buried along the bottom. The small-animal pens are built tight.");
  } else {
    setActionMessage(
      pupName + " kicks up a small cloud of dirt. Nothing buried here in " +
      "the middle of the pen.");
  }
}

function doBark() {
  animalJumpTimer = 40;
  setActionMessage(
    pupName + " lets out a sharp BARK! The rabbit and chickens jump in " +
    "their cages — but no one comes to investigate.");
}

function doBite() {
  if (pupNearGate()) {
    if (!gateOpen) {
      gateOpen = true;
      setActionMessage(
        pupName + " chomps down on the latch — *click!* The simple hand " +
        "latch flips open and the gate swings wide. Head south to escape!");
    } else {
      setActionMessage("The gate is already open. Walk south to escape!");
    }
  } else {
    setActionMessage(
      pupName + " snaps at the air. (Bite works on something specific — " +
      "maybe the gate's latch?)");
  }
}

function enterOverworld() {
  gameState = STATE_MAP;
  // Spawn just south of the Horse Barn landmark (tiles 30..35, y=5..8).
  pup.x = 33 * TILE;
  pup.y = 9 * TILE + 16;
  pup.dir = 0;
  pup.frame = 0;
  camX = constrain(pup.x - width / 2, 0, MAP_W - width);
  camY = constrain(pup.y - height / 2, 0, MAP_H - height);
}

function drawPaddock() {
  // Sky / outside-the-pen area
  background(96, 145, 78);

  // Subtle grass texture stripes
  noStroke();
  fill(86, 135, 68);
  for (let i = 0; i < 16; i++) {
    rect(0, i * 30 + (frameCount * 0.05) % 30, width, 12);
  }

  // Horse barn building (top of the screen)
  drawHorseBarn(40, 12, width - 80, 130);

  // Path leading away to the south (blocked at the bottom edge)
  fill(180, 155, 120);
  rect(GATE_CX - 35, PAD_Y + PAD_H + 4, 70, height - (PAD_Y + PAD_H + 4));
  // Path texture
  fill(165, 140, 105);
  for (let i = 0; i < 4; i++) {
    rect(GATE_CX - 30, PAD_Y + PAD_H + 16 + i * 20, 60, 4);
  }

  // Neighboring small-animal pens
  drawTinyPen(20, 250, 75, 60, [240, 240, 240]);   // rabbit
  drawTinyPen(20, 320, 75, 60, [230, 200, 130]);   // chicken
  drawTinyPen(width - 95, 250, 75, 60, [230, 200, 130]);
  drawTinyPen(width - 95, 320, 75, 60, [240, 230, 230]);

  // Hay bales decoration just outside the paddock
  drawHayBale(50, 210);
  drawHayBale(width - 90, 210);

  // Paddock dirt floor (interior)
  fill(168, 138, 95);
  rect(PAD_X, PAD_Y, PAD_W, PAD_H);
  // Dirt speckles
  noStroke();
  randomSeed(11);
  for (let i = 0; i < 70; i++) {
    fill(140, 110, 75);
    let dx = PAD_X + random(PAD_W);
    let dy = PAD_Y + random(PAD_H);
    ellipse(dx, dy, random(2, 4), random(2, 4));
  }

  // Water trough sits inside the paddock (drawn over the dirt)
  drawWaterTrough(PAD_X + 16, PAD_Y + PAD_H - 36);

  // Paddock fence (top, sides, bottom-with-gate)
  drawPaddockFence();

  // Pup inside the paddock
  let bobble = moving ? sin(pup.frame * 4) * 2 : 0;
  drawPupSprite(pup.x, pup.y + bobble, 1.5, pup.dir, moving);

  // Pup name tag
  noStroke();
  fill(0, 0, 0, 90);
  rect(pup.x - 26, pup.y - 28, 52, 13, 3);
  fill(255, 255, 255, 230);
  textAlign(CENTER, CENTER);
  textSize(10);
  text(pupName, pup.x, pup.y - 22);

  // Bump flash
  if (bumpTimer > 0) {
    fill(255, 80, 80, bumpTimer * 14);
    noStroke();
    rect(0, 0, width, height);
  }

  drawPaddockHUD();
}

function drawPaddockFence() {
  push();
  noStroke();

  // Top rail
  fill(130, 90, 55);
  rect(PAD_X - 6, PAD_Y - 6, PAD_W + 12, 6);
  fill(110, 75, 45);
  rect(PAD_X - 6, PAD_Y, PAD_W + 12, 4);

  // Left rail
  fill(130, 90, 55);
  rect(PAD_X - 6, PAD_Y - 6, 6, PAD_H + 12);
  // Right rail
  rect(PAD_X + PAD_W, PAD_Y - 6, 6, PAD_H + 12);

  // Bottom rail (split for the gate)
  fill(130, 90, 55);
  rect(PAD_X - 6, PAD_Y + PAD_H, GATE_CX - GATE_W / 2 - (PAD_X - 6), 6);
  rect(GATE_CX + GATE_W / 2, PAD_Y + PAD_H,
       (PAD_X + PAD_W + 6) - (GATE_CX + GATE_W / 2), 6);

  // Posts
  fill(95, 65, 40);
  for (let i = 0; i <= PAD_W; i += 60) {
    // top edge posts
    rect(PAD_X + i - 4, PAD_Y - 12, 8, 10);
    // bottom edge posts (skip those inside the gate gap)
    if (PAD_X + i < GATE_CX - GATE_W / 2 - 4 ||
        PAD_X + i > GATE_CX + GATE_W / 2 + 4) {
      rect(PAD_X + i - 4, PAD_Y + PAD_H + 4, 8, 10);
    }
  }
  for (let j = 0; j <= PAD_H; j += 60) {
    rect(PAD_X - 12, PAD_Y + j - 4, 10, 8);
    rect(PAD_X + PAD_W + 2, PAD_Y + j - 4, 10, 8);
  }

  // Gate posts
  fill(80, 55, 30);
  rect(GATE_CX - GATE_W / 2 - 5, PAD_Y + PAD_H - 6, 5, 18);
  rect(GATE_CX + GATE_W / 2,     PAD_Y + PAD_H - 6, 5, 18);

  // Gate — hinges on the left post. When open, swings outward toward the
  // south so the south path is unobstructed.
  push();
  translate(GATE_CX - GATE_W / 2, PAD_Y + PAD_H + 3);
  rotate(gateSwing * HALF_PI);
  fill(140, 100, 60);
  rect(4, -6, GATE_W - 8, 6);
  rect(4, 4,  GATE_W - 8, 6);
  // Cross brace
  stroke(110, 75, 40);
  strokeWeight(2);
  line(4, 8, GATE_W - 4, -6);
  noStroke();
  // Latch + padlock at the far (free) end of the gate
  if (gateSwing < 0.05) {
    fill(120, 120, 130);
    rect(GATE_W - 16, -2, 14, 5, 1);
    fill(180, 180, 195);
    ellipse(GATE_W - 4, 1, 8, 9);
    fill(40);
    ellipse(GATE_W - 4, 2, 3, 4);
  } else {
    // Latch popped open
    fill(120, 120, 130);
    rect(GATE_W - 16, -2, 10, 5, 1);
    fill(180, 180, 195);
    ellipse(GATE_W - 4, 2, 8, 9);
    noFill();
    stroke(160, 160, 175);
    strokeWeight(2);
    arc(GATE_W - 4, -2, 6, 7, PI + 0.4, TWO_PI - 0.4);
    noStroke();
  }
  pop();
  pop();
}

function drawHorseBarn(x, y, w, h) {
  push();
  noStroke();
  // Roof
  fill(140, 60, 50);
  triangle(x - 8, y + 30, x + w + 8, y + 30, x + w / 2, y - 12);
  // Roof shading
  fill(110, 45, 38);
  triangle(x - 8, y + 30, x + w / 2, y + 30, x + w / 2, y - 12);

  // Barn body
  fill(170, 80, 65);
  rect(x, y + 28, w, h - 28);
  // Plank lines
  stroke(110, 50, 40);
  strokeWeight(1);
  for (let i = 0; i < w; i += 20) {
    line(x + i, y + 28, x + i, y + h);
  }
  noStroke();

  // Big barn doors
  fill(110, 50, 40);
  rect(x + w / 2 - 38, y + 50, 76, h - 50);
  fill(80, 35, 25);
  rect(x + w / 2 - 38, y + 50, 38, h - 50);
  // X braces on doors
  stroke(60, 30, 20);
  strokeWeight(2);
  line(x + w / 2 - 38, y + 50, x + w / 2,      y + h);
  line(x + w / 2,      y + 50, x + w / 2 - 38, y + h);
  line(x + w / 2,      y + 50, x + w / 2 + 38, y + h);
  line(x + w / 2 + 38, y + 50, x + w / 2,      y + h);
  noStroke();

  // Hayloft window
  fill(60, 35, 25);
  rect(x + w / 2 - 12, y + 4, 24, 22);
  fill(220, 200, 130);
  rect(x + w / 2 - 9, y + 7, 18, 16);
  // Sign
  fill(240, 230, 200);
  rect(x + w / 2 - 50, y + h - 26, 100, 16, 3);
  fill(60, 30, 20);
  textAlign(CENTER, CENTER);
  textSize(10);
  text("HORSE BARN", x + w / 2, y + h - 18);
  pop();
}

function drawHayBale(x, y) {
  push();
  noStroke();
  fill(0, 0, 0, 60);
  ellipse(x + 22, y + 28, 50, 8);
  fill(220, 190, 110);
  rect(x, y, 44, 26, 3);
  fill(200, 165, 90);
  for (let i = 0; i < 5; i++) line(x + 4, y + 4 + i * 5, x + 40, y + 4 + i * 5);
  stroke(160, 130, 70);
  strokeWeight(1);
  for (let i = 0; i < 5; i++) line(x + 4, y + 4 + i * 5, x + 40, y + 4 + i * 5);
  noStroke();
  pop();
}

function drawWaterTrough(x, y) {
  push();
  noStroke();
  // wood
  fill(95, 65, 40);
  rect(x, y, 60, 18, 3);
  // water
  fill(80, 140, 200);
  rect(x + 3, y + 3, 54, 12, 2);
  // ripple
  stroke(200, 220, 240, 180);
  strokeWeight(1);
  noFill();
  let rx = x + 30 + sin(frameCount * 0.06) * 6;
  arc(rx, y + 9, 14, 5, 0, PI);
  noStroke();
  pop();
}

function drawPaddockHUD() {
  // Top bar
  noStroke();
  fill(0, 0, 0, 130);
  rect(0, 0, width, 28);

  fill(255, 230, 130);
  textAlign(LEFT, CENTER);
  textSize(13);
  text("LOST PUP — " + pupName, 10, 14);

  fill(200, 200, 220, 160);
  textAlign(RIGHT, CENTER);
  textSize(11);
  text("ARROWS to move", width - 10, 14);

  // Bottom info bubble: dynamic message on top, action keys below.
  let bx = 16, bw = width - 32;
  let bh = 70, by = height - bh - 8;

  noStroke();
  fill(0, 0, 0, 165);
  rect(bx, by, bw, bh, 6);
  noFill();
  stroke(255, 230, 130, 120);
  strokeWeight(1);
  rect(bx, by, bw, bh, 6);
  noStroke();

  // Pick the message to display.
  let msg;
  if (actionMessageTimer > 0) {
    msg = actionMessage;
  } else if (gateOpen) {
    msg = "The gate is open! Use the ARROW KEYS to walk south out of the pen.";
  } else if (gateNudges > 4) {
    msg = pupName + " is trapped in the small-animal pen. " +
          "The latch is right there — surely one of " + pupName + "'s " +
          "actions can deal with it?";
  } else {
    msg = pupName + " is locked in the small-animal pen. " +
          "Try Sniff, Dig, Bark, and Bite to find a way out.";
  }

  fill(255, 240, 210);
  textAlign(LEFT, TOP);
  textSize(11);
  text(msg, bx + 12, by + 8, bw - 24, 38);

  // Action key legend across the bottom of the bubble.
  let cy = by + bh - 14;
  let cx = bx + 14;
  let step = (bw - 28) / 4;
  drawKeyHint(cx + step * 0,     cy, "D", "Dig");
  drawKeyHint(cx + step * 1,     cy, "B", "Bark");
  drawKeyHint(cx + step * 2,     cy, "S", "Sniff");
  drawKeyHint(cx + step * 3,     cy, "T", "Bite");
}

function drawKeyHint(x, y, k, label) {
  push();
  noStroke();
  fill(255, 230, 130);
  rect(x, y - 7, 14, 14, 2);
  fill(40, 30, 20);
  textAlign(CENTER, CENTER);
  textSize(10);
  text(k, x + 7, y);
  fill(255, 255, 255, 220);
  textAlign(LEFT, CENTER);
  textSize(11);
  text(": " + label, x + 16, y);
  pop();
}

// ============================================================
//  OVERWORLD
// ============================================================
function buildLandmarks() {
  landmarks = [
    { x: 17, y: 26, w: 6, h: 2, color: [120, 90, 60],   label: "Entrance Gate" },
    { x: 3,  y: 20, w: 4, h: 3, color: [220, 100, 80],  label: "Corn Dog Stand" },
    { x: 8,  y: 20, w: 4, h: 3, color: [240, 180, 60],  label: "Funnel Cakes" },
    { x: 13, y: 20, w: 4, h: 3, color: [255, 130, 50],  label: "BBQ Pit" },
    { x: 24, y: 20, w: 5, h: 3, color: [80, 180, 220],  label: "Ring Toss" },
    { x: 30, y: 20, w: 5, h: 3, color: [100, 200, 140], label: "Balloon Darts" },
    { x: 5,  y: 10, w: 6, h: 5, color: [180, 100, 220], label: "Ferris Wheel" },
    { x: 14, y: 10, w: 5, h: 4, color: [220, 80, 150],  label: "Tilt-A-Whirl" },
    { x: 22, y: 10, w: 6, h: 5, color: [100, 120, 220], label: "Bumper Cars" },
    { x: 30, y: 10, w: 6, h: 5, color: [140, 180, 80],  label: "Petting Zoo" },
    { x: 30, y: 5,  w: 6, h: 4, color: [180, 160, 100], label: "Horse Barn" },
    { x: 5,  y: 3,  w: 8, h: 4, color: [200, 60, 60],   label: "Main Stage" },
    { x: 16, y: 3,  w: 3, h: 2, color: [100, 100, 110], label: "Restrooms" },
    { x: 22, y: 2,  w: 5, h: 3, color: [255, 220, 100], label: "Picnic Area" },
  ];
}

// ---- Puzzle 4 helpers --------------------------------------------------
function nearestBreadcrumb() {
  let best = null;
  let bestD = Infinity;
  for (const c of SCENT_BREADCRUMBS) {
    let cx = (c.tile[0] + 0.5) * TILE;
    let cy = (c.tile[1] + 0.5) * TILE;
    let d = dist(pup.x, pup.y, cx, cy);
    if (d < bestD) { bestD = d; best = c; }
  }
  return { crumb: best, distance: bestD };
}

// Returns one of HOT / WARM / COOL / COLD for the pup's current tile.
// HOT is anchored to the four scent-trail breadcrumbs. Everything else is
// a coarse zone read so the verb stays useful as the player wanders.
function scentBandHere() {
  let { crumb, distance } = nearestBreadcrumb();
  if (distance < HOT_RADIUS_TILES * TILE) {
    return { band: "HOT", crumbId: crumb.id };
  }
  // WARM halo around every breadcrumb. Without this, the area immediately
  // outside HOT range (e.g. just north/west of the Ferris Wheel) reads
  // COLD, which is counter-intuitive for "right next to the family."
  if (distance < WARM_RADIUS_TILES * TILE) {
    return { band: "WARM" };
  }

  let pupTileX = pup.x / TILE;
  let pupTileY = pup.y / TILE;

  const FOOD_LABELS = ["Corn Dog Stand", "Funnel Cakes", "BBQ Pit"];
  for (const lm of landmarks) {
    if (FOOD_LABELS.includes(lm.label)) {
      let lcx = lm.x + lm.w / 2;
      let lcy = lm.y + lm.h / 2;
      if (Math.abs(pupTileX - lcx) < 4 && Math.abs(pupTileY - lcy) < 4) {
        return { band: "WARM" };
      }
    }
  }

  // Two main paths: horizontal at rows 18-19, vertical at cols 19-20.
  if ((pupTileY >= 18 && pupTileY < 20) ||
      (pupTileX >= 19 && pupTileX < 21)) {
    return { band: "COOL" };
  }

  return { band: "COLD" };
}

function hotMessageFor(crumbId) {
  switch (crumbId) {
    case "spawn":
      return pupName + " catches a HOT scent — leashes, nervous fingers, " +
             "kid-sized sneakers. They were RIGHT HERE. Minutes ago.";
    case "restroom": {
      // Pre-discovery, the player has no in-fiction reason to connect this
      // smell to a specific person yet — leave the tail off and let them
      // wonder. Once the empty booth has been found, the tail names where
      // that person is right now.
      let titoTail = "";
      if (titoState === "atBooth") {
        titoTail = " The same smell as the man now in the operator booth.";
      } else if (titoState === "walking") {
        titoTail = " The man hurrying west toward the Ferris Wheel.";
      } else if (operatorMissingDiscovered) {
        titoTail = " The man on the bench. He's out cold.";
      }
      return pupName + " catches a HOT scent — grease, buttered popcorn, " +
             "the metal of a Ferris Wheel control lever. The family bought " +
             "tickets from whoever this belongs to." + titoTail;
    }
    case "picnic":
      return pupName + " catches a HOT scent — Mom's lotion, kid's " +
             "sticky-finger funnel cake, Dad's BBQ-sauce shirt. They were " +
             "here, not long ago.";
    case "ferris":
      return pupName + " catches a HOT scent — funnel cake fingers and " +
             "shoe rubber. They climbed in here. RIGHT HERE.";
  }
  return pupName + " catches a HOT scent of the family.";
}

function doOverworldSniff() {
  // Priority: breadcrumbs override everything (the family smell is the loudest
  // thing around). Then individual strangers. Then ambient zone.
  let { band, crumbId } = scentBandHere();
  if (band === "HOT") {
    let wasNew = !scentsFound.has(crumbId);
    if (wasNew) scentsFound.add(crumbId);

    let msg = hotMessageFor(crumbId);
    if (wasNew) {
      msg += "  (Family scent " + scentsFound.size + " of " +
             SCENT_BREADCRUMBS.length + " found.)";
    }

    // Reaching the Ferris Wheel ends the trail regardless of how many
    // breadcrumbs were skipped — the dog has located the family. Also
    // ends if all four breadcrumbs were collected the long way.
    let endTrail = !trailComplete &&
                   (crumbId === "ferris" ||
                    scentsFound.size === SCENT_BREADCRUMBS.length);
    if (endTrail) {
      msg += "  " + pupName + "'s nose connects every smell — the " +
             "trail is unmistakable. THEY'RE AT THE FERRIS WHEEL.";
      recapShown   = true;
      trailComplete = true;
      // Mark any unsniffed breadcrumbs as found so the HUD reads
      // "Trail: complete" and the recap doesn't refire.
      for (const c of SCENT_BREADCRUMBS) scentsFound.add(c.id);
    }
    setActionMessage(msg, 420);
    return;
  }

  let np = nearestPerson();
  if (np && np.distance < PERSON_REACH) {
    setActionMessage(
      "Not my family. This one " + np.person.flavor, 280);
    return;
  }

  // For all non-HOT bands, lead with the band name in caps so the player
  // can tell at a glance what they got — matches the "HOT scent" wording.
  let msg;
  if (band === "WARM") {
    msg = pupName + " catches a WARM scent — familiar. Funnel cake " +
          "fingers. Getting close.";
  } else if (band === "COOL") {
    msg = pupName + " catches a COOL scent — a stranger's perfume. " +
          "Nothing useful here.";
  } else {
    msg = pupName + " catches a COLD scent — just sun-warm dirt and " +
          "somebody's spilled lemonade.";
  }
  setActionMessage(msg, 360);
}

function doOverworldBark() {
  if (pupNearTitoBench() && titoState === "asleep" &&
      operatorMissingDiscovered) {
    titoBarkTried = true;
    setActionMessage(
      "BARK! Tito's snore hitches — then resumes, louder. He just rolls " +
      "over. He worked a double shift; this is a deep sleep.", 280);
    return;
  }
  let np = nearestPerson();
  if (np && np.distance < PERSON_REACH) {
    let r = random();
    if (r < 0.70) {
      setActionMessage(
        "Bark! The stranger smiles, crouches a little, and waves at " +
        pupName + ".", 220);
      np.person.reactTimer = 50;
      np.person.reactKind  = "smile";
    } else if (r < 0.95) {
      setActionMessage(
        "Bark! The stranger flinches and backs away, muttering about " +
        "loose dogs.", 220);
      np.person.reactTimer = 50;
      np.person.reactKind  = "flinch";
      // nudge them away from the pup
      let dx = np.person.x - pup.x;
      let dy = np.person.y - pup.y;
      let d = Math.hypot(dx, dy) || 1;
      np.person.targetX = np.person.x + (dx / d) * 60;
      np.person.targetY = np.person.y + (dy / d) * 60;
      np.person.repickTimer = 90;
    } else {
      returnToPaddock(
        "BARK! The stranger shrieks, \"LOOSE DOG!\" — Animal Control " +
        "scoops " + pupName + " up and dumps the pup back in the paddock.");
    }
    return;
  }
  setActionMessage(
    pupName + "'s bark echoes off the booths. A few pigeons flap up — " +
    "nothing else stirs.", 200);
}

function doOverworldBite() {
  if (pupNearTitoBench() && titoState === "asleep" &&
      operatorMissingDiscovered) {
    titoBiteTried = true;
    setActionMessage(
      pupName + " gnaws Tito's shoelaces apart. He mumbles something about " +
      "a knot, smacks his lips, and snores on. Cute — but he isn't waking up.",
      280);
    return;
  }
  let np = nearestPerson();
  if (np && np.distance < PERSON_REACH) {
    returnToPaddock(
      pupName + " nipped a stranger! They yelp for help and Animal " +
      "Control hauls the pup back to the paddock.");
    return;
  }
  setActionMessage(
    pupName + " snaps at the air. Just air. Tastes like dust.", 200);
}

function doOverworldDig() {
  if (pupNearTitoBench() && titoState === "asleep" &&
      operatorMissingDiscovered) {
    titoState = "waking";
    titoWakeFrame = 0;
    titoAwake = true;
    setActionMessage(
      pupName + " digs the dust patch under the bench. A puff of fine, dry " +
      "dust kicks up straight into Tito's face. *AH-CHOO! AH-CHOO! AH-CHOO!* " +
      "\"AAAH! THE WHEEL! THE WHEEL!\" He bolts off the bench toward the " +
      "Ferris Wheel.", 540);
    return;
  }
  if (random() < 0.20) {
    let snack = random([
      "half a corn dog", "a buttery popcorn kernel cluster",
      "a torn-off hot dog end", "a pickle slice", "a forgotten french fry",
      "a smear of funnel-cake powder on a napkin",
      "a single, perfect cheese curd",
    ]);
    setActionMessage(
      pupName + " digs and uncovers " + snack + " — *gulp* — gone in a " +
      "single happy chomp.", 240);
    return;
  }
  setActionMessage(
    pupName + " kicks up a fast little dirt-spray. Just dirt, hay, and " +
    "trampled grass.", 200);
}

// ---- People (crowd of fairgoers) ---------------------------------------
function makePerson(x, y, opts) {
  return {
    x: x, y: y,
    homeX: x, homeY: y,
    skin:  opts.skin,
    shirt: opts.shirt,
    pants: opts.pants,
    hair:  opts.hair,
    hairStyle: opts.hairStyle,    // "short" | "long" | "hat" | "bald"
    scale: opts.scale,             // ~0.6 kid, ~1.0 adult, ~1.15 large adult
    holding: opts.holding,         // null | "balloon" | "food" | "prize"
    holdingColor: opts.holdingColor,
    behavior: opts.behavior,       // "idle" | "walk" | "run"
    walkRadius: opts.walkRadius,
    speed: opts.speed,
    dir: 0,
    familyId: opts.familyId || null,
    flavor: opts.flavor,
    t: random(TWO_PI),
    targetX: x, targetY: y,
    repickTimer: floor(random(30, 180)),
    reactTimer: 0,
    reactKind: null,
  };
}

function weightedPick(arr) {
  let total = 0;
  for (const it of arr) total += it.w;
  let r = random(total);
  for (const it of arr) {
    r -= it.w;
    if (r <= 0) return it;
  }
  return arr[arr.length - 1];
}

// Push (x,y) out to the closest edge of any landmark it's inside, then
// clamp to the map. Used so spawned people don't end up under a building.
function avoidLandmark(x, y) {
  for (const lm of landmarks) {
    let lx = lm.x * TILE, ly = lm.y * TILE;
    let lw = lm.w * TILE, lh = lm.h * TILE;
    if (x > lx - 4 && x < lx + lw + 4 &&
        y > ly - 4 && y < ly + lh + 4) {
      let dl = x - (lx - 4);
      let dr = (lx + lw + 4) - x;
      let dt = y - (ly - 4);
      let db = (ly + lh + 4) - y;
      let m = min(dl, dr, dt, db);
      if      (m === dl) x = lx - 6;
      else if (m === dr) x = lx + lw + 6;
      else if (m === dt) y = ly - 6;
      else               y = ly + lh + 6;
    }
  }
  x = constrain(x, 12, MAP_W - 12);
  y = constrain(y, 12, MAP_H - 12);
  return { x, y };
}

function pickHolding() {
  let r = random();
  if (r < 0.14) return "balloon";
  if (r < 0.34) return "food";
  if (r < 0.42) return "prize";
  return null;
}

function pickBehavior() {
  let r = random();
  if (r < 0.08) return "run";
  if (r < 0.40) return "idle";
  return "walk";
}

function pickHairStyle() {
  return random(["short", "short", "short", "long", "long", "hat", "bald"]);
}

function seedPeople() {
  people = [];

  // Family groups first — 18 of them, 2-4 members each. Members share a
  // home position so they cluster, but each has their own appearance and
  // wandering speed (so kids don't move in lockstep with parents).
  let familyCount = 18;
  for (let i = 0; i < familyCount; i++) {
    let center = weightedPick(CROWD_CENTERS);
    let baseX = center.x * TILE + random(-30, 30);
    let baseY = center.y * TILE + random(-30, 30);
    let placed = avoidLandmark(baseX, baseY);
    let famId = "fam" + i;
    let groupSize = 2 + floor(random(3));   // 2..4
    for (let j = 0; j < groupSize; j++) {
      let isKid = j >= 2 || (j === 1 && random() < 0.35);
      let memberPos = avoidLandmark(
        placed.x + random(-14, 14),
        placed.y + random(-10, 10));
      let person = makePerson(
        memberPos.x, memberPos.y,
        {
          skin:  random(SKIN_TONES),
          shirt: random(SHIRT_COLORS),
          pants: random(PANTS_COLORS),
          hair:  random(HAIR_COLORS),
          hairStyle: pickHairStyle(),
          scale: isKid ? random(0.55, 0.72) : random(0.95, 1.12),
          holding: isKid && random() < 0.5 ? "balloon"
                  : pickHolding(),
          holdingColor: random(SHIRT_COLORS),
          behavior: random(["idle", "walk"]),
          walkRadius: 35,
          speed: isKid ? random(0.35, 0.55) : random(0.20, 0.40),
          familyId: famId,
          flavor: random(PERSON_FLAVORS),
        }
      );
      people.push(person);
    }
  }

  // Fill out to PEOPLE_COUNT with individuals.
  while (people.length < PEOPLE_COUNT) {
    let center = weightedPick(CROWD_CENTERS);
    let baseX = center.x * TILE + random(-50, 50);
    let baseY = center.y * TILE + random(-50, 50);
    let placed = avoidLandmark(baseX, baseY);
    let isKid = random() < 0.18;
    let behavior = pickBehavior();
    let runner = behavior === "run";
    people.push(makePerson(placed.x, placed.y, {
      skin:  random(SKIN_TONES),
      shirt: random(SHIRT_COLORS),
      pants: random(PANTS_COLORS),
      hair:  random(HAIR_COLORS),
      hairStyle: pickHairStyle(),
      scale: isKid ? random(0.55, 0.72) : random(0.92, 1.18),
      holding: pickHolding(),
      holdingColor: random(SHIRT_COLORS),
      behavior: behavior,
      walkRadius: runner ? 90 : 50,
      speed: runner ? random(0.7, 1.1) : random(0.18, 0.45),
      flavor: random(PERSON_FLAVORS),
    }));
  }
}

function updatePerson(p) {
  // Per-person animation phase advances at slightly different rates so a
  // crowd never marches in sync.
  p.t += 0.04;
  if (p.reactTimer > 0) p.reactTimer--;

  p.repickTimer--;
  if (p.repickTimer <= 0) {
    p.repickTimer = floor(random(60, 240));
    let r = p.walkRadius;
    let target = avoidLandmark(
      p.homeX + random(-r, r),
      p.homeY + random(-r, r));
    p.targetX = target.x;
    p.targetY = target.y;
  }

  // Idlers don't actually walk — they shuffle in place a little.
  if (p.behavior === "idle" && p.reactKind !== "flinch") return;

  let dx = p.targetX - p.x;
  let dy = p.targetY - p.y;
  let d = Math.hypot(dx, dy);
  if (d > 0.6) {
    let speed = p.speed;
    if (p.behavior === "run") speed = p.speed;
    p.x += (dx / d) * speed;
    p.y += (dy / d) * speed;
    if (Math.abs(dx) > Math.abs(dy)) p.dir = dx > 0 ? 2 : 1;
    else                              p.dir = dy > 0 ? 0 : 3;
  }
}

function drawPersonMap(p) {
  push();
  translate(p.x, p.y);
  let s = p.scale;

  let walking = p.behavior === "walk" ||
                (p.behavior === "idle" && p.reactKind === "flinch");
  let running = p.behavior === "run";
  let cycleSpeed = running ? 7 : (walking ? 4 : 1);
  let stepF = (walking || running) ? sin(p.t * cycleSpeed) * 1.7 * s : 0;
  let bob   = (walking || running) ? Math.abs(sin(p.t * cycleSpeed)) * 0.8 * s : 0;
  let bodyY = -bob;

  noStroke();
  // Shadow
  fill(0, 0, 0, 70);
  ellipse(0, 12 * s, 13 * s, 4 * s);

  // Legs (visible below the shirt)
  fill(p.pants[0], p.pants[1], p.pants[2]);
  rect(-2.6 * s, 5 * s, 2 * s, 7 * s + stepF, 1);
  rect( 0.6 * s, 5 * s, 2 * s, 7 * s - stepF, 1);

  // Body (shirt)
  fill(p.shirt[0], p.shirt[1], p.shirt[2]);
  rect(-4 * s, -3 * s + bodyY, 8 * s, 9 * s, 2);

  // Arms (skin-colored, swing slightly with walk)
  let armSwing = (walking || running) ? sin(p.t * cycleSpeed) * 1.0 * s : 0;
  fill(p.skin[0], p.skin[1], p.skin[2]);
  rect(-5.8 * s, -2 * s + bodyY + armSwing, 1.8 * s, 7 * s, 1);
  rect( 4.0 * s, -2 * s + bodyY - armSwing, 1.8 * s, 7 * s, 1);

  // Head
  fill(p.skin[0], p.skin[1], p.skin[2]);
  ellipse(0, -8 * s + bodyY, 7 * s, 8 * s);

  // Hair / hat
  if (p.hairStyle === "hat") {
    fill(p.hair[0], p.hair[1], p.hair[2]);
    arc(0, -10 * s + bodyY, 7.6 * s, 6 * s, PI, TWO_PI);
    rect(-1 * s, -10 * s + bodyY, 6 * s, 1.6 * s);
  } else if (p.hairStyle === "long") {
    fill(p.hair[0], p.hair[1], p.hair[2]);
    arc(0, -10 * s + bodyY, 7.6 * s, 7 * s, PI - 0.3, TWO_PI + 0.3);
    rect(-3.8 * s, -9 * s + bodyY, 7.6 * s, 6 * s, 2);
  } else if (p.hairStyle === "bald") {
    // skip
  } else {
    fill(p.hair[0], p.hair[1], p.hair[2]);
    arc(0, -10 * s + bodyY, 7.4 * s, 6 * s, PI, TWO_PI);
  }

  // Eyes — directional, tiny
  fill(20);
  let eyeY = -8 * s + bodyY;
  if      (p.dir === 0) { ellipse(-1.6 * s, eyeY, 1.2, 1.4); ellipse(1.6 * s, eyeY, 1.2, 1.4); }
  else if (p.dir === 1) { ellipse(-2.2 * s, eyeY, 1.2, 1.4); }
  else if (p.dir === 2) { ellipse( 2.2 * s, eyeY, 1.2, 1.4); }
  // dir 3 (facing away): no eyes drawn

  // Held item — drawn on the right hand. Single push/pop so it sits
  // cleanly on top of this person and never on top of a neighbor.
  if (p.holding === "balloon") {
    stroke(40, 40, 50, 180);
    strokeWeight(0.8);
    noFill();
    line(5.5 * s, 0 * s + bodyY, 8 * s, -22 * s + bodyY);
    noStroke();
    fill(p.holdingColor[0], p.holdingColor[1], p.holdingColor[2]);
    ellipse(8 * s, -26 * s + bodyY, 9 * s, 11 * s);
    fill(255, 255, 255, 110);
    ellipse(6.5 * s, -28 * s + bodyY, 2.2 * s, 1.4 * s);
  } else if (p.holding === "food") {
    fill(220, 180, 100);
    rect(3.5 * s, 0 * s + bodyY, 5 * s, 4 * s, 1);
    fill(255, 255, 255, 220);
    ellipse(6 * s, 1 * s + bodyY, 4 * s, 1.5 * s);
  } else if (p.holding === "prize") {
    let pc = p.holdingColor;
    fill(pc[0], pc[1], pc[2]);
    ellipse(5.5 * s, 1 * s + bodyY, 6 * s, 7 * s);
    ellipse(5.5 * s, -2.5 * s + bodyY, 5 * s, 5 * s);
    fill(20);
    ellipse(4.6 * s, -2.8 * s + bodyY, 0.9 * s, 0.9 * s);
    ellipse(6.4 * s, -2.8 * s + bodyY, 0.9 * s, 0.9 * s);
  }

  // Reaction marks (smile/flinch) — small, fade with reactTimer.
  if (p.reactTimer > 0) {
    let a = constrain(p.reactTimer / 50, 0, 1);
    fill(255, 240, 80, 220 * a);
    textAlign(CENTER, CENTER);
    textSize(10);
    if      (p.reactKind === "smile")  text("♥", 0, -16 * s + bodyY);
    else if (p.reactKind === "flinch") text("!",      0, -16 * s + bodyY);
  }

  pop();
}

function nearestPerson() {
  let best = null;
  let bestD = Infinity;
  for (const p of people) {
    let d = dist(p.x, p.y, pup.x, pup.y);
    if (d < bestD) { bestD = d; best = p; }
  }
  if (!best) return null;
  return { person: best, distance: bestD };
}

// ---- Puzzle 3 helpers --------------------------------------------------
function pupNearTitoBench() {
  return dist(pup.x, pup.y, TITO_BENCH_PX, TITO_BENCH_PY) < TITO_REACH;
}

// Discovery: when the pup gets close to the empty operator booth at the
// Ferris Wheel, fire a one-shot message that points the player back toward
// finding the operator. Until this fires the bench south of the Restrooms
// just looks like a bench — there's no Tito on it yet (in-fiction the
// player isn't yet looking for him).
const OPERATOR_DISCOVERY_RADIUS = 96;
function checkOperatorDiscovery() {
  if (operatorMissingDiscovered) return;
  if (titoState !== "asleep") return; // safety: he's already moving anyway
  let d = dist(pup.x, pup.y, FERRIS_BOOTH_PX, FERRIS_BOOTH_PY);
  if (d < OPERATOR_DISCOVERY_RADIUS) {
    operatorMissingDiscovered = true;
    setActionMessage(
      "The Ferris Wheel sits unmoving. The operator's booth is empty — " +
      "and somewhere up at the top of the wheel, the family is stuck. " +
      "Wherever the operator went, the wheel can't run without him. " +
      pupName + " had better find him.", 540);
  }
}

function updateTito() {
  if (titoState === "asleep" || titoState === "atBooth") return;

  if (titoState === "waking") {
    titoWakeFrame++;
    // small upward bob during the sneeze fit so the player can see something
    // is happening on the bench.
    let k = sin(titoWakeFrame * 0.5);
    titoY = TITO_BENCH_PY - 4 - abs(k) * 3;
    if (titoWakeFrame >= TITO_WAKE_FRAMES) {
      titoState = "walking";
      titoWaypoint = 0;
      titoY = TITO_BENCH_PY;
    }
    return;
  }

  // titoState === "walking"
  if (titoWaypoint >= TITO_PATH_TILES.length) {
    titoState   = "atBooth";
    titoAtBooth = true;
    wheelTurning = true;
    titoX = FERRIS_BOOTH_PX;
    titoY = FERRIS_BOOTH_PY;
    return;
  }
  let wp = TITO_PATH_TILES[titoWaypoint];
  let tx = wp[0] * TILE;
  let ty = wp[1] * TILE;
  let dx = tx - titoX;
  let dy = ty - titoY;
  let d  = Math.hypot(dx, dy);
  if (d < TITO_WALK_SPEED) {
    titoX = tx;
    titoY = ty;
    titoWaypoint++;
  } else {
    titoX += (dx / d) * TITO_WALK_SPEED;
    titoY += (dy / d) * TITO_WALK_SPEED;
  }
}

function drawTitoBench(x, y) {
  // Wood-slat bench sitting on the dirt south of the Restrooms. The dust
  // patch is drawn under it so the player has a visual cue to dig.
  push();
  translate(x, y);
  noStroke();
  // dust patch under the bench
  fill(190, 165, 120);
  ellipse(0, 14, 50, 12);
  fill(170, 145, 100, 200);
  ellipse(-6, 16, 22, 6);
  ellipse( 8, 15, 18, 5);
  // shadow
  fill(0, 0, 0, 70);
  ellipse(0, 12, 56, 8);
  // legs
  fill(90, 60, 40);
  rect(-22, -2, 4, 16, 1);
  rect( 18, -2, 4, 16, 1);
  // seat
  fill(140, 95, 55);
  rect(-26, -8, 52, 6, 2);
  fill(120, 80, 45);
  rect(-26, -3, 52, 2);
  // back rest
  fill(140, 95, 55);
  rect(-24, -22, 48, 4, 2);
  rect(-24, -16, 48, 3, 1);
  // back posts
  fill(110, 75, 45);
  rect(-22, -22, 3, 16);
  rect( 19, -22, 3, 16);
  pop();
}

function drawSleepingTito(x, y) {
  // Tito flat on his back on the bench, hat over his face, snoring zzz.
  push();
  translate(x, y);
  noStroke();
  // body lying horizontally on the seat (legs hang slightly off the right end)
  // legs
  fill(60, 60, 80);
  rect(8, -10, 22, 5, 1);   // pants thighs
  rect(8, -4,  22, 5, 1);
  // shoes
  fill(40, 30, 25);
  ellipse(32, -7, 8, 5);
  ellipse(32, -1, 8, 5);
  // torso (striped vest)
  fill(220, 80, 60);
  rect(-20, -10, 28, 12, 2);
  // vest stripes
  fill(240, 240, 230);
  rect(-20, -8, 28, 2);
  rect(-20, -2, 28, 2);
  // arm draped down the front of the bench
  fill(230, 190, 160);
  rect(-4, 0, 4, 9, 1);
  // head (resting on the back-end of the bench)
  fill(230, 190, 160);
  ellipse(-22, -8, 12, 11);
  // ear
  ellipse(-19, -8, 3, 4);
  // operator's cap pulled over the face
  fill(60, 90, 140);
  arc(-22, -10, 14, 10, PI, TWO_PI);
  rect(-29, -10, 14, 3, 1);
  // brim
  fill(40, 60, 100);
  rect(-30, -8, 16, 2, 1);
  // mustache poking out under the cap
  fill(80, 50, 30);
  rect(-25, -3, 8, 1.5, 1);
  // chin
  fill(220, 175, 145);
  ellipse(-17, -3, 4, 3);
  pop();
}

function drawStandingTito(x, y, walking) {
  // Standing Tito after the sneeze. Used while he's marching to the booth
  // and once he's in the booth.
  push();
  translate(x, y);
  let s = 1.0;
  let bob = walking ? sin(frameCount * 0.25) * 1.2 : 0;
  noStroke();
  // shadow
  fill(0, 0, 0, 70);
  ellipse(0, 18 * s, 18 * s, 4 * s);
  // legs
  fill(50, 55, 80);
  rect(-3 * s, 0 + bob, 2.5 * s, 14 * s, 1);
  rect(0.6 * s, 0 - bob, 2.5 * s, 14 * s, 1);
  // shoes (untied laces flop loose for laughs)
  fill(35, 25, 20);
  rect(-4 * s, 13 * s + bob, 4 * s, 3 * s, 1);
  rect( 0   * s, 13 * s - bob, 4 * s, 3 * s, 1);
  // striped vest body
  fill(220, 80, 60);
  rect(-5 * s, -16 * s, 10 * s, 18 * s, 2);
  fill(240, 240, 230);
  rect(-5 * s, -13 * s, 10 * s, 2 * s);
  rect(-5 * s,  -7 * s, 10 * s, 2 * s);
  rect(-5 * s,  -1 * s, 10 * s, 2 * s);
  // arms (swinging if walking)
  fill(230, 190, 160);
  let armSw = walking ? sin(frameCount * 0.25) * 3 : 0;
  rect(-7 * s, -15 * s + armSw, 2 * s, 13 * s, 1);
  rect( 5 * s, -15 * s - armSw, 2 * s, 13 * s, 1);
  // head
  fill(230, 190, 160);
  ellipse(0, -22 * s, 9 * s, 10 * s);
  // mustache
  fill(80, 50, 30);
  rect(-3 * s, -19 * s, 6 * s, 1.5 * s, 1);
  // operator cap
  fill(60, 90, 140);
  arc(0, -25 * s, 11 * s, 8 * s, PI, TWO_PI);
  fill(40, 60, 100);
  rect(-6 * s, -23 * s, 12 * s, 2 * s, 1);
  pop();
}

function drawTitoSneezeFx(x, y, frame) {
  // Three big "AH-CHOO!" puffs over the wake interval, plus dust particles.
  push();
  translate(x, y);
  noStroke();
  // dust cloud
  let a = 200 - frame * 1.5;
  if (a > 30) {
    fill(220, 200, 150, a);
    ellipse(-4, -2, 30 + frame * 0.3, 14);
    ellipse(6,  -4, 22 + frame * 0.2, 12);
    fill(255, 240, 200, a * 0.7);
    ellipse(-2, -6, 16, 8);
  }
  // "AH-CHOO!" pop
  let phase = floor(frame / 30);
  if (frame % 30 < 22 && phase < 3) {
    fill(255, 255, 255, 240);
    textAlign(CENTER, CENTER);
    textSize(11);
    text("AH-CHOO!", 6, -22 - phase * 3);
  }
  pop();
}

function drawSleepZ(x, y) {
  // Snoring zzz floating up from sleeping Tito.
  let t = (frameCount * 0.04) % 1.0;
  noStroke();
  fill(255, 255, 255, 180 * (1 - t));
  textAlign(LEFT, CENTER);
  textSize(11 + t * 4);
  text("z", x - 24, y - 18 - t * 14);
  text("z", x - 18, y - 22 - t * 10);
  text("Z", x - 12, y - 26 - t * 6);
}

function drawFerrisBooth(x, y) {
  // Tiny operator booth east of the Ferris Wheel building. Drawn always —
  // empty when Tito's away, with Tito visible inside once he arrives.
  push();
  translate(x, y);
  noStroke();
  // shadow
  fill(0, 0, 0, 70);
  ellipse(0, 16, 30, 6);
  // base
  fill(120, 95, 70);
  rect(-14, -2, 28, 18, 2);
  // body
  fill(200, 175, 140);
  rect(-14, -22, 28, 20, 2);
  // window
  fill(140, 200, 220);
  rect(-10, -19, 20, 11, 1);
  stroke(80, 60, 40);
  strokeWeight(1);
  line(0, -19, 0, -8);
  line(-10, -13, 10, -13);
  // roof
  noStroke();
  fill(170, 60, 60);
  triangle(-16, -22, 16, -22, 0, -32);
  // sign
  fill(255, 235, 130);
  rect(-12, -28, 24, 4, 1);
  fill(50, 30, 20);
  textAlign(CENTER, CENTER);
  textSize(5);
  text("OPERATOR", 0, -26);
  pop();
}

function drawSpinningWheel(cx, cy, r, angle) {
  // Small ferris-wheel motif drawn over the Ferris Wheel landmark to signal
  // that the wheel is now turning. Not the endgame visual — that's a future
  // session — just a "we made it move" indicator.
  push();
  translate(cx, cy);
  rotate(angle);
  noFill();
  stroke(255, 245, 180);
  strokeWeight(2);
  ellipse(0, 0, r * 2, r * 2);
  strokeWeight(1.2);
  for (let i = 0; i < 8; i++) {
    let a = (i / 8) * TWO_PI;
    line(0, 0, cos(a) * r, sin(a) * r);
  }
  // gondolas as little dots
  noStroke();
  fill(255, 150, 80);
  for (let i = 0; i < 8; i++) {
    let a = (i / 8) * TWO_PI;
    ellipse(cos(a) * r, sin(a) * r, 4, 4);
  }
  pop();
}

function returnToPaddock(reason) {
  gameState = STATE_PADDOCK;
  pup.x = PAD_X + PAD_W / 2;
  pup.y = PAD_Y + PAD_H / 2 + 10;
  pup.dir = 0;
  setActionMessage(reason, 360);
}

function updateMap() {
  if (actionMessageTimer > 0) actionMessageTimer--;
  for (const p of people) updatePerson(p);
  updateTito();
  checkOperatorDiscovery();
  if (wheelTurning) wheelAngle += 0.02;

  moving = false;
  let dx = 0, dy = 0;
  if (keyIsDown(LEFT_ARROW))  { dx = -1; pup.dir = 1; }
  if (keyIsDown(RIGHT_ARROW)) { dx =  1; pup.dir = 2; }
  if (keyIsDown(UP_ARROW))    { dy = -1; pup.dir = 3; }
  if (keyIsDown(DOWN_ARROW))  { dy =  1; pup.dir = 0; }

  if (dx !== 0 || dy !== 0) {
    moving = true;
    if (dx !== 0 && dy !== 0) { dx *= 0.707; dy *= 0.707; }

    let newX = pup.x + dx * pup.speed;
    let newY = pup.y + dy * pup.speed;

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

  camX = constrain(pup.x - width / 2, 0, MAP_W - width);
  camY = constrain(pup.y - height / 2, 0, MAP_H - height);
}

function drawMap() {
  background(90, 160, 70);
  push();
  translate(-camX, -camY);

  drawGroundPaths();

  for (let lm of landmarks) {
    let lx = lm.x * TILE;
    let ly = lm.y * TILE;
    let lw = lm.w * TILE;
    let lh = lm.h * TILE;
    noStroke();
    fill(0, 0, 0, 40);
    rect(lx + 3, ly + 3, lw, lh, 4);
    fill(lm.color[0], lm.color[1], lm.color[2]);
    stroke(0, 0, 0, 60);
    strokeWeight(1);
    rect(lx, ly, lw, lh, 4);
    fill(lm.color[0] * 0.7, lm.color[1] * 0.7, lm.color[2] * 0.7);
    noStroke();
    rect(lx, ly, lw, 6, 4, 4, 0, 0);
    fill(255, 255, 255, 200);
    textAlign(CENTER, CENTER);
    textSize(9);
    text(lm.label, lx + lw / 2, ly + lh / 2);
  }

  // Y-sorted entity layer. Each entity (pup or person) is drawn as one
  // complete unit (its own push/pop), and entities are sorted by foot Y
  // so a person standing further south properly draws on top of one
  // standing north of them — no head/arm bleed across NPCs.
  let bobble = moving ? sin(pup.frame * 4) * 2 : 0;
  let entities = [];
  for (const p of people) {
    if (!isOnScreen(p.x, p.y, 40)) continue;     // simple frustum cull
    entities.push({ y: p.y, kind: "person", p: p });
  }
  entities.push({ y: pup.y, kind: "pup", bobble: bobble });
  // Bench is always present; sort it as a normal entity so the pup walks
  // both behind it and in front of it correctly.
  entities.push({ y: TITO_BENCH_PY + 14, kind: "bench" });
  // Tito himself, in his current pose. He's only worth drawing if he isn't
  // off in the booth (drawn separately, below the wheel) — and, while he's
  // still asleep, only after the player has discovered the booth is empty.
  let titoVisible = titoState !== "atBooth" &&
                    !(titoState === "asleep" && !operatorMissingDiscovered);
  if (titoVisible) {
    entities.push({ y: titoY + 14, kind: "tito" });
  }
  // Operator booth — drawn as part of the layer so the wheel-area visuals
  // can compose with the surrounding crowd.
  entities.push({ y: FERRIS_BOOTH_PY + 16, kind: "booth" });
  entities.sort((a, b) => a.y - b.y);
  for (const e of entities) {
    if (e.kind === "person") {
      drawPersonMap(e.p);
    } else if (e.kind === "bench") {
      drawTitoBench(TITO_BENCH_PX, TITO_BENCH_PY);
      if (titoState === "asleep" && operatorMissingDiscovered) {
        drawSleepZ(TITO_BENCH_PX, TITO_BENCH_PY);
      }
    } else if (e.kind === "tito") {
      if (titoState === "asleep") {
        drawSleepingTito(titoX, titoY);
      } else if (titoState === "waking") {
        drawSleepingTito(titoX, titoY);
        drawTitoSneezeFx(titoX, titoY, titoWakeFrame);
      } else if (titoState === "walking") {
        drawStandingTito(titoX, titoY, true);
      }
    } else if (e.kind === "booth") {
      drawFerrisBooth(FERRIS_BOOTH_PX, FERRIS_BOOTH_PY);
      if (titoState === "atBooth") {
        // Tito visible inside the booth.
        drawStandingTito(FERRIS_BOOTH_PX, FERRIS_BOOTH_PY - 4, false);
      }
    } else {
      drawPupSprite(pup.x, pup.y + e.bobble, 1.5, pup.dir, moving);
      noStroke();
      fill(255, 255, 255, 180);
      textAlign(CENTER, CENTER);
      textSize(10);
      text(pupName, pup.x, pup.y - 20);
    }
  }

  // Spinning wheel motif overlaid on the Ferris Wheel building once Tito
  // is at the booth and the wheel has come back to life.
  if (wheelTurning) {
    let wheelLm = landmarks.find(l => l.label === "Ferris Wheel");
    if (wheelLm) {
      let cx = (wheelLm.x + wheelLm.w / 2) * TILE;
      let cy = (wheelLm.y + wheelLm.h / 2) * TILE;
      drawSpinningWheel(cx, cy, 36, wheelAngle);
    }
  }

  pop();

  drawMapHUD();
}

function isOnScreen(x, y, margin) {
  return x > camX - margin && x < camX + width + margin &&
         y > camY - margin && y < camY + height + margin;
}

function drawGroundPaths() {
  noStroke();
  fill(180, 155, 120);
  rect(0, 18 * TILE, MAP_W, 2 * TILE);
  rect(19 * TILE, 0, 2 * TILE, MAP_H);
  stroke(160, 135, 100);
  strokeWeight(1);
  line(0, 18 * TILE, MAP_W, 18 * TILE);
  line(0, 20 * TILE, MAP_W, 20 * TILE);
  line(19 * TILE, 0, 19 * TILE, MAP_H);
  line(21 * TILE, 0, 21 * TILE, MAP_H);
}

function drawMapHUD() {
  // Top bar
  noStroke();
  fill(0, 0, 0, 130);
  rect(0, 0, width, 28);

  fill(255, 230, 130);
  textAlign(LEFT, CENTER);
  textSize(13);
  text("LOST PUP — " + pupName, 10, 14);

  // Trail progress: rendered in two colors so the progress half pops.
  // ARROWS hint sits dim on the left; TRAIL count sits bright on the right.
  let trailLabel = trailComplete
    ? "TRAIL COMPLETE!"
    : "TRAIL: " + scentsFound.size + " / " + SCENT_BREADCRUMBS.length;

  textAlign(RIGHT, CENTER);
  textSize(13);
  fill(255, 230, 130);
  text(trailLabel, width - 10, 14);

  let trailW = textWidth(trailLabel);
  textSize(11);
  fill(200, 200, 220, 160);
  text("ARROWS to move", width - 10 - trailW - 14, 14);

  // Bottom info bubble (matches the paddock HUD).
  let bx = 16, bw = width - 32;
  let bh = 70, by = height - bh - 8;

  noStroke();
  fill(0, 0, 0, 165);
  rect(bx, by, bw, bh, 6);
  noFill();
  stroke(255, 230, 130, 120);
  strokeWeight(1);
  rect(bx, by, bw, bh, 6);
  noStroke();

  let msg;
  if (actionMessageTimer > 0) {
    msg = actionMessage;
  } else if (titoState === "waking") {
    msg = "Tito is sneezing himself awake!";
  } else if (titoState === "walking") {
    msg = "Tito is hurrying back to the Ferris Wheel booth.";
  } else if (titoAtBooth && trailComplete) {
    msg = "The wheel is turning and the family is up there. Head west to " +
          "the Ferris Wheel.";
  } else if (titoAtBooth) {
    msg = "Tito's back in the booth. The Ferris Wheel is turning again.";
  } else if (pupNearTitoBench() && titoState === "asleep" &&
             operatorMissingDiscovered) {
    if (titoBarkTried && titoBiteTried) {
      msg = "A man in an operator's vest is fast asleep on the bench. " +
            "Bark and bite haven't done much. What else could " + pupName +
            " try?";
    } else if (titoBarkTried) {
      msg = "A man in an operator's vest is fast asleep on the bench. " +
            "Barking didn't do it. What else could " + pupName + " try?";
    } else if (titoBiteTried) {
      msg = "A man in an operator's vest is fast asleep on the bench. " +
            "Biting didn't do it. What else could " + pupName + " try?";
    } else {
      msg = "A man in an operator's vest is fast asleep on the bench. " +
            "What does " + pupName + " do?";
    }
  } else if (trailComplete) {
    msg = pupName + " knows the family is at the Ferris Wheel.";
  } else if (scentsFound.size === 0) {
    msg = pupName + " is loose in the fairgrounds. Sniff the air to " +
          "pick up the family's trail.";
  } else {
    msg = pupName + " has caught " + scentsFound.size + " of " +
          SCENT_BREADCRUMBS.length + " scents so far. Keep sniffing — " +
          "the trail leads somewhere.";
  }

  fill(255, 240, 210);
  textAlign(LEFT, TOP);
  textSize(11);
  text(msg, bx + 12, by + 8, bw - 24, 38);

  let cy = by + bh - 14;
  let cx = bx + 14;
  let step = (bw - 28) / 4;
  drawKeyHint(cx + step * 0, cy, "D", "Dig");
  drawKeyHint(cx + step * 1, cy, "B", "Bark");
  drawKeyHint(cx + step * 2, cy, "S", "Sniff");
  drawKeyHint(cx + step * 3, cy, "T", "Bite");
}

// ============================================================
//  PUP TOP-DOWN SPRITE (used in the paddock and on title)
// ============================================================
function drawPupSprite(x, y, scale, dir, isMoving) {
  push();
  translate(x, y);

  let s = scale;

  noStroke();
  fill(180, 130, 70);
  ellipse(0, 0, 14 * s, 10 * s);

  let hx = 0, hy = -5 * s;
  if (dir === 0) { hx = 0;     hy = 5 * s; }
  if (dir === 1) { hx = -6*s;  hy = 0; }
  if (dir === 2) { hx = 6*s;   hy = 0; }
  if (dir === 3) { hx = 0;     hy = -5 * s; }

  fill(200, 150, 80);
  ellipse(hx, hy, 10 * s, 9 * s);

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
    fill(50, 30, 30);
    if (dir === 0)      ellipse(hx, hy + 2.5 * s, 2.5 * s, 2 * s);
    else if (dir === 1) ellipse(hx - 3.5 * s, hy + 1 * s, 2 * s, 1.5 * s);
    else if (dir === 2) ellipse(hx + 3.5 * s, hy + 1 * s, 2 * s, 1.5 * s);
  }

  noFill();
  stroke(180, 130, 70);
  strokeWeight(2 * s);
  let tailWag = isMoving ? sin(frameCount * 0.3) * 0.5 : 0.2;
  if (dir === 0 || dir === 3) {
    let tx = 6 * s;
    arc(tx, -2 * s, 6 * s, 8 * s, -HALF_PI + tailWag, HALF_PI + tailWag);
  }

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
      gameState = STATE_STORY;
      typingName = false;
      storyIndex = 0;
      storyFrame = 0;
      storyFade = 0;
      return;
    }
    if (keyCode === BACKSPACE) {
      pupName = pupName.slice(0, -1);
      return;
    }
    if (key.length === 1 && pupName.length < 12) {
      if (key.match(/[a-zA-Z0-9 ]/)) pupName += key;
    }
    return;
  }

  if (gameState === STATE_STORY) {
    if (keyCode === ENTER || key === ' ') {
      if (storyIndex < STORY_BEATS - 1) {
        storyIndex++;
        storyFrame = 0;
        storyFade = 0;
      } else {
        gameState = STATE_PADDOCK;
      }
    }
    return;
  }

  if (gameState === STATE_PADDOCK) {
    // 68=D, 66=B, 83=S, 84=T
    if      (keyCode === 68) doDig();
    else if (keyCode === 66) doBark();
    else if (keyCode === 83) doSniff();
    else if (keyCode === 84) doBite();
    return;
  }

  if (gameState === STATE_MAP) {
    if      (keyCode === 68) doOverworldDig();
    else if (keyCode === 66) doOverworldBark();
    else if (keyCode === 83) doOverworldSniff();
    else if (keyCode === 84) doOverworldBite();
    return;
  }
}

function mousePressed() {
  if (gameState === STATE_STORY) {
    if (storyIndex < STORY_BEATS - 1) {
      storyIndex++;
      storyFrame = 0;
      storyFade = 0;
    } else {
      gameState = STATE_PADDOCK;
    }
  }
}
