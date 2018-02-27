class Predator extends Creature {
  constructor(world, position) {
    super(world, position);

    this.type = "predator";
    this.color = "rgb(180,80,80)";
    this.foodTypes = ["creature"];
    this.threatTypes = [];

    // seek food less often
    this.hungerThreshhold = 0.6;
    this.genes["energyUse"] = 0.08;
    this.genes["reproductionTime"] = 300;
    this.genes["lifespan"] = 900;
  }

  getNewInstance(world, position) {
    return new Predator(world, position);
  }

  step() {
    super.step();
  }

  render(ctx) {
    super.render(ctx);
  }
}

