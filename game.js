// ====== BASIC STATE ======
let coins = 0;
let player = {
    x: 300,
    y: 200,
    size: 20,
    speed: 3,
    color: "white",
    health: 100,
    shield: 0
};

let bullets = [];
let enemies = [];
let walls = [];
let pickups = [];
let keys = {};
let materials = 120;

let storm = {
    center: { x: 0, y: 0 },
    radius: 0,
    minRadius: 120,
    shrinkRate: 4,
    damagePerSecond: 12
};

// ====== INIT ======
let canvas = document.getElementById("gameCanvas");
let ctx = canvas ? canvas.getContext("2d") : null;
let lastTime = 0;
let particles = [];
let mouse = { x: 0, y: 0 };
let rafId = null;
// Map data for realistic terrain
const mapCols = 20;
const mapRows = 15;
const tileSize = 40;
let mapTiles = [];
let decorObjects = [];
// Skins
const skins = [
    { id: 'white', name: 'Default', color: '#ffffff', cost: 0 },
    { id: 'crimson', name: 'Crimson', color: '#ff4d4d', cost: 50 },
    { id: 'cyan', name: 'Cyan', color: '#4de0ff', cost: 100 },
    { id: 'gold', name: 'Gold', color: '#ffd24d', cost: 200 },
    { id: 'neon', name: 'Neon Pulse', color: '#e100ff', cost: 150 },
    { id: 'forest', name: 'Forest Camo', color: '#386b2d', cost: 80 },
    { id: 'shadow', name: 'Shadow', color: '#20232a', cost: 120 },
    { id: 'lava', name: 'Lava', color: '#ff6f1d', cost: 180 },
    { id: 'ocean', name: 'Ocean', color: '#226fb8', cost: 130 },
    { id: 'sunset', name: 'Sunset', color: '#ff9c4a', cost: 160 },
    { id: 'ice', name: 'Ice', color: '#9be7ff', cost: 140 },
    { id: 'cyber', name: 'Cyber', color: '#00e6c1', cost: 170 },
    { id: 'royal', name: 'Royal Blue', color: '#2d4cff', cost: 190 }
];
let ownedSkins = [];
let selectedSkin = 'white';
// Score and controls
let score = 0;
let highScore = parseInt(localStorage.getItem('highScore') || '0');
let paused = false;
let soundEnabled = true;
let audioCtx = null;

let fps = 0;
let frames = 0;
let fpsLast = performance.now();

function loadCoins() {
    const saved = localStorage.getItem("coins");
    coins = saved ? parseInt(saved) : 0;
}

function saveCoins() {
    localStorage.setItem("coins", coins.toString());
}

function updateHUD() {
    document.getElementById("coins").innerText = "Coins: " + coins;
    document.getElementById("health").innerText = "Health: " + player.health;
    const shieldEl = document.getElementById('shieldDisplay');
    if (shieldEl) shieldEl.innerText = 'Shield: ' + player.shield;
    const materialsEl = document.getElementById('materials');
    if (materialsEl) materialsEl.innerText = 'Materials: ' + materials;
    const sd = document.getElementById('scoreDisplay');
    if (sd) sd.innerText = 'Score: ' + score;
    const hd = document.getElementById('highScoreDisplay');
    if (hd) hd.innerText = 'High: ' + highScore;
}

// ====== CURRENCY ======
function addCoins(amount) {
    coins += amount;
    saveCoins();
    updateHUD();
}

function spendCoins(amount) {
    if (coins >= amount) {
        coins -= amount;
        saveCoins();
        updateHUD();
        return true;
    } else {
        alert("Not enough coins");
        return false;
    }
}

// ====== SHOP / SKINS ======
function buySkin(color, cost) {
    if (spendCoins(cost)) {
        player.color = color;
    }
}

