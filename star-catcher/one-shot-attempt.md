# Star Catcher — One-Shot Prompt

A fictitious example of what a student could paste into an AI chat **after** the framework's [`prompt.txt`](../game-framework/prompt.txt) to (theoretically) produce something close to this game in a single shot.

In practice a student would iterate — describe the core, see it run, then ask for tweaks. This file is a thought experiment showing the level of detail a one-shot needs **in plain language a beginner could actually write**, trusting the framework prompt to fill in the technical decisions.

---

## The prompt

```text
Make me a game called Star Catcher.

It's a night sky with stars falling from the top of the screen.
I have a paddle at the bottom that I move left and right with the
arrow keys or use the mouse. 
I have to catch the stars before they hit the ground.

Catching a star is +10 points. Show a little gold "+10" floating up
from where I caught it.

If a star gets past me and hits the ground, I lose a life. Show
"Miss" near where it fell in red, and shake the screen for a moment.

I start with 3 lives. When they're gone the game's over.

It should get harder as my score goes up — stars fall faster and
spawn more often. Easy at first, then it really pushes me.

Looks: dark night-sky background. The paddle should be a soft blue,
the falling stars gold, the "Miss" popup red. Subtitle on the title
screen: "Catch them before they fall."
```

Notice what the student does **not** specify: hex codes, canvas size, storage key, hook names, sprite types, physics modes, collision functions, or any spawn-rate math. Those are all decisions the LLM should make from the framework prompt plus reasonable defaults.

## What an LLM should produce

A `sketch.js` along these lines:

- A `GAME_CONFIG` block with the title, the subtitle, the `'stars'` background, `startLives: 3`, a sensible storage key, a `controls` list for the How to Play screen, and a partial `theme` override picking a soft blue for the paddle (primary), gold for the stars and score popups (accent), and a soft red for misses (danger).
- `onGameStart()` that creates a paddle the player drives manually each frame (so physics doesn't push it around) and a Group for falling stars that move under physics.
- `onGameUpdate()` that:
  - Reads the left/right arrow keys and clamps the paddle to the canvas.
  - Spawns stars on a frame-counter timer that shortens with score, and gives each new star a downward velocity that grows with score.
  - On a catch (star overlapping the paddle): `addScore(10)`, `popupText('+10', ...)` in the accent color, `playSfx('score')`, remove the star.
  - On a miss (star past the bottom of the canvas): `popupText('Miss', ...)` in the danger color, `screenShake(...)`, `playSfx('miss')`, remove the star, `loseLife()` — the framework auto-ends the run when lives hit 0.
- `onGameDraw()` and `onGameEnd()` empty — the framework's starfield + sprite renderer cover the visuals, and the framework already handles the high-score save and Game Over screen.

The whole thing should land somewhere between 60 and 90 lines of game-specific code below the `GAME_CONFIG` block.

If the LLM struggles with this looser prompt — picks the wrong sprite type, reaches for `setup()`/`draw()` instead of the hooks, reinvents pause/score/UI, or guesses wildly different theme colors — that's a signal to strengthen the framework prompt rather than re-add jargon here.
