const canvas = document.querySelector("canvas");
const c = canvas.getContext("2d");

const camera = { position: { x: 0, y: 0 } };

let flyPowerActive = false;
let gameOver = false;
let heroHP = 3;
let deathTimer = 0;

function checkAttackHitBats() {}

function resizeCanvas() {
  const scaleX = window.innerWidth / GAME_WIDTH;
  const scaleY = window.innerHeight / GAME_HEIGHT;
  const fitScale = Math.min(scaleX, scaleY);
  canvas.width  = GAME_WIDTH;
  canvas.height = GAME_HEIGHT;
  canvas.style.width  = Math.floor(GAME_WIDTH  * fitScale) + "px";
  canvas.style.height = Math.floor(GAME_HEIGHT * fitScale) + "px";
  c.imageSmoothingEnabled = false;
}
resizeCanvas();

let scaledCanvas = {
  width:  GAME_WIDTH  / GAME_SCALE,
  height: GAME_HEIGHT / GAME_SCALE,
};

window.addEventListener("resize", () => {
  resizeCanvas();
  scaledCanvas = {
    width:  GAME_WIDTH  / GAME_SCALE,
    height: GAME_HEIGHT / GAME_SCALE,
  };
});

camera.position.y = -(WORLD_HEIGHT - scaledCanvas.height);

const gravity = 0.07;

const player = new Player({
  position: {
    x: Math.floor((WORLD_WIDTH - 40) / 2),
    y: WORLD_HEIGHT - 80,
  },
  collisionBlocks,
  platformCollisionBlocks,
  imageSrc: "./assets/img/warrior/Idle.png",
  frameRate: 8,
  animations: {
    Idle:     { imageSrc: "./assets/img/warrior/Idle.png",     frameRate: 8, frameBuffer: 3 },
    Run:      { imageSrc: "./assets/img/warrior/Run.png",      frameRate: 8, frameBuffer: 5 },
    Jump:     { imageSrc: "./assets/img/warrior/Jump.png",     frameRate: 2, frameBuffer: 3 },
    Fall:     { imageSrc: "./assets/img/warrior/Fall.png",     frameRate: 2, frameBuffer: 3 },
    FallLeft: { imageSrc: "./assets/img/warrior/FallLeft.png", frameRate: 2, frameBuffer: 3 },
    RunLeft:  { imageSrc: "./assets/img/warrior/RunLeft.png",  frameRate: 8, frameBuffer: 5 },
    IdleLeft: { imageSrc: "./assets/img/warrior/IdleLeft.png", frameRate: 8, frameBuffer: 3 },
    JumpLeft: { imageSrc: "./assets/img/warrior/JumpLeft.png", frameRate: 2, frameBuffer: 3 },
  },
});

function updateHero() {
  player.checkForHorizontalCanvasCollision();
  player.update();

  player.velocity.x = 0;
  if (keys.d.pressed) {
    player.switchSprite("Run");
    player.velocity.x = 2.5;
    player.lastDirection = "right";
  } else if (keys.a.pressed) {
    player.switchSprite("RunLeft");
    player.velocity.x = -2.5;
    player.lastDirection = "left";
  } else if (player.velocity.y === 0) {
    if (player.lastDirection === "right") player.switchSprite("Idle");
    else player.switchSprite("IdleLeft");
  }

  if (player.velocity.y < 0) {
    player.shouldPanCameraDown({ camera, canvas });
    if (player.lastDirection === "right") player.switchSprite("Jump");
    else player.switchSprite("JumpLeft");
  } else if (player.velocity.y > 0) {
    player.shouldPanCameraUp({ camera, canvas });
    if (player.lastDirection === "right") player.switchSprite("Fall");
    else player.switchSprite("FallLeft");
  }
}

function checkRespawn() {
  if (player.position.y > WORLD_HEIGHT + 100) {
    player.position.x = Math.floor((WORLD_WIDTH - 40) / 2);
    player.position.y = WORLD_HEIGHT - 80;
    player.velocity.y = 0;
    camera.position.y = -(WORLD_HEIGHT - scaledCanvas.height);
  }
}

const keys = { d: { pressed: false }, a: { pressed: false } };

window.addEventListener("keydown", (event) => {
  if (event.repeat) return;
  switch (event.key) {
    case "d": case "ArrowRight": keys.d.pressed = true;  break;
    case "a": case "ArrowLeft":  keys.a.pressed = true;  break;
    case "w": case "ArrowUp": case " ":
      if (player.isOnGround) {
        player.velocity.y = -3.5;
        player.isOnGround = false;
      }
      break;
  }
});

window.addEventListener("keyup", (event) => {
  switch (event.key) {
    case "d": case "ArrowRight": keys.d.pressed = false; break;
    case "a": case "ArrowLeft":  keys.a.pressed = false; break;
  }
});

let _touchControlsInit = false;
function initTouchControls() {
  if (_touchControlsInit) return;
  _touchControlsInit = true;

  canvas.addEventListener("touchstart", (e) => {
    e.preventDefault();
    
    const rect = canvas.getBoundingClientRect();
    for (const touch of e.touches) {
      const x = touch.clientX - rect.left;
      const relX = x / rect.width;
      
      if (relX < 0.33) {
        keys.a.pressed = true;
      } else if (relX > 0.67) {
        keys.d.pressed = true;
      } else {
        if (player.isOnGround) {
          player.velocity.y = -3.5;
          player.isOnGround = false;
        }
      }
    }
  }, { passive: false });

  canvas.addEventListener("touchend", (e) => {
    e.preventDefault();
    if (e.touches.length === 0) {
      keys.a.pressed = false;
      keys.d.pressed = false;
    }
  }, { passive: false });

  canvas.addEventListener("touchmove", (e) => {
    e.preventDefault();
  }, { passive: false });
}

setTimeout(initTouchControls, 100);

function animate() {
  window.requestAnimationFrame(animate); 
  c.fillStyle = '#111';
  c.fillRect(0, 0, canvas.width, canvas.height); 
  
  c.save();
  c.scale(GAME_SCALE, GAME_SCALE);
  c.translate(camera.position.x, camera.position.y);
  
  collisionBlocks.forEach((block) => {
    block.update();
  });
  platformCollisionBlocks.forEach((block) => {
    block.update();
  });

  updateHero();
  player.draw();
  checkRespawn();

  c.restore();
}

animate();