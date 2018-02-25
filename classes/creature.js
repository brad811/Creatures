class Creature extends LifeForm {
  constructor(world, position) {
    super(world);

    this.type = "creature";
    this.maxSpeed = 20.0;
    this.maxTurnSpeed = 16.0;
    this.maxAcceleration = 80.0;

    this.curSpeed = 0.0;
    this.curTurnSpeed = 0.0;
    this.curAcceleration = 0.0;
    this.state = new CreatureStateRelaxed(this);

    this.color = "rgb(120, 120, 120)";

    this.shape = "circle";
    this.size = 2.0;
    this.sizeX = this.size;
    this.sizeY = this.size;

    this.body = world.createBody({
      type: 'dynamic',
      position: position,
      angle: Math.random() * Math.PI*2,
      linearDamping: 7.0,
      angularDamping: 7.0
    });

    this.target = Vec2(this.body.getPosition().x, this.body.getPosition().y);
    this.targetAngle = Math.random() * Math.PI*2;

    this.mainPart = this.body.createFixture({
      shape: pl.Circle(this.size/2),
      friction: 0.5,
      restitution: 0.8,
      density: 1.0,
      userData: {
        type: "body",
        isSolid: true,
        parentObject: this
      }
    });

    this.smellSensorSize = 10.0;
    this.smellSensor = this.body.createFixture({
      shape: pl.Circle(this.smellSensorSize),
      isSensor: true,
      userData: {
        type: "sensor",
        isSolid: false,
        parentObject: this
      }
    });
    this.smells = new Set([]);

    this.stateFinishTime = 0;
    this.panic = function() {
      this.state = new CreatureStatePanic(this);
      this.stateFinishTime = worldTime + 10*1000;
    }

    this.lastTargetAngleChange = worldTime;

    this.genes = {
      mutationRate: 1.0, // percent
      reproductionTime: 120.0, // seconds
      maxEnergy: 10.0,
      energyUse: 0.1, // per second
      lifespan: 900.0, // seconds
      decayTime: 120.0 // seconds
    };

    this.curEnergy = this.genes["maxEnergy"];
    this.lastEnergyLoss = worldTime;
  }

  determineBehaviorState() {
    // some states overpower other behaviors
    if(this.stateFinishTime > worldTime) {
      // we have to stay in our current state a little longer
    } else if(this.state.type == "panic") {
      this.state = new CreatureStateRelaxed(this);
    } else {
      for(const smellWorldObject of this.smells) {
        // see if we smell a predator
        if(smellWorldObject.type == "predator") {
          // make sure we're running from the predator
          if(this.state.type != "run-from-threat") {
            //change to state if we're not already in it
            this.state = new CreatureStateRunFromThreat(this, smellWorldObject);
          }

          // we still smell it, keep running!
          this.stateFinishTime = worldTime + 1*1000;

          // don't check more smells or become relaxed
          return;
        } else if(this.state.type == "hungry" && smellWorldObject.type == "plant" && smellWorldObject.deathTime == -1) {
          if(this.state.type != "head-for-food") {
            // TODO: move this to the hungry state?
            // change to state if we're not already in it

            // TODO: check if we have line of sight to the food?
            // creatures will get stuck behind other creatures
            // (sometimes dead ones) trying to get to food they smell

            this.state = new CreatureStateHeadForFood(this);
            return;
          }
        }
      }

      // see if we are hungry
      if(this.curEnergy <= this.genes["maxEnergy"] * 0.9) {
        if(this.state.type != "hungry" && this.state.type != "head-for-food") {
          this.state = new CreatureStateHungry(this);
        }

        return;
      }

      // nothing going on, we're chill
      if(this.state.type != "relaxed") {
        this.state = new CreatureStateRelaxed(this);
      }
    }
  }

  reproduce() {
    // asexually reproduce if it's been enough time and we're relaxed
    if((worldTime - this.lastReproductionTime) / 1000 > this.genes["reproductionTime"] && this.state.type == "relaxed") {
      this.lastReproductionTime = worldTime;

      // time to reproduce!
      for(var tries=0; tries<5; tries++) {
        var angle = Math.random() * Math.PI*2;
        var newPosition = Vec2(
          this.body.getPosition().x + this.size * Math.cos(angle),
          this.body.getPosition().y + this.size * Math.sin(angle)
        );

        //console.log("Creature at ("+this.body.getPosition().x.toFixed(2)+","+this.body.getPosition().y.toFixed(2)+") trying: ("+newPosition.x.toFixed(2)+","+newPosition.y.toFixed(2)+") (distance: "+distance+")(actual: "+MathHelper.linearDistance(this.body.getPosition(), newPosition)+")");

        if( !WouldIntersectAnything("circle", newPosition, Vec2(this.size, this.size), ["plant"]) ) {
          var newCreature = new Creature(world, newPosition);
          newCreature.genes = this.getMutatedGenes();
          newCreature.curEnergy = this.curEnergy/2;
          this.curEnergy = this.curEnergy/2;
          worldObjects.push( newCreature );
          break;
        }
      }
    }
  }

  step() {
    if(this.deathTime != -1) {
      if((worldTime - this.deathTime) / 1000 > this.genes["decayTime"]) {
        worldObjects.splice( worldObjects.indexOf(this), 1 );
        world.destroyBody(this.body);
        return;
      }

      // don't do anything, we're dead
      return;
    }

    // a second has passed, use up some energy
    if(worldTime - this.lastEnergyLoss > 1000) {
      this.curEnergy -= this.genes["energyUse"];
      this.lastEnergyLoss = worldTime;
    }

    // ran out of energy or too old, time to die
    if(this.curEnergy <= 0 || (worldTime - this.birthTime)/1000 > this.genes["lifespan"]) {
      this.deathTime = worldTime;
      this.color = "rgba(180, 180, 180, 0.4)";
      return;
    }

    // REPRODUCTION

    this.reproduce();

    // BEHAVIOR

    this.determineBehaviorState();
    this.state.step();

    var curAngle = this.body.getAngle();
    if(curAngle < 0) { curAngle += Math.PI*2; }
    if(curAngle > Math.PI*2) { curAngle -= Math.PI*2; }

    this.targetAngle = MathHelper.angleTo(this.body.getPosition(), this.target);
    var minAngleDiff = MathHelper.angularDistance(curAngle, this.targetAngle);

    // TODO: the problem with setAngularVelocity is it doesn't ease in
    // so I could manually do some easing in, if needed
    // ... or test if applyAngularImpulse ever slows down naturally
    // ... or frickin figure out apply torque
    if(minAngleDiff < Math.PI*2/72 && minAngleDiff > -Math.PI*2/72) {
     //this.body.setAngle( this.targetAngle );
     this.body.setAngularVelocity(0);
    } else {
      var appliedTurn = this.curTurnSpeed * Math.abs(minAngleDiff)/Math.PI;
      if(minAngleDiff < 0.0) {
        //this.body.applyAngularImpulse(-appliedTurn, true);
        this.body.setAngularVelocity(-appliedTurn);
      } else {
        //this.body.applyAngularImpulse(appliedTurn, true);
        this.body.setAngularVelocity(appliedTurn);
      }
    }

    // MOTION

    var distToTarget = MathHelper.linearDistance(this.body.getPosition(), this.target);

    //              ┼                                                  ╭────────────────────────────
    //              ┤                ╭─────────────────────────────────╯
    //              ┤         ╭──────╯
    //              ┤      ╭──╯
    //              ┤    ╭─╯
    //              ┤   ╭╯
    //              ┤  ╭╯
    //              ┤ ╭╯
    //              ┤╭╯
    //              ┤│
    // acceleration ┼╯
    //              ╰───────────────────────────────────────────────────────────────────────────────
    //                distance to target
    var accelerationForce = this.curAcceleration * ( Math.atan(distToTarget/4.0) / (Math.PI/2) );
    //var accelerationForce = this.acceleration * (distToTarget/20.0);

    //console.log("accelerationForce: " + accelerationForce);

    this.curSpeed = accelerationForce * this.maxSpeed;

    var mx = this.curSpeed * Math.cos( this.body.getAngle() );
    var my = this.curSpeed * Math.sin( this.body.getAngle() );

    var linearVelocity = this.body.getLinearVelocity();

    // only apply force if not going too fast and not right on top of it
    if(linearVelocity.length() < this.maxSpeed && distToTarget > 0.1) {
      // only apply force if facing in general right direction
      if(Math.abs(minAngleDiff) < Math.PI/4) {
        this.body.applyForce( Vec2(mx, my), this.body.getPosition(), true );
      }
    }

    // BOUNDS

    if(this.body.getAngle() < -Math.PI*2) {
      this.body.setAngle( curAngle );
    }

    if(this.body.getAngle() > Math.PI * 2) {
      this.body.setAngle( curAngle );
    }
  }

  render(ctx) {
    if(debugRendering) {
      // smell sensor
      Renderer.renderCircle(ctx, this.body.getPosition(), this.smellSensorSize, "rgba(255, 0, 0, 0.05)");
    }

    // body
    Renderer.renderCircle(ctx, this.body.getPosition(), this.size/2, this.color);

    if(debugRendering) {
      // target angle
      Renderer.renderEdge(ctx,
        Vec2(this.body.getPosition().x, this.body.getPosition().y),
        Vec2(
          this.body.getPosition().x + 2.0 * Math.cos(this.targetAngle),
          this.body.getPosition().y + 2.0 * Math.sin(this.targetAngle)
        ),
        "rgb(200,0,0)"
      );
    }

    // current angle
    Renderer.renderEdge(ctx,
      Vec2(this.body.getPosition().x, this.body.getPosition().y),
      Vec2(
        this.body.getPosition().x + this.size/2 * Math.cos(this.body.getAngle()),
        this.body.getPosition().y + this.size/2 * Math.sin(this.body.getAngle())
      ),
      "rgb(200,200,200)"
    );

    if(debugRendering) {
      // target
      Renderer.renderCircle(ctx, this.target, 0.2, "rgba(0,0,200,0.5)");

      // state
      var curPosition = this.body.getPosition();
      Renderer.renderText(ctx, this.type.toUpperCase(), Vec2(curPosition.x, curPosition.y - 2.5), 1.3)
      Renderer.renderText(ctx, this.state.type, Vec2(curPosition.x, curPosition.y - 1.2), 1.5)
    }

    // energy
    if(this.deathTime == -1) {
      var blue = Math.min(250, Math.floor(250*(this.curEnergy/this.genes["maxEnergy"])));
      var red = Math.max(0, Math.floor(250 - blue));
      Renderer.renderCircle(ctx, this.body.getPosition(), this.size/6, "rgb("+red+",100,"+blue+")");

      ctx.beginPath();
      ctx.fillStyle = "rgb(255,255,255)";
      ctx.lineWidth = 1;
      ctx.arc(
        Renderer.worldAdjustX(this.body.getPosition().x),
        Renderer.worldAdjustY(this.body.getPosition().y),
        this.size/6 * worldSizeRatio,
        0, 2 * Math.PI, false
      );
      ctx.stroke();
    }
  }

  handleCollision(ownFixture, otherFixture) {
    // if(worldTime - this.lastTargetAngleChange > 1000) {
    //   this.targetAngle += Math.PI/2 + Math.random() * Math.PI;
    //   if(this.targetAngle < 0) { this.targetAngle += Math.PI*2; }
    //   if(this.targetAngle > Math.PI*2) { this.targetAngle -= Math.PI*2; }

    //   this.lastTargetAngleChange = worldTime;
    // }

    var otherWorldObject = otherFixture.getUserData().parentObject;

    if(ownFixture.getUserData().type == 'sensor'
        && otherFixture.getUserData().type == "body") {
      // this is something we can currently smell
      this.smells.add(otherWorldObject);
    }
  }

  handleCollisionEnd(ownFixture, otherFixture) {
    var otherWorldObject = otherFixture.getUserData().parentObject;

    if(ownFixture.getUserData().type == 'sensor'
        && otherFixture.getUserData().type == "body") {
      // this is something we coule previously smell
      this.smells.delete(otherWorldObject);
    }
  }
}

