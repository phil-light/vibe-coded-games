# Session 09 — Puzzle 2: The Tied Trash Bag (BITE)

This session implements **Puzzle 2** from `claude/puzzles.md`: the
overstuffed wood-slat trash can on the south edge of the Picnic Area.
Bite the tied bag and a fragrant pile of funnel cake, hot dog ends,
and pickle spills across the corridor below. Chief Withers — patrolling
east-west on the path immediately south of the Picnic / Restrooms —
catches a whiff, BELLOWS about the BBQ vendor, and stomps off toward
the BBQ Pit. His sight cone never returns, so the corridor north of
the rides opens up.

This session also tightens the endgame gate to require P1 OR P2 done,
per the puzzle dependency chart, and ships the matching session-prompt
edit to `puzzles.md` clarifying where the Chief actually patrols.

## Prompts

### Prompt 1

> We will continue to work on Lost Pup, described in LostPup.md. You
> will work in the claude/ directory. I would like to work on the
> following:
>
> * In puzzle 2, the Chief's central patrol path seems to overlap the
>   food court, not the walkable area in between the ferris wheel and
>   the Ferris wheel. Let's get him to patrol the area where the
>   player needs to go to to complete the other challenges. Please
>   commit that fix separately from the next step.
> * Make an implementation of Puzzle 2, described in
>   claude/puzzles.md. Your output will be to update
>   claude/src/sketch.js.
>
> Don't worry about creating the session log yet; we will do that
> when it's time to commit.

### Prompt 2

> let's write the session log and commit this, thank you

## Response — `puzzles.md` clarification (commit 1, separate)

The original design overview said Chief Withers "patrols the central
east-west path between the Tilt-A-Whirl and Bumper Cars." That phrase
read as the corridor south of the rides — the one that borders the
food row — which clashed with Puzzle 2's specific geography ("trash
spilling from the Picnic Area's south edge onto the path immediately
below"). The Picnic Area is at tile rows 2–4; the path "immediately
below" it is the corridor at y≈5–9, north of the rides, not the
y≈15–19 corridor next to the food court.

Edit replaces those three lines with a longer paragraph saying
explicitly that the Chief patrols the corridor north of the rides
(between the upper landmarks — Picnic Area, Restrooms — and Tilt-A-
Whirl / Bumper Cars), notes that this is the natural west-bound route
the pup takes from spawn, and clarifies that the central corridor
south of the rides is Animal Control's beat. Committed on its own so
the design fix is reviewable without the gameplay diff.

## Response — Puzzle 2 implementation (commit 2)

All edits live in the existing `claude/src/sketch.js`; no new source
files were added. The puzzle is one self-contained block of state,
update / draw helpers, and verb hooks, matching the Puzzle 1 / Puzzle
3 / Puzzle 5 pattern already in the file.

### What changed in `sketch.js`

1. **New state block** at the top of the file, replacing the
   pre-existing `let chiefDistracted = false;` stub:

   ```js
   const PICNIC_BLANKET_TILE   = [23, 4];
   const PICNIC_BLANKET_PX     = (PICNIC_BLANKET_TILE[0] + 0.5) * TILE;
   const PICNIC_BLANKET_PY     = (PICNIC_BLANKET_TILE[1] + 0.5) * TILE;
   const PICNIC_BLANKET_REACH  = 32;
   const TRASH_CAN_TILE        = [25, 4];
   const TRASH_CAN_PX          = (TRASH_CAN_TILE[0] + 0.5) * TILE;
   const TRASH_CAN_PY          = (TRASH_CAN_TILE[1] + 1.0) * TILE;
   const TRASH_REACH           = 36;

   const CHIEF_PATROL_LEFT     = 13 * TILE;
   const CHIEF_PATROL_RIGHT    = 28 * TILE;
   const CHIEF_PATROL_Y        =  8 * TILE;
   const CHIEF_SPEED           = 0.55;
   const CHIEF_STOMP_SPEED     = 1.3;
   const CHIEF_SIGHT_RADIUS    = 90;
   const CHIEF_SIGHT_HALF_ANGLE = Math.PI / 3;
   const CHIEF_STOMP_WAYPOINTS = [
     [20.5, 18.5],   // gap between Tilt-A-Whirl and Bumper Cars
     [15.0, 18.5],   // central corridor, west toward BBQ
     [15.0, 19.0],   // arrive just north of BBQ Pit
   ];

   let chiefDistracted = false;
   let trashSpilled    = false;
   let chiefState      = "patrol";   // "patrol" | "stomping" | "atBBQ"
   let chiefX          = (CHIEF_PATROL_LEFT + CHIEF_PATROL_RIGHT) / 2;
   let chiefY          = CHIEF_PATROL_Y;
   let chiefDir        = 1;
   let chiefT          = 0;
   let chiefWaypoint   = 0;
   let trashSniffed    = false;
   let trashBarkTried  = false;
   let trashDigTried   = false;
   ```

   The blanket tile is shifted from the breadcrumb tile (24, 3) down
   one row to (23, 4) so the landmark's "Picnic Area" label stays
   visible above the rendered blanket. The blanket is still well
   inside the breadcrumb's HOT radius for Puzzle 4 sniffing.

