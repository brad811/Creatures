var pl = planck, Vec2 = pl.Vec2, Math = pl.Math;

var canvas = document.getElementById('canvas');
canvas.width = 640;
canvas.height = 480;
var ctx = canvas.getContext('2d');

// camera zoom
var worldSizeRatio = 8;

var
  xAdjustment = canvas.width / 2,
  yAdjustment = canvas.height / 2;

var worldObjects = [];

var world = planck.World();

// STAGE


function RayCastAnyCallback() {
  var def = {};

  def.m_hit = false;
  def.m_point = null;
  def.m_normal = null;

  def.ReportFixture = function(fixture, point, normal, fraction) {
    var body = fixture.getBody();
    var userData = body.getUserData();
    if (userData) {
      if (userData == 0) {
        // By returning -1, we instruct the calling code to ignore this fixture
        // and continue the ray-cast to the next fixture.
        return -1.0;
      }
    }

    def.m_hit = true;
    def.m_point = point;
    def.m_normal = normal;

    // At this point we have a hit, so we know the ray is obstructed.
    // By returning 0, we instruct the calling code to terminate the ray-cast.
    return 0.0;
  }.bind(this);

  return def;
}



worldObjects.push( new Wall(world, Vec2(-40.0, -20.0), Vec2(40.0, -20.0)) );
worldObjects.push( new Wall(world, Vec2(-40.0, -20.0), Vec2(-40.0, 20.0)) );
worldObjects.push( new Wall(world, Vec2(40.0, -20.0), Vec2(40.0, 20.0)) );
worldObjects.push( new Wall(world, Vec2(-40.0, 20.0), Vec2(40.0, 20.0)) );

worldObjects.push( new Box(world, Vec2(20.0, 0.0), Vec2(10.0, 10.0)) );
worldObjects.push( new Box(world, Vec2(-20.0, 0.0), Vec2(10.0, 10.0)) );

for(var i=0; i<10; i++) {
  worldObjects.push( new Creature(world) );
}

world.on('begin-contact', function(contact, oldManifold) {
  var manifold = contact.getManifold();

  if (manifold.pointCount == 0) {
    // this made the sensor not work
    //return;
  }

  var fixtureA = contact.getFixtureA();
  var fixtureB = contact.getFixtureB();

  var bodyA = fixtureA.getBody();
  var bodyB = fixtureB.getBody();

  var objectA, objectB;

  for(i in worldObjects) {
    if(bodyA == worldObjects[i].body) {
      objectA = worldObjects[i];
    }

    if(bodyB == worldObjects[i].body) {
      objectB = worldObjects[i];
    }

    // both object have been found
    if(objectA && objectB) break;
  }

  objectA.handleCollision(fixtureA, objectB);
  objectB.handleCollision(fixtureB, objectA);

  // var worldManifold = contact.getWorldManifold();
});

var gameLoop = function(callback) {
  // in each frame call world.step(timeStep) with fixed timeStep
  world.step(1 / 60);

  // physics
  for(i in worldObjects) {
    worldObjects[i].step();
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // center dot
  /*ctx.beginPath();
  ctx.fillStyle = "rgb(200,0,0)";
  ctx.arc(
    0 * worldSizeRatio + xAdjustment,
    0 * worldSizeRatio + yAdjustment,
    0.25 * worldSizeRatio,
    0, 2 * Math.PI, false
  );
  ctx.fill();*/

  // render
  for(i in worldObjects) {
    worldObjects[i].render(ctx);
  }

  // // iterate over bodies and fixtures
  // for (var body = world.getBodyList(); body; body = body.getNext()) {
  //   var bodyPosition = body.getPosition();
  //   for (var fixture = body.getFixtureList(); fixture; fixture = fixture.getNext()) {
  //     // draw or update fixture
  //     var shape = fixture.getShape();
  //     var shapeType = shape.getType();
  //     if(shapeType == 'circle') {
  //       //console.log("Drawing circle: ("+bodyPosition.x+","+bodyPosition.y+","+fixture.getShape().radius+")");
  //       Renderer.renderCircle(ctx, bodyPosition, 1.0);
  //     } else if(shapeType == 'edge') {
  //       Renderer.renderEdge(ctx, shape.m_vertex1, shape.m_vertex2);
  //     } else {
  //       console.log("shape type: " + fixture.getShape().getType());
  //     }
  //   }
  // }

  window.setTimeout(function() { gameLoop(gameLoop); }, 1000 / 60);
};

window.requestAnimationFrame(function() { gameLoop(gameLoop); });

world.on('remove-fixture', function(fixture) {
  // remove fixture from ui
});