// ====== INPUT ======
function attachInput() {
    document.addEventListener("keydown", (e) => {
        keys[e.key.toLowerCase()] = true;
        if (e.code === 'Space') {
            e.preventDefault();
            shoot();
        }
        if (e.key.toLowerCase() === "b") {
            buildWall();
        }
        if (e.key.toLowerCase() === "r") {
            buildRamp();
        }
    });

    document.addEventListener("keyup", (e) => {
        keys[e.key.toLowerCase()] = false;
    });

    // mouse move and click; works when canvas is available
    window.addEventListener('mousemove', (e) => {
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
    });

    window.addEventListener('mousedown', (e) => {
        // left click to shoot
        if (e.button === 0) shoot();
    });

    // touch support
    window.addEventListener('touchstart', (e) => {
        if (!canvas) return;
        const t = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        mouse.x = t.clientX - rect.left;
        mouse.y = t.clientY - rect.top;
        shoot();
    }, { passive: true });
}

// ====== MOVEMENT ======
function handleMovement() {
    if (keys["w"]) player.y -= player.speed;
    if (keys["s"]) player.y += player.speed;
    if (keys["a"]) player.x -= player.speed;
    if (keys["d"]) player.x += player.speed;

    player.x = Math.max(player.size, Math.min(canvas.width - player.size, player.x));
    player.y = Math.max(player.size, Math.min(canvas.height - player.size, player.y));
}

// ====== SHOOTING ======
function shoot() {
    const angle = Math.atan2(mouse.y - player.y, mouse.x - player.x);
    const speed = 8;
    bullets.push({
        x: player.x + Math.cos(angle) * player.size,
        y: player.y + Math.sin(angle) * player.size,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 4
    });
    playSound('shoot');
}

function spawnParticles(x, y, color, count = 12) {
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 2 + 0.5;
        particles.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: Math.random() * 0.8 + 0.3,
            size: Math.random() * 3 + 1,
            color: color
        });
    }
}

// ====== BUILDING ======
function buildWall() {
    if (materials < 20) return;
    materials -= 20;
    walls.push({
        x: player.x + 30,
        y: player.y - 10,
        width: 40,
        height: 20,
        type: 'wall'
    });
    spawnParticles(player.x + 30, player.y - 10, '#cccccc', 10);
}

function buildRamp() {
    if (materials < 30) return;
    materials -= 30;
    walls.push({
        x: player.x + 30,
        y: player.y - 10,
        width: 40,
        height: 20,
        type: 'ramp'
    });
    spawnParticles(player.x + 30, player.y - 10, '#a0c8ff', 10);
}

// ====== ENEMIES ======
function spawnEnemy() {
    // varied enemy types
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const r = Math.random();
    if (r < 0.55) { // basic
        enemies.push({ x, y, size: 18, speed: 1.2, color: '#4caf50', type: 'basic', score: 10 });
    } else if (r < 0.83) { // fast
        enemies.push({ x, y, size: 12, speed: 2.6, color: '#ff5252', type: 'fast', score: 15 });
    } else if (r < 0.95) { // tank
        enemies.push({ x, y, size: 30, speed: 0.7, color: '#ffb74d', type: 'tank', score: 25 });
    } else { // car
        enemies.push({ x, y, size: 22, speed: 2.0, color: '#2f2f2f', type: 'car', score: 40, damage: 50 });
    }
}

setInterval(spawnEnemy, 3000);

function applyDamage(amount) {
    const shieldAbsorb = Math.min(player.shield, amount);
    player.shield -= shieldAbsorb;
    amount -= shieldAbsorb;
    if (amount > 0) {
        player.health = Math.max(0, player.health - amount);
    }
}

function handleEnemies() {
    enemies.forEach((enemy) => {
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 0) {
            const speed = enemy.speed || 1.2;
            enemy.x += (dx / dist) * speed;
            enemy.y += (dy / dist) * speed;
        }

        if (dist < enemy.size + player.size) {
            if (enemy.type === 'car') {
                if (!enemy.hasHitPlayer) {
                    applyDamage(enemy.damage);
                    enemy.hasHitPlayer = true;
                }
            } else {
                applyDamage(enemy.type === 'tank' ? 0.4 : 0.15);
            }
        } else {
            enemy.hasHitPlayer = false;
        }
    });
}

