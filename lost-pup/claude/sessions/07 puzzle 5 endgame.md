# Session 07 — Puzzle 5: Reunion at the Ferris Wheel (BARK, timed)

This session implements **Puzzle 5** from `claude/puzzles.md`: the
endgame. Once Tito is back in the booth and the wheel is turning,
walking up to the south face of the Ferris Wheel building swaps the
camera for a close-up of the wheel itself. The family's gondola
circles overhead. A timed BARK while their gondola is at the bottom
of the arc kicks off a short reunion cutscene and a "The End" card.

## Prompts

### Prompt 1

> We will continue to work on Lost Pup, described in LostPup.md. You
> will work in the claude/ directory. I would like to make an
> implementation of Puzzle 5, described in claude/puzzles.md. Your
> output will be to update claude/src/sketch.js. Don't worry about
> creating the session log yet; we will do that when it's time to
> commit.

## Response — Puzzle 5 implementation

All edits live in the existing `claude/src/sketch.js`; no new source
files were added. The puzzle is contained entirely in two new game
states (`STATE_FERRIS`, `STATE_END`) and a self-contained block of
draw / update / verb handlers.

### What changed in `sketch.js`

1. **Two new game states** added next to the existing ones:

   ```js
   const STATE_FERRIS  = 4;   // close-up of the wheel; player picks verbs
   const STATE_END     = 5;   // closing "The End" card
   ```

   `STATE_FERRIS` is reached automatically by walking into the wheel's
   south face. `STATE_END` is reached automatically at the end of the
   reunion cutscene.

2. **New state block** for the endgame, sitting next to the Puzzle 3
   state:

   ```js
   const NUM_GONDOLAS         = 8;
   const FAMILY_GONDOLA_INDEX = 6;       // family starts near the top
   const FAMILY_BOTTOM_WINDOW = 0.44;    // ±25° per the puzzle spec
   const ENDGAME_WHEEL_CX = 320;
   const ENDGAME_WHEEL_CY = 200;
   const ENDGAME_WHEEL_R  = 140;

   let goatLoose       = false;   // P1 stub — see "Things deliberately not added"
   let chiefDistracted = false;   // P2 stub — see "Things deliberately not added"

   let endgameEntered  = false;
   let reunited        = false;
   let reunionPhase    = "wait";   // "wait"|"stopping"|"stopped"|"celebrate"|"fade"
   let reunionFrame    = 0;
   let stoppingFromAngle, stoppingTargetAngle;
   const STOPPING_FRAMES   = 90;
   const STOPPED_FRAMES    = 30;
   const CELEBRATE_FRAMES  = 180;
   const FADE_FRAMES       = 90;
   let ferrisBarkAttempts  = 0;
   ```

3. **Entry trigger** in `updateMap()`. After the normal movement and
   camera updates, `pupAtFerrisBase()` checks the pup's tile coords
   against a box covering the wheel's southern approach
   (`x∈[4,13], y∈[15,18]`). When the pup walks into that box and the
   wheel is turning, `enterFerrisEndgame()` swaps `gameState` to
   `STATE_FERRIS`, sets `reunionPhase = "wait"`, and fires a one-shot
   action message orienting the player.

4. **`updateFerris()`** — small phase machine driven by `reunionFrame`:

   - `wait`: `wheelAngle` keeps incrementing; player input is live.
   - `stopping`: ease-out cubic from `stoppingFromAngle` to
     `stoppingTargetAngle` (the next wheelAngle at which the family
     gondola lands at the bottom — see `familyTargetWheelAngle()`).
     `STOPPING_FRAMES = 90` (~1.5 s).
   - `stopped`: a 30-frame breath where the wheel is still and the
     family is at the bottom.
   - `celebrate`: 180 frames of the reunion tableau.
   - `fade`: 90 frames of white fade, then `gameState = STATE_END`.

5. **Verb handlers** at the wheel — all four are present but only
   bark can solve, matching the puzzle-doc table:

   - **Sniff** → "HOT HOT HOT — they're directly above…"
   - **Bite** → "*clack-clack* Just hurts your teeth."
   - **Dig** → "packed gravel — nothing to dig up."
   - **Bark** → calls `familyAtBottom()`. If true, sets
     `reunionPhase = "stopping"` and seeds the easing angles.
     If false, increments `ferrisBarkAttempts` and emits a nudge
     that gets more pointed after 2 and 3 misses.

   `keyPressed()` ignores all input outside the `wait` phase, so the
   cutscene plays through cleanly.

