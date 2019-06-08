//===  CLamp.js  ===================================================

function CLamp(pos) {
  this.I_pos = pos;	// x,y,z,w:   w==1 for local 3D position,
                                // w==0 for light at infinity in direction (x,y,z)
  this.isLit = true;						// true/false for ON/OFF
  this.I_ambi = vec4.fromValues(1.0, 1.0, 1.0, 1.0);		// ambient illumination: r,g,b
  this.I_diff = vec4.fromValues(1.0, 1.0, 1.0, 1.0);		// diffuse illumination: r,g,b.
  this.I_spec = vec4.fromValues(1.0, 1.0, 1.0, 1.0);		// specular illumination: r,g,b.

  this.u_pos = null;						// GPU location for 'uniform' that holds I_pos
  this.u_ambi = null;						// 																			 I_ambi
  this.u_diff = null;						//																			 I_diff
  this.u_spec = null;						//																			 I_spec.
}
