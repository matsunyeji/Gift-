/* script.js — Game logic (cleaned) */
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
  const carImg = new Image(); carImg.src = 'car.png';
  const coneImg = new Image(); coneImg.src = 'cone.png';

  // audio (loop)
  const bgm = new Audio('music.mp3');
  bgm.loop = true;
  bgm.volume = 0.6;

  // helper to try play (will fail silently if blocked)
  function tryStartMusic() {
    bgm.play().catch(()=>{ /* autoplay blocked, will start on user gesture */ });
  }

  // game state
  let w = CANVAS_W, h = CANVAS_H, scale = 1;
  let car = { x: (w-80)/2, y: h - 150, w: 80, h: 120 };
  let keys = { left:false, right:false };
  let lives = 3;
  let score = 0;
  let obstacles = [];
  let lastSpawn = 0;
  let running = false;
  let offsetY = 0;

  // resize canvas for device width but keep internal coords fixed
  function resize(){
    const vw = Math.min(window.innerWidth - 32, 980);
    scale = vw / CANVAS_W;
    canvas.style.width = (CANVAS_W * scale) + 'px';
    canvas.style.height = (CANVAS_H * scale) + 'px';
    canvas.width = CANVAS_W; canvas.height = CANVAS_H;
    // reset car dimensions and position relative to canvas
    car.w = Math.round(CANVAS_W * 0.14);
    car.h = Math.round(car.w * 1.35);
    car.x = Math.round((w - car.w) / 2);
    car.y = h - car.h - 20;
  }
  window.addEventListener('resize', resize);
  resize();

  function renderHearts(){
    heartsBox.innerHTML = '';
    for(let i=0;i<3;i++){
      const d = document.createElement('div'); d.className = 'heart';
      d.style.opacity = (i < lives) ? '1' : '0.25';
      heartsBox.appendChild(d);
    }
  }

  // spawn a cone obstacle
  function spawnObstacle(){
    const width = Math.round(w * 0.14);
    const x = Math.random() * (w - width - 20) + 10;
    const speed = 2 + Math.random()*2 + score*0.01;
    obstacles.push({ 
      x, 
      y: -Math.round(width * 1.1), 
      w: width, 
      h: Math.round(width * 1.1), 
      speed,
      img: coneImg
    });
  }

  function checkCollision(a,b){
    return !(a.x + a.w < b.x || a.x > b.x + b.w || a.y + a.h < b.y || a.y > b.y + b.h);
  }

  function update(dt){
    if(!running) return;

    // movement
    const moveSpeed = Math.max(4, w*0.006) * (1 + Math.min(1, score/100));
    if(keys.left) car.x -= moveSpeed;
    if(keys.right) car.x += moveSpeed;
    car.x = Math.max(8, Math.min(car.x, w - car.w - 8));

    // spawn timing
    if(performance.now() - lastSpawn > Math.max(400, 1000 - score*4)){
      if(Math.random() < 0.78) spawnObstacle();
      lastSpawn = performance.now();
    }

    // obstacle updates & collisions
    for(let i=obstacles.length-1;i>=0;i--){
      const o = obstacles[i];
      o.y += o.speed * (1 + score*0.005) * dt * 0.03;
      const carRect = {x: car.x, y: car.y, w: car.w, h: car.h};
      const oRect = {x: o.x, y: o.y, w: o.w, h: o.h};
      if(checkCollision(carRect, oRect)){
        obstacles.splice(i,1);
        lives = Math.max(0, lives-1);
        renderHearts();
        // shake animation
        canvas.animate([{transform:'translateX(0)'},{transform:'translateX(-6px)'},{transform:'translateX(6px)'},{transform:'translateX(0)'}],{duration:220});
        if(lives === 0){ gameOver(); return; }
      } else if(o.y > h + 40){
        obstacles.splice(i,1);
        score++;
        scoreEl.textContent = 'Score: ' + score;
      }
    }
  }

  // drawing helpers
  function roundRectPath(ctx, x, y, w, h, r) {
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  function roundRectFill(ctx, x, y, w, h, r) {
    ctx.beginPath();
    roundRectPath(ctx, x, y, w, h, r);
    ctx.fill();
  }

  function draw(){
    // clear
    ctx.clearRect(0,0,w,h);

    // overlay tint to make sprites pop
    ctx.fillStyle = 'rgba(255,255,255,0.04)'; ctx.fillRect(0,0,w,h);

    // obstacles (draw cone image if loaded)
    obstacles.forEach(o => {
      if (o.img && o.img.complete) {
        ctx.drawImage(o.img, o.x, o.y, o.w, o.h);
      } else {
        // fallback simple cone-ish rectangle
        ctx.save();
        ctx.fillStyle = '#ffb347';
        roundRectFill(ctx, o.x, o.y, o.w, o.h, 8);
        ctx.restore();
      }
    });

    // draw car
    if(carImg.complete){
      ctx.drawImage(carImg, 0,0,carImg.width,carImg.height, Math.round(car.x), Math.round(car.y), Math.round(car.w), Math.round(car.h));
    } else {
      ctx.fillStyle = '#ff3a6e';
      roundRectFill(ctx, Math.round(car.x), Math.round(car.y), Math.round(car.w), Math.round(car.h * 0.6), 10);
    }
  }

  let last = performance.now();
  function loop(now){
    const dt = now - last;
    update(dt);
    draw();
    last = now;
    if (running) requestAnimationFrame(loop);
  }

  function startGame(){
    running = true;
    overlay.style.display = 'none';
    score = 0; lives = 3; obstacles = [];
    renderHearts();
    scoreEl.textContent = 'Score: 0';
    last = performance.now();
    requestAnimationFrame(loop);
    // only attempt play here; if browser blocks, the pointerdown listener will handle it
    tryStartMusic();
  }

  function gameOver(){
    running = false;
    overlay.style.display = 'flex';
    overlayTitle.textContent = 'Game Over';
    overlayText.textContent = `Final score: ${score}`;
  }

  // inputs
  window.addEventListener('keydown', e => {
    if(e.key === 'ArrowLeft') keys.left = true;
    if(e.key === 'ArrowRight') keys.right = true;
    if(e.key === ' ') { running = !running; overlay.style.display = running ? 'none' : 'flex'; }
  });
  window.addEventListener('keyup', e => {
    if(e.key === 'ArrowLeft') keys.left = false;
    if(e.key === 'ArrowRight') keys.right = false;
  });

  // touch controls
  document.getElementById('leftBtn').addEventListener('pointerdown', ()=> keys.left = true);
  document.getElementById('leftBtn').addEventListener('pointerup', ()=> keys.left = false);
  document.getElementById('rightBtn').addEventListener('pointerdown', ()=> keys.right = true);
  document.getElementById('rightBtn').addEventListener('pointerup', ()=> keys.right = false);

  // canvas drag steering
  let dragging = false, ptrId = null;
  canvas.addEventListener('pointerdown', (e) => { dragging = true; ptrId = e.pointerId; canvas.setPointerCapture(ptrId); });
  canvas.addEventListener('pointerup', (e) => { dragging = false; if(ptrId !== null) canvas.releasePointerCapture(ptrId); ptrId = null; keys.left = keys.right = false; });
  canvas.addEventListener('pointermove', (e) => {
    if(!dragging) return;
    const rect = canvas.getBoundingClientRect();
    const relX = (e.clientX - rect.left) * (canvas.width / rect.width);
    const target = relX - car.w/2;
    car.x += (target - car.x) * 0.25;
  });

  restartBtn.addEventListener('click', ()=> startGame());

  // start / overlay logic
  renderHearts();

  // If the user already gave a gesture earlier, auto-start the game and music
  if(sessionStorage.getItem('birthday_gesture')){
    tryStartMusic();
    setTimeout(()=> startGame(), 120);
  } else {
    // show overlay and wait for first tap anywhere (this enables audio)
    overlay.style.display = 'flex';
    overlayTitle.textContent = 'Tap to Start';
    overlayText.textContent = 'Tap anywhere to begin (this enables music)';

    function firstStart() {
      sessionStorage.setItem('birthday_gesture','yes');
      tryStartMusic();
      startGame();
      document.removeEventListener('pointerdown', firstStart);
    }
    document.addEventListener('pointerdown', firstStart, { once: true });
  }

  // spawn loop
  setInterval(()=> { if(running && Math.random() < 0.9) spawnObstacle(); }, 900);

})();