6. **`drawEndgameWheel(cx, cy, r, angle, familyIdx, kidWaving, stopped)`**
   — new draw helper modeled on the slideshow's `drawBigFerrisWheel`
   but with explicit angle/family-index parameters and a few visual
   affordances for the puzzle:

   - All 8 gondolas drawn with distinct colors.
   - Family gondola has a pulsing yellow halo so the player can find
     it at a glance even when it wraps behind the rim.
   - Mom/Dad/Kid sprites visible inside the family gondola; the kid
     has a tiny waving arm during the `wait` phase.
   - A soft yellow glow on the ground beneath the wheel that
     brightens whenever `familyAtBottom()` is true. This trains the
     player's eye on the bark window without spelling out the rule.

7. **`drawReunionTableau()`** — renders the post-bark cutscene at the
   bottom of the wheel:

   - frames 30–60: kid steps out of the gondola door onto the ground.
   - frames 60+: mom and dad step out behind the kid.
   - frames 30–170: a "PUPNAME!!!" speech bubble fades in/out over
     the kid.
   - frames 130+: the pup is in the kid's arms, with hearts floating
     up.

   The pup itself is drawn by `drawFerris()` until frame 130 (running
   from its starting spot toward the family with a small hop animation),
   then handed off to the tableau for the in-arms pose.

8. **`drawFerris()`** — the endgame frame. Late-afternoon sky gradient,
   silhouette tents at the horizon, gravel ground, big wheel,
   operator booth + standing Tito (waving), the running/leaping pup,
   and the cutscene tableau when applicable. Falls back to
   `drawFerrisHUD()` for the bottom info bubble — same visual style
   as the overworld HUD, but with phase-specific copy and the verb
   key-hints hidden during the cutscene.

9. **`drawEnd()`** — closing card. Warm gradient, large "THE END" with
   drop shadow, sub-line "{pup} found the family.", and a
   pup-and-family stamp (mom/dad flanking the kid, pup tucked in the
   kid's arms) with hearts drifting up. `updateEnd()` does nothing
   beyond ticking `reunionFrame` so the bob animation stays alive.

10. **`keyPressed()`** routes 68/66/83/84 (D/B/S/T) to the new
    `doFerris*` handlers when in `STATE_FERRIS` and the cutscene
    hasn't started. `STATE_END` is terminal (no input).

### Things deliberately *not* added in this session

- **Patrol gating on entry.** The puzzle doc says the endgame should
  require both `titoAtBooth` *and* `goatLoose || chiefDistracted`.
  Puzzles 1 and 2 (the patrols those flags belong to) don't exist
  yet — there are no Animal Control or Chief sprites to bypass —
  so the entry currently only checks `wheelTurning`. The two flags
  are declared and stubbed `false` so the gate can be tightened in
  one line when P1/P2 land. A comment on the trigger spells this out.
- **No "leave" mechanic.** Once the player walks into the wheel base
  with the wheel turning, they're committed to the endgame. The
  bark window comes around every ~5 s, so this is fine.
- **No visible boarding platform.** The family steps out of the
  gondola directly onto the ground. A real Ferris Wheel would have
  a boarding platform; the cutscene scale didn't justify the extra
  geometry.
- **No persistence past `STATE_END`.** The closing card holds. There
  is no "play again" option. Reloading the page resets the game
  state to title — same as everywhere else.
- **No audio.** Consistent with the rest of the prototype.

### How to test

Paste the updated `claude/src/sketch.js` into the p5.js web editor.

1. Title → name → story slideshow → paddock → escape paddock.
2. In the overworld, walk north-west to the bench south of the
   Restrooms; then west to the Ferris Wheel area to fire the
   "operator's booth is empty" discovery message; then back to the
   bench and **D**ig under it to wake Tito. Tito walks south, west,
   and north to the operator booth.
3. With the wheel turning, walk west along the central path and
   then north into the area immediately south of the Ferris Wheel
   building. The camera swaps to the endgame view and a short
   action message explains the bark-when-at-bottom rule.
4. Watch the spotlit gondola circle the wheel. The yellow ground
   glow brightens whenever the family is in the bark window.
   - Press **B** while the family is at the top → "the wheel is
     too noisy up there." After 2 and 3 misses the message gets
     more pointed.
   - Press **S** / **T** / **D** → flavor messages, no progress.
   - Press **B** while the family is at the bottom → wheel eases
     to a stop, kid steps out, family follows, "PUPNAME!!!"
     bubble, pup runs and leaps into the kid's arms.
5. After the celebrate phase the screen fades to white and lands on
   the "THE END" card with the pup name. The card holds; reload to
   restart.
