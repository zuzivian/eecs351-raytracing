//===  CScene.js  ===================================================

function CScene(imgBuf) {
  // A complete ray tracer object prototype
  //      My code uses just one CScene instance (g_myScene) to describe the entire
  //			ray tracer.  Note that I could add more CScene objects to make multiple
  //			ray tracers (perhaps on different threads or processors) and then
  //			combine their results into a giant video sequence, a giant image, or
  //			use one ray-traced result as input to make the next ray-traced result.

  this.G_AA_MAX = 4;				// highest super-sampling number allowed.
  this.RAY_EPSILON = 1.0E-15;       // ray-tracer precision limits
  this.AAcode = 1;
  this.isJitter = 0;
  this.imgBuf = imgBuf;
  this.rayCam = new CCamera();	// the 3D camera that sets eyeRay values
}

CScene.prototype.initScene = function(num) {
  if(num == undefined) num = 0;
  // Set up ray-tracing camera
  //this.rayCam.rayPerspective(gui.camFovy, gui.camAspect, gui.camNear);
  var iNow = 0; // index of the last CGeom object put into item[] array
  this.rayCam.rayPerspective(gui.camFovy, gui.camAspect, gui.camNear);
  this.rayCam.raylookAt(gui.camEyePt, gui.camAimPt, gui.camUpVec);

  switch(num) {
    case 0:
      this.lamps = [];
      this.lamps.push( new CLamp(vec4.fromValues(0.0,0.0,0.0,1.0)) );
      this.item = [];
      this.skyColor = vec4.fromValues(0.3,1.0,1.0,1.0);  // cyan/bright blue
      //---Ground Plane-----
      this.item.push(new CGeom(JT_GNDPLANE));   // Append gnd-plane to item[] array
      iNow = this.item.length -1;               // get its array index.
      //-----Disk 1------
      this.item.push(new CGeom(JT_DISK));         // Append 2D disk to item[] &
      iNow = this.item.length -1;                 // get its array index.
  	  vec4.set(this.item[iNow].gapColor,  0.3,0.6,0.7,1.0); // RGBA(A==opacity) bluish gray
  	  vec4.set(this.item[iNow].lineColor, 0.7,0.3,0.3,1.0);  // muddy red
  	  this.item[iNow].setIdent();                   // start in world coord axes
      this.item[iNow].rayTranslate(1,1,1.3);        // move drawing axes
      this.item[iNow].rayRotate(0.25*Math.PI, 1,0,0); // rot 45deg on x axis to face us
      this.item[iNow].rayRotate(0.25*Math.PI, 0,0,1); // z-axis rotate 45deg.
      //-----Disk 2------
      this.item.push(new CGeom(JT_DISK));         // Append 2D disk to item[] &
      iNow = this.item.length -1;                 // get its array index.
      vec4.set(this.item[iNow].gapColor,  0.0,0.0,1.0,1.0); // RGBA(A==opacity) blue
  	  vec4.set(this.item[iNow].lineColor, 1.0,1.0,0.0,1.0);  // yellow
  	  this.item[iNow].setIdent();                   // start in world coord axes
  	  this.item[iNow].rayTranslate(-1,1,1.3);         // move drawing axes
  	                                                  // LEFT, BACK, & UP.
      this.item[iNow].rayRotate(0.75*Math.PI, 1,0,0); // rot 135 on x axis to face us
      this.item[iNow].rayRotate(Math.PI/3, 0,0,1);    // z-axis rotate 60deg.
      //-----Sphere 1-----
      this.item.push(new CGeom(JT_SPHERE));       // Append sphere to item[] &
      iNow = this.item.length -1;                 // get its array index.
  	  this.item[iNow].setIdent();                   // start in world coord axes
      this.item[iNow].rayTranslate(1.2,-1.0, 1.0);
      //-----Cube 1-----
      this.item.push(new CGeom(JT_BOX));       // Append sphere to item[] &
      iNow = this.item.length -1;                 // get its array index.
      this.item[iNow].setIdent();                   // start in world coord axes
      this.item[iNow].rayTranslate(2.0,2.0, 2.0);
      this.item[iNow].rayRotate(0.8*Math.PI, 1,0.5,0);
      //-----Cylinder 1-----
      this.item.push(new CGeom(JT_CYLINDER));       // Append sphere to item[] &
      iNow = this.item.length -1;                 // get its array index.
      this.item[iNow].setIdent();                   // start in world coord axes
      this.item[iNow].rayTranslate(-1.0,-1.0, 1.0);
      this.item[iNow].rayRotate(0.7*Math.PI, 0,0,1);
      break;
    case 1:
      this.item = [];
      //---Ground Plane-----
      this.item.push(new CGeom(JT_GNDPLANE));   // Append gnd-plane to item[] array
      iNow = this.item.length -1;               // get its array index.
      break;
    default:
      console.log("CScene.js: CScene.initScene(",num,") NOT YET IMPLEMENTED.");
      this.initScene(0);   // init the default scene.
      break;
  }
}

