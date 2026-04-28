# Session 05 — Overworld Crowd + Scent Band Fix

This session does three things:

1. **Fixes counter-intuitive scent bands** near the Ferris Wheel (and all
   other breadcrumbs) by adding a WARM halo around every breadcrumb.
2. **Populates the overworld with 150 fairgoers**, with skin-tone, hair,
   shirt, holding, and behavior variety; family groupings; weighted
   crowd-density centers; and reactions to each of the four verbs.
3. **Improves trail-progress feedback** so the player can tell at a
   glance which band each sniff returned and how many family scents
   they've collected, plus an early-completion shortcut at the Ferris
   Wheel.

## Prompts

### Prompt 1

> There are some counter-intuitive locations for the bands; as I approach
> the ferris wheel, I was still getting some COOL / COLD sniffs. We will
> want to make sure that there are no cool or cold zones too close to the
> ferris wheel.
>
> Also, it's probably a good time to start working on packing the
> overworld with a crowd of people. The drawing of people seen in the
> opening story is a fine style, but we should also add more types of
> people:
>
> * people with many different skin tones
> * some holding balloons
> * some holding food
> * some holding prizes from carnival games
> * family groups with large and small members
> * people moving at different speeds (some running, some idling, some
>   walking around)
> * dense crowds near the food and the main stage, smaller clumps of
>   people spread throughout the rest of the map
>
> Let's see how it looks to add 150 people throughout the overworld.
>
> * If you sniff a random person, the feedback should be "not my family."
>   It's also nice to add a bit of flavor text about this person/family.
> * If you bark, 70% chance that they smile and acknowledge you, 25%
>   chance that they back away, 5% chance that they call for help and
>   get the animal catcher to put you back in the paddock.
> * If you bite, 100% chance that you go back to the paddock.
> * if you dig, 20% chance you find some food that was dropped, 80% just
>   dirt/hay/grass
>
> The player may walk in front of or behind the people without a problem;
> they can't block movement. However, we want to make sure that the
> player's visual elements are all drawn at one time, and that the people
> are drawn in order; we don't want people's arms and heads to overlap
> one another as they each move around.

## Response — Implementation notes

### 1. Scent band fix

Added a WARM halo around every breadcrumb. The classifier now reads:

```
distance < HOT_RADIUS_TILES  (3)  → HOT
distance < WARM_RADIUS_TILES (6)  → WARM
near a food stall                 → WARM
on a main path                    → COOL
otherwise                         → COLD
```

This means the entire approach to any breadcrumb (Ferris Wheel, Picnic,
Restrooms, Spawn) reads at least WARM. The COLD / COOL bands now only
fire in places that are *actually* far from any known family scent.

The constants `HOT_RADIUS_TILES = 3` and `WARM_RADIUS_TILES = 6` are
side-by-side at the top of the file so they can be retuned together.

### 2. The crowd

The overworld now seeds 150 NPCs in `setup()` and updates them in
`updateMap()`. Each person is a plain object (no class — keeps it
serializable and easy to inspect) with these fields:

- `skin`, `shirt`, `pants`, `hair` — per-person color palette (8 skin
  tones, 10 hair colors, 19 shirt colors, 7 pants colors)
- `hairStyle` — short / long / hat / bald
- `scale` — 0.55–0.72 for kids, 0.92–1.18 for adults (mixed sizes
  inside family groups)
- `holding` — null / balloon / food / prize, with random colors for
  balloons and prizes
- `behavior` — idle / walk / run, governing animation speed and
  whether `updatePerson` actually moves them
- `walkRadius`, `speed` — wandering bounds and pace
- `familyId` — non-null for the 18 family groups (2–4 members each
  sharing a clump of homeXY)
- `flavor` — one line of sniff flavor text from a 33-entry table
- internal animation state: `t`, `targetX/Y`, `repickTimer`,
  `reactTimer`, `reactKind`, plus `homeX/Y` for re-anchoring wanders

#### Crowd density

`CROWD_CENTERS` is a weighted list of tile coordinates. Spawning weights:

- **Food row** (Corn Dog / Funnel Cakes / BBQ Pit) — 14 each
- **Main Stage front** — 18 + 10 (this is the densest area)
- **Carnival games / rides** — 6–8 each
- **Picnic / Restrooms** — 4–6
- **Open paths** — 4–8
- **Far corners** — 3 each
- **Horse Barn front** — 3 (deliberately low; the pup spawns here)

`weightedPick` rolls against the total weight; `avoidLandmark` pushes
spawn / wander targets out of any landmark bounding box so a person
never ends up "inside" a building.

#### Variety

- `pickHolding`: ~14% balloons, ~20% food, ~8% prizes, rest empty.
  Family groups bias kids toward balloons (50% of kids hold one).
- `pickBehavior`: 8% running, 32% idling, 60% walking. Runners get a
  bigger walk radius and faster speed; idlers stay put visually.
- `pickHairStyle`: short is most common, then long, then hat / bald.
- Family groups: 18 of them, 2–4 members. Each member gets independent
  appearance and walking speed (so kids drift while parents idle).

### 3. Verb interactions with people

`nearestPerson()` returns the closest NPC plus their distance. If
`distance < PERSON_REACH (26 px)`, the verb interacts with that NPC:

