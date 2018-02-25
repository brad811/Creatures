var pl = planck, Vec2 = pl.Vec2, Math = pl.Math;

var canvas = document.getElementById('canvas');
canvas.width = 640;
canvas.height = 480;
var ctx = canvas.getContext('2d');

// camera zoom
var
  minZoom = 1,
  maxZoom = 20,
  originalZoom = 8;
var worldSizeRatio = originalZoom;
var zoomSlider = document.getElementById('zoom');
zoomSlider.min = minZoom;
zoomSlider.max = maxZoom;
zoomSlider.value = worldSizeRatio;
zoomSlider.oninput = function() {
  worldSizeRatio = zoomSlider.value;
}

var resetViewButton = document.getElementById('reset_view');
resetViewButton.onclick = function() {
  zoomSlider.value = originalZoom;
  worldSizeRatio = originalZoom;

  cameraOffsetX = 0;
  cameraOffsetY  = 0;

  xAdjustment = canvas.width / 2 + cameraOffsetX,
  yAdjustment = canvas.height / 2 + cameraOffsetY;
}

var
  cameraOffsetX = 0,
  cameraOffsetY = 0;

var
  xAdjustment = canvas.width / 2 + cameraOffsetX,
  yAdjustment = canvas.height / 2 + cameraOffsetY;


// DRAGGING

var mouseDown = false;
var prevDragX = 0, prevDragY = 0;
var canvasOffset = canvas.getBoundingClientRect();

var onMouseDown = function(e) {
  mouseDown = true;
  prevDragX = parseInt(e.clientX - canvasOffset.left);
  prevDragY = parseInt(e.clientY - canvasOffset.top);
};
canvas.addEventListener("mousedown", onMouseDown);

var onMouseUp = function(e) {
  mouseDown = false;
};
canvas.addEventListener("mouseup", onMouseUp);
canvas.addEventListener("mouseleave", onMouseUp);

var onMouseMove = function(e) {
  if(mouseDown) {
    var dragX = parseInt(e.clientX - canvasOffset.left);
    var dragY = parseInt(e.clientY - canvasOffset.top);

    cameraOffsetX += dragX - prevDragX;
    cameraOffsetY += dragY - prevDragY;

    xAdjustment = canvas.width / 2 + cameraOffsetX,
    yAdjustment = canvas.height / 2 + cameraOffsetY;

    prevDragX = dragX;
    prevDragY = dragY;
  }
};
canvas.addEventListener("mousemove", onMouseMove);

var debugRendering = false;
var debugCheckbox = document.getElementById('debug');
debugCheckbox.onchange = function() {
  debugRendering = debugCheckbox.checked;
}



var worldObjects = [];

var world = planck.World();
var worldTime = 0.0;

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

      console.log("raycast fixture: " + fixture);
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

