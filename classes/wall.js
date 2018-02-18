class Wall {
  constructor(world, v1, v2) {
    this.type = "wall";
    this.body = world.createBody();
    this.body.createFixture({
      shape: pl.Edge(v1, v2),
      userData: {
        type: "object",
        isSolid: true,
        parentObject: this
      }
    });

    this.v1 = v1;
    this.v2 = v2;
  }

  step() {}

  render(ctx) {
    Renderer.renderEdge(ctx, this.v1, this.v2);
  }

  handleCollision(ownFixture, otherFixture) {}
  handleCollisionEnd(ownFixture, otherFixture) {}
}