// ====== BULLETS ======
function handleBullets() {
    bullets.forEach((b) => {
        b.x += b.vx;
        b.y += b.vy;
    });

    for (let bi = bullets.length - 1; bi >= 0; bi--) {
        const b = bullets[bi];
        let removed = false;
        for (let wi = walls.length - 1; wi >= 0; wi--) {
            const wall = walls[wi];
            if (b.x > wall.x && b.x < wall.x + wall.width && b.y > wall.y && b.y < wall.y + wall.height) {
                spawnParticles(b.x, b.y, '#ffffff', 8);
                bullets.splice(bi, 1);
                removed = true;
                break;
            }
        }
        if (removed) continue;

        for (let ei = enemies.length - 1; ei >= 0; ei--) {
            const enemy = enemies[ei];
            const dx = enemy.x - b.x;
            const dy = enemy.y - b.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < enemy.size) {
                const reward = enemy.score || 10;
                score += reward;
                addCoins(Math.floor(reward / 1));
                materials = Math.min(600, materials + 15);
                if (score > highScore) {
                    highScore = score;
                    localStorage.setItem('highScore', String(highScore));
                }
                spawnParticles(enemy.x, enemy.y, enemy.color, 18);
                if (Math.random() < 0.02) {
                    pickups.push({ x: enemy.x, y: enemy.y, type: 'heal', amount: 25, radius: 10, color: '#fe7b7b' });
                } else if (Math.random() < 0.015) {
                    pickups.push({ x: enemy.x, y: enemy.y, type: 'shield', amount: 25, radius: 10, color: '#6ad3ff' });
                } else if (Math.random() < 0.08) {
                    pickups.push({ x: enemy.x, y: enemy.y, type: 'materials', amount: 25, radius: 10, color: '#f0c75e' });
                }
                playSound('explode');
                enemies.splice(ei, 1);
                bullets.splice(bi, 1);
                removed = true;
                break;
            }
        }
    }

    bullets = bullets.filter(b => b.x < canvas.width + 10 && b.x > -10 && b.y < canvas.height + 10 && b.y > -10);
}

function handlePickups() {
    for (let i = pickups.length - 1; i >= 0; i--) {
        const pick = pickups[i];
        const dx = player.x - pick.x;
        const dy = player.y - pick.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < player.size + pick.radius) {
            if (pick.type === 'heal') {
                player.health = Math.min(100, player.health + pick.amount);
                spawnParticles(pick.x, pick.y, '#ff9999', 12);
                playSound('explode');
            }
            if (pick.type === 'shield') {
                player.shield = Math.min(100, player.shield + pick.amount);
                spawnParticles(pick.x, pick.y, '#7ae2ff', 12);
                playSound('explode');
            }
            pickups.splice(i, 1);
        }
    }
}

function drawPickups() {
    pickups.forEach((pick) => {
        const pulse = 1 + Math.sin(performance.now() / 250) * 0.08;
        const radius = pick.radius * pulse;
        const grad = ctx.createRadialGradient(pick.x, pick.y, 0, pick.x, pick.y, radius * 1.4);
        grad.addColorStop(0, pick.color || '#ff8888');
        grad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(pick.x, pick.y, radius * 1.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        if (pick.type === 'heal') {
            ctx.arc(pick.x, pick.y, 6, 0, Math.PI * 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(pick.x - 2, pick.y);
            ctx.lineTo(pick.x + 2, pick.y);
            ctx.moveTo(pick.x, pick.y - 2);
            ctx.lineTo(pick.x, pick.y + 2);
        } else if (pick.type === 'shield') {
            ctx.moveTo(pick.x, pick.y - 8);
            ctx.lineTo(pick.x - 6, pick.y + 2);
            ctx.lineTo(pick.x + 6, pick.y + 2);
            ctx.closePath();
        } else if (pick.type === 'materials') {
            ctx.rect(pick.x - 6, pick.y - 6, 12, 12);
            ctx.moveTo(pick.x - 4, pick.y - 2);
            ctx.lineTo(pick.x + 4, pick.y - 2);
            ctx.moveTo(pick.x - 4, pick.y + 2);
            ctx.lineTo(pick.x + 4, pick.y + 2);
        }
        ctx.stroke();
    });
}

function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.vy += 0.06; // gravity
        p.x += p.vx * (dt * 60);
        p.y += p.vy * (dt * 60);
        p.life -= dt;
        if (p.life <= 0) particles.splice(i, 1);
    }
}

