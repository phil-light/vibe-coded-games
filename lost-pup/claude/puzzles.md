# Lost Pup — Puzzle Design

This document defines the post-paddock puzzles. The player escapes the small-animal
paddock (already implemented) and arrives in the overworld just south of the Horse
Barn at tile `(33, 9.5)`. From there the puzzles in this document carry the pup
across the fairgrounds and back to the family, who are stuck on the Ferris Wheel
(tile `(5, 10)`).

The intent is one new session per puzzle, in any order the user chooses. Each
section below is self-contained enough for that.

---

## Design overview

### What the player already has

Four verbs, mapped on the keyboard:

- `B` — **Bark**
- `T` — **Bite**
- `D` — **Dig**
- `S` — **Sniff**

There is intentionally **no inventory**. The pup never carries anything. Puzzles
change world state (a fence opens, a bag spills, a switch is uncovered, a person
is woken) — never "you now hold the X." This is both a simplicity win and on-theme.

### Story state at the start of the overworld

- The family is stuck near the top of the Ferris Wheel. The wheel stopped during
  the cow chaos because the operator (call him **Tito**) ran off in a panic and
  the safety brake locked the wheel in place.
- Tito is now napping on a bench outside the Restrooms, exhausted and ashamed.
  Until he comes back to the booth, the wheel will not move.
- The **Chief of Operations** patrols the central east-west path between the
  Tilt-A-Whirl and Bumper Cars. If the pup runs into his sight cone on an open
  path, he chases the pup back toward the Horse Barn (soft fail — no game over,
  just a teleport + dialog).
- One **Animal Control** officer patrols the southern row of food stalls (Corn
  Dog → Funnel Cakes → BBQ Pit). Same chase-back behavior in their sight cone.

So the pup cannot just walk west to the Ferris Wheel. It has to (a) clear at
least one of the patrolled paths, (b) get the wheel running again, and (c) get
the family's attention at the right moment.

### Verbs as design vocabulary

Every puzzle defines what *each* of the four verbs does in its location, even
when only one verb solves it. The other three are flavor: they reward
experimentation, give hints, and make the world feel like it's listening. This
matches the existing paddock design (sniff = inventory of smells, bark = jumpy
animals, dig = wire netting hint, bite = the actual solve).

**Sniff is the universal hint engine.** Every interactive object has unique
sniff text that nudges the player toward the right verb without giving the
solution. Players who are stuck should be trained to sniff first.

### Puzzle dependency chart

