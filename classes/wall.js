function Wall(world, v1, v2) {
  this.type = "wall";
  this.body = world.createBody();

  this.body.createFixture(pl.Edge(v1, v2));

  this.step = function() {};

  this.render = function(ctx) {
    Renderer.renderEdge(ctx, v1, v2);
  };

  this.handleCollision = function(ownFixture, otherWorldObject) {};
}