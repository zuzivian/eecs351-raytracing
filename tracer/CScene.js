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
  this.lamps = [];
  this.lamps.push( new CLamp(vec4.fromValues(-5,5,10,1)) );
  this.lamps.push( new CLamp(gui.camEyePt) );


  switch(num) {
    case 0:
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
      this.item[iNow].matl.setMatl(MATL_GOLD_SHINY);
  	  this.item[iNow].setIdent();                   // start in world coord axes
      this.item[iNow].rayTranslate(1,1,1.3);        // move drawing axes
      this.item[iNow].rayRotate(0.25*Math.PI, 1,0,0); // rot 45deg on x axis to face us
      this.item[iNow].rayRotate(0.25*Math.PI, 0,0,1); // z-axis rotate 45deg.
      //-----Disk 2------
      this.item.push(new CGeom(JT_DISK));         // Append 2D disk to item[] &
      iNow = this.item.length -1;                 // get its array index.
      this.item[iNow].matl.setMatl(MATL_SILVER_SHINY);
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
      this.item[iNow].matl.setMatl(MATL_RED_PLASTIC);
  	  this.item[iNow].setIdent();                   // start in world coord axes
      this.item[iNow].rayTranslate(1.2,-1.0, 1.0);
      //-----Cube 1-----
      this.item.push(new CGeom(JT_BOX));       // Append sphere to item[] &
      iNow = this.item.length -1;                 // get its array index.
      this.item[iNow].matl.setMatl(MATL_GRN_PLASTIC);
      this.item[iNow].setIdent();                   // start in world coord axes
      this.item[iNow].rayTranslate(2.0,2.0, 2.0);
      this.item[iNow].rayRotate(0.8*Math.PI, 1,0.5,0);
      //-----Cylinder 1-----
      this.item.push(new CGeom(JT_CYLINDER));       // Append sphere to item[] &
      iNow = this.item.length -1;                 // get its array index.
      this.item[iNow].matl.setMatl(MATL_BLU_PLASTIC);
      this.item[iNow].setIdent();                   // start in world coord axes
      this.item[iNow].rayTranslate(-1.0,-1.0, 1.0);
      this.item[iNow].rayRotate(0.7*Math.PI, 0,0,1);
      break;
    case 1:
      this.item = [];
      //---Ground Plane-----
      this.item.push(new CGeom(JT_GNDPLANE));   // Append gnd-plane to item[] array
      iNow = this.item.length -1;               // get its array index.
      //-----Sphere 1-----
      this.item.push(new CGeom(JT_SPHERE));       // Append sphere to item[] &
      iNow = this.item.length -1;                 // get its array index.
      this.item[iNow].matl.setMatl(MATL_PEARL);
  	  this.item[iNow].setIdent();                   // start in world coord axes
      this.item[iNow].rayTranslate(-1.8,0.0, 1.0);
      //-----Sphere 2-----
      this.item.push(new CGeom(JT_SPHERE));       // Append sphere to item[] &
      iNow = this.item.length -1;                 // get its array index.
      this.item[iNow].matl.setMatl(MATL_MIRROR);
      this.item[iNow].setIdent();                   // start in world coord axes
      this.item[iNow].rayScale(1.5,1.5, 1.5);
      this.item[iNow].rayTranslate(1.4,0.0, 1.0);
      //-----Sphere 3-----
      this.item.push(new CGeom(JT_SPHERE));       // Append sphere to item[] &
      iNow = this.item.length -1;                 // get its array index.
      this.item[iNow].matl.setMatl(MATL_RED_PLASTIC);
      this.item[iNow].setIdent();                   // start in world coord axes
      this.item[iNow].rayScale(2.0,2.0, 2.0);
      this.item[iNow].rayTranslate(-0.5,2.0, 1.0);
      //-----Sphere 4-----
      this.item.push(new CGeom(JT_SPHERE));       // Append sphere to item[] &
      iNow = this.item.length -1;                 // get its array index.
      this.item[iNow].matl.setMatl(MATL_OBSIDIAN);
      this.item[iNow].setIdent();                   // start in world coord axes
      this.item[iNow].rayScale(0.5, 0.5, 0.5);
      this.item[iNow].rayTranslate(1.5,-2.0, 0.5);
      //-----Sphere 5-----
      this.item.push(new CGeom(JT_SPHERE));       // Append sphere to item[] &
      iNow = this.item.length -1;                 // get its array index.
      this.item[iNow].matl.setMatl(MATL_COPPER_SHINY);
      this.item[iNow].setIdent();                   // start in world coord axes
      this.item[iNow].rayScale(0.3, 0.3, 0.3);
      this.item[iNow].rayTranslate(-1.0,1.0, 1.0);
      break;
    case 2:
      this.item = [];
      //---Ground Plane-----
      this.item.push(new CGeom(JT_GNDPLANE));   // Append gnd-plane to item[] array
      iNow = this.item.length -1;               // get its array index.
      //-----Sphere 1-----
      this.item.push(new CGeom(JT_SPHERE));       // Append sphere to item[] &
      iNow = this.item.length -1;                 // get its array index.
      this.item[iNow].matl.setMatl(MATL_RED_PLASTIC);
  	  this.item[iNow].setIdent();                   // start in world coord axes
      this.item[iNow].rayTranslate(-1.8,0.0, 1.0);
      //-----Sphere 2-----
      this.item.push(new CGeom(JT_SPHERE));       // Append sphere to item[] &
      iNow = this.item.length -1;                 // get its array index.
      this.item[iNow].matl.setMatl(MATL_GRN_PLASTIC);
      this.item[iNow].setIdent();                   // start in world coord axes
      this.item[iNow].rayTranslate(1.0,-2.0, 2.0);
      this.item[iNow].rayRotate(0.5*Math.PI, 1.0,0.0, 1.0);
      this.item[iNow].rayScale(1.5,0.5, 0.5);
      //-----Sphere 3-----
      this.item.push(new CGeom(JT_SPHERE));       // Append sphere to item[] &
      iNow = this.item.length -1;                 // get its array index.
      this.item[iNow].matl.setMatl(MATL_BLU_PLASTIC);
      this.item[iNow].setIdent();                   // start in world coord axes
      this.item[iNow].rayScale(1.0,0.5, 1.5);
      this.item[iNow].rayTranslate(-0.5,2.0, 1.0);
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
  this.lamps[0].I_pos[0] = document.getElementById("l2posX").value;
  this.lamps[0].I_pos[1] = document.getElementById("l2posY").value;
  this.lamps[0].I_pos[2] = document.getElementById("l2posZ").value;

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
      for (let c = 0; c < this.item.length; c++) {
        this.item[c].trace(ray, hits.extend());
      }
      vec4.add(colr, colr, this.calcLighting(hits, g_RecursionDepth)); // determine subpixel color
    }
  }
  vec4.scale(colr, colr, Math.pow(this.AAcode, -2)); // average colors over each subpixel
  return colr;
}