Following Ron Gilbert's puzzle-dependency-chart format
(<https://grumpygamer.com/puzzle_dependency_charts/>): an arrow from A → B
means A must be solved before B is solvable. Sibling boxes are independent and
can be solved in any order.

```
                        ┌─────────────────────────┐
                        │  Paddock escape (done)  │
                        └────────────┬────────────┘
                                     │
                                     v
                        ┌─────────────────────────┐
                        │  Pup arrives south of   │
                        │       Horse Barn        │
                        └────────────┬────────────┘
                                     │
                          ┌──────────┴──────────┐
                          │ Sniff Trail begins  │  (Puzzle 4 — runs throughout)
                          └──────────┬──────────┘
                                     │
              ┌──────────────────────┼──────────────────────┐
              │                      │                      │
              v                      v                      v
        ┌───────────┐          ┌───────────┐          ┌───────────┐
        │ Puzzle 1  │          │ Puzzle 2  │          │ Puzzle 3  │
        │ Loose Goat│          │ Trash Bag │          │  Wake Up  │
        │  (BARK)   │          │  (BITE)   │          │   Tito    │
        │ Petting Z.│          │  Picnic   │          │   (DIG)   │
        └─────┬─────┘          └─────┬─────┘          │ Restrooms │
              │                      │                └─────┬─────┘
              v                      v                      │
       Animal Control          Chief distracted             │
       chases the goat         by the food mess             │
              │                      │                      │
              └──────────┬───────────┘                      │
                         │                                  │
              (need at least ONE of P1 or P2 done           │
               to safely cross to the west side)            │
                         │                                  │
                         v                                  v
               ┌──────────────────┐                ┌─────────────────┐
               │ Reach Ferris     │                │ Tito returns to │
               │ Wheel area       │                │ Ferris Wheel    │
               │ unmolested       │                │ booth           │
               └────────┬─────────┘                └────────┬────────┘
                        │                                   │
                        └───────────────┬───────────────────┘
                                        │
                                        v
                            ┌────────────────────────┐
                            │  Endgame: Bark at the  │
                            │  family on the descent │
                            │   (BARK, timed)        │
                            └────────────┬───────────┘
                                         │
                                         v
                                ┌─────────────────┐
                                │   Reunion!      │
                                └─────────────────┘
```

Three useful properties of this graph:

1. **Puzzles 1, 2, 3 are siblings.** The player can attempt them in any order.
2. **Puzzles 1 and 2 are alternatives** for crossing the patrolled paths.
   Solving either is enough — solving both is fine, just unnecessary. This is
   the "different orderings" the prompt asks for.
3. **Puzzle 3 is independent of 1/2** for *being solved* (Tito is hiding behind
   the Restrooms which you can reach from the Horse Barn side without crossing
   any patrol). But its *effect* — a moving wheel — is only useful once you've
   cleared a path west. So the player can solve P3 first and then have to clear
   1 or 2, or solve 1/2 first and walk west and then come back for 3.

### Failure model

No game-over screen anywhere in the puzzle chain. If the pup is caught:

- By the **Chief** or an **Animal Control** officer: brief dialog ("Hey! No
  loose dogs!"), pup is teleported back to the Horse Barn entrance, all
  puzzle state preserved.
- By an angry **vendor** (Puzzle 2 if the player is sloppy): same.

Patrols only chase on the main paths, never inside landmark interiors or on
the dirt margins, so the pup can always slink around the long way to retry.

---

## Puzzle 1 — The Loose Goat (BARK)

**Location:** Petting Zoo, tile (30–35, 10–14). Use the south fence of the
Petting Zoo, facing the central path the Chief and Animal Control patrol.

**Setup:** A grumpy black-and-white goat is penned inside the Petting Zoo.
The fence is sturdy — chest-high, vertical slats — but one slat near the
south gate looks already cracked. A bored attendant teen leans on the gate
scrolling her phone. She does not react to the pup at all.

**What the player sees:** Approaching the south fence puts the goat directly
in view, visibly bored, occasionally headbutting the cracked slat. The
attendant ignores everything. From this fence the player can also see the
Animal Control officer pacing the food-stall row to the south.

**Verb behaviors at this location:**

- **Sniff** — "*Goat. Hay. Old apple core. The black-and-white one over there
  smells like he's been waiting all day for an excuse.*" (Hints: focus on the
  goat, his body language is the puzzle.)
- **Bark** — Bark *near the cracked slat* and the goat charges, finishes
  splintering it, and squeezes through into the fairgrounds. The teen finally
  looks up, swears, and starts running. Animal Control sees the running goat
  and gives chase. The patrolled path south of the Petting Zoo opens up and
  stays open. Barking *anywhere else* in the Petting Zoo just makes the rabbits
  hop and the chickens flap; flavor only.
- **Bite** — The fence slats are too thick to bite through. The pup tries and
  gets a splinter; message: "*Tastes like splinters and disappointment.*" Don't
  let bite trivialize the puzzle.
- **Dig** — Digs up a few buried kid-sized carrots near the fence. Cute, no
  effect.

**Solution:** Bark adjacent to the cracked slat (a small marked tile zone in
front of the goat).

**World state effect:**

- `goatLoose = true`
- The Animal Control sprite switches from "patrolling food row" to "chasing a
  goat sprite that bounces unpredictably across the south of the map." Their
  sight cone effectively never points back at the pup again for the rest of
  the game.
- The cracked slat is drawn missing; the goat is gone from its pen.

**Suggested implementation state:**

```js
let goatLoose      = false;   // set by bark near cracked slat
let goatSpriteX    = …;       // free-running goat for visual flavor
let goatSpriteY    = …;
let animalControlMode = "patrol"; // "patrol" | "chasingGoat"
```

---

## Puzzle 2 — The Tied Trash Bag (BITE)

**Location:** Picnic Area, tile (22–26, 2–4). One trash can sits on the
south edge of the picnic area, right where it overlooks the Chief's central
patrol path. The bag inside is overstuffed and tied at the top with a tight
twist of plastic.

**Setup:** The Picnic Area still has the family's lunch leftovers: a checked
blanket, a juice box, a half-eaten funnel cake on a paper plate. They were
cleaned up by a fair employee into the trash can right before everyone went
to ride the Ferris Wheel. The bag is fragrant — irresistible to anyone with
a nose.

**What the player sees:** The blanket is unmistakably the family's (familiar
pattern). The trash can is a wood-slat barrel with the bag tied above the
rim. The Chief is visible pacing east-west on the path immediately below.

