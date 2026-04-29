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

## Prompts

### Prompt 2

> this is a good start, but we need:
>
> 1. more of an explanation of why Tito is on the bench when we first
>    see him after leaving the Paddock. The player doesn't know the
>    story at that point. Let's keep the bench empty until player
>    visits the Ferris wheel and discovers that the operator is missing.
> 2. The player's first message upon finding Tito is that "Bark and
>    bite haven't worked." This is before the player actually tests
>    those actions.

## Response — Discovery gating + honest HUD

Two changes, both narrative-fidelity fixes rather than mechanics
changes. The puzzle solution is unchanged: dig the dust patch under
the bench. What changes is *when* the bench has anyone on it and
*what* the HUD claims the player has tried.

### What changed in `sketch.js`

1. **New state**:

   ```js
   let operatorMissingDiscovered = false;
   let titoBarkTried = false;
   let titoBiteTried = false;
   ```

   `operatorMissingDiscovered` gates Tito's appearance on the bench;
   the two `tried` flags let the HUD nudge reference only the verbs
   the player has actually used.

2. **`checkOperatorDiscovery()`**, called every frame from `updateMap()`.
   Proximity check: when the pup gets within `OPERATOR_DISCOVERY_RADIUS`
   (96 px) of the empty operator booth, fire a one-shot action message:

   > "The Ferris Wheel sits unmoving. The operator's booth is empty —
   > and somewhere up at the top of the wheel, the family is stuck.
   > Wherever the operator went, the wheel can't run without him.
   > {pup} had better find him."

   That gives the player a story-anchored reason to go looking for an
   operator on a bench, which is the question the original Prompt 1
   implementation didn't answer.

3. **Conditional Tito rendering**. In `drawMap()`'s entity layer, the
   sleeping Tito sprite is only pushed when
   `operatorMissingDiscovered === true` (or when he's already past the
   `asleep` state). The bench is still drawn always — it's a real
   piece of fair furniture — but it sits empty before discovery. The
   snore-z particles are gated the same way.

4. **Verb gating at the bench**. `doOverworldBark`, `doOverworldBite`,
   and `doOverworldDig` now require `operatorMissingDiscovered` before
   their bench-specific overrides fire. Pre-discovery, all three fall
   through to their normal global behaviors (echo, air, dirt-spray /
   food-find). This avoids the contradiction where the player could
   "wake an invisible person."

5. **`titoBarkTried` / `titoBiteTried`** are set true the first time
   each verb's bench override runs.

6. **HUD bench nudge** in `drawMapHUD()` now branches on the tried
   flags. Priority order:

   - both tried → "Bark and bite haven't done much. What else could
     {pup} try?"
   - only bark → "Barking didn't do it. What else could {pup} try?"
   - only bite → "Biting didn't do it. What else could {pup} try?"
   - neither → "A man in an operator's vest is fast asleep on the
     bench. What does {pup} do?"

   The nudge also no longer fires before discovery — there's nothing
   to nudge about yet.

7. **Sniff tail at the restroom breadcrumb** is now also gated on
   discovery. Pre-discovery, sniffing at the bench (or anywhere in
   the breadcrumb's HOT zone) returns the operator-smell message
   without naming or locating a person. Once the booth has been
   found, the tail names where Tito currently is (asleep on the
   bench / hurrying west / in the booth). This means the breadcrumb
   still gets sniffed as an early step of Puzzle 4 without leaking
   "go find a sleeping man" before the player has any reason to
   look for one.

### Updated test recipe

1. Title → name → story → paddock → escape paddock.
2. Walk to the bench south of the Restrooms *first*. Bench is empty.
   Bark / bite / dig all return their normal global flavor. Sniff
   returns the restroom HOT message but with no tail naming a
   person.
3. Walk west along the central path or down through the rides until
   the pup is within ~96 px of the operator booth east of the Ferris
   Wheel. The discovery message fires once.
4. Walk back to the bench. Tito is now snoring on it.
   - **S** — the sniff tail now reads "The man on the bench. He's
     out cold."
   - **B** — bark; HUD nudge afterward reads "Barking didn't do it…"
   - **T** — bite; HUD nudge afterward reads "Bark and bite haven't
     done much…"
   - **D** — solves the puzzle as before.