// ====== AUDIO ======
function ensureAudio() {
    if (!audioCtx) {
        try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { audioCtx = null; }
    }
}

function playSound(type) {
    if (!soundEnabled) return;
    ensureAudio();
    if (!audioCtx) return;
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.connect(g); g.connect(audioCtx.destination);
    if (type === 'shoot') {
        o.frequency.value = 900;
        g.gain.value = 0.08;
        o.type = 'square';
        o.start();
        o.stop(audioCtx.currentTime + 0.06);
    } else if (type === 'explode') {
        o.frequency.value = 120 + Math.random() * 400;
        g.gain.value = 0.12;
        o.type = 'sawtooth';
        o.start();
        o.stop(audioCtx.currentTime + 0.12);
    }
}

// ====== DRAW ======
function drawPlayer() {
    // draw a rotated ship pointing at the mouse
    const dx = mouse.x - player.x;
    const dy = mouse.y - player.y;
    const angle = Math.atan2(dy, dx);

    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(angle);

    // shadow / glow
    ctx.shadowColor = 'rgba(255,255,255,0.06)';
    ctx.shadowBlur = 12;

    // body gradient
    const g = ctx.createRadialGradient(-6, 0, 2, 0, 0, player.size);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(1, player.color);

    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(player.size, 0);
    ctx.lineTo(-player.size * 0.6, -player.size * 0.75);
    ctx.lineTo(-player.size * 0.6, player.size * 0.75);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
}

function drawEnemies() {
    const now = performance.now();
    enemies.forEach((enemy) => {
        const pulse = 1 + Math.sin((now + enemy.x) / 300) * 0.08;
        const r = enemy.size * pulse;
        const grad = ctx.createRadialGradient(enemy.x - r*0.3, enemy.y - r*0.3, 1, enemy.x, enemy.y, r);
        grad.addColorStop(0, '#a8ffb0');
        grad.addColorStop(1, enemy.color);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, r, 0, Math.PI * 2);
        ctx.fill();
    });
}

function drawBullets() {
    bullets.forEach((b) => {
        const grad = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.size * 3);
        grad.addColorStop(0, 'rgba(255,255,120,1)');
        grad.addColorStop(1, 'rgba(255,200,0,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.size * 2.2, 0, Math.PI * 2);
        ctx.fill();
    });
}

function drawParticles() {
    particles.forEach((p) => {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.life / 1.2);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    });
}

function drawWalls() {
    walls.forEach((w) => {
        if (w.type === 'ramp') {
            ctx.fillStyle = '#a78d5f';
            ctx.beginPath();
            ctx.moveTo(w.x, w.y + w.height);
            ctx.lineTo(w.x + w.width, w.y + w.height);
            ctx.lineTo(w.x + w.width, w.y);
            ctx.closePath();
            ctx.fill();
        } else {
            ctx.fillStyle = '#7f7f7f';
            ctx.fillRect(w.x, w.y, w.width, w.height);
        }
    });
}

