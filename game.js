// =====================================================
// VERSION LOCK
// STABLE_BASE_v1
// Do not remove systems below.
// Future patches must be additive only.
// =====================================================

// ================= CORE =================
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const TILE = 48;
const MAP = 40;

let camera = { x: 0, y: 0 };
let floor = 1;

let gameState = "mainMenu"; // mainMenu | play | pause | inventory | shop | dead
let menuIndex = 0;

// ================= PLAYER =================
function createPlayer() {
  return {
    x: 5,
    y: 5,
    hp: 100,
    maxHp: 100,
    atk: 10,
    gold: 25,
    weapon: null,
    inventory: [],
    attackCD: 0
  };
}
let player = createPlayer();

// ================= MAP =================
let map = [], shopTile, stairTile;

function makeMap() {
  map = [];
  for (let y = 0; y < MAP; y++) {
    map[y] = [];
    for (let x = 0; x < MAP; x++) map[y][x] = 0;
  }
}

function room(x, y, w, h) {
  for (let yy = y; yy < y + h; yy++)
    for (let xx = x; xx < x + w; xx++)
      if (xx > 0 && yy > 0 && xx < MAP && yy < MAP)
        map[yy][xx] = 1;
}

function corridor(x1, y1, x2, y2) {
  while (x1 !== x2) { map[y1][x1] = 1; x1 += x2 > x1 ? 1 : -1; }
  while (y1 !== y2) { map[y1][x1] = 1; y1 += y2 > y1 ? 1 : -1; }
}

function generateDungeon() {
  makeMap();
  let rooms = [];

  for (let i = 0; i < 8; i++) {
    let w = 5 + Math.random() * 5 | 0;
    let h = 5 + Math.random() * 5 | 0;
    let x = Math.random() * (MAP - w - 1) | 0;
    let y = Math.random() * (MAP - h - 1) | 0;

    room(x, y, w, h);

    let c = { x: x + w / 2 | 0, y: y + h / 2 | 0 };
    if (rooms.length) {
      let p = rooms[rooms.length - 1];
      corridor(p.x, p.y, c.x, c.y);
    }
    rooms.push(c);
  }

  player.x = rooms[0].x;
  player.y = rooms[0].y;

  shopTile = rooms[1];
  stairTile = rooms[rooms.length - 1];
}

// ================= ENEMIES =================
let enemies = [];

function spawnEnemies() {
  enemies = [];

  const count = 6 + floor;

  for (let i = 0; i < count; i++) {
    let x, y;
    do {
      x = Math.random() * MAP | 0;
      y = Math.random() * MAP | 0;
    } while (!map[y][x]);

    enemies.push({
      x, y,
      hp: 40 + floor * 10,
      atk: 6 + floor * 2,
      cd: 0
    });
  }
}

// ================= ITEMS =================
const shopItems = [
  { name: "Sword", type: "weapon", atk: 5, price: 20, desc: "+5 Attack" },
  { name: "Potion", type: "potion", heal: 30, price: 10, desc: "Restore 30 HP" },
  { name: "Knight Sword", type: "weapon", atk: 10, price: 40, desc: "+10 Attack" }
];

// ================= DROPS =================
function enemyDrop() {
  player.gold += 5 + Math.random() * 5 | 0;

  if (Math.random() < 0.35) {
    player.inventory.push({
      name: "Potion",
      type: "potion",
      heal: 25,
      desc: "Recovered from monster"
    });
  }

  if (Math.random() < 0.08 + floor * 0.01) {
    player.inventory.push({
      name: "Dungeon Blade",
      type: "weapon",
      atk: 6 + floor,
      desc: "Forged in deep dungeon"
    });
  }
}

// ================= COLLISION =================
function enemyAt(x, y) {
  return enemies.find(e => e.x === x && e.y === y);
}
function blocked(x, y) {
  if (!map[y] || !map[y][x]) return true;
  if (enemyAt(x, y)) return true;
  return false;
}

// ================= COMBAT =================
function playerAttack() {
  if (player.attackCD > 0) return;

  enemies.forEach(e => {
    if (Math.abs(e.x - player.x) + Math.abs(e.y - player.y) <= 1) {
      e.hp -= player.atk + (player.weapon?.atk || 0);
      if (e.hp <= 0) enemyDrop();
    }
  });

  enemies = enemies.filter(e => e.hp > 0);
  player.attackCD = 25;
}

function enemyAI() {
  enemies.forEach(e => {
    if (e.cd > 0) e.cd--;
    if (Math.abs(e.x - player.x) + Math.abs(e.y - player.y) <= 1 && e.cd === 0) {
      player.hp -= e.atk;
      e.cd = 45;
    }
  });
}

// ================= DRAW WORLD =================
function cam() {
  camera.x += (player.x * TILE - canvas.width / 2 - camera.x) * 0.15;
  camera.y += (player.y * TILE - canvas.height / 2 - camera.y) * 0.15;
}

function drawMap() {
  for (let y = 0; y < MAP; y++)
    for (let x = 0; x < MAP; x++) {
      ctx.fillStyle = map[y][x] ? "#555" : "#111";
      ctx.fillRect(x * TILE - camera.x, y * TILE - camera.y, TILE, TILE);
    }

  ctx.fillStyle = "gold";
  ctx.fillRect(shopTile.x * TILE - camera.x, shopTile.y * TILE - camera.y, TILE, TILE);

  ctx.fillStyle = "purple";
  ctx.fillRect(stairTile.x * TILE - camera.x, stairTile.y * TILE - camera.y, TILE, TILE);
}

