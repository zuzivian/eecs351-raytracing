/* VBOBox0.js */

//=============================================================================
//=============================================================================
function VBObox0() {

	this.VERT_SRC =	//--------------------- VERTEX SHADER source code
  'attribute vec4 a_Position;\n' +
  'attribute vec4 a_Color;\n' +
  'uniform mat4 u_mvpMat;\n' +
  'varying vec4 v_colr;\n' +
  'void main() {\n' +
  '  gl_Position = u_mvpMat * a_Position;\n' +
  '  v_colr = a_Color;\n' +
  '}\n';

	this.FRAG_SRC = //---------------------- FRAGMENT SHADER source code
  'precision mediump float;\n' +          // req'd for floats in frag shader
  'varying vec4 v_colr;\n' +
  'void main() {\n' +
  '	 	 gl_FragColor = v_colr; \n' +
  '}\n';

//--------------Draw XYZ axes as unit-length R,G,B lines:
	this.vboContents =
	new Float32Array ([         // Array of vertex attribute values we will
  												    // transfer to GPU's vertex buffer object (VBO);
    // A few 3D vertices with color and alpha; one vertex per line
    // with a_Position attribute (x,y,z,w) followed by a_Color attribute (RGBA)
    // Red X axis:
     0.00, 0.00, 0.0, 1.0,		1.0, 1.0, 1.0, 1.0,	// x,y,z,w; r,g,b,a (RED)
     1.00, 0.00, 0.0, 1.0,		1.0, 0.0, 0.0, 1.0,	// x,y,z,w; r,g,b,a (RED)
    // green Y axis:
     0.00, 0.00, 0.0, 1.0,  	1.0, 1.0, 1.0, 1.0,
     0.00, 1.00, 0.0, 1.0,  	0.0, 1.0, 0.0, 1.0,
    // blue Z axis:
     0.00, 0.00, 0.0, 1.0,  	1.0, 1.0, 1.0, 1.0,
     0.00, 0.00, 1.0, 1.0,  	0.0, 0.0, 1.0, 1.0,
     ]);
  this.floatsPerVertex = 8;
  this.bgnAxes = 0;                 // starting vertex for our 3D axes;
  this.vboVerts = 6;                // number of vertices used by our 3D axes.

//------------Add more shapes:
  this.bgnGrid = this.vboVerts;     // remember starting vertex for 'grid'
  this.appendWireGroundGrid();      // (see fcn below)
  this.bgnDisk = this.vboVerts;     // and the starting vertex for 'disk'
  this.appendDisk(2);               // (see fcn below)
// /*
 this.bgnSphere = this.vboVerts;    // remember starting vertex for 'sphere'
 this.appendWireSphere();           // create (default-resolution) sphere
 this.bgnCube = this.vboVerts;      // remember starting vertex for 'cube'
 this.appendWireCube();                 // YOU write these!
 this.bgnCyl  = this.vboVerts;      // remember starting vertex for 'cylinder'
 this.appendWireCylinder();

	this.FSIZE = this.vboContents.BYTES_PER_ELEMENT;
	                              // bytes req'd by 1 vboContents array element;
																// (why? used to compute stride and offset
																// in bytes for vertexAttribPointer() calls)
  this.vboBytes = this.vboContents.length * this.FSIZE;
                                // total number of bytes stored in vboContents
                                // (#  of floats in vboContents array) *
                                // (# of bytes/float).
	this.vboStride = this.vboBytes / this.vboVerts;
	                              // (== # of bytes to store one complete vertex).
	                              // From any attrib in a given vertex in the VBO,
	                              // move forward by 'vboStride' bytes to arrive
	                              // at the same attrib for the next vertex.

	            //----------------------Attribute sizes
  this.vboFcount_a_Position =  4;// # of floats in the VBO needed to store the
                                // attribute named a_Position (4: x,y,z,w values)
  this.vboFcount_a_Color = 4;   // # of floats for this attrib (r,g,b,a values)
  console.assert((this.vboFcount_a_Position +     // check the size of each and
                  this.vboFcount_a_Color) *   // every attribute in our VBO
                  this.FSIZE == this.vboStride, // for agreeement with'stride'
                  "Uh oh! VBObox0.vboStride disagrees with attribute-size values!");
              //----------------------Attribute offsets
	this.vboOffset_a_Position = 0;// # of bytes from START of vbo to the START
	                              // of 1st a_Position attrib value in vboContents[]
  this.vboOffset_a_Color = this.vboFcount_a_Position * this.FSIZE;
                                // (4 floats * bytes/float)
                                // # of bytes from START of vbo to the START
                                // of 1st a_Colr0 attrib value in vboContents[]
	            //-----------------------GPU memory locations:
	this.vboLoc;									// GPU Location for Vertex Buffer Object,
	                              // returned by gl.createBuffer() function call
	this.shaderLoc;								// GPU Location for compiled Shader-program
	                            	// set by compile/link of VERT_SRC and FRAG_SRC.
								          //------Attribute locations in our shaders:
	this.a_PositionLoc;						// GPU location for 'a_Position' attribute
	this.a_ColorLoc;							// GPU location for 'a_Color' attribute

	            //---------------------- Uniform locations &values in our shaders

// OLD version using cuon-matrix-quat03.js:
//	this.mvpMat = new Matrix4();	// Transforms CVV axes to model axes.

// NEW version using glMatrix.js:
  this.mvpMat = mat4.create();  // Transforms CVV axes to model axes.
	this.u_mvpMatLoc;							// GPU location for u_ModelMat uniform

/*  NO TEXTURE MAPPING HERE.
  this.u_TextureLoc;            // GPU location for texture map (image)
  this.u_SamplerLoc;            // GPU location for texture sampler
*/
}

