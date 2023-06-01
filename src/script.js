const playerLeft = new Image();
playerLeft.src = "src/rocket.png";

coinCollected = document.createElement("audio");
coinCollected.src = "src/arcade.wav";

document.getElementById("canvas1").style.background = "url('src/space-bg.jpg')";
document.getElementById("canvas1").style.backgroundSize = "cover";
gameOverSound = document.createElement("audio");
gameOverSound.src = "src/explosion.wav";

//Canvas Setup
const canvas = document.getElementById("canvas1");
const ctx = canvas.getContext("2d");
canvas.width = 1000;
canvas.height = 1000;

let gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
gradient.addColorStop("0", "yellow");
gradient.addColorStop("0.25", "orange");
gradient.addColorStop("0.5", "red");
gradient.addColorStop("0.75", "orange");
gradient.addColorStop("1.0", "yellow");

let animationId;
let score = 0;
let level = 0;
let frameCount = 0;
let isGameOver = false;
ctx.font = "60px Georgia";

const centerX = canvas.width / 2;
const centerY = canvas.height / 2;
const radius = 200;
let angle = 0;
bulletsShooting = false;

//Player
class Player {
  constructor() {
    this.centerX = canvas.width / 2;
    this.centerY = canvas.height / 2;
    this.x = 0;
    this.y = 0;
    this.centerRadius = 350;
    this.radius = 20;
    this.angle = -Math.PI / 2;
    this.direction = 0;
    this.speedFactor = level * 2 + 2;
  }

  resetPlayer() {
    this.centerX = canvas.width / 2;
    this.centerY = canvas.height / 2;
    this.x = 0;
    this.y = 0;
    this.angle = -Math.PI / 2;
    this.direction = 0;
  }

  changeDirection() {
    this.direction *= -1;
  }

  draw() {
    this.x = this.centerX + this.centerRadius * Math.cos(this.angle);
    this.y = this.centerY + this.centerRadius * Math.sin(this.angle);
    this.angle = this.angle + 0.02 * this.direction * this.speedFactor;
    //console.log("Updating...");
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius / 10, 0, 2 * Math.PI);
    ctx.fillStyle = "red";
    ctx.fill();

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(
      this.direction != -1 ? this.angle - Math.PI / 2 : this.angle + Math.PI / 2
    );
    ctx.drawImage(playerLeft, 0 - 40, 0 - 40);
    ctx.restore();
  }
}

let player = new Player();

function buttonClicked() {
  if (!isGameOver) {
    bulletsShooting = true;
    if (player.direction == 0) {
      player.direction = 1;
    } else {
      player.changeDirection();
    }
  } else {
    resetGame();
  }
}

//Button
const button = document.createElement("button");
button.type = "button";
button.innerHTML = "Change Direction";
button.className = "btn-styled";
button.addEventListener("click", function () {
  buttonClicked();
});
document.body.appendChild(button);

// const button2 = document.createElement("button");
// button2.type = "button";
// button2.innerHTML = "Restart";
// button2.className = "btn-styled";
// document.body.appendChild(button2);

//Coins
const coinImage = new Image();
coinImage.src = "src/coin-2.png";
class Coin {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 10;
    this.distance;
    this.counted = false;
  }
  draw() {
    //console.log("drawing...");
    ctx.fillStyle = "yellow";
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.drawImage(coinImage, this.x - 24, this.y - 24);
  }

  update() {
    const dx = this.x - player.x;
    const dy = this.y - player.y;
    this.distance = Math.sqrt(dx * dx + dy * dy);
  }
}

let coinArray = [];
function setCoins() {
  coinArray = [];
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const centerRad = 350;
  let angle = -80;
  while (angle < 270) {
    const x = centerX + centerRad * Math.cos((angle * Math.PI) / 180);
    const y = centerY + centerRad * Math.sin((angle * Math.PI) / 180);
    coinArray.push(new Coin(x, y));
    //console.log(coinArray.length);
    angle += 10;
  }
}

