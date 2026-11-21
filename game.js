const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const statusEl = document.getElementById("status");

let handleInput;
let updateGame;
let getState;

function controlFromEvent(event) {
  const code = event.code;
  if (code === "Space" || code === "ArrowLeft" || code === "ArrowRight" || code === "ArrowUp" || code === "ArrowDown") {
    return code;
  }
  if (event.key === "ArrowUp" || event.key === "Up") {
    return "ArrowUp";
  }
  if (event.key === "ArrowDown" || event.key === "Down") {
    return "ArrowDown";
  }
  if (event.key === "ArrowLeft" || event.key === "Left") {
    return "ArrowLeft";
  }
  if (event.key === "ArrowRight" || event.key === "Right") {
    return "ArrowRight";
  }
  if (event.key === " ") {
    return "Space";
  }
  if (code === "KeyR" || event.key === "r" || event.key === "R") {
    return "KeyR";
  }
  return null;
}

async function start() {
  const pyodide = await loadPyodide();
  const source = await fetch("./game.py", { cache: "no-store" }).then((response) => {
    if (!response.ok) {
      throw new Error("Could not load game.py");
    }
    return response.text();
  });

  pyodide.runPython(source);
  handleInput = pyodide.globals.get("handle_input");
  updateGame = pyodide.globals.get("update");
  getState = pyodide.globals.get("get_state");

  document.addEventListener("keydown", (event) => {
    const key = controlFromEvent(event);
    if (!key) {
      return;
    }
    event.preventDefault();
    if (event.repeat || key === "ArrowDown") {
      return;
    }
    handleInput(key, 1);
  }, { capture: true, passive: false });

  document.addEventListener("keyup", (event) => {
    const key = controlFromEvent(event);
    if (!key) {
      return;
    }
    event.preventDefault();
    if (key === "ArrowDown") {
      return;
    }
    handleInput(key, 0);
  }, { capture: true, passive: false });

  statusEl.textContent = "Space to start • Up jumps forward • Arrows walk";
  requestAnimationFrame(loop);
}

function loop() {
  updateGame();
  const state = JSON.parse(getState());
  draw(state);
  if (state.gameOver) {
    statusEl.textContent = "Game Over — Press R to restart from Level 1.";
  } else if (state.lifeMessage) {
    statusEl.textContent = state.lifeMessage;
  } else if (state.announce) {
    statusEl.textContent = `Level ${state.level}`;
  } else if (state.won) {
    statusEl.textContent = winMessage(state.level);
  } else if (state.started) {
    statusEl.textContent = "Up jumps forward • Arrows walk";
  } else {
    statusEl.textContent = "Space to start • Up jumps forward • Arrows walk";
  }
  requestAnimationFrame(loop);
}

function draw(state) {
  const { width, height, duck, platforms, hazards, goal, pond, started, won, announce, level, lives, lifeMessage, gameOver } = state;

  drawSky(width, height);
  if (level >= 2) {
    drawLava(width, height);
  }
  drawPond(pond);
  platforms.forEach((platform) => drawPlatform(platform));
  (hazards || []).forEach((hazard) => drawFireball(hazard));
  drawGoal(goal);
  drawDuck(duck);
  if (won) {
    drawSplash(duck, pond);
  }
  drawHud(level, lives);

  if (gameOver) {
    drawNotice(width, height, "Game Over — Press R to restart from Level 1.");
  } else if (lifeMessage) {
    drawNotice(width, height, lifeMessage);
  } else if (!started) {
    drawStartBanner(width, height);
  } else if (announce) {
    drawLevelTitle(width, height, level);
  } else if (won) {
    drawWinBanner(width, height, level);
  }
}

function drawSky(width, height) {
  const sky = ctx.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, "#8fd3ee");
  sky.addColorStop(0.55, "#b7e4c7");
  sky.addColorStop(1, "#6bb3c8");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
  drawCloud(120, 70, 1);
  drawCloud(520, 50, 1.2);
  drawCloud(800, 90, 0.9);
}