VBObox0.prototype.appendWireGroundGrid = function() {
//==============================================================================
// Create a set of vertices for an x,y grid of colored lines in the z=0 plane
// centered at x=y=z=0, and store them in local array vertSet[].
// THEN:
// Append the contents of vertSet[] to existing contents of the this.vboContents
// array; update this.vboVerts to include these new verts for drawing.
// NOTE: use gl.drawArrays(gl.GL_LINES,,) to draw these vertices.

  //Set # of lines in grid--------------------------------------
	this.xyMax	= 50.0;			// grid size; extends to cover +/-xyMax in x and y.
	this.xCount = 101;			// # of lines of constant-x to draw to make the grid
	this.yCount = 101;		  // # of lines of constant-y to draw to make the grid
	                        // xCount, yCount MUST be >1, and should be odd.
	                        // (why odd#? so that we get lines on the x,y axis)
	//Set # vertices per line-------------------------------------
	// You may wish to break up each line into separate line-segments.
	// Here I've split each line into 4 segments; two above, two below the axis.
	// (why? as of 5/2018, Chrome browser sometimes fails to draw lines whose
	// endpoints are well outside of the view frustum (Firefox works OK, though).
  var vertsPerLine = 8;      // # vertices stored in vertSet[] for each line;

	//Set vertex contents:----------------------------------------
/*  ALREADY SET in VBObox0 constructor
//	this.floatsPerVertex = 8;  // x,y,z,w; r,g,b,a;
                             // later add nx,ny,nz; tx,ty,tz, matl, usr; values.
*/
  //Create (local) vertSet[] array-----------------------------
  var vertCount = (this.xCount + this.yCount) * vertsPerLine;
  var vertSet = new Float32Array(vertCount * this.floatsPerVertex);
      // This array will hold (xCount+yCount) lines, kept as
      // (xCount+yCount)*vertsPerLine vertices, kept as
      // (xCount+yCount)*vertsPerLine*floatsPerVertex array elements (floats).

	// Set Vertex Colors--------------------------------------
  // Each line's color is constant, but set by the line's position in the grid.
  //  For lines of constant-x, the smallest (or most-negative) x-valued line
  //    gets color xBgnColr; the greatest x-valued line gets xEndColr,
  //  Similarly, constant-y lines get yBgnColr for smallest, yEndColr largest y.
 	this.xBgnColr = vec4.fromValues(1.0, 0.0, 0.0, 1.0);	  // Red
 	this.xEndColr = vec4.fromValues(0.0, 1.0, 1.0, 1.0);    // Cyan
 	this.yBgnColr = vec4.fromValues(0.0, 1.0, 0.0, 1.0);	  // Green
 	this.yEndColr = vec4.fromValues(1.0, 0.0, 1.0, 1.0);    // Magenta

  // Compute how much the color changes between 1 line and the next:
  var xColrStep = vec4.create();  // [0,0,0,0]
  var yColrStep = vec4.create();
  vec4.subtract(xColrStep, this.xEndColr, this.xBgnColr); // End - Bgn
  vec4.subtract(yColrStep, this.yEndColr, this.yBgnColr);
  vec4.scale(xColrStep, xColrStep, 1.0/(this.xCount -1)); // scale by # of lines
  vec4.scale(yColrStep, yColrStep, 1.0/(this.yCount -1));

  // Local vars for vertex-making loops-------------------
	var xgap = 2*this.xyMax/(this.xCount-1);		// Spacing between lines in x,y;
	var ygap = 2*this.xyMax/(this.yCount-1);		// (why 2*xyMax? grid spans +/- xyMax).
  var xNow;           // x-value of the current line we're drawing
  var yNow;           // y-value of the current line we're drawing.
  var line = 0;       // line-number (we will draw xCount or yCount lines, each
                      // made of vertsPerLine vertices),
  var v = 0;          // vertex-counter, used for the entire grid;
  var idx = 0;        // vertSet[] array index.
  var colrNow = vec4.create();   // color of the current line we're drawing.

  //----------------------------------------------------------------------------
  // 1st BIG LOOP: makes all lines of constant-x
  for(line=0; line<this.xCount; line++) {   // for every line of constant x,
    colrNow = vec4.scaleAndAdd(             // find the color of this line,
              colrNow, this.xBgnColr, xColrStep, line);
    xNow = -this.xyMax + (line*xgap);       // find the x-value of this line,
    for(i=0; i<vertsPerLine; i++, v++, idx += this.floatsPerVertex)
    { // for every vertex in this line,  find x,y,z,w;  r,g,b,a;
      // and store them sequentially in vertSet[] array.
      // We already know  xNow; find yNow:
      switch(i) { // find y coord value for each vertex in this line:
        case 0: yNow = -this.xyMax;   break;  // start of 1st line-segment;
        case 1:                               // end of 1st line-segment, and
        case 2: yNow = -this.xyMax/2; break;  // start of 2nd line-segment;
        case 3:                               // end of 2nd line-segment, and
        case 4: yNow = 0.0;           break;  // start of 3rd line-segment;
        case 5:                               // end of 3rd line-segment, and
        case 6: yNow = this.xyMax/2;  break;  // start of 4th line-segment;
        case 7: yNow = this.xyMax;    break;  // end of 4th line-segment.
        default:
          console.log("VBObox0.appendWireGroundGrid() !ERROR! **X** line out-of-bounds!!\n\n");
        break;
      } // set all values for this vertex:
      vertSet[idx  ] = xNow;            // x value
      vertSet[idx+1] = yNow;            // y value
      vertSet[idx+2] = 0.0;             // z value
      vertSet[idx+3] = 1.0;             // w;
      vertSet[idx+4] = colrNow[0];  // r
      vertSet[idx+5] = colrNow[1];  // g
      vertSet[idx+6] = colrNow[2];  // b
      vertSet[idx+7] = colrNow[3];  // a;
    }
  }
  //----------------------------------------------------------------------------
  // 2nd BIG LOOP: makes all lines of constant-y
  for(line=0; line<this.yCount; line++) {   // for every line of constant y,
    colrNow = vec4.scaleAndAdd(             // find the color of this line,
              colrNow, this.yBgnColr, yColrStep, line);
    yNow = -this.xyMax + (line*ygap);       // find the y-value of this line,
    for(i=0; i<vertsPerLine; i++, v++, idx += this.floatsPerVertex)
    { // for every vertex in this line,  find x,y,z,w;  r,g,b,a;
      // and store them sequentially in vertSet[] array.
      // We already know  yNow; find xNow:
      switch(i) { // find y coord value for each vertex in this line:
        case 0: xNow = -this.xyMax;   break;  // start of 1st line-segment;
        case 1:                               // end of 1st line-segment, and
        case 2: xNow = -this.xyMax/2; break;  // start of 2nd line-segment;
        case 3:                               // end of 2nd line-segment, and
        case 4: xNow = 0.0;           break;  // start of 3rd line-segment;
        case 5:                               // end of 3rd line-segment, and
        case 6: xNow = this.xyMax/2;  break;  // start of 4th line-segment;
        case 7: xNow = this.xyMax;    break;  // end of 4th line-segment.
        default:
          console.log("VBObox0.appendWireGroundGrid() !ERROR! **Y** line out-of-bounds!!\n\n");
        break;
      } // Set all values for this vertex:
      vertSet[idx  ] = xNow;            // x value
      vertSet[idx+1] = yNow;            // y value
      vertSet[idx+2] = 0.0;             // z value
      vertSet[idx+3] = 1.0;             // w;
      vertSet[idx+4] = colrNow[0];  // r
      vertSet[idx+5] = colrNow[1];  // g
      vertSet[idx+6] = colrNow[2];  // b
      vertSet[idx+7] = colrNow[3];  // a;
    }
  }
  // Now APPEND this to existing VBO contents:
  // Make a new array (local) big enough to hold BOTH vboContents & vertSet:
var tmp = new Float32Array(this.vboContents.length + vertSet.length);
  tmp.set(this.vboContents, 0);     // copy old VBOcontents into tmp, and
  tmp.set(vertSet,this.vboContents.length); // copy new vertSet just after it.
  this.vboVerts += vertCount;       // find number of verts in both.
  this.vboContents = tmp;           // REPLACE old vboContents with tmp
}

