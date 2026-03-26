const FLY_DURATION     = 600;
const FLY_COOLDOWN_MAX = 360;
const FLY_RISE_SPEED   = -2.0;

const FLY_SX = 64, FLY_SY = 65, FLY_SW = 22, FLY_SH = 23;

let flyPowerActive = false;
let flyPowerTimer  = 0;
let flyCooldown    = 0;

let _flyAuraAngle  = 0;
let _flyWingTick   = 0;
let _flyParticles  = [];
let _flyBtnReady   = false;

const _flyBirdImg    = new Image();
let   _flyBirdLoaded = false;
_flyBirdImg.onload   = () => { _flyBirdLoaded = true; };
_flyBirdImg.onerror  = () => { _flyBirdLoaded = false; };
_flyBirdImg.src = "./assets/img/powers.png";

function activateFlyPower() {
  if (flyPowerActive || flyCooldown > 0 || gameOver) return;
  flyPowerActive = true;
  flyPowerTimer  = FLY_DURATION;
  _flyWingTick   = 0;
  _flyAuraAngle  = 0;
  _spawnFlyBurst();
}

function _deactivateFlyPower() {
  flyPowerActive = false;
  flyCooldown    = FLY_COOLDOWN_MAX;
  _spawnFlyBurst(8, "#88BBDD");
}

function _spawnFlyBurst(count = 24, color = null) {
  const ph = player.hitbox;
  const ox = ph.position.x + ph.width  / 2;
  const oy = ph.position.y + ph.height / 2;
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
    const spd   = 1.2 + Math.random() * 2.5;
    const hue   = color ? null : 35 + Math.random() * 16;
    _flyParticles.push({
      x: ox, y: oy,
      vx: Math.cos(angle) * spd,
      vy: Math.sin(angle) * spd - 0.4,
      life:    35 + Math.floor(Math.random() * 20),
      maxLife: 55,
      size:    2 + Math.random() * 3,
      color:   color ?? `hsl(${hue}, 100%, 70%)`,
    });
  }
}

function updateFlyPower() {
  if (!flyPowerActive) {
    if (flyCooldown > 0) flyCooldown--;
    _updateFlyParticles();
    return;
  }

  flyPowerTimer--;
  if (flyPowerTimer <= 0) {
    _deactivateFlyPower();
    _updateFlyParticles();
    return;
  }

  player.velocity.y = FLY_RISE_SPEED;
  if (player.velocity.y < FLY_RISE_SPEED) player.velocity.y = FLY_RISE_SPEED;

  player.shouldPanCameraDown({ camera, canvas });

  _flyAuraAngle += 0.055;
  _flyWingTick++;

  _updateFlyParticles();
}

function _updateFlyParticles() {
  for (let i = _flyParticles.length - 1; i >= 0; i--) {
    const p = _flyParticles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.life--;
    if (p.life <= 0) _flyParticles.splice(i, 1);
  }
}

function _tickFlyParticles() {
  for (let i = _flyParticles.length - 1; i >= 0; i--) {
    const p = _flyParticles[i];
    if (p.life <= 0) continue;

    const a = p.life / p.maxLife;
    c.save();
    c.globalAlpha = a;

    if (p.type === "streak") {
      c.strokeStyle = `hsl(${p.hue},100%,75%)`;
      c.lineWidth   = p.size;
      c.lineCap     = "round";
      c.beginPath();
      c.moveTo(p.x, p.y);
      c.lineTo(p.x + p.vx * 2, p.y + p.len);
      c.stroke();

    } else if (p.type === "spark") {
      c.fillStyle = `hsl(${p.hue},100%,78%)`;
      c.beginPath();
      c.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      c.fill();

    } else if (p.type === "star") {
      const s = p.size;
      c.fillStyle = `hsl(${p.hue},100%,85%)`;
      c.beginPath();
      for (let pt = 0; pt < 4; pt++) {
        const ang  = (pt / 4) * Math.PI * 2;
        const angH = ang + Math.PI / 4;
        const r1   = s * 1.8, r2 = s * 0.55;
        if (pt === 0) c.moveTo(p.x + Math.cos(ang) * r1, p.y + Math.sin(ang) * r1);
        else          c.lineTo(p.x + Math.cos(ang) * r1, p.y + Math.sin(ang) * r1);
        c.lineTo(p.x + Math.cos(angH) * r2, p.y + Math.sin(angH) * r2);
      }
      c.closePath();
      c.fill();

    } else {
      c.fillStyle = p.color ?? `hsl(38,100%,65%)`;
      c.beginPath();
      c.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      c.fill();
    }

    c.restore();
  }
}

const _KING_WING_FRAMES = [
  { sx:  50, sy:  20, sw: 307, sh: 181 },
  { sx:  66, sy: 215, sw: 275, sh: 144 },
  { sx: 101, sy: 387, sw: 206, sh: 139 },
];
const _KING_WING_SEQ = [0, 1, 2, 1];
const _KING_WING_BUF = 10;

const _kingWingsImg    = new Image();
let   _kingWingsLoaded = false;
_kingWingsImg.onload   = () => { _kingWingsLoaded = true; };
_kingWingsImg.src      = "./assets/img/warrior/king.wings1.png";

