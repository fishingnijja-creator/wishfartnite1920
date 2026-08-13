// Isometric renderer for map and game entities
let isoRaf = null;
let isoCanvas = document.getElementById('gameCanvas');
let isoCtx = isoCanvas ? isoCanvas.getContext('2d') : null;

function isoToScreen(x, y) {
    const tileW = tileSize;
    const tileH = tileSize * 0.5;
    const sx = (x - y) * tileW * 0.5 + isoCanvas.width * 0.5;
    const sy = (x + y) * tileH * 0.25 + 40;
    return { x: sx, y: sy };
}

function drawIsoTile(col, row, type) {
    const baseX = col * tileSize;
    const baseY = row * tileSize;
    const { x, y } = isoToScreen(baseX, baseY);
    const tileW = tileSize;
    const tileH = tileSize * 0.5;
    const corners = [
        { x: x, y: y - tileH },
        { x: x + tileW * 0.5, y: y },
        { x: x, y: y + tileH },
        { x: x - tileW * 0.5, y: y }
    ];
    let fill = '#6b8b47';
    if (type === 'road') fill = '#575757';
    if (type === 'dirt') fill = '#8f6a44';
    if (type === 'water') fill = '#3f7bb3';
    if (type === 'bank') fill = '#c0a06f';
    isoCtx.fillStyle = fill;
    isoCtx.beginPath();
    corners.forEach((p, index) => {
        if (index === 0) isoCtx.moveTo(p.x, p.y);
        else isoCtx.lineTo(p.x, p.y);
    });
    isoCtx.closePath();
    isoCtx.fill();
    isoCtx.strokeStyle = 'rgba(0,0,0,0.12)';
    isoCtx.stroke();
    if (type === 'water') {
        isoCtx.strokeStyle = 'rgba(255,255,255,0.15)';
        isoCtx.lineWidth = 2;
        isoCtx.beginPath();
        isoCtx.moveTo(corners[0].x + 6, corners[0].y + 4);
        isoCtx.quadraticCurveTo(corners[1].x - 5, corners[1].y - 10, corners[2].x - 4, corners[2].y - 2);
        isoCtx.stroke();
        isoCtx.lineWidth = 1;
    }
}

function drawIsoMap() {
    // sky and distance fog
    const sky = isoCtx.createLinearGradient(0, 0, 0, isoCanvas.height * 0.35);
    sky.addColorStop(0, '#99d9ff');
    sky.addColorStop(1, '#6ca6d3');
    isoCtx.fillStyle = sky;
    isoCtx.fillRect(0, 0, isoCanvas.width, isoCanvas.height * 0.35);

    // ground fill
    isoCtx.fillStyle = '#4f7a3d';
    isoCtx.fillRect(0, isoCanvas.height * 0.35, isoCanvas.width, isoCanvas.height * 0.65);

    // tile map
    for (let row = 0; row < mapRows; row++) {
        for (let col = 0; col < mapCols; col++) {
            drawIsoTile(col, row, mapTiles[row][col]);
        }
    }
}

function drawIsoTree(x, y) {
    const pos = isoToScreen(x, y);
    isoCtx.fillStyle = '#4a2f0a';
    isoCtx.fillRect(pos.x - 5, pos.y + 10, 10, 18);
    isoCtx.fillStyle = '#2e731f';
    isoCtx.beginPath();
    isoCtx.arc(pos.x, pos.y + 2, 18, 0, Math.PI * 2);
    isoCtx.fill();
    isoCtx.beginPath();
    isoCtx.arc(pos.x - 12, pos.y + 12, 12, 0, Math.PI * 2);
    isoCtx.fill();
    isoCtx.beginPath();
    isoCtx.arc(pos.x + 12, pos.y + 12, 12, 0, Math.PI * 2);
    isoCtx.fill();
}

function drawIsoRock(x, y) {
    const pos = isoToScreen(x, y);
    isoCtx.fillStyle = '#7b7b7b';
    isoCtx.beginPath();
    isoCtx.moveTo(pos.x - 12, pos.y + 10);
    isoCtx.lineTo(pos.x - 2, pos.y - 8);
    isoCtx.lineTo(pos.x + 10, pos.y + 2);
    isoCtx.lineTo(pos.x + 6, pos.y + 14);
    isoCtx.closePath();
    isoCtx.fill();
    isoCtx.fillStyle = 'rgba(255,255,255,0.25)';
    isoCtx.beginPath();
    isoCtx.arc(pos.x - 4, pos.y + 2, 3, 0, Math.PI * 2);
    isoCtx.fill();
}

function drawIsoEntities() {
    const sorted = [];
    walls.forEach(w => sorted.push({ y: w.y + w.height, type: 'wall', obj: w }));
    enemies.forEach(e => sorted.push({ y: e.y, type: 'enemy', obj: e }));
    bullets.forEach(b => sorted.push({ y: b.y, type: 'bullet', obj: b }));
    pickups.forEach(p => sorted.push({ y: p.y, type: 'pickup', obj: p }));
    sorted.push({ y: player.y, type: 'player', obj: player });
    sorted.sort((a, b) => a.y - b.y);

    sorted.forEach(item => {
        if (item.type === 'wall') drawIsoWall(item.obj);
        if (item.type === 'enemy') drawIsoEnemy(item.obj);
        if (item.type === 'bullet') drawIsoBullet(item.obj);
        if (item.type === 'pickup') drawIsoPickup(item.obj);
        if (item.type === 'player') drawIsoPlayer(item.obj);
    });
}

