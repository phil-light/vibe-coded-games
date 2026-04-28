## Prompt

See the attached Markdown file for the project

Let's start with making:

a title screen. players can name the pup they're playing as and start the game.
an overview map that the dog can run around in. we will fill it in with state fair items later, but for now rectangles in different colors are fine.

## Response

This is a great scope to start with—basically you’re building the two core “states” of an RPG: **title screen → overworld**. Let’s get you a clean, expandable structure in **p5.js** so you can layer features later without rewriting everything.

---

## 🧠 Core Idea: Game States

We’ll define a simple state machine:

* `"title"` → name input + start button
* `"overworld"` → player movement + placeholder map

---

## 🐶 Full Starter Code (p5.js)

This gives you:

* Title screen with name input
* Start button
* Overworld with colored rectangles
* Movable dog (simple circle for now)

```javascript
let gameState = "title";
let playerName = "";
let inputBox, startButton;

let player = {
  x: 200,
  y: 200,
  size: 20,
  speed: 3
};

function setup() {
  createCanvas(600, 400);

  // Input for naming the pup
  inputBox = createInput("");
  inputBox.position(width / 2 - 100, height / 2);
  inputBox.size(200);

  // Start button
  startButton = createButton("Start Game");
  startButton.position(width / 2 - 50, height / 2 + 40);
  startButton.mousePressed(startGame);
}

function draw() {
  background(220);

  if (gameState === "title") {
    drawTitleScreen();
  } else if (gameState === "overworld") {
    drawOverworld();
  }
}

function drawTitleScreen() {
  textAlign(CENTER);
  textSize(32);
  fill(0);
  text("Lost Pup", width / 2, 100);

  textSize(16);
  text("Name your pup:", width / 2, height / 2 - 20);
}

function startGame() {
  playerName = inputBox.value();

  // Hide UI
  inputBox.hide();
  startButton.hide();

  gameState = "overworld";
}

function drawOverworld() {
  drawMap();
  handleMovement();
  drawPlayer();

  // Display player name
  fill(0);
  textAlign(LEFT);
  textSize(14);
  text("Pup: " + playerName, 10, 20);
}

function drawMap() {
  // Placeholder "fair zones"
  noStroke();

  fill(255, 200, 200); // red zone
  rect(0, 0, 200, 200);

  fill(200, 255, 200); // green zone
  rect(200, 0, 200, 200);

  fill(200, 200, 255); // blue zone
  rect(400, 0, 200, 200);

  fill(255, 255, 200); // yellow zone
  rect(0, 200, 300, 200);

  fill(200, 255, 255); // cyan zone
  rect(300, 200, 300, 200);
}

function handleMovement() {
  if (keyIsDown(LEFT_ARROW)) player.x -= player.speed;
  if (keyIsDown(RIGHT_ARROW)) player.x += player.speed;
  if (keyIsDown(UP_ARROW)) player.y -= player.speed;
  if (keyIsDown(DOWN_ARROW)) player.y += player.speed;

  // Keep player on screen
  player.x = constrain(player.x, 0, width);
  player.y = constrain(player.y, 0, height);
}

function drawPlayer() {
  fill(139, 69, 19); // brown dog
  ellipse(player.x, player.y, player.size);
}
```

---

## 🧱 Why This Structure Works

* **Game states** make it easy to add:

  * `"battle"`
  * `"dialogue"`
  * `"menu"`
* UI elements (`inputBox`, `button`) are only active on the title screen
* Overworld is already separated into:

  * map drawing
  * movement
  * player rendering

---

## 🚀 Easy Next Steps

Once this is working, you can layer in:

### 1. Replace the player circle

* Load a sprite (`loadImage`)
* Animate walking

### 2. Expand the map

* Turn rectangles into named zones (e.g. `"petting zoo"`, `"food court"`)
* Add collision areas

### 3. Add “Sniff”

* Press a key → display scent strength based on location

### 4. Camera system

* Make the world bigger than the canvas and have the camera follow the dog

---

If you want, next we can:

* Add **collision + fences (for the holding pen escape)**
* Or build your **first NPC interaction system** (which is where RPG structure really starts to shine)
