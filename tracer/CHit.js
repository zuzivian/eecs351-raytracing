//===  CHit.js  ===================================================

var g_t0_MAX = 1.23E16;

function CHit() {
  // Describes one ray/object intersection point that was found by 'tracing' one
  // ray through one shape (through a single CGeom object, held in the
  // CScene.item[] array).
  // CAREFUL! We don't use isolated CHit objects, but instead gather all the CHit
  // objects for one ray in one list held inside a CHitList object.
  this.hitGeom = null;

  this.t0 = g_t0_MAX;         // 'hit time' parameter for the ray; defines one
                              // 'hit-point' along ray:   orig + t*dir = hitPt.
                              // (default: t set to hit very-distant-sky)
  this.hitPt = vec4.create(); // World-space location where the ray pierced
                              // the surface of a CGeom item.
  this.surfNorm = vec4.create();  // World-space surface-normal vector at the
                              //  point: perpendicular to surface.
  this.viewN = vec4.create(); // Unit-length vector from hitPt back towards
                              // the origin of the ray we traced.  (VERY
                              // useful for Phong lighting, etc.)
  this.isEntering=true;       // true iff ray origin was OUTSIDE the hitGeom.
                              //(example; transparency rays begin INSIDE).

  this.modelHitPt = vec4.create(); // the 'hit point' in model coordinates.
  // *WHY* have modelHitPt? to evaluate procedural textures & materials.
  //      Remember, we define each CGeom objects as simply as possible in its
  // own 'model' coordinate system (e.g. fixed, unit size, axis-aligned, and
  // centered at origin) and each one uses its own worldRay2Model matrix
  // to customize them in world space.  We use that matrix to translate,
  // rotate, scale or otherwise transform the object in world space.
  // This means we must TRANSFORM rays from the camera's 'world' coord. sys.
  // to 'model' coord sys. before we trace the ray.  We find the ray's
  // collision length 't' in model space, but we can use it on the world-
  // space rays to find world-space hit-point as well.
  //      However, some materials and shading methods work best in model
  // coordinates too; for example, if we evaluate procedural textures
  // (grid-planes, checkerboards, 3D woodgrain textures) in the 'model'
  // instead of the 'world' coord system, they'll stay 'glued' to the CGeom
  // object as we move it around in world-space (by changing worldRay2Model
  // matrix), and the object's surface patterns won't change if we 'squeeze'
  // or 'stretch' it by non-uniform scaling.
  this.colr = vec4.clone(g_myScene.skyColor);   // set default as 'sky'
                              // The final color we computed for this point,
                              // (note-- not used for shadow rays).
                              // (uses RGBA. A==opacity, default A=1=opaque.
  this.init();
}

CHit.prototype.init  = function() {
//==============================================================================
// Set this CHit object to describe a 'sky' ray that hits nothing at all;
// clears away all CHit's previously-stored description of any ray hit-point.
  this.hitGeom = -1;            // (reference to)the CGeom object we pierced in
                                //  in the CScene.item[] array (null if 'none').
  this.hitNum = -1; // TEMPORARY:
  // holds traceGrid() or traceDisk() result.

  this.t0 = g_t0_MAX;           // 'hit time' for the ray; defines one
                                // 'hit-point' along ray:   orig + t*dir = hitPt.
                                // (default: giant distance to very-distant-sky)
  vec4.set(this.hitPt, this.t0, 0,0,1); // Hit-point: the World-space location
                                //  where the ray pierce surface of CGeom item.
  vec4.set(this.surfNorm,-1,0,0,0);  // World-space surface-normal vector
                                // at the hit-point: perpendicular to surface.
  vec4.set(this.viewN,-1,0,0,0);// Unit-length vector from hitPt back towards
                                // the origin of the ray we traced.  (VERY
                                // useful for Phong lighting, etc.)
  this.isEntering=true;         // true iff ray origin was OUTSIDE the hitGeom.
                                //(example; transparency rays begin INSIDE).
  vec4.copy(this.modelHitPt,this.hitPt);// the 'hit point' in model coordinates.
}

CHit.prototype.set = function(pos, colr) {
  this.hitPt = pos;
  this.colr = colr;
}

CHit.prototype.calcLighting = function(inRay, color) {
  // calculate the view Normal
  vec4.negate(this.viewN, inRay.dir);     // reversed, normalized inRay.dir:
  vec4.normalize(this.viewN, this.viewN); // make view vector unit-length.
  vec4.normalize(this.surfNorm, this.surfNorm); // maske surface normal unit-length
  // calculate diffuse lighting of the object
  var diffuse = vec4.dot(this.viewN, this.surfNorm);
  vec4.scaleAndAdd(this.colr, vec4.create(), color, diffuse);
}
