// =====================================================
// Endless Dungeon RPG - STABLE_v1.3
// Kontrol: WASD gerak, Klik Kiri Mouse = Serang melee (arah ke mouse)
// Magic Bolt tetap F
// =====================================================

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const TILE = 48;
const MAP_SIZE = 40;
let camera = { x: 0, y: 0 };
let floor = 1;
let gameState = "play";

// ================= PLAYER =================
let player = {
  x: Math.floor(MAP_SIZE / 2),
  y: Math.floor(MAP_SIZE / 2),
  hp: 100,
  maxHp: 100,
  mana: 50,
  maxMana: 50,
  atk: 12,
  gold: 25,
  attackCD: 0,
  dir: { x: 0, y: 1 }   // default bawah
};

let spells = [];

// ================= MAP =================
let map = Array.from({length: MAP_SIZE}, () => Array(MAP_SIZE).fill(0));
for (let y = 0; y < MAP_SIZE; y++) {
  for (let x = 0; x < MAP_SIZE; x++) {
    if (Math.random() < 0.14) map[y][x] = 1;
  }
}
// clear spawn area
for (let dy = -3; dy <= 3; dy++) {
  for (let dx = -3; dx <= 3; dx++) {
    let tx = player.x + dx;
    let ty = player.y + dy;
    if (tx >= 0 && tx < MAP_SIZE && ty >= 0 && ty < MAP_SIZE) map[ty][tx] = 0;
  }
}

// ================= ENEMIES =================
let enemies = [];

function spawnEnemies(count) {
  for (let i = 0; i < count; i++) {
    let ex, ey;
    do {
      ex = Math.floor(Math.random() * MAP_SIZE);
      ey = Math.floor(Math.random() * MAP_SIZE);
    } while (map[ey][ex] !== 0 || Math.hypot(ex - player.x, ey - player.y) < 6);

    let roll = Math.random();
    let enemy;
    if (roll < 0.50) {
      enemy = { type: "slime", hp: 22 + floor*4, maxHp: 22 + floor*4, atk: 5 + floor*0.8, color: "#44ff88", speed: 0.45 };
    } else if (roll < 0.85) {
      enemy = { type: "skeleton", hp: 38 + floor*6, maxHp: 38 + floor*6, atk: 9 + floor*1.2, color: "#dddddd", speed: 0.28 };
    } else {
      enemy = { type: "ogre", hp: 75 + floor*12, maxHp: 75 + floor*12, atk: 16 + floor*2, color: "#8B4513", speed: 0.18 };
    }
    enemy.x = ex;
    enemy.y = ey;
    enemies.push(enemy);
  }
}
spawnEnemies(5 + floor * 2);

// ================= HELPER =================
function blocked(x, y) {
  if (x < 0 || x >= MAP_SIZE || y < 0 || y >= MAP_SIZE) return true;
  return map[y][x] === 1;
}

function enemyAt(tx, ty) {
  return enemies.find(e => e.x === tx && e.y === ty);
}

function cam() {
  camera.x = player.x * TILE - canvas.width / 2;
  camera.y = player.y * TILE - canvas.height / 2;
  camera.x = Math.max(0, Math.min(camera.x, MAP_SIZE * TILE - canvas.width));
  camera.y = Math.max(0, Math.min(camera.y, MAP_SIZE * TILE - canvas.height));
}

// ================= COMBAT =================
function castMagic() {
  if (player.mana >= 20) {
    player.mana -= 20;
    spells.push({
      x: player.x * TILE + TILE/2,
      y: player.y * TILE + TILE/2,
      vx: player.dir.x * 9,
      vy: player.dir.y * 9,
      life: 55
    });
  }
}

