# Ultris — One-Shot Prompt

A fictitious example of what a student could paste into an AI chat **after** the framework's [`prompt.txt`](../game-framework/prompt.txt) to (theoretically) produce something close to this game in a single shot.

In reality, a game this layered would be built up over many iterations — describe the core, see it work, then add a system at a time. This file is a thought experiment showing what a student would have to write to get the entire thing out of an AI in one go. Don't expect a real LLM to nail it on the first try; for genuinely complex games, iteration wins.

---

## The prompt

```text
Make me a falling-block puzzle game called Ultris — Tetris fused with a
match-3 mechanic, explosive red tiles, and a power-up economy.


----- PLAYFIELD -----

- 10 columns × 20 rows, 22px cells, drawn at the left side of the canvas.
- Standard seven tetromino shapes (I, O, T, J, L, S, Z).
- Pieces spawn at the top center.
- Drop interval starts at 700ms and speeds up by 60ms per level
  (clamped at a minimum of 120ms).
- Lock delay: 500ms once a piece touches the floor. Up to 15 lock-delay
  resets allowed (move/rotate to refresh the timer).
- Auto-repeat for left/right: 180ms initial press, 80ms thereafter.


----- TILE TYPES -----

There are seven kinds of tile:

- BLUE, YELLOW, GREEN, PURPLE — the four "match" colors. Match 3+ in a
  contiguous group (horizontally / vertically) to clear them.
- RED — 3+ adjacent reds INSTEAD detonate in a 3-tile-radius blast,
  clearing every tile in the radius regardless of color.
- ULTRIS — looks like a grey tile with the letter "U" on it. Cannot
  be cleared by color matching. BUT: matching 3+ U tiles, OR catching
  3+ U tiles in a single blast, grants a random power-up.
- HARD — looks IDENTICAL to U (same grey, same letter style — but
  shows "H" instead of "U"). Cannot be matched at all. Only blasts
  destroy them. Only appears from level 10 onward.


----- TILE SPAWN RATES -----

When generating a tile color (in newly-spawned pieces and garbage rows):

- RED:    12% (always).
- ULTRIS: 5% at level 1, +1% per level, capped at 15%.
- HARD:   0% before level 10. From level 10 it's 1%, +1.4% per level,
          capped at 15%.
- The remainder is split evenly across BLUE / YELLOW / GREEN / PURPLE.

For garbage row tiles, exclude RED, ULTRIS, and HARD entirely (only the
4 base colors).


----- MATCH RESOLUTION -----

After every piece locks (or after a power-up fires), run this resolution
loop until nothing changes:

1. Find connected components of same-color tiles (4-direction flood fill).
2. For each RED component of size 3+: mark every tile within a 3-tile
   radius of any cell in the component for removal. (This includes the
   reds themselves AND any other tiles caught in the blast — even
   ULTRIS and HARD.)
3. For each ULTRIS component of size 3+: grant a power-up, mark the U
   tiles for removal, and add a brief white-flash effect on each.
4. For each HARD component: do NOTHING. (HARD tiles never clear by
   matching.)
5. For each other-color component of size 3+: mark for removal.
6. Count ULTRIS tiles that got caught in a red blast (but NOT also
   color-matched). If that count ≥ 3, grant ANOTHER power-up.
7. Remove all marked tiles, apply gravity (tiles fall to fill empties),
   then loop back to step 1. Track a chain counter — each pass through
   the loop is one chain step, multiplying the score.


----- CHAINS AND THE CHAIN-CARRY WINDOW -----

- Each step in a clearing sequence multiplies the points awarded:
  ×1, ×2, ×3, ...
- When a chain finishes, start a 2-second "chain carry" timer.
- If the player lands a new piece that triggers ANY clear before the
  timer expires, the chain counter PERSISTS into that clear (so it can
  keep climbing across pieces).
- During the carry window:
   * Show an "xN CHAIN!" indicator in a side panel that pulses in the
     accent color.
   * Play a continuous tone (use setTone) whose pitch rises and whose
     pulse rate accelerates as the timer expires.


----- POWER-UPS -----

Six types in total. Five are in a random pool; one is special.

- EXPLODE_REDS    — for every red on the board, trigger a 3-tile blast.
- EXPLODE_COLOR   — pick one random base color, remove every tile of it.
- EXPLODE_BOTTOM  — clear every tile in the bottom row.
- EXPLODE_RANDOM  — pick 8 random non-empty tiles and remove them.
- CONVERT_COLOR   — pick one random base color, convert every tile of
                    that color into a U tile. (Often triggers a chain.)
- ULTRIS_EXPLODE  — clears the entire board, tile by tile, awarding +50
                    points each. Heavy screen shake. (Special — see below.)

Random pool weights (when granting a non-special power-up):
   EXPLODE_REDS    = 2
   EXPLODE_COLOR   = 2
   EXPLODE_BOTTOM  = 2
   EXPLODE_RANDOM  = 2
   CONVERT_COLOR   = 1   (rarer because it's the strongest)

ULTRIS_EXPLODE is NOT in the random pool. It's GUARANTEED to be granted
as the player's 5th power-up earned, then every 10th after that
(5th, 15th, 25th, 35th, ...).


----- POWER-UP INVENTORY -----

- The player can hold at most 5 power-ups at once.
- Press 1-5 or click on a slot in the side panel to fire one.
- When firing, animate the affected tiles being removed one-by-one
  (~30ms apart) with a small flash on each removed cell.
- If the player would earn a 6th power-up, the OLDEST one in the
  inventory (slot 1) AUTO-FIRES first to make room. Show an
  "AUTO-FIRE: <power-up name>" popup near the playfield bottom.


----- TOP-OUT SAVE (ONE PER RUN) -----

- If a piece can't spawn because the board is too tall, DON'T end the
  run yet.
- Instead: auto-fire ALL stored power-ups in sequence (with brief gaps
  between firings).
- After they all finish, try to spawn the piece again.
   * If it fits → player survives. Show a big "LIFE SAVED!" banner.
   * If it still doesn't fit → end the run normally.


----- GARBAGE ROWS -----

- Starting at level 2, push a row of random non-red tiles up from the
  bottom of the playfield every 45 seconds.
- The cadence accelerates: subtract ~5 seconds from the interval every
  two levels (clamped at 10 seconds minimum).
- Show a "PUSH UP IN N.Ns" countdown in the side panel. Pulse it in
  the accent color when fewer than 5 seconds remain.


----- LEVELS -----

- 100 tiles cleared per level.
- On every level-up: pause briefly, show a celebration overlay listing
  what changed (faster pieces, garbage cadence, ULTRIS rate, etc).
- At level 10 specifically, announce HARD tiles arriving (they look
  like U but can't be matched — only blasts destroy them).
- Player can press Space or Enter to skip the celebration.


----- SIDE PANEL -----

To the right of the playfield, draw:
- NEXT preview (the next piece, scaled down).
- HOLD slot (the held piece, or "press C" hint if empty; greyed out
  when hold isn't available this turn).
- LEVEL number, "TILES THIS LEVEL N/100" with a progress bar.
- Garbage countdown (only when level ≥ 2).
- Chain-carry indicator (only when active).
- POWER-UPS list — each slot shows its number, name, and a color swatch
  for color-specific ones (EXPLODE_COLOR, CONVERT_COLOR). When the
  inventory is full, highlight slot 1 (the next to auto-fire).
- A legend showing the four color tiles, the red rule, and the
  ULTRIS rule.


----- VISUAL / THEME -----

- Use the 'arcade' preset (pink primary, cyan accent, chiptune music).
- Background: 'grid'.
- Subtitle: "Match-3 Tetris with explosive red tiles."

Animated overlays for:
- xN CHAIN! popup (sized + wobble grow with chain count)
- BOOM! mid-screen flash on red explosions (yellow + red drop-shadow)
- ULTRIS EXPLODE! banner sliding in
- POWER-UP fanfare on each new power-up earned
- LIFE SAVED! big banner during top-out save
- LEVEL N COMPLETE! full-screen takeover with bullet-pointed changes

Per-tile flashes:
- Red blast / power-up boom: yellow flash on each removed cell.
- Convert color: cyan flash on each transformed cell.


----- CONTROLS LIST FOR HOW TO PLAY SCREEN -----

Use this exact array:

[
  '== Controls ==',
  '← →            Move',
  '↓              Soft drop',
  '↑              Rotate',
  'Space          Hard drop',
  'C              Hold piece',
  '1-5 or click   Use power-up',
  '',
  '== How to Play ==',
  'Match 3+ same-color tiles to clear them',
  '3+ adjacent RED tiles BOOM in a 3-tile radius',
  'Match 3+ U tiles = a random power-up',
  'Or blast 3+ U tiles at once — same reward',
  'H tiles look like U but only blasts destroy them',
  'Every 5th power-up (then every 10th) is ULTRIS EXPLODE',
  'Power-up inventory caps at 5; a 6th auto-fires the oldest',
  'Top out and ALL stored power-ups fire to save you',
  '',
  '== Tips ==',
  'Land a piece within 2s of a clear to chain combos',
  'Hold (C) to bank tricky pieces for later',
  'Convert turns a color into U tiles — set up big clears',
  'Garbage rows push up from level 2',
  'H tiles arrive at level 10',
]


----- FRAMEWORK USAGE -----

Use the framework liberally:
- addScore on every clear and ULTRIS-explode tile
- popupText for every "+points (xN)" label
- screenShake on every blast (bigger shake = bigger blast)
- playSfx for every event:
   * piece locks → 'confirm'
   * regular match clear → 'score'
   * red blast → 'lose' + 'laser' layered
   * ULTRIS match → 'highScore'
   * level up → 'highScore'
   * top-out save → 'highScore' + 'laser'
- setTone / stopTone for the chain-carry alert tone
- getTheme for accent / muted / danger / text colors throughout the
  side panel

Make it JUICY. Every meaningful event should shake, pop, and sound.


----- STORAGE / CANVAS -----

- Storage key: vcg_ultris_v1
- Canvas: 720 × 480

This is a big sketch — probably 1200+ lines. Don't compress; keep all
the named constants (drop intervals, blast radius, ULTRIS / HARD rates,
garbage timings, chain windows, lock delay) at the very top of the
file so I can rebalance them later without hunting through logic.
```