VBObox0.prototype.appendDisk = function(rad) {
//==============================================================================
// Create a set of vertices to draw a grid of colored lines that form a disk of
// radius 'rad' in the xy plane centered at world-space origin (x=y=z=0)
// and store them in local array vertSet[].
// THEN:
// Append the contents of vertSet[] to existing contents of the this.vboContents
// array; update this.vboVerts to include these new verts for drawing.
// NOTE: use gl.drawArrays(gl.GL_LINES,...) to draw these vertices.
  if(rad == undefined) rad = 3;   // default value.
  //Set # of lines in grid--------------------------------------
	this.xyMax	= rad;    // grid size; extends to cover +/-xyMax in x and y.
	this.xCount = rad*5 +1;	// # of lines of constant-x to draw to make the grid
	this.yCount = rad*5 +1;	// # of lines of constant-y to draw to make the grid
	                        // xCount, yCount MUST be >1, and should be odd.
	                        // (why odd#? so that we get lines on the x,y axis)
  var vertsPerLine =2;    // # vertices stored in vertSet[] for each line;
  //Create (local) vertSet[] array-----------------------------
  var vertCount = (this.xCount + this.yCount) * vertsPerLine;
  var vertSet = new Float32Array(vertCount * this.floatsPerVertex);
      // This array will hold (xCount+yCount) lines, kept as
      // (xCount+yCount)*vertsPerLine vertices, kept as
      // (xCount+yCount)*vertsPerLine*floatsPerVertex array elements (floats).

	// Set Vertex Colors--------------------------------------
  // Each line's color is constant, but set by the line's position in the grid.
  //  For lines of constant-x, the smallest (or most-negative) x-valued line
  //    gets color xBgnColr; the greatest x-valued line gets xEndColr,
  //  Similarly, constant-y lines get yBgnColr for smallest, yEndColr largest y.
 	var xColr = vec4.fromValues(1.0, 1.0, 0.3, 1.0);	   // Light Yellow
 	var yColr = vec4.fromValues(0.3, 1.0, 1.0, 1.0);    // Light Cyan

  // Local vars for vertex-making loops-------------------
	var xgap = 2*this.xyMax/(this.xCount-2);		// Spacing between lines in x,y;
	var ygap = 2*this.xyMax/(this.yCount-2);		// (why 2*xyMax? grid spans +/- xyMax).
  var xNow;           // x-value of the current line we're drawing
  var yNow;           // y-value of the current line we're drawing.
  var diff;           // half-length of each line we draw.
  var line = 0;       // line-number (we will draw xCount or yCount lines, each
                      // made of vertsPerLine vertices),
  var v = 0;          // vertex-counter, used for the entire grid;
  var idx = 0;        // vertSet[] array index.
  //----------------------------------------------------------------------------
  // 1st BIG LOOP: makes all lines of constant-x
  for(line=0; line<this.xCount; line++) {   // for every line of constant x,
    xNow = -this.xyMax + (line+0.5)*xgap;       // find the x-value of this line,
    diff = Math.sqrt(rad*rad - xNow*xNow);  // find +/- y-value of this line,
    for(i=0; i<vertsPerLine; i++, v++, idx += this.floatsPerVertex)
    { // for every vertex in this line,  find x,y,z,w;  r,g,b,a;
      // and store them sequentially in vertSet[] array.
      // we already know the xNow value for this vertex; find the yNow:
      if(i==0) yNow = -diff;  // line start
      else yNow = diff;       // line end.
      // set all values for this vertex:
      vertSet[idx  ] = xNow;            // x value
      vertSet[idx+1] = yNow;            // y value
      vertSet[idx+2] = 0.0;             // z value
      vertSet[idx+3] = 1.0;             // w;
      vertSet[idx+4] = xColr[0];  // r
      vertSet[idx+5] = xColr[1];  // g
      vertSet[idx+6] = xColr[2];  // b
      vertSet[idx+7] = xColr[3];  // a;
    }
  }
  //---------------------------------------------------------------------------
  // 2nd BIG LOOP: makes all lines of constant-y
  for(line=0; line<this.yCount; line++) {   // for every line of constant y,
    yNow = -this.xyMax + (line+0.5)*ygap;       // find the y-value of this line,
    diff = Math.sqrt(rad*rad - yNow*yNow);  // find +/- y-value of this line,
    for(i=0; i<vertsPerLine; i++, v++, idx += this.floatsPerVertex)
    { // for every vertex in this line,  find x,y,z,w;  r,g,b,a;
      // and store them sequentially in vertSet[] array.
      // We already know  yNow; find the xNow:
      if(i==0) xNow = -diff;  // line start
      else xNow = diff;       // line end.
      // Set all values for this vertex:
      vertSet[idx  ] = xNow;            // x value
      vertSet[idx+1] = yNow;            // y value
      vertSet[idx+2] = 0.0;             // z value
      vertSet[idx+3] = 1.0;             // w;
      vertSet[idx+4] = yColr[0];  // r
      vertSet[idx+5] = yColr[1];  // g
      vertSet[idx+6] = yColr[2];  // b
      vertSet[idx+7] = yColr[3];  // a;
    }
  }
  // Now APPEND this to existing VBO contents:
  // Make a new array (local) big enough to hold BOTH vboContents & vertSet:
var tmp = new Float32Array(this.vboContents.length + vertSet.length);
  tmp.set(this.vboContents, 0);     // copy old VBOcontents into tmp, and
  tmp.set(vertSet,this.vboContents.length); // copy new vertSet just after it.
  this.vboVerts += vertCount;       // find number of verts in both.
  this.vboContents = tmp;           // REPLACE old vboContents with tmp
}

// make our own local fcn to convert polar to rectangular coords:
VBObox0.prototype.polar2xyz = function(out4, fracEW, fracNS) {
//------------------------------------------------------------------------------
// Set the vec4 argument 'out4' to the 3D point on the unit sphere described by
// normalized longitude and lattitude angles: 0 <= fracEW, fracNS <= 1.
// Define sphere as radius == 1 and centered at the origin,
//  with its 'north pole' point at (0,0,+1),        where fracNS = 1.0,
//       its equator at the xy plane (where z==0)   where fracNS = 0.5,
//   and it's 'south pole' point at (0,0,-1),       where fracNS = 0.0.
// The sphere's equator, located at 'normalized lattitude' fracNS = 0.5,
// defines the +x axis point as fracEW==0.0, and Longitude increases CCW or
// 'eastwards' around the equator to reach fracEW==0.25 at the +y axis and on up
// to 0.5 at -x axis, on up to 0.75 at -y axis, and on up until we return to +x.
  var sEW = Math.sin(2.0*Math.PI*fracEW);
  var cEW = Math.cos(2.0*Math.PI*fracEW);
  var sNS = Math.sin(Math.PI*fracNS);
  var cNS = Math.cos(Math.PI*fracNS);
  vec4.set(out4,  cEW * sNS,      // x = cos(EW)sin(NS);
                  sEW * sNS,      // y = sin(EW)sin(NS);
                  cNS, 1.0);      // z =        cos(NS); w=1.0  (point, not vec)
}

