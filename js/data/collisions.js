const WORLD_COLS = 15;                  
const WORLD_ROWS = 200;
const GAME_SCALE = 2;                 
const WORLD_WIDTH = WORLD_COLS * 16;
const WORLD_HEIGHT = WORLD_ROWS * 16;

const floorCollisions = new Array(WORLD_COLS * WORLD_ROWS).fill(0);

for (let col = 0; col < WORLD_COLS; col++) {
  floorCollisions[(WORLD_ROWS - 1) * WORLD_COLS + col] = 202;
}

const platformCollisions = new Array(WORLD_COLS * WORLD_ROWS).fill(0);

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

const platformGroups = [];


let _prevCol = 0;
let _prevWidth = 5;
let _pIdx = 0;
let _row = WORLD_ROWS - 4;

let _zoneLength = 0; 
let _isHardZone = false;

function _startNewZone() {
  _zoneLength = _randInt(4, 8); 
  _isHardZone = _rng() < 0.4;   
}
_startNewZone();

{
  const startDef = { startCol: Math.floor((WORLD_COLS - 6) / 2), width: 6 };
  for (let col = startDef.startCol; col < startDef.startCol + startDef.width; col++) {
    platformCollisions[_row * WORLD_COLS + col] = 202;
  }
  platformGroups.push({
    x: startDef.startCol * 16,
    y: _row * 16,
    width: startDef.width * 16,
    stoneType: 4,
  });
  _prevCol = startDef.startCol;
  _prevWidth = startDef.width;
  _pIdx++;
  _row -= _randInt(5, 6);
}

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
  const maxJumpTiles = _isHardZone ? 4 : 5; 

  let minCol = Math.max(0, Math.floor(prevCenter - maxJumpTiles - platWidth / 2));
  let maxCol = Math.min(WORLD_COLS - platWidth, Math.floor(prevCenter + maxJumpTiles - platWidth / 2));

  let startCol;
  if (_isHardZone && _rng() < 0.4) {

    if (_rng() < 0.5) {
      startCol = _randInt(minCol, Math.min(minCol + 2, maxCol));
    } else {
      startCol = _randInt(Math.max(minCol, maxCol - 2), maxCol);
    }
  } else {
    const biasRoll = _rng();
    if (biasRoll < 0.30) {
      startCol = _randInt(minCol, Math.max(minCol, Math.floor((minCol + maxCol) / 2) - 1));
    } else if (biasRoll < 0.60) {
      startCol = _randInt(Math.min(maxCol, Math.ceil((minCol + maxCol) / 2) + 1), maxCol);
    } else {
      startCol = _randInt(minCol, maxCol);
    }
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

  platformGroups.push({
    x: startCol * 16,
    y: _row * 16,
    width: platWidth * 16,
    stoneType: stoneType,
  });

  _prevCol = startCol;
  _prevWidth = platWidth;
  _pIdx++;

  let vertGap;
  if (_isHardZone) {
    vertGap = 5;
  } else {
    vertGap = 5;
  }
  _row -= vertGap;

  if (_row < 0 && _row + vertGap > 0) {
    const topPlatWidth = 4;
    const topStartCol = Math.floor((WORLD_COLS - topPlatWidth) / 2);
    for (let col = topStartCol; col < topStartCol + topPlatWidth; col++) {
      platformCollisions[col] = 202;
    }
    platformGroups.push({
      x: topStartCol * 16,
      y: 0,
      width: topPlatWidth * 16,
      stoneType: 3,
    });
  }
}