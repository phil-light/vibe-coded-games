# Game Framework — Maintainer & Teacher Guide

A presentation framework for student-built p5.js games at AI Pathways summer camp. Distributed as a single duplicate-and-edit sketch on [editor.p5js.org](https://editor.p5js.org/).

> **This document is for teachers, mentors, and the framework's maintainers.** Students looking at a duplicated sketch should read [`readme.txt`](readme.txt) instead — it's plain-text, scannable, and stripped of architectural rationale they don't need.

---

## Why this framework exists

The AI Pathways camp puts students in a uniquely constrained corner of the dev landscape:

- **Chromebooks with no persistent accounts.** No installable software, no terminal, no local filesystem manipulation, no editor extensions.
- **Four working days per game.** Students get roughly four LLM sessions to build, given typical 5-hour token-quota windows on free tiers.
- **No coding background expected.** Many students have never written a line of JavaScript before camp.
- **A polished, judged result is the deliverable.** Games are evaluated at the end of camp.

The combination is hostile to traditional game-development workflows. By the time a novice student has hand-rolled a title screen, pause overlay, score persistence, sound effects, and game-over flow, they've burned three of their four days on plumbing — leaving one day for the actual game. And LLMs default to "build everything from scratch," which compounds the problem.

This framework folds all of that plumbing into a shared file that students never edit. Their entire mental model collapses to:

1. Fill in a `GAME_CONFIG` describing the game.
2. Fill in four lifecycle hooks describing the gameplay.
3. Call a small helper API for score, lives, sounds, and visual effects.

A student who has never coded can ship a game with menus, persisted top-5 leaderboards, theme music, screen shake, score popups, name entry, and a polished game-over flow — because every one of those pieces is "free" the moment they open the sketch.

---

## The four-hook architecture (the core decision)

The framework owns these p5.js entry points:

- `setup()` and `draw()` — the loop
- `keyPressed()`, `mousePressed()`, `mouseWheel()` — all input
- All scene transitions: title → playing → paused → settings → how-to-play → game-over → name-entry
- The Canvas, the world, gravity, the audio context

Students own four functions:

| Hook | Fires when | Purpose |
| --- | --- | --- |
| `onGameStart()` | A new run begins | Reset state, create sprites |
| `onGameUpdate()` | Each frame, only while actively playing | Read input, run game logic |
| `onGameDraw()` | Each frame during play (and once during pause) | Custom rendering layered above sprites |
| `onGameEnd(score)` | The run ends | Optional cleanup; framework saves the score |

Plus optional secondary hooks: `onPreload`, `onPause`, `onResume`, `onGameDrawBackground`, `drawCustomHud`.

**Why this split matters:**

- **Students never define `setup()` / `draw()`.** Those are p5.js's hooks — overriding them is the #1 way novices accidentally break the framework. By owning them, the framework prevents an entire class of bugs.
- **The framework runs the right code in the right state.** A student's `onGameUpdate` is invisible to the menu; the menu is invisible to the gameplay. Student code doesn't need to check "am I on the title screen?" — the framework handles that.
- **The framework can change without breaking student code.** As long as the four hook contracts are preserved, the framework's internals are free to evolve.

---

## Distribution: the starter sketch

Because students can't install anything or manipulate files locally, the framework is distributed as a **single canonical sketch hosted on editor.p5js.org**:

1. The framework maintainer hosts a "Vibe-Coded Games Starter" sketch in their editor.p5js.org account.
2. Students click **File → Duplicate** to fork their own copy.
3. The duplicated copy contains `framework.js`, `index.html`, `sketch.js`, `style.css`, `readme.txt`, and `prompt.txt` — all wired and ready to play.
4. Students only edit `sketch.js` from then on.

This intentionally **pins each game to a snapshot of the framework**. A breaking framework change can't suddenly break a half-finished student game; they just keep using their pinned copy. The cost is that students don't pick up framework improvements after they've duplicated — but for a 4-day camp, stability trumps freshness.

> **Starter sketch:** [AIPI Game Starter](https://editor.p5js.org/bappelt/sketches/z-MEl9Ami) (`https://editor.p5js.org/bappelt/sketches/z-MEl9Ami`).

---

## Files in the project

| File | Audience | Purpose |
| --- | --- | --- |
| `framework.js` | Maintainers | The framework itself (~1,700 lines). Loaded by `index.html`. |
| `index.html` | Maintainers | Loads p5.js, p5.sound, p5.play, framework.js, sketch.js. Students don't edit. |
| `sketch.js` | Students | Their game. Holds `GAME_CONFIG` + the four hooks. |
| `style.css` | Nobody | Empty, ignored. |
| `readme.txt` | Students | Plain-text "here's what to do" guide that opens inside the editor. |
| `prompt.txt` | Students using LLMs | System-prompt-style document students paste into an LLM at the start of every chat. |
| `README.md` | Maintainers / teachers | This file. |

> **About the `.txt` extensions:** The p5.js Web Editor only allows certain file extensions in a sketch — `.md` is **not** one of them. `prompt.txt` and `readme.txt` are deliberately plain-text so they can ship inside the duplicated sketch. The markdown formatting inside `prompt.txt` is fine — LLMs read it; humans read it as text.

---

## What the framework provides

### Presentation
- Animated title screen with menu navigation (mouse + keyboard, hold-to-repeat on arrows)
- "How to Play" screen — auto-built from `GAME_CONFIG.controls`, supports section headers (`## Header` or `== Header ==`) and word-wraps long lines, scrolls when content overflows
- Pause overlay
- Settings menu (Time Limit, Master / Music / SFX volumes, Music Track)
- Game Over screen
- Name-entry screen for new high scores
- Modal-style fade transitions between scenes

### Persistence
- Top-5 leaderboard with named entries, stored in `localStorage` keyed per-game
- Settings persisted alongside the leaderboard
- Backward-compatible migration of older save formats

### Audio
- **Synthesized SFX engine** — no asset files required for: `menu`, `confirm`, `score`, `miss`, `lose`, `laser`, `gameOver`, `highScore`
- **Procedural theme music** — five preset patterns (`arcade`, `retro`, `neon`, `space`, `default`), each ~30 lines of notes/envelopes, scheduled by a frame-driven beat clock
- **Continuous-tone helper** (`setTone` / `stopTone`) for sirens / drones — auto-stops when state leaves PLAYING
- **Optional asset music** via `GAME_CONFIG.sounds.music`. When provided, it shows up as `Game Music` in the Settings → Music Track list and plays as the default
- Master / Music / SFX volume controls, plus an **`M`** mute hotkey

### Game-feel helpers
- `screenShake(intensity, ms)` — camera shake via p5.play's camera
- `popupText(text, x, y, color?)` — floating "+10" labels with upward drift + fade
- `addScore(n)`, `loseLife()`, `addLife()`, `setLives(n)`, `endGame()`
- `addTime(s)`, `getTimeRemaining()` — timed mode
- `getTheme()` — read the resolved theme palette

### Modes
- Optional **lives system** (`GAME_CONFIG.startLives > 0`)
- Optional **timed mode** (`GAME_CONFIG.timeLimit` seconds — countdown HUD, auto-end-on-zero, scoreboard integration)
- Players can override time limit and music track in **Settings**

---

## What the framework deliberately doesn't provide

The "no" list is as important as the "yes" list:

- **No sprite animation system.** p5.play already has one; the framework doesn't wrap or duplicate it.
- **No level system.** Games handle their own progression in `onGameUpdate`. (Letting the framework own levels would force a particular pacing model.)
- **No saving of mid-run state.** A run starts fresh.
- **No multiplayer / networking.** Out of scope for camp.
- **No gamepad / touch input** (in framework UI). p5.play exposes both, so games can use them in their own logic.

---

## `GAME_CONFIG` reference

| Field | Type | Default | Notes |
| --- | --- | --- | --- |
| `title` | `string` | `'Untitled Game'` | Shown big on the title screen |
| `storageKey` | `string` | `'vcg_untitled'` | localStorage key — must be unique per game |
| `canvasWidth` | `number` | `720` | |
| `canvasHeight` | `number` | `480` | |
| `subtitle` | `string` | none | Small text under the title |
| `controls` | `string[]` | a basic default | Lines for "How to Play". Supports `## Header` and `== Header ==` syntax for section headers. |
| `background` | `'stars' \| 'grid' \| 'solid' \| false` | `'stars'` | |
| `startLives` | `number` | `0` | If > 0, framework tracks lives and ends the run at 0 |
| `timeLimit` | `number` | `0` | Seconds. If > 0, run becomes a "highest score in N seconds" timed mode |
| `music` | `boolean` | `true` | Set `false` to silence both procedural and asset music entirely |
| `theme` | `object \| string` | `DEFAULT_THEME` | Object override of `{ bg, primary, accent, text, muted, danger }`, or a preset name (`'arcade'`, `'retro'`, `'neon'`, `'space'`). Object form supports `{ preset: 'neon', accent: '#ff0' }` to combine. |
| `sounds` | `object` | `{}` | Map of name → URL. `music` is treated as background music. |

### Theme presets

| Preset | Background | Primary | Accent | Music character |
| --- | --- | --- | --- | --- |
| `arcade` | dark purple | pink | cyan | 132 BPM bouncy chiptune |
| `retro` | dark olive | sage | gold | 100 BPM warm triangle bass |
| `neon` | near-black | green | magenta | 124 BPM driving sawtooth |
| `space` | navy | blue-grey | yellow | 56 BPM ambient sine pad |

---

## Helper API reference

| Helper | Effect |
| --- | --- |
| `addScore(n)` | Increase the running score |
| `endGame()` | End the run; framework runs high-score flow + game-over screen |
| `setLives(n)` / `loseLife()` / `addLife()` | Adjust lives (only when `startLives > 0`) |
| `getTimeRemaining()` | ms left in timed mode (0 if not timed) |
| `addTime(s)` | Extend (positive) or penalize (negative) the run timer |
| `popupText(text, x, y, color?)` | Floating "+10"-style label |
| `screenShake(intensity, durationMs)` | Camera shake (uses p5.play's camera) |
| `playSfx(name)` | One-shot sound — synthesized if no matching asset |
| `playMusic(name)` / `stopMusic()` | Loop / stop a `GAME_CONFIG.sounds` entry |
| `setTone(freq, vol)` / `stopTone()` | Continuous tone; auto-stops when state leaves PLAYING |
| `getTheme()` | Resolved `{ bg, primary, accent, text, muted, danger }` |

Globals readable from game code: `score`, `highScore`, `highScores`, `lives`, `settings`, `state`.

---

## LLM workflow

The framework anticipates students using an LLM (Claude, ChatGPT, Gemini, Copilot) as their co-author. [`prompt.txt`](prompt.txt) is a system-prompt-style document students copy into the LLM **at the start of every session**. It briefs the LLM on:

- The editor.p5js.org constraints (paste-and-play, no filesystem)
- Which files exist and which the student can edit
- The four-hook architecture
- All `GAME_CONFIG` fields
- All helpers
- "What a great game looks like in 4 days" — game feel, scope discipline
- Anti-patterns: don't redefine `setup` / `draw`, don't add dependencies, don't refactor `framework.js`

This is the single biggest force-multiplier in the framework. Without it, the LLM defaults to "build a game from scratch," reinvents menus / scoring / sound, and burns student tokens on plumbing the framework already provides. With it, the LLM produces game code that drops cleanly into the existing scaffolding.

**Teachers should make sure students know to paste `prompt.txt` first** — it's the difference between an LLM that's a force multiplier and an LLM that fights the framework.

---

## Updating the canonical starter sketch

When the framework changes:

1. Edit the canonical sketch on editor.p5js.org (paste the new `framework.js`).
2. Save.
3. The shared link still resolves to the same project; new duplicates pick up the change.
4. Students who duplicated *before* the update keep the old version — by design.

Tag a release in this repo whenever the canonical sketch is updated, and link the editor sketch URL from the release notes so teachers can verify they're pointing students at the current version.

---

## Customization extension points

If you want a custom version of the framework (different palette, different default audio, etc.), most extension is pure data-table edits:

- **New theme preset:** add an entry to `PRESET_THEMES` and a matching pattern in `THEME_MUSIC` in `framework.js`.
- **New synthesized SFX name:** add a case to `_synthSfx()`.
- **New settings row:** add an entry to `SETTINGS_ITEMS`. Three kinds supported: `slider`, `select`, `action`.
- **New animated background:** add a case to `_drawBackground()`.

Resist adding new lifecycle hooks unless multiple games genuinely need them — every new hook is a new contract students may break. The current four-hook surface has held up well across pretty different game genres (arcade shooter, falling-block puzzle, paddle catcher, etc.).

---

## A note on style for student-facing copy

The `readme.txt` and `prompt.txt` files use deliberately plain language. No "elegant," no "leverage," no "robust." Use short sentences. Where a student might not recognize a term (e.g., "lerp," "envelope," "MIDI"), avoid it or explain it once. A thirteen-year-old who has never coded should be able to read every word.

If you edit those files, keep that tone.
