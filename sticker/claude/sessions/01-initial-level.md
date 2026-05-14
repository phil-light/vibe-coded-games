# Session 01: Initial Level

First Claude Code session for the Sticker game. Goal of the session
was to stand up the project structure, generate a playable first
build of the gravity-flip platformer described in `Sticker.md`, and
get it committed onto `main`.

---

## Prompt

> We're going to be building a game on p5.js which is described in
> Sticker.md. This prototype will serve two main purposes:
>
> 1. Demonstrate building a platformer game with vibe coding for the
>    project described in the README in the parent directory.
> 2. Provide a starting point for us to ask the students to solve
>    some bugs; we will work on introducing some intentionally after
>    the initial build is up and running.
>
> Please generate sketch.js in src/ and create a sessions/ directory
> that we will save this session log to a little later.

## Response

The session started in a Claude Code worktree, so the first thing
Claude had to do was orient itself. The user said "described in
Sticker.md," but `Sticker.md` wasn't in the worktree's checkout —
it was a sibling of the `.claude/worktrees/` directory in the user's
local filesystem. Claude tracked it down with a couple of `find` /
`ls` commands and read it.

The design doc covered:

- A classic Mario-style platformer (run, jump, variable jump height)
- Player controls 4 directions of gravity by touching arrow blocks
- All gravity-affected objects (player, enemies, loose objects)
  reorient when gravity changes
- WASD / arrow keys always map to screen direction (not gravity-local)
- A tangerine-orange circle player (yellower while running)
- Red star enemies
- A purple portal with a wobbling sine-pattern spiral as the exit

Before writing any code, Claude noted the existing repo pattern from
`lost-pup/claude/src/sketch.js` + `lost-pup/claude/sessions/` and
mirrored it for sticker:

```
sticker/
  Sticker.md
  claude/
    src/sketch.js
    sessions/
```

### Game design decisions

Claude built a single-file p5.js sketch (~470 lines) with these
classes:

- `Player` — circle, square AABB collision, perpendicular-axis
  movement projection, variable-height Mario-style jump
- `Enemy` — red spinning star, patrols on the perp axis, reverses
  on wall bumps, falls under current gravity
- `Arrow` — non-solid tile that redirects gravity when the player
  enters it (only the player triggers — enemies hitting one would
  upend any puzzle the player is mid-solve on)
- `ExitPortal` — purple circle with a stacked-glow halo and a
  sine-wobbled spiral interior

The trickiest piece was the rotated gravity. Claude solved it by
keeping all velocity in screen coordinates (`vx`, `vy`) but
decomposing it each frame into:

- `gravVel` = velocity along the current gravity vector
- `perpVel` = velocity along the perpendicular axis (rotated 90° CW)

"Walk" input is the projection of the WASD vector onto the perp
axis. "Jump" applies impulse opposite gravity. Friction only damps
`perpVel`, never `gravVel`. The result: the same physics code works
in all four gravity directions without branching.

### Level design

Claude wrote the level as an ASCII grid at the top of `sketch.js`,
which is friendly for students to edit. Symbols:

```
# wall    . empty    P player    X exit    E enemy
^ v < >   arrow blocks (gravity points up/down/left/right after touch)
```

The first level is 28×14 tiles (896×448 canvas). The player can't
reach the exit through normal jumping — they have to use a `>`
arrow to fly sideways across the screen and a `^` arrow to fly up
to the ceiling, where they walk left along it to the exit. So the
gravity mechanic isn't decorative; the level proves it works.

One enemy patrols on a small platform mid-level, walled at both
ends so it can't fall off.

### Things deliberately left simple

A few areas where the code is straightforward enough to make good
"intentional bug" candidates for students later:

- The perpendicular-axis decomposition (a single sign flip breaks
  one gravity direction)
- `collideAxis` zeroes velocity per-axis — corner clipping or
  ground-stick bugs are easy to seed
- `onGround` only flags the gravity-aligned face of the player
- Whether enemies trigger arrows is a one-line change with big
  gameplay consequences

---

## Follow-up: "I don't see the files locally"

The user reported the files weren't visible in their main checkout.
This was expected: Claude was operating in a git worktree on branch
`claude/eager-cerf-12cc01`, and the files were uncommitted there.

Claude offered three options:

1. Open the files directly from the worktree path
2. Commit on the branch, then merge into main
3. Remove the worktree and check out the branch normally

The user picked option 2.

### Merge attempt → cherry-pick

After committing on the branch (`5d5de04`), checking out the branch
from the main repo failed because git won't allow the same branch
in two working trees:

```
fatal: 'claude/eager-cerf-12cc01' is already used by worktree at ...
```

Claude offered to merge `claude/eager-cerf-12cc01` into `main`, but
on inspection the two branches had diverged on `lost-pup` files
(several commits with duplicate titles but different tree hashes).
A merge would have produced conflicts on files unrelated to the
sticker work.

Cleaner equivalent: **cherry-pick** the single sticker commit onto
main. Claude removed the untracked (identical) `sticker/Sticker.md`
sitting at the top of the main checkout to clear the way, then
ran the cherry-pick.

End result: commit `c582ebe` on main with both files. The worktree
branch was left as-is (the user noted they'd be more explicit about
branch management in the next session).

---

## Takeaways for students

- **Tell the LLM where things are.** Claude burned several tool
  calls finding `Sticker.md` because it sat outside the working
  directory. A line like "Sticker.md is in the parent folder" would
  have skipped that.
- **The first build doesn't need to be polished.** The level is
  beatable and demonstrates the mechanic. That's enough to start
  iterating from. Trying to design a perfect set of levels up-front
  would have eaten the whole session.
- **Git plumbing is a real cost.** Roughly the last third of the
  session was spent on worktrees, branches, and merge-vs-cherry-pick
  — none of which made the game any better. Worth being deliberate
  about it.
