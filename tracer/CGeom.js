//===  CGeom.js  ===================================================

// Allowable values for CGeom.shapeType variable.  Add some of your own!
const JT_GNDPLANE = 0;    // An endless 'ground plane' surface.
const JT_SPHERE   = 1;    // A sphere.
const JT_BOX      = 2;    // An axis-aligned cube.
const JT_CYLINDER = 3;    // A cylinder with user-settable radius at each end
                        // and user-settable length.  radius of 0 at either
                        // end makes a cone; length of 0 with nonzero
                        // radius at each end makes a disk.
const JT_TRIANGLE = 4;    // a triangle with 3 vertices.
const JT_BLOBBIES = 5;    // Implicit surface:Blinn-style Gaussian 'blobbies'.
const JT_DISK = 5;    // 2D disk on z-plane


function CGeom(shapeSelect) {
//=============================================================================
// Generic object for a geometric shape.
// Each instance describes just one shape, but you can select from several
// different kinds of shapes by setting the 'shapeType' member.  CGeom can
// describe ANY shape, including sphere, box, cone, quadric, etc. and it holds
// all/any variables needed for each shapeType.

	if(shapeSelect == undefined) shapeSelect = JT_GNDPLANE;	// default
	this.shapeType = shapeSelect;
	switch(this.shapeType) {
	  case JT_GNDPLANE: //--------------------------------------------------------
	    //set the ray-tracing function (so we call it using item[i].traceMe() )
    	this.xgap = 1.0;	// line-to-line spacing
    	this.ygap = 1.0;
    	this.lineWidth = 0.08;	// fraction of xgap used for grid-line width
			this.lineColor = vec4.fromValues(0.5,1.0,0.5,1.0);
			this.gapColor = vec4.fromValues( 0.8,0.7,1.0,1.0);
			this.trace = function(inR,hit) { this.traceGrid(inR,hit);   };
	    break;
	  case JT_DISK: //------------------------------------------------------------
	    //set the ray-tracing function (so we call it using item[i].traceMe() )
	    this.diskRad = 2.0;   // default radius of disk centered at origin
    	this.xgap = 61/107;	// line-to-line spacing: a ratio of primes.
    	this.ygap = 61/107;
    	this.lineWidth = 0.1;	// fraction of xgap used for grid-line width
			this.lineColor = vec4.fromValues(0.5,1.0,0.5,1.0);
			this.gapColor = vec4.fromValues( 0.3,0.3,0.8,1.0);
			this.trace = function(inR,hit) { this.traceDisk(inR,hit);   };
	    break;
	  case JT_SPHERE: //----------------------------------------------------------
	    //set the ray-tracing function (so we call it using item[i].traceMe() )
    	this.color = vec4.fromValues(1.0,0.0,0.0,1.0);  // RGBA red(A==opacity)
			this.trace = function(inR,hit) { this.traceSphere(inR,hit);   };
	    break;
		case JT_BOX: //----------------------------------------------------------
			//set the ray-tracing function (so we call it using item[i].traceMe() )
			this.color = vec4.fromValues(0.0,1.0,0.0,1.0);  // RGBA blue
			this.trace = function(inR,hit) { this.traceCube(inR,hit);   };
			break;
		case JT_CYLINDER: //----------------------------------------------------------
			//set the ray-tracing function (so we call it using item[i].traceMe() )
			this.color = vec4.fromValues(0.0,0.0,1.0,1.0);  // RGBA green
			this.trace = function(inR,hit) { this.traceCylinder(inR,hit);   };
			break;
	  default:
	    console.log("CGeom() constructor: ERROR! INVALID shapeSelect:", shapeSelect);
	    return;
	    break;
	}
	// Ray transform matrices.
  this.normal2world = mat4.create();    // == worldRay2model^T
                                    // This matrix transforms MODEL-space
                                    // normals (where they're easy to find)
                                    // to WORLD-space coords (where we need
                                    // them for lighting calcs.)
	this.worldRay2model = mat4.create();
	this.model2world = mat4.create();
	// Ground-plane 'Line-grid' parameters:
}

CGeom.prototype.setIdent = function() {
//==============================================================================
// Discard worldRay2model contents, replace with identity matrix (world==model).
  mat4.identity(this.worldRay2model);
  mat4.identity(this.normal2world);
}

CGeom.prototype.rayTranslate = function(x,y,z) {
//==============================================================================
//  Translate ray-tracing's current drawing axes (defined by worldRay2model),
//  by the vec3 'offV3' vector amount
  var a = mat4.create();   // construct INVERSE translation matrix [T^-1]
  a[12] = -x; // x
  a[13] = -y; // y
  a[14] = -z; // z.
  //print_mat4(a,'translate()');
  mat4.multiply(this.worldRay2model,      // [new] =
                a, this.worldRay2model);  // =[T^-1]*[OLD]
  mat4.transpose(this.normal2world, this.worldRay2model); // model normals->world
}