function playerAttack(targetX, targetY) {
  if (player.attackCD > 0) return;

  // Hitung arah dari player ke target (klik mouse)
  let dx = targetX - player.x;
  let dy = targetY - player.y;

  // Normalisasi ke arah tile terdekat (1 langkah)
  if (Math.abs(dx) > Math.abs(dy)) {
    player.dir.x = Math.sign(dx);
    player.dir.y = 0;
  } else {
    player.dir.x = 0;
    player.dir.y = Math.sign(dy);
  }

  let tx = player.x + player.dir.x;
  let ty = player.y + player.dir.y;
  let target = enemyAt(tx, ty);

  if (target) {
    let dmg = player.atk;
    target.hp -= dmg;
    if (target.hp <= 0) {
      player.gold += Math.floor(Math.random() * 12) + 6;
      enemies = enemies.filter(e => e !== target);
    }
  }
  player.attackCD = 24;
}

function enemyAI() {
  enemies.forEach(e => {
    if (Math.random() > e.speed) return;
    let dx = player.x - e.x;
    let dy = player.y - e.y;
    let dist = Math.abs(dx) + Math.abs(dy);

    if (dist <= 1) {
      player.hp -= e.atk;
      if (player.hp <= 0) {
        alert("Kamu mati! Refresh halaman untuk mulai lagi.");
        location.reload();
      }
    } else if (dist < 10) {
      let mx = Math.sign(dx);
      let my = Math.sign(dy);
      if (Math.random() < 0.5) mx = 0;
      if (Math.random() < 0.5) my = 0;
      let nx = e.x + mx;
      let ny = e.y + my;
      if (!blocked(nx, ny) && !enemyAt(nx, ny)) {
        e.x = nx; e.y = ny;
      }
    }
  });
}

// ================= DRAW (sama seperti sebelumnya) =================
function drawMap() { /* ... kode drawMap sama ... */ 
  for (let y = 0; y < MAP_SIZE; y++) {
    for (let x = 0; x < MAP_SIZE; x++) {
      let px = x * TILE - camera.x;
      let py = y * TILE - camera.y;
      if (px + TILE < 0 || px > canvas.width || py + TILE < 0 || py > canvas.height) continue;
      ctx.fillStyle = map[y][x] === 1 ? "#3a3a3a" : "#1c1c1c";
      ctx.fillRect(px, py, TILE, TILE);
    }
  }
}

function drawPlayer() {
  let px = player.x * TILE - camera.x + TILE/2;
  let py = player.y * TILE - camera.y + TILE/2;

  ctx.fillStyle = "#00cfff";
  ctx.fillRect(px - 14, py - 18, 28, 32);
  ctx.fillStyle = "#ffe0bd";
  ctx.beginPath();
  ctx.arc(px, py - 24, 10, 0, Math.PI*2);
  ctx.fill();

  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(px, py);
  ctx.lineTo(px + player.dir.x * 32, py + player.dir.y * 32);
  ctx.stroke();
}