**Verb behaviors at this location:**

- **Sniff** — At the blanket: "*Mom's lotion. Kid's sticky-finger funnel
  cake. Dad's BBQ-sauce shirt. They were here, not long ago.*" (Confirms the
  family was in this spot — a Sniff Trail breadcrumb regardless of whether
  the player solves the bite puzzle.) At the trash can: "*Funnel cake. Hot
  dog ends. Pickle. Chief Withers will never be able to walk past this.*"
  (Hints: the smell will draw the Chief.)
- **Bark** — Pigeons explode off the picnic tables. No mechanical effect,
  but a nice small payoff for pressing it.
- **Bite** — Bite the tied top of the bag. The twist tears, the bag
  collapses, and the entire fragrant pile of food trash spills across the
  south edge of the Picnic Area down onto the patrol path. The Chief
  rounds the corner two seconds later, sees the mess, hears the goat /
  hears about the goat / blames the BBQ vendor (whichever distraction
  copy fits at this point), and stomps off east toward the BBQ Pit
  yelling. He does not return for the rest of the game. Biting *anywhere
  else* (the blanket, the table) just rumples things; flavor only.
- **Dig** — Soft picnic-area lawn. The pup digs a shallow hole, a
  squirrel chitters at it from a tree. No effect.

**Solution:** Bite the trash bag's tied top.

**World state effect:**

- `chiefDistracted = true`
- Chief sprite changes pose to "stomping toward BBQ Pit" and is removed
  from the patrol once he reaches it.
- A pile-of-trash decoration is drawn at the spill point until end of game.

**Suggested implementation state:**

```js
let chiefDistracted = false;
let trashSpilled    = false;  // for drawing the spill
let chiefMode       = "patrol"; // "patrol" | "stompingToBBQ" | "yellingAtBBQ"
```

**Note on alternative ordering:** Puzzle 1 and Puzzle 2 each *independently*
clear the cross-map blockade. The player only needs ONE of them. If both are
solved the world simply has both effects — fine, no contradiction.

---

## Puzzle 3 — Wake Up Tito (DIG)

**Location:** Behind the Restrooms, tile (16–18, 5–7). A bench tucked
against the back wall of the Restrooms building, facing the Horse Barn.
This area is reachable from the pup's spawn point without crossing the
patrolled central path — making it the natural first stop for an explorer.

**Setup:** Tito the Ferris Wheel operator is asleep on the bench. He's
flat on his back, hat over his face, snoring. He bolted from the Ferris
Wheel during the cow chaos, walked here in a daze, and crashed. Until
he wakes and walks back, the wheel does not move and the family does
not come down.

**What the player sees:** A man in a striped vest and operator's cap
asleep on a bench, snoring loudly enough to register as zzz particles.
A patch of dry, dusty dirt is mounded up directly under the bench from
years of foot scuffing.

**Verb behaviors at this location:**

- **Sniff** — "*Grease. Buttered popcorn. The faint metal of the Ferris
  Wheel control lever. This is the operator. He's out cold.*" (Tells the
  player who he is and that he is the right person to wake.)
- **Bark** — Tito's snore briefly hitches, then resumes louder. Message:
  "*He just rolls over. He worked a double shift, this is a deep sleep.*"
  Bark is intentionally not enough.
- **Bite** — Bite his shoelaces. They come untied. Tito mumbles in his
  sleep about a knot. Cute, no effect on his consciousness.
- **Dig** — Dig the dust patch directly under the bench. A puff of fine
  dry dust kicks up into Tito's face. He sneezes himself awake — three
  enormous cartoon sneezes — yells "*Aaaah! The wheel! THE WHEEL!*",
  jumps off the bench, and runs off-screen toward the Ferris Wheel.
  Digging *anywhere else* in the area is just dirt; flavor only.

**Solution:** Dig directly under the bench.

**World state effect:**

- `titoAwake = true`
- Tito's sprite leaves the bench, walks (off-screen pathing) to the Ferris
  Wheel control booth, and stays there.
- After Tito reaches the booth, the wheel begins to rotate slowly. This
  starts the "endgame is now possible" state.
