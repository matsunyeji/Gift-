/* Game logic for game.html
   - Scrolling background (assets/bg.png)
   - Car sprite assets/car.png
   - 3 lives (hearts) and Game Over
   - Controls: keyboard arrows, touch buttons and drag on canvas
   - Music starts if sessionStorage gesture exists or on first tap
*/

(function(){
  const CANVAS_BASE_W = 420, CANVAS_BASE_H = 720;
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d', { alpha: true });
  const bg = new Image(); bg.src = 'assets/bg.png';
  const carImg = new Image(); carImg.src = 'assets/car.png';
  const audio = document.getElementById('bgm');

  const overlay = document.getElementById('overlay');
  const overlayTitle = document.getElementById('overlayTitle');
  const overlayText = document.getElementById('overlayText');
  const restartBtn = document.getElementById('restart');
  const backBtn = document.getElementById('back');
  const leftBtn = document.getElementById('leftBtn');
  const rightBtn = document.getElementById('rightBtn');
  const heartsBox = document.getElementById('hearts');
  const scoreEl = document.getElementById('score');

  let w = CANVAS_BASE_W, h = CANVAS_BASE_H, scale = 1;
  let car = { x: 0, y: 0, w: 80, h: 120 };
  let keys = { left:false, right:false };
  let pointerDown = false;
  let lives = 3;
  let score = 0;
  let obstacles = [];
  let lastSpawn = 0;
  let running = false;
  let offsetY = 0;

  function resize(){
    const vw = Math.min(window.innerWidth, 980);
    scale = vw / CANVAS_BASE_W;
    canvas.style.width = (CANVAS_BASE_W*scale) + 'px';
    canvas.style.height = (CANVAS_BASE_H*scale) + 'px';
    w = CANVAS_BASE_W; h = CANVAS_BASE_H;
    canvas.width = w; canvas.height = h;
    car.w = Math.round(w * 0.14);
    car.h = Math.round(car.w * 1.35);
    car.x = (w - car.w)/2;
    car.y = h - car.h - Math.round(h*0.04);
  }

  function renderHearts(){
    heartsBox.innerHTML = '';
    for(let i=0;i<3;i++){
      const d = document.createElement('div'); d.className='heart';
      d.style.opacity = (i < lives) ? '1' : '0.25';
      heartsBox.appendChild(d);
    }
  }

  function tryStartMusic(){
    const had = sessionStorage.getItem('birthday_gesture');
    if(had) audio.play().catch(()=>{});
  }
  document.addEventListener('pointerdown', ()=> { audio.play().catch(()=>{}); }, { once: true });

  function spawnObstacle(){
    const width = Math.round(w * 0.14);
    const x = Math.random() * (w - width - 20) + 10;
    const speed = 2 + Math.random()*2 + score*0.01;
    obstacles.push({ x, y: -80, w: width, h: Math.round(width*0.6), speed });
  }

  function checkCollision(a,b){ return !(a.x + a.w < b.x || a.x > b.x + b.w || a.y + a.h < b.y || a.y > b.y + b.h); }

  function update(dt){
    if(!running) return;
    // movement
    const moveSpeed = Math.max(4, w*0.006) * (1 + Math.min(1, score/100));
    if(keys.left) car.x -= moveSpeed;
    if(keys.right) car.x += moveSpeed;
    car.x = Math.max(8, Math.min(car.x, w - car.w - 8));

    // scroll
    offsetY += 160 * dt * 0.001 * (1 + score*0.002);
    if(offsetY > h) offsetY -= h;

    // spawn
    if(performance.now() - lastSpawn > Math.max(400, 1000 - score*4)){
      if(Math.random() < 0.78) spawnObstacle();
      lastSpawn = performance.now();
    }

    // obstacles
    for(let i=obstacles.length-1;i>=0;i--){
      const o = obstacles[i];
      o.y += o.speed * (1 + score*0.005) * dt * 0.03;
      const carRect = {x: car.x, y: car.y, w: car.w, h: car.h};
      const oRect = {x: o.x, y: o.y, w: o.w, h: o.h};
      if(checkCollision(carRect, oRect)){
        obstacles.splice(i,1);
        lives = Math.max(0, lives-1);
        renderHearts();
        canvas.animate([{transform:'translateX(0)'},{transform:'translateX(-8px)'},{transform:'translateX(8px)'},{transform:'translateX(0)'}],{duration:260});
        if(lives === 0){ gameOver(); return; }
      } else if(o.y > h + 30) {
        obstacles.splice(i,1);
      }
    }

    // score grows with time
    score += Math.floor(dt * 0.01);
    scoreEl.textContent = 'Score: ' + score;
  }

  function draw(){
    // clear
    ctx.clearRect(0,0,w,h);

    // background tiled vertical for scrolling
    if(bg.complete){
      const imgW = bg.width, imgH = bg.height;
      const scaleBg = w / imgW;
      const bgHscale = imgH * scaleBg;
      const y1 = - (offsetY % bgHscale);
      ctx.drawImage(bg, 0, 0, imgW, imgH, 0, y1, w, bgHscale);
      ctx.drawImage(bg, 0, 0, imgW, imgH, 0, y1 + bgHscale, w, bgHscale);
    } else {
      ctx.fillStyle = '#071028';
      ctx.fillRect(0,0,w,h);
    }

    ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(0,0,w,h);

    // obstacles
    obstacles.forEach(o=>{
      ctx.save();
      ctx.fillStyle = '#333';
      ctx.strokeStyle = '#111';
      ctx.lineWidth = 2;
      ctx.fillRect(o.x, o.y, o.w, o.h);
      ctx.strokeRect(o.x, o.y, o.w, o.h);
      ctx.restore();
    });

    // car draw
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
  window.addEventListener('keydown', (e)=>{
    if(e.key === 'ArrowLeft') keys.left = true;
    if(e.key === 'ArrowRight') keys.right = true;
    if(e.key === ' ') { running = !running; if(!running) overlay.style.display = 'flex'; else overlay.style.display = 'none'; }
  });
  window.addEventListener('keyup', (e)=>{
    if(e.key === 'ArrowLeft') keys.left = false;
    if(e.key === 'ArrowRight') keys.right = false;
  });

  leftBtn.addEventListener('pointerdown', ()=> keys.left = true);
  leftBtn.addEventListener('pointerup', ()=> keys.left = false);
  rightBtn.addEventListener('pointerdown', ()=> keys.right = true);
  rightBtn.addEventListener('pointerup', ()=> keys.right = false);

  // canvas drag steering
  let pId = null;
  canvas.addEventListener('pointerdown', (e)=>{
    pointerDown = true; pId = e.pointerId; canvas.setPointerCapture(pId);
  });
  canvas.addEventListener('pointerup', (e)=>{
    pointerDown = false; if(pId !== null) canvas.releasePointerCapture(pId); pId = null; keys.left = keys.right = false;
  });
  canvas.addEventListener('pointermove', (e)=>{
    if(!pointerDown) return;
    const rect = canvas.getBoundingClientRect();
    const relX = (e.clientX - rect.left) * (canvas.width / rect.width);
    const target = relX - car.w/2;
    car.x += (target - car.x) * 0.25;
  });

  restartBtn.addEventListener('click', ()=> startGame());
  backBtn.addEventListener('click', ()=> { audio.pause(); sessionStorage.removeItem('birthday_gesture'); location.href = 'index.html'; });

  // Start logic on load
  resize(); renderHearts();
  tryStartMusic();

  // if gesture set previously we start quickly
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

  // spawn interval
  setInterval(()=> { if(running && Math.random() < 0.9) spawnObstacle(); }, 900);

  // confetti on score milestones
  setInterval(()=>{
    if(!running) return;
    if(score > 0 && score % 50 === 0){
      for(let i=0;i<14;i++){
        const sp = document.createElement('div');
        sp.style.position = 'fixed';
        sp.style.left = (Math.random()*100)+'vw';
        sp.style.top = (Math.random()*100)+'vh';
        sp.style.width = '8px'; sp.style.height = '8px';
        sp.style.borderRadius = '2px';
        sp.style.background = ['#ff6aa6','#ffd166','#6ee7b7','#8b5cf6'][Math.floor(Math.random()*4)];
        sp.style.zIndex = 9999; sp.style.pointerEvents = 'none';
        document.body.appendChild(sp);
        sp.animate([{ transform:'translateY(0) rotate(0deg)'},{ transform:'translateY(80px) rotate(180deg)' }], { duration: 1000 + Math.random()*800 });
        setTimeout(()=> sp.remove(), 1400);
      }
    }
  }, 1000);

  window.addEventListener('resize', resize);
})();
