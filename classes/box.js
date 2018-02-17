function Box(world, position, size) {
  this.type = "box";
  this.body = world.createBody();

  this.body.createFixture(pl.Box(size.x/2, size.y/2));
  this.body.setPosition(position);

  this.step = function() {};

  this.render = function(ctx) {
    Renderer.renderBox(ctx, this.body.getPosition(), size);
  };

  this.handleCollision = function(ownFixture, otherWorldObject) {};
}