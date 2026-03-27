const WORLD_COLS  = 15;
const WORLD_ROWS  = 200;
const GAME_SCALE  = 2;
const WORLD_WIDTH  = WORLD_COLS * 16;
const WORLD_HEIGHT = WORLD_ROWS * 16;

function _seededRng(seed) {
  return function () {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
const _rng = _seededRng(42);
function _randInt(min, max) {
  return Math.floor(_rng() * (max - min + 1)) + min;
}

const floorCollisions = new Array(WORLD_COLS * WORLD_ROWS).fill(0);
for (let col = 0; col < WORLD_COLS; col++) {
  floorCollisions[(WORLD_ROWS - 1) * WORLD_COLS + col] = 202;
}

const platformCollisions = new Array(WORLD_COLS * WORLD_ROWS).fill(0);
const platformGroups = [];

let _prevCol   = 0;
let _prevWidth = 5;
let _pIdx      = 0;
let _row       = WORLD_ROWS - 4;

let _zoneLength = 0;
let _isHardZone = false;
function _startNewZone() {
  _zoneLength = _randInt(4, 8);
  _isHardZone = _rng() < 0.4;
}
_startNewZone();

// Create a wide starting ground platform at the bottom 
{
  const groundRow = WORLD_ROWS - 3 ; // slightly above bottom
  const groundWidth = WORLD_COLS; // Full width 
  const groundStartCol = 0;
  for (let col = groundStartCol; col < groundStartCol + groundWidth;col++){
    platformCollisions[groundRow * WORLD_COLS + col] = 202;
   
 }
 platformGroups.push({
  x: groundStartCol * 16,
  y: groundRow * 16,
  width: groundWidth * 16,
  stoneType: 99 // Special ground stone type
 });
 // set initial values for platform generation 
 _prevCol = Math.floor((WORLD_COLS - 5) / 2);
 _prevWidth = 5;

  _pIdx++;
  _row = groundRow - 6; // Start platforms 6 rows above the ground
}

let _lastSide = 0;

while (_row >= 0) {
  if (_zoneLength <= 0) _startNewZone();
  _zoneLength--;

  let platWidth;
  if (_isHardZone) {
    const roll = _rng();
    if (roll < 0.35)      platWidth = 2;
    else if (roll < 0.75) platWidth = 3;
    else                  platWidth = 4;
  } else {
    const roll = _rng();
    if (roll < 0.10)      platWidth = 2;
    else if (roll < 0.35) platWidth = 3;
    else if (roll < 0.70) platWidth = 4;
    else                  platWidth = 5;
  }

  const prevCenter = _prevCol + _prevWidth / 2;
  const maxJumpTiles = _isHardZone ? 5 : 6;

  let minCol = Math.max(0, Math.floor(prevCenter - maxJumpTiles - platWidth / 2));
  let maxCol = Math.min(WORLD_COLS - platWidth, Math.floor(prevCenter + maxJumpTiles - platWidth / 2));

  let startCol;
  const halfCols = Math.floor(WORLD_COLS / 2);

  if (_lastSide >= 0 && minCol < halfCols - 1) {
    startCol = _randInt(minCol, Math.min(Math.max(minCol, halfCols - 2), maxCol));
    _lastSide = -1;
  } else if (_lastSide < 0 && maxCol > halfCols) {
    startCol = _randInt(Math.max(minCol, halfCols), maxCol);
    _lastSide = 1;
  } else {
    startCol = _randInt(minCol, maxCol);
    _lastSide = (startCol + platWidth / 2 < halfCols) ? -1 : 1;
  }

  startCol = Math.max(0, Math.min(WORLD_COLS - platWidth, startCol));

  let stoneType;
  if (platWidth <= 2)       stoneType = _randInt(3, 3);
  else if (platWidth === 3) stoneType = _randInt(0, 2);
  else if (platWidth === 4) stoneType = _randInt(1, 5);
  else                      stoneType = _randInt(4, 5);

  for (let col = startCol; col < startCol + platWidth; col++) {
    platformCollisions[_row * WORLD_COLS + col] = 202;
  }
  platformGroups.push({ x: startCol * 16, y: _row * 16, width: platWidth * 16, stoneType });

  _prevCol = startCol;
  _prevWidth = platWidth;
  _pIdx++;

  _row -= 5;
}

const floorCollisions2D = [];
for (let i = 0; i < floorCollisions.length; i += WORLD_COLS) {
  floorCollisions2D.push(floorCollisions.slice(i, i + WORLD_COLS));
}
const collisionBlocks = [];
floorCollisions2D.forEach((row, y) => {
  row.forEach((symbol, x) => {
    if (symbol === 202) {
      collisionBlocks.push(new CollisionBlock({ position: { x: x * 16, y: y * 16 } }));
    }
  });
});

const platformCollisionBlocks = [];
platformGroups.forEach((group) => {
if (group.stoneType === 99) {
  //Ground platform - full width, no overhang 
  platformCollisionBlocks.push(
  new CollisionBlock({ position: { x: group.x, y: group.y},height:16, width:group.width}),
  );
} else {
  //Regular platforms with overhang 
  const overhang = Math.min(16,group.width * 0.2);
  const fullWidth = group.width + overhang;
  const startX = group.x - overhang / 2;
  platformCollisionBlocks.push(
    new CollisionBlock({ position: { x: startX, y: group.y}, height:14,width:fullWidth}),
  );
}
});
const bgImage = new Image();
bgImage.src = "./assets/img/background/background2.jpg";
let bgLoaded = false;
bgImage.onload = () => { bgLoaded = true; };

function drawBackground() {
  if (typeof portalSystem !== "undefined" && portalSystem && portalSystem.worldTransition > 0) {
    portalSystem.drawNewWorldBackground(c);
    return;
  }
  if (bgLoaded) c.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
}

const camera = {
  position: { x: 0, y: 0 },
};

let worldTopY = _row * 16;

function extendWorldUpward(targetY) {
  while (_row * 16 > targetY) {
    if (_zoneLength <= 0) _startNewZone();
    _zoneLength--;

    let platWidth;
    if (_isHardZone) {
      const roll = _rng();
      if (roll < 0.35)      platWidth = 2;
      else if (roll < 0.75) platWidth = 3;
      else                  platWidth = 4;
    } else {
      const roll = _rng();
      if (roll < 0.10)      platWidth = 2;
      else if (roll < 0.35) platWidth = 3;
      else if (roll < 0.70) platWidth = 4;
      else                  platWidth = 5;
    }

    const prevCenter = _prevCol + _prevWidth / 2;
    const maxJumpTiles = _isHardZone ? 5 : 6;
    let minCol = Math.max(0, Math.floor(prevCenter - maxJumpTiles - platWidth / 2));
    let maxCol = Math.min(WORLD_COLS - platWidth, Math.floor(prevCenter + maxJumpTiles - platWidth / 2));

    let startCol;
    const halfCols = Math.floor(WORLD_COLS / 2);
    if (_lastSide >= 0 && minCol < halfCols - 1) {
      startCol = _randInt(minCol, Math.min(Math.max(minCol, halfCols - 2), maxCol));
      _lastSide = -1;
    } else if (_lastSide < 0 && maxCol > halfCols) {
      startCol = _randInt(Math.max(minCol, halfCols), maxCol);
      _lastSide = 1;
    } else {
      startCol = _randInt(minCol, maxCol);
      _lastSide = (startCol + platWidth / 2 < halfCols) ? -1 : 1;
    }
    startCol = Math.max(0, Math.min(WORLD_COLS - platWidth, startCol));

    let stoneType;
    if (platWidth <= 2)       stoneType = _randInt(3, 3);
    else if (platWidth === 3) stoneType = _randInt(0, 2);
    else if (platWidth === 4) stoneType = _randInt(1, 5);
    else                      stoneType = _randInt(4, 5);

    const platY = _row * 16;
    const platX = startCol * 16;
    const width = platWidth * 16;
    const newIdx = platformGroups.length;

    platformGroups.push({ x: platX, y: platY, width, stoneType });

    const overhang = Math.min(16, width * 0.2);
    const fullWidth = width + overhang;
    platformCollisionBlocks.push(
      new CollisionBlock({ position: { x: platX - overhang / 2, y: platY }, height: 14, width: fullWidth })
    );

    if (typeof addStoneCache === "function") {
      addStoneCache({ x: platX, y: platY, width, stoneType });
    }

    if (typeof _spawnForNewPlatform === "function") _spawnForNewPlatform(newIdx);
    if (typeof _maybeSpawnBat === "function") _maybeSpawnBat(newIdx);

    _prevCol = startCol;
    _prevWidth = platWidth;
    _pIdx++;
    _row -= 5;
  }
  worldTopY = _row * 16;
}

function checkWorldExtension() {
  const visibleTopY = -camera.position.y;
  if (visibleTopY - worldTopY < 400) {
    extendWorldUpward(worldTopY - 800);
  }
}

function clampCamera() {
  const maxCamY = -worldTopY;
  if (camera.position.y > maxCamY) camera.position.y = maxCamY;
  const minCamY = -(WORLD_HEIGHT - scaledCanvas.height);
  if (camera.position.y < minCamY) camera.position.y = minCamY;
  camera.position.x = 0;
}