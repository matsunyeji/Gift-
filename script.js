/* script.js — Game logic */
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

 
  const carImg = new Image(); carImg.src = 'car.png';
  const coneImg = new Image(); 
  coneImg.src = 'cone.png';

  // audio
  const bgm = new Audio('music.mp3');
  bgm.loop = true;

  // state
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
    // reset car
    car.w = Math.round(w * 0.14);
    car.h = Math.round(car.w * 1.35);
    car.x = (w - car.w) / 2;
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

  function tryStartMusic(){
    const had = sessionStorage.getItem('birthday_gesture');
    if(had) bgm.play().catch(()=>{});
  }
  // also attempt to play on first pointerdown if blocked
  document.addEventListener('pointerdown', ()=> bgm.play().catch(()=>{}), { once: true });

  function spawnObstacle(){
  const width = Math.round(w * 0.16); 
  const height = Math.round(width * 1.1); 
  const x = Math.random() * (w - width - 20) + 10;
  const speed = 2 + Math.random() * 2 + score * 0.01;

  obstacles.push({
    x,
    y: -height,
    w: width,
    h: height,
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

    // obstacles
    if(performance.now() - lastSpawn > Math.max(400, 1000 - score*4)){
      if(Math.random() < 0.78) spawnObstacle();
      lastSpawn = performance.now();
    }

    for(let i=obstacles.length-1;i>=0;i--){
      const o = obstacles[i];
      o.y += o.speed * (1 + score*0.005) * dt * 0.03;
      const carRect = {x: car.x, y: car.y, w: car.w, h: car.h};
      const oRect = {x: o.x, y: o.y, w: o.w, h: o.h};
      if(checkCollision(carRect, oRect)){
        obstacles.splice(i,1);
        lives = Math.max(0, lives-1);
        renderHearts();
        // shake
        canvas.animate([{transform:'translateX(0)'},{transform:'translateX(-6px)'},{transform:'translateX(6px)'},{transform:'translateX(0)'}],{duration:220});
        if(lives === 0){ gameOver(); return; }
      } else if(o.y > h + 40){
        obstacles.splice(i,1);
        score++;
        scoreEl.textContent = 'Score: ' + score;
      }
    }
  }

  function draw(){
    // clear
    ctx.clearRect(0,0,w,h);

    // draw background image tiled vertically for a scrolling feel
    // Background now handled by CSS (#sky and #road)


    // overlay tint to make sprites pop
    ctx.fillStyle = 'rgba(255,255,255,0.06)'; ctx.fillRect(0,0,w,h);

    // obstacles
obstacles.forEach(o => {
  if (o.img && o.img.complete) {
    ctx.drawImage(o.img, o.x, o.y, o.w, o.h);
  } else {
    // fallback
    ctx.fillStyle = '#ff9933';
    ctx.fillRect(o.x, o.y, o.w, o.h);
  }
});


    // draw car
    if(carImg.complete){
      ctx.drawImage(carImg, 0,0,carImg.width,carImg.height, Math.round(car.x), Math.round(car.y), Math.round(car.w), Math.round(car.h));
    } else {
      ctx.fillStyle = '#ff3a6e';
      ctx.fillRect(Math.round(car.x), Math.round(car.y), Math.round(car.w), Math.round(car.h));
    }
  }

  let last = performance.now();
  function loop(now){
    const dt = now - last;
    update(dt);
    draw();
    last = now;
    requestAnimationFrame(loop);
  }

  function startGame(){
    running = true;
    overlay.style.display = 'none';
    score = 0; lives = 3; obstacles = [];
    renderHearts();
    scoreEl.textContent = 'Score: 0';
    last = performance.now();
    requestAnimationFrame(loop);
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
  tryStartMusic();

  if(sessionStorage.getItem('birthday_gesture')){
    setTimeout(()=> startGame(), 90);
  } else {
    overlay.style.display = 'flex';
    overlayTitle.textContent = 'Tap to Start';
    overlayText.textContent = 'Tap anywhere to begin (this enables music)';
    function firstStart(){
      startGame();
      document.removeEventListener('pointerdown', firstStart);
    }
    document.addEventListener('pointerdown', firstStart, { once: true });
  }

  // spawn loop
  setInterval(()=> { if(running && Math.random() < 0.9) spawnObstacle(); }, 900);

})();