CScene.prototype.traceRay = function(ray, hit) {
  let hits = new CHitList(ray);
  for (let c = 0; c < this.item.length; c++) {
    if (hit && this.item[c] === hit.hitGeom) continue;
    this.item[c].trace(ray, hits.extend());
  }
  return hits;
}

CScene.prototype.calcLighting = function(hitList, iter) {
  var hit = hitList.findNearest();
  // start with emissive term
  var matl = hit.hitGeom.matl;
  var color = vec4.clone(matl.K_emit);
  for (i=0; i< this.lamps.length; i++) {
    if (!this.lamps[i].isLit) continue;

    // Calculate light direction vector, normalized (surface pt --> light)
    let lightDir = vec4.create();
    vec4.subtract(lightDir, this.lamps[i].I_pos, hit.hitPt);
    vec4.normalize(lightDir, lightDir);

    // add ambient term
    let ambient = vec4.clone(this.lamps[i].I_ambi);
    vec4.multiply(ambient, ambient, matl.K_ambi);
    vec4.add(color, color, ambient);
    // get dist between hitpt and light
    let lightDist = vec4.dist(hit.hitPt, this.lamps[i].I_pos);

    // check if shadow is formed, if so skip specular and diffuse terms
    let shadowRay = new CRay();
    vec4.copy(shadowRay.orig, hit.hitPt);
    vec4.copy(shadowRay.dir, lightDir);
    let nearest = this.traceRay(shadowRay, hit).findNearest();
    if (vec4.dist(hit.hitPt, nearest.hitPt) < lightDist) continue;

    // calculate dot between light direction and surface normal
    let nDotL = Math.max(vec4.dot(lightDir, hit.surfNorm), 0.0);
    // Calculate specular Blinn-Phong term
    let h = vec4.create();
    vec4.add(h, lightDir, hit.viewN);
    vec4.normalize(h, h);
    let nDotH = Math.max(vec4.dot(h, hit.surfNorm), 0.0);
    let e64 = Math.pow(nDotH, matl.K_shiny);

    // add diffuse term
    let diffuse = vec4.clone(this.lamps[i].I_diff);
    vec4.multiply(diffuse, diffuse, matl.K_diff);
    vec4.scale(diffuse, diffuse, nDotL);
    vec4.add(color, color, diffuse);

    // add specular term
    let specular = vec4.clone(this.lamps[i].I_spec);
    vec4.multiply(specular, specular, matl.K_spec);
    vec4.scale(specular, specular, e64);
    vec4.add(color, color, specular);
  }
  //add reflective term
  if (iter > 0) {
    let reflectRay = new CRay();
    vec4.copy(reflectRay.orig, hit.hitPt);
    vec4.copy(reflectRay.dir, hit.reflRay);
    let reflectHits = this.traceRay(reflectRay, hit);
    let reflective = this.calcLighting(reflectHits, iter-1);
    vec4.scaleAndAdd(color, color, reflective, matl.K_shiny/200);
  }
  color[3] = 1.0; // reset A term;
  return color;
}
