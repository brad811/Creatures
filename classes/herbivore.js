class Herbivore extends Creature {
  constructor(world, position) {
    super(world, position);

    this.type = "herbivore";
    this.color = "rgb(130,130,180)";
    this.foodTypes = ["plant"];
    this.threatTypes = ["predator"];
  }

  getNewInstance(world, position) {
    return new Herbivore(world, position);
  }

  step() {
    super.step();
  }

  render(ctx) {
    super.render(ctx);
  }
}