VBObox0.prototype.appendWireSphere = function(NScount) {
//==============================================================================
// Create a set of vertices to draw grid of colored lines that form a
// sphere of radius 1, centered at x=y=z=0, when drawn with LINE_STRIP primitive
// THEN:
// Append the contents of vertSet[] to existing contents of the this.vboContents
// array; update this.vboVerts to include these new verts for drawing.
// NOTE: use gl.drawArrays(gl.GL_LINES,...) to draw these vertices.

// set # of vertices in each ring of constant lattitude  (EWcount) and
// number of rings of constant lattitude (NScount)
  if(NScount == undefined) NScount =  13;    // default value.
  if(NScount < 3) NScount = 3;              // enforce minimums
  EWcount = 2*(NScount);
console.log("VBObox0.appendLineSphere() EWcount, NScount:", EWcount, ", ", NScount);

	//Set vertex contents:----------------------------------------
/*  ALREADY SET in VBObox0 constructor
	this.floatsPerVertex = 8;  // x,y,z,w;  r,g,b,a values.
*/

  //Create (local) vertSet[] array-----------------------------
  var vertCount = 2* EWcount * NScount;
  var vertSet = new Float32Array(vertCount * this.floatsPerVertex);
      // This array holds two sets of vertices:
      // --the NScount rings of EWcount vertices each, where each ring
      //    forms a circle of constant z (NSfrac determines the z value), and
      // --the EWcount arcs of NScount vertices each, where each arc
      //    forms a half-circle from south-pole to north-pole at constant EWfrac
//console.log("VBObox0.appendLineSphere() vertCount, floatsPerVertex:", vertCount, ", ", this.floatsPerVertex);

	// Set Vertex Colors--------------------------------------
  // The sphere consists of horizontal rings and vertical half-circle arcs.
  // Each North-to-South arc has constant fracEW and constant color, but that
  // color varies linearly from EWbgnColr found at fracEW==0 up to EWendColr
  // found at fracEW==0.5 and then back down to EWbgnColr at fracEW==1.
  // Each East-West ring has constant fracNS and constant color, but that
  // color varies linearly from NSbgnColr found at fracNS==0 (e.g. south pole)
  // up to NSendColr found at fracNS==1 (north pole).
 	this.EWbgnColr = vec4.fromValues(1.0, 0.5, 0.0, 1.0);	  // Orange
 	this.EWendColr = vec4.fromValues(0.0, 0.5, 1.0, 1.0);   // Cyan
 	this.NSbgnColr = vec4.fromValues(1.0, 1.0, 1.0, 1.0);	  // White
 	this.NSendColr = vec4.fromValues(0.0, 1.0, 0.5, 1.0);   // White

  // Compute how much the color changes between 1 arc (or ring) and the next:
  var EWcolrStep = vec4.create();  // [0,0,0,0]
  var NScolrStep = vec4.create();

  vec4.subtract(EWcolrStep, this.EWendColr, this.EWbgnColr); // End - Bgn
  vec4.subtract(NScolrStep, this.NSendColr, this.NSbgnColr);
  vec4.scale(EWcolrStep, EWcolrStep, 2.0/(EWcount -1)); // double-step for arc colors
  vec4.scale(NScolrStep, NScolrStep, 1.0/(NScount -1)); // single-step for ring colors

  // Local vars for vertex-making loops-------------------
	var EWgap = 1.0/(EWcount-1);		  // vertex spacing in each ring of constant NS
	                                    // (be sure last vertex doesn't overlap 1st)
	var NSgap = 1.0/(NScount-1);		// vertex spacing in each North-South arc
	                                    // (1st vertex at south pole; last at north pole)
  var EWint=0;        // east/west integer (0 to EWcount) for current vertex,
  var NSint=0;        // north/south integer (0 to NScount) for current vertex.
  var v = 0;          // vertex-counter, used for the entire sphere;
  var idx = 0;        // vertSet[] array index.
  var pos = vec4.create();    // vertex position.
  var colrNow = vec4.create();   // color of the current arc or ring.

  //----------------------------------------------------------------------------
  // 1st BIG LOOP: makes all horizontal rings of constant NSfrac.
  for(NSint=0; NSint<NScount; NSint++) { // for every ring of constant NSfrac,
    colrNow = vec4.scaleAndAdd(               // find the color of this ring;
              colrNow, this.NSbgnColr, NScolrStep, NSint);
    for(EWint=0; EWint<EWcount; EWint++, v++, idx += this.floatsPerVertex) {
      // for every vertex in this ring, find x,y,z,w;  r,g,b,a;
      // and store them sequentially in vertSet[] array.
      // Find vertex position from normalized lattitude & longitude:
      this.polar2xyz(pos, // vec4 that holds vertex position in world-space x,y,z;
          EWint * EWgap,  // normalized East/west longitude (from 0 to 1)
          NSint * NSgap); // normalized North/South lattitude (from 0 to 1)
      // now set the vertex values in the array:
      vertSet[idx  ] = pos[0];            // x value
      vertSet[idx+1] = pos[1];            // y value
      vertSet[idx+2] = pos[2];            // z value
      vertSet[idx+3] = 1.0;               // w (it's a point, not a vector)
      vertSet[idx+4] = colrNow[0];  // r
      vertSet[idx+5] = colrNow[1];  // g
      vertSet[idx+6] = colrNow[2];  // b
      vertSet[idx+7] = colrNow[3];  // a;
    }
  }

  //----------------------------------------------------------------------------
  // 2nd BIG LOOP: makes all vertical arcs of constant EWfrac.
  for(EWint=0; EWint<EWcount; EWint++) { // for every arc of constant EWfrac,
    // find color of the arc:
    if(EWint < EWcount/2) {   // color INCREASES for first hemisphere of arcs:
      colrNow = vec4.scaleAndAdd(
              colrNow, this.EWbgnColr, EWcolrStep, EWint);
    }
    else {  // color DECREASES for second hemisphere of arcs:
      colrNow = vec4.scaleAndAdd(
              colrNow, this.EWbgnColr, EWcolrStep, EWcount - EWint);
    }
    for(NSint=0; NSint<NScount; NSint++, v++, idx += this.floatsPerVertex) {
      // for every vertex in this arc, find x,y,z,w;  r,g,b,a;
      // and store them sequentially in vertSet[] array.
      // Find vertex position from normalized lattitude & longitude:
      this.polar2xyz(pos, // vec4 that holds vertex position in world-space x,y,z;
          EWint * EWgap,  // normalized East/west longitude (from 0 to 1)
          NSint * NSgap); // normalized North/South lattitude (from 0 to 1)
      // now set the vertex values in the array:
      vertSet[idx  ] = pos[0];            // x value
      vertSet[idx+1] = pos[1];            // y value
      vertSet[idx+2] = pos[2];            // z value
      vertSet[idx+3] = 1.0;               // w (it's a point, not a vector)
      vertSet[idx+4] = colrNow[0];  // r
      vertSet[idx+5] = colrNow[1];  // g
      vertSet[idx+6] = colrNow[2];  // b
      vertSet[idx+7] = colrNow[3];  // a;
    }
  }
  // Now APPEND this to existing VBO contents:
  // Make a new array (local) big enough to hold BOTH vboContents & vertSet:
	var tmp = new Float32Array(this.vboContents.length + vertSet.length);
  tmp.set(this.vboContents, 0);     // copy old VBOcontents into tmp, and
  tmp.set(vertSet,this.vboContents.length); // copy new vertSet just after it.
  this.vboVerts += vertCount;       // find number of verts in both.
  this.vboContents = tmp;           // REPLACE old vboContents with tmp

}

