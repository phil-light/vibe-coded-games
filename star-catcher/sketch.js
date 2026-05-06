// ============================================================
//  Star Catcher — sample game on the Vibe-Coded Games framework
// ============================================================
//
//  Move the paddle left/right with arrow keys to catch falling stars.
//  Miss 3 and the game ends. Stars fall faster as your score grows.
//
//  Framework code (title screen, pause, scoring, save/load, lives,
//  shake, popups) lives in framework.js — loaded by index.html. This
//  file is just the game logic.
// ============================================================

const GAME_CONFIG = {
  title:        'Star Catcher',
  storageKey:   'vcg_star_catcher',
  canvasWidth:  720,
  canvasHeight: 480,
  subtitle:     'Catch them before they fall',
  controls: [
    '← → — Move the paddle',
    'Catch falling stars before they reach the ground',
    '3 misses ends the run',
  ],
  background:   'stars',
  startLives:   3,
  theme: {
    primary: '#7aa2f7',
    accent:  '#ffd84a',
    danger:  '#ff7a7a',
  },
};


// ----- Game-specific state ----------------------------------
let paddle;
let stars;
let starSpawnTimer = 0;
const PADDLE_SPEED = 7;


function onGameStart() {
  paddle = new Sprite(width / 2, height - 30, 110, 14);
  paddle.color    = getTheme().accent;
  paddle.collider = 'kinematic';

  stars = new Group();
  stars.diameter = 20;
  stars.color    = getTheme().text;
  stars.collider = 'dynamic';

  starSpawnTimer = 0;
}

function onGameUpdate() {
  // Paddle movement, clamped to canvas
  if (kb.pressing('left'))  paddle.x = max(paddle.width / 2, paddle.x - PADDLE_SPEED);
  if (kb.pressing('right')) paddle.x = min(width - paddle.width / 2, paddle.x + PADDLE_SPEED);

  // Spawn stars — frequency and speed ramp with score
  starSpawnTimer++;
  const spawnEvery = max(20, 60 - floor(score / 50));
  if (starSpawnTimer >= spawnEvery) {
    starSpawnTimer = 0;
    const star = new stars.Sprite(random(20, width - 20), -20);
    star.vel.y = 2 + min(4, score / 200);
  }

  // Catch / miss detection
  for (let i = stars.length - 1; i >= 0; i--) {
    const s = stars[i];
    if (s.overlaps(paddle)) {
      addScore(10);
      popupText('+10', s.x, s.y, getTheme().accent);
      playSfx('score');
      s.remove();
    } else if (s.y > height + 20) {
      popupText('Miss', s.x, height - 60, getTheme().danger);
      screenShake(5, 220);
      playSfx('miss');
      s.remove();
      loseLife();   // framework auto-ends the game when lives hit 0
    }
  }
}

function onGameDraw() {
  // Nothing extra — the framework's starfield background carries the mood,
  // and stars/paddle are drawn as p5.play sprites automatically.
}

function onGameEnd(finalScore) {
  // Framework already handles high-score, sound, and shake.
}
