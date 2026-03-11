// =====================================================
// VERSION LOCK: STABLE_BASE_v1.1 (PATCHED)
// ADDED: Directional System, Mana System, Magic Bolt
// =====================================================

// ... (CORE & MAP tetep sama seperti kode kamu) ...
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const TILE = 48;
const MAP = 40;
let camera = { x: 0, y: 0 };
let floor = 1;
let gameState = "mainMenu";
let menuIndex = 0;

// ================= PLAYER (UPDATED) =================
function createPlayer() {
  return {
    x: 5, y: 5,
    hp: 100, maxHp: 100,
    mana: 50, maxMana: 50, // Added Mana
    atk: 10, gold: 25,
    weapon: null, inventory: [],
    attackCD: 0,
    dir: { x: 0, y: 1 } // Added: Default menghadap bawah
  };
}
let player = createPlayer();
let spells = []; // Array peluru sihir

// ... (Fungsi Map & Enemies tetep sama) ...

// ================= COMBAT (UPDATED) =================
function castMagic() {
  if (player.mana >= 20) {
    player.mana -= 20;
    spells.push({
      x: player.x * TILE + TILE / 2,
      y: player.y * TILE + TILE / 2,
      vx: player.dir.x * 8,
      vy: player.dir.y * 8,
      life: 40
    });
  }
}

function playerAttack() {
  if (player.attackCD > 0) return;
  
  enemies.forEach(e => {
    // Mengecek musuh di depan arah hadap player
    let dx = e.x - player.x;
    let dy = e.y - player.y;
    if (dx === player.dir.x && dy === player.dir.y) {
      e.hp -= player.atk + (player.weapon?.atk || 0);
      if (e.hp <= 0) enemyDrop();
    }
  });
  enemies = enemies.filter(e => e.hp > 0);
  player.attackCD = 20;
}

// ================= DRAW (UPDATED) =================
function drawSpells() {
  spells.forEach((s, i) => {
    ctx.fillStyle = "#00f2ff";
    ctx.shadowBlur = 10; ctx.shadowColor = "#00f2ff";
    ctx.beginPath();
    ctx.arc(s.x - camera.x, s.y - camera.y, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    s.x += s.vx; s.y += s.vy;
    s.life--;
    if (s.life <= 0) spells.splice(i, 1);
  });
}

function drawPlayer() {
  let px = player.x * TILE - camera.x + TILE / 2;
  let py = player.y * TILE - camera.y + TILE / 2;

  // Body
  ctx.fillStyle = "#00cfff";
  ctx.fillRect(px - 10, py - 14, 20, 24);

  // Head
  ctx.fillStyle = "#ffe0bd";
  ctx.beginPath();
  ctx.arc(px, py - 20, 8, 0, Math.PI * 2);
  ctx.fill();

  // Sword/Direction Indicator (Garis kecil penunjuk arah)
  ctx.strokeStyle = "white";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(px, py);
  ctx.lineTo(px + player.dir.x * 20, py + player.dir.y * 20);
  ctx.stroke();
}

// ================= INPUT (UPDATED) =================
document.addEventListener("keydown", e => {
  // ... (Logika Menu tetep sama) ...

  if (gameState === "play") {
    let nx = player.x, ny = player.y;
    let moved = false;

    if (e.key === "w") { ny--; player.dir = {x:0, y:-1}; moved = true; }
    if (e.key === "s") { ny++; player.dir = {x:0, y:1}; moved = true; }
    if (e.key === "a") { nx--; player.dir = {x:-1, y:0}; moved = true; }
    if (e.key === "d") { nx++; player.dir = {x:1, y:0}; moved = true; }

    if (moved && !blocked(nx, ny)) { 
      player.x = nx; player.y = ny; 
    }

    if (e.key === " ") playerAttack();
    if (e.key === "f") castMagic(); // Tombol F untuk Sihir (Magic Bolt)
    
    // ... (Logika i, b, n tetep sama) ...
  }
});

// ================= LOOP (UPDATED) =================
function loop() {
  if (gameState === "play") {
    if (player.attackCD > 0) player.attackCD--;
    if (player.mana < player.maxMana) player.mana += 0.05; // Regen Mana
    enemyAI();
    
    // Collision Magic vs Enemy
    spells.forEach((s, si) => {
      let tx = Math.floor(s.x / TILE);
      let ty = Math.floor(s.y / TILE);
      let target = enemyAt(tx, ty);
      if (target) {
        target.hp -= 15; // Damage sihir
        if (target.hp <= 0) enemyDrop();
        spells.splice(si, 1);
        enemies = enemies.filter(e => e.hp > 0);
      }
    });
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (gameState !== "mainMenu") {
    cam();
    drawMap();
    drawEnemies();
    drawSpells(); // Render sihir
    drawPlayer();
  }

  // Update UI (Pastikan ada elemen 'mana' di HTML kamu)
  document.getElementById("hp").innerText = Math.floor(player.hp);
  if(document.getElementById("mana")) document.getElementById("mana").innerText = Math.floor(player.mana);
  document.getElementById("gold").innerText = player.gold;
  
  requestAnimationFrame(loop);
}
loop();