VBObox0.prototype.appendWireCube = function() {
	//==============================================================================
	// Create a set of vertices to draw grid of colored lines that form a unit
	// cube,  centered at x=y=z=0, (vertices at +/- 1 coordinates)
	// THEN append those vertices to this.vboContents array.
	// Draw these vertices with with gl.GL_LINES primitive.

	var vertCount = 4 * 2 * 4;
	var vertSet = new Float32Array(vertCount * this.floatsPerVertex);
	// Set Vertex Colors--------------------------------------
	this.endColr = vec4.fromValues(1.0, 0.5, 0.0, 1.0);	  // orange
	this.bgnColr = vec4.fromValues(1.0, 0.0, 1.0, 1.0);	  // purple
	// Compute how much the color changes between 1 arc (or ring) and the next:
	var colrStep = vec4.create();
	vec4.subtract(colrStep, this.endColr, this.bgnColr); // End - Bgn
	vec4.scale(colrStep, colrStep, 2.0/(vertCount -1)); // double-step for arc colors
	// Local vars for vertex-making loops-------------------
	var idx = 0;        // vertSet[] array index.
	var colrNow = vec4.create();   // color of the current arc or ring.

	for (let i = 0; i < 2; i++) {
		for (let j = 0; j < 2; j++) {
			for (let k = 0; k < 2; k++) {
				colrNow = vec4.scaleAndAdd(colrNow, this.bgnColr, idx/8);
				// now set the vertex values in the array:
				vertSet[idx  ] = 2*i-1.0;       // x value
				vertSet[idx+1] = 2*k-1.0;       // y value
				vertSet[idx+2] = 2*j-1.0;       // z value
				vertSet[idx+3] = 1.0;           // w (it's a point, not a vector)
				vertSet[idx+4] = colrNow[0];  // r
				vertSet[idx+5] = colrNow[1];  // g
				vertSet[idx+6] = colrNow[2];  // b
				vertSet[idx+7] = colrNow[3];  // a;
				idx += this.floatsPerVertex;
			}
			for (let k = 0; k < 2; k++) {
				colrNow = vec4.scaleAndAdd(colrNow, this.bgnColr, idx/8);
				// now set the vertex values in the array:
				vertSet[idx  ] = 2*i-1.0;       // x value
				vertSet[idx+1] = 2*j-1.0;       // y value
				vertSet[idx+2] = 2*k-1.0;       // z value
				vertSet[idx+3] = 1.0;           // w (it's a point, not a vector)
				vertSet[idx+4] = colrNow[0];  // r
				vertSet[idx+5] = colrNow[1];  // g
				vertSet[idx+6] = colrNow[2];  // b
				vertSet[idx+7] = colrNow[3];  // a;
				idx += this.floatsPerVertex;
			}
		}
	}
	for (let i = 0; i < 2; i++) {
		for (let j = 0; j < 2; j++) {
			for (let k = 0; k < 2; k++) {
				colrNow = vec4.scaleAndAdd(colrNow, this.bgnColr, idx/8);
				// now set the vertex values in the array:
				vertSet[idx  ] = 2*j-1.0;       // x value
				vertSet[idx+1] = 2*k-1.0;       // y value
				vertSet[idx+2] = 2*i-1.0;       // z value
				vertSet[idx+3] = 1.0;           // w (it's a point, not a vector)
				vertSet[idx+4] = colrNow[0];  // r
				vertSet[idx+5] = colrNow[1];  // g
				vertSet[idx+6] = colrNow[2];  // b
				vertSet[idx+7] = colrNow[3];  // a;
				idx += this.floatsPerVertex;
			}
			for (let k = 0; k < 2; k++) {
				colrNow = vec4.scaleAndAdd(colrNow, this.bgnColr, idx/8);
				// now set the vertex values in the array:
				vertSet[idx  ] = 2*k-1.0;       // x value
				vertSet[idx+1] = 2*j-1.0;       // y value
				vertSet[idx+2] = 2*i-1.0;       // z value
				vertSet[idx+3] = 1.0;           // w (it's a point, not a vector)
				vertSet[idx+4] = colrNow[0];  // r
				vertSet[idx+5] = colrNow[1];  // g
				vertSet[idx+6] = colrNow[2];  // b
				vertSet[idx+7] = colrNow[3];  // a;
				idx += this.floatsPerVertex;
			}
		}
	}
	// Now APPEND this to existing VBO contents:
	// Make a new array (local) big enough to hold BOTH vboContents & vertSet:
	var tmp = new Float32Array(this.vboContents.length + vertSet.length);
	tmp.set(this.vboContents, 0);     // copy old VBOcontents into tmp, and
	tmp.set(vertSet,this.vboContents.length); // copy new vertSet just after it.
	this.vboVerts += vertCount;       // find number of verts in both.
	this.vboContents = tmp;           // REPLACE old vboContents with tmp
}

VBObox0.prototype.appendWireCylinder = function() {
//==============================================================================
// Make a cylinder shape from one TRIANGLE_STRIP drawing primitive, using the
// 'stepped spiral' design described in notes.
// Cylinder center at origin, encircles z axis, radius 1, top/bottom at z= +/-1.

 var ctrColr = vec4.fromValues(0.2, 0.2, 0.2, 1.0);// dark gray
 var topColr = vec4.fromValues(0.4, 0.7, 0.4, 1.0);	// light green
 var botColr = vec4.fromValues(0.5, 0.5, 1.0, 1.0); // light blue
 var capVerts = 100;	// # of vertices around the topmost 'cap' of the shape
 var vertCount = capVerts*6-2;
 var botRadius = 1.0;		// radius of bottom of cylinder (top always 1.0)

 // Create a (global) array to hold this cylinder's vertices;
 cylVerts = new Float32Array(vertCount * this.floatsPerVertex);
										// # of vertices * # of elements needed to store them.
	// Create circle-shaped top cap of cylinder at z=+1.0, radius 1.0
	// v counts vertices: j counts array elements (vertices * elements per vertex)
	for(v=1,j=0; v<2*capVerts; v++,j+=this.floatsPerVertex) {
		// skip the first vertex--not needed.
		if(v%2==0)
		{				// put even# vertices at center of cylinder's top cap:
			cylVerts[j  ] = 0.0; 			// x,y,z,w == 0,0,1,1
			cylVerts[j+1] = 0.0;
			cylVerts[j+2] = 1.0;
			cylVerts[j+3] = 1.0;
			cylVerts[j+4]=ctrColr[0];
			cylVerts[j+5]=ctrColr[1];
			cylVerts[j+6]=ctrColr[2];
			cylVerts[j+6]=ctrColr[3];
		}
		else { 	// put odd# vertices around the top cap's outer edge;
						// x,y,z,w == cos(theta),sin(theta), 1.0, 1.0
						// 					theta = 2*PI*((v-1)/2)/capVerts = PI*(v-1)/capVerts
			cylVerts[j  ] = Math.cos(Math.PI*(v-1)/capVerts);			// x
			cylVerts[j+1] = Math.sin(Math.PI*(v-1)/capVerts);			// y
			//	(Why not 2*PI? because 0 < =v < 2*capVerts, so we
			//	 can simplify cos(2*PI * (v-1)/(2*capVerts))
			cylVerts[j+2] = 1.0;	// z
			cylVerts[j+3] = 1.0;	// w
			// r,g,b = topColr[]
			cylVerts[j+4]=topColr[0];
			cylVerts[j+5]=topColr[1];
			cylVerts[j+6]=topColr[2];
			cylVerts[j+7]=topColr[3];
		}
	}
	// Create the cylinder side walls, made of 2*capVerts vertices.
	// v counts vertices within the wall; j continues to count array elements
	for(v=0; v< 2*capVerts; v++, j+=this.floatsPerVertex) {
		if(v%2==0)	// position all even# vertices along top cap:
		{
				cylVerts[j  ] = Math.cos(Math.PI*(v)/capVerts);		// x
				cylVerts[j+1] = Math.sin(Math.PI*(v)/capVerts);		// y
				cylVerts[j+2] = 1.0;	// z
				cylVerts[j+3] = 1.0;	// w
				cylVerts[j+4]=topColr[0];
				cylVerts[j+5]=topColr[1];
				cylVerts[j+6]=topColr[2];
				cylVerts[j+7]=topColr[3];
		}
		else		// position all odd# vertices along the bottom cap:
		{
				cylVerts[j  ] = botRadius * Math.cos(Math.PI*(v-1)/capVerts);		// x
				cylVerts[j+1] = botRadius * Math.sin(Math.PI*(v-1)/capVerts);		// y
				cylVerts[j+2] =-1.0;	// z
				cylVerts[j+3] = 1.0;	// w
				cylVerts[j+4]=topColr[0];
				cylVerts[j+5]=topColr[1];
				cylVerts[j+6]=topColr[2];
				cylVerts[j+7]=topColr[3];
		}
	}
	// Create the cylinder bottom cap, made of 2*capVerts -1 vertices.
	// v counts the vertices in the cap; j continues to count array elements
	for(v=0; v < (2*capVerts -1); v++, j+= this.floatsPerVertex) {
		if(v%2==0) {	// position even #'d vertices around bot cap's outer edge
			cylVerts[j  ] = botRadius * Math.cos(Math.PI*(v)/capVerts);		// x
			cylVerts[j+1] = botRadius * Math.sin(Math.PI*(v)/capVerts);		// y
			cylVerts[j+2] =-1.0;	// z
			cylVerts[j+3] = 1.0;	// w
			cylVerts[j+4]=botColr[0];
			cylVerts[j+5]=botColr[1];
			cylVerts[j+6]=botColr[2];
			cylVerts[j+7]=botColr[3];
		}
		else {				// position odd#'d vertices at center of the bottom cap:
			cylVerts[j  ] = 0.0; 			// x,y,z,w == 0,0,-1,1
			cylVerts[j+1] = 0.0;
			cylVerts[j+2] =-1.0;
			cylVerts[j+3] = 1.0;	// w
			cylVerts[j+4]=botColr[0];
			cylVerts[j+5]=botColr[1];
			cylVerts[j+6]=botColr[2];
			cylVerts[j+7]=botColr[3];
		}
	}
	var tmp = new Float32Array(this.vboContents.length + cylVerts.length);
	tmp.set(this.vboContents, 0);     // copy old VBOcontents into tmp, and
	tmp.set(cylVerts,this.vboContents.length); // copy new vertSet just after it.
	this.vboVerts += vertCount;       // find number of verts in both.
	this.vboContents = tmp;           // REPLACE old vboContents with tmp
}