| Verb  | Outcome with nearby person                                    |
|-------|---------------------------------------------------------------|
| Sniff | "Not my family. This one *<flavor>*"                          |
| Bark  | 70% smile (♥ float, no movement); 25% flinch (! float, person nudged away from pup); 5% **caught** — `returnToPaddock` |
| Bite  | 100% **caught** — `returnToPaddock`                           |
| Dig   | (location-independent) 20% finds dropped food, 80% just dirt  |

**Priority order for sniff** is breadcrumb HOT → person → ambient
band. Without that, the picnic and ferris breadcrumbs (which sit
inside crowded areas) would frequently be masked by a passing
stranger. With it, standing at a known family scent always reports
the family — strangers only intercept at WARM/COOL/COLD tiles.

`returnToPaddock(reason)`:

- Switches `gameState = STATE_PADDOCK`
- Resets `pup.x/y` to the middle of the paddock
- Leaves `gateOpen` untrue, so the player just walks south through
  the already-open gate to re-enter the overworld
- Carries the catch reason forward as `actionMessage` so the player
  reads "BARK! The stranger shrieks…" or "Animal Control hauls…"
  in the paddock HUD bubble

All scent-trail progress (`scentsFound`, `trailComplete`) is preserved
across catches.

### 4. Drawing order

`drawMap` was rewritten to Y-sort. Each frame:

1. Background, ground paths, and landmarks render as before (fixed
   layer — landmarks block movement, so no entity ever needs to draw
   "behind" one).
2. All people that pass a frustum cull (`isOnScreen` with a 40 px
   margin) plus the pup are collected into an `entities` array,
   sorted by `y` (foot position), and drawn in order.
3. Each entity's draw call is a single `push() ... pop()` block, so
   one person's body parts never get separated by another person's
   parts. A southerly person correctly overlaps a northerly one;
   identical-y people use array order as the tiebreaker.

The frustum cull skips off-screen people from drawing (but not from
updating — they still wander). With a typical viewport this drops the
draw load from 150 to ~30–60 sprites per frame.

### Files touched

- `claude/src/sketch.js` — new state, helpers, draw + update changes,
  verb handlers updated.
- `claude/sessions/05 crowd and band fix.md` — this log.

### Things deliberately not added

- **Animal Control sprite.** The 5%-on-bark and 100%-on-bite catches
  fade-cut to the paddock without rendering an actual catcher
  walking up. Adding a catcher walk-up animation belongs in the
  Puzzle 1 / Puzzle 2 patrol work, where the same catcher will need
  a real on-map presence.
- **Person → person collision.** People walk through each other. With
  150 NPCs and chibi sprites it's not noticeable; adding mutual
  collision would force a more elaborate steering / flow-field
  system that this prototype doesn't need yet.
- **Persistent person reactions.** A flinch nudges someone away
  briefly but they re-roll a target soon after; "called Animal
  Control" doesn't permanently change anything. Once Puzzle 1 / 2
  patrol logic exists, called-for-help could shorten the timer
  before the next patrol pass.

## Prompts (continued)

### Prompt 2 — Trail feedback + early completion

> As I run around the overworld and sniff things, I appear to not be
> making progress on the goal of sniffing all 4 of the scent bands. I
> only notice the all-caps HOT, but see the flavor text for the others.
> Any idea what's going on?
>
> Let's also make sure the flavor text for WARM, COOL, COLD include
> those band names in all caps; this helps the player.
>
> Finally, let's change the logic: if the player is right near the
> ferris wheel and does a sniff, complete the "trailComplete" quest
> regardless of whether they've sniffed everything. The dog is looking
> for their family, if they find them "early," it doesn't make sense to
> force the player to force them to go sniff the COOL and COLD zones
> as well.

### Response — Visibility + early completion

The likely root cause of the "no progress" feeling: only HOT messages
named the band explicitly. WARM / COOL / COLD just printed flavor
("familiar, funnel cake fingers; getting close.") without saying which
band the sniff was, so the player couldn't tell which sniffs were
*registering* as which. Combined with a small dim "Trail: x / 4" in
the corner of the top bar, the puzzle felt like it was returning
flavor with no scoring.

Three changes addressed this:

1. **Band names in caps on every sniff message.** All four bands now
   read `"<pup> catches a HOT/WARM/COOL/COLD scent — ..."`. The pattern
   matches the existing HOT wording so nothing unique to one band.

2. **Per-sniff progress confirmation.** When a HOT sniff records a
   *new* breadcrumb, the message now appends
   `"(Family scent N of 4 found.)"` so the counter ticks up *inside the
   message bubble*, not just up in the top bar.

3. **Brighter trail HUD.** The top-bar progress label is now 13pt gold
   (matching the title), reading `TRAIL: 2 / 4` or `TRAIL COMPLETE!`.
   The "ARROWS to move" hint stays small and dim to its left.

4. **Ferris Wheel ends the trail early.** Sniffing at the `ferris`
   breadcrumb tile now completes the puzzle regardless of how many
   other breadcrumbs were skipped:

   ```js
   let endTrail = !trailComplete &&
                  (crumbId === "ferris" ||
                   scentsFound.size === SCENT_BREADCRUMBS.length);
   ```

   On early completion, all unsniffed breadcrumb ids are quietly added
   to `scentsFound` so the HUD reads `TRAIL COMPLETE!` and the recap
   message doesn't refire. The idle bottom-bubble copy after
   completion was also softened from "head west to the Ferris Wheel"
   (now potentially contradictory) to a neutral "knows the family is
   at the Ferris Wheel."
