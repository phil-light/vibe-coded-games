# Session 08 — Puzzle 1: The Loose Goat (BARK)

This session implements **Puzzle 1** from `claude/puzzles.md`: the
grumpy black-and-white goat penned along the south face of the
Petting Zoo. Bark next to the cracked slat and the goat charges
through it, the bored attendant teen takes off after him, and the
Animal Control officer who'd been pacing the food-stall row wheels
around to give chase. AC's sight cone never points at the pup again
for the rest of the game, so the food-stall row opens up.

## Prompts

### Prompt 1

> We will continue to work on Lost Pup, described in LostPup.md. You
> will work in the claude/ directory. I would like to make an
> implementation of Puzzle 1, described in claude/puzzles.md. Your
> output will be to update claude/src/sketch.js. Don't worry about
> creating the session log yet; we will do that when it's time to
> commit.

## Response — Puzzle 1 implementation

All edits live in the existing `claude/src/sketch.js`; no new source
files were added. The puzzle is contained in a self-contained block
of state, update / draw helpers, and verb hooks.

### What changed in `sketch.js`

1. **New state block** (next to the Puzzle 5 endgame block at the top
   of the file). All Puzzle 1 state lives in plain module-level
   variables, matching the Puzzle 3 / Puzzle 5 pattern:

   ```js
   const CRACKED_SLAT_TILE     = [32, 15];
   const PETTING_ZOO_GATE_TILE = [34, 15];
   const GOAT_BARK_REACH       = 40;
   const GOAT_FENCE_REACH      = 28;
   const GOAT_PEN_X = (CRACKED_SLAT_TILE[0] + 0.5) * TILE;
   const GOAT_PEN_Y = (CRACKED_SLAT_TILE[1] - 1.0) * TILE;
   const GOAT_ESCAPE_FRAMES = 70;
   let goatLoose       = false;
   let goatState       = "penned"; // "penned" | "escaping" | "loose"
   let goatX, goatY, goatDir, goatT;
   let goatTargetX, goatTargetY, goatRepick;
   let goatEscapeFrame = 0;

   const AC_PATROL_LEFT  = 4 * TILE;
   const AC_PATROL_RIGHT = 17 * TILE;
   const AC_PATROL_Y     = 22 * TILE;
   const AC_SPEED        = 0.65;
   const AC_CHASE_SPEED  = 1.1;
   const AC_SIGHT_RADIUS = 90;
   const AC_SIGHT_HALF_ANGLE = PI / 3;     // ±60° forward fan
   let acState     = "patrol"; // "patrol" | "chasingGoat"
   let acX, acY, acPatrolDir = 1, acT = 0;

   let teenState = "bored"; // "bored" | "running"
   let teenX, teenY, teenDir, teenT;

   let goatBarkTried = false;
   let goatBiteTried = false;
   let goatDigTried  = false;
   ```

   The pre-existing `goatLoose` / `chiefDistracted` Puzzle-5 stubs
   were simplified — `goatLoose` is now real state owned by this
   puzzle, and only `chiefDistracted` remains as a Puzzle-2 stub.

2. **Three update functions** wired into `updateMap()`:

   - **`updateGoat()`** — small state machine.
     - `penned` is a no-op (he's drawn idling, with an occasional
       headbutt-lunge in the renderer).
     - `escaping` plays a 70-frame squeeze-through animation: goat
       creeps south through the splintered slat, then breaks south
       into the open fairground. On completion, flips to `loose` and
       sets `goatLoose = true`.
     - `loose` picks random roaming targets in the south corridor
       (tiles x∈[4,36], y∈[20,28]) and trots between them at 1.5
       px/frame. Chosen so the goat never wanders far enough north to
       cross back into the central path — visually staying out of the
       pup's way.

   - **`updateAnimalControl()`** — paces east-west between
     `AC_PATROL_LEFT` and `AC_PATROL_RIGHT` along `AC_PATROL_Y` at
     `AC_SPEED` px/frame. Each frame it calls `pupInACSightCone()`,
     which returns true when the pup is within 90 px AND inside the
     ±60° forward fan in AC's walking direction. A hit triggers
     `returnToPaddock("HEY! NO LOOSE DOGS!...")`. Once `acState`
     flips to `chasingGoat`, this function abandons the patrol and
     pursues the loose goat at `AC_CHASE_SPEED`; the sight-cone test
     never runs again.

   - **`updateTeen()`** — no-op while `bored`. Once `running`, the
     teen runs toward the goat at 0.75 px/frame. Pure flavor.

3. **`triggerGoatRelease()`** — single transition function, called
   only from the bark-near-cracked-slat handler. Flips
   `goatState → escaping`, `acState → chasingGoat`,
   `teenState → running`. Keeping the transition in one place means
   the bark handler can short-circuit immediately after calling it,
   and the renderer logic stays consistent.

