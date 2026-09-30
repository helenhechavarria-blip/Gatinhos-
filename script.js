document.addEventListener('DOMContentLoaded', () => {
  // --- 1. Controles de Accesibilidad ---
  const btnAumentar = document.getElementById('btnAumentarFonte');
  const btnDiminuir = document.getElementById('btnDiminuirFonte');
  let tamanhoFonte = 16;

  btnAumentar.addEventListener('click', () => {
    if (tamanhoFonte < 24) {
      tamanhoFonte += 2;
      document.documentElement.style.fontSize = `${tamanhoFonte}px`;
    }
  });

  btnDiminuir.addEventListener('click', () => {
    if (tamanhoFonte > 12) {
      tamanhoFonte -= 2;
      document.documentElement.style.fontSize = `${tamanhoFonte}px`;
    }
  });

  // --- 2. Modo Noche y Modo Normal ---
  const btnTema = document.getElementById('btnTema');
  btnTema.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    btnTema.textContent = isDark ? '☀️ Modo Normal' : '🌙 Modo Noche';
  });

  // --- 3. Audio y Efectos de Sonido ---
  const btnMusic = document.getElementById('btnMusic');
  let audioCtx = null;
  let isPlaying = false;
  let intervalId = null;

  function initAudio() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
  }

  function playJumpSound() {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(600, audioCtx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.15);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.15);
  }

  function playHitSound() {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.3);
  }

  function playRelaxingTone() {
    if (!audioCtx || !isPlaying) return;
    const notes = [261.63, 329.63, 392.00, 440.00, 523.25];
    const freq = notes[Math.floor(Math.random() * notes.length)];

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

    gain.gain.setValueAtTime(0, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.02, audioCtx.currentTime + 0.6);
    gain.gain.exponentialRampToValueAtTime(0.0005, audioCtx.currentTime + 2.8);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 2.8);
  }

  btnMusic.addEventListener('click', () => {
    initAudio();
    if (!isPlaying) {
      audioCtx.resume();
      isPlaying = true;
      intervalId = setInterval(playRelaxingTone, 1600);
      btnMusic.textContent = '⏸️ Pausar Música';
    } else {
      clearInterval(intervalId);
      isPlaying = false;
      btnMusic.textContent = '🎵 Música Relajante';
    }
  });

  // --- 4. Motor del Juego y Selección de Personajes ---
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  const genderSelect = document.getElementById('genderSelect');

  let catColor = '#FFFFFF';
  let catAccent = '#FFB6C1';
  let catSpots = [];

  genderSelect.addEventListener('change', (e) => {
    if (e.target.value === 'female') {
      catColor = '#FFFFFF';
      catAccent = '#FFB6C1';
      catSpots = [];
    } else if (e.target.value === 'male') {
      catColor = '#FFB03B';
      catAccent = '#E67E22';
      catSpots = [];
    } else if (e.target.value === 'calico') {
      catColor = '#FDFEFE';
      catAccent = '#2C3E50';
      catSpots = [
        { x: 12, y: 20, r: 8, color: '#E67E22' },
        { x: 28, y: 26, r: 6, color: '#2C3E50' },
        { x: 34, y: 8, r: 5, color: '#F39C12' }
      ];
    }
  });

  let player = { x: 60, y: 150, width: 45, height: 40, dy: 0, gravity: 0.65, jumpPower: -11, grounded: false };
  let obstacles = [];
  let clouds = [
    { x: 100, y: 40, speed: 0.5 },
    { x: 350, y: 20, speed: 0.3 },
    { x: 600, y: 50, speed: 0.4 }
  ];
  let frame = 0;
  let score = 0;
  let highScore = localStorage.getItem('catRunnerHighScore') || 0;
  let gameSpeed = 5.5;
  let gameOver = false;

  function jump() {
    initAudio();
    if (player.grounded && !gameOver) {
      player.dy = player.jumpPower;
      player.grounded = false;
      playJumpSound();
    } else if (gameOver) {
      resetGame();
    }
  }

  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code === 'ArrowUp') {
      e.preventDefault();
      jump();
    }
  });

  canvas.addEventListener('click', () => jump());
  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    jump();
  });

  function resetGame() {
    player.y = 150;
    player.dy = 0;
    obstacles = [];
    score = 0;
    gameSpeed = 5.5;
    frame = 0;
    gameOver = false;
    animate();
  }

  function drawCat(x, y, color, accent) {
    ctx.save();
    ctx.translate(x, y);

    // Cuerpo
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(20, 25, 20, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    // Manchas si es Calicó
    if (catSpots.length > 0) {
      catSpots.forEach(spot => {
        ctx.fillStyle = spot.color;
        ctx.beginPath();
        ctx.arc(spot.x, spot.y, spot.r, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    // Cabeza
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(32, 14, 12, 0, Math.PI * 2);
    ctx.fill();

    // Orejas
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(24, 6); ctx.lineTo(28, -4); ctx.lineTo(32, 6);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(34, 6); ctx.lineTo(38, -4); ctx.lineTo(42, 6);
    ctx.fill();

    // Interior de Orejas
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.moveTo(26, 6); ctx.lineTo(28, 0); ctx.lineTo(30, 6);
    ctx.fill();

    // Ojos
    ctx.fillStyle = '#2C3E50';
    ctx.beginPath();
    ctx.arc(36, 12, 2, 0, Math.PI * 2);
    ctx.fill();

    // Nariz
    ctx.fillStyle = '#FFB6C1';
    ctx.beginPath();
    ctx.arc(40, 15, 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Cola
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(2, 22);
    ctx.quadraticCurveTo(-8, 10 + Math.sin(frame * 0.1) * 5, -5, 2);
    ctx.stroke();

    // Patas
    ctx.strokeStyle = color;
    ctx.lineWidth = 3.5;
    let legOffset = player.grounded ? Math.sin(frame * 0.3) * 6 : 0;

    ctx.beginPath();
    ctx.moveTo(10, 35); ctx.lineTo(10 + legOffset, 42);
    ctx.moveTo(18, 35); ctx.lineTo(18 - legOffset, 42);
    ctx.moveTo(26, 35); ctx.lineTo(26 + legOffset, 42);
    ctx.moveTo(32, 35); ctx.lineTo(32 - legOffset, 42);
    ctx.stroke();

    ctx.restore();
  }

  function drawFishSkeleton(x, y) {
    ctx.save();
    ctx.translate(x, y);

    ctx.fillStyle = '#7F8C8D';
    ctx.beginPath();
    ctx.moveTo(30, 15); ctx.lineTo(45, 5); ctx.lineTo(45, 25);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#2C3E50';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(38, 10); ctx.lineTo(42, 14);
    ctx.moveTo(42, 10); ctx.lineTo(38, 14);
    ctx.stroke();

    ctx.strokeStyle = '#BDC3C7';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(5, 15); ctx.lineTo(30, 15);
    ctx.stroke();

    ctx.lineWidth = 2;
    for (let i = 10; i <= 25; i += 5) {
      ctx.beginPath();
      ctx.moveTo(i, 8); ctx.lineTo(i, 22);
      ctx.stroke();
    }

    ctx.fillStyle = '#7F8C8D';
    ctx.beginPath();
    ctx.moveTo(5, 15); ctx.lineTo(0, 5); ctx.lineTo(0, 25);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = 'rgba(46, 204, 113, 0.4)';
    ctx.beginPath();
    ctx.arc(20, -2 + Math.sin(frame * 0.1) * 3, 6, 0, Math.PI * 2);
    ctx.arc(32, -5 + Math.cos(frame * 0.1) * 3, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  function drawCloud(x, y) {
    ctx.fillStyle = document.body.classList.contains('dark-mode') ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.6)';
    ctx.beginPath();
    ctx.arc(x, y, 12, 0, Math.PI * 2);
    ctx.arc(x + 10, y - 8, 14, 0, Math.PI * 2);
    ctx.arc(x + 24, y, 12, 0, Math.PI * 2);
    ctx.fill();
  }

  function animate() {
    if (gameOver) {
      playHitSound();
      if (Math.floor(score / 10) > highScore) {
        highScore = Math.floor(score / 10);
        localStorage.setItem('catRunnerHighScore', highScore);
      }

      ctx.fillStyle = document.body.classList.contains('dark-mode') ? '#ffffff' : '#0f172a';
      ctx.font = '700 24px "Chakra Petch"';
      ctx.textAlign = 'center';
      ctx.fillText('¡JUEGO TERMINADO!', canvas.width / 2, 100);
      ctx.font = '16px "Inter"';
      ctx.fillText('Presiona Espacio o toca para reiniciar', canvas.width / 2, 135);
      ctx.textAlign = 'left';
      return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    clouds.forEach(c => {
      c.x -= c.speed;
      if (c.x < -40) c.x = canvas.width + 20;
      drawCloud(c.x, c.y);
    });

    ctx.strokeStyle = getComputedStyle(document.body).getPropertyValue('--primary-neon').trim();
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 192); ctx.lineTo(canvas.width, 192);
    ctx.stroke();

    player.dy += player.gravity;
    player.y += player.dy;

    if (player.y >= 150) {
      player.y = 150;
      player.dy = 0;
      player.grounded = true;
    }

    drawCat(player.x, player.y, catColor, catAccent);

    frame++;
    if (frame % Math.max(50, Math.floor(100 - gameSpeed * 3)) === 0) {
      obstacles.push({ x: canvas.width, y: 165, width: 45, height: 25 });
    }

    for (let i = 0; i < obstacles.length; i++) {
      let obs = obstacles[i];
      obs.x -= gameSpeed;

      drawFishSkeleton(obs.x, obs.y);

      if (
        player.x + 10 < obs.x + obs.width &&
        player.x + player.width - 5 > obs.x &&
        player.y + 10 < obs.y + obs.height &&
        player.y + player.height > obs.y
      ) {
        gameOver = true;
      }
    }

    if (obstacles.length > 0 && obstacles[0].x < -50) {
      obstacles.shift();
    }

    score++;
    gameSpeed = 5.5 + Math.floor(score / 300) * 0.5;

    let currentScore = Math.floor(score / 10);
    ctx.fillStyle = document.body.classList.contains('dark-mode') ? '#ffffff' : '#0f172a';
    ctx.font = '600 15px "Chakra Petch"';
    ctx.fillText(`PUNTOS: ${currentScore}`, canvas.width - 150, 30);
    ctx.fillText(`MÁXIMO: ${Math.max(currentScore, highScore)}`, canvas.width - 150, 50);

    requestAnimationFrame(animate);
  }

  animate();
});   