function drawWingSprites() {
  if (!flyPowerActive || !_kingWingsLoaded) return;

  const seqIdx = Math.floor(_flyWingTick / _KING_WING_BUF) % _KING_WING_SEQ.length;
  const frame  = _KING_WING_FRAMES[_KING_WING_SEQ[seqIdx]];

  const hb = player.hitbox;
  const dh = hb.height * 1.2;
  const dw = (frame.sw / frame.sh) * dh;

  const cx = hb.position.x + hb.width  / 2;
  const cy = hb.position.y + hb.height / 2 - dh / 2;

  const wingAlpha = flyPowerTimer <= 60 ? flyPowerTimer / 60 : 1.0;

  c.save();
  c.globalAlpha = wingAlpha;

  if (player.lastDirection === "left") {
    c.translate(cx, cy);
    c.scale(-1, 1);
    c.drawImage(_kingWingsImg,
      frame.sx, frame.sy, frame.sw, frame.sh,
      -dw / 2, 0, dw, dh);
  } else {
    c.drawImage(_kingWingsImg,
      frame.sx, frame.sy, frame.sw, frame.sh,
      cx - dw / 2, cy, dw, dh);
  }

  c.restore();
}

function drawFlyPowerEffects() {
  if (!flyPowerActive && _flyParticles.length === 0) return;

  _tickFlyParticles();

  if (!flyPowerActive) return;

  const ph   = player.hitbox;
  const hx   = ph.position.x + ph.width  / 2;
  const hy   = ph.position.y + ph.height / 2;
  const prog = flyPowerTimer / FLY_DURATION;
  const tick = _flyWingTick;

  c.save();

  const outerR  = 48 + 4 * Math.sin(tick * 0.07);
  const outerGr = c.createRadialGradient(hx, hy, 4, hx, hy, outerR);
  outerGr.addColorStop(0,   `rgba(255, 180, 30, ${0.28 * prog})`);
  outerGr.addColorStop(0.4, `rgba(200, 100, 10, ${0.15 * prog})`);
  outerGr.addColorStop(1,   `rgba(80, 20, 0, 0)`);
  c.fillStyle = outerGr;
  c.beginPath();
  c.arc(hx, hy, outerR, 0, Math.PI * 2);
  c.fill();

  if (flyPowerTimer < 120) {
    const t      = flyPowerTimer / 120;
    const pulseA = (1 - t) * 0.22 * Math.abs(Math.sin(tick * 0.25));
    const urgGr  = c.createRadialGradient(hx, hy, 0, hx, hy, 36);
    urgGr.addColorStop(0, `rgba(255,60,60,${pulseA})`);
    urgGr.addColorStop(1, `rgba(200,0,0,0)`);
    c.fillStyle = urgGr;
    c.beginPath();
    c.arc(hx, hy, 36, 0, Math.PI * 2);
     c.fill();
  }

  c.restore();
}

function _drawBirdShape(ctx, x, y, w, h, flapY) {
  ctx.save();
  ctx.translate(x + w / 2, y + h / 2);
  ctx.scale(1, flapY);

  ctx.fillStyle = "#FFD700";
  ctx.beginPath();
  ctx.ellipse(0, 2, w * 0.38, h * 0.30, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#FFA500";
  ctx.beginPath();
  ctx.ellipse(-2, -2, w * 0.42, h * 0.18, -0.3, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#FF8C00";
  ctx.beginPath();
  ctx.ellipse(-2, 6, w * 0.38, h * 0.14, 0.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#1a1a1a";
  ctx.beginPath();
  ctx.arc(w * 0.22, -1, w * 0.07, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(w * 0.23, -1.4, w * 0.03, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#FF6600";
  ctx.beginPath();
  ctx.moveTo(w * 0.36, 2);
  ctx.lineTo(w * 0.52, 0);
  ctx.lineTo(w * 0.36, 5);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

function drawFlyButton() {
  const SIZE  = 46;
  const PAD   = 14;
  const bx    = canvas.width  - SIZE - PAD;
  const by    = canvas.height - SIZE - PAD;
  const cx    = bx + SIZE / 2;
  const cy    = by + SIZE / 2;
  const radius = SIZE / 2;

  const ready  = !flyPowerActive && flyCooldown === 0 && !gameOver;
  const active = flyPowerActive;

  c.save();

  // Disable image smoothing for pixel-perfect rendering
  c.imageSmoothingEnabled = false;

  // Draw circular border
  c.strokeStyle = active ? "#FFD700" : ready ? "#CC8800" : "#555";
  c.lineWidth = 2;
  c.beginPath();
  c.arc(cx, cy, radius, 0, Math.PI * 2);
  c.stroke();

  // Clip to circle
  c.beginPath();
  c.arc(cx, cy, radius - 1, 0, Math.PI * 2);
  c.clip();

  // Apply filter if not ready
  if (!active && !ready) c.filter = "grayscale(80%) brightness(0.45)";

  // Draw sprite centered - using integer scaling for clarity
  const spriteSize = 22 * 2; // Use integer scaling (2x instead of 1.8x)
  const spritePad = (SIZE - spriteSize) / 2;

  if (_flyBirdLoaded) {
    c.drawImage(_flyBirdImg, FLY_SX, FLY_SY, FLY_SW, FLY_SH,
      bx + spritePad, by + spritePad, spriteSize, spriteSize);
  } else {
    _drawBirdShape(c, bx + spritePad, by + spritePad, spriteSize, spriteSize, 1);
  }

  c.restore();

  if (!_flyBtnReady) {
    _flyBtnReady = true;
    canvas.addEventListener("pointerdown", (e) => {
      const rect = canvas.getBoundingClientRect();
      const scx  = canvas.width  / rect.width;
      const scy  = canvas.height / rect.height;
      const mx   = (e.clientX - rect.left) * scx;
      const my   = (e.clientY - rect.top)  * scy;
      const dx   = mx - cx;
      const dy   = my - cy;
      if (dx * dx + dy * dy <= radius * radius) {
        activateFlyPower();
      }
    });
  }
}

window.addEventListener("keydown", (e) => {
  if (e.key === "f" || e.key === "F") activateFlyPower();
});