# Star Catcher

A minimal arcade game built on the [Game Framework](../game-framework/), and the simplest worked example of how a game uses the framework's four-hook architecture.

## What it is

Stars fall from a night sky. The player moves a paddle left and right to catch them before they hit the ground. Each catch is +10 points; each miss is one life lost. Three misses ends the run. The longer you survive, the faster and more frequently stars spawn.

## How to play

| Control | Action |
| --- | --- |
| `←` / `→` | Move the paddle left / right |
| `P` or `Esc` | Pause |
| `↑` / `↓` + `Enter` | Navigate menus (or use the mouse) |
| `M` | Mute / unmute |

- **Catch a star:** +10 points
- **Miss a star:** −1 life (3 lives total — run ends at 0)
- **Difficulty ramps with score:** stars fall faster and spawn more often
- **Top-5 leaderboard:** beat any of the top 5 scores and you're prompted for a name

## Trying it yourself

Hosted as a sketch on editor.p5js.org. Open the link, click **Play**, and you're in:

> **Star Catcher sketch:** *URL — TBD. Replace with the live link once hosted.*

To tinker with the code, click **File → Duplicate** in the editor and edit your own copy.

## Why this game exists

Star Catcher is deliberately the smallest viable example of a game on the [Game Framework](../game-framework/). It shows:

- A complete game in ~70 lines of game-specific code
- The four lifecycle hooks (`onGameStart`, `onGameUpdate`, `onGameDraw`, `onGameEnd`) used the way they're meant to be used
- Practical use of the helper API: `addScore`, `loseLife`, `popupText`, `screenShake`, `playSfx`, `getTheme`
- p5.play sprites with both kinematic (paddle) and dynamic (stars) colliders

If a camp student doesn't know where to start, this is the file to copy. The framework absorbs the title screen, pause, settings, leaderboard, sounds, and game-over flow — leaving Star Catcher's `sketch.js` free to focus on paddle movement, star spawning, and the catch/miss check.

## Implementation notes

- **Paddle** is a kinematic Sprite — moved manually each frame, physics doesn't push it.
- **Stars** are dynamic Sprites in a Group, with a downward velocity that scales with score.
- **Spawn rate** ramps from one star per 60 frames at the start to one per 20 at higher scores.
- **Scoring & lives** are framework-managed — game code just calls `addScore(10)` on a catch and `loseLife()` on a miss; the framework auto-ends the run when lives reach 0.
- **Theme** is the framework default.

The whole game-specific implementation lives in [`sketch.js`](sketch.js) below the `GAME_CONFIG` block — under 70 lines of substantive logic.
