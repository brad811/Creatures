class WorldObject {
  constructor(world) {
    this.type = "world-object";
    this.color = "rgb(255,0,255)";

    this.sizeX = 0.0;
    this.sizeY = 0.0;
  }

  step() {}

  render(ctx) {}

  handleCollision(ownFixture, otherFixture) {}

  handleCollisionEnd(ownFixture, otherFixture) {}
}

