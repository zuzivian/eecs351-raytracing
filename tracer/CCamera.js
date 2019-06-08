//===  CCamera.js  ===================================================

function CCamera() {
	//=============================================================================
	// Object for a ray-tracing camera defined the 'world' coordinate system, with
	// a) -- 'extrinsic' parameters that set the camera's position and aiming
	//	from the camera-defining UVN coordinate system
	// (coord. system origin at the eye-point; coord axes U,V define camera image
	// horizontal and vertical; camera gazes along the -N axis):
	// Default settings: put camera eye-point at world-space origin, and
	this.eyePt = vec4.fromValues(0,0,0,1);

  // LOOK STRAIGHT DOWN:
	this.uAxis = vec4.fromValues(1,0,0,0);	// camera U axis == world x axis
  this.vAxis = vec4.fromValues(0,1,0,0);	// camera V axis == world y axis
  this.nAxis = vec4.fromValues(0,0,1,0);	// camera N axis == world z axis.

	// b) -- Camera 'intrinsic' parameters that set the camera's optics and images.
	// They define the camera's image frustum: its image plane is at N = -znear
	// (the plane that 'splits the universe', perpendicular to N axis), and no
	// 'zfar' plane at all (not needed: ray-tracer doesn't have or need the CVV).
	// The ray-tracing camera creates an rectangular image plane perpendicular to
	// the cam-coord. system N axis at -iNear(defined by N vector in world coords),
	// 			horizontally	spanning 'iLeft' <= u <= 'iRight' along the U vector, and
	//			vertically    spanning  'iBot' <= v <=  'iTop' along the V vector.
	// As the default camera creates an image plane at distance iNear = 1 from the
	// camera's center-of-projection (at the u,v,n origin), these +/-1
	// defaults define a square ray-traced image with a +/-45-degree field-of-view:
	this.iNear =  1.0;
	this.iLeft = -1.0;
	this.iRight = 1.0;
	this.iBot =  -1.0;
	this.iTop =   1.0;

	// And the lower-left-most corner of the image is at (u,v,n) = (iLeft,iBot,-iNear).
	this.xmax = 256;			// horizontal,
	this.ymax = 256;			// vertical image resolution.
	// To ray-trace an image of xmax,ymax pixels, divide this rectangular image
	// plane into xmax,ymax rectangular tiles, and shoot eye-rays from the camera's
	// center-of-projection through those tiles to find scene color values.

	// Divide the image plane into rectangular tiles, one for each pixel:
	this.ufrac = (this.iRight - this.iLeft) / this.xmax;	// pixel tile's width
	this.vfrac = (this.iTop   - this.iBot ) / this.ymax;	// pixel tile's height.
}

CCamera.prototype.setSize = function(xmax, ymax) {
	this.xmax = 256;			// horizontal,
	this.ymax = 256;			// vertical image resolution.
	// To ray-trace an image of xmax,ymax pixels, divide this rectangular image
	// plane into xmax,ymax rectangular tiles, and shoot eye-rays from the camera's
	// center-of-projection through those tiles to find scene color values.

	// Divide the image plane into rectangular tiles, one for each pixel:
	this.ufrac = (this.iRight - this.iLeft) / this.xmax;	// pixel tile's width
	this.vfrac = (this.iTop   - this.iBot ) / this.ymax;	// pixel tile's height.
}

CCamera.prototype.rayFrustum = function(left, right, bot, top, near) {
	//==============================================================================
	// Set the camera's viewing frustum with the same arguments used by the OpenGL
	// 'glFrustum()' fucntion
	// (except this function has no 'far' argument; not needed for ray-tracing).
	// Assumes camera's center-of-projection (COP) is at origin and the camera gazes
	// down the -Z axis.
	// left,right == -x,+x limits of viewing frustum measured in the z=-znear plane
	// bot,top == -y,+y limits of viewing frustum measured
	// near =- distance from COP to the image-forming plane. 'near' MUST be positive
	//         (even though the image-forming plane is at z = -near).
	/// UNTESTED!!
  this.iLeft = left;
  this.iRight = right;
  this.iBot = bot;
  this.iTop = top;
  this.iNear = near;

	this.ufrac = (this.iRight - this.iLeft) / this.xmax;	// pixel tile's width
	this.vfrac = (this.iTop   - this.iBot ) / this.ymax;	// pixel tile's height.
}

