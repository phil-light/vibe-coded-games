# Session 06 — Puzzle 3: Wake Up Tito (DIG)

This session implements **Puzzle 3** from `claude/puzzles.md`: the
sleeping Ferris Wheel operator on a bench south of the Restrooms. The
pup wakes him by digging the dust patch under the bench; he runs to the
operator booth east of the Ferris Wheel, and from then on the wheel is
visibly turning. None of the other verbs solve the puzzle, but each one
gets the location-specific reaction the design doc calls for.

## Prompts

### Prompt 1

> We are going to continue work on the LostPup game. Its project
> description is in lost-pup/LostPup.md. I want you to work in the
> lost-pup/claude directory. Please cut a branch called "Tito" and work
> on Puzzle 3 as described in lost-pup/claude/puzzles.md

## Response — Puzzle 3 implementation

Branch `Tito` cut from the current working branch. All edits live in
the existing `claude/src/sketch.js`; no new source files were added.

### What changed in `sketch.js`

1. **New state block** (next to the Puzzle 4 block at the top of the
   file). All Puzzle 3 state lives in plain module-level variables,
   matching the existing pattern:

   ```js
   const TITO_BENCH_TILE   = [17, 6];
   const FERRIS_BOOTH_TILE = [11.5, 13.5];
   const TITO_PATH_TILES   = [
     [17.5,  7.0],   // step off the bench
     [17.5, 18.5],   // south to the central path
     [11.5, 18.5],   // west along the path
     [11.5, 13.5],   // north to the booth
   ];
   const TITO_WAKE_FRAMES = 90;
   const TITO_WALK_SPEED  = 1.6;
   let titoAwake     = false;
   let titoAtBooth   = false;
   let wheelTurning  = false;
   let titoState     = "asleep";  // asleep | waking | walking | atBooth
   let titoX, titoY;              // current pixel position
   let titoWakeFrame = 0;
   let titoWaypoint  = 0;
   let wheelAngle    = 0;
   ```

   The fixed waypoint path (south → west → north) keeps Tito visible
   on screen the whole way to the booth — no off-screen teleport — so
   the player gets a clean "I made him do that" payoff.

2. **`updateTito()`** — small state machine called from `updateMap()`:
   - `asleep` is a no-op (he's drawn snoring on the bench).
   - `waking` plays `TITO_WAKE_FRAMES` frames of bench bobble + sneeze
     FX, then flips to `walking`.
   - `walking` advances Tito toward the next waypoint at
     `TITO_WALK_SPEED` px/frame; on path completion he flips to
     `atBooth` and `wheelTurning` becomes true.
   - `atBooth` is terminal.

3. **`drawTitoBench`, `drawSleepingTito`, `drawStandingTito`,
   `drawTitoSneezeFx`, `drawSleepZ`, `drawFerrisBooth`,
   `drawSpinningWheel`** — new sprite/visual helpers. The bench has a
   visible dust patch underneath so the player has a graphic cue for
   where to dig. Tito sleeps on his back with his cap pulled over his
   face (and shoelaces visibly hanging — pays off the bite gag). The
   wheel motif (eight spokes + eight gondola dots) is drawn over the
   Ferris Wheel building once `wheelTurning` is true; it spins at
   `wheelAngle += 0.02` rad/frame. This is intentionally a *motif*,
   not the endgame wheel — that visual belongs to Session 5.

4. **Y-sorted entity layer** in `drawMap()` now also includes the
   bench, Tito (when not in the booth), and the operator booth. They
   sort against the people and the pup using their foot Y, so the pup
   correctly walks behind/in front of each one. The spinning wheel
   draws after the entity layer, on top of the Ferris Wheel building.

5. **Verb wiring at the bench** — proximity checked with
   `pupNearTitoBench()` (pixel distance < `TITO_REACH = 36`):
   - **Dig** — solves the puzzle. Sets `titoState = "waking"` and emits
     a long action message ending with "AAAH! THE WHEEL! THE WHEEL!".
   - **Bark** — Tito's snore hitches and resumes louder. No effect.
   - **Bite** — pup unties his shoelaces; he mumbles about a knot. No
     effect.
   - **Sniff** — uses the existing `restroom` HOT breadcrumb message
     (which already describes the operator's smell), with a new tail
     sentence appended that varies by `titoState`:
     - asleep → "The man on the bench. He's out cold."
     - walking → "The man hurrying west toward the Ferris Wheel."
     - atBooth → "The same smell as the man now in the operator booth."
     This ties the breadcrumb to the visible character and gives the
     "He's out cold" hint the design doc calls for, without forking the
     sniff logic into a new branch.

   Bark and bite at the bench short-circuit *before* the existing
   crowd-reaction logic, so they don't accidentally summon Animal
   Control on Tito.

6. **Bottom-bubble HUD** in `drawMapHUD()` got new state-aware default
   messages, in priority order:
   - "Tito is sneezing himself awake!" (waking)
   - "Tito is hurrying back to the Ferris Wheel booth." (walking)
   - "The wheel is turning and the family is up there. Head west to
     the Ferris Wheel." (atBooth + trailComplete)
   - "Tito's back in the booth. The Ferris Wheel is turning again."
     (atBooth alone)
   - "A man in an operator's vest is fast asleep on the bench. Bark
     and bite haven't done much. What else could ${pup} try?" — fires
     only when the pup is actually next to the bench and Tito is
     still asleep, so it functions as a contextual nudge toward dig
     without spoiling it for players who haven't found the bench yet.

### Things deliberately *not* added in this session

- **No patrols and no path gating.** Puzzles 1 and 2 add the Chief and
  Animal Control patrol systems. Per the design doc, Puzzle 3 is
  reachable from the spawn point without crossing any patrolled path,
  and its effect (a turning wheel) is fine to start ticking even when
  the path west is still blocked. Session 5 will gate the endgame on
  `titoAtBooth && (goatLoose || chiefDistracted)`.
- **No endgame wheel visual.** The big animated wheel + family
  gondola is Session 5's job. Puzzle 3 only signals "the wheel is
  turning" with the small spinning motif over the building.
- **No collision on Tito or the bench.** Both are passable. This
  matches how the existing crowd works and keeps the pup from getting
  wedged behind the bench.
- **No persistence between runs.** Reloading the page resets
  `titoState` to `"asleep"`, exactly like the rest of the game state.

### How to test

Paste the updated `claude/src/sketch.js` into the p5.js web editor.

1. Title → name the pup → story slideshow → paddock → escape paddock.
2. In the overworld, walk north-west from the spawn (south of the
   Horse Barn) to the bench tucked just south of the Restrooms.
3. With the pup adjacent to the bench:
   - Press **S** — sniff returns the HOT restroom breadcrumb message
     ending in "The man on the bench. He's out cold."
   - Press **B** — "BARK! Tito's snore hitches…" — no effect.
   - Press **T** — "…gnaws Tito's shoelaces apart…" — no effect.
   - Press **D** — full sneeze sequence fires; Tito stands and walks
     south, west, then north to the operator booth east of the Ferris
     Wheel. The bottom-bubble status message tracks each phase.
4. Once Tito reaches the booth, he is drawn standing inside it and
   the small spinning-wheel motif overlays the Ferris Wheel building
   for the rest of the game.
5. Returning to the bench post-solve: bench is empty, sniff message
   adapts ("The same smell as the man now in the operator booth"),
   and dig falls through to the normal food-finding behavior.
