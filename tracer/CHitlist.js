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
  this.pierce = [ new CHit() ];

  this.iNearest = 0; // index of CHit object nearest the ray's origin point.
}

CHitList.prototype.extend = function() {
  this.pierce.push(new CHit());
  return this.pierce[this.pierce.length-1];
}

CHitList.prototype.findDistance = function(hit) {
  if (hit.hitPt == null) return Infinity;
  let a = this.ray.orig, b = hit.hitPt;
  return Math.sqrt( Math.pow(a[0]-b[0],2) + Math.pow(a[1]-b[1], 2) + Math.pow(a[2]-b[2],2) );
}

CHitList.prototype.findNearest = function() {
  for (let i=0; i < this.pierce.length; i++) {
    if (this.findDistance(this.pierce[i]) < this.findDistance(this.pierce[this.iNearest])) {
      this.iNearest = i;
    }
  }
  return this.pierce[this.iNearest];
}
