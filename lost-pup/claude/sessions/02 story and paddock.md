# Session 02 — Story Slideshow and Paddock Escape

## Prompts

### Prompt 1

> The purpose and basic design of the game we are building is described in
> lost LostPup.md. You will do all of your work in the claude/ folder. Please
> put the output script in claude/src after you make changes.
>
> In this session, I'd like to take the existing sketch.js and modify it to
> make a slideshow-like illustration of the setup part of the story. Do your
> best to illustrate each of the listed story beats using the tools available
> in P5.js. At the end of the story setup, instead of starting the player in
> the Overworld map, the player will be trapped in the horse barn and need to
> start working on a way to escape the paddock.

### Prompt 2

> this is a great start. let's commit to using only the arrow keys for
> movement, then use the following key mapping for the rest of the game:
>
> D: Dig
> B: Bark
> S: Sniff
> T: Bite
>
> Add this information to the bottom hint bubble in line 1349 so that they
> player knows what to do.
>
> Let's make sniff in the paddock just report the smells of all the other
> animals, dirt, and some faint but delicious-smelling funnel cake. Digging
> around the fence border reveals wire netting around the bottom of the fence
> which is nice and secure for small animals. Bark makes the other animals
> jump but has no other effect. The way out will be to Bite at the lock of
> the gate, opening the simple hand latch and swinging the gate wide. The
> player may then exit the bottom of the screen to get to the overworld map,
> located right near the existing Horse Barn.

## Response — Story slideshow + paddock state

I added a new `STATE_STORY` state that runs after the title screen and
before gameplay, and replaced the old direct‑to‑overworld start with a new
`STATE_PADDOCK` state where the player is trapped in the small‑animal pen.

### Game-state flow

```
STATE_TITLE  →  STATE_STORY (5 beats)  →  STATE_PADDOCK  →  STATE_MAP
```

### Story slideshow (`drawBeat*`)

Each beat draws into the upper canvas region with a 30‑frame fade‑in and a
caption box across the bottom. SPACE / ENTER / mouse click advances; the
last beat hands control to the paddock.

1. **Arrival** — sky gradient, sun, distant ferris wheel, tents, a
   bunting‑draped fair entrance arch (`drawFairArch`), the family + pup
   walking up a perspective path with a balloon.
2. **Ferris Wheel** — large animated rotating ferris wheel
   (`drawBigFerrisWheel`) with the family visible as tiny waving figures in
   the highlighted gondola; crowd silhouettes (`drawCrowdPerson`) drift
   past; the pup sits in the foreground tied to a fence post with a red
   leash.
3. **Cow Chaos** — photographer (`drawPhotographer`) with a flash bulb,
   panicked rearing cow (`drawCow` with rotation) with horns and wide eyes,
   farmer being yanked by the rope (`drawFarmer`), broken fence pieces, a
   periodic full‑screen white flash overlay and `*FLASH!*` text.
4. **Flight** — pup in a stretched running pose (`drawRunningPup`) with
   motion lines, dust plumes and a `?!` reaction; scrolling crowd legs in
   the background.
5. **Wake Up** — dim wooden barn wall with planks, a window light beam,
   hay‑strewn floor, sleeping curled pup (`drawSleepingPup`) with floating
   `z z z`, neighbouring rabbit and chicken pens.

Supporting figure helpers were added: `drawHuman` (with `dad`/`mom`/`kid`
hair variants), `drawCrowdPerson`, `drawFarmer`, `drawPhotographer`,
`drawCow`, `drawTent`, `drawFairArch`, `drawPupSideView`, `drawRunningPup`,
`drawSleepingPup`, `drawPenFence`, `drawTinyPen`, plus `drawBigFerrisWheel`
in addition to the existing tiny title-screen ferris wheel.

### Paddock layout (`STATE_PADDOCK`)

A single‑screen top‑down scene that replaces the old direct overworld
start:

* `drawHorseBarn` at the top with a "HORSE BARN" sign.
* A fenced paddock (`drawPaddockFence`) with rails, posts, and a gate at
  the south side.
* Water trough (`drawWaterTrough`) inside the paddock; hay bales
  (`drawHayBale`) outside; small‑animal pens at the corners (`drawTinyPen`)
  with a rabbit and chickens.
* Path leading away south through the gate.
* The pup spawns inside the paddock and is collision‑bounded by the
  fence; bumping the gate area increments `gateNudges` for hint
  escalation.

### Controls (Prompt 2)

* **Movement**: arrow keys only, in both paddock and overworld. WASD
  removed and `keyIsDown(65/68/87/83)` cleared from `updatePaddock` /
  `updateMap`.
* **Action keys** (handled in `keyPressed` for `STATE_PADDOCK`):
  * `D` (68) → `doDig()`
  * `B` (66) → `doBark()`
  * `S` (83) → `doSniff()`
  * `T` (84) → `doBite()`

### Action behaviours

```
Sniff  →  reports rabbits, chickens, sun-warmed dirt, and a faint
          delicious whiff of funnel cake.
Dig    →  near the fence: reveals wire netting buried along the bottom
          ("the small-animal pens are built tight")
          mid-paddock: just kicks up dust.
Bark   →  triggers `animalJumpTimer = 40`; the small-pen animals hop
          with `!` markers; message says no one comes to investigate.
Bite   →  near the gate latch: sets `gateOpen = true`, opens the latch.
          elsewhere: snaps at the air with a hint about biting something
          specific.
```

### Gate opening + overworld transition

* `gateOpen` (boolean) + `gateSwing` (0..1 animated each frame) drive the
  gate visual: the gate hinges on the left post and rotates `gateSwing *
  HALF_PI` so it swings out to the south. Once open, the padlock is drawn
  with a popped‑open shackle.
* Collision in `updatePaddock`: the south boundary is only passable when
  `gateOpen` is true AND the pup is within the gate gap.
* Once `pup.y > PAD_Y + PAD_H + 24`, `enterOverworld()` runs:
  switches to `STATE_MAP`, places the pup at tile `(33, 9.5)` — directly
  south of the existing Horse Barn landmark — and snaps the camera to
  follow.

### Overworld restored

`updateMap`, `drawMap`, `drawGroundPaths`, and `drawMapHUD` were
re‑introduced (they had been dropped in Prompt 1). The map HUD now shows
the action‑key legend so players keep the controls visible after they
escape the pen.

### Bottom hint bubble (line ~1349, paddock HUD)

The bubble at the bottom of the paddock screen was reworked to act as the
primary feedback channel:

* Top half: dynamic message — the most recent action result while
  `actionMessageTimer > 0`; otherwise a context hint that escalates as the
  player nudges the gate, and switches to "The gate is open! Walk south…"
  once unlocked.
* Bottom half: a row of color‑coded key chips (`D : Dig`, `B : Bark`,
  `S : Sniff`, `T : Bite`) drawn by a small `drawKeyHint(x, y, k, label)`
  helper.

### State / variable additions

```js
const STATE_MAP        = 3;
let   gateOpen         = false;
let   gateSwing        = 0;
let   actionMessage    = "";
let   actionMessageTimer = 0;
let   animalJumpTimer  = 0;
```

`hintTimer` (cycling-hint counter) was removed since the hint logic now
keys off `actionMessageTimer`, `gateOpen`, and `gateNudges` instead of
wall-clock cycling.