VBObox0.prototype.init = function() {
//==============================================================================
// Prepare the GPU to use all vertices, GLSL shaders, attributes, & uniforms
// already created in this VBObox by its constructor function VBObox0();
// NOTE: The init() function is usually called only once, within main())
// Specifically:
// a) Create, compile, link our GLSL vertex- and fragment-shaders to form an
//  executable 'program' stored and ready to use inside the GPU.
// b) create a new VBO object in GPU memory and fill it by transferring in all
//  the vertex data held in our Float32array member 'VBOcontents'.
// c) If shader uses texture-maps, create and load them and their samplers,
// d) Find & save the GPU location of all our shaders' attribute-variables and
//  uniform-variables (needed by switchToMe(), adjust(), draw(), reload(), etc.)
// -------------------
// CAREFUL!  before you can draw pictures using this VBObox contents,
//  be sure to call this VBObox object's switchToMe() function too!
//--------------------

// a) Compile,link,upload shaders-----------------------------------------------
	this.shaderLoc = createProgram(gl, this.VERT_SRC, this.FRAG_SRC);
	if (!this.shaderLoc) {
    console.log(this.constructor.name +
    						'.init() failed to create executable Shaders on the GPU. Bye!');
    return;
  }
// CUTE TRICK: let's print the NAME of this VBObox object: tells us which one!
//  else{console.log('You called: '+ this.constructor.name + '.init() fcn!');}

	gl.program = this.shaderLoc;		// (to match cuon-utils.js -- initShaders())

// b) Create VBO on GPU, fill it------------------------------------------------
	this.vboLoc = gl.createBuffer();
  if (!this.vboLoc) {
    console.log(this.constructor.name +
    						'.init() failed to create VBO in GPU. Bye!');
    return;
  }
  // Specify the purpose of our newly-created VBO on the GPU.  Your choices are:
  //	== "gl.ARRAY_BUFFER" : the VBO holds vertices, each made of attributes
  // (positions, colors, normals, etc), or
  //	== "gl.ELEMENT_ARRAY_BUFFER" : the VBO holds indices only; integer values
  // that each select one vertex from a vertex array stored in another VBO.
  gl.bindBuffer(gl.ARRAY_BUFFER,	      // GLenum 'target' for this GPU buffer
  								this.vboLoc);				  // the ID# the GPU uses for this buffer.

  // Fill the GPU's newly-created VBO object with the vertex data we stored in
  //  our 'vboContents' member (JavaScript Float32Array object).
  //  (Recall gl.bufferData() will evoke GPU's memory allocation & management:
  //    use gl.bufferSubData() to modify VBO contents without changing VBO size)
  gl.bufferData(gl.ARRAY_BUFFER, 			  // GLenum target(same as 'bindBuffer()')
 					 				this.vboContents, 		// JavaScript Float32Array
  							 	gl.STATIC_DRAW);			// Usage hint.
  //	The 'hint' helps GPU allocate its shared memory for best speed & efficiency
  //	(see OpenGL ES specification for more info).  Your choices are:
  //		--STATIC_DRAW is for vertex buffers rendered many times, but whose
  //				contents rarely or never change.
  //		--DYNAMIC_DRAW is for vertex buffers rendered many times, but whose
  //				contents may change often as our program runs.
  //		--STREAM_DRAW is for vertex buffers that are rendered a small number of
  // 			times and then discarded; for rapidly supplied & consumed VBOs.

  // c) Make/Load Texture Maps & Samplers:------------------------------------------
		//  NONE.
		// see VBObox1.prototype.init = function(myGL) below for a working example)

  // d1) Find All Attributes:---------------------------------------------------
  //  Find & save the GPU location of all our shaders' attribute-variables and
  //  uniform-variables (for switchToMe(), adjust(), draw(), reload(),etc.)
  this.a_PositionLoc = gl.getAttribLocation(this.shaderLoc, 'a_Position');
  if(this.a_PositionLoc < 0) {
    console.log(this.constructor.name +
    						'.init() Failed to get GPU location of attribute a_Position');
    return -1;	// error exit.
  }
 	this.a_ColorLoc = gl.getAttribLocation(this.shaderLoc, 'a_Color');
  if(this.a_ColorLoc < 0) {
    console.log(this.constructor.name +
    						'.init() failed to get the GPU location of attribute a_Color');
    return -1;	// error exit.
  }
  // d2) Find All Uniforms:-----------------------------------------------------
  //Get GPU storage location for each uniform var used in our shader programs:

	this.u_mvpMatLoc = gl.getUniformLocation(this.shaderLoc, 'u_mvpMat');
  if (!this.u_mvpMatLoc) {
    console.log(this.constructor.name +
    						'.init() failed to get GPU location for u_mvpMat uniform');
    return;
  }
}