function RayCastSolidCallback() {
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

    if(fixture.getUserData().isSolid == false) {
      return -1.0;
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

function WouldIntersectAnything(type, position, size, excludeTypes = []) {
  if(
      position.x > worldSize.x/2 ||
      position.x < -worldSize.x/2 ||
      position.y > worldSize.y/2 ||
      position.y < -worldSize.y/2
      ) {
    return true;
  }

  for(var i in worldObjects) {
    var worldObject = worldObjects[i];
    if(excludeTypes.indexOf(worldObject.type) > -1) {
      continue;
    }

    //console.log("WouldIntersectAnything: ("+type+","+position+","+size.x+","+size.y+"), worldObject: "+worldObject.type+"(" + worldObject.shape + ")");
    if(WouldIntersectWorldObject(type, position, size, worldObject)) {
      return true;
    }
  }    

  return false;
}

function WouldIntersectWorldObject(type, position, size, worldObject) {
  if(type == "circle" && worldObject.shape == "circle") {
    // They're both circles, just see if they're too close to each other
    //console.log("distance between " + position + " and " + worldObject.body.getPosition() + " is " + MathHelper.linearDistance(position, worldObject.body.getPosition()));
    if( MathHelper.linearDistance(position, worldObject.body.getPosition()) < size.x/2 + worldObject.sizeX/2 )
      return true;
  } else if(type == "rectangle" && worldObject.shape == "rectangle") {
    var xDistance = Math.abs(worldObject.body.getPosition().x - position.x);
    var yDistance = Math.abs(worldObject.body.getPosition().y - position.y);

    // TODO: great for squares, less accurate for circles
    //console.log("Testing: p("+position.x.toFixed(2)+","+position.y.toFixed(2)+")s("+size.x+","+size.y+") vs ["+worldObject.type+"]p("+worldObject.body.getPosition().x.toFixed(2)+","+worldObject.body.getPosition().y.toFixed(2)+")s("+worldObject.sizeX+","+worldObject.sizeY+")");

    if(xDistance < worldObject.sizeX/2 + size.x/2 && yDistance < worldObject.sizeY/2 + size.y/2) {
      //console.log("would intersect: " + worldObject.type + " at ("+worldObject.body.getPosition().x.toFixed(2)+","+worldObject.body.getPosition().y.toFixed(2)+")");
      return true;
    }
  } else if(type == "rectangle" || worldObject.shape == "rectangle") {

    if(type == "rectangle") {
      var
        circleX = worldObject.body.getPosition().x,
        circleY = worldObject.body.getPosition().y,
        circleRadius = worldObject.sizeX/2,
        rectX = position.x,
        rectY = position.y,
        rectSizeX = size.x,
        rectSizeY = size.y;
    } else {
      var
        circleX = position.x,
        circleY = position.y,
        circleRadius = size.x/2,
        rectX = worldObject.body.getPosition().x,
        rectY = worldObject.body.getPosition().y,
        rectSizeX = worldObject.sizeX,
        rectSizeY = worldObject.sizeY;
    }

    var circleDistance = Vec2(
      Math.abs(circleX - rectX),
      Math.abs(circleY - rectY)
    );

    if (circleDistance.x > (rectSizeX/2 + circleRadius)) { return false; }
    if (circleDistance.y > (rectSizeY/2 + circleRadius)) { return false; }

    if (circleDistance.x <= (rectSizeX/2)) { return true; } 
    if (circleDistance.y <= (rectSizeY/2)) { return true; }

    var cornerDistance_sq = Math.pow(circleDistance.x - rectSizeX/2, 2) +
                         Math.pow(circleDistance.y - rectSizeY/2, 2);

    return (cornerDistance_sq <= (circleRadius*circleRadius));
  }

  return false;
}

var worldSize = Vec2(70.0, 50.0);

var
  numPlants = 50,
  numCreatures = 10,
  numPredators = 2;

worldObjects.push( new Wall(world, Vec2(-worldSize.x/2, -worldSize.y/2), Vec2(worldSize.x/2, -worldSize.y/2)) );
worldObjects.push( new Wall(world, Vec2(-worldSize.x/2, -worldSize.y/2), Vec2(-worldSize.x/2, worldSize.y/2)) );
worldObjects.push( new Wall(world, Vec2(worldSize.x/2, -worldSize.y/2), Vec2(worldSize.x/2, worldSize.y/2)) );
worldObjects.push( new Wall(world, Vec2(-worldSize.x/2, worldSize.y/2), Vec2(worldSize.x/2, worldSize.y/2)) );

worldObjects.push( new Box(world, Vec2(20.0, 0.0), Vec2(10.0, 10.0)) );
worldObjects.push( new Box(world, Vec2(-20.0, 0.0), Vec2(10.0, 10.0)) );

// TODO: make sizes either all Vec2, or all floats, not a mix

for(var i=0; i<numPlants; i++) {
  for(var tries=0; tries<20; tries++) {
    var position = Vec2(Math.random()*80.0 - 40.0, Math.random()*40.0 - 20.0);

    if(!WouldIntersectAnything("circle", position, Vec2(1.0, 1.0))) {
      worldObjects.push( new Plant(world, position) );
      break;
    }
    // else {
    //   // draw failed attempts to place plants in red
    //   console.log("Fail!");
    //   var redPlant = new Plant(world, position);
    //   redPlant.color = "rgb(150,0,0)";
    //   worldObjects.push(redPlant);
    // }
  }
}

for(var i=0; i<numCreatures; i++) {
  worldObjects.push( new Creature(world, Vec2(Math.random()*worldSize.x - worldSize.x/2, Math.random()*worldSize.y - worldSize.y/2)) );
}

for(var i=0; i<numPredators; i++) {
  worldObjects.push( new Predator(world, Vec2(Math.random()*worldSize.x - worldSize.x/2, Math.random()*worldSize.y - worldSize.y/2)) );
}

var panicCountdown = 60 * 10;
var panicButton = document.getElementById('panic');
panicButton.onclick = function() {
  console.log("Everybody freak out!!!");
  for(i in worldObjects) {
    if(worldObjects[i].type == "creature" || worldObjects[i].type == "predator") {
      worldObjects[i].panic();
    }
  }
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

  if(objectA != undefined)
    objectA.handleCollision(fixtureA, fixtureB);
  
  if(objectB != undefined)
    objectB.handleCollision(fixtureB, fixtureA);

  // var worldManifold = contact.getWorldManifold();
});

world.on('end-contact', function(contact, oldManifold) {
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

  if(objectA != undefined)
    objectA.handleCollisionEnd(fixtureA, fixtureB);
  
  if(objectB != undefined)
    objectB.handleCollisionEnd(fixtureB, fixtureA);
});

var lastGeneCheck = 0;

// TODO: add world speed modifier so we can speed things up with a slider

var desiredFPS = 60;

var
  frameMax = -1,
  frameMin = 100000,
  frameStart = Date.now(),
  frameTimes = [],
  lastFrame = Date.now();

var gameLoop = function(callback) {
  var curFrameTime = Date.now() - lastFrame;
  frameTimes.push(curFrameTime);
  if(curFrameTime > frameMax)
    frameMax = curFrameTime;
  if(curFrameTime < frameMin)
    frameMin = curFrameTime;

  lastFrame = Date.now();

  if(Date.now() - frameStart > 60*1000) {
    // do the summary
    var avgFrame = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
    console.log("Frame average: " + avgFrame.toFixed(2) + ", min: " + frameMin + ", max: " + frameMax + ", worldObjects: " + worldObjects.length);

    frameMax = -1;
    frameMin = 100000;
    frameStart = Date.now();
    frameTimes = [];
    lastFrame = Date.now();
  }
  // in each frame call world.step(timeStep) with fixed timeStep
  world.step(1 / desiredFPS);
  worldTime += 1 / desiredFPS * 1000;

  // print out average genes every 5 minutes
  if((Date.now() - lastGeneCheck) / 1000 > 300) {
    lastGeneCheck = Date.now();
    var avg = {};

    for(i in worldObjects) {
      var type = worldObjects[i].type
      if(avg[type] == undefined) { avg[type] = {}; }

      var genes = worldObjects[i].genes;
      for(var key in genes) {
        if(avg[type][key] == undefined) { avg[type][key] = []; }
        avg[type][key].push(genes[key]);
      }
    }

    console.log("Average genes ==========");
    for(var type in avg) {
      console.log(type + " ----------");
      for(var key in avg[type]) {
        console.log(key + ": " + (avg[type][key].reduce((a, b) => a + b, 0) / avg[type][key].length).toFixed(2));
      }
    }
  }

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

  window.requestAnimationFrame(function() { gameLoop(gameLoop); });
};

window.requestAnimationFrame(function() { gameLoop(gameLoop); });

world.on('remove-fixture', function(fixture) {
  // remove fixture from ui
});