2. **One new update function** wired into `updateMap()`:

   - **`updateChief()`** — three-state machine.
     - `patrol`: paces east-west between `CHIEF_PATROL_LEFT` and
       `CHIEF_PATROL_RIGHT` along `CHIEF_PATROL_Y` at `CHIEF_SPEED`.
       Each frame `pupInChiefSightCone()` runs the same ±60° forward
       fan / 90 px radius check Animal Control already uses; a hit
       triggers `returnToPaddock` with a Chief-flavored line about
       fining the family.
     - `stomping`: walks the three `CHIEF_STOMP_WAYPOINTS` in order
       at `CHIEF_STOMP_SPEED`. The waypoints route through the gap
       between Tilt-A-Whirl and Bumper Cars and along the central
       corridor — same trick Tito uses to walk to the booth without
       crossing the ride buildings. After the third waypoint flips
       to `atBBQ`.
     - `atBBQ`: no-op. Chief is drawn standing just north of the
       BBQ Pit with a small "!!" emote.

3. **`triggerChiefDistraction()`** — single transition function
   called only from the bite-at-trash-can handler. Sets
   `trashSpilled = true`, `chiefDistracted = true`,
   `chiefState = "stomping"`. Same pattern as `triggerGoatRelease()`.

4. **New visual helpers**:

   - **`drawChief(x, y, walking, yelling)`** — administrator
     silhouette: navy blazer with darker lapels, white shirt strip,
     red tie, gray slacks, dress shoes, comb-over (gray) hair on a
     balding crown, rimmed glasses, neat mustache, clipboard tucked
     under the right arm. Mirrored via `scale(-1, 1)` when
     `chiefDir < 0`. The `yelling` flag adds a bobbing red "!!"
     emote above the head while stomping or atBBQ. Deliberately
     distinct from Animal Control's khaki-uniform-and-peaked-cap
     look so the player can tell the two patrols apart from across
     the screen.
   - **`drawChiefSightCone()`** — same translucent-fan geometry as
     AC's, in a warmer hue (255, 180, 140) so the two cones read as
     visually distinct. Hidden the moment `chiefState !== "patrol"`.
   - **`drawPicnicDecorations()`** — checked blanket, juice box with
     a bendy straw, paper plate with a half-eaten funnel cake (lattice
     pattern + powdered-sugar dusting), the trash can on the south
     edge, and the spill (after the bite solve). Drawn between the
     landmark loop and the entity layer.
   - **`drawTrashCan(x, y)`** — wood-slat barrel with iron hoops.
     Pre-solve: a tied black bag bulges up out of the rim with a
     crinkle highlight, a twist on top, and a small wavy stink-line
     drifting up so the player gets the "this is fragrant" hint
     visually too. Post-solve: bag torn open, dark interior visible,
     tatters around the rim.
   - **`drawTrashSpill(canX, canY)`** — static decoration drawn
     once `trashSpilled` flips. Stained dirt patch with a hot dog
     bun, hot dog, pickle slice, funnel cake fragments, crumpled
     napkin, nibbled apple core, and three flies circling on a
     `frameCount`-driven phase.

5. **Y-sorted entity layer** in `drawMap()` now also includes the
   Chief, drawn with both `walking` (true while patrolling or
   stomping) and `yelling` (true while stomping or atBBQ).

6. **Verb hooks** — proximity-checked with `pupNearTrashCan()` (pixel
   distance < 36 from the bag-tie target), `pupAtPicnicBlanket()`
   (pixel distance < 32 from the blanket), and `pupAtPicnicSouthEdge()`
   (the strip immediately south of the Picnic Area landmark, used so
   the bark/dig flavor and HUD nudge fire even when the player isn't
   pressed up against the can or the blanket specifically):

   - **Bite** — at the trash can (`!trashSpilled`) calls
     `triggerChiefDistraction()` and emits the long solve message
     (the bag tearing, the bellow about the BBQ vendor, the stomp).
     At the blanket: rumples it, no effect. The trash branch sits
     before the existing nearest-person bite so the pup can never
     accidentally chomp a stranger when reaching for the bag.
   - **Sniff** — at the trash can: pre-solve gives the "Chief
     Withers will never be able to walk past this" hint; post-solve
     the ripe-trash flavor with a callback to the Chief still
     yelling. Inserted *before* the HOT branch so the trash-specific
     line wins over the picnic breadcrumb when the pup is right at
     the can. Sniffing the blanket itself still falls through to the
     existing picnic HOT breadcrumb message — no change there.
   - **Bark** — anywhere at the picnic / trash can / south edge:
     pigeons explode off the tables, no mechanical effect.
   - **Dig** — at the blanket / south edge: shallow hole, indignant
     squirrel chitters down, no buried prize.