function drawEnemies() {
  enemies.forEach(e => {
    let px = e.x * TILE - camera.x + TILE/2;
    let py = e.y * TILE - camera.y + TILE/2;

    if (e.type === "slime") {
      ctx.fillStyle = e.color;
      ctx.beginPath();
      ctx.arc(px, py, 20, 0, Math.PI*2);
      ctx.fill();
      ctx.fillStyle = "#000";
      ctx.beginPath(); ctx.arc(px-7, py-5, 5, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(px+7, py-5, 5, 0, Math.PI*2); ctx.fill();
    } else if (e.type === "skeleton") {
      ctx.fillStyle = "#eeeeee";
      ctx.beginPath();
      ctx.arc(px, py-12, 14, 0, Math.PI*2);
      ctx.fill();
      ctx.fillRect(px-12, py, 24, 26);
      ctx.fillStyle = "#111";
      ctx.fillRect(px-6, py-18, 5, 5);
      ctx.fillRect(px+1, py-18, 5, 5);
    } else if (e.type === "ogre") {
      ctx.fillStyle = e.color;
      ctx.fillRect(px-22, py-5, 44, 44);
      ctx.fillStyle = "#5a3a1a";
      ctx.beginPath();
      ctx.arc(px, py-22, 20, 0, Math.PI*2);
      ctx.fill();
      ctx.fillStyle = "#000";
      ctx.fillRect(px-8, py-28, 6, 6);
      ctx.fillRect(px+2, py-28, 6, 6);
    }
  });
}

function drawSpells() {
  for (let i = spells.length - 1; i >= 0; i--) {
    let s = spells[i];
    ctx.fillStyle = "#00ddff";
    ctx.shadowBlur = 10;
    ctx.shadowColor = "#00ddff";
    ctx.beginPath();
    ctx.arc(s.x - camera.x, s.y - camera.y, 9, 0, Math.PI*2);
    ctx.fill();
    ctx.shadowBlur = 0;

    s.x += s.vx;
    s.y += s.vy;
    s.life--;

    let tx = Math.floor(s.x / TILE);
    let ty = Math.floor(s.y / TILE);
    let target = enemyAt(tx, ty);

    if (target) {
      target.hp -= 20;
      if (target.hp <= 0) {
        player.gold += Math.floor(Math.random() * 18) + 10;
        enemies = enemies.filter(en => en !== target);
      }
      spells.splice(i, 1);
    } else if (s.life <= 0 || blocked(tx, ty)) {
      spells.splice(i, 1);
    }
  }
}

// ================= INPUT =================

// Keyboard untuk gerak
window.addEventListener("keydown", e => {
  if (gameState !== "play") return;

  let moved = false;
  let nx = player.x;
  let ny = player.y;

  if (["w", "W", "ArrowUp"].includes(e.key))    { ny--; player.dir = {x:0,y:-1}; moved=true; }
  if (["s", "S", "ArrowDown"].includes(e.key))  { ny++; player.dir = {x:0,y:1};  moved=true; }
  if (["a", "A", "ArrowLeft"].includes(e.key))  { nx--; player.dir = {x:-1,y:0}; moved=true; }
  if (["d", "D", "ArrowRight"].includes(e.key)) { nx++; player.dir = {x:1,y:0};  moved=true; }

  if (moved && !blocked(nx, ny)) {
    player.x = nx;
    player.y = ny;
  }

  if (e.key.toLowerCase() === "f") castMagic();
});

// Mouse untuk serang
canvas.addEventListener("mousedown", e => {
  if (gameState !== "play" || e.button !== 0) return; // hanya klik kiri

  // Hitung posisi klik relatif terhadap canvas
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  // Konversi ke koordinat world (tile)
  const worldX = Math.floor((mouseX + camera.x) / TILE);
  const worldY = Math.floor((mouseY + camera.y) / TILE);

  playerAttack(worldX, worldY);
});

// Optional: update arah karakter saat mouse gerak (biar lebih smooth aim)
canvas.addEventListener("mousemove", e => {
  if (gameState !== "play") return;

  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  const worldX = Math.floor((mouseX + camera.x) / TILE);
  const worldY = Math.floor((mouseY + camera.y) / TILE);

  let dx = worldX - player.x;
  let dy = worldY - player.y;

  if (Math.abs(dx) > Math.abs(dy)) {
    player.dir.x = Math.sign(dx);
    player.dir.y = 0;
  } else if (dy !== 0) {
    player.dir.x = 0;
    player.dir.y = Math.sign(dy);
  }
});

// ================= GAME LOOP =================
function loop() {
  if (player.hp <= 0) return;

  if (player.attackCD > 0) player.attackCD--;
  player.mana = Math.min(player.maxMana, player.mana + 0.07);

  enemyAI();

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  cam();
  drawMap();
  drawEnemies();
  drawSpells();
  drawPlayer();

  document.getElementById("hp").innerText   = Math.floor(player.hp);
  document.getElementById("mana").innerText = Math.floor(player.mana);
  document.getElementById("gold").innerText = player.gold;
  document.getElementById("floor").innerText = floor;

  requestAnimationFrame(loop);
}

loop();