CGeom.prototype.rayRotate = function(rad, ax, ay, az) {
//==============================================================================
// Rotate ray-tracing's current drawing axes (defined by worldRay2model) around
// the vec3 'axis' vector by 'rad' radians.
// (almost all of this copied directly from glMatrix mat4.rotate() function)
    var x = ax, y = ay, z = az,
        len = Math.sqrt(x * x + y * y + z * z),
        s, c, t,
        b00, b01, b02,
        b10, b11, b12,
        b20, b21, b22;
    if (Math.abs(len) < glMatrix.GLMAT_EPSILON) {
      console.log("CGeom.rayRotate() ERROR!!! zero-length axis vector!!");
      return null;
      }
    len = 1 / len;
    x *= len;
    y *= len;
    z *= len;

    s = Math.sin(-rad);     // INVERSE rotation; use -rad, not rad
    c = Math.cos(-rad);
    t = 1 - c;
    // Construct the elements of the 3x3 rotation matrix. b_rowCol
    // CAREFUL!  I changed something!!
    /// glMatrix mat4.rotate() function constructed the TRANSPOSE of the
    // matrix we want (probably because they used these b_rowCol values for a
    // built-in matrix multiply).
    // What we want is given in https://en.wikipedia.org/wiki/Rotation_matrix at
    //  the section "Rotation Matrix from Axis and Angle", and thus
    // I swapped the b10, b01 values; the b02,b20 values, the b21,b12 values.
    b00 = x * x * t + c;     b01 = x * y * t - z * s; b02 = x * z * t + y * s;
    b10 = y * x * t + z * s; b11 = y * y * t + c;     b12 = y * z * t - x * s;
    b20 = z * x * t - y * s; b21 = z * y * t + x * s; b22 = z * z * t + c;
    var b = mat4.create();  // build 4x4 rotation matrix from these
    b[ 0] = b00; b[ 4] = b01; b[ 8] = b02; b[12] = 0.0; // row0
    b[ 1] = b10; b[ 5] = b11; b[ 9] = b12; b[13] = 0.0; // row1
    b[ 2] = b20; b[ 6] = b21; b[10] = b22; b[14] = 0.0; // row2
    b[ 3] = 0.0; b[ 7] = 0.0; b[11] = 0.0; b[15] = 1.0; // row3
//    print_mat4(b,'rotate()');
    mat4.multiply(this.worldRay2model,      // [new] =
                  b, this.worldRay2model);  // [R^-1][old]
  mat4.transpose(this.normal2world, this.worldRay2model); // model normals->world

}

CGeom.prototype.rayScale = function(sx,sy,sz) {
//==============================================================================
//  Scale ray-tracing's current drawing axes (defined by worldRay2model),
//  by the vec3 'scl' vector amount
  if(Math.abs(sx) < glMatrix.GLMAT_EPSILON ||
     Math.abs(sy) < glMatrix.GLMAT_EPSILON ||
     Math.abs(sz) < glMatrix.GLMAT_EPSILON) {
     console.log("CGeom.rayScale() ERROR!! zero-length scale!!!");
     return null;
     }
  var c = mat4.create();   // construct INVERSE scale matrix [S^-1]
  c[ 0] = 1/sx; // x
  c[ 5] = 1/sy; // y
  c[10] = 1/sz; // z.
//  print_mat4(c, 'scale()')'
  mat4.multiply(this.worldRay2model,      // [new] =
                c, this.worldRay2model);  // =[S^-1]*[OLD]
  mat4.transpose(this.normal2world, this.worldRay2model); // model normals->world
}


CGeom.prototype.traceGrid = function(inRay, myHit) {
	//==============================================================================
	// Find intersection of CRay object 'inRay' with grid-plane at z== 0, and
	// if we find a ray/grid intersection CLOSER than CHit object 'hitMe', update
	// the contents of 'hitMe' with all the new hit-point information.
	// NO return value.

	//Transform 'inRay' by this.worldRay2model matrix;
  var rayT = this.getModelRay(inRay);

  // find ray/grid-plane intersection: t0 == value where ray hits plane at z=0.
  var t0 = (-rayT.orig[2])/rayT.dir[2];
  if(t0 < 0 || t0 > myHit.t0) return;

  // YES! we found a better hit-point!
	this.setHitPt(myHit, t0, inRay, rayT); 	// set up hitpoint data
  vec4.transformMat4(myHit.surfNorm, vec4.fromValues(0,0,1,0), this.normal2world);

  // FIND COLOR at model-space hit-point---------------------------------
  var loc = myHit.modelHitPt[0] / this.xgap; // how many 'xgaps' from the origin?
  if(myHit.modelHitPt[0] < 0) loc = -loc;    // keep >0 to form double-width line at yaxis.
//console.log("loc",loc, "loc%1", loc%1, "lineWidth", this.lineWidth);
  if(loc%1 < this.lineWidth) {    // fractional part of loc < linewidth?
		myHit.calcLighting(inRay, this.lineColor); 	// calculate lighting
    return;
  }
  loc = myHit.modelHitPt[1] / this.ygap;     // how many 'ygaps' from origin?
  if(myHit.modelHitPt[1] < 0) loc = -loc;    // keep >0 to form double-width line at xaxis.
  if(loc%1 < this.lineWidth) {    // fractional part of loc < linewidth?
		myHit.calcLighting(inRay, this.lineColor); 	// calculate lighting
    return;
  }
	myHit.calcLighting(inRay, this.gapColor); 	// calculate lighting
  return;
}

