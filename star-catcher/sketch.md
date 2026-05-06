Here's Star Catcher. A soft-blue kinematic paddle sits at the bottom and follows either the arrow keys or the mouse — when the mouse moves, it takes over; when it's idle, the keys do. Stars are dynamic sprites in a Group with a downward velocity that grows with score, and a frame-counter spawn timer that shortens as the score climbs, so the game starts gentle and pushes harder over time. Everything else — title screen, pause, settings, sounds, music, high scores, Game Over — is the framework's job.

```javascript
const GAME_CONFIG = {
  title:        'Star Catcher',
  storageKey:   'vcg_star_catcher',
  canvasWidth:  720,
  canvasHeight: 480,
  subtitle:     'Catch them before they fall.',
  background:   'stars',
  startLives:   3,
  controls: [
    '← → or Mouse — Move the paddle',
    'Catch falling stars before they hit the ground',
    'Miss 3 stars and the run ends',
  ],
  theme: {
    primary: '#7aa2f7',   // paddle (soft blue)
    accent:  '#ffd84a',   // stars + "+10" popups (gold)
    danger:  '#ff7a7a',   // "Miss" popups (soft red)
  },
};

// ----- Game-specific state -----
let paddle;
let stars;
let spawnTimer = 0;

const PADDLE_SPEED = 7;

function onGameStart() {
  paddle = new Sprite(width / 2, height - 30, 110, 14);
  paddle.color    = getTheme().primary;
  paddle.collider = 'kinematic';

  stars = new Group();
  stars.diameter = 20;
  stars.color    = getTheme().accent;
  stars.collider = 'dynamic';

  spawnTimer = 0;
}

function onGameUpdate() {
  // Movement: mouse takes over when it moves, keys handle the rest
  if (mouseX !== pmouseX) {
    paddle.x = constrain(mouseX, paddle.width / 2, width - paddle.width / 2);
  } else {
    if (kb.pressing('left'))  paddle.x = max(paddle.width / 2,         paddle.x - PADDLE_SPEED);
    if (kb.pressing('right')) paddle.x = min(width - paddle.width / 2, paddle.x + PADDLE_SPEED);
  }

  // Spawn stars — interval shortens and fall speed grows as the score climbs
  spawnTimer++;
  const spawnEvery = max(20, 60 - floor(score / 50));
  if (spawnTimer >= spawnEvery) {
    spawnTimer = 0;
    const s = new stars.Sprite(random(20, width - 20), -20);
    s.vel.y = 2 + min(4, score / 200);
  }

  // Catch / miss check — iterate in reverse so .remove() during the loop is safe
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
      loseLife();   // framework auto-ends the run when lives hit 0
    }
  }
}

function onGameDraw() {
  // Nothing extra — the starfield background and the sprite renderer cover everything visible.
}

function onGameEnd(finalScore) {
  // Framework already handles the high-score save, sound, and Game Over screen.
}
```

**Try it:**

- Slide the mouse across the canvas — the paddle should snap to your cursor's x.
- Stop the mouse and press `←` / `→` — the paddle should keep responding to keys.
- Climb past ~100 score and you should feel stars getting faster and more frequent; lose all 3 lives to confirm the Game Over flow and high-score prompt fire.

Next, want me to ease the paddle toward the mouse instead of snapping? Adds a slightly laggy, more skillful feel.
