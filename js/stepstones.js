const stoneImg = new Image();
stoneImg.src = "./assets/img/stepstone.png";
let stoneLoaded = false;

const stoneSprites = [
  { sx: 20,  sy: 9,   sw: 128, sh: 156 },
  { sx: 218, sy: 17,  sw: 126, sh: 122 },
  { sx: 172, sy: 144, sw: 125, sh: 128 },
  { sx: 41,  sy: 219, sw: 85,  sh: 103 },
  { sx: 4,   sy: 357, sw: 182, sh: 173 },
  { sx: 93,  sy: 544, sw: 146, sh: 141 },
  { sx: 204, sy: 299, sw: 103, sh: 126 },
];

const _stoneCaches = [];

stoneImg.onload = () => {
  stoneLoaded = true;
  _stoneCaches.length = 0;

  platformGroups.forEach((group) => {
    const stone = stoneSprites[group.stoneType % stoneSprites.length];
    const overhang = Math.min(16, group.width * 0.2);
    const drawW = Math.round(group.width + overhang);
    const drawH = Math.round(drawW * (stone.sh / stone.sw));

    const off = document.createElement("canvas");
    off.width = drawW;
    off.height = drawH;
    const oc = off.getContext("2d");
    oc.imageSmoothingEnabled = false;
    oc.drawImage(stoneImg, stone.sx, stone.sy, stone.sw, stone.sh, 0, 0, drawW, drawH);

    _stoneCaches.push({ canvas: off, overhang, drawW, drawH });
  });
};

function drawSteppingStones() {
  if (!stoneLoaded) return;
  platformGroups.forEach((group, i) => {
    const cache = _stoneCaches[i];
    if (!cache) return;
    const drawX = group.x - cache.overhang / 2;
    const drawY = group.y;
    c.drawImage(cache.canvas, drawX, drawY);
  });
}