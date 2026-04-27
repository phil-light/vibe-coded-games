# Prompt

We're going to be coding a game on P5.js. Instead of making an arcade game, I'd like to see if we can try to make a simple classic RPG. I'm thinking of EarthBound for the SNES as a point of reference, although let's reduce the scope for now.

Let's call the game "lost pup" and make it about a dog who gets away from its family while visiting an outdoor state fair. the dog will be the main character, and encounter a variety of challenges as it attempts to get back to its family.

The dog can use sniff, bark, and bite as its main 3 actions. (but don't implement that yet.) It can also run around on the map. (we will focus on this first.)

Let's start with making:

- a title screen. players can name the pup they're playing as and start the game.
- an overview map that the dog can run around in. we will fill it in with state fair items later, but for now rectangles in different colors are fine.

# Response

I'll replace the existing snake game with the new Lost Pup RPG. Let me build the title screen and overworld map.

Here's what I built:

**Title Screen**

- Night sky with twinkling stars and a rotating ferris wheel silhouette
- "LOST PUP" title with subtitle
- A preview of the pup sprite
- Text input for naming your pup (type + backspace, max 12 chars)
- Press ENTER to start

**Overworld Map** (40x30 tiles)

- Green grass ground with dirt cross-paths
- 13 placeholder landmarks as labeled colored rectangles: Entrance Gate, Corn Dog Stand, Funnel Cakes, BBQ Pit, Ring Toss, Balloon Darts, Ferris Wheel, Tilt-A-Whirl, Bumper Cars, Petting Zoo, Horse Barn, Main Stage, Restrooms, Picnic Area
- The pup starts near the entrance at the bottom
- WASD or arrow keys to move, with collision against buildings
- Camera follows the pup with a scrolling viewport
- Simple animated pup sprite (directional facing, walk bobble, tail wag, leg movement)
- Name tag floating above the pup
- HUD bar at top

Paste into **editor.p5js.org** and hit Play to try it out. The pup's three actions (sniff, bark, bite) are stubbed out in the design but not wired up yet, as you requested.