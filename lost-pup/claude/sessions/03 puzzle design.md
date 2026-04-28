# Session 03 — Puzzle Design

This session is a design-only pass. No game code was changed. The deliverable
is `claude/puzzles.md`, which future sessions will draw from to implement one
puzzle at a time.

## Prompts

### Prompt 1

> The purpose and basic design of the game we are building is described in
> lost LostPup.md. You will do all of your work in the claude/ folder. Please
> put the output in claude/ as you make changes.
>
> In this session, we will be writing a series of puzzles for the player to
> perform. The level of complexity may be similar to the "escape the paddock"
> sequence we already created. In each puzzle, the game should take into
> account what happens when the player tries bite, bark, dig, and sniff in
> different locations. We will want to design puzzles that collectively use
> each of the different abilities to solve.
>
> Let's avoid making an inventory for the dog, in the interest of simplicity
> (and theme, dogs don't typically use items or carry a backpack.) The player
> can change the state of the world to solve puzzles, but doesn't carry
> anything around.
>
> The finished product for this session will be a new file
> "claude/puzzles.md" which will contain the information we will use for
> future sessions. I want to be able to start a new session which is intended
> to add each puzzle one at a time to the playable game. Put each puzzle in
> its own section with a header in the markdown.
>
> Finally, the challenges for the player should end in the player reuniting
> with their family. Designing puzzles which may be solved in different
> orders is desireable. It is good to think about how these puzzles depend on
> one another with a chart, as described in
> https://grumpygamer.com/puzzle_dependency_charts/

## Response — Puzzle design document

I read `LostPup.md`, the two prior session logs, and the overworld layout in
`sketch.js` (landmark coordinates from `buildLandmarks()` and the pup's
post-paddock spawn at tile `(33, 9.5)` south of the Horse Barn). The puzzle
design is anchored to those real positions and to the existing
`B / T / S / D` key bindings from session 02.

The output is a single new file: `claude/puzzles.md`.

### Story frame established for the puzzles

- The family is stuck near the top of a stopped Ferris Wheel.
- The wheel stopped because the operator (**Tito**) bolted during the cow
  chaos and the safety brake locked it.
- The **Chief of Operations** patrols the central east-west path; one
  **Animal Control** officer patrols the food-stall row to the south. Both
  do soft-fail teleports back to the Horse Barn — no game over.
- Tito is asleep on a bench behind the Restrooms, reachable from spawn
  without crossing any patrol.

### Puzzle set

Four ability-anchored puzzles plus a timed endgame.

| #   | Puzzle               | Verb that solves it | Location                |
|-----|----------------------|---------------------|-------------------------|
| P1  | The Loose Goat       | BARK                | Petting Zoo south fence |
| P2  | The Tied Trash Bag   | BITE                | Picnic Area trash can   |
| P3  | Wake Up Tito         | DIG                 | Bench behind Restrooms  |
| P4  | The Scent Trail      | SNIFF               | Distributed (4 tiles)   |
| End | Reunion at the Wheel | BARK (timed)        | Ferris Wheel base       |

### Order independence (the dependency chart)

- P1, P2, P3 are siblings — solvable in any order.
- P1 and P2 are *alternatives* for clearing the cross-map patrols. Solving
  either is enough; solving both is fine. This is the "different orderings"
  the prompt asked for.
- P3 is independent of P1/P2 for being *solved* (Tito's bench is reachable
  without crossing any patrol), but its *effect* — a moving wheel — is only
  useful once a path west is clear.
- P4 runs in parallel with everything else; sniffing the four breadcrumbs
  fires a single recap line that names the Ferris Wheel as the destination.
- The endgame requires `(P1 ∨ P2)` AND `P3`, then a timed bark at the
  bottom arc of the Ferris Wheel.

The full chart is reproduced as ASCII in `puzzles.md`.

### No-inventory commitment

Every puzzle changes world state — never gives the pup an item to carry:

- P1: a fence slat is broken, the goat is now a free-running sprite.
- P2: the trash bag is open, a permanent spill decoration is on the path.
- P3: Tito is no longer on the bench; he's at the Ferris Wheel booth and
  the wheel is turning.
- P4: a `scentsFound` set + a one-shot recap message; nothing physical.
- Endgame: `reunited = true` triggers the closing cutscene.

### Verb design vocabulary

Every puzzle location defines all four verbs, not just the solving one.
The non-solving three are flavor / hints / experimentation reward — the
same pattern the paddock already uses (sniff = list of smells, bark =
animals jump, dig = wire-netting hint, bite = the actual solve).

`puzzles.md` includes a **cross-puzzle action matrix** so future sessions
keep verb behavior consistent: rows are puzzle locations, columns are
verbs, cells are the effect.

The global rule for unmarked overworld tiles: **sniff returns a
HOT/WARM/COOL/COLD band reading; the other three verbs return a short
flavor message.** This keeps the world responsive without per-tile
content.

### Suggested implementation order

Documented at the bottom of `puzzles.md`:

1. **P4 (Sniff Trail)** first — it's mostly a global rule plus four
   breadcrumb tiles, and it puts the verb infrastructure in place.
2. **P3 (Tito)** — self-contained, near spawn, no patrol logic needed.
3. **P1 (Goat)** — introduces the Animal Control patrol + sight-cone +
   chase-and-teleport-back system.
4. **P2 (Trash)** — reuses the patrol system for the Chief.
5. **Endgame** — visible Ferris Wheel, timed bark, reunion cutscene.

Each session leaves the game playable.

### Files

- **Added:** `claude/puzzles.md`
- **Unchanged:** `claude/src/sketch.js` (no code changes this session)
