const stoneImg = new Image();
stoneImg.src = "./assets/img/stepstone.png";
let stoneLoaded = false;

const groundStoneImg = new Image();
groundStoneImg.src = "./assets/img/groundstone.png";
let groundStoneLoaded = false;

const stoneSprites = [
  { sx: 20, sy: 9, sw: 128, sh: 156 },
  { sx: 218, sy: 17, sw: 126, sh: 122 },
  { sx: 172, sy: 144, sw: 125, sh: 128 },
  { sx: 41, sy: 219, sw: 85, sh: 103 },
  { sx: 4, sy: 357, sw: 182, sh: 173 },
  { sx: 93, sy: 544, sw: 146, sh: 141 },
  { sx: 204, sy: 299, sw: 103, sh: 126 },
];

// Ground stone sprite from groundstone.png
const groundStoneSprite = { sx: 55, sy: 134, sw: 501, sh: 160 };

// Maximum height for stepping stones to prevent them from being too tall
const MAX_STONE_HEIGHT = 50;

// Fixed ground height
const GROUND_HEIGHT = 50;

const _stoneCaches = [];

groundStoneImg.onload = () => {
  groundStoneLoaded = true;
  _rebuildCaches();
};

stoneImg.onload = () => {
  stoneLoaded = true;
  _rebuildCaches();
};

function _rebuildCaches() {
  if (!stoneLoaded || !groundStoneLoaded) return;
  _stoneCaches.length = 0;
  platformGroups.forEach((group) => {
    // Check if this is the ground platform (stoneType 99)
    if (group.stoneType === 99) {
      // Use ground stone sprite with fixed height
      const stone = groundStoneSprite;
      const drawW = group.width;
      const drawH = GROUND_HEIGHT;
      const off = document.createElement("canvas");
      off.width = drawW;
      off.height = drawH;
      const oc = off.getContext("2d");
      oc.imageSmoothingEnabled = false;
      oc.drawImage(groundStoneImg, stone.sx, stone.sy, stone.sw, stone.sh, 0, 0, drawW, drawH);
      _stoneCaches.push({ canvas: off, overhang: 0, drawW, drawH });
    } else {
      // Use regular stepping stone sprites with height limit
      const stone = stoneSprites[group.stoneType % stoneSprites.length];
      const overhang = Math.min(16, group.width * 0.2);
      const drawW = Math.round(group.width + overhang);
      let drawH = Math.round(drawW * (stone.sh / stone.sw));
      drawH = Math.min(drawH, MAX_STONE_HEIGHT); // Limit height
      const off = document.createElement("canvas");
      off.width = drawW;
      off.height = drawH;
      const oc = off.getContext("2d");
      oc.imageSmoothingEnabled = false;
      oc.drawImage(stoneImg, stone.sx, stone.sy, stone.sw, stone.sh, 0, 0, drawW, drawH);
      _stoneCaches.push({ canvas: off, overhang, drawW, drawH });
    }
  });
}

function drawSteppingStones() {
  if (!stoneLoaded || !groundStoneLoaded) return;
  platformGroups.forEach((group, i) => {
    const cache = _stoneCaches[i];
    if (!cache) return;
    const drawX = group.x - cache.overhang / 2;
    const drawY = group.y;
    c.drawImage(cache.canvas, drawX, drawY);
  });
}

// Function to add cache for a dynamically created platform
function addStoneCache(group) {
  if (!stoneLoaded || !groundStoneLoaded) return;
  if (group.stoneType === 99) {
    const stone = groundStoneSprite;
    const drawW = group.width;
    const drawH = GROUND_HEIGHT;
    const off = document.createElement("canvas");
    off.width = drawW;
    off.height = drawH;
    const oc = off.getContext("2d");
    oc.imageSmoothingEnabled = false;
    oc.drawImage(groundStoneImg, stone.sx, stone.sy, stone.sw, stone.sh, 0, 0, drawW, drawH);
    _stoneCaches.push({ canvas: off, overhang: 0, drawW, drawH });
  } else {
    const stone = stoneSprites[group.stoneType % stoneSprites.length];
    const overhang = Math.min(16, group.width * 0.2);
    const drawW = Math.round(group.width + overhang);
    let drawH = Math.round(drawW * (stone.sh / stone.sw));
    drawH = Math.min(drawH, MAX_STONE_HEIGHT); // Limit height
    const off = document.createElement("canvas");
    off.width = drawW;
    off.height = drawH;
    const oc = off.getContext("2d");
    oc.imageSmoothingEnabled = false;
    oc.drawImage(stoneImg, stone.sx, stone.sy, stone.sw, stone.sh, 0, 0, drawW, drawH);
    _stoneCaches.push({ canvas: off, overhang, drawW, drawH });
  }
}