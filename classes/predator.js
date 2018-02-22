class Predator extends Creature {
  constructor(world) {
    super(world);

    this.type = "predator";
    this.color = "rgb(180,80,80)";

    // TODO: implement eating behavior
    this.genes = {
      mutationRate: 1.0, // percent
      reproductionTime: 60.0, // seconds
      maxEnergy: 10.0,
      energyUse: 0.0, // per second
      lifespan: 300.0, // seconds
      decayTime: 100.0 // seconds
    };
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

