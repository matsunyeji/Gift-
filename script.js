(() => {
  const CANVAS_W = 420, CANVAS_H = 720;
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d', { alpha: true });

  // HUD elements
  const overlay = document.getElementById('overlay');
  const overlayTitle = document.getElementById('overlayTitle');
  const overlayText = document.getElementById('overlayText');
  const restartBtn = document.getElementById('restart');
  const heartsBox = document.getElementById('hearts');
  const scoreEl = document.getElementById('score');

  // assets
  const carImg = new Image();
  carImg.src = 'car.png';

  const coneImg = new Image();
  coneImg.src = 'cone.png';

  // audio (one-time)
  const bgm = document.getElementById("bgm");
  bgm.volume = 0.6;

  function tryStartMusic() {
    bgm.play().catch(() => {});
  }

  // game state
  let w = CANVAS_W, h = CANVAS_H, scale = 1;
  let car = { x: (w - 80) / 2, y: h - 150, w: 80, h: 120 };
  let keys = { left: false, right: false };
  let lives = 3;
  let score = 0;
  let obstacles = [];
  let lastSpawn = 0;
  let running = false;

  function resize() {
    const vw = Math.min(window.innerWidth - 32, 980);
    scale = vw / CANVAS_W;
    canvas.style.width = (CANVAS_W * scale) + 'px';
    canvas.style.height = (CANVAS_H * scale) + 'px';

    canvas.width = CANVAS_W;
    canvas.height = CANVAS_H;

    car.w = Math.round(CANVAS_W * 0.14);
    car.h = Math.round(car.w * 1.35);
    car.x = Math.round((w - car.w) / 2);
    car.y = h - car.h - 20;
  }
  window.addEventListener('resize', resize);
  resize();

  function renderHearts() {
    heartsBox.innerHTML = '';
    for (let i = 0; i < 3; i++) {
      const d = document.createElement('div');
      d.className = 'heart';
      d.style.opacity = (i < lives) ? '1' : '0.25';
      heartsBox.appendChild(d);
    }
  }

  function spawnObstacle() {
    const width = Math.round(w * 0.14);
    const x = Math.random() * (w - width - 20) + 10;
    const speed = 2 + Math.random() * 2 + score * 0.01;
    obstacles.push({
      x,
      y: -Math.round(width * 1.1),
      w: width,
      h: Math.round(width * 1.1),
      speed,
      img: coneImg
    });
  }

  function checkCollision(a, b) {
    return !(a.x + a.w < b.x ||
             a.x > b.x + b.w ||
             a.y + a.h < b.y ||
             a.y > b.y + b.h);
  }

  function update(dt) {
    if (!running) return;

    const moveSpeed = Math.max(4, w * 0.006) * (1 + Math.min(1, score / 100));
    if (keys.left) car.x -= moveSpeed;
    if (keys.right) car.x += moveSpeed;
    car.x = Math.max(8, Math.min(car.x, w - car.w - 8));

    if (performance.now() - lastSpawn > Math.max(400, 1000 - score * 4)) {
      if (Math.random() < 0.78) spawnObstacle();
      lastSpawn = performance.now();
    }

    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.y += o.speed * dt * 0.03 * (1 + score * 0.005);

      if (checkCollision(car, o)) {
        obstacles.splice(i, 1);

        lives--;
        renderHearts();

        canvas.animate(
          [
            { transform: 'translateX(0)' },
            { transform: 'translateX(-6px)' },
            { transform: 'translateX(6px)' },
            { transform: 'translateX(0)' }
          ],
          { duration: 220 }
        );

        if (lives === 0) {
          gameOver();
          return;
        }
        continue;
      }

      if (o.y > h + 40) {
        obstacles.splice(i, 1);
        score++;
        scoreEl.textContent = "Score: " + score;
      }
    }
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);

    obstacles.forEach(o => {
      if (o.img.complete) {
        ctx.drawImage(o.img, o.x, o.y, o.w, o.h);
      } else {
        ctx.fillStyle = '#ffb347';
        ctx.fillRect(o.x, o.y, o.w, o.h);
      }
    });

    if (carImg.complete) {
      ctx.drawImage(carImg, car.x, car.y, car.w, car.h);
    } else {
      ctx.fillStyle = "#ff3a6e";
      ctx.fillRect(car.x, car.y, car.w, car.h * 0.6);
    }
  }

  let last = performance.now();
  function loop(now) {
    const dt = now - last;
    update(dt);
    draw();
    last = now;
    if (running) requestAnimationFrame(loop);
  }

  function startGame() {
    running = true;
    overlay.style.display = 'none';

    lives = 3;
    score = 0;
    obstacles = [];

    renderHearts();
    scoreEl.textContent = "Score: 0";

    last = performance.now();
    requestAnimationFrame(loop);

    tryStartMusic();
  }

  function gameOver() {
    running = false;
    overlay.style.display = 'flex';
    overlayTitle.textContent = 'Game Over';
    overlayText.textContent = `Final score: ${score}`;
  }

  // keyboard
  window.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') keys.left = true;
    if (e.key === 'ArrowRight') keys.right = true;
  });
  window.addEventListener('keyup', e => {
    if (e.key === 'ArrowLeft') keys.left = false;
    if (e.key === 'ArrowRight') keys.right = false;
  });

  // touch buttons
  leftBtn.addEventListener("pointerdown", () => keys.left = true);
  leftBtn.addEventListener("pointerup", () => keys.left = false);
  rightBtn.addEventListener("pointerdown", () => keys.right = true);
  rightBtn.addEventListener("pointerup", () => keys.right = false);

  restartBtn.addEventListener("click", startGame);

  // first tap starts game + audio
  overlay.style.display = 'flex';
  overlayTitle.textContent = 'Tap to Start';
  overlayText.textContent = 'Tap anywhere to begin (audio enabled)';

  function firstStart() {
    tryStartMusic();
    startGame();
    document.removeEventListener('pointerdown', firstStart);
  }

  document.addEventListener('pointerdown', firstStart, { once: true });

  setInterval(() => {
    if (running && Math.random() < 0.9) spawnObstacle();
  }, 900);

  renderHearts();
})();