function drawPlayer() {
  let px = player.x * TILE - camera.x + TILE / 2;
  let py = player.y * TILE - camera.y + TILE / 2;

  ctx.fillStyle = "#00cfff";
  ctx.fillRect(px - 10, py - 14, 20, 24);

  ctx.fillStyle = "#ffe0bd";
  ctx.beginPath();
  ctx.arc(px, py - 20, 8, 0, Math.PI * 2);
  ctx.fill();
}

function drawEnemies() {
  enemies.forEach(e => {
    let ex = e.x * TILE - camera.x + TILE / 2;
    let ey = e.y * TILE - camera.y + TILE / 2;
    ctx.fillStyle = "crimson";
    ctx.fillRect(ex - 10, ey - 14, 20, 24);
  });
}

// ================= UI =================
function drawPanel(title, list) {
  ctx.fillStyle = "rgba(0,0,0,0.9)";
  ctx.fillRect(140, 90, 360, 460);

  ctx.fillStyle = "white";
  ctx.font = "22px Arial";
  ctx.fillText(title, 250, 130);

  list.forEach((t, i) => {
    ctx.fillStyle = i === menuIndex ? "yellow" : "white";
    ctx.fillText(t, 200, 200 + i * 40);
  });
}

function drawItemDetails(item) {
  if (!item) return;

  ctx.fillStyle = "rgba(0,0,0,0.85)";
  ctx.fillRect(520, 120, 240, 220);

  ctx.fillStyle = "white";
  ctx.font = "16px Arial";

  ctx.fillText(item.name, 540, 150);
  if (item.desc) ctx.fillText(item.desc, 540, 180);
  if (item.atk) ctx.fillText("ATK +" + item.atk, 540, 210);
  if (item.heal) ctx.fillText("Heal " + item.heal, 540, 210);
  if (item.price) ctx.fillText("Price $" + item.price, 540, 240);
  if (player.weapon === item) ctx.fillText("EQUIPPED", 540, 270);
}

// ================= INPUT =================
document.addEventListener("keydown", e => {

  if (gameState === "mainMenu") {
    if (e.key === "Enter") {
      generateDungeon();
      spawnEnemies();
      gameState = "play";
    }
    return;
  }

  if (gameState === "pause") {
    if (e.key === "w") menuIndex = Math.max(0, menuIndex - 1);
    if (e.key === "s") menuIndex = Math.min(2, menuIndex + 1);

    if (e.key === "Enter") {
      if (menuIndex === 0) gameState = "play";
      if (menuIndex === 1) { gameState = "inventory"; menuIndex = 0; }
      if (menuIndex === 2) gameState = "mainMenu";
    }
    return;
  }

  if (gameState === "inventory") {
    if (e.key === "Escape") { gameState = "pause"; return; }

    if (e.key === "w") menuIndex = Math.max(0, menuIndex - 1);
    if (e.key === "s") menuIndex = Math.min(player.inventory.length - 1, menuIndex + 1);

    if (e.key === "Enter") {
      let item = player.inventory[menuIndex];
      if (item?.type === "potion") {
        player.hp = Math.min(player.maxHp, player.hp + item.heal);
        player.inventory.splice(menuIndex, 1);
      }
      if (item?.type === "weapon") player.weapon = item;
    }
    return;
  }

  if (gameState === "shop") {
    if (e.key === "Escape") { gameState = "play"; return; }

    if (e.key === "w") menuIndex = Math.max(0, menuIndex - 1);
    if (e.key === "s") menuIndex = Math.min(shopItems.length - 1, menuIndex + 1);

    if (e.key === "Enter") {
      let item = shopItems[menuIndex];
      if (player.gold >= item.price) {
        player.gold -= item.price;
        player.inventory.push({ ...item });
      }
    }
    return;
  }

  // ---- PLAY ----
  if (e.key === "Escape") { gameState = "pause"; menuIndex = 0; return; }

  let nx = player.x, ny = player.y;

  if (e.key === "w") ny--;
  if (e.key === "s") ny++;
  if (e.key === "a") nx--;
  if (e.key === "d") nx++;

  if (!blocked(nx, ny)) { player.x = nx; player.y = ny; }

  if (e.key === " ") playerAttack();

  if (e.key === "i") { gameState = "inventory"; menuIndex = 0; }

  if (e.key === "b" && player.x === shopTile.x && player.y === shopTile.y) {
    gameState = "shop"; menuIndex = 0;
  }

  if (e.key === "n" && player.x === stairTile.x && player.y === stairTile.y) {
    floor++;
    generateDungeon();
    spawnEnemies();
  }
});

// ================= LOOP =================
function loop() {

  if (gameState === "play") {
    if (player.attackCD > 0) player.attackCD--;
    enemyAI();
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (gameState !== "mainMenu") {
    cam();
    drawMap();
    drawEnemies();
    drawPlayer();
  }

  if (gameState === "mainMenu")
    drawPanel("ENDLESS DUNGEON", ["Press ENTER to Start"]);

  if (gameState === "pause")
    drawPanel("Paused", ["Resume", "Inventory", "Main Menu"]);

  if (gameState === "inventory") {
    drawPanel("Inventory", player.inventory.map(i => i.name));
    drawItemDetails(player.inventory[menuIndex]);
  }

  if (gameState === "shop") {
    drawPanel("Shop", shopItems.map(i => `${i.name} - $${i.price}`));
    drawItemDetails(shopItems[menuIndex]);
  }

  if (player.hp <= 0) {
    gameState = "dead";
    drawPanel("YOU DIED", ["Reload page to retry"]);
  }

  document.getElementById("hp").innerText = player.hp;
  document.getElementById("gold").innerText = player.gold;
  document.getElementById("floor").innerText = floor;

  requestAnimationFrame(loop);
}
loop();