function drawMap() {
    // sky gradient
    const g = ctx.createLinearGradient(0, 0, 0, canvas.height * 0.4);
    g.addColorStop(0, '#94d7ff');
    g.addColorStop(1, '#6ba8d6');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // ground base
    ctx.fillStyle = '#5b7a3d';
    ctx.fillRect(0, canvas.height * 0.2, canvas.width, canvas.height * 0.8);

    drawTileMap();
    drawDecorations();
}

function updateStorm(dt) {
    if (!storm.center || !canvas) return;
    if (storm.radius > storm.minRadius) {
        storm.radius = Math.max(storm.minRadius, storm.radius - storm.shrinkRate * dt);
    }
    const dx = player.x - storm.center.x;
    const dy = player.y - storm.center.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > storm.radius) {
        applyDamage(storm.damagePerSecond * dt);
    }
}

function drawStorm() {
    ctx.save();
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = '#0b1d42';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(storm.center.x, storm.center.y, storm.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.strokeStyle = 'rgba(255,255,255,0.75)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(storm.center.x, storm.center.y, storm.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px Arial';
    ctx.fillText('Storm radius: ' + Math.round(storm.radius), 20, 30);
    ctx.restore();
}

function initMap() {
    mapTiles = [];
    decorObjects = [];

    // default grass map
    for (let row = 0; row < mapRows; row++) {
        const line = [];
        for (let col = 0; col < mapCols; col++) {
            line.push('grass');
        }
        mapTiles.push(line);
    }

    // add an asphalt road corridor
    const roadRow = 8;
    for (let col = 0; col < mapCols; col++) {
        mapTiles[roadRow][col] = 'road';
        mapTiles[roadRow - 1][col] = 'road';
    }

    // add a river and banks
    for (let row = 2; row < 10; row++) {
        const cx = Math.floor(mapCols * 0.7 + Math.sin(row * 0.8) * 2);
        mapTiles[row][cx] = 'water';
        if (cx + 1 < mapCols) mapTiles[row][cx + 1] = 'water';
        if (cx - 1 >= 0) mapTiles[row][cx - 1] = 'bank';
    }

    // create dirt path joins
    for (let row = 4; row < 12; row++) {
        mapTiles[row][3] = 'dirt';
    }
    for (let col = 3; col < 10; col++) {
        mapTiles[11][col] = 'dirt';
    }

    // place trees and rocks
    for (let i = 0; i < 18; i++) {
        const row = Math.floor(Math.random() * mapRows);
        const col = Math.floor(Math.random() * mapCols);
        if (mapTiles[row][col] === 'grass') {
            decorObjects.push({ type: 'tree', x: col * tileSize + tileSize / 2, y: row * tileSize + tileSize / 2 });
        }
    }
    for (let i = 0; i < 10; i++) {
        const row = Math.floor(Math.random() * mapRows);
        const col = Math.floor(Math.random() * mapCols);
        if (mapTiles[row][col] === 'grass') {
            decorObjects.push({ type: 'rock', x: col * tileSize + tileSize / 2, y: row * tileSize + tileSize / 2 });
        }
    }
}

function drawTileMap() {
    for (let row = 0; row < mapRows; row++) {
        for (let col = 0; col < mapCols; col++) {
            drawTile(col, row, mapTiles[row][col]);
        }
    }

    // optional road markings
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 2;
    for (let col = 0; col < mapCols; col++) {
        const x = col * tileSize + tileSize / 2;
        const y = 8 * tileSize + tileSize * 0.2;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + tileSize * 0.6);
        ctx.setLineDash([6, 8]);
        ctx.stroke();
+        ctx.setLineDash([]);
    }
}