4. **New visual helpers**:

   - **`drawPettingZooSouthFence()`** — overlays a 12-slat fence on
     the south edge of the Petting Zoo landmark. The slat closest to
     `CRACKED_SLAT_PX` is drawn cracked (zigzag detail), and the two
     slats nearest the gate centerline are skipped to make the gate
     gap. The cracked slat is omitted entirely once `goatLoose` is
     true, with a couple of rotated splinter rectangles drawn in the
     gap.
   - **`drawGoat(x, y, sc, dir, isMoving, headbutt)`** — side-view
     goat sprite. Drawn facing left by default; for `dir === 2` the
     sprite is mirrored with p5's `scale(-1, 1)`. The `headbutt`
     parameter slides the head down 4 px on its current frame for
     the in-pen lunge animation. Used both in the pen and once he's
     loose.
   - **`drawAnimalControl(x, y, walking)`** — khaki uniform shirt and
     pants, peaked cap with badge, badge on the chest, and a
     clipboard tucked under the right arm. The silhouette is
     deliberately distinct from the crowd so the player can spot AC
     from across the map.
   - **`drawACSightCone()`** — translucent yellow fan in front of AC,
     drawn under the entity layer. Pulses-free (no anim) but goes
     away the instant `acState !== "patrol"`. Telegraphs the soft-
     fail zone without spelling out the rule.
   - **`drawAttendantTeen(x, y, dir)`** — bright tank top, ponytail.
     While bored she leans (small rotation) and is drawn with a phone
     in front and a pale blue glow on her face. While running, she's
     a normal walking sprite — no phone, no lean.

5. **Y-sorted entity layer** in `drawMap()` now also includes the AC
   officer, the attendant teen, and the loose / escaping goat. The
   penned goat is drawn before the fence (so the slats appear in
   front of him) and is therefore not in the entity layer; once he
   transitions to `escaping` he joins the layer with his foot Y.

6. **Verb hooks** — proximity-checked with `pupNearCrackedSlat()`
   (pixel distance < 40 from the bark target) and
   `pupAtPettingZooSouthFence()` (the dirt margin immediately south
   of the south fence):

   - **Bark** — at the cracked slat (`goatState === "penned"`) calls
     `triggerGoatRelease()` and emits the long solve message.
     Anywhere else along the south fence: "the rabbits skitter and
     the chickens flap…the goat doesn't even look up." Both branches
     short-circuit *before* the existing crowd-bark logic so the
     pup never accidentally summons Animal Control on the goat.
   - **Bite** — at the south fence: "tastes like splinters and
     disappointment." Fence is too thick to bite through; this is
     not a backdoor solve.
   - **Dig** — at the south fence: uncovers buried kid-sized
     carrots. Cute, no effect.
   - **Sniff** — at the south fence (pre-solve only): "Goat. Hay.
     An old apple core. The black-and-white one over there smells
     like he's been waiting all day for an excuse." Inserted *after*
     the breadcrumb HOT branch and *before* the per-person flavor /
     band-reading fallback, so it always wins when the player is
     standing at the right spot.

   The bark solve is gated on `goatState === "penned"` rather than
   `!goatLoose` so a second bark during the 70-frame squeeze-through
   doesn't re-fire the solve message.

7. **Bottom-bubble HUD** in `drawMapHUD()` got two new branches:

   - **Petting-zoo nudge** — fires when the pup is on the south
     fence and the goat is still penned. Names whichever wrong verbs
     the player has actually tried (mirroring the Tito-bench
     pattern), so the message is "Biting and digging didn't help —
     what would actually get him to charge?" only after they've
     genuinely tried both.
   - **Post-release status** — once `goatState === "loose"`, the HUD
     reads "Animal Control is across the south of the map chasing
     the loose goat. The food-stall row is clear." The message
     confirms the puzzle had an effect.

   Both branches sit *below* the Tito-related ones in the priority
   ladder, so a player mid-Puzzle-3 doesn't lose the wake-up nudge
   to a Petting-Zoo flavor line.

### Things deliberately *not* added in this session

- **No tighter endgame gate.** The Puzzle-5 entry still only checks
  `wheelTurning`. The full design gate is
  `wheelTurning && (goatLoose || chiefDistracted)`, but Chief
  doesn't exist yet, so the central east-west path is already clear
  without P1. Forcing P1 before endgame would impose an order that
  contradicts the "P1 and P2 are siblings" design. The gate gets
  tightened in the Puzzle-2 session.
- **No Chief patrol.** That's Puzzle 2.
- **No collision on AC, teen, or goat.** All three are passable, the
  same as Tito and the crowd. Keeps the pup from getting wedged
  against a moving sprite in the food-stall row.
- **No persistence past STATE_END.** Reload resets every flag in
  this block, exactly like the rest of the game.
- **No audio.** Consistent with the prototype.

### How to test

Paste the updated `claude/src/sketch.js` into the p5.js web editor.

1. Title → name → story slideshow → paddock → escape paddock.
2. From the spawn south of the Horse Barn, walk south past the
   Petting Zoo's east edge (or west, around the building) until the
   pup is on the dirt margin south of the Petting Zoo. The goat is
   visible behind the slatted fence; one slat near the goat shows a
   zigzag crack. The bored attendant teen is at the gate. South of
   the screen, the AC officer is pacing the food-stall row with a
   visible yellow sight cone.
3. With the pup adjacent to the south fence:
   - Press **S** — sniff returns the goat-flavor message.
   - Press **T** — bite returns the splinter message.
   - Press **D** — dig returns the buried-carrots message.
   - Press **B** anywhere along the fence *except* the cracked slat
     — "rabbits skitter, chickens flap…goat doesn't look up."
   - Move within ~40 px of the cracked slat and press **B** — full
     solve message; the goat pushes through, the slat is gone, the
     teen and AC start their chase animations.
4. Walk south into the food-stall row.
   - **Pre-solve**: stepping into AC's sight cone triggers
     "HEY! NO LOOSE DOGS!" and the pup is dumped back in the
     paddock. State persists; walk south through the gate again to
     return to the overworld.
   - **Post-solve**: AC is no longer on the row — he's tailing the
     goat back-and-forth across the south of the map. The food row
     is safe to cross.
5. The HUD bottom-bubble updates: "Animal Control is across the
   south of the map chasing the loose goat. The food-stall row is
   clear."