- If the player has not yet cleared a path west (Puzzle 1 or Puzzle 2),
  this still happens — the wheel just turns uselessly until the path
  is clear.

**Suggested implementation state:**

```js
let titoAwake     = false;
let titoAtBooth   = false;
let wheelTurning  = false;  // = titoAtBooth, basically
```

---

## Puzzle 4 — The Scent Trail (SNIFF)

**Location:** Distributed across the overworld. This is the verb's home
puzzle, and it runs in parallel with Puzzles 1, 2, and 3.

**Setup:** Sniff at any tile in the overworld returns a freshness reading
for the family's scent. The reading is quantized into four bands, picked by
the tile's distance to the next breadcrumb in a fixed sequence:

| Band   | Message                                                |
|--------|--------------------------------------------------------|
| HOT    | "*They were RIGHT HERE. Minutes ago.*"                  |
| WARM   | "*Familiar. Funnel cake fingers. Getting close.*"       |
| COOL   | "*A stranger's perfume. Nothing useful here.*"          |
| COLD   | "*Just sun-warm dirt and somebody's spilled lemonade.*" |

The fixed scent breadcrumb sequence:

1. Just south of the Horse Barn (the pup's spawn) — **HOT**, where the family
   walked when they tied the dog up. Tutorial sniff.
2. Behind the Restrooms — **HOT**, Tito has the family's wave smell on him
   from selling them tickets.
3. The Picnic Area blanket — **HOT**, the family's lunch.
4. The base of the Ferris Wheel — **HOT**, where they boarded.

Anywhere else on the map gives WARM near food stalls, COOL on open paths,
COLD in the far corners and back of the Main Stage.

**Verb behaviors at *every* overworld tile (this is the global rule):**

- **Sniff** — One of the four band readings, by tile.
- **Bark** — On the open map, the bark just echoes; small visual ripple,
  no effect. (Reserved for in-puzzle and endgame use.)
- **Bite** — On open ground: "*Just air. Tastes like dust.*" Reserved for
  in-puzzle objects.
- **Dig** — On open ground: "*A fast little dirt-spray. Nothing buried
  here.*" Reserved for the patch under Tito's bench. (Optional polish:
  one Easter-egg buried bone somewhere far from the path.)

**"Solution":** This puzzle is solved continuously. After the player has
sniffed the four breadcrumbs in any order, a single recap message fires
once: "*The trail is unmistakable. They're at the Ferris Wheel.*" This
both confirms the destination and makes Sniff feel essential rather than
flavor.

**World state effect:**

- `scentsFound` — set of breadcrumb IDs sniffed.
- When `scentsFound.size === 4`, fire the recap message and set
  `trailComplete = true`. This is not a hard gate for the endgame, but
  it lets the endgame dialog reference "you followed the trail."

**Suggested implementation state:**

```js
let scentsFound    = new Set();   // ids of breadcrumb tiles sniffed
let trailComplete  = false;
const SCENT_BREADCRUMBS = [
  { id: "spawn",     tile: [33, 10] },
  { id: "restroom",  tile: [17,  6] },
  { id: "picnic",    tile: [24,  3] },
  { id: "ferris",    tile: [ 8, 14] },
];
```

---

## Puzzle 5 — The Endgame: Reunion at the Ferris Wheel (BARK, timed)

**Location:** Base of the Ferris Wheel, tile (5–11, 10–15).

**Preconditions to enter this puzzle:**

- `titoAwake && titoAtBooth` — wheel is turning.
- `goatLoose || chiefDistracted` — at least one cross-map path is clear.

If both preconditions are met, the player can walk into the Ferris Wheel
area. Tito is in the booth, the wheel is spinning at a slow steady speed,
and the family's gondola is currently near the top. The pup needs to
catch their attention at the moment the gondola is closest to the
ground, otherwise the wheel just goes around again.

**What the player sees:** The wheel's rim and gondolas drawn at a
visible scale (reuse `drawBigFerrisWheel` from the story slideshow). One
gondola has the family in it — easy to spot because the kid is leaning
out and looking around, frantic.

**Verb behaviors at this location:**

- **Sniff** — "*HOT HOT HOT — they're directly above you.*" Confirms.
- **Bite** — "*Biting the support beam just hurts your teeth. Bad idea.*"
  Don't let bite shortcut the puzzle by, e.g., snapping the wheel cable.
