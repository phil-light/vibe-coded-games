# Ultris

A puzzle action game — Tetris falling-block clone fused with a match-3 chain mechanic, explosive red tiles, and a power-up economy. Built on the [Game Framework](../game-framework/), and a worked example of what's possible when a single game leans on every framework feature.

## What it is

Tetrominoes fall. Connecting 3+ same-color tiles in any contiguous shape clears them. So far, so puzzle-game. The twists:

- **RED tiles explode** when 3+ are adjacent — clearing every tile in a 3-tile radius (regardless of color).
- **ULTRIS (U) tiles** can't be color-matched on their own — but matching 3+ U tiles, *or* catching 3+ in a blast, grants a random power-up.
- **HARD (H) tiles** appear at level 10 and look identical to U tiles. They cannot be matched. Only blasts destroy them.
- **Chains.** Land a piece within 2 seconds of a clear and the next clear's score is multiplied — and the multiplier persists across pieces.
- **Power-ups** (capped at 5): boom all reds, boom one color, boom the bottom row, boom 8 random tiles, convert a color into U tiles, or **ULTRIS EXPLODE** (clears the entire board, tile by tile).
- **Garbage rows** push up from below at level 2+, faster as level rises.
- **Top out** and your stored power-ups all auto-fire to save you. Once.

## How to play

| Control | Action |
| --- | --- |
| `←` / `→` | Move piece left / right |
| `↓` | Soft drop |
| `↑` | Rotate |
| `Space` | Hard drop |
| `C` | Hold piece |
| `1`–`5` or click | Use a stored power-up |
| `P` or `Esc` | Pause |
| `M` | Mute / unmute |

The full mechanics summary lives on the in-game **How to Play** screen (accessible from the title menu).

## Trying it yourself

Hosted as a sketch on editor.p5js.org:

> **Ultris sketch:** *URL — TBD. Replace with the live link once hosted.*

To tinker with the code, click **File → Duplicate** in the editor and edit your own copy.

## Why this game exists

Ultris is the upper bound of what a 4-day camp game can look like when a student really pushes the [Game Framework](../game-framework/). The framework absorbs the entire presentation and persistence layer — so even though Ultris has six power-up types, a chain system, level progression, garbage rows, two special tile types, and a life-save mechanic, the `sketch.js` file remains a single coherent unit and not a tangle of UI plumbing.

It also serves as the framework's stress test: if a feature works in Ultris (the dispatch of power-ups across pause/celebrate states, the fanfare overlays, the flash animations layered with the framework's transitions), it'll work in simpler games too.

## Mechanics

### Tile types

| Tile | Behavior |
| --- | --- |
| Blue / Yellow / Green / Purple | Match 3+ to clear. Standard match-3. |
| **Red** | 3+ adjacent reds explode in a 3-tile radius, clearing every tile in the blast. |
| **U (ULTRIS)** | Cannot be matched alone. Match 3+ *or* blast 3+ in one explosion → random power-up. |
| **H (HARD)** | Looks identical to U. **Cannot be matched.** Only blasts destroy them. Appears from level 10 (1% of all tiles, ramping to 15% by level 20). |

### Chains

When tiles clear, gravity drops the survivors, which can trigger more matches and explosions in sequence. Each step in a chain multiplies the score: ×2, ×3, ×4, …

A separate **chain-carry** rule: if you land a new piece within 2 seconds of a clear, the chain counter persists into the next clear too. Skilled play stacks long chains across multiple piece placements; the side panel pulses while the carry window is open and a continuous-tone alarm rises in pitch as it expires.

### Power-up types

| Power-up | Effect |
| --- | --- |
| Boom all REDS | Detonates every red tile on the board |
| Boom all `<color>` | Removes every tile of one randomly-chosen base color |
| Boom bottom row | Clears the bottom row |
| Boom 8 random | Removes 8 random non-empty tiles |
| Convert `<color>` → U | Turns every tile of one base color into ULTRIS — usually triggers a chain of further power-ups |
| **ULTRIS EXPLODE** | Clears the entire board, tile by tile, awarding +50 each |

The 5th power-up earned, then every 10th after that, is guaranteed to be ULTRIS EXPLODE — a panic button when the board fills up.

### Inventory cap

The slot limit is 5. When you'd earn a 6th, the oldest one auto-fires first to make room. Hoarding has a hard ceiling.

### Top-out save

If a piece can't spawn (board too tall), the framework would normally end the run. Ultris instead fires every stored power-up in sequence first. If they clear enough space for a piece to spawn, you survive. This save fires once per run.

### Level progression

| Level | What unlocks |
| --- | --- |
| 1 | Base game, slow drop |
| 2 | Garbage rows start pushing up (every 45 s) |
| 3+ | Garbage cadence accelerates every 2 levels |
| 10 | HARD tiles begin appearing (1% of all tiles) |
| 20 | HARD tile rate maxes out at 15% |

Tiles cleared per level: 100. Drop interval shortens by 60 ms per level, clamped at 120 ms.

## Strategy notes

- **Save power-ups for emergencies, not for fun.** The cap punishes hoarders, but a stored Boom-Reds is a lifesaver when reds accumulate near the top.
- **Convert is a setup tool.** Pop a Convert on a color you have a lot of → instant U match → instant power-up → potentially another Convert. Stacking Converts is the highest-scoring play in the game.
- **Land within 2 seconds.** The chain-carry window is generous; use it.
- **Plan for HARD tiles at level 10.** Don't trust visible U groups blindly; some won't match. Red blasts are the only universal answer.

## Implementation notes

- **Theme:** `'neon'` preset (124 BPM driving sawtooth bass).
- **Game logic** lives entirely in [`sketch.js`](sketch.js); `framework.js` is untouched.
- **Custom panels** (NEXT, HOLD, LEVEL, garbage timer, power-up inventory, legend) are drawn in `onGameDraw` alongside the framework's default HUD.
- **Continuous tone** during the chain-carry window uses the framework's `setTone()` helper — pitch and pulse rate ramp as the timer expires.
- **Overlays** (BOOM!, ULTRIS EXPLODE!, power-up fanfare, life-save banner, level-up celebration) are drawn as overlays in `onGameDraw`. The framework's `popupText` is used for inline `+points` labels.
- **Tunables** — drop speed curve, level pacing, tile spawn rates, blast radius, lock delay, chain windows, power-up weights, hard-tile rate ramp — are all named constants at the top of `sketch.js`. A student can rebalance the game without reading the logic.
