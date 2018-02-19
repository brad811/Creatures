class Creature extends LifeForm {
  constructor(world) {
    super(world);

    this.type = "creature";
    this.maxSpeed = 20.0;
    this.maxTurnSpeed = 16.0;
    this.maxAcceleration = 80.0;

    this.curSpeed = 0.0;
    this.curTurnSpeed = 0.0;
    this.curAcceleration = 0.0;
    this.state = new CreatureStateRelaxed(this);

    this.color = "rgb(80, 80, 80)";

    this.size = 2.0;
    this.sizeX = this.size;
    this.sizeY = this.size;

    this.body = world.createBody({
      type: 'dynamic',
      position: Vec2(Math.random()*40.0 - 20.0, Math.random()*20.0 - 10.0),
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

    this.panicCountdown = 0;
    this.panic = function() {
      this.panicCountdown = 60 * 10;
    }

    this.lastTargetAngleChange = Date.now();
  }

  determineBehaviorState() {
    if(this.panicCountdown > 0) {
      if(this.state.type != "panic") {
        this.state = new CreatureStatePanic(this);
      } else {
        this.panicCountdown -= 1;
      }
    } else if(this.state.type == "panic") {
      this.state = new CreatureStateRelaxed(this);
    } else {
      // panic states overpower other behaviors

      // see if we smell a predator
      for(const smellWorldObject of this.smells) {
        if(smellWorldObject.type == "predator") {
          // make sure we're running from the predator
          if(this.state.type != "run-from-threat") {
            //change to state if we're not already in it
            this.state = new CreatureStateRunFromThreat(this, smellWorldObject);
          }

          // don't check more smells or become relaxed
          return;
        }
      }

      // nothing going on, we're chill
      if(this.state.type != "relaxed") {
        this.state = new CreatureStateRelaxed(this);
      }
    }
  }

  step() {

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
      Renderer.renderText(ctx, this.state.type, Vec2(curPosition.x, curPosition.y - 1.2), 1.5)
    }
  }

  handleCollision(ownFixture, otherFixture) {
    // if(Date.now() - this.lastTargetAngleChange > 1000) {
    //   this.targetAngle += Math.PI/2 + Math.random() * Math.PI;
    //   if(this.targetAngle < 0) { this.targetAngle += Math.PI*2; }
    //   if(this.targetAngle > Math.PI*2) { this.targetAngle -= Math.PI*2; }

    //   this.lastTargetAngleChange = Date.now();
    // }

    var otherWorldObject = otherFixture.getUserData().parentObject;

    if(ownFixture.getUserData().type == 'sensor'
        && otherFixture.getUserData().type == "body"
        && otherWorldObject.type == "predator") {
      // this is something we can currently smell
      this.smells.add(otherWorldObject);
    }
  }

  handleCollisionEnd(ownFixture, otherFixture) {
    var otherWorldObject = otherFixture.getUserData().parentObject;

    if(ownFixture.getUserData().type == 'sensor'
        && otherFixture.getUserData().type == "body"
        && otherWorldObject.type == "predator") {
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

    // chill, just go quarter speed
    creature.curTurnSpeed = creature.maxTurnSpeed / 3.0;
    creature.curAcceleration = creature.maxAcceleration / 10.0;
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

      for(var i=0; i<10; i++) {
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

      for(var i=0; i<10; i++) {
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
          //console.log("Succeeded running away");
          break;
        }

        //console.log("Failed to run away");
      }
    }

    this.steps += 1;
  }
}
