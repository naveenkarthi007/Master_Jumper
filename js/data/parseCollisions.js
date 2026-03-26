const floorCollisions2D = [];
for (let i = 0; i < floorCollisions.length; i += WORLD_COLS) {
  floorCollisions2D.push(floorCollisions.slice(i, i + WORLD_COLS));
}

const collisionBlocks = [];
floorCollisions2D.forEach((row, y) => {
  row.forEach((symbol, x) => {
    if (symbol === 202) {
      collisionBlocks.push(
        new CollisionBlock({ position: { x: x * 16, y: y * 16 } }),
      );
    }
  });
});

const platformCollisionBlocks = [];

platformGroups.forEach((group) => {
  const overhang = Math.min(16, group.width * 0.2);
  const fullWidth = group.width + overhang;
  const startX = group.x - overhang / 2;

  platformCollisionBlocks.push(
    new CollisionBlock({
      position: { x: startX, y: group.y },
      height: 14,
      width: fullWidth,
    }),
  );
});