CGeom.prototype.traceDisk = function(inRay, myHit) {
	// Find intersection of CRay object 'inRay' with a flat, circular disk in the
	// xy plane, centered at the origin, with radius this.diskRad,
	// and store the ray/disk intersection information on CHit object 'hitMe'.
	// NO return value.

  //Transform 'inRay' by this.worldRay2model matrix;
  var rayT = this.getModelRay(inRay);

  // find ray/disk intersection: t0 == value where ray hits the plane at z=0.
  var t0 = -rayT.orig[2]/rayT.dir[2];   // (disk is in z==0 plane)
  if(t0 < 0 || t0 > myHit.t0) return;
  var modelHit = vec4.create();
  vec4.scaleAndAdd(modelHit, rayT.orig, rayT.dir, t0);
  if(modelHit[0]*modelHit[0] + modelHit[1]*modelHit[1] > this.diskRad**2) return;
	// YES! we found a better hit-point!
	this.setHitPt(myHit, t0, inRay, rayT); 	// set up hitpoint data
  vec4.transformMat4(myHit.surfNorm, vec4.fromValues(0,0,1,0), this.normal2world);
	//-------------find hit-point color:----------------
  var loc = myHit.modelHitPt[0] / this.xgap;// how many 'xgaps' from the origin?
  if(myHit.modelHitPt[0] < 0) loc = -loc;   // keep >0 to form double-width line at yaxis.
  if(loc%1 < this.lineWidth) {    // fractional part of loc < linewidth?
		myHit.calcLighting(inRay, this.lineColor); 	// calculate lighting
    return;
  }
  loc = myHit.modelHitPt[1] / this.ygap;    // how many 'ygaps' from origin?
  if(myHit.modelHitPt[1] < 0) loc = -loc;   // keep >0 to form double-width line at xaxis.
  if(loc%1 < this.lineWidth) {  // fractional part of loc < linewidth?
		myHit.calcLighting(inRay, this.lineColor); 	// calculate lighting
    return;
  }
	myHit.calcLighting(inRay, this.gapColor); 	// calculate lighting
  return;
}

CGeom.prototype.traceCube = function(inRay, myHit) {
	//Transform 'inRay' by this.worldRay2model matrix;
  var rayT = this.getModelRay(inRay);

  // find ray/cube intersection: t0 == value where ray hits the xyz +/- 1.0.
	for (let i=0; i < 2; i++) {  // check  xyz +/- 1.0
		for (let j=0; j<=2; j++) { 		// check x y z
			let t0 = (2*i-1.0-rayT.orig[j])/rayT.dir[j];
			var modelHit = vec4.create();
		  vec4.scaleAndAdd(modelHit, rayT.orig, rayT.dir, t0);
			if (t0 > myHit.t0) continue;
			if (j!=0 && (modelHit[0] > 1.0 || modelHit[0] < -1.0)) continue;
			if (j!=1 && (modelHit[1] > 1.0 || modelHit[1] < -1.0)) continue;
			if (j!=2 && (modelHit[2] > 1.0 || modelHit[2] < -1.0)) continue;
			this.setHitPt(myHit, t0, inRay, rayT); 	// set up hitpoint data
			if (j==0) 		 myHit.surfNorm = vec4.fromValues(2*i-1,0,0,0);
			else if (j==1) myHit.surfNorm = vec4.fromValues(0,2*i-1,0,0);
			else if (j==2) myHit.surfNorm = vec4.fromValues(0,0,2*i-1,0);
			myHit.calcLighting(inRay, this.color); 	// calculate lighting
		}
	}
}

