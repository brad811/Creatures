class MathHelper {
  static linearDistance(v1, v2) {
    var distA = v2.x - v1.x;
    var distB = v2.y - v1.y;
    return Math.sqrt( distA*distA + distB*distB );
  }

  static angleTo(v1, v2) {
    return Math.atan2(v2.y - v1.y, v2.x - v1.x);
  }

  static angularDistance(a1, a2) {
    var a = a2 - a1;
    var b = a2 - a1 + Math.PI*2;
    var c = a2 - a1 - Math.PI*2;
    var minAbs = Math.min( Math.abs(a), Math.abs(b), Math.abs(c) );
    var minAngleDiff = 0;
    if(minAbs == Math.abs(a)) { minAngleDiff = a; }
    if(minAbs == Math.abs(b)) { minAngleDiff = b; }
    if(minAbs == Math.abs(c)) { minAngleDiff = c; }

    return minAngleDiff;
  }
}