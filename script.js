// -------------------- SETUP --------------------
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const bgm = document.getElementById("bgm");
bgm.volume = 0.7;

const startBtn = document.getElementById("startBtn");
const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlayTitle");
const overlayText = document.getElementById("overlayText");
const restartBtn = document.getElementById("restart");

const scoreDiv = document.getElementById("score");
const heartsDiv = document.getElementById("hearts");

let gameRunning = false;
let score = 0;
let lives = 3;

// -------------------- LOAD IMAGES --------------------
const carImg = new Image();
carImg.src = "car.png";

const obstacleImg = new Image();
obstacleImg.src = "cone.png";

// Car properties
let car = {
    x: canvas.width / 2 - 40,
    y: canvas.height - 150,
    width: 80,
    height: 120,
    speed: 8
};

// Obstacles
let obstacles = [];
let spawnTimer = 0;

// -------------------- AUDIO START (important for iOS) --------------------
startBtn.addEventListener("click", () => {
    startBtn.style.display = "none";     // Hide start button
    overlay.style.display = "none";

    // iOS only plays audio after gesture
    bgm.currentTime = 0;
    bgm.play().catch(() => {});          // ignore errors

    startGame();
});

// -------------------- GAME START --------------------
function startGame() {
    gameRunning = true;
    score = 0;
    lives = 3;
    obstacles = [];
    spawnTimer = 0;

    updateHearts();
    loop();
}

// -------------------- GAME LOOP --------------------
function loop() {
    if (!gameRunning) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawCar();
    updateObstacles();
    drawObstacles();

    score++;
    scoreDiv.textContent = "Score: " + score;

    requestAnimationFrame(loop);
}

// -------------------- DRAW CAR --------------------
function drawCar() {
    ctx.drawImage(carImg, car.x, car.y, car.width, car.height);
}

// -------------------- OBSTACLES --------------------
function updateObstacles() {
    spawnTimer++;

    // Spawn every 50 frames
    if (spawnTimer > 50) {
        obstacles.push({
            x: Math.random() * (canvas.width - 70),
            y: -100,
            width: 70,
            height: 100,
            speed: 6
        });
        spawnTimer = 0;
    }

    for (let i = obstacles.length - 1; i >= 0; i--) {
        let o = obstacles[i];
        o.y += o.speed;

        // Collision
        if (isColliding(car, o)) {
            obstacles.splice(i, 1);
            lives--;
            updateHearts();

            if (lives <= 0) gameOver();
        }

        // Remove offscreen
        if (o.y > canvas.height + 100) obstacles.splice(i, 1);
    }
}

function drawObstacles() {
    obstacles.forEach(o => {
        ctx.drawImage(obstacleImg, o.x, o.y, o.width, o.height);
    });
}

// -------------------- COLLISION --------------------
function isColliding(a, b) {
    return (
        a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y
    );
}

// -------------------- HEARTS --------------------
function updateHearts() {
    heartsDiv.innerHTML = "❤️".repeat(lives);
}

// -------------------- GAME OVER --------------------
function gameOver() {
    gameRunning = false;

    overlayTitle.textContent = "Game Over!";
    overlayText.textContent = "Your score: " + score;
    overlay.style.display = "flex";

    bgm.pause();
}

// Restart button
restartBtn.addEventListener("click", () => {
    overlay.style.display = "none";
    startGame();
});

// -------------------- CONTROLS --------------------

// Touch buttons
document.getElementById("leftBtn").addEventListener("touchstart", () => {
    car.x -= car.speed * 2;
});
document.getElementById("rightBtn").addEventListener("touchstart", () => {
    car.x += car.speed * 2;
});

// Keyboard support
document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") car.x -= car.speed;
    if (e.key === "ArrowRight") car.x += car.speed;
});
