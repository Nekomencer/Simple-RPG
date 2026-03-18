// =====================================================
// Endless Dungeon RPG - STABLE_v1.4
// Balanced enemy damage + Hold WASD movement + Shift Sprint
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
  dir: { x: 0, y: 1 },
  isSprinting: false
};

let spells = [];

// ================= MAP =================
let map = Array.from({length: MAP_SIZE}, () => Array(MAP_SIZE).fill(0));
for (let y = 0; y < MAP_SIZE; y++) {
  for (let x = 0; x < MAP_SIZE; x++) {
    if (Math.random() < 0.14) map[y][x] = 1;
  }
}
for (let dy = -3; dy <= 3; dy++) {
  for (let dx = -3; dx <= 3; dx++) {
    let tx = player.x + dx, ty = player.y + dy;
    if (tx >= 0 && tx < MAP_SIZE && ty >= 0 && ty < MAP_SIZE) map[ty][tx] = 0;
  }
}

// ================= ENEMIES (damage lebih balance) =================
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
    if (roll < 0.50) {          // Slime: damage kecil tapi sering
      enemy = { type: "slime", hp: 22 + floor*4, maxHp: 22 + floor*4, atk: 4 + floor*0.7, color: "#44ff88", speed: 0.45 };
    } else if (roll < 0.85) {   // Skeleton: damage sedang
      enemy = { type: "skeleton", hp: 38 + floor*6, maxHp: 38 + floor*6, atk: 7 + floor*1.1, color: "#dddddd", speed: 0.28 };
    } else {                    // Ogre: damage tinggi tapi lambat
      enemy = { type: "ogre", hp: 75 + floor*12, maxHp: 75 + floor*12, atk: 13 + floor*1.8, color: "#8B4513", speed: 0.18 };
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

function playerAttack() {
  if (player.attackCD > 0) return;
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
      // Damage musuh sekarang lebih ringan di early game
      let damage = e.atk;
      player.hp -= damage;
      console.log(`${e.type} menyerang! Kamu kehilangan ${damage} HP`);
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
// ... (drawMap, drawPlayer, drawEnemies, drawSpells tetap sama, copy dari versi sebelumnya)

// ================= INPUT & SMOOTH MOVEMENT =================
const keys = {};
window.addEventListener("keydown", e => {
  keys[e.key.toLowerCase()] = true;
  if (e.key.toLowerCase() === "f") castMagic();
  if (e.key === " ") playerAttack();
});

window.addEventListener("keyup", e => {
  keys[e.key.toLowerCase()] = false;
});

// Sprint dengan Shift
window.addEventListener("keydown", e => {
  if (e.key === "Shift") player.isSprinting = true;
});
window.addEventListener("keyup", e => {
  if (e.key === "Shift") player.isSprinting = false;
});

// Gerak smooth (hold key)
setInterval(() => {
  if (gameState !== "play" || player.hp <= 0) return;

  let moved = false;
  let nx = player.x;
  let ny = player.y;

  const moveSpeed = player.isSprinting ? 2 : 1; // 2 tile per interval kalau sprint

  if (keys["w"] || keys["arrowup"]) { ny -= moveSpeed; player.dir = {x:0,y:-1}; moved = true; }
  if (keys["s"] || keys["arrowdown"]) { ny += moveSpeed; player.dir = {x:0,y:1}; moved = true; }
  if (keys["a"] || keys["arrowleft"]) { nx -= moveSpeed; player.dir = {x:-1,y:0}; moved = true; }
  if (keys["d"] || keys["arrowright"]) { nx += moveSpeed; player.dir = {x:1,y:0}; moved = true; }

  // Cek blocked untuk setiap langkah kalau sprint (agar tidak nembus wall)
  if (moved) {
    let steps = Math.abs(moveSpeed);
    let dx = nx - player.x;
    let dy = ny - player.y;
    let stepX = Math.sign(dx);
    let stepY = Math.sign(dy);

    let canMove = true;
    for (let i = 1; i <= steps; i++) {
      let checkX = player.x + stepX * i;
      let checkY = player.y + stepY * i;
      if (blocked(checkX, checkY)) {
        canMove = false;
        break;
      }
    }

    if (canMove) {
      player.x = nx;
      player.y = ny;
    }
  }
}, 120); // ~8 gerakan per detik normal, 16 kalau sprint

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

  const hpEl    = document.getElementById("hp");
  const manaEl  = document.getElementById("mana");
  const goldEl  = document.getElementById("gold");
  const floorEl = document.getElementById("floor");

  if (hpEl)    hpEl.innerText    = Math.floor(player.hp);
  if (manaEl)  manaEl.innerText  = Math.floor(player.mana);
  if (goldEl)  goldEl.innerText  = player.gold;
  if (floorEl) floorEl.innerText = floor;

  requestAnimationFrame(loop);
}

loop();