---

## What an LLM should produce

A `sketch.js` along the lines of this game's actual implementation:

- A long `GAME_CONFIG` block including the controls array, `theme: 'arcade'`, `'grid'` background, storage key, subtitle, canvas dimensions.
- A constants block at the top with **all** the tunables (`COLS`, `ROWS`, `CELL`, `MATCH_MIN`, `RED_MIN`, `BLAST_RADIUS`, `ULTRIS_BASE_RATE`, `HARD_START_LEVEL`, `LOCK_DELAY`, etc.).
- Game state vars (`grid`, `current`, `nextPiece`, `heldPiece`, `level`, `powerups`, `chainCount`, …).
- Piece spawning, locking, rotation (with simple wall-kicks), hold logic, lock-delay tracking with reset cap.
- A `findComponents()` flood fill, a `resolveStep()` resolution engine, an `applyGravity()`.
- A power-up function per type (`explodeAllReds()`, `explodeAllOfColor()`, `explodeBottomRow()`, `explodeRandomTiles()`, `convertColorToUltris()`, `startUltrisExplode()`) sharing a common `applyPowerupRemoval()` helper.
- A boom-sequence state machine that animates per-tile removal with flashes.
- A power-up grant function honoring the weighted random pool, the 5th/10th ULTRIS_EXPLODE rule, and the 5-slot cap with oldest-evicts auto-fire.
- A top-out path that queues an `pendingAutoPowerups` array and re-spawn-attempts after they all fire.
- Overlay drawers — chain popup, BOOM!, ULTRIS EXPLODE!, power-up fanfare, life-save banner, level-up celebration with bulleted change list.
- A side-panel renderer (`drawSidePanel`) and power-ups panel renderer (`drawPowerupsPanel`).
- A continuous-tone driver (`updateChainTone`) using `setTone`/`stopTone`.

Realistically the total lands somewhere around 1,000–1,500 lines. The actual game in this repo took many iterations to refine; even with the prompt above, a real LLM run would likely need follow-up clarification on the resolution-loop ordering, the auto-fire cascade, and the top-out save edge cases.
