/* ============================================================
   Vision Studio — Advanced Graphics Module
   Playground: DOM Events, WebGL Canvas, Animation Loop
   ============================================================ */

const GfxPlayground = (() => {
  'use strict';

  // Constants
  const SCENE_2D = '2d';
  const SCENE_3D = '3d';
  const SCENE_LIGHTING = 'lighting';
  const SCENE_FOG = 'fog';

  // State
  let currentScene = SCENE_2D;
  let canvas, gl, ctx2d;
  let programInfo = {};
  let buffers = {};
  let animationId = null;
  let lastTime = 0;
  let angle = 0;
  let isAnimating = true;

  // Camera params
  let drag = false;
  let oldX = 0, oldY = 0;
  let dX = 0, dY = 0;

  // Form Controls State
  let params = {
    // Shared
    scene: SCENE_2D,
    animate: true,
    speed: 1.0,
    
    // Transform
    translateX: 0, translateY: 0, translateZ: 0,
    rotateX: 0, rotateY: 0, rotateZ: 0,
    animX: true, animY: true, animZ: false,
    scale: 1.0,
    
    // 2D Shapes
    color1: [1, 0, 0, 1], // Red
    color2: [0, 1, 0, 1], // Green
    color3: [0, 0, 1, 1], // Blue
    
    // 3D Shapes
    showFaces: true,
    showEdges: true,
    faceColors: [
      [1,0,0,1], [0,1,0,1], [0,0,1,1],
      [1,1,0,1], [1,0,1,1], [0,1,1,1]
    ],
    projection: 'perspective',
    fov: 45,
    cameraZ: 7,

    // Lighting
    lightEnabled: true,
    lightPos: [5, 5, 5],
    lightAmbient: [0.2, 0.2, 0.2, 1.0],
    lightDiffuse: [0.8, 0.8, 0.8, 1.0],
    lightSpecular: [1.0, 1.0, 1.0, 1.0],
    matAmbient: [0.7, 0.1, 0.1, 1.0],
    matDiffuse: [0.9, 0.2, 0.2, 1.0],
    matSpecular: [1.0, 1.0, 1.0, 1.0],
    matShininess: 50.0,

    // Fog
    fogEnabled: true,
    fogColor: [0.5, 0.5, 0.5, 1.0],
    fogDensity: 0.15,
    fogMode: 2, // 2 = EXP2
    fogCount: 15
  };

  // Fog cubes state (randomized)
  let fogCubes = [];

  function init() {
    canvas = document.getElementById('gfx-canvas');
    if (!canvas) return;
    
    // Handle resizing
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Initial setup of contexts
    setupContexts();

    // Bind UI
    bindEvents();
    
    // Initial Render
    changeScene(document.getElementById('gfx-scene-select').value);
  }

  function resizeCanvas() {
    const parent = canvas.parentElement;
    canvas.width = parent.clientWidth;
    canvas.height = parent.clientHeight;
    if (gl) gl.viewport(0, 0, canvas.width, canvas.height);
  }

  function setupContexts() {
    // Try WebGL
    gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    // Also get 2D context for 2D scene
    ctx2d = canvas.getContext('2d');
    
    if (!gl) {
      console.warn("WebGL not supported, falling back to 2D only where possible.");
    }
  }

  function initWebGLPrograms() {
    if (!gl) return;
    
    // Compile shaders
    const basicSrc = GfxProcessing.getShaders('basic');
    const phongSrc = GfxProcessing.getShaders('phong');
    const fogSrc = GfxProcessing.getShaders('fog');
    
    programInfo.basic = GfxProcessing.createProgram(gl, basicSrc.vs, basicSrc.fs);
    programInfo.phong = GfxProcessing.createProgram(gl, phongSrc.vs, phongSrc.fs);
    programInfo.fog = GfxProcessing.createProgram(gl, fogSrc.vs, fogSrc.fs);
  }

  function setupGeometry() {
    if (!gl) return;
    
    // 3D Cube
    const cubeData = GfxProcessing.createCubeGeometry(
      ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff']
    );
    buffers.cube = {
      position: GfxProcessing.createBuffer(gl, cubeData.positions),
      color: GfxProcessing.createBuffer(gl, cubeData.colors),
      normal: GfxProcessing.createBuffer(gl, cubeData.normals),
      indices: GfxProcessing.createBuffer(gl, cubeData.indices, true),
      lineIndices: GfxProcessing.createBuffer(gl, cubeData.lineIndices, true),
      vertexCount: cubeData.indices.length,
      lineCount: cubeData.lineIndices.length
    };

    // 3D Sphere for lighting
    const sphereData = GfxProcessing.createSphereGeometry(1.5, 32, 32);
    buffers.sphere = {
      position: GfxProcessing.createBuffer(gl, sphereData.positions),
      normal: GfxProcessing.createBuffer(gl, sphereData.normals),
      indices: GfxProcessing.createBuffer(gl, sphereData.indices, true),
      vertexCount: sphereData.indices.length
    };
    
    // Fog Cubes positions
    fogCubes = [];
    for(let i=0; i<30; i++) {
      fogCubes.push({
        x: (Math.random() - 0.5) * 8,
        y: (Math.random() - 0.5) * 6,
        z: -(Math.random() * 15 + 2)
      });
    }
  }

  function changeScene(scene) {
    currentScene = scene;
    params.scene = scene;
    
    // Reset rotations
    angle = 0;
    dX = 0; dY = 0;
    
    if (scene === SCENE_2D) {
      if (!ctx2d) {
        gl = null; // force 2D
        canvas.style.display = 'none'; // Recreate canvas to clear context type if needed
        const parent = canvas.parentElement;
        parent.removeChild(canvas);
        canvas = document.createElement('canvas');
        canvas.id = 'gfx-canvas';
        canvas.className = 'absolute inset-0 w-full h-full cursor-move';
        parent.appendChild(canvas);
        ctx2d = canvas.getContext('2d');
        resizeCanvas();
      }
    } else {
      if (!gl) {
        ctx2d = null; // force 3D
        canvas.style.display = 'none';
        const parent = canvas.parentElement;
        parent.removeChild(canvas);
        canvas = document.createElement('canvas');
        canvas.id = 'gfx-canvas';
        canvas.className = 'absolute inset-0 w-full h-full cursor-move';
        parent.appendChild(canvas);
        gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        resizeCanvas();
        initWebGLPrograms();
        setupGeometry();
      }
    }

    // Toggle control sections
    document.querySelectorAll('.gfx-controls-section').forEach(el => el.classList.add('hidden'));
    document.getElementById('gfx-controls-shared').classList.remove('hidden');
    
    if(scene === SCENE_2D) document.getElementById('gfx-controls-2d').classList.remove('hidden');
    if(scene === SCENE_3D) document.getElementById('gfx-controls-3d').classList.remove('hidden');
    if(scene === SCENE_LIGHTING) document.getElementById('gfx-controls-lighting').classList.remove('hidden');
    if(scene === SCENE_FOG) document.getElementById('gfx-controls-fog').classList.remove('hidden');

    bindMouseEvents();
    
    if (!animationId) {
      lastTime = performance.now();
      renderLoop();
    }
    
    updateCode();
  }

  function bindEvents() {
    // Scene Selector
    const sceneSelect = document.getElementById('gfx-scene-select');
    if(sceneSelect) {
      sceneSelect.addEventListener('change', (e) => {
        changeScene(e.target.value);
      });
    }

    // Bind inputs to params automatically by id
    const bindInput = (id, paramKey, parser, isColor = false) => {
      const el = document.getElementById(id);
      if(!el) return;
      el.addEventListener('input', (e) => {
        if(isColor) {
           params[paramKey] = GfxProcessing.parseColor(e.target.value);
        } else {
           params[paramKey] = parser(e.target.value);
        }
        
        // Update display value if exists
        const valEl = document.getElementById(id + '-val');
        if(valEl && !isColor) {
           valEl.textContent = el.type === 'range' ? parseFloat(e.target.value).toFixed(1) : e.target.value;
        }
        
        updateCode();
      });
    };

    // Bind checkboxes to params
    const bindCheck = (id, paramKey) => {
      const el = document.getElementById(id);
      if(!el) return;
      el.addEventListener('change', (e) => {
        params[paramKey] = e.target.checked;
        updateCode();
      });
    };

    // Shared
    bindInput('gfx-speed', 'speed', parseFloat);
    bindCheck('gfx-anim-x', 'animX');
    bindCheck('gfx-anim-y', 'animY');
    bindCheck('gfx-anim-z', 'animZ');
    
    bindInput('gfx-trans-x', 'translateX', parseFloat);
    bindInput('gfx-trans-y', 'translateY', parseFloat);
    bindInput('gfx-trans-z', 'translateZ', parseFloat);
    
    bindInput('gfx-scale', 'scale', parseFloat);
    
    bindInput('gfx-rot-x', 'rotateX', parseFloat);
    bindInput('gfx-rot-y', 'rotateY', parseFloat);
    bindInput('gfx-rot-z', 'rotateZ', parseFloat);

    // 2D
    bindInput('gfx-color1', 'color1', null, true);
    bindInput('gfx-color2', 'color2', null, true);
    bindInput('gfx-color3', 'color3', null, true);

    // 3D
    bindCheck('gfx-show-faces', 'showFaces');
    bindCheck('gfx-show-edges', 'showEdges');
    bindInput('gfx-proj-type', 'projection', String);
    bindInput('gfx-fov', 'fov', parseFloat);
    bindInput('gfx-cam-z', 'cameraZ', parseFloat);

    // Lighting
    bindCheck('gfx-light-enabled', 'lightEnabled');
    bindInput('gfx-light-x', 'lightPos', (v) => [parseFloat(v), params.lightPos[1], params.lightPos[2]]);
    bindInput('gfx-light-y', 'lightPos', (v) => [params.lightPos[0], parseFloat(v), params.lightPos[2]]);
    bindInput('gfx-light-z', 'lightPos', (v) => [params.lightPos[0], params.lightPos[1], parseFloat(v)]);
    bindInput('gfx-shininess', 'matShininess', parseFloat);
    
    // Complex color bindings for Lighting (sliders for intensity + color pickers)
    const bindLightComponent = (baseId, paramKey) => {
      const intensityEl = document.getElementById(baseId + '-intensity');
      const colorEl = document.getElementById(baseId + '-color');
      if(!intensityEl || !colorEl) return;
      
      const updateParam = () => {
        let i = parseFloat(intensityEl.value);
        let c = GfxProcessing.parseColor(colorEl.value);
        params[paramKey] = [c[0]*i, c[1]*i, c[2]*i, 1.0];
        document.getElementById(baseId + '-intensity-val').textContent = i.toFixed(2);
        updateCode();
      };
      
      intensityEl.addEventListener('input', updateParam);
      colorEl.addEventListener('input', updateParam);
    };

    bindLightComponent('gfx-light-amb', 'lightAmbient');
    bindLightComponent('gfx-light-diff', 'lightDiffuse');
    bindLightComponent('gfx-light-spec', 'lightSpecular');
    
    bindInput('gfx-mat-amb', 'matAmbient', null, true);
    bindInput('gfx-mat-diff', 'matDiffuse', null, true);
    bindInput('gfx-mat-spec', 'matSpecular', null, true);

    // Fog
    bindCheck('gfx-fog-enabled', 'fogEnabled');
    bindInput('gfx-fog-color', 'fogColor', null, true);
    bindInput('gfx-fog-density', 'fogDensity', parseFloat);
    bindInput('gfx-fog-mode', 'fogMode', parseInt);
    bindInput('gfx-fog-count', 'fogCount', parseInt);

    // Animation Toggle
    const animToggle = document.getElementById('gfx-anim-toggle');
    if(animToggle) {
      animToggle.addEventListener('click', () => {
        params.animate = !params.animate;
        isAnimating = params.animate;
        animToggle.innerHTML = isAnimating 
          ? `<span class="material-symbols-rounded">pause</span> إيقاف الحركة`
          : `<span class="material-symbols-rounded">play_arrow</span> تشغيل الحركة`;
        if(isAnimating) {
          lastTime = performance.now();
        }
        updateCode();
      });
    }

    // Reset btn
    const resetBtn = document.getElementById('gfx-reset-btn');
    if(resetBtn) {
      resetBtn.addEventListener('click', () => {
        angle = 0; dX = 0; dY = 0;
        document.getElementById('gfx-trans-x').value = 0;
        document.getElementById('gfx-trans-y').value = 0;
        document.getElementById('gfx-trans-z').value = 0;
        document.getElementById('gfx-scale').value = 1;
        document.getElementById('gfx-rot-x').value = 0;
        document.getElementById('gfx-rot-y').value = 0;
        document.getElementById('gfx-rot-z').value = 0;
        
        ['gfx-trans-x','gfx-trans-y','gfx-trans-z','gfx-scale','gfx-rot-x','gfx-rot-y','gfx-rot-z'].forEach(id => {
          document.getElementById(id).dispatchEvent(new Event('input'));
        });
      });
    }

    // Copy Code
    const copyBtn = document.getElementById('gfx-copy-code');
    if(copyBtn) {
      copyBtn.addEventListener('click', copyCode);
    }
  }

  function bindMouseEvents() {
    canvas.onmousedown = function(e) {
      drag = true;
      oldX = e.pageX; oldY = e.pageY;
      e.preventDefault();
    };
    canvas.onmouseup = function(e) { drag = false; };
    canvas.onmouseleave = function(e) { drag = false; };
    canvas.onmousemove = function(e) {
      if (!drag) return;
      dX += (e.pageX - oldX) * 0.5; // sensitivity
      dY += (e.pageY - oldY) * 0.5;
      oldX = e.pageX; oldY = e.pageY;
      e.preventDefault();
    };
    
    // Touch support
    canvas.ontouchstart = function(e) {
      drag = true;
      oldX = e.touches[0].pageX; oldY = e.touches[0].pageY;
      e.preventDefault();
    };
    canvas.ontouchend = function(e) { drag = false; };
    canvas.ontouchmove = function(e) {
      if (!drag) return;
      dX += (e.touches[0].pageX - oldX) * 0.5;
      dY += (e.touches[0].pageY - oldY) * 0.5;
      oldX = e.touches[0].pageX; oldY = e.touches[0].pageY;
      e.preventDefault();
    };
  }

  /* ----------------------------------------------------------
   * Rendering
   * ---------------------------------------------------------- */
  
  function renderLoop(time) {
    if (!time) time = performance.now();
    let deltaTime = (time - lastTime) / 1000.0;
    lastTime = time;

    if (isAnimating) {
      angle += params.speed * 30 * deltaTime; // degrees per second
    }

    if (currentScene === SCENE_2D) {
      render2D();
    } else if (gl) {
      render3D();
    }

    animationId = requestAnimationFrame(renderLoop);
  }

  function render2D() {
    if(!ctx2d) return;
    const w = canvas.width;
    const h = canvas.height;
    
    ctx2d.clearRect(0, 0, w, h);
    ctx2d.fillStyle = '#f1f5f9';
    ctx2d.fillRect(0, 0, w, h);
    
    ctx2d.save();
    
    // Coordinate system: center is 0,0, Y is up
    ctx2d.translate(w/2, h/2);
    // Grid scale: 1 unit = 100px
    const unit = 100;
    
    // Apply transforms
    ctx2d.translate(params.translateX * unit, -params.translateY * unit);
    ctx2d.scale(params.scale, params.scale);
    
    // Rotation
    let rot = params.animate ? angle : params.rotateZ;
    // Mouse drag adds to rotation in 2D
    rot += dX; 
    ctx2d.rotate(rot * Math.PI / 180);
    
    // Draw Triangle
    const pts = [
      {x: -1, y: 1}, // canvas y is down, so -1 in math is 1 in canvas
      {x: 1, y: 1},
      {x: 0, y: -1}
    ];
    
    // Draw gradient triangle
    ctx2d.beginPath();
    ctx2d.moveTo(pts[0].x * unit, pts[0].y * unit);
    ctx2d.lineTo(pts[1].x * unit, pts[1].y * unit);
    ctx2d.lineTo(pts[2].x * unit, pts[2].y * unit);
    ctx2d.closePath();
    
    // Create gradient based on colors
    const grad = ctx2d.createLinearGradient(-unit, unit, 0, -unit);
    const toRGB = (c) => `rgb(${Math.round(c[0]*255)}, ${Math.round(c[1]*255)}, ${Math.round(c[2]*255)})`;
    grad.addColorStop(0, toRGB(params.color1));
    grad.addColorStop(0.5, toRGB(params.color2));
    grad.addColorStop(1, toRGB(params.color3));
    
    ctx2d.fillStyle = grad;
    ctx2d.fill();
    ctx2d.lineWidth = 4;
    ctx2d.strokeStyle = '#333';
    ctx2d.stroke();
    
    ctx2d.restore();
  }

  function render3D() {
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    
    if (currentScene === SCENE_FOG && params.fogEnabled) {
      gl.clearColor(params.fogColor[0], params.fogColor[1], params.fogColor[2], 1.0);
    } else if (currentScene === SCENE_LIGHTING) {
      gl.clearColor(0.1, 0.1, 0.15, 1.0);
    } else {
      gl.clearColor(0.945, 0.961, 0.976, 1.0); // slate-50
    }
    
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const aspect = canvas.width / canvas.height;
    const projectionMatrix = GfxProcessing.mat4.create();
    
    if (params.projection === 'perspective') {
      GfxProcessing.mat4.perspective(projectionMatrix, params.fov * Math.PI / 180, aspect, 0.1, 100.0);
    } else {
      GfxProcessing.mat4.ortho(projectionMatrix, -4*aspect, 4*aspect, -4, 4, 0.1, 100.0);
    }

    const viewMatrix = GfxProcessing.mat4.create();
    GfxProcessing.mat4.translate(viewMatrix, viewMatrix, [0, 0, -params.cameraZ]);
    
    // Apply mouse drag to view
    GfxProcessing.mat4.rotate(viewMatrix, viewMatrix, dY * Math.PI / 180, [1, 0, 0]);
    GfxProcessing.mat4.rotate(viewMatrix, viewMatrix, dX * Math.PI / 180, [0, 1, 0]);

    if (currentScene === SCENE_3D) {
      draw3DScene(projectionMatrix, viewMatrix);
    } else if (currentScene === SCENE_LIGHTING) {
      drawLightingScene(projectionMatrix, viewMatrix);
    } else if (currentScene === SCENE_FOG) {
      drawFogScene(projectionMatrix, viewMatrix);
    }
  }

  function draw3DScene(projMatrix, viewMatrix) {
    const program = programInfo.basic;
    gl.useProgram(program);
    
    const worldMatrix = GfxProcessing.mat4.create();
    GfxProcessing.mat4.translate(worldMatrix, worldMatrix, [params.translateX, params.translateY, params.translateZ]);
    
    let rX = params.animate ? (params.animX ? angle : 0) : params.rotateX;
    let rY = params.animate ? (params.animY ? angle : 0) : params.rotateY;
    let rZ = params.animate ? (params.animZ ? angle : 0) : params.rotateZ;
    
    GfxProcessing.mat4.rotate(worldMatrix, worldMatrix, rX * Math.PI / 180, [1, 0, 0]);
    GfxProcessing.mat4.rotate(worldMatrix, worldMatrix, rY * Math.PI / 180, [0, 1, 0]);
    GfxProcessing.mat4.rotate(worldMatrix, worldMatrix, rZ * Math.PI / 180, [0, 0, 1]);
    
    GfxProcessing.mat4.scale(worldMatrix, worldMatrix, [params.scale, params.scale, params.scale]);

    const matrix = GfxProcessing.mat4.create();
    GfxProcessing.mat4.multiply(matrix, viewMatrix, worldMatrix);
    GfxProcessing.mat4.multiply(matrix, projMatrix, matrix);

    const uMatrix = gl.getUniformLocation(program, 'u_matrix');
    gl.uniformMatrix4fv(uMatrix, false, matrix);

    const aPosition = gl.getAttribLocation(program, 'a_position');
    const aColor = gl.getAttribLocation(program, 'a_color');

    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.cube.position);
    gl.vertexAttribPointer(aPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(aPosition);

    if (params.showFaces) {
      // Faces with varying colors (requires dynamically updating colors if changed, but we simplified)
      gl.bindBuffer(gl.ARRAY_BUFFER, buffers.cube.color);
      gl.vertexAttribPointer(aColor, 4, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(aColor);

      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.cube.indices);
      gl.drawElements(gl.TRIANGLES, buffers.cube.vertexCount, gl.UNSIGNED_SHORT, 0);
    }

    if (params.showEdges) {
      // Wireframe in black
      // Create a temporary black color buffer for lines
      const blackColors = new Float32Array(24 * 4);
      for(let i=0; i<blackColors.length; i+=4) {
        blackColors[i]=0; blackColors[i+1]=0; blackColors[i+2]=0; blackColors[i+3]=1;
      }
      const blackBuf = GfxProcessing.createBuffer(gl, blackColors);
      gl.bindBuffer(gl.ARRAY_BUFFER, blackBuf);
      gl.vertexAttribPointer(aColor, 4, gl.FLOAT, false, 0, 0);
      
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.cube.lineIndices);
      gl.lineWidth(2.0); // WebGL line width might be limited
      gl.drawElements(gl.LINES, buffers.cube.lineCount, gl.UNSIGNED_SHORT, 0);
      gl.deleteBuffer(blackBuf);
    }
  }

  function drawLightingScene(projMatrix, viewMatrix) {
    const program = programInfo.phong;
    gl.useProgram(program);

    const worldMatrix = GfxProcessing.mat4.create();
    // Sphere rotation
    let rX = params.animate ? (params.animX ? angle : 0) : params.rotateX;
    let rY = params.animate ? (params.animY ? angle : 0) : params.rotateY;
    GfxProcessing.mat4.rotate(worldMatrix, worldMatrix, rX * Math.PI / 180, [1, 0, 0]);
    GfxProcessing.mat4.rotate(worldMatrix, worldMatrix, rY * Math.PI / 180, [0, 1, 0]);
    
    // Matrices
    const worldViewProj = GfxProcessing.mat4.create();
    const temp = GfxProcessing.mat4.create();
    GfxProcessing.mat4.multiply(temp, viewMatrix, worldMatrix);
    GfxProcessing.mat4.multiply(worldViewProj, projMatrix, temp);
    
    const worldInverseTranspose = GfxProcessing.mat4.create();
    GfxProcessing.mat4.invert(worldInverseTranspose, worldMatrix);
    GfxProcessing.mat4.transpose(worldInverseTranspose, worldInverseTranspose);

    // Uniforms setup
    const uWVP = gl.getUniformLocation(program, 'u_worldViewProjection');
    const uWorld = gl.getUniformLocation(program, 'u_world');
    const uWorldInvTrans = gl.getUniformLocation(program, 'u_worldInverseTranspose');
    
    gl.uniformMatrix4fv(uWVP, false, worldViewProj);
    gl.uniformMatrix4fv(uWorld, false, worldMatrix);
    gl.uniformMatrix4fv(uWorldInvTrans, false, worldInverseTranspose);

    // Lighting 
    gl.uniform3fv(gl.getUniformLocation(program, 'u_lightWorldPosition'), params.lightPos);
    // Camera is at origin in view space, but we need world position of camera
    gl.uniform3fv(gl.getUniformLocation(program, 'u_viewWorldPosition'), [0,0,params.cameraZ]);
    
    // Material 
    gl.uniform4fv(gl.getUniformLocation(program, 'u_ambientColor'), params.matAmbient);
    gl.uniform4fv(gl.getUniformLocation(program, 'u_diffuseColor'), params.matDiffuse);
    gl.uniform4fv(gl.getUniformLocation(program, 'u_specularColor'), params.matSpecular);
    gl.uniform1f(gl.getUniformLocation(program, 'u_shininess'), params.matShininess);
    
    // Light intensities
    if (params.lightEnabled) {
      gl.uniform4fv(gl.getUniformLocation(program, 'u_lightAmbient'), params.lightAmbient);
      gl.uniform4fv(gl.getUniformLocation(program, 'u_lightDiffuse'), params.lightDiffuse);
      gl.uniform4fv(gl.getUniformLocation(program, 'u_lightSpecular'), params.lightSpecular);
    } else {
      gl.uniform4fv(gl.getUniformLocation(program, 'u_lightAmbient'), [0,0,0,1]);
      gl.uniform4fv(gl.getUniformLocation(program, 'u_lightDiffuse'), [0,0,0,1]);
      gl.uniform4fv(gl.getUniformLocation(program, 'u_lightSpecular'), [0,0,0,1]);
    }

    // Attributes
    const aPosition = gl.getAttribLocation(program, 'a_position');
    const aNormal = gl.getAttribLocation(program, 'a_normal');

    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.sphere.position);
    gl.vertexAttribPointer(aPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(aPosition);

    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.sphere.normal);
    gl.vertexAttribPointer(aNormal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(aNormal);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.sphere.indices);
    gl.drawElements(gl.TRIANGLES, buffers.sphere.vertexCount, gl.UNSIGNED_SHORT, 0);
    
    // Optional: Draw light source as a small point
    if(params.lightEnabled) {
       // Draw a small dot to represent light position (skipped for simplicity, or we can use basic shader)
    }
  }

  function drawFogScene(projMatrix, viewMatrix) {
    const program = programInfo.fog;
    gl.useProgram(program);

    gl.uniform4fv(gl.getUniformLocation(program, 'u_fogColor'), params.fogEnabled ? params.fogColor : [0,0,0,1]);
    gl.uniform1f(gl.getUniformLocation(program, 'u_fogDensity'), params.fogEnabled ? params.fogDensity : 0.0);
    gl.uniform1i(gl.getUniformLocation(program, 'u_fogMode'), params.fogMode);

    const aPosition = gl.getAttribLocation(program, 'a_position');
    const aColor = gl.getAttribLocation(program, 'a_color');

    // Blue color for cubes
    const blueColors = new Float32Array(24 * 4);
    for(let i=0; i<blueColors.length; i+=4) {
      blueColors[i]=0.2; blueColors[i+1]=0.6; blueColors[i+2]=1.0; blueColors[i+3]=1;
    }
    const colorBuf = GfxProcessing.createBuffer(gl, blueColors);

    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.cube.position);
    gl.vertexAttribPointer(aPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(aPosition);

    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuf);
    gl.vertexAttribPointer(aColor, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(aColor);
    
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.cube.indices);

    let count = Math.min(params.fogCount, fogCubes.length);
    for(let i=0; i<count; i++) {
      let cube = fogCubes[i];
      
      const worldMatrix = GfxProcessing.mat4.create();
      GfxProcessing.mat4.translate(worldMatrix, worldMatrix, [cube.x, cube.y, cube.z]);
      if(params.animate) {
         GfxProcessing.mat4.rotate(worldMatrix, worldMatrix, angle * 1.5 * Math.PI/180, [1, 1, 0]);
      }
      
      const wv = GfxProcessing.mat4.create();
      GfxProcessing.mat4.multiply(wv, viewMatrix, worldMatrix);
      
      const wvp = GfxProcessing.mat4.create();
      GfxProcessing.mat4.multiply(wvp, projMatrix, wv);
      
      gl.uniformMatrix4fv(gl.getUniformLocation(program, 'u_worldView'), false, wv);
      gl.uniformMatrix4fv(gl.getUniformLocation(program, 'u_worldViewProjection'), false, wvp);
      
      gl.drawElements(gl.TRIANGLES, buffers.cube.vertexCount, gl.UNSIGNED_SHORT, 0);
      
      if(params.animate) {
        cube.z += params.speed * 0.1;
        if(cube.z > 2.0) {
          cube.z = -(Math.random() * 5 + 15);
        }
      }
    }
    
    gl.deleteBuffer(colorBuf);
  }

  function updateCode() {
    if(typeof GfxCodegen !== 'undefined') {
      const codeBlock = document.getElementById('gfx-code');
      if(codeBlock) {
        codeBlock.textContent = GfxCodegen.generateCode(currentScene, params);
        // Highlight syntax if hljs is available
        if(window.hljs) {
          hljs.highlightElement(codeBlock);
        }
      }
    }
  }

  function copyCode() {
    const codeBlock = document.getElementById('gfx-code');
    if (codeBlock) {
      navigator.clipboard.writeText(codeBlock.textContent).then(() => {
        const btn = document.getElementById('gfx-copy-code');
        const originalText = btn.innerHTML;
        btn.innerHTML = `<span class="material-symbols-rounded text-base">check</span> تم النسخ`;
        btn.classList.add('text-teal-400');
        setTimeout(() => {
          btn.innerHTML = originalText;
          btn.classList.remove('text-teal-400');
        }, 2000);
      });
    }
  }

  return {
    init,
    changeScene
  };

})();
