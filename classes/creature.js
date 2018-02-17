function Creature(world) {
  this.type = "creature";
  this.maxSpeed = 20.0;
  this.turnSpeed = 8.0;
  this.maxAcceleration = 20.0;

  this.speed = 0.0;

  this.state = new CreatureStateRelaxed();

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
    shape: pl.Circle(1.0),
    friction: 0.5,
    restitution: 0.8,
    density: 1.0
  });

  this.sensorSize = 10.0;
  this.sensor = this.body.createFixture({
    shape: pl.Circle(this.sensorSize),
    isSensor: true
  });

  var steps = 0;
  this.step = function() {

    // BEHAVIOR

    steps += 1;
    if(steps >= 100 && Math.floor(Math.random() * 60) == 1) {
      steps = 0;
      var distance = Math.random() * 4.0 + 0.5;
      var newTarget = Vec2(
        this.body.getPosition().x + distance * Math.cos(Math.random() * Math.PI*2),
        this.body.getPosition().y + distance * Math.cos(Math.random() * Math.PI*2)
      );

      // make sure we have line of sight to the new target
      var callback = RayCastAnyCallback();
      world.rayCast(this.body.getPosition(), newTarget, callback.ReportFixture);
      if(callback.m_hit == false) {
        this.target = newTarget;
      } else {
        // just turn towards where you would have gone
        // TODO: doesn't work this way
        //this.targetAngle = MathHelper.angleTo(this.body.getPosition(), newTarget);
      }
    }

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
      var appliedTurn = this.turnSpeed * Math.abs(minAngleDiff)/Math.PI;
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

    // acceleration ┼                                                  ╭────────────────────────────
    //              ┤                ╭─────────────────────────────────╯
    //              ┤         ╭──────╯
    //              ┤      ╭──╯
    //              ┤    ╭─╯
    //              ┤   ╭╯
    //              ┤  ╭╯
    //              ┤ ╭╯
    //              ┤╭╯
    //              ┤│
    //         rest ┼╯
    var accelerationForce = (this.maxAcceleration / 4.0) * ( Math.atan(distToTarget/4.0) / (Math.PI/2) );
    //var accelerationForce = this.acceleration * (distToTarget/20.0);

    //console.log("accelerationForce: " + accelerationForce);

    this.speed = accelerationForce * this.maxSpeed;

    var mx = this.speed * Math.cos( this.body.getAngle() );
    var my = this.speed * Math.sin( this.body.getAngle() );

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
  };

  this.render = function(ctx) {
    // body
    Renderer.renderCircle(ctx, this.body.getPosition(), 1.0);

    // target angle
    // Renderer.renderEdge(ctx,
    //   Vec2(this.body.getPosition().x, this.body.getPosition().y),
    //   Vec2(
    //     this.body.getPosition().x + 2.0 * Math.cos(this.targetAngle),
    //     this.body.getPosition().y + 2.0 * Math.sin(this.targetAngle)
    //   ),
    //   "rgb(200,0,0)"
    // );

    // current angle
    Renderer.renderEdge(ctx,
      Vec2(this.body.getPosition().x, this.body.getPosition().y),
      Vec2(
        this.body.getPosition().x + 1.0 * Math.cos(this.body.getAngle()),
        this.body.getPosition().y + 1.0 * Math.sin(this.body.getAngle())
      ),
      "rgb(200,200,200)"
    );

    // target
    //Renderer.renderCircle(ctx, this.target, 0.2, "rgba(0,255,0,0.5)");
  };

  this.lastTargetAngleChange = Date.now();

  this.handleCollision = function(ownFixture, otherWorldObject) {
    if(Date.now() - this.lastTargetAngleChange > 1000) {
      this.targetAngle += Math.PI/2 + Math.random() * Math.PI;
      if(this.targetAngle < 0) { this.targetAngle += Math.PI*2; }
      if(this.targetAngle > Math.PI*2) { this.targetAngle -= Math.PI*2; }

      this.lastTargetAngleChange = Date.now();
    }
  };
}

function CreatureStateRelaxed() {
  var steps = 0;
  this.step = function() {
    steps += 1;
    if(steps >= 100 && Math.floor(Math.random() * 60) == 1) {
      steps = 0;
      var distance = Math.random() * 4.0 + 0.5;
      var newTarget = Vec2(
        this.body.getPosition().x + distance * Math.cos(Math.random() * Math.PI*2),
        this.body.getPosition().y + distance * Math.cos(Math.random() * Math.PI*2)
      );

      // make sure we have line of sight to the new target
      var callback = RayCastAnyCallback();
      world.rayCast(this.body.getPosition(), newTarget, callback.ReportFixture);
      if(callback.m_hit == false) {
        this.target = newTarget;
      } else {
        // just turn towards where you would have gone
        // TODO: doesn't work this way
        //this.targetAngle = MathHelper.angleTo(this.body.getPosition(), newTarget);
      }
    }
  }
}