VBObox0.prototype.switchToMe = function() {
//==============================================================================
// Set GPU to use this VBObox's contents (VBO, shader, attributes, uniforms...)
//
// We only do this AFTER we called the init() function, which does the one-time-
// only setup tasks to put our VBObox contents into GPU memory.  !SURPRISE!
// even then, you are STILL not ready to draw our VBObox's contents onscreen!
// We must also first complete these steps:
//  a) tell the GPU to use our VBObox's shader program (already in GPU memory),
//  b) tell the GPU to use our VBObox's VBO  (already in GPU memory),
//  c) tell the GPU to connect the shader program's attributes to that VBO.

// a) select our shader program:
  gl.useProgram(this.shaderLoc);
//		Each call to useProgram() selects a shader program from the GPU memory,
// but that's all -- it does nothing else!  Any previously used shader program's
// connections to attributes and uniforms are now invalid, and thus we must now
// establish new connections between our shader program's attributes and the VBO
// we wish to use.

// b) call bindBuffer to disconnect the GPU from its currently-bound VBO and
//  instead connect to our own already-created-&-filled VBO.  This new VBO can
//    supply values to use as attributes in our newly-selected shader program:
	gl.bindBuffer(gl.ARRAY_BUFFER,	        // GLenum 'target' for this GPU buffer
										this.vboLoc);			    // the ID# the GPU uses for our VBO.

// c) connect our newly-bound VBO to supply attribute variable values for each
// vertex to our SIMD shader program, using 'vertexAttribPointer()' function.
// this sets up data paths from VBO to our shader units:
  // 	Here's how to use the almost-identical OpenGL version of this function:
	//		http://www.opengl.org/sdk/docs/man/xhtml/glVertexAttribPointer.xml )
  gl.vertexAttribPointer(
		this.a_PositionLoc,//index == ID# for the attribute var in your GLSL shader pgm;
		this.vboFcount_a_Position,// # of floats used by this attribute: 1,2,3 or 4?
		gl.FLOAT,			// type == what data type did we use for those numbers?
		false,				// isNormalized == are these fixed-point values that the GPU
									//								 must normalize before use? true or false
		this.vboStride,// Stride == #bytes we must skip in the VBO to move from the
		              // stored attrib for this vertex to the same stored attrib
		              //  for the next vertex in our VBO.  This is usually the
									// number of bytes used to store one complete vertex.  If set
									// to zero, the GPU gets attribute values sequentially from
									// VBO, starting at 'Offset'.
									// (Our vertex size in bytes: 4 floats for pos + 3 for color)
		this.vboOffset_a_Position);
		              // Offset == how many bytes from START of buffer to the first
  								// value we will actually use?  (We start with position).
  gl.vertexAttribPointer(this.a_ColorLoc, this.vboFcount_a_Color,
                        gl.FLOAT, false,
                        this.vboStride, this.vboOffset_a_Color);

// --Enable this assignment of each of these attributes to its' VBO source:
  gl.enableVertexAttribArray(this.a_PositionLoc);
  gl.enableVertexAttribArray(this.a_ColorLoc);
}

VBObox0.prototype.isReady = function() {
//==============================================================================
// Returns 'true' if our WebGL rendering context ('gl') is ready to render using
// this objects VBO and shader program; else return false.
// see: https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getParameter

var isOK = true;

  if(gl.getParameter(gl.CURRENT_PROGRAM) != this.shaderLoc)  {
    console.log(this.constructor.name +
    						'.isReady() false: shader program at this.shaderLoc not in use!');
    isOK = false;
  }
  if(gl.getParameter(gl.ARRAY_BUFFER_BINDING) != this.vboLoc) {
      console.log(this.constructor.name +
  						'.isReady() false: vbo at this.vboLoc not in use!');
    isOK = false;
  }
  return isOK;
}

VBObox0.prototype.adjust = function() {
//==============================================================================
// Update the GPU to newer, current values we now store for 'uniform' vars on
// the GPU; and (if needed) update each attribute's stride and offset in VBO.

  // check: was WebGL context set to use our VBO & shader program?
  if(this.isReady()==false) {
        console.log('ERROR! before' + this.constructor.name +
  						'.adjust() call you needed to call this.switchToMe()!!');
  }
	// Adjust values for our uniforms:--------------
  var camProj = mat4.create();          // Let our global GUIbox object set camera
										// based on user controls, if any:
  // We can either use the perspective() function, like this:
  mat4.perspective(camProj,             // out
              glMatrix.toRadian(gui.camFovy), // fovy in radians
              gui.camAspect,                  // aspect ratio width/height
              gui.camNear,                    // znear
              gui.camFar);                    // zfar

  // // or use the frustum() function, like this:
  // mat4.frustum(camProj, -1.0, 1.0,      // left, right
  //                       -1.0, 1.0,      // bottom, top
  //                       1.0, 10000.0);  // near, far

  var camView = mat4.create();			// 'view' matrix sets camera pose
  mat4.lookAt(camView, gui.camEyePt, gui.camAimPt, gui.camUpVec);
  mat4.multiply(this.mvpMat, camProj, camView);
  // mvpMat now set for WORLD drawing axes.
  // If you want to draw in various 'model' coord systems you'll need to make
  // further modifications of the mvpMat matrix and u_mvpMat uniform in the
  // VBObox0.draw() function below.

  //  Transfer new uniforms' values to the GPU:-------------
  // Send  new 'ModelMat' values to the GPU's 'u_ModelMat1' uniform:
  gl.uniformMatrix4fv(this.u_mvpMatLoc,	// GPU location of the uniform
  										false, 				// use matrix transpose instead?
  										this.mvpMat);	// send data from Javascript.

  // Adjust the attributes' stride and offset (if necessary)
  // (use gl.vertexAttribPointer() calls and gl.enableVertexAttribArray() calls)

}

