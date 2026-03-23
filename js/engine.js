const GAME_WIDTH  = 480;
const GAME_HEIGHT = 700;
const GAME_SCALE = 1;
const WORLD_WIDTH = GAME_WIDTH;
const WORLD_HEIGHT = GAME_HEIGHT;

class CollisionBlock {
  constructor({ position, height = 16, width = 16 }) {
    this.position = position
    this.width = width
    this.height = height
  }
 
  draw() {
    c.fillStyle = 'rgba(255, 0, 0, 0.5)'
    c.fillRect(this.position.x, this.position.y, this.width, this.height)
  }

  update() {
    this.draw()
  }
}

class Sprite {
  constructor({ position, imageSrc, frameRate = 1, animations, frameBuffer = 2, loop = true, autoplay = true }) {
    this.position = position
    this.image = new Image()
    this.image.onload = () => {
      this.loaded = true
      this.width = this.image.width / this.frameRate
      this.height = this.image.height
    }
    this.image.src = imageSrc
    this.loaded = false
    this.frameRate = frameRate
    this.currentFrame = 0
    this.elapsedFrames = 0
    this.frameBuffer = frameBuffer
    this.animations = animations
    this.loop = loop
    this.autoplay = autoplay
    this.currentAnimation = null

    if (this.animations) {
      for (let key in this.animations) {
        const image = new Image()
        image.src = this.animations[key].imageSrc
        this.animations[key].image = image
      }
    }
  }

  draw() {
    if (!this.loaded) return
    const cropbox = {
      position: {
        x: this.width * this.currentFrame,
        y: 0,
      },
      width: this.width,
      height: this.height,
    }

    c.drawImage(
      this.image,
      cropbox.position.x,
      cropbox.position.y,
      cropbox.width,
      cropbox.height,
      this.position.x,
      this.position.y,
      this.width,
      this.height
    )

    this.updateFrames()
  }

  updateFrames() {
    if (!this.autoplay) return

    this.elapsedFrames++

    if (this.elapsedFrames % this.frameBuffer === 0) {
      if (this.currentFrame < this.frameRate - 1) this.currentFrame++
      else if (this.loop) this.currentFrame = 0
    }
  }
}

class Player extends Sprite {
  constructor({ position, collisionBlocks = [], platformCollisionBlocks = [], imageSrc, frameRate, animations, loop }) {
    super({ imageSrc, frameRate, animations, loop })
    this.position = position
    this.velocity = {
      x: 0,
      y: 0,
    }
    this.collisionBlocks = collisionBlocks
    this.platformCollisionBlocks = platformCollisionBlocks
    this.hitbox = {
      position: {
        x: this.position.x,
        y: this.position.y,
      },
      width: 10,
      height: 10,
    }
    this.animations = animations
    this.lastDirection = 'right'
    this.isOnGround = false
  }

  update() {
    this.position.x += this.velocity.x

    this.updateHitbox()
    this.checkForHorizontalCollision()
    this.applyGravity()

    this.updateHitbox()
    this.checkForVerticalCollision()
  }

  handleInput(keys) {
    if (this.preventInput) return
    this.velocity.x = 0
    if (keys.d.pressed) {
      this.switchSprite('RunRight')
      this.velocity.x = 5
      this.lastDirection = 'right'
    } else if (keys.a.pressed) {
      this.switchSprite('RunLeft')
      this.velocity.x = -5
      this.lastDirection = 'left'
    } else {
      if (this.lastDirection === 'right') this.switchSprite('IdleRight')
      else this.switchSprite('IdleLeft')
    }
  }

  switchSprite(name) {
    if (this.image === this.animations[name].image) return
    this.currentFrame = 0
    this.image = this.animations[name].image
    this.frameRate = this.animations[name].frameRate
    this.frameBuffer = this.animations[name].frameBuffer
    this.loop = this.animations[name].loop
    this.currentAnimation = this.animations[name]
  }

  updateHitbox() {
    this.hitbox = {
      position: {
        x: this.position.x + 58,
        y: this.position.y + 34,
      },
      width: 50,
      height: 53,
    }
  }

  checkForHorizontalCollision() {
    for (let i = 0; i < this.collisionBlocks.length; i++) {
      const collisionBlock = this.collisionBlocks[i]

      if (
        this.hitbox.position.x <= collisionBlock.position.x + collisionBlock.width &&
        this.hitbox.position.x + this.hitbox.width >= collisionBlock.position.x &&
        this.hitbox.position.y + this.hitbox.height >= collisionBlock.position.y &&
        this.hitbox.position.y <= collisionBlock.position.y + collisionBlock.height
      ) {
        if (this.velocity.x < -0) {
          const offset = this.hitbox.position.x - this.position.x
          this.position.x = collisionBlock.position.x + collisionBlock.width - offset + 0.01
          break
        }

        if (this.velocity.x > 0) {
          const offset = this.hitbox.position.x - this.position.x + this.hitbox.width
          this.position.x = collisionBlock.position.x - offset - 0.01
          break
        }
      }
    }
  }

  applyGravity() {
    this.velocity.y += gravity
    this.position.y += this.velocity.y
  }

  checkForVerticalCollision() {
    for (let i = 0; i < this.collisionBlocks.length; i++) {
      const collisionBlock = this.collisionBlocks[i]

      if (
        this.hitbox.position.x <= collisionBlock.position.x + collisionBlock.width &&
        this.hitbox.position.x + this.hitbox.width >= collisionBlock.position.x &&
        this.hitbox.position.y + this.hitbox.height >= collisionBlock.position.y &&
        this.hitbox.position.y <= collisionBlock.position.y + collisionBlock.height
      ) {
        if (this.velocity.y < 0) {
          this.velocity.y = 0
          const offset = this.hitbox.position.y - this.position.y
          this.position.x = collisionBlock.position.y + collisionBlock.height - offset + 0.01
          break
        }

        if (this.velocity.y > 0) {
          this.velocity.y = 0
          this.isOnGround = true
          const offset = this.hitbox.position.y - this.position.y + this.hitbox.height
          this.position.y = collisionBlock.position.y - offset - 0.01
          break
        }
      }
    }

    for (let i = 0; i < this.platformCollisionBlocks.length; i++) {
        const platformCollisionBlock = this.platformCollisionBlocks[i]
  
        if (
          platformCollisionBlock.position.y + platformCollisionBlock.height <= this.hitbox.position.y + this.hitbox.height &&
          this.hitbox.position.x <= platformCollisionBlock.position.x + platformCollisionBlock.width &&
          this.hitbox.position.x + this.hitbox.width >= platformCollisionBlock.position.x &&
          this.hitbox.position.y + this.hitbox.height >= platformCollisionBlock.position.y &&
          this.hitbox.position.y <= platformCollisionBlock.position.y + platformCollisionBlock.height
        ) {
           if (this.velocity.y > 0) {
            this.velocity.y = 0
            this.isOnGround = true
            const offset = this.hitbox.position.y - this.position.y + this.hitbox.height
            this.position.y = platformCollisionBlock.position.y - offset - 0.01
            break
          }
        }
      }
  }

  shouldPanCameraDown({ camera, canvas }) {
      if (this.velocity.y < 0) return
  }

  shouldPanCameraUp({ camera, canvas }) {
      if (this.velocity.y > 0) return
  }

  checkForHorizontalCanvasCollision(){
    if (this.position.x + this.width + this.velocity.x >= GAME_WIDTH || 
        this.position.x + this.velocity.x <= 0) {
        this.velocity.x = 0
    }
  }
}