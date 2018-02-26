class Predator extends Creature {
  constructor(world, position) {
    super(world, position);

    this.type = "predator";
    this.color = "rgb(180,80,80)";
    this.foodType = "creature";

    // just overwrite a couple of genes for now
    this.genes["energyUse"] = 0.0;
    this.genes["lifespan"] = 99999.0;
  }

  reproduce() {
    // disable reproduction for now
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