CScene.prototype.setImgBuf = function(nuImg) {
//==============================================================================
// set/change the CImgBuf object we will fill with our ray-traced image.
// This is USUALLY the global 'g_myPic', but could be any CImgBuf of any
// size.

  // Re-adjust ALL the CScene methods/members affected by output image size:
  this.rayCam.setSize(nuImg.xSiz, nuImg.ySiz);
  this.imgBuf = nuImg;    // set our ray-tracing image destination.
}

CScene.prototype.makeRayTracedImage = function(camEyePt, camAimPt, camUpVec) {
	// Create an image by Ray-tracing.   (called when you press 'T' or 't')
  var colr = vec4.create();	// floating-point RGBA color value
	var hit = 0, idx = 0;
  // set the correct Camera viewing frustrum
  this.rayCam.raylookAt(camEyePt, camAimPt, camUpVec);
  // ray trace each pixel and determine the resultant color
  for (var j=0; j< this.imgBuf.ySiz; j++) {       // for the j-th row of pixels.
    for (var i=0; i< this.imgBuf.xSiz; i++) {	    // and the i-th pixel on that row,
      var colr = this.getPixelColor(i, j); // get color at pixel (i,j)
      this.imgBuf.fBuf[idx   ] = colr[0];  // set color in floating-point buffer
      this.imgBuf.fBuf[idx +1] = colr[1];
      this.imgBuf.fBuf[idx +2] = colr[2];
      idx += this.imgBuf.pixSiz;	// incr Array index at pixel (i,j)
    }
  }
	this.imgBuf.float2int();		// create integer image from floating-point buffer.
}


CScene.prototype.getPixelColor = function(i, j) {
  // TODO: shadows rays, transparency rays, reflection rays
  colr = vec4.create();
  for (var a = 0; a < this.AAcode; a++) { // super sampling-x
    for (var b = 0; b < this.AAcode; b++) {  // super sampling-y
      let jitter_x = this.isJitter ? Math.random() : 0.5; // jitter x
      let jitter_y = this.isJitter ? Math.random() : 0.5; // jitter y
      let x = i - 0.5 + a/this.AAcode + jitter_x/this.AAcode; // get x value of ray
      let y = j - 0.5 + b/this.AAcode + jitter_y/this.AAcode; // get y value of ray
      var ray = new CRay();
      this.rayCam.setEyeRay(ray, x, y); // create ray for sub-pixel at (x,y)
      let hits = new CHitList(ray);
      if (i==0&&j==0) console.log(ray);
      for (let c = 0; c < this.item.length; c++) {
        this.item[c].trace(ray, hits.extend());
      }
      if (i==0&&j==0) console.log(hits);
      vec4.add(colr, colr, hits.getNearestColor()); // determine subpixel color
    }
  }
  vec4.scale(colr, colr, Math.pow(this.AAcode, -2)); // average colors over each subpixel
  return colr;
}