function drawIsoWall(w) {
    const pos = isoToScreen(w.x, w.y + w.height);
    const h = w.height * 0.5;
    isoCtx.fillStyle = '#7a7a7a';
    isoCtx.fillRect(pos.x - w.width * 0.25, pos.y - h, w.width * 0.5, h);
    isoCtx.fillStyle = '#606060';
    isoCtx.fillRect(pos.x - w.width * 0.25, pos.y - h, 4, h);
}

function drawIsoEnemy(enemy) {
    const pos = isoToScreen(enemy.x, enemy.y);
    const radius = enemy.size * 0.7;
    const grad = isoCtx.createRadialGradient(pos.x, pos.y - radius * 0.2, 1, pos.x, pos.y, radius);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(1, enemy.color);
    isoCtx.fillStyle = grad;
    isoCtx.beginPath();
    isoCtx.arc(pos.x, pos.y - radius * 0.2, radius, 0, Math.PI * 2);
    isoCtx.fill();
    isoCtx.fillStyle = 'rgba(0,0,0,0.18)';
    isoCtx.beginPath();
    isoCtx.ellipse(pos.x, pos.y + radius * 0.7, radius * 0.9, radius * 0.35, 0, 0, Math.PI * 2);
    isoCtx.fill();
}

function drawIsoPickup(pick) {
    const pos = isoToScreen(pick.x, pick.y);
    const pulse = 1 + Math.sin(performance.now() / 250) * 0.08;
    const radius = pick.radius * pulse;
    const grad = isoCtx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, radius * 1.4);
    grad.addColorStop(0, pick.color || '#ff8888');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    isoCtx.fillStyle = grad;
    isoCtx.beginPath();
    isoCtx.arc(pos.x, pos.y, radius * 1.4, 0, Math.PI * 2);
    isoCtx.fill();
    isoCtx.strokeStyle = '#ffffff';
    isoCtx.lineWidth = 2;
    isoCtx.beginPath();
    isoCtx.moveTo(pos.x - 6, pos.y);
    isoCtx.lineTo(pos.x, pos.y - 8);
    isoCtx.lineTo(pos.x + 6, pos.y);
    isoCtx.moveTo(pos.x, pos.y - 8);
    isoCtx.lineTo(pos.x, pos.y + 8);
    isoCtx.stroke();
}

function drawIsoBullet(b) {
    const pos = isoToScreen(b.x, b.y);
    isoCtx.fillStyle = 'rgba(255,220,60,0.95)';
    isoCtx.beginPath();
    isoCtx.arc(pos.x, pos.y - 2, b.size * 1.4, 0, Math.PI * 2);
    isoCtx.fill();
}

function drawIsoPlayer(p) {
    const pos = isoToScreen(p.x, p.y);
    const radius = p.size * 0.8;
    isoCtx.fillStyle = p.color;
    isoCtx.beginPath();
    isoCtx.arc(pos.x, pos.y - radius * 0.3, radius, 0, Math.PI * 2);
    isoCtx.fill();
    isoCtx.fillStyle = 'rgba(0,0,0,0.16)';
    isoCtx.beginPath();
    isoCtx.ellipse(pos.x, pos.y + radius * 0.6, radius * 0.9, radius * 0.35, 0, 0, Math.PI * 2);
    isoCtx.fill();
}

function isoLoop(timestamp) {
    isoRaf = requestAnimationFrame(isoLoop);
    const now = timestamp || performance.now();
    if (!isoLoop.last) isoLoop.last = now;
    const dt = (now - isoLoop.last) / 1000;
    isoLoop.last = now;

    isoCtx.clearRect(0, 0, isoCanvas.width, isoCanvas.height);
    drawIsoMap();
    drawIsoDecor();

    if (typeof handleMovement === 'function') handleMovement(dt);
    if (typeof handleEnemies === 'function') handleEnemies(dt);
    if (typeof handleBullets === 'function') handleBullets(dt);
    if (typeof updateParticles === 'function') updateParticles(dt);

    drawIsoEntities();
    if (typeof drawParticles === 'function') drawParticles();
}

function drawIsoDecor() {
    decorObjects.sort((a, b) => (a.y + a.x) - (b.y + b.x));
    decorObjects.forEach((obj) => {
        if (obj.type === 'tree') drawIsoTree(obj.x, obj.y);
        if (obj.type === 'rock') drawIsoRock(obj.x, obj.y);
    });
}

function startIsometric() {
    if (!isoCtx) isoCtx = document.getElementById('gameCanvas').getContext('2d');
    if (isoRaf) return;
    isoLoop();
}

function stopIsometric() {
    if (isoRaf) cancelAnimationFrame(isoRaf);
    isoRaf = null;
}