7. **Bottom-bubble HUD** in `drawMapHUD()` got three new branches,
   sitting just below the Petting-Zoo nudge in the priority ladder:

   - **Picnic / trash nudge** — fires when the pup is at the
     blanket / trash can / picnic south edge and the bag is still
     tied. Names the wrong verbs the player has actually tried
     (mirroring the Tito-bench and Petting-Zoo patterns), so the
     hint reads "Barking didn't spill it — what would actually tear
     it open?" only after they've genuinely tried bark.
   - **Both patrols clear** — `chiefDistracted && goatLoose`:
     "Animal Control is chasing the goat across the south. Chief
     Withers is over at the BBQ Pit. Both corridors west are clear."
   - **Chief alone clear** — `chiefDistracted` only: "Chief Withers
     is over at the BBQ Pit, yelling about the spill. The corridor
     north of the rides is clear."

   The pre-existing `goatLoose` status stays where it was as the
   AC-only clear case, immediately below.

8. **Endgame gate tightened**. The Puzzle-1 session deliberately
   left the entry as `wheelTurning && pupAtFerrisBase()` because
   the Chief didn't exist yet. Now both patrols are real, so the
   gate becomes:

   ```js
   if (!endgameEntered && wheelTurning &&
       (goatLoose || chiefDistracted) && pupAtFerrisBase()) {
     enterFerrisEndgame();
   }
   ```

   This matches the puzzle dependency chart's "need at least ONE
   of P1 or P2 done to safely cross to the west side." If the
   player physically sneaked past the patrols without solving
   either, walking into the Ferris base does nothing — they have
   to retreat and clear one.

### Things deliberately *not* added in this session

- **No collision on the Chief or the trash can.** Both are
  passable, same as Tito, AC, the goat, the teen, and the rest of
  the crowd. The picnic landmark itself is still solid (built-in
  rectangle collision), so the pup approaches the trash can from
  the south as expected.
- **No new HUD message at the Ferris Wheel** if the player walks
  into the base before clearing a patrol. The gate just silently
  doesn't fire. Players who tried to walk west the obvious way
  will already have been bounced back to the paddock by either
  patrol, so the explanation is in their muscle memory.
- **No collision on the Chief's stomping path through the rides.**
  The waypoints route around them via the central corridor, so
  this isn't a bug, just a note: the path is hand-crafted, not
  general.
- **No persistence past STATE_END.** Reload resets every flag in
  this block, exactly like the rest of the game.
- **No audio.** Consistent with the prototype.

### How to test

Paste the updated `claude/src/sketch.js` into the p5.js web editor.

1. Title → name → story slideshow → paddock → escape paddock.
2. From the spawn south of the Horse Barn, walk west. Chief
   Withers is pacing the corridor between the Picnic Area /
   Restrooms and the rides; his orange sight cone fans east-west
   in front of him. Step into it and the pup is dumped back in
   the paddock with a "WHAT IS THIS! A LOOSE DOG!" line.
3. Detour south through the gap between Bumper Cars and the
   Petting Zoo (or between Tilt-A-Whirl and Bumper Cars), then
   back north to approach the Picnic Area from below.
4. With the pup adjacent to the family blanket:
   - Press **S** — sniff returns the existing picnic HOT
     breadcrumb (Mom's lotion, kid's funnel cake, Dad's BBQ-sauce
     shirt).
   - Press **T** — bite rumples the blanket, no effect.
   - Press **D** — squirrel chitters.
5. Move under the trash can on the south edge of the picnic:
   - Press **S** — "Chief Withers will never be able to walk past
     this if it ever got loose."
   - Press **B** — pigeons take off, bag still tied.
   - Press **T** — full solve message; the bag tears, the spill
     scatter is drawn south of the can, and Chief Withers begins
     stomping toward the BBQ Pit.
6. Watch the Chief route via the gap between Tilt-A-Whirl and
   Bumper Cars, then west along the central corridor to the BBQ
   Pit. Once he arrives he stands just north of it with a "!!"
   emote.
7. The HUD bottom-bubble updates. With only Puzzle 2 done it
   reads "Chief Withers is over at the BBQ Pit, yelling about the
   spill. The corridor north of the rides is clear." With both
   P1 and P2 done it reads "…both corridors west are clear."
8. With Tito woken (Puzzle 3) and at least P1 *or* P2 done, walk
   west and into the south face of the Ferris Wheel — the
   endgame triggers as before. With *only* Tito woken, walking
   into the Ferris base does nothing; the player has to clear
   one of the two patrols first.
