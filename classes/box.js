class Box {
  constructor(world, position, size) {
    this.type = "box";
    this.body = world.createBody();
    this.body.setPosition(position);
    this.body.createFixture({
      shape: pl.Box(size.x/2, size.y/2),
      userData: {
        type: "object",
        isSolid: true,
        parentObject: this
      }
    });
    this.size = size;
  }

  step() {}

  render(ctx) {
    Renderer.renderBox(ctx, this.body.getPosition(), this.size);
  }

  handleCollision(ownFixture, otherFixture) {}
  handleCollisionEnd(ownFixture, otherFixture) {}
}