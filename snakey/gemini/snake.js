let snake = [];
let snakeLength = 15;
let foods = [];
let particles = [];
let speed = 8;

let bgSynth, eatSynth;
let started = false;

function setup() {
  createCanvas(windowWidth, windowHeight);
  
  for(let i = 0; i < 15; i++) {
    foods.push(new Food());
  }
  
  bgSynth = new p5.Oscillator('sine');
  eatSynth = new p5.Oscillator('square');
}

function draw() {
  background(15, 15, 25); 
  
  if (!started) {
    fill(50, 255, 100);
    textAlign(CENTER, CENTER);
    textSize(24);
    text("Click anywhere to start the Beeps, Boops, and Snakes!", width/2, height/2);
    return;
  }

  // --- AUDIO ---
  if (frameCount % 15 === 0) {
    let notes = [196.00, 220.00, 261.63, 293.66, 329.63]; 
    bgSynth.freq(random(notes));
    bgSynth.amp(0.2, 0.05); 
    bgSynth.amp(0, 0.3);    
  }

  // --- PSEUDO-3D FOOD ---
  for (let f of foods) {
    f.update();
    f.show();
  }

  // --- EXPLOSION PARTICLES ---
  for (let i = particles.length - 1; i >= 0; i--) {
    particles[i].update();
    particles[i].show();
    if (particles[i].life <= 0) {
      particles.splice(i, 1); 
    }
  }

  // --- 3D SNAKE BODY ---
  // Anchor the head deeper in space (z = 200) so the tail can flow towards us
  let startZ = 200;
  let worldX = ((mouseX - width / 2) * startZ) / width;
  let worldY = ((mouseY - height / 2) * startZ) / height;
  
  snake.unshift({ x: worldX, y: worldY, z: startZ });
  
  if (snake.length > snakeLength) {
    snake.pop();
  }

  for (let i = snake.length - 1; i > 0; i--) {
    // FIX: The tail now moves TOWARDS the camera at the same speed as the food
    snake[i].z -= speed; 
    
    let p1 = snake[i];
    let p2 = snake[i - 1];
    
    // Prevent drawing segments that have passed behind the camera
    if (p1.z < 5 || p2.z < 5) continue; 
    
    let sx1 = (p1.x / p1.z) * width + width / 2;
    let sy1 = (p1.y / p1.z) * height + height / 2;
    let sx2 = (p2.x / p2.z) * width + width / 2;
    let sy2 = (p2.y / p2.z) * height + height / 2;
    
    let alpha = map(i, 0, snake.length, 255, 0);
    
    // Make segments thicker as they get closer to the camera
    let sw = map(p1.z, 0, startZ, 30, 5); 
    
    stroke(50, 255, 100, alpha);
    strokeWeight(max(sw, 1)); 
    line(sx1, sy1, sx2, sy2);
  }
  
  // Draw the snake head
  fill(255);
  noStroke();
  circle(mouseX, mouseY, 25);
}

function mousePressed() {
  if (!started) {
    userStartAudio(); 
    bgSynth.start();
    bgSynth.amp(0);
    eatSynth.start();
    eatSynth.amp(0);
    started = true;
  }
}

function eatFood(x, y) {
  snakeLength += 5;       
  speed += 0.2;           
  
  eatSynth.freq(880);     
  eatSynth.amp(0.5, 0.01); 
  eatSynth.amp(0, 0.2);   

  for (let i = 0; i < 20; i++) {
    particles.push(new Particle(x, y));
  }
}

class Food {
  constructor() {
    this.reset();
    this.z = random(10, width); 
  }
  
  reset() {
    this.x = random(-width/2, width/2);
    this.y = random(-height/2, height/2);
    this.z = width; 
  }
  
  update() {
    this.z -= speed; 
    
    if (this.z < 1) {
      this.reset();
    }

    let sx = (this.x / this.z) * width + width / 2;
    let sy = (this.y / this.z) * height + height / 2;

    // FIX: Tripled the edible window (now activates at z < 400 instead of 200)
    if (this.z < 400 && this.z > 0) {
       let d = dist(sx, sy, mouseX, mouseY);
       
       // Slightly larger hit radius to account for the earlier activation
       let hitRadius = map(this.z, 0, 400, 100, 20); 
       
       if (d < hitRadius) { 
         eatFood(sx, sy); 
         this.reset();
       }
    }
  }
  
  show() {
    let sx = (this.x / this.z) * width + width / 2;
    let sy = (this.y / this.z) * height + height / 2;
    let r = map(this.z, 0, width, 40, 0); 
    
    // Check against the new, earlier z-depth
    if (this.z < 400 && this.z > 0) {
      fill(255, 204, 0);
      noStroke();
      push();
      translate(sx, sy);
      rotate(frameCount / 20.0); 
      star(0, 0, max(r * 0.4, 0), max(r, 0), 5); 
      pop();
    } else {
      fill(255, 50, 100); 
      noStroke();
      circle(sx, sy, max(r, 0));
    }
  }
}

class Particle {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = random(-6, 6);
    this.vy = random(-6, 6);
    this.life = 255; 
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.life -= 15; 
  }

  show() {
    noStroke();
    fill(255, 204, 0, this.life);
    circle(this.x, this.y, 6);
  }
}

function star(x, y, radius1, radius2, npoints) {
  let angle = TWO_PI / npoints;
  let halfAngle = angle / 2.0;
  beginShape();
  for (let a = 0; a < TWO_PI; a += angle) {
    let sx = x + cos(a) * radius2;
    let sy = y + sin(a) * radius2;
    vertex(sx, sy);
    sx = x + cos(a + halfAngle) * radius1;
    sy = y + sin(a + halfAngle) * radius1;
    vertex(sx, sy);
  }
  endShape(CLOSE);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}