function drawCloud(x, y, scale) {
  ctx.beginPath();
  ctx.ellipse(x, y, 38 * scale, 18 * scale, 0, 0, Math.PI * 2);
  ctx.ellipse(x + 28 * scale, y + 4 * scale, 30 * scale, 16 * scale, 0, 0, Math.PI * 2);
  ctx.ellipse(x - 26 * scale, y + 6 * scale, 24 * scale, 14 * scale, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawPond(pond) {
  ctx.fillStyle = "#2f80a8";
  ctx.beginPath();
  ctx.ellipse(pond.x, pond.y, pond.rx, pond.ry, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#4aa3c7";
  ctx.beginPath();
  ctx.ellipse(pond.x - 20, pond.y - 16, pond.rx * 0.55, pond.ry * 0.35, -0.2, 0, Math.PI * 2);
  ctx.fill();
}

function drawLava(width, height) {
  const glow = ctx.createLinearGradient(0, height - 70, 0, height);
  glow.addColorStop(0, "rgba(232, 93, 4, 0)");
  glow.addColorStop(1, "rgba(208, 0, 0, 0.85)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, height - 70, width, 70);
}

function drawNotice(width, height, message) {
  ctx.fillStyle = "rgba(18, 50, 74, 0.5)";
  ctx.fillRect(0, height / 2 - 70, width, 140);
  ctx.fillStyle = "#f4efe6";
  ctx.textAlign = "center";
  ctx.font = "bold 32px Georgia, serif";
  ctx.fillText(message, width / 2, height / 2 + 12);
  ctx.textAlign = "start";
}

function drawLevelTitle(width, height, level) {
  ctx.fillStyle = "rgba(18, 50, 74, 0.5)";
  ctx.fillRect(0, height / 2 - 78, width, 156);
  ctx.fillStyle = "#f4efe6";
  ctx.textAlign = "center";
  ctx.font = "bold 64px Georgia, serif";
  ctx.fillText(`Level ${level}`, width / 2, height / 2 + 22);
  ctx.textAlign = "start";
}

function drawFireball(hazard) {
  ctx.fillStyle = "#dc2f02";
  ctx.beginPath();
  ctx.arc(hazard.x, hazard.y, hazard.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ffba08";
  ctx.beginPath();
  ctx.arc(hazard.x - 3, hazard.y - 2, hazard.r * 0.45, 0, Math.PI * 2);
  ctx.fill();
}

function drawPlatform(platform) {
  if (platform.cloud) {
    drawThundercloud(platform);
    return;
  }
  ctx.fillStyle = platform.moving ? "#1d6a4f" : "#40916c";
  ctx.beginPath();
  ctx.ellipse(platform.x, platform.y, platform.r, platform.r * 0.42, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = platform.moving ? "#95d5b2" : "#52b788";
  ctx.beginPath();
  ctx.ellipse(platform.x, platform.y - 6, platform.r * 0.78, platform.r * 0.28, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawThundercloud(cloud) {
  ctx.fillStyle = "#6c757d";
  ctx.beginPath();
  ctx.ellipse(cloud.x, cloud.y, cloud.r, cloud.r * 0.42, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#dee2e6";
  ctx.beginPath();
  ctx.ellipse(cloud.x - 8, cloud.y - 8, cloud.r * 0.62, cloud.r * 0.24, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawGoal(goal) {
  ctx.fillStyle = "#6b2d3c";
  ctx.fillRect(goal.x, goal.y + goal.h, goal.w, 22);

  ctx.fillStyle = "#bc4749";
  ctx.fillRect(goal.x, goal.y, goal.w, goal.h);

  ctx.fillStyle = "#e5383b";
  for (let i = 0; i < 6; i += 1) {
    if (i % 2 === 0) {
      ctx.fillRect(goal.x + i * (goal.w / 6), goal.y, goal.w / 6, goal.h);
    }
  }

  ctx.fillStyle = "#f2e8cf";
  ctx.font = "16px Georgia, serif";
  ctx.fillText("Red carpet", goal.x + 16, goal.y - 10);
}

function drawDuck(duck) {
  ctx.save();
  ctx.translate(duck.x, duck.y);
  ctx.scale(duck.facing, 1);

  ctx.fillStyle = "#f0c419";
  ctx.beginPath();
  ctx.arc(0, 8, 30, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#1d4e89";
  ctx.beginPath();
  ctx.moveTo(-16, 4);
  ctx.quadraticCurveTo(2, 38, 20, 10);
  ctx.quadraticCurveTo(6, 2, -16, 4);
  ctx.fill();

  ctx.strokeStyle = "#14375f";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-2, 8);
  ctx.lineTo(-2, 24);
  ctx.stroke();

  ctx.fillStyle = "#f0c419";
  ctx.beginPath();
  ctx.arc(16, -16, 20, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#e09f1f";
  ctx.beginPath();
  ctx.ellipse(-10, 10, 10, 7, -0.4, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#f77f00";
  ctx.beginPath();
  ctx.moveTo(30, -18);
  ctx.lineTo(52, -26);
  ctx.lineTo(34, -10);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(30, -8);
  ctx.lineTo(50, -4);
  ctx.lineTo(32, 0);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(22, -20, 5.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#1a1a1a";
  ctx.beginPath();
  ctx.arc(24, -20, 2.6, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#f77f00";
  ctx.beginPath();
  ctx.ellipse(-8, 36, 7, 3.5, 0.2, 0, Math.PI * 2);
  ctx.ellipse(8, 36, 7, 3.5, -0.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawHud(level, lives) {
  ctx.fillStyle = "rgba(18, 50, 74, 0.55)";
  ctx.fillRect(16, 16, 168, 52);
  ctx.fillStyle = "#f4efe6";
  ctx.font = "16px Georgia, serif";
  ctx.fillText(`Level ${level}`, 28, 38);
  ctx.fillText(`Lives ${lives}`, 28, 58);
}

function drawSplash(duck, pond) {
  ctx.strokeStyle = "rgba(255, 255, 255, 0.55)";
  ctx.lineWidth = 2;
  const ripple = 18 + (duck.x - pond.x) * 0.08;
  ctx.beginPath();
  ctx.ellipse(duck.x, pond.y - 8, Math.abs(ripple) + 20, 8, 0, 0, Math.PI * 2);
  ctx.stroke();
}

function drawStartBanner(width, height) {
  ctx.fillStyle = "rgba(18, 50, 74, 0.45)";
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "#f4efe6";
  ctx.textAlign = "center";
  ctx.font = "bold 42px Georgia, serif";
  ctx.fillText("Duck Game", width / 2, height / 2 - 12);
  ctx.font = "20px Georgia, serif";
  ctx.fillText("Press Space to start  •  Up jumps forward", width / 2, height / 2 + 28);
  ctx.textAlign = "start";
}

function winMessage(level) {
  if (level === 1) {
    return "Level complete — into the pond!";
  }
  if (level === 2) {
    return "Level 2 complete";
  }
  return "You win! All 3 levels complete.";
}

function drawWinBanner(width, height, level) {
  ctx.fillStyle = "rgba(18, 50, 74, 0.28)";
  ctx.fillRect(0, 0, width, 90);
  ctx.fillStyle = "#f4efe6";
  ctx.textAlign = "center";
  ctx.font = "bold 28px Georgia, serif";
  ctx.fillText(winMessage(level), width / 2, 55);
  ctx.textAlign = "start";
}

start().catch((error) => {
  statusEl.textContent = `Could not start: ${error.message}`;
  console.error(error);
});
