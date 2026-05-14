## Sticker

We're going to build a game on P5.js which is a classic platformer: run and jump to get to the exit. However, in this game, the player will also control which direction gravity pulls in. By touching special blocks which are decorated with an arrow pointing in any of 4 directions, the gravity in the game will be repointed in that direction. All objects which are subject to gravity (player, enemies, loose objects) will find their acceleration redirected into the new gravity direction.

## Control Scheme and Motion

The player will use WASD or the index keys for movement in the corresponding direction. There will also be a button for run (hold down along with a direction to run) as well as jump (which always goes in the direction opposite of gravity at the moment.)

The basic motion should be familiar to anyone who has played the original Super Mario Bros. on NES. Jumps may be short or long based on how long the player holds down the jump button.

If gravity is currently oriented right-to-left, and the player wants to run up a wall, they may hold the up button. The buttons always map to screen direction.

## Aesthetics

### Player

The player will be a simple circle with a tangerine orange color and a darker orange border. When the player is running, they will turn a yellower shade of orange. Jumps do not change the player's appearance.

### Enemies

Enemies will all be varieties of pointy star shapes. They will all be colored with shades in the red family, significantly darker than the player. There are a few enemies in the first couple of levels--the player should encounter one every 10 seconds or so as they make their way through the level.

### Terrain

The terrain will be brown and green, the sky will be blue.

### Level End

The player is trying to get to a level exit portal which is a purple circle decorated with a spiral pattern on its interior. The spiral waves back and forth in a sine pattern. There's a glowing light coming from behind the circle.