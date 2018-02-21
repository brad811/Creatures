class Wall extends WorldObject {
  constructor(world, v1, v2) {
    super(world);
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

    // the default getPosition will always return 0.0,0.0 for this body
    this.body.getPosition = function() {
      return Vec2(
        (v1.x + v2.x) / 2,
        (v1.y + v2.y) / 2
      );
    };

    this.shape = "rectangle";
    this.v1 = v1;
    this.v2 = v2;

    this.sizeX = Math.abs(v2.x - v1.x);
    this.sizeY = Math.abs(v2.y - v1.y);
  }

  step() {}

  render(ctx) {
    Renderer.renderEdge(ctx, this.v1, this.v2);
  }

  handleCollision(ownFixture, otherFixture) {}
  handleCollisionEnd(ownFixture, otherFixture) {}
}