function drawTile(col, row, type) {
    const x = col * tileSize;
    const y = row * tileSize;
    if (type === 'grass') {
        ctx.fillStyle = '#6b8b47';
        ctx.fillRect(x, y, tileSize, tileSize);
        ctx.fillStyle = 'rgba(255,255,255,0.05)';
        ctx.fillRect(x + 2, y + 2, tileSize - 4, tileSize - 4);
    } else if (type === 'road') {
        ctx.fillStyle = '#4d4d4d';
        ctx.fillRect(x, y, tileSize, tileSize);
    } else if (type === 'dirt') {
        ctx.fillStyle = '#a17b4f';
        ctx.fillRect(x, y, tileSize, tileSize);
    } else if (type === 'water') {
        ctx.fillStyle = '#4a8cd2';
        ctx.fillRect(x, y, tileSize, tileSize);
        ctx.fillStyle = 'rgba(255,255,255,0.12)';
        ctx.beginPath();
        ctx.arc(x + tileSize * 0.5, y + tileSize * 0.4, tileSize * 0.15, 0, Math.PI * 2);
        ctx.fill();
    } else if (type === 'bank') {
        ctx.fillStyle = '#c9b085';
        ctx.fillRect(x, y, tileSize, tileSize);
    }
    ctx.strokeStyle = 'rgba(0,0,0,0.06)';
    ctx.strokeRect(x, y, tileSize, tileSize);
}

function drawDecorations() {
    decorObjects.forEach((obj) => {
        if (obj.type === 'tree') {
            drawTree(obj.x, obj.y);
        } else if (obj.type === 'rock') {
            drawRock(obj.x, obj.y);
        }
    });
}

function drawTree(x, y) {
    ctx.fillStyle = '#4f2f0a';
    ctx.fillRect(x - 4, y + 8, 8, 18);
    ctx.beginPath();
    ctx.fillStyle = '#2d6b2d';
    ctx.arc(x, y + 2, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x - 10, y + 10, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + 10, y + 10, 14, 0, Math.PI * 2);
    ctx.fill();
}

function drawRock(x, y) {
    ctx.fillStyle = '#7f7f7f';
    ctx.beginPath();
    ctx.moveTo(x - 10, y + 4);
    ctx.lineTo(x - 4, y - 8);
    ctx.lineTo(x + 8, y - 2);
    ctx.lineTo(x + 4, y + 8);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.beginPath();
    ctx.arc(x - 2, y - 2, 3, 0, Math.PI * 2);
    ctx.fill();
}

function getScaleForY(y) {
    // smaller near horizon, larger near bottom
    const t = Math.max(0, Math.min(1, (y) / canvas.height));
    return 0.5 + t * 1.2;
}

function drawEntitiesSorted() {
    const list = [];
    walls.forEach(w => list.push({ y: w.y, type: 'wall', obj: w }));
    enemies.forEach(e => list.push({ y: e.y, type: 'enemy', obj: e }));
    bullets.forEach(b => list.push({ y: b.y, type: 'bullet', obj: b }));
    list.push({ y: player.y, type: 'player', obj: player });

    list.sort((a, b) => a.y - b.y);

    list.forEach(item => {
        if (item.type === 'wall') drawWall3D(item.obj);
        if (item.type === 'enemy') drawEnemy3D(item.obj);
        if (item.type === 'bullet') drawBullet3D(item.obj);
        if (item.type === 'player') drawPlayer3D(item.obj);
    });
}

