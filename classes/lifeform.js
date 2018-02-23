class LifeForm extends WorldObject {
  constructor(world, position) {
    super(world);

    this.genes = {
      mutationRate: 0.0 // percent
    };

    this.birthTime = Date.now();
    this.deathTime = -1;
    this.lastReproductionTime = Date.now();
  }

  getMutatedGenes() {
    var mutatedGenes = {};
    var mutationRate = this.genes["mutationRate"];

    for(var key in this.genes) {
      var curValue = this.genes[key];
      var range = curValue * (mutationRate/100);
      var newValue = Math.max(curValue - range/2 + Math.random()*range, 0.1);
      //console.log(this.type + " " + key + "("+curValue+") = max("+curValue+" - "+(range/2)+" + rand*"+(range)+"(mutationRate: "+mutationRate+"), 0.1) = " + newValue);

      mutatedGenes[key] = newValue;
    }

    return mutatedGenes;
  }
}