- **Dig** — "*The ground here is packed gravel. Nothing.*"
- **Bark** — Timed:
  - If barked while the family's gondola is **at the bottom of the
    wheel** (a defined arc, e.g. gondola angle within ±25° of the
    six-o'clock position): the kid hears the pup, screams "*BISCUIT!*"
    (or whatever the player named the pup), the family waves, Tito
    stops the wheel at the bottom, the family runs out, and reunion
    cutscene plays.
  - If barked while the gondola is **anywhere else**: "*The wheel is
    too noisy up there — they didn't hear you. Wait until they come
    around.*" The wheel keeps turning, the player tries again.

**Solution:** Bark when the family's gondola is in the bottom arc.

**World state effect:**

- `reunited = true`
- Triggers a final cutscene: Tito stops the wheel, family steps off,
  the pup runs into the kid's arms, screen fades to a "The End"
  card with the pup's name and the family group sprite.

**Suggested implementation state:**

```js
let wheelAngle     = 0;       // radians
let familyGondola  = 0;       // index 0..N-1 of which gondola has the family
let reunited       = false;
function familyAngle() {
  return wheelAngle + familyGondola * (TWO_PI / NUM_GONDOLAS);
}
function familyAtBottom() {
  // bottom = HALF_PI in standard p5 angle (y-down), tweak as needed
  let a = (familyAngle() - HALF_PI + TWO_PI) % TWO_PI;
  return a < 0.44 || a > TWO_PI - 0.44; // ±25° window
}
```

---

## Cross-puzzle action matrix

A quick reference that future sessions can use to keep verb behavior
consistent. Rows are puzzle locations. Columns are verbs. Cells are
the *effect of using that verb at that location*.

| Location                 | Sniff                         | Bark                              | Bite                          | Dig                           |
|--------------------------|-------------------------------|-----------------------------------|-------------------------------|-------------------------------|
| Pup spawn (S of Barn)    | HOT scent (tutorial)          | echo                              | air                           | nothing buried                |
| Petting Zoo south fence  | "goat is bored / waiting"     | **SOLVES P1** (releases goat)     | splinter, no effect           | buried carrots, flavor        |
| Petting Zoo elsewhere    | rabbits/chickens scents       | startles small animals, flavor    | splinter, no effect           | flavor                        |
| Picnic Area blanket      | HOT scent (P4 breadcrumb)     | pigeons take off, flavor          | rumples blanket, flavor       | flavor                        |
| Picnic Area trash bag    | "Chief will never resist"     | pigeons take off, flavor          | **SOLVES P2** (spills bag)    | flavor                        |
| Behind Restrooms bench   | HOT scent — "the operator"    | Tito snores louder, no effect     | unties shoelaces, cute        | **SOLVES P3** (dust → sneeze) |
| Open path / food row     | WARM/COOL by tile             | echo                              | air                           | nothing                       |
| Ferris Wheel base        | HOT — "directly above you"    | **SOLVES ENDGAME** (if timed)     | "hurts your teeth"            | "packed gravel, nothing"      |

The recurring rule: **at any unmarked tile**, sniff returns a band reading,
the other three verbs return a short flavor message. This keeps the world
responsive without needing per-tile content.

---

## Suggested per-session implementation order

If the user wants to add puzzles one at a time in future sessions, this
order minimizes rework:

1. **Puzzle 4 (Sniff Trail)** first. It's mostly a global rule (sniff
   returns a band reading on the map) plus four breadcrumb tiles. It's
   the smallest change and it teaches the player to use sniff. After
   this session the verb infrastructure is in place for everything else.
2. **Puzzle 3 (Tito)** next. It's self-contained, doesn't depend on
   patrol logic, and gives the player something concrete to do near the
   spawn. It also introduces the "world-state changes after a verb"
   pattern beyond the paddock gate.
3. **Puzzle 1 (Goat)** — adds the Animal Control patrol + sight-cone +
   chase-and-teleport-back system. Once that exists, Puzzle 2 reuses it.
4. **Puzzle 2 (Trash)** — adds the Chief patrol, with the same patrol/
   sight-cone system. The work in #3 means this is small.
5. **Puzzle 5 (Endgame)** — the visible Ferris Wheel, the timed bark,
   and the reunion cutscene.

Each session ships a playable game. After session 1 the player has a
sniff-trail mystery with no resolution; after session 2 they can wake
Tito and watch a wheel spin; after sessions 3 and 4 they have at least
one viable route; after session 5, the game is winnable.