class CreatureStateRelaxed {
  constructor(creature) {
    this.type = "relaxed";
    this.creature = creature;
    this.steps = 0;

    // chill
    creature.curTurnSpeed = creature.maxTurnSpeed * 0.3;
    creature.curAcceleration = creature.maxAcceleration * 0.1;
  }

  step() {
    this.steps += 1;
    if(this.steps >= 100 && Math.floor(Math.random() * 60) == 1) {
      this.steps = 0;
      var distance = Math.random() * 4.0 + 0.5;
      var newTarget = Vec2(
        this.creature.body.getPosition().x + distance * Math.cos(Math.random() * Math.PI*2),
        this.creature.body.getPosition().y + distance * Math.sin(Math.random() * Math.PI*2)
      );

      // make sure we have line of sight to the new target
      var callback = RayCastSolidCallback();
      world.rayCast(this.creature.body.getPosition(), newTarget, callback.ReportFixture);
      if(callback.m_hit == false) {
        this.creature.target = newTarget;
      } else {
        // just turn towards where you would have gone
        // TODO: doesn't work this way
        //creature.targetAngle = MathHelper.angleTo(creature.body.getPosition(), newTarget);
      }
    }
  }
}

class CreatureStatePanic {
  constructor(creature) {
    this.type = "panic";
    this.creature = creature;
    this.steps = 0;

    // freak out!!!
    creature.curTurnSpeed = creature.maxTurnSpeed;
    creature.curAcceleration = creature.maxAcceleration;
  }