function manageCoins() {
  for (let i = 0; i < coinArray.length; i++) {
    coinArray[i].draw();
    coinArray[i].update();
    //console.log(coinArray[i].distance);
  }
  for (let i = 0; i < coinArray.length; i++) {
    if (coinArray[i].distance < player.radius + coinArray[i].radius + 30) {
      //console.log("collision");
      if (!coinArray[i].counted) {
        coinCollected.play();
        coinArray[i].counted = true;
        coinArray.splice(i, 1);
        score++;
      }
    }
  }
  if (coinArray.length == 0) {
    level++;
    bulletsShooting = false;
    bulletArray = [];
    player.angle = -Math.PI / 2;
    player.direction = 0;
    setCoins();
  }
}

//Bullet

const bulletFire = new Image();
bulletFire.src = "src/Fire.png";

class Bullet {
  constructor(angle) {
    this.x = canvas.width / 2;
    this.y = canvas.height / 2;
    this.radius = 10;
    this.distance;
    this.angleRange =
      player.direction == 1
        ? [angle - Math.PI / 9, angle + Math.PI / 3.5]
        : [angle + Math.PI / 9, angle - Math.PI / 3.5];
    this.angle =
      this.angleRange[0] +
      Math.random() * (this.angleRange[1] - this.angleRange[0]) * 2;
    this.speed = 8 + Math.random() * level;
  }
  draw() {
    ctx.fillStyle = "black";
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(
      this.direction != -1 ? this.angle + Math.PI / 2 : this.angle - Math.PI / 2
    );
    ctx.drawImage(bulletFire, 0 - 20, 0 - 18);
    ctx.restore();
  }

  update() {
    this.x += this.speed * Math.cos(this.angle);
    this.y += this.speed * Math.sin(this.angle);
    const dx = this.x - player.x;
    const dy = this.y - player.y;
    this.distance = Math.sqrt(dx * dx + dy * dy);
  }
}

const shooterImage = new Image();
shooterImage.src = "src/orange-planet.png";

class Shooter {
  constructor() {
    this.x = canvas.width / 2;
    this.y = canvas.height / 2;
  }
  draw() {
    ctx.fillStyle = "black";
    ctx.beginPath();
    ctx.arc(this.x, this.y, 100, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.drawImage(shooterImage, this.x - 135, this.y - 134);
  }
}

let shooter = new Shooter();

let bulletArray = [];

let bulletDuration = 15 - level * 2 < 1 ? 1 : 15 - level * 2;
// let bulletDuration = 1;

function manageBullets() {
  if (frameCount % bulletDuration == 0) {
    bulletArray.push(new Bullet(player.angle));
  }
  if (level > 7) {
    if (frameCount % (bulletDuration * 2) == 0) {
      bulletArray.push(new Bullet(player.angle));
    }
  }
  for (let i = 0; i < bulletArray.length; i++) {
    bulletArray[i].draw();
    bulletArray[i].update();
  }
  for (let i = 0; i < bulletArray.length; i++) {
    if (bulletArray[i].distance < player.radius + bulletArray[i].radius + 20) {
      isGameOver = true;
    }
    if (
      bulletArray[i].x > 1000 ||
      bulletArray[i].x < 0 ||
      bulletArray[i].y > 1000 ||
      bulletArray[i].y < 100
    ) {
      bulletArray.splice(i, 1);
    }
  }
}

function resetGame() {
  frameCount = 0;
  isGameOver = false;
  level = 1;
  score = 0;
  bulletsShooting = false;
  bulletArray = [];
  player.resetPlayer();
  setCoins();
  cancelAnimationFrame(animationId);
  animate();
}

function drawGameOverScreen() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.font = "100px Georgia";
  ctx.fillStyle = gradient;
  ctx.fillText("Game Over", 250, 300);
  ctx.font = "50px Georgia";
  ctx.fillText("Final Score: " + score, 340, 450);
}

function animate() {
  if (!isGameOver) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    manageCoins();
    if (bulletsShooting) {
      manageBullets();
    }
    ctx.fillStyle = gradient;
    ctx.fillText("Score: " + score, 10, 50);
    ctx.fillText("Level: " + level, 500, 50);
    frameCount++;
    player.draw();
    shooter.draw();

    animationId = requestAnimationFrame(animate);
  } else {
    gameOverSound.play();
    drawGameOverScreen();
  }
}

animate();