function drawShadow(x, y, size, alpha = 0.28) {
    ctx.fillStyle = `rgba(0,0,0,${alpha})`;
    ctx.beginPath();
    ctx.ellipse(x, y + size * 0.6, size * 1.4, size * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();
}

function drawEnemy3D(enemy) {
    const scale = getScaleForY(enemy.y);
    const r = enemy.size * scale;
    drawShadow(enemy.x, enemy.y, r, 0.25);
    const grad = ctx.createRadialGradient(enemy.x - r * 0.3, enemy.y - r * 0.6, 1, enemy.x, enemy.y - r * 0.2, r);
    grad.addColorStop(0, '#d8ffd8');
    grad.addColorStop(1, enemy.color);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(enemy.x, enemy.y - r * 0.2, r, 0, Math.PI * 2);
    ctx.fill();
}

function drawBullet3D(b) {
    const scale = getScaleForY(b.y);
    const r = b.size * scale;
    drawShadow(b.x, b.y, r, 0.12);
    const grad = ctx.createRadialGradient(b.x, b.y - r * 0.1, 0, b.x, b.y - r * 0.1, r * 2.2);
    grad.addColorStop(0, 'rgba(255,255,160,1)');
    grad.addColorStop(1, 'rgba(255,200,0,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(b.x, b.y - r * 0.1, r * 2.2, 0, Math.PI * 2);
    ctx.fill();
}

function drawWall3D(w) {
    const scale = getScaleForY(w.y);
    const h = w.height * scale;
    const wdt = w.width * scale;
    drawShadow(w.x + wdt / 2, w.y, Math.max(wdt, h) * 0.6, 0.22);
    ctx.fillStyle = 'rgba(140,140,140,0.95)';
    ctx.fillRect(w.x, w.y - h, wdt, h);
}

function drawPlayer3D(p) {
    const scale = getScaleForY(p.y);
    const r = p.size * scale;
    // rotated ship scaled
    const dx = mouse.x - p.x;
    const dy = mouse.y - p.y;
    const angle = Math.atan2(dy, dx);

    drawShadow(p.x, p.y, r, 0.28);

    ctx.save();
    ctx.translate(p.x, p.y - r * 0.2);
    ctx.rotate(angle);
    ctx.shadowColor = 'rgba(255,255,255,0.06)';
    ctx.shadowBlur = 12;
    const g = ctx.createRadialGradient(-6 * scale, 0, 2, 0, 0, r);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(1, p.color);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(r, 0);
    ctx.lineTo(-r * 0.6, -r * 0.75);
    ctx.lineTo(-r * 0.6, r * 0.75);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
}

// ====== MAIN LOOP ======
function gameLoop(timestamp) {
    if (!lastTime) lastTime = timestamp || performance.now();
    const dt = ((timestamp || performance.now()) - lastTime) / 1000;
    lastTime = timestamp || performance.now();

    // draw background and grid
    drawMap();

    updateStorm(dt);
    if (!paused) {
        handleMovement();
        handleEnemies();
        handleBullets();
        handlePickups();
        updateParticles(dt);
    }

    drawPickups();
    drawParticles();
    drawEntitiesSorted();
    drawStorm();

    updateHUD();

    // fps
    frames++;
    const now = performance.now();
    if (now - fpsLast >= 500) {
        fps = Math.round((frames * 1000) / (now - fpsLast));
        frames = 0;
        fpsLast = now;
        const fEl = document.getElementById('fpsDisplay');
        if (fEl) fEl.innerText = 'FPS: ' + fps;
    }

    requestAnimationFrame(gameLoop);
}

function startLoop() {
    // avoid double-start
    if (rafId) return;
    lastTime = 0;
    rafId = requestAnimationFrame(gameLoop);
}

function stopGame() {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
}

// ====== START ======
function loadSkins() {
    const saved = localStorage.getItem('ownedSkins');
    ownedSkins = saved ? JSON.parse(saved) : ['white'];
    const sel = localStorage.getItem('selectedSkin');
    selectedSkin = sel || 'white';
    const skin = skins.find(s => s.id === selectedSkin) || skins[0];
    player.color = skin.color;
}

function saveSkins() {
    localStorage.setItem('ownedSkins', JSON.stringify(ownedSkins));
    localStorage.setItem('selectedSkin', selectedSkin);
}

function openShop() {
    const modal = document.getElementById('shopModal');
    if (!modal) return;
    renderShop();
    modal.style.display = 'flex';
}

function closeShop() {
    const modal = document.getElementById('shopModal');
    if (!modal) return;
    modal.style.display = 'none';
}

function purchaseOrEquip(sid) {
    const skin = skins.find(s => s.id === sid);
    if (!skin) return;
    if (ownedSkins.includes(sid)) {
        selectedSkin = sid;
        player.color = skin.color;
        saveSkins();
        updateHUD();
        renderShop();
        return;
    }
    if (spendCoins(skin.cost)) {
        ownedSkins.push(sid);
        selectedSkin = sid;
        player.color = skin.color;
        saveSkins();
        renderShop();
    }
}

function renderShop() {
    const list = document.getElementById('skinList');
    if (!list) return;
    list.innerHTML = '';
    skins.forEach(s => {
        const item = document.createElement('div');
        item.className = 'skin-item';
        const sw = document.createElement('div');
        sw.className = 'skin-swatch';
        sw.style.background = s.color;
        const title = document.createElement('div');
        title.innerText = s.name;
        const price = document.createElement('div');
        price.innerText = s.cost > 0 ? `${s.cost} coins` : 'Free';
        const btn = document.createElement('button');
        if (ownedSkins.includes(s.id)) {
            btn.innerText = selectedSkin === s.id ? 'Equipped' : 'Equip';
        } else {
            btn.innerText = `Buy (${s.cost})`;
        }
        btn.onclick = () => purchaseOrEquip(s.id);
        item.appendChild(sw);
        item.appendChild(title);
        item.appendChild(price);
        item.appendChild(btn);
        list.appendChild(item);
    });
}

function attachShopHandlers() {
    const openBtn = document.getElementById('openShopBtn');
    const closeBtn = document.getElementById('closeShopBtn');
    if (openBtn) openBtn.addEventListener('click', openShop);
    if (closeBtn) closeBtn.addEventListener('click', closeShop);
    // close on background click
    const modal = document.getElementById('shopModal');
    if (modal) modal.addEventListener('click', (e) => { if (e.target === modal) closeShop(); });
    // controls
    const pauseBtn = document.getElementById('pauseBtn');
    const resetBtn = document.getElementById('resetBtn');
    const soundBtn = document.getElementById('soundToggle');
    if (pauseBtn) pauseBtn.addEventListener('click', () => { paused = !paused; pauseBtn.innerText = paused ? 'Resume' : 'Pause'; });
    if (resetBtn) resetBtn.addEventListener('click', () => resetGame());
    if (soundBtn) soundBtn.addEventListener('click', () => { soundEnabled = !soundEnabled; soundBtn.innerText = 'Sound: ' + (soundEnabled ? 'On' : 'Off'); });
}

function resetGame() {
    // keep coins and skins, reset dynamic state
    bullets = [];
    enemies = [];
    walls = [];
    pickups = [];
    player.x = canvas.width / 2;
    player.y = canvas.height / 2;
    player.health = 100;
    player.shield = 0;
    materials = 120;
    score = 0;
    storm.center = { x: canvas.width / 2, y: canvas.height / 2 };
    storm.radius = Math.max(canvas.width, canvas.height) * 0.7;
    storm.minRadius = 120;
    updateHUD();
}

if (!canvas || !ctx) {
    window.addEventListener('load', () => {
        canvas = document.getElementById("gameCanvas");
        ctx = canvas.getContext("2d");
        initMap();
        canvas.width = mapCols * tileSize;
        canvas.height = mapRows * tileSize;
        player.x = canvas.width / 2;
        player.y = canvas.height / 2;
        storm.center = { x: canvas.width / 2, y: canvas.height / 2 };
        storm.radius = Math.max(canvas.width, canvas.height) * 0.7;
        storm.minRadius = 120;
        attachInput();
        attachShopHandlers();
        loadSkins();
        updateHUD();
        startLoop();
    });
} else {
    initMap();
    canvas.width = mapCols * tileSize;
    canvas.height = mapRows * tileSize;
    player.x = canvas.width / 2;
    player.y = canvas.height / 2;
    storm.center = { x: canvas.width / 2, y: canvas.height / 2 };
    storm.radius = Math.max(canvas.width, canvas.height) * 0.7;
    storm.minRadius = 120;
    attachInput();
    attachShopHandlers();
    loadSkins();
    updateHUD();
    startLoop();
}
