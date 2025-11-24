const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let tota = { x: 80, y: 200, radius: 15, gravity: 0.4, lift: -8, velocity: 0, width: 50, height: 50 };
let pipes = [];
let frame = 0;
let score = 0;
let gameStarted = false;
let gameOver = false;
let paused = false;

const PIPE_GAP = 170;
const pipeWidth = 60;
let highScores = JSON.parse(localStorage.getItem("totaHighScores")) || [];

const totaImg = new Image();
totaImg.src = "./public/Sinchan face.png"; // sinchan bird

const pipeImg = new Image();
pipeImg.src = "./public/pipe photo chatgpt.png"; // your cartoon pipe image file

// --- MENU BUTTON FUNCTIONS ---

function showHighScore() {
  const modal = document.getElementById('modalOverlay');
  const title = document.getElementById('modalTitle');
  const text = document.getElementById('modalText');
  
  // Get the highest score (first element since we sort descending)
  let bestScore = highScores.length > 0 ? highScores[0] : 0;

  title.innerText = "🏆 Highest Score";
  text.innerText = "Tera abhi tak ka best score hei: " + bestScore;
  
  modal.style.display = 'flex';
}

function showHelp() {
  const modal = document.getElementById('modalOverlay');
  const title = document.getElementById('modalTitle');
  const text = document.getElementById('modalText');

  title.innerText = "Help";
  text.innerHTML = "Tap <b>Spacebar</b> or <b>Click</b> to jump.<br>Pipes se bach ke rehna!<br> <b>P</b> dabake pause kar sakta hei.";
  
  modal.style.display = 'flex';
}

function showAbout() {
  const modal = document.getElementById('modalOverlay');
  const title = document.getElementById('modalTitle');
  const text = document.getElementById('modalText');

  title.innerText = "About";
  text.innerText = "Tota Urr - Made by TIRTHA.\nVersion 1.0";
  
  modal.style.display = 'flex';
}

function closeModal() {
  document.getElementById('modalOverlay').style.display = 'none';
}

// --- GAME LOGIC ---

function drawTota() {
  if (!totaImg.complete) return;
  ctx.drawImage(
    totaImg,
    tota.x - tota.width / 2,
    tota.y - tota.height / 2,
    tota.width,
    tota.height
  );
}

// 🧱 DRAW PIPES WITH CARTOON IMAGE
function drawPipes() {
  pipes.forEach(pipe => {
    // Top pipe
    const topHeight = pipe.top;
    const bottomHeight = pipe.bottom;

    // Draw upper pipe (upside down image)
    ctx.save();
    ctx.translate(pipe.x + pipeWidth / 2, topHeight);
    ctx.rotate(Math.PI); // flip vertically
    ctx.drawImage(pipeImg, -pipeWidth / 2, 0, pipeWidth, 300);
    ctx.restore();

    // Draw bottom pipe
    ctx.drawImage(pipeImg, pipe.x, canvas.height - bottomHeight, pipeWidth, 300);
  });
}

function createPipe() {
  const top = Math.random() * (canvas.height - PIPE_GAP - 100) + 50;
  const bottom = canvas.height - top - PIPE_GAP;
  pipes.push({ x: canvas.width, width: pipeWidth, top, bottom });
}

function updatePipes() {
  pipes.forEach(pipe => pipe.x -= 2);
  if (pipes.length && pipes[0].x + pipes[0].width < 0) {
    pipes.shift();
    score++;
  }
  if (frame % 90 === 0) createPipe();
}

function detectCollision() {
  for (let pipe of pipes) {
    if (
      tota.x + tota.radius > pipe.x &&
      tota.x - tota.radius < pipe.x + pipe.width &&
      (tota.y - tota.radius < pipe.top ||
        tota.y + tota.radius > canvas.height - pipe.bottom)
    ) {
      gameOver = true;
    }
  }
  if (tota.y + tota.radius >= canvas.height || tota.y - tota.radius <= 0) {
    gameOver = true;
  }
}

function drawScore() {
  ctx.fillStyle = "#fff";
  ctx.font = "24px Poppins";
  ctx.fillText("Score: " + score, 20, 40);
}

function saveHighScore(newScore) {
  highScores.push(newScore);
  highScores.sort((a, b) => b - a);
  highScores = highScores.slice(0, 2);
  localStorage.setItem("totaHighScores", JSON.stringify(highScores));
}

function drawGameOverScreen() {
  try {
    const bgm = document.getElementById('bgm');
    bgm.pause();
    bgm.currentTime = 0;
  } catch(e){}

  try {
    const gameOverSound = document.getElementById("gameOverMusic");
    gameOverSound.currentTime = 0;
    gameOverSound.play().catch(()=>{});
  } catch(e){}

  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#fff";
  ctx.font = "35px Poppins";
  ctx.fillText("Kya yaar", 135, 160);
  ctx.fillText("har gaya bhai!", 100, 200);
  ctx.font = "25px Poppins";
  ctx.fillText("Tera Score: " + score, 140, 265);
  ctx.font = "20px Poppins";
  ctx.fillText("Koi na bhai, firse khel le", 100, 310);
  ctx.fillText("Game made by TIRTHA", 100, 485);
}

function update() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (gameOver) {
    drawGameOverScreen();
    return;
  }

  if (paused) {
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#fff";
    ctx.font = "35px Poppins";
    ctx.fillText("rok k rekha hei bhai", 60, 250);
    ctx.fillText("jaldi bapas aah...", 80, 290);
    drawPauseButton();
    requestAnimationFrame(update);
    return;
  }

  tota.velocity += tota.gravity;
  tota.y += tota.velocity;

  drawPipes();
  updatePipes();
  detectCollision();
  drawTota();
  drawScore();
  drawPauseButton();

  frame++;
  requestAnimationFrame(update);
}

function resetGame() {
  tota.y = 200;
  tota.velocity = 0;
  pipes = [];
  frame = 0;
  if (gameOver) saveHighScore(score);
  score = 0;
  gameOver = false;
  gameStarted = true;

  const bgm = document.getElementById("bgm");
  bgm.currentTime = 0;
  bgm.play().catch(()=>{});

  update();
}

function jump() {
  if (!gameStarted || gameOver) {
    resetGame();
    return;
  }
  if (!paused) tota.velocity = tota.lift;
}

function togglePause() {
  paused = !paused;
  try {
    const m = document.getElementById('bgm');
    if (paused) m.pause(); else m.play();
  } catch(e){}
}

function drawPauseButton() {
  const x = canvas.width - 40;
  const y = 20;
  ctx.fillStyle = "#fff";
  if (paused) {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 20, y + 10);
    ctx.lineTo(x, y + 20);
    ctx.closePath();
    ctx.fill();
  } else {
    ctx.fillRect(x, y, 5, 20);
    ctx.fillRect(x + 10, y, 5, 20);
  }
}

document.addEventListener("keydown", e => {
  if (e.code === "Space") jump();
  if (e.code === "KeyP") togglePause();
});

document.addEventListener("click", e => {
    // Ignore clicks if clicking on the lobby buttons or modal
  if (e.target.closest('#lobby') || e.target.closest('#modalOverlay')) return;
  const rect = canvas.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  const clickY = e.clientY - rect.top;

  if (clickX > canvas.width - 50 && clickY < 50) togglePause();
  else jump();
});

update();

function startGame() {
  const lobby = document.getElementById('lobby');
  lobby.style.display = 'none';
  gameStarted = true;

  const bgm = document.getElementById('bgm');
  if (bgm) {
    bgm.volume = 0.5;
    bgm.play().catch(()=>{});
  }

  resetGame();
}