  step() {
    this.steps += 1;
    if(this.steps >= 20 && Math.floor(Math.random() * 20) == 1) {
      this.steps = 0;

      for(var i=0; i<5; i++) {
        var distance = Math.random() * 5.0 + 8.0;
        var newTarget = Vec2(
          this.creature.body.getPosition().x + distance * Math.cos(Math.random() * Math.PI*2),
          this.creature.body.getPosition().y + distance * Math.sin(Math.random() * Math.PI*2)
        );

        // make sure we have line of sight to the new target
        var callback = RayCastSolidCallback();
        world.rayCast(this.creature.body.getPosition(), newTarget, callback.ReportFixture);
        if(callback.m_hit == false) {
          this.creature.target = newTarget;
          break;
        }
      }
    }
  }
}

class CreatureStateRunFromThreat {
  constructor(creature, threatWorldObject) {
    this.type = "run-from-threat";
    this.creature = creature;
    this.threatWorldObject = threatWorldObject;
    this.steps = -1;

    // run!!!
    creature.curTurnSpeed = creature.maxTurnSpeed;
    creature.curAcceleration = creature.maxAcceleration;
  }

  step() {
    if( (this.steps >= 20 && Math.floor(Math.random() * 20) == 1) || this.steps == -1 ) {
      this.steps = 0;

      for(var i=0; i<5; i++) {
        var distance = Math.random() * 5.0 + 8.0;

        var threatAngle = MathHelper.angleTo(this.creature.body.getPosition(), this.threatWorldObject.body.getPosition());
        // vary by 1/4 of a circle facing away from threat
        // try wider and wider angles as time increases, so we don't just get stuck against a wall
        var range = Math.PI / 2 + (Math.PI * (i/10) );
        var newTargetAngle = (threatAngle + Math.PI) - range/2 + (Math.random() * range);

        var newTarget = Vec2(
          this.creature.body.getPosition().x + distance * Math.cos(newTargetAngle),
          this.creature.body.getPosition().y + distance * Math.sin(newTargetAngle)
        );

        // make sure we have line of sight to the new target
        var callback = RayCastSolidCallback();
        world.rayCast(this.creature.body.getPosition(), newTarget, callback.ReportFixture);
        if(callback.m_hit == false) {
          this.creature.target = newTarget;
          break;
        }
      }
    }

    this.steps += 1;
  }
}

