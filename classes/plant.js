class Plant extends LifeForm {
  constructor(world, position) {
    super(world);

    this.type = "plant";
    this.color = "rgb(80,180,80)";
    this.size = 1.0;
    this.sizeX = this.size;
    this.sizeY = this.size;

    this.body = world.createBody({
      type: 'static',
      position: position
    });

    this.mainPart = this.body.createFixture({
      shape: pl.Circle(this.size/2),
      isSensor: true,
      userData: {
        type: "body",
        isSolid: false,
        parentObject: this
      }
    });

    // TODO: some plants could have size, and eating shrinks them, and growing... grows them
    // TODO: things must have an energy cost, can't just endlessly reproduce for free
    this.genes = {
      mutationRate: 1.0, // percent
      reproductionTime: 28.0, // seconds
      reproductionDistance: 4.0, // meters
      lifespan: 60.0, // seconds
      decayTime: 120.0 // seconds
    };

    this.birthTime = Date.now();
    this.deathTime = -1;
    this.lastReproductionTime = Date.now();
    this.failedReproductionAttempts = 0;
  }

  step() {
    super.step();

    if(this.deathTime != -1 && (Date.now() - this.deathTime) / 1000 > this.genes["decayTime"]) {
      // don't do this here, add it to a list of "to be removed" items,
      // and let the world step handle it
      worldObjects.splice( worldObjects.indexOf(this), 1 );
      return;
    }

    if(this.deathTime == -1 && (Date.now() - this.birthTime) / 1000 > this.genes["lifespan"]) {
      this.deathTime = Date.now();
      this.color = "rgb(180, 120, 100)";
      return;
    }

    if(this.deathTime != -1) {
      return;
    }

    if((Date.now() - this.lastReproductionTime) / 1000 > this.genes["reproductionTime"]) {
      this.lastReproductionTime = Date.now();

      // time to reproduce!
      for(var tries=0; tries<10; tries++) {
        var distance = this.genes["reproductionDistance"];

        var newPosition = Vec2(
          this.body.getPosition().x - distance/2 + Math.random()*distance,
          this.body.getPosition().y - distance/2 + Math.random()*distance
        );

        if(!WouldIntersectAnything(newPosition, Vec2(this.size, this.size))) {
          var newPlant = new Plant(world, newPosition);
          newPlant.genes = this.getMutatedGenes();
          worldObjects.push( newPlant );
          break;
        }
        // else {
        //   // draw failed attempts to place plants in red
        //   console.log("Fail!");
        //   var redPlant = new Plant(world, newPosition);
        //   redPlant.color = "rgb(150,0,0)";
        //   worldObjects.push(redPlant);
        // }
      }

      this.failedReproductionAttempts += 1;
    }
  }

  render(ctx) {
    // body
    Renderer.renderCircle(ctx, this.body.getPosition(), this.size/2, this.color);
  }

  handleCollision(ownFixture, otherFixture) {}

  handleCollisionEnd(ownFixture, otherFixture) {}
}

