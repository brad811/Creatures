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
      var newValue = Math.max(curValue - mutationRate/100/2 + Math.random()*mutationRate/100, 0.1);
      //console.log(key + "("+curValue+") = max("+curValue+" - "+(mutationRate/2)+" + rand*"+(mutationRate)+", 0.1) = " + newValue);

      mutatedGenes[key] = newValue;
    }

    return mutatedGenes;
  }
}