class Predator extends Creature {
  constructor(world) {
    super(world);

    this.type = "predator";
    this.color = "rgb(180,80,80)";
  }

  step() {
    super.step();
  }

  render(ctx) {
    super.render(ctx);
  }

  handleCollision(ownFixture, otherFixture) {
    // TODO
  }

  handleCollisionEnd(ownFixture, otherFixture) {
    // TODO
  }
}

