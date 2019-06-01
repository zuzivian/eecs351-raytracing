//===  CHitList.js  ===================================================


function CHitList(ray) {
  // Holds ALL ray/object intersection results from tracing a single ray(CRay)
  // sent through ALL shape-defining objects (CGeom) in in the item[] array in
  // our scene (CScene).  A CHitList object ALWAYS holds at least one valid CHit
  // 'hit-point', as we initialize the pierce[0] object to the CScene's
  //  background color.  Otherwise, each CHit element in the 'pierce[]' array
  // describes one point on the ray where it enters or leaves a CGeom object.
  // (each point is in front of the ray, not behind it; t>0).

  this.ray = ray;
  this.pierce = [ new CHit( null, vec4.fromValues( 0.2,0.2,0.2,1.0) ) ];

  this.iNearest = 0; // index of CHit object nearest the ray's origin point.
}

CHitList.prototype.push = function(hit) {
  this.pierce.push(hit);
}

CHitList.prototype.findDistance = function(hit) {
  if (hit.pos == null) return Infinity;
  let a = this.ray.orig, b = hit.pos;
  return Math.sqrt( (a[0]-b[0])**2 + (a[1]-b[1])**2 + (a[2]-b[2])**2 );
}

CHitList.prototype.findNearest = function() {
  for (let i=0; i < this.pierce.length; i++) {
    if (this.pierce[i].pos == null) continue; // not a valid point
    if (this.findDistance(this.pierce[i]) < this.findDistance(this.pierce[this.iNearest])) {
      this.iNearest = i;
    }
  }
}

CHitList.prototype.getNearestColor = function() {
  this.findNearest();
  return this.pierce[this.iNearest].color;
}