class CreatureStateHungry {
  constructor(creature) {
    this.type = "hungry";
    this.creature = creature;
    this.steps = 0;

    // go 20% speed
    creature.curTurnSpeed = creature.maxTurnSpeed * 0.4;
    creature.curAcceleration = creature.maxAcceleration * 0.15;
  }

  step() {
    this.steps += 1;
    if(this.steps >= 50 && Math.floor(Math.random() * 20) == 1) {
      this.steps = 0;

      for(var i=0; i<5; i++) {
        var range = Math.PI / 2 + (Math.PI * (i/10) );
        var angle = this.creature.body.getAngle() - range/2 + Math.random()*range;
        var distance = Math.random() * 4.0 + 4.0;
        var newTarget = Vec2(
          this.creature.body.getPosition().x + distance * Math.cos(angle),
          this.creature.body.getPosition().y + distance * Math.sin(angle)
        );

        // make sure we have line of sight to the new target
        var callback = RayCastSolidCallback();
        world.rayCast(this.creature.body.getPosition(), newTarget, callback.ReportFixture);
        if(callback.m_hit == false) {
          this.creature.target = newTarget;
        } else {
          // just turn towards where you would have gone
          // TODO: doesn't work this way
          //creature.targetAngle = MathHelper.angleTo(creature.body.getPosition(), newTarget);
        }
      }
    }
  }
}

class CreatureStateHeadForFood {
  constructor(creature) {
    this.type = "head-for-food";
    this.creature = creature;

    this.findClosestFood();

    // go 30% speed
    creature.curTurnSpeed = creature.maxTurnSpeed * 0.5;
    creature.curAcceleration = creature.maxAcceleration * 0.2;
  }

  findClosestFood() {
    var minDistance = 1000000;
    var closestFood;
    for(const smellWorldObject of this.creature.smells) {
      if(smellWorldObject.type == "plant" && smellWorldObject.deathTime == -1) {
        var distance = MathHelper.linearDistance(this.creature.body.getPosition(), smellWorldObject.body.getPosition());
        if(distance < minDistance) {
          minDistance = distance;
          closestFood = smellWorldObject;
        }
      }
    }

    this.food = closestFood;
    this.startTime = worldTime;
  }

  step() {
    // make sure we're still trying to get to the closest piece of food
    if(worldTime - this.startTime > 2 * 1000) {
      this.findClosestFood();
    }

    if(this.food == undefined || worldObjects.indexOf(this.food) == -1 || this.food.deathTime != -1) {
      this.creature.state = new CreatureStateHungry(this.creature);
    } else if(this.creature.target != this.food.body.getPosition()) {
      this.creature.target = this.food.body.getPosition();
    } else if( WouldIntersectWorldObject(this.creature.shape, this.creature.body.getPosition(), Vec2(this.creature.sizeX,this.creature.sizeY), this.food) ) {
      worldObjects.splice( worldObjects.indexOf(this.food), 1 );
      world.destroyBody(this.food.body);
      this.creature.curEnergy += 2.0;
    }
  }
}