CCamera.prototype.rayPerspective = function(fovy, aspect, zNear) {
	//==============================================================================
	// Set the camera's viewing frustum with the same arguments used by the OpenGL
	// 'gluPerspective()' function
	// (except this function has no 'far' argument; not needed for ray-tracing).
	//  fovy == vertical field-of-view (bottom-to-top) in degrees
	//  aspect ratio == camera image width/height
	//  zNear == distance from COP to the image-forming plane. zNear MUST be >0.

	this.iNear = zNear;
	this.iTop = zNear * Math.tan(0.5*fovy*(Math.PI/180.0)); // tan(radians)
	// right triangle:  iTop/zNear = sin(fovy/2) / cos(fovy/2) == tan(fovy/2)
	this.iBot = -this.iTop;
	this.iRight = this.iTop*aspect;
	this.iLeft = -this.iRight;

	this.ufrac = (this.iRight - this.iLeft) / this.xmax;	// pixel tile's width
	this.vfrac = (this.iTop   - this.iBot ) / this.ymax;	// pixel tile's height.
}

CCamera.prototype.raylookAt = function(eyePt, aimPt, upVec) {
	// Adjust the orientation and position of this ray-tracing camera
	// in 'world' coordinate system.
	// Results should exactly match WebGL camera posed by the same arguments.
	//
	// Each argument (eyePt, aimPt, upVec) is a glMatrix 'vec3' object.

	vec4.copy(this.eyePt, eyePt);
  vec4.subtract(this.nAxis, eyePt, aimPt);  // aim-eye == MINUS N-axis direction
  vec4.normalize(this.nAxis, this.nAxis);   // N-axis must have unit length.
  vec3.cross(this.uAxis, upVec, this.nAxis);  // U-axis == upVec cross N-axis
  vec4.normalize(this.uAxis, this.uAxis);   // make it unit-length.
  vec3.cross(this.vAxis, this.nAxis, this.uAxis); // V-axis == N-axis cross U-axis
	vec4.normalize(this.vAxis, this.vAxis);   // make it unit-length.
}

CCamera.prototype.setEyeRay = function(eyeRay, xpos, ypos) {
	//=============================================================================
	// Set values of a CRay object to specify a ray in world coordinates that
	// originates at the camera's eyepoint (its center-of-projection: COP) and aims
	// in the direction towards the image-plane location (xpos,ypos) given in units
	// of pixels.

	// Convert image-plane location (xpos,ypos) in the camera's U,V,N coords:
	var posU = this.iLeft + xpos*this.ufrac; 	// U coord,
	var posV = this.iBot  + ypos*this.vfrac;	// V coord,
	//  and the N coord is always -1, at the image-plane (zNear) position.
	// Then convert this point location to world-space X,Y,Z coords using our
	// camera's unit-length coordinate axes uAxis,vAxis,nAxis
 	var xyzPos = vec4.create();    // make vector 0,0,0,0.
	vec4.scaleAndAdd(xyzPos, xyzPos, this.uAxis, posU); // xyzPos += Uaxis*posU;
	vec4.scaleAndAdd(xyzPos, xyzPos, this.vAxis, posV); // xyzPos += Vaxis*posV;
  vec4.scaleAndAdd(xyzPos, xyzPos, this.nAxis, -this.iNear);   //	xyzPos += Naxis * (-1)
	vec4.normalize(xyzPos, xyzPos);
  // The eyeRay we want consists of just 2 world-space values:
  //  	-- the ray origin == camera origin == eyePt in XYZ coords
  //		-- the ray direction TO image-plane point FROM ray origin;
  //				myeRay.dir = (xyzPos + eyePt) - eyePt = xyzPos; thus
	vec4.copy(eyeRay.orig, this.eyePt);
	vec4.copy(eyeRay.dir, xyzPos);
}

CCamera.prototype.printMe = function() {
	// print CCamera object's current contents in console window:
	console.log("you called CCamera.printMe()");
  //
  //
  // YOU WRITE THIS (see CRay.prototype.printMe() function above)
  //
  //
}
