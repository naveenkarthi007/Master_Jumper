const floorCollisions2D = []
for (let i = 0; i < 30; i++) {
  floorCollisions2D.push(1) 
}

const collisionBlocks = []
const platformCollisionBlocks = []

const floorY = WORLD_HEIGHT - 32
for (let i = 0; i < 30; i++) {
    collisionBlocks.push(new CollisionBlock({
      position: {
        x: i * 16,
        y: floorY,
      },
    }))
}

for (let i = 0; i < 40; i++) {
    collisionBlocks.push(new CollisionBlock({
      position: {
        x: 0,
        y: i * 16,
      },
    }))
     collisionBlocks.push(new CollisionBlock({
      position: {
        x: WORLD_WIDTH - 16,
        y: i * 16,
      },
    }))
}

platformCollisionBlocks.push(new CollisionBlock({ position: { x: 100, y: WORLD_HEIGHT - 100 }, width: 100, height: 16 }))
platformCollisionBlocks.push(new CollisionBlock({ position: { x: 300, y: WORLD_HEIGHT - 200 }, width: 100, height: 16 }))
platformCollisionBlocks.push(new CollisionBlock({ position: { x: 150, y: WORLD_HEIGHT - 300 }, width: 100, height: 16 }))