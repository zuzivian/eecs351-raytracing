// ORIGINAL SOURCES:
// Chap 5: TexturedQuad.js (c) 2012 matsuda and kanda
//					"WebGL Programming Guide" pg. 163
// RotatingTranslatedTriangle.js (c) 2012 matsuda
// JT_MultiShader.js  for EECS 351-1,
//									Northwestern Univ. Jack Tumblin
//	LineGrid.js 		Northwestern Univ. Jack Tumblin
//----------------------------------------------------------------------
//	WongNathaniel_ProjB.js, for EECS 351-2 		Northwestern Univ. Nathaniel Wong
//----------------------------------------------------------------------

// Global Variables
// ============================================================================
//-----For WebGL usage:-------------------------
var gl;													// WebGL rendering context -- the 'webGL' object
var g_canvasID;									// HTML-5 'canvas' element ID#
//-----Mouse,keyboard, GUI variables-----------
var gui = new GUIbox(); // Holds all (Graphical) User Interface fcns & vars
//-----For the VBOs & Shaders:-----------------
var preView = new VBObox0();		// For WebGLpreview: holds one VBO and its shaders
var rayView = new VBObox1();		// for displaying the ray-tracing results.
//-----------Ray Tracer Objects:---------------
var g_myPic = new CImgBuf(256,256); // Create a floating-point image-buffer
var g_myScene = new CScene(g_myPic); // Create our ray-tracing object;
var G_SCENE_MAX = 4;		// Number of scenes defined.
var g_SceneNum = 0;			// scene-selector number; 0,1,2,... G_SCENE_MAX-1


function main() {
  // Retrieve the HTML-5 <canvas> element where webGL will draw our pictures:
  g_canvasID = document.getElementById('webgl');

  // Create the the WebGL rendering context: one giant JavaScript object
  gl = g_canvasID.getContext("webgl", { preserveDrawingBuffer: true });
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }
  gl.clearColor(0.2, 0.2, 0.2, 1);	  // set RGBA color for clearing <canvas>
  gl.enable(gl.DEPTH_TEST);           // CAREFUL! don't do depth tests for 2D!

  gui.init();                   // Register all Mouse & Keyboard Event-handlers

  // Initialize each of our 'vboBox' objects:
  preView.init(gl);		// VBO + shaders + uniforms + attribs for WebGL preview
  rayView.init(gl);		//  "		"		" to display ray-traced on-screen result.

  onBrowserResize();			// Re-size this canvas before we use it.

  drawAll();
}

function drawAll() {
  // Re-draw all WebGL contents in our browser window.
  // NOTE: this program doesn't have an animation loop!
  //  We only re-draw the screen when the user needs it redrawn

  // Clear <canvas> color AND DEPTH buffer
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Draw in the LEFT viewport:
	gl.viewport(0,														// Viewport lower-left corner
							0,														// (x,y) location(in pixels)
  						gl.drawingBufferWidth/2, 			// viewport width, height.
  						gl.drawingBufferHeight);
	preView.switchToMe();  // Set WebGL to render from this VBObox.
	preView.adjust();		  // Send new values for uniforms to the GPU, and
	preView.draw();			  // draw our VBO's contents using our shaders.

  // Draw in the RIGHT viewport:
	gl.viewport(gl.drawingBufferWidth/2,   // Viewport lower-left corner
	            0,      // location(in pixels)
	            gl.drawingBufferWidth/2, 			// viewport width, height.
  	          gl.drawingBufferHeight);
    rayView.switchToMe(); // Set WebGL to render from this VBObox.
  	rayView.adjust();		  // Send new values for uniforms to the GPU, and
  	rayView.draw();			  // draw our VBO's contents using our shaders.
}

function onSuperSampleButton() {
  // advance to the next antialiasing mode.
  g_myScene.AAcode += 1;
  if(g_myScene.AAcode > g_myScene.G_AA_MAX) g_myScene.AAcode = 1; // 1,2,3,4, 1,2,3,4, 1,2,... etc
  updateTracerInfo();
}

function onJitterButton() {
  g_myScene.isJitter = g_myScene.isJitter ? 0 : 1;
  updateTracerInfo();
}

function updateTracerInfo() {
  if(g_myScene.AAcode==1) {
    if (g_myScene.isJitter==0)
      document.getElementById('AAreport').innerHTML = "1 sample/pixel. No jitter.";
    else
      document.getElementById('AAreport').innerHTML = "1 sample/pixel, JTTERED.";
  }
  else { // g_AAcode !=1
    if(g_myScene.isJitter==0)
      document.getElementById('AAreport').innerHTML = g_myScene.AAcode+"x"+g_myScene.AAcode+" Supersampling. No jitter.";
    else
      document.getElementById('AAreport').innerHTML = g_myScene.AAcode+"x"+g_myScene.AAcode+" JITTERED Supersampling";
  }
}

function onSceneButton() {
	if(g_SceneNum < 0 || g_SceneNum >= G_SCENE_MAX-1) g_SceneNum = 0;
	else g_SceneNum = g_SceneNum +1;
	document.getElementById('SceneReport').innerHTML = 'Scene Number ' + g_SceneNum;
  // Change g_myPic contents:
  g_myPic.setTestPattern(g_SceneNum);
  // transfer g_myPic's new contents to the GPU;
  rayView.switchToMe(); // be sure OUR VBO & shaders are in use, then
  rayView.reload();     // re-transfer VBO contents and texture-map contents
  drawAll();
}

function onBrowserResize() {
  // Called when user re-sizes their browser window
	//Make a square canvas/CVV fill the SMALLER of the width/2 or height:
	if(innerWidth > 2*innerHeight) {  // fit to brower-window height
		g_canvasID.width = 2*innerHeight - 20;  // (with 20-pixel margin)
		g_canvasID.height = innerHeight - 20;   // (with 20-pixel margin_
	  }
	else {	// fit canvas to browser-window width
		g_canvasID.width = innerWidth - 20;       // (with 20-pixel margin)
		g_canvasID.height = 0.5*innerWidth - 20;  // (with 20-pixel margin)
	}
  drawAll();     // re-draw browser contents using the new size.
}
