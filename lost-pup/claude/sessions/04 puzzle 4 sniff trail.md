# Session 04 — Puzzle 4: The Scent Trail (Sniff)

This session implements **Puzzle 4** from `claude/puzzles.md`: the
overworld Sniff Trail. After this session the pup, on entering the
overworld, can use Sniff / Bark / Bite / Dig from the keyboard, and Sniff
returns one of four band readings (HOT / WARM / COOL / COLD) depending
on the tile. Sniffing on each of the four "HOT" breadcrumb tiles in any
order eventually fires a one-shot recap message that confirms the
destination is the Ferris Wheel.

The session also gives the overworld the same bottom-of-screen message
bubble + action-key legend that the paddock has, so the verb feedback
has a place to live.

## Prompts

### Prompt 1

> The purpose and basic design of the game we are building is described
> in LostPup.md. You will do all of your work in the claude/ folder.
> Please put the output in claude/ as you make changes.
>
> The puzzles for this RPG are described in claude/puzzles.md. In this
> session, I want to implement puzzle #4, the overworld "sniff to locate
> family" puzzle. We will be updating claude/src/sketch.js to run in the
> P5.js editor.

## Response — Sniff Trail implementation

### What changed in `sketch.js`

All edits are inside the existing file; no new files were added.

1. **New state at the top of the file** (alongside the other overworld
   constants). The four breadcrumb tile coordinates come straight from
   the puzzles doc:

   ```js
   const SCENT_BREADCRUMBS = [
     { id: "spawn",    tile: [33, 10] },
     { id: "restroom", tile: [17,  6] },
     { id: "picnic",   tile: [24,  3] },
     { id: "ferris",   tile: [ 8, 14] },
   ];
   const HOT_RADIUS_TILES = 3;
   let scentsFound  = new Set();
   let trailComplete = false;
   let recapShown   = false;
   ```

   `HOT_RADIUS_TILES = 3` is a deliberate choice. The "picnic" and
   "ferris" breadcrumbs land on tiles that are *inside* their landmark
   bounding boxes, which the pup cannot stand on (landmarks block
   movement). A 3-tile sniff radius lets the pup pick up those scents
   from the closest reachable tile without forcing pixel-precise
   positioning. It also matches the fiction — a dog sniffs "near" a
   thing, not on top of it.

2. **`nearestBreadcrumb()` and `scentBandHere()`** classify the pup's
   current tile into one of four bands:

   - **HOT**: within `HOT_RADIUS_TILES` of any breadcrumb. Returns the
     crumb id so the sniff handler can emit the right message and add
     it to `scentsFound`.
   - **WARM**: within ~4 tiles of a food-stall landmark (Corn Dog,
     Funnel Cakes, BBQ Pit). Reuses the existing `landmarks` list
     instead of duplicating coordinates.
   - **COOL**: on the central horizontal path (rows 18–19) or the
     central vertical path (cols 19–20).
   - **COLD**: anywhere else (open grass, far corners, behind the
     Main Stage).

   This is the "every tile gets a scent reading" rule from the
   puzzles doc, expressed as a small zone classifier rather than a
   per-tile lookup table — fewer lines, and the world stays
   responsive without any per-tile content authoring.

3. **`hotMessageFor(crumbId)`** returns the puzzle-specific HOT
   text for each breadcrumb. The text follows the doc's flavor list
   (kid-sized sneakers at spawn, popcorn + lever metal behind the
   Restrooms, lotion + funnel cake at the Picnic blanket, climbed-in
   smell at the Ferris Wheel base).

4. **`doOverworldSniff()`**:
   - Resolves the band, picks the right message.
   - On HOT, adds the crumb id to `scentsFound`. Idempotent — sniffing
     the same crumb twice doesn't double-count.
   - When `scentsFound.size` first reaches 4 it appends the recap
     sentence ("the trail is unmistakable. THEY'RE AT THE FERRIS
     WHEEL.") to the same sniff message and sets
     `recapShown = trailComplete = true`. That way the player gets
     both the breadcrumb's flavor text *and* the conclusion in the
     same beat — no out-of-band toast — and the recap fires exactly
     once.

5. **`doOverworldBark / Bite / Dig`** — each one prints a short
   global flavor message exactly as specified in the cross-puzzle
   action matrix in the design doc. These three verbs are
   deliberately useless on the open map. Their job for now is to
   *not* trivialize sniffing and to leave room for puzzles 1–3 to
   give them real work in specific locations later.

6. **`updateMap()`** now ticks down `actionMessageTimer` so messages
   actually fade. Previously the overworld didn't have any messages
   so the timer didn't need to decrement.

7. **`keyPressed()`** got a new `STATE_MAP` branch that routes
   `D / B / S / T` to the four overworld handlers, mirroring the
   existing paddock branch.

8. **`drawMapHUD()`** was rewritten to look like the paddock HUD:
   - Top bar still shows the title and pup name on the left.
   - Top bar **right side** now shows live trail progress —
     `Trail: 2 / 4` while exploring, `Trail: complete` once all four
     are found. This is the only persistent UI signal that the
     player is making progress on a puzzle that has no visible
     world-state changes.
   - **New bottom message bubble** identical in size and styling to
     the paddock's, including the four `D / B / S / T` key hints.
     If a recent action message is active it shows; otherwise a
     state-aware default tells the player what to do next ("Sniff
     the air to pick up the family's trail" → "caught X of 4 scents
     so far" → "head west to the Ferris Wheel").

### Things deliberately *not* added in this session

- **No visual decals at sniffed breadcrumb tiles.** The doc doesn't
  ask for them, and adding glowing-paw-print sprites would skip past
  the discovery beat the trail counter is meant to deliver.
- **No patrol NPCs (Chief, Animal Control).** Those belong to
  Puzzles 1 and 2; adding their patrol/sight-cone system here would
  be premature.
- **No path-clearing logic** beyond letting the pup walk freely
  among the landmarks. The pup can already wander up to the Ferris
  Wheel area; the patrols that *should* block that path will be
  introduced later. For this session, exploration is unimpeded so
  the player can actually reach all four breadcrumbs.

### How to test

Paste the updated `claude/src/sketch.js` into the p5.js web editor
and play through:

1. Title → name the pup → story slideshow → paddock.
2. Solve the paddock as before (bite the latch, walk south).
3. In the overworld: pressing **S** at the spawn point should emit
   the spawn HOT message and bump the trail counter to `1 / 4`.
4. Walking onto any food row tile and pressing **S** gives WARM.
5. Walking onto a path tile gives COOL. Walking into a far corner
   gives COLD. Bark / Bite / Dig anywhere give short flavor lines.
6. Visit the three remaining breadcrumb spots (just south of the
   Restrooms; just outside the Picnic Area; just south of the
   Ferris Wheel) and sniff at each. On the fourth, the message
   appends the recap line and the top bar flips to
   `Trail: complete`. The bottom bubble's idle message becomes
   "head west to the Ferris Wheel."
