class Renderer {
  static worldAdjustX(value) {
    return value * worldSizeRatio + xAdjustment;
  }

  static worldAdjustY(value) {
    return value * worldSizeRatio + yAdjustment;
  }

  static renderCircle(ctx, position, radius, color = "rgb(80,80,80)") {
    ctx.beginPath();
    ctx.fillStyle = color;
    ctx.arc(
      Renderer.worldAdjustX(position.x),
      Renderer.worldAdjustY(position.y),
      radius * worldSizeRatio,
      0, 2 * Math.PI, false
    );
    ctx.fill();
  }

  static renderEdge(ctx, v1, v2, color = "rgb(0,200,0)") {
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.moveTo(
      Renderer.worldAdjustX(v1.x),
      Renderer.worldAdjustY(v1.y)
    );
    ctx.lineTo(
      Renderer.worldAdjustX(v2.x),
      Renderer.worldAdjustY(v2.y)
    );
    ctx.stroke();
  }

  static renderBox(ctx, position, size, color = "rgb(150,150,150)") {
    ctx.rect(
      Renderer.worldAdjustX(position.x) - (size.x * worldSizeRatio / 2),
      Renderer.worldAdjustY(position.y) - (size.x * worldSizeRatio / 2),
      size.x * worldSizeRatio,
      size.y * worldSizeRatio
    );
    ctx.stroke();

    ctx.fillStyle = color;
    ctx.fillRect(
      Renderer.worldAdjustX(position.x) - (size.x * worldSizeRatio / 2),
      Renderer.worldAdjustY(position.y) - (size.x * worldSizeRatio / 2),
      size.x * worldSizeRatio,
      size.y * worldSizeRatio
    );
    ctx.stroke();

    //ctx.fillRect(20,20,150,100);
  }
}