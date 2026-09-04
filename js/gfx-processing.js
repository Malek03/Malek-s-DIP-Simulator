/* ============================================================
   Vision Studio — Advanced Graphics Module
   Engine: WebGL Helpers, 3D Math, and Geometry Generators
   ============================================================ */

const GfxProcessing = (() => {
  'use strict';

  /* ----------------------------------------------------------
   * Vector Math (vec3)
   * ---------------------------------------------------------- */
  const vec3 = {
    create: () => new Float32Array(3),
    set: (out, x, y, z) => {
      out[0] = x; out[1] = y; out[2] = z;
      return out;
    },
    normalize: (out, a) => {
      let x = a[0], y = a[1], z = a[2];
      let len = x * x + y * y + z * z;
      if (len > 0) {
        len = 1 / Math.sqrt(len);
      }
      out[0] = a[0] * len;
      out[1] = a[1] * len;
      out[2] = a[2] * len;
      return out;
    },
    cross: (out, a, b) => {
      let ax = a[0], ay = a[1], az = a[2];
      let bx = b[0], by = b[1], bz = b[2];
      out[0] = ay * bz - az * by;
      out[1] = az * bx - ax * bz;
      out[2] = ax * by - ay * bx;
      return out;
    },
    subtract: (out, a, b) => {
      out[0] = a[0] - b[0];
      out[1] = a[1] - b[1];
      out[2] = a[2] - b[2];
      return out;
    }
  };

  /* ----------------------------------------------------------
   * Matrix Math (mat4)
   * ---------------------------------------------------------- */
  const mat4 = {
    create: () => {
      let out = new Float32Array(16);
      out[0] = 1; out[5] = 1; out[10] = 1; out[15] = 1;
      return out;
    },
    identity: (out) => {
      out.fill(0);
      out[0] = 1; out[5] = 1; out[10] = 1; out[15] = 1;
      return out;
    },
    perspective: (out, fovy, aspect, near, far) => {
      let f = 1.0 / Math.tan(fovy / 2);
      let nf = 1 / (near - far);
      out[0] = f / aspect; out[1] = 0; out[2] = 0; out[3] = 0;
      out[4] = 0; out[5] = f; out[6] = 0; out[7] = 0;
      out[8] = 0; out[9] = 0; out[10] = (far + near) * nf; out[11] = -1;
      out[12] = 0; out[13] = 0; out[14] = (2 * far * near) * nf; out[15] = 0;
      return out;
    },
    ortho: (out, left, right, bottom, top, near, far) => {
      let lr = 1 / (left - right);
      let bt = 1 / (bottom - top);
      let nf = 1 / (near - far);
      out[0] = -2 * lr; out[1] = 0; out[2] = 0; out[3] = 0;
      out[4] = 0; out[5] = -2 * bt; out[6] = 0; out[7] = 0;
      out[8] = 0; out[9] = 0; out[10] = 2 * nf; out[11] = 0;
      out[12] = (left + right) * lr; out[13] = (top + bottom) * bt; out[14] = (far + near) * nf; out[15] = 1;
      return out;
    },
    translate: (out, a, v) => {
      let x = v[0], y = v[1], z = v[2];
      if (a === out) {
        out[12] = a[0] * x + a[4] * y + a[8] * z + a[12];
        out[13] = a[1] * x + a[5] * y + a[9] * z + a[13];
        out[14] = a[2] * x + a[6] * y + a[10] * z + a[14];
        out[15] = a[3] * x + a[7] * y + a[11] * z + a[15];
      } else {
        let a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
        let a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
        let a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
        out[0] = a00; out[1] = a01; out[2] = a02; out[3] = a03;
        out[4] = a10; out[5] = a11; out[6] = a12; out[7] = a13;
        out[8] = a20; out[9] = a21; out[10] = a22; out[11] = a23;
        out[12] = a00 * x + a10 * y + a20 * z + a[12];
        out[13] = a01 * x + a11 * y + a21 * z + a[13];
        out[14] = a02 * x + a12 * y + a22 * z + a[14];
        out[15] = a03 * x + a13 * y + a23 * z + a[15];
      }
      return out;
    },
    rotate: (out, a, rad, axis) => {
      let x = axis[0], y = axis[1], z = axis[2];
      let len = Math.sqrt(x * x + y * y + z * z);
      if (len < 0.000001) return null;
      len = 1 / len; x *= len; y *= len; z *= len;
      let s = Math.sin(rad), c = Math.cos(rad), t = 1 - c;
      let a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
      let a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
      let a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
      let b00 = x * x * t + c, b01 = y * x * t + z * s, b02 = z * x * t - y * s;
      let b10 = x * y * t - z * s, b11 = y * y * t + c, b12 = z * y * t + x * s;
      let b20 = x * z * t + y * s, b21 = y * z * t - x * s, b22 = z * z * t + c;
      out[0] = a00 * b00 + a10 * b01 + a20 * b02;
      out[1] = a01 * b00 + a11 * b01 + a21 * b02;
      out[2] = a02 * b00 + a12 * b01 + a22 * b02;
      out[3] = a03 * b00 + a13 * b01 + a23 * b02;
      out[4] = a00 * b10 + a10 * b11 + a20 * b12;
      out[5] = a01 * b10 + a11 * b11 + a21 * b12;
      out[6] = a02 * b10 + a12 * b11 + a22 * b12;
      out[7] = a03 * b10 + a13 * b11 + a23 * b12;
      out[8] = a00 * b20 + a10 * b21 + a20 * b22;
      out[9] = a01 * b20 + a11 * b21 + a21 * b22;
      out[10] = a02 * b20 + a12 * b21 + a22 * b22;
      out[11] = a03 * b20 + a13 * b21 + a23 * b22;
      if (a !== out) { out[12] = a[12]; out[13] = a[13]; out[14] = a[14]; out[15] = a[15]; }
      return out;
    },
    scale: (out, a, v) => {
      let x = v[0], y = v[1], z = v[2];
      out[0] = a[0] * x; out[1] = a[1] * x; out[2] = a[2] * x; out[3] = a[3] * x;
      out[4] = a[4] * y; out[5] = a[5] * y; out[6] = a[6] * y; out[7] = a[7] * y;
      out[8] = a[8] * z; out[9] = a[9] * z; out[10] = a[10] * z; out[11] = a[11] * z;
      if (a !== out) { out[12] = a[12]; out[13] = a[13]; out[14] = a[14]; out[15] = a[15]; }
      return out;
    },
    multiply: (out, a, b) => {
      let a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
      let a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
      let a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
      let a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];
      let b0 = b[0], b1 = b[1], b2 = b[2], b3 = b[3];
      out[0] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
      out[1] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
      out[2] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
      out[3] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
      b0 = b[4]; b1 = b[5]; b2 = b[6]; b3 = b[7];
      out[4] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
      out[5] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
      out[6] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
      out[7] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
      b0 = b[8]; b1 = b[9]; b2 = b[10]; b3 = b[11];
      out[8] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
      out[9] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
      out[10] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
      out[11] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
      b0 = b[12]; b1 = b[13]; b2 = b[14]; b3 = b[15];
      out[12] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
      out[13] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
      out[14] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
      out[15] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
      return out;
    },
    invert: (out, a) => {
      let a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
      let a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
      let a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
      let a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];
      let b00 = a00 * a11 - a01 * a10, b01 = a00 * a12 - a02 * a10, b02 = a00 * a13 - a03 * a10;
      let b03 = a01 * a12 - a02 * a11, b04 = a01 * a13 - a03 * a11, b05 = a02 * a13 - a03 * a12;
      let b06 = a20 * a31 - a21 * a30, b07 = a20 * a32 - a22 * a30, b08 = a20 * a33 - a23 * a30;
      let b09 = a21 * a32 - a22 * a31, b10 = a21 * a33 - a23 * a31, b11 = a22 * a33 - a23 * a32;
      let det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
      if (!det) return null;
      det = 1.0 / det;
      out[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
      out[1] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
      out[2] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
      out[3] = (a22 * b04 - a21 * b05 - a23 * b03) * det;
      out[4] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
      out[5] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
      out[6] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
      out[7] = (a20 * b05 - a22 * b02 + a23 * b01) * det;
      out[8] = (a10 * b10 - a11 * b08 + a13 * b06) * det;
      out[9] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
      out[10] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
      out[11] = (a21 * b02 - a20 * b04 - a23 * b00) * det;
      out[12] = (a11 * b07 - a10 * b09 - a12 * b06) * det;
      out[13] = (a00 * b09 - a01 * b07 + a02 * b06) * det;
      out[14] = (a31 * b01 - a30 * b03 - a32 * b00) * det;
      out[15] = (a20 * b03 - a21 * b01 + a22 * b00) * det;
      return out;
    },
    transpose: (out, a) => {
      if (out === a) {
        let a01 = a[1], a02 = a[2], a03 = a[3];
        let a12 = a[6], a13 = a[7];
        let a23 = a[11];
        out[1] = a[4]; out[2] = a[8]; out[3] = a[12];
        out[4] = a01; out[6] = a[9]; out[7] = a[13];
        out[8] = a02; out[9] = a12; out[11] = a[14];
        out[12] = a03; out[13] = a13; out[14] = a23;
      } else {
        out[0] = a[0]; out[1] = a[4]; out[2] = a[8]; out[3] = a[12];
        out[4] = a[1]; out[5] = a[5]; out[6] = a[9]; out[7] = a[13];
        out[8] = a[2]; out[9] = a[6]; out[10] = a[10]; out[11] = a[14];
        out[12] = a[3]; out[13] = a[7]; out[14] = a[11]; out[15] = a[15];
      }
      return out;
    }
  };

  /* ----------------------------------------------------------
   * WebGL Helpers
   * ---------------------------------------------------------- */
  function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('Error compiling shader:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  function createProgram(gl, vsSource, fsSource) {
    const vs = createShader(gl, gl.VERTEX_SHADER, vsSource);
    const fs = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
    if (!vs || !fs) return null;

    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Error linking program:', gl.getProgramInfoLog(program));
      gl.deleteProgram(program);
      return null;
    }
    return program;
  }

  /* ----------------------------------------------------------
   * GLSL Shaders
   * ---------------------------------------------------------- */
  
  // Basic shader (vertex color only)
  const basicVS = `
    attribute vec4 a_position;
    attribute vec4 a_color;
    uniform mat4 u_matrix;
    varying vec4 v_color;
    void main() {
      gl_Position = u_matrix * a_position;
      v_color = a_color;
    }
  `;
  const basicFS = `
    precision mediump float;
    varying vec4 v_color;
    void main() {
      gl_FragColor = v_color;
    }
  `;

  // Phong lighting shader
  const phongVS = `
    attribute vec4 a_position;
    attribute vec3 a_normal;
    uniform mat4 u_worldViewProjection;
    uniform mat4 u_world;
    uniform mat4 u_worldInverseTranspose;
    
    varying vec3 v_normal;
    varying vec3 v_surfaceToLight;
    varying vec3 v_surfaceToView;
    
    uniform vec3 u_lightWorldPosition;
    uniform vec3 u_viewWorldPosition;
    
    void main() {
      gl_Position = u_worldViewProjection * a_position;
      v_normal = mat3(u_worldInverseTranspose) * a_normal;
      vec3 surfaceWorldPosition = (u_world * a_position).xyz;
      v_surfaceToLight = u_lightWorldPosition - surfaceWorldPosition;
      v_surfaceToView = u_viewWorldPosition - surfaceWorldPosition;
    }
  `;
  const phongFS = `
    precision mediump float;
    varying vec3 v_normal;
    varying vec3 v_surfaceToLight;
    varying vec3 v_surfaceToView;
    
    uniform vec4 u_ambientColor;
    uniform vec4 u_diffuseColor;
    uniform vec4 u_specularColor;
    uniform float u_shininess;
    
    // Light settings
    uniform vec4 u_lightAmbient;
    uniform vec4 u_lightDiffuse;
    uniform vec4 u_lightSpecular;
    
    void main() {
      vec3 normal = normalize(v_normal);
      vec3 surfaceToLightDirection = normalize(v_surfaceToLight);
      vec3 surfaceToViewDirection = normalize(v_surfaceToView);
      vec3 halfVector = normalize(surfaceToLightDirection + surfaceToViewDirection);
      
      float light = max(dot(normal, surfaceToLightDirection), 0.0);
      float specular = 0.0;
      if (light > 0.0) {
        specular = pow(max(dot(normal, halfVector), 0.0), u_shininess);
      }
      
      vec4 ambient = u_lightAmbient * u_ambientColor;
      vec4 diffuse = u_lightDiffuse * u_diffuseColor * light;
      vec4 spec = u_lightSpecular * u_specularColor * specular;
      
      gl_FragColor = ambient + diffuse + spec;
      gl_FragColor.a = u_diffuseColor.a;
    }
  `;

  // Fog shader (basic geometry + fog calculation)
  const fogVS = `
    attribute vec4 a_position;
    attribute vec4 a_color;
    uniform mat4 u_worldViewProjection;
    uniform mat4 u_worldView;
    varying vec4 v_color;
    varying float v_distance;
    
    void main() {
      gl_Position = u_worldViewProjection * a_position;
      v_color = a_color;
      // Calculate distance for fog (distance from camera)
      v_distance = -(u_worldView * a_position).z;
    }
  `;
  const fogFS = `
    precision mediump float;
    varying vec4 v_color;
    varying float v_distance;
    
    uniform vec4 u_fogColor;
    uniform float u_fogDensity;
    uniform int u_fogMode; // 0=LINEAR, 1=EXP, 2=EXP2
    
    void main() {
      float fogAmount = 0.0;
      if (u_fogMode == 1) { // EXP
        fogAmount = 1.0 - exp(-u_fogDensity * v_distance);
      } else if (u_fogMode == 2) { // EXP2
        fogAmount = 1.0 - exp(-(u_fogDensity * v_distance * u_fogDensity * v_distance));
      } else { // LINEAR (fallback, simplistic)
        float fogNear = 1.0;
        float fogFar = 20.0;
        fogAmount = (v_distance - fogNear) / (fogFar - fogNear);
      }
      
      fogAmount = clamp(fogAmount, 0.0, 1.0);
      gl_FragColor = mix(v_color, u_fogColor, fogAmount);
    }
  `;

  function getShaders(type) {
    if (type === 'phong') return { vs: phongVS, fs: phongFS };
    if (type === 'fog') return { vs: fogVS, fs: fogFS };
    return { vs: basicVS, fs: basicFS };
  }

  /* ----------------------------------------------------------
   * Geometry Generators
   * ---------------------------------------------------------- */
  
  function parseColor(hex) {
    // hex to [r,g,b,a]
    hex = hex.replace('#', '');
    let r = parseInt(hex.substring(0, 2), 16) / 255;
    let g = parseInt(hex.substring(2, 4), 16) / 255;
    let b = parseInt(hex.substring(4, 6), 16) / 255;
    return [r, g, b, 1.0];
  }

  function createCubeGeometry(faceColorsHex) {
    const positions = [
      // Front face
      -1.0, -1.0,  1.0,   1.0, -1.0,  1.0,   1.0,  1.0,  1.0,  -1.0,  1.0,  1.0,
      // Back face
      -1.0, -1.0, -1.0,  -1.0,  1.0, -1.0,   1.0,  1.0, -1.0,   1.0, -1.0, -1.0,
      // Top face
      -1.0,  1.0, -1.0,  -1.0,  1.0,  1.0,   1.0,  1.0,  1.0,   1.0,  1.0, -1.0,
      // Bottom face
      -1.0, -1.0, -1.0,   1.0, -1.0, -1.0,   1.0, -1.0,  1.0,  -1.0, -1.0,  1.0,
      // Right face
       1.0, -1.0, -1.0,   1.0,  1.0, -1.0,   1.0,  1.0,  1.0,   1.0, -1.0,  1.0,
      // Left face
      -1.0, -1.0, -1.0,  -1.0, -1.0,  1.0,  -1.0,  1.0,  1.0,  -1.0,  1.0, -1.0,
    ];

    const normals = [
       0,0,1, 0,0,1, 0,0,1, 0,0,1,
       0,0,-1, 0,0,-1, 0,0,-1, 0,0,-1,
       0,1,0, 0,1,0, 0,1,0, 0,1,0,
       0,-1,0, 0,-1,0, 0,-1,0, 0,-1,0,
       1,0,0, 1,0,0, 1,0,0, 1,0,0,
      -1,0,0, -1,0,0, -1,0,0, -1,0,0,
    ];

    let colors = [];
    for (let j = 0; j < 6; ++j) {
      let c = faceColorsHex ? parseColor(faceColorsHex[j % faceColorsHex.length]) : [1,1,1,1];
      for (let i = 0; i < 4; ++i) {
        colors = colors.concat(c);
      }
    }

    const indices = [
      0,  1,  2,      0,  2,  3,    // front
      4,  5,  6,      4,  6,  7,    // back
      8,  9,  10,     8,  10, 11,   // top
      12, 13, 14,     12, 14, 15,   // bottom
      16, 17, 18,     16, 18, 19,   // right
      20, 21, 22,     20, 22, 23,   // left
    ];
    
    // Wireframe indices (lines connecting vertices)
    const lineIndices = [
      0,1, 1,2, 2,3, 3,0, // front
      4,5, 5,6, 6,7, 7,4, // back
      0,4, 1,7, 2,6, 3,5  // connections
    ];

    return { positions, colors, normals, indices, lineIndices };
  }

  function createSphereGeometry(radius, latitudeBands, longitudeBands) {
    let positions = [];
    let normals = [];
    let textureCoordData = [];
    for (let latNumber = 0; latNumber <= latitudeBands; latNumber++) {
      let theta = latNumber * Math.PI / latitudeBands;
      let sinTheta = Math.sin(theta);
      let cosTheta = Math.cos(theta);

      for (let longNumber = 0; longNumber <= longitudeBands; longNumber++) {
        let phi = longNumber * 2 * Math.PI / longitudeBands;
        let sinPhi = Math.sin(phi);
        let cosPhi = Math.cos(phi);

        let x = cosPhi * sinTheta;
        let y = cosTheta;
        let z = sinPhi * sinTheta;
        let u = 1 - (longNumber / longitudeBands);
        let v = 1 - (latNumber / latitudeBands);

        normals.push(x, y, z);
        textureCoordData.push(u, v);
        positions.push(radius * x, radius * y, radius * z);
      }
    }

    let indices = [];
    for (let latNumber = 0; latNumber < latitudeBands; latNumber++) {
      for (let longNumber = 0; longNumber < longitudeBands; longNumber++) {
        let first = (latNumber * (longitudeBands + 1)) + longNumber;
        let second = first + longitudeBands + 1;
        indices.push(first, second, first + 1);
        indices.push(second, second + 1, first + 1);
      }
    }

    return { positions, normals, indices, texcoords: textureCoordData };
  }

  // Generate buffer
  function createBuffer(gl, data, isElement = false) {
    const buffer = gl.createBuffer();
    const type = isElement ? gl.ELEMENT_ARRAY_BUFFER : gl.ARRAY_BUFFER;
    gl.bindBuffer(type, buffer);
    gl.bufferData(type, isElement ? new Uint16Array(data) : new Float32Array(data), gl.STATIC_DRAW);
    return buffer;
  }

  return {
    vec3,
    mat4,
    createProgram,
    getShaders,
    createCubeGeometry,
    createSphereGeometry,
    createBuffer,
    parseColor
  };

})();
