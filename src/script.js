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

const label1 = document.getElementById("label1");
const txtbox = document.getElementById("fname");
const button = document.getElementById("button1");

label1.font = "100px Orbitron";
button.addEventListener("click", function () {
  // console.log(document.getElementById("fname").value);
  document.cookie = "Name=" + document.getElementById("fname").value + ";";
  canvas.removeAttribute("hidden");
  button.hidden = "hidden";
  txtbox.hidden = "hidden";
  label1.hidden = "hidden";
});

const playerLeft = new Image();
playerLeft.src = "src/rocket.png";

coinCollected = document.createElement("audio");
coinCollected.src = "src/arcade.wav";

document.getElementById("canvas1").style.background =
  "url('src/space-black.jpg')";
document.getElementById("canvas1").style.backgroundSize = "cover";
gameOverSound = document.createElement("audio");
gameOverSound.src = "src/explosion.wav";

let lastTime = 0;
let deltaTime = 0;

let bulletDeployTime = 0;
let highScore = 0;

let animationId;
let score = 0;
let level = 0;
let frameCount = 0;
let isGameOver = false;
let gameJustStarted = true;

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
    this.speedFactor = level * 30 + 60;
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
    this.angle =
      this.angle + 0.02 * this.direction * this.speedFactor * deltaTime;
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

// //Button
// const button = document.createElement("button");
// button.type = "button";
// button.innerHTML = "Change Direction";
// button.className = "btn-styled";
// button.addEventListener("click", function () {
//   buttonClicked();
// });
// document.body.appendChild(button);

//Canvas onclicked
canvas.addEventListener(
  "click",
  function () {
    if (gameJustStarted) {
      gameJustStarted = false;
      startAnimating();
    } else {
      buttonClicked();
    }
  },
  false
);

//spacebar clicked
document.body.onkeyup = function (e) {
  if (e.key == " " || e.code == "Space" || e.keyCode == 32) {
    buttonClicked();
  }
};

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
    angle += 10;
  }
}

function manageCoins() {
  for (let i = 0; i < coinArray.length; i++) {
    coinArray[i].draw();
    coinArray[i].update();
  }
  for (let i = 0; i < coinArray.length; i++) {
    if (coinArray[i].distance < player.radius + coinArray[i].radius + 30) {
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
    this.speed = 150 + 75 * level;
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
    this.x += this.speed * Math.cos(this.angle) * deltaTime;
    this.y += this.speed * Math.sin(this.angle) * deltaTime;
    // this.x += this.speed * Math.cos(this.angle);
    // this.y += this.speed * Math.sin(this.angle);
    const dx = this.x - player.x;
    const dy = this.y - player.y;
    this.distance = Math.sqrt(dx * dx + dy * dy);
  }
}

const shooterPlayImage = new Image();
shooterPlayImage.src = "src/play.png";

const shooterReverseImage = new Image();
shooterReverseImage.src = "src/reverse.png";

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
    ctx.drawImage(
      bulletsShooting ? shooterReverseImage : shooterPlayImage,
      this.x - 100,
      this.y - 100
    );
  }
}

let shooter = new Shooter();

let bulletArray = [];

let bulletDuration = (level > 7 ? 5 : 35 - level * 4) / 2;
// let bulletDuration = 5;

function manageBullets() {
  if (bulletDeployTime >= bulletDuration && bulletsShooting) {
    bulletArray.push(new Bullet(player.angle));
    // bulletArray.push(new Bullet(player.angle));
    bulletDeployTime = 0;
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
  startAnimating();
}

function drawGameOverScreen() {
  highScore = score > highScore ? score : highScore;
  if (document.cookie.length != 0) {
    console.log("HighScore is " + highScore);
    // highScore = document.cookie("High score");
  }
  document.cookie = "High score=" + highScore + ";";

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.font = "100px Orbitron";
  ctx.fillStyle = gradient;
  ctx.fillText("Game Over", 240, 300);
  ctx.font = "50px Orbitron";
  ctx.fillText("Final Score: " + score, 330, 450);
  ctx.font = "30px Orbitron";
  if (document.cookie.length != 0) {
    ctx.font = "50px Orbitron";
    ctx.fillText("High Score: " + highScore, 330, 530);
  }
  ctx.fillText("click to retry", 340, 700);
}

function drawHowToPlayScreen() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.font = "80px Orbitron";
  ctx.fillStyle = gradient;
  ctx.fillText("How To Play", 230, 200);

  ctx.font = "30px Orbitron";
  ctx.fillText("Press the space bar or click in the center to", 100, 300);
  ctx.fillText("change direction", 100, 350);
  ctx.fillText("Avoid the fireballs and collect all the coins", 100, 450);
  ctx.fillText("to complete the level", 100, 500);
  ctx.font = "40px Orbitron";
  ctx.fillText("click here to accept the challenge", 130, 700);
  ctx.font = "20px Orbitron";
  ctx.fillText("Coded by Armaan", 700, 950);
}

function animate(currentTime) {
  deltaTime = (currentTime - lastTime) / 1000; // Convert delta time to seconds
  lastTime = currentTime;
  bulletDeployTime += deltaTime * 35;
  if (!isGameOver) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    manageCoins();
    if (bulletsShooting) {
      manageBullets();
    }
    ctx.fillStyle = gradient;
    ctx.font = "40px Orbitron";
    ctx.fillText("Score: " + score, 10, 50);
    ctx.fillText("Level: " + level, 330, 50);
    ctx.fillText("High Score: " + highScore, 600, 50);
    frameCount++;
    player.draw();
    shooter.draw();

    animationId = requestAnimationFrame(animate);
  } else {
    gameOverSound.play();
    drawGameOverScreen();
  }
}

function startAnimating() {
  lastTime = performance.now();
  animate(lastTime);
}

drawHowToPlayScreen();
// startAnimating(); // Start the animation loop
