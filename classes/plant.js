class Plant extends LifeForm {
  constructor(world, position) {
    super(world);

    this.type = "plant";
    this.color = "rgb(80,180,80)";
    this.shape = "circle";
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

    var timeMultiplier = 2;
    this.genes = {
      mutationRate: 1.0, // percent
      reproductionTime: 60.0 / timeMultiplier, // seconds
      reproductionDistance: 4.0, // meters
      lifespan: 300.0 / timeMultiplier, // seconds
      decayTime: 150.0 / timeMultiplier // seconds
    };
  }

  step() {
    super.step();

    if(this.deathTime != -1) {
      if((Date.now() - this.deathTime) / 1000 > this.genes["decayTime"]) {
        worldObjects.splice( worldObjects.indexOf(this), 1 );
        world.destroyBody(this.body);
        return;
      }

      // don't do anything, we're dead
      return;
    }

    // TODO: add some randomness to this?
    // all the plants appear and disappear in giant groups right now
    // and it looks weird
    if(this.deathTime == -1 && (Date.now() - this.lastReproductionTime) / 1000 > this.genes["reproductionTime"]) {
      this.lastReproductionTime = Date.now();

      // time to reproduce!
      for(var tries=0; tries<10; tries++) {
        var angle = Math.random() * Math.PI*2;
        var distance = Math.random()*this.genes["reproductionDistance"] + this.size;

        var newPosition = Vec2(
          this.body.getPosition().x + distance * Math.cos(angle),
          this.body.getPosition().y + distance * Math.sin(angle)
        );

        //console.log("Plant at ("+this.body.getPosition().x.toFixed(2)+","+this.body.getPosition().y.toFixed(2)+") trying: ("+newPosition.x.toFixed(2)+","+newPosition.y.toFixed(2)+") (distance: "+distance+")(actual: "+MathHelper.linearDistance(this.body.getPosition(), newPosition)+")");

        if(!WouldCircleIntersectAnything(newPosition, Vec2(this.size, this.size))) {
          var newPlant = new Plant(world, newPosition);
          newPlant.genes = this.getMutatedGenes();
          worldObjects.unshift( newPlant );
          break;
        }
      }
    }

    if(this.deathTime == -1 && (Date.now() - this.birthTime) / 1000 > this.genes["lifespan"]) {
      this.deathTime = Date.now();
      this.color = "rgba(180, 120, 100, 0.2)";
      return;
    }

    if(this.deathTime != -1) {
      return;
    }
  }

  render(ctx) {
    // body
    Renderer.renderCircle(ctx, this.body.getPosition(), this.size/2, this.color);
  }

  handleCollision(ownFixture, otherFixture) {}

  handleCollisionEnd(ownFixture, otherFixture) {}
}