VBObox0.prototype.draw = function() {
//=============================================================================
// Render current VBObox contents.

  // check: was WebGL context set to use our VBO & shader program?
  if(this.isReady()==false) {
        console.log('ERROR! before' + this.constructor.name +
  						'.draw() call you needed to call this.switchToMe()!!');
  }
  // ----------------------------Draw the contents of the currently-bound VBO:
  // SPLIT UP the drawing into separate shapes, as each needs different
  // transforms in its mvpMatrix uniform.  VBObox0.adjust() already set value
  // to the GPU's uniform u_mvpMat for drawing in world coords, so we're ready
  // to draw the ground-plane grid (first vertex at this.bgnGrid)

  // SAVE world-space coordinate transform-----
  // (LATER replace this naive method with a push-down stack
  //   so that we can traverse a scene-graph).
  var tmp = mat4.create();
  mat4.copy(tmp, this.mvpMat);

  // Draw each World-space object:-------------
  // xyz axes, ground-plane grid.  Uniforms already set properly.
  gl.drawArrays(gl.LINES, 	    // select the drawing primitive to draw,
                  // choices: gl.POINTS, gl.LINES, gl.LINE_STRIP, gl.LINE_LOOP,
                  //          gl.TRIANGLES, gl.TRIANGLE_STRIP, ...
                  // WHICH vertices to draw:  see constructor fcn to see how we
                  //  filled our VBO...
  								0, 							// location of 1st vertex to draw;
  								                // The number of vertices to draw on-screen:
  								                // (see constructor to understand)
                  this.bgnDisk);  // draw only the axes & ground-plane.

  // Draw Model-space objects:--------------
  var tmp = mat4.create();
  mat4.copy(tmp, this.mvpMat);    // SAVE current value (needs push-down stack!)

  // 1) -----------------copy transforms for Disk 1 in CScene.initScene(0) :
  mat4.translate(this.mvpMat, this.mvpMat, vec3.fromValues(1.0, 1.0, 1.3));
  mat4.rotate(this.mvpMat, this.mvpMat, 0.25*Math.PI, vec3.fromValues(1,0,0));
  mat4.rotate(this.mvpMat, this.mvpMat, 0.25*Math.PI, vec3.fromValues(0,0,1));
  // Send  new 'ModelMat' values to the GPU's 'u_ModelMat1' uniform:
  gl.uniformMatrix4fv(this.u_mvpMatLoc,	// GPU location of the uniform
  										false, 				// use matrix transpose instead?
  										this.mvpMat);	// send data from Javascript.
  mat4.copy(this.mvpMat, tmp);      // restore world-space mvpMat values.
    gl.drawArrays(gl.LINES, 	    // select the drawing primitive to draw,
                  // choices: gl.POINTS, gl.LINES, gl.LINE_STRIP, gl.LINE_LOOP,
                  //          gl.TRIANGLES, gl.TRIANGLE_STRIP, ...
  								this.bgnDisk, 	// location of 1st vertex to draw;
                  this.bgnSphere - this.bgnDisk);  // How many vertices to draw
  // 2) -----------------copy transforms for Disk 2 in CScene.initScene(0) :
  mat4.copy(this.mvpMat, tmp); // RESTORE current value (needs push-down stack!)
  mat4.translate(this.mvpMat, this.mvpMat, vec3.fromValues(-1.0, 1.0, 1.3));
  mat4.rotate(this.mvpMat, this.mvpMat, 0.75*Math.PI, vec3.fromValues(1,0,0));
  mat4.rotate(this.mvpMat, this.mvpMat, Math.PI/3.0,  vec3.fromValues(0,0,1));
  // Send  new 'ModelMat' values to the GPU's 'u_ModelMat1' uniform:
  gl.uniformMatrix4fv(this.u_mvpMatLoc,	// GPU location of the uniform
  										false, 				// use matrix transpose instead?
  										this.mvpMat);	// send data from Javascript.
  mat4.copy(this.mvpMat, tmp);      // restore world-space mvpMat values.
  gl.drawArrays(gl.LINES, 	    // select the drawing primitive to draw,
                // choices: gl.POINTS, gl.LINES, gl.LINE_STRIP, gl.LINE_LOOP,
                //          gl.TRIANGLES, gl.TRIANGLE_STRIP, ...
								this.bgnDisk, 	// location of 1st vertex to draw;
                this.bgnSphere - this.bgnDisk);  // How many vertices to draw
  // 3)--------------------copy transforms for Sphere 1 in CScene.initScene(0)
  mat4.copy(this.mvpMat, tmp); // RESTORE current value (needs push-down stack!)
	mat4.translate(this.mvpMat, this.mvpMat, vec3.fromValues(1.2,-1.0, 1.0));
  // Send  new 'ModelMat' values to the GPU's 'u_ModelMat1' uniform:
  gl.uniformMatrix4fv(this.u_mvpMatLoc,	// GPU location of the uniform
  										false, 				// use matrix transpose instead?
  										this.mvpMat);	// send data from Javascript.
  mat4.copy(this.mvpMat, tmp);      // restore world-space mvpMat values.
  gl.drawArrays(gl.LINE_STRIP, 	      // select the drawing primitive to draw,
                // choices: gl.POINTS, gl.LINES, gl.LINE_STRIP, gl.LINE_LOOP,
                //          gl.TRIANGLES, gl.TRIANGLE_STRIP, ...
								this.bgnSphere, 	// location of 1st vertex to draw;
                this.bgnCube - this.bgnSphere); // How many vertices to draw
  mat4.copy(this.mvpMat, tmp); // RESTORE current value (needs push-down stack!)
	// 4) -----------------copy transforms for Cube 1 in CScene.initScene(0) :
	mat4.copy(this.mvpMat, tmp); // RESTORE current value (needs push-down stack!)
	mat4.translate(this.mvpMat, this.mvpMat, vec3.fromValues(2.0, 2.0, 2.0));
	mat4.rotate(this.mvpMat, this.mvpMat, 0.8*Math.PI, vec3.fromValues(1,0.5,0));
	// Send  new 'ModelMat' values to the GPU's 'u_ModelMat1' uniform:
	gl.uniformMatrix4fv(this.u_mvpMatLoc,	// GPU location of the uniform
											false, 				// use matrix transpose instead?
											this.mvpMat);	// send data from Javascript.
	mat4.copy(this.mvpMat, tmp);      // restore world-space mvpMat values.
	gl.drawArrays(gl.LINES, 	    // select the drawing primitive to draw,
								// choices: gl.POINTS, gl.LINES, gl.LINE_STRIP, gl.LINE_LOOP,
								//          gl.TRIANGLES, gl.TRIANGLE_STRIP, ...
								this.bgnCube, 	// location of 1st vertex to draw;
								this.bgnCyl - this.bgnCube);  // How many vertices to draw
	// 5) -----------------copy transforms for Cylinder 1 in CScene.initScene(0) :
	mat4.copy(this.mvpMat, tmp); // RESTORE current value (needs push-down stack!)
	mat4.translate(this.mvpMat, this.mvpMat, vec3.fromValues(-1.0, -1.0, 1.0));
	mat4.rotate(this.mvpMat, this.mvpMat, 0.7*Math.PI, vec3.fromValues(0,0,1));
	// Send  new 'ModelMat' values to the GPU's 'u_ModelMat1' uniform:
	gl.uniformMatrix4fv(this.u_mvpMatLoc,	// GPU location of the uniform
											false, 				// use matrix transpose instead?
											this.mvpMat);	// send data from Javascript.
	mat4.copy(this.mvpMat, tmp);      // restore world-space mvpMat values.
	gl.drawArrays(gl.LINES, 	    // select the drawing primitive to draw,
								// choices: gl.POINTS, gl.LINES, gl.LINE_STRIP, gl.LINE_LOOP,
								//          gl.TRIANGLES, gl.TRIANGLE_STRIP, ...
								this.bgnCyl, 	// location of 1st vertex to draw;
								this.vboVerts - this.bgnCyl);  // How many vertices to draw
}

VBObox0.prototype.reload = function() {
//=============================================================================
// Over-write current values in the GPU inside our already-created VBO: use
// gl.bufferSubData() call to re-transfer some or all of our Float32Array
// contents to our VBO without changing any GPU memory allocations.

 gl.bufferSubData(gl.ARRAY_BUFFER, 	// GLenum target(same as 'bindBuffer()')
                  0,                  // byte offset to where data replacement
                                      // begins in the VBO.
 					 				this.vboContents);   // the JS source-data array used to fill VBO

}
/*
VBObox0.prototype.empty = function() {
//=============================================================================
// Remove/release all GPU resources used by this VBObox object, including any
// shader programs, attributes, uniforms, textures, samplers or other claims on
// GPU memory.  However, make sure this step is reversible by a call to
// 'restoreMe()': be sure to retain all our Float32Array data, all values for
// uniforms, all stride and offset values, etc.
//
//
// 		********   YOU WRITE THIS! ********
//
//
//
}

VBObox0.prototype.restore = function() {
//=============================================================================
// Replace/restore all GPU resources used by this VBObox object, including any
// shader programs, attributes, uniforms, textures, samplers or other claims on
// GPU memory.  Use our retained Float32Array data, all values for  uniforms,
// all stride and offset values, etc.
//
//
// 		********   YOU WRITE THIS! ********
//
//
//
}
*/
