# wishfartnite19012

A small HTML5 canvas game. Changes made:

- Added a canvas-based HUD and responsive layout.
- Improved graphics: gradient background, pulsing enemies, particle effects, rotated player, and mouse-aimed shooting.

How to run locally

Option 1 — Python (if installed):

```powershell
python -m http.server 8000
# then open http://localhost:8000
```

Option 2 — Node (http-server):

```powershell
npm install
npm start
# then open http://localhost:8000
```

Development notes

- Files: `index.html`, `game.js`, `style.css`.
- To change player color, edit `player.color` in `game.js` or implement a skin UI.

New features added by the assistant:

- Improved graphics (gradient background, particles, 2.5D perspective, depth sorting)
- Realistic isometric map visuals with terrain tiles, water, road, dirt paths, trees, and rocks
- Isometric and WebGL (three.js) renderer modes selectable from the UI
- Mouse-aimed shooting, touch support, and keyboard controls (WASD, Space to shoot)
- Skin shop with persistent ownership and equip/purchase using in-game coins
- Score, high-score persistence, pause/reset controls, FPS display
- Varied enemy types (basic / fast / tank) with different rewards
- Simple in-browser sound effects (no downloads) and helper scripts for running locally

No downloads required

You can run the game without installing anything — just open `index.html` in your browser (double-click the file). The game loads everything locally and should work from the file system. WebGL mode uses a CDN for three.js so it requires an internet connection.