CGeom.prototype.traceCylinder = function(inRay, myHit) {
	//Transform 'inRay' by this.worldRay2model matrix;
  var rayT = this.getModelRay(inRay);

  // find ray/cube intersection: t0 == value where ray hits the xyz +/- 1.0.
	var modelHit = vec4.create();
	for (let i=0; i < 2; i++) {  // check  x +/- 1.0
		let t0 = (2*i-1.0-rayT.orig[2])/rayT.dir[2];
	  vec4.scaleAndAdd(modelHit, rayT.orig, rayT.dir, t0);
		if (t0 > myHit.t0) continue;
		if (modelHit[0]**2 + modelHit[1]**2 > 1.0) continue;
		this.setHitPt(myHit, t0, inRay, rayT); 	// set up hitpoint data
		vec4.transformMat4(myHit.surfNorm, vec4.fromValues(0,0,2*i-1.0,0), this.normal2world);
		myHit.calcLighting(inRay, this.color); 	// calculate lighting
	}
	let t1, t2, t0 = g_t0_MAX;
	var a = rayT.dir[0]**2 + rayT.dir[1]**2;
	var b = 2*rayT.orig[0]*rayT.dir[0] + 2*rayT.orig[1]*rayT.dir[1];
	var c = rayT.orig[0]**2 + rayT.orig[1]**2 - 1;
	[t1, t2] = this.solveQuadratic(a, b, c);
	if (!isNaN(t1) && t1 < t0 && t1 > 0) t0 = t1;
	if (!isNaN(t2) && t2 < t0 && t2 > 0) t0 = t2;
	vec4.scaleAndAdd(modelHit, rayT.orig, rayT.dir, t0);
	if (modelHit[2] > 1.0 || modelHit[2] < -1.0) return;
	if (t0 >= myHit.t0) return;
	this.setHitPt(myHit, t0, inRay, rayT); 	// set up hitpoint data
	vec4.transformMat4(myHit.surfNorm, vec4.fromValues(modelHit[0],modelHit[1],0,0), this.normal2world);
	myHit.calcLighting(inRay, this.color); 	// calculate lighting
}

CGeom.prototype.traceSphere = function(inRay, myHit) {
	// Find intersection of CRay object 'inRay' with sphere of radius 1 centered at
	// the origin in the 'model' coordinate system.

	//Transform 'inRay' by this.worldRay2model matrix;
  var rayT = this.getModelRay(inRay);

  var r2s = vec4.create();
  vec4.subtract(r2s, vec4.fromValues(0,0,0,1), rayT.orig);
  // Find L2, the squared length of r2s, by dot-product with itself:
  var L2 = vec3.dot(r2s,r2s);
  var tcaS = vec3.dot(rayT.dir, r2s); // tcaS == SCALED tca;
  if(tcaS < 0.0) return;
  var DL2 = vec3.dot(rayT.dir, rayT.dir);
  var tca2 = tcaS*tcaS / DL2;
  var LM2 = L2 - tca2;
  if(LM2 > 1.0) return;
  var L2hc = (1.0 - LM2); // SQUARED half-chord length.
  var t0hit = tcaS/DL2 -Math.sqrt(L2hc/DL2);  // closer of the 2 hit-points.
  if(t0hit > myHit.t0) return;

  this.setHitPt(myHit, t0hit, inRay, rayT); 	// set up hitpoint data
  vec4.transformMat4(myHit.surfNorm, myHit.modelHitPt, this.normal2world); 	// COMPUTE the surface normal
	myHit.calcLighting(inRay, this.color); 	// calculate lighting

  // FOR LATER:
  // If the ray begins INSIDE the sphere (because L2 < radius^2),
    //      ====================================
    //      t0 = tcaS/DL2 - sqrt(L2hc/DL2)  // NEGATIVE; behind the ray start pt
    //      t1 = tcaS/DL2 + sqrt(L2hc/DL2)  // POSITIVE: in front of ray origin.
    //      ====================================
    //  Use the t1 hit point, as only t1 is AHEAD of the ray's origin.
}

CGeom.prototype.solveQuadratic = function(a, b, c) {
	let x1 = (-b + Math.sqrt(b**2 - 4*a*c)) / (2 * a);
	let x2 = (-b - Math.sqrt(b**2 - 4*a*c)) / (2 * a);
	return [x1, x2];
}

CGeom.prototype.setHitPt = function(myHit, t0, inRay, rayT) {
	myHit.t0 = t0;          // record ray-length, and
	myHit.hitGeom = this;      // record this CGeom object as the one we hit
	// compute model and world space hit point
	vec4.scaleAndAdd(myHit.modelHitPt, rayT.orig, rayT.dir, myHit.t0);
	vec4.scaleAndAdd(myHit.hitPt, inRay.orig, inRay.dir, myHit.t0);
}

CGeom.prototype.getModelRay = function(inRay) {
	var rayT = new CRay();    // create a local transformed-ray variable.
	vec4.transformMat4(rayT.orig, inRay.orig, this.worldRay2model);
	vec4.transformMat4(rayT.dir,  inRay.dir,  this.worldRay2model);
	return rayT;
}
