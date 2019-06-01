//===  CScene.js  ===================================================

function CScene(imgBuf) {
//=============================================================================
// A complete ray tracer object prototype (formerly a C/C++ 'class').
//      My code uses just one CScene instance (g_myScene) to describe the entire
//			ray tracer.  Note that I could add more CScene objects to make multiple
//			ray tracers (perhaps on different threads or processors) and then
//			combine their results into a giant video sequence, a giant image, or
//			use one ray-traced result as input to make the next ray-traced result.
//
//The CScene class includes:
// One CImgBuf object that holds a floating-point RGB image, and uses that
//		  image to create a corresponding 8,8,8 bit RGB image suitable for WebGL
//			display as a texture-map in an HTML-5 canvas object within a webpage.
// One CCamera object that describes an antialiased ray-tracing camera;
//      in my code, it is the 'rayCam' variable within the CScene prototype.
//      The CCamera class defines the SOURCE of rays we trace from our eyepoint
//      into the scene, and uses those rays to set output image pixel values.
// One CRay object 'eyeRay' that describes the ray we're currently tracing from
//      eyepoint into the scene.
// One CHitList object 'eyeHits' that describes each 3D point where 'eyeRay'
//      pierces a shape (a CGeom object) in our CScene.  Each CHitList object
//      in our ray-tracer holds a COLLECTION of hit-points (CHit objects) for a
//      ray, and keeps track of which hit-point is closest to the camera. That
//			collection is held in the eyeHits member of the CScene class.
// a COLLECTION of CGeom objects: each describe an individual visible thing; a
//      single item or thing we may see in the scene.  That collection is the
//			held in the 'item[]' array within the CScene class.
//      		Each CGeom element in the 'item[]' array holds one shape on-screen.
//      To see three spheres and a ground-plane we'll have 4 CGeom objects, one
//			for each of the spheres, and one for the ground-plane.
//      Each CGeom obj. includes a 'matlIndex' index number that selects which
//      material to use in rendering the CGeom shape. I assume ALL lights in a
//      scene may affect ALL CGeom shapes, but you may wish to add an light-src
//      index to permit each CGeom object to choose which lights(s) affect it.
// a COLLECTION of CMatl objects; each describes one light-modifying material'
//      hold this collection in  'matter[]' array within the CScene class).
//      Each CMatl element in the 'matter[]' array describes one particular
//      individual material we will use for one or more CGeom shapes. We may
//      have one CMatl object that describes clear glass, another for a
//      Phong-shaded brass-metal material, another for a texture-map, another
//      for a bump mapped material for the surface of an orange (fruit),
//      another for a marble-like material defined by Perlin noise, etc.
// a COLLECTION of CLight objects that each describe one light source.
//			That collection is held in the 'lamp[]' array within the CScene class.
//      Note that I apply all lights to all CGeom objects.  You may wish to add
//      an index to the CGeom class to select which lights affect each item.
//
// The default CScene constructor creates a simple scene that will create a
// picture if traced:
// --rayCam with +/- 45 degree Horiz field of view, aimed at the origin from
// 			world-space location (0,0,5)
// --item[0] is a unit sphere at the origin that uses matter[0] material;
// --matter[0] material is a shiny red Phong-lit material, lit by lamp[0];
// --lamp[0] is a point-light source at location (5,5,5).

  this.G_AA_MAX    = 4;				// highest super-sampling number allowed.
  this.RAY_EPSILON = 1.0E-15;       // ray-tracer precision limits; treat
                                    // any value smaller than this as zero.
                                    // (why?  JS uses 52-bit mantissa;
                                    // 2^-52 = 2.22E-16, so 10^-15 gives a
                                    // safety margin of 20:1 for small # calcs)
  this.AAcode = 1;
  this.isJitter = 0;
  this.imgBuf = imgBuf;
  this.rayCam = new CCamera();	// the 3D camera that sets eyeRay values
  this.rayEye = new CRay();
  this.geomList = [];
  this.geomList.push(new CGeom(JT_GNDPLANE));
  this.geomList.push(new CGeom(JT_DISK));
  //this.geomList[1].rayTranslate(1,1,0);
  //this.geomList[1].rayScale(1.5,1,1);
  this.geomList[1].rayRotate(0.8,0,1,0);
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
  colr = vec4.create();
  for (var a = 0; a < this.AAcode; a++) { // super sampling-x
    for (var b = 0; b < this.AAcode; b++) {  // super sampling-y
      let jitter_x = this.isJitter ? Math.random() : 0.5; // jitter x
      let jitter_y = this.isJitter ? Math.random() : 0.5; // jitter y
      let x = i - 0.5 + a/this.AAcode + jitter_x/this.AAcode; // get x value of ray
      let y = j - 0.5 + b/this.AAcode + jitter_y/this.AAcode; // get y value of ray

      this.rayCam.setEyeRay(this.rayEye, x, y); // create ray for sub-pixel at (x,y)
      let hits = new CHitList(this.rayEye);
      for (let c = 0; c < this.geomList.length; c++) {
        hits.push(this.geomList[c].trace(this.rayEye));
      }
      vec4.add(colr, colr, hits.getNearestColor()); // determine subpixel color
    }
  }
  vec4.scale(colr, colr, Math.pow(this.AAcode, -2)); // average colors over each subpixel
  return colr;
}
