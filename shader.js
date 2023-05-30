const canvas = document.getElementById('canvas');
const gl = canvas.getContext('webgl');

// Vertex shader
const vertexShaderSource = `
attribute vec2 position;
attribute vec3 color;
attribute vec2 velocity;

uniform float deltaTime;
uniform vec2 gravity;

varying vec3 vColor;

void main() {
  vec2 newPosition = position + velocity * deltaTime + 0.5 * gravity * deltaTime * deltaTime;
  gl_Position = vec4(newPosition, 0.0, 1.0);
  gl_PointSize = 2.0; // Set the size of the rendered point
  vColor = color;
}
`;

// Fragment shader
const fragmentShaderSource = `
precision mediump float;

varying vec3 vColor;

void main() {
  gl_FragColor = vec4(vColor, 0.6);
}
`;

// Create shaders
const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

// Create shader program
const program = createProgram(gl, vertexShader, fragmentShader);
gl.useProgram(program);

// Get attribute and uniform locations
const positionAttributeLocation = gl.getAttribLocation(program, 'position');
const colorAttributeLocation = gl.getAttribLocation(program, 'color');
const velocityAttributeLocation = gl.getAttribLocation(program, 'velocity');
const deltaTimeUniformLocation = gl.getUniformLocation(program, 'deltaTime');
const gravityUniformLocation = gl.getUniformLocation(program, 'gravity');
gl.enableVertexAttribArray(positionAttributeLocation);
gl.enableVertexAttribArray(colorAttributeLocation);
gl.enableVertexAttribArray(velocityAttributeLocation);

// Create particle data
const particleCount = 1000;
const particles = [];

for (let i = 0; i < particleCount; i++) {
  const position = [Math.random() * 2 - 1, Math.random() * 2 - 1];
  const color = i < particleCount / 2 ? [1, 0, 0] : [0, 0, 1];
  const velocity = [Math.random() * 0.01 - 0.005, Math.random() * 0.01 - 0.005];
  particles.push({
    position,
    color,
    velocity,
  });
}

// Create buffers
const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(particles.flatMap(p => p.position)), gl.DYNAMIC_DRAW);
gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

const colorBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(particles.flatMap(p => p.color)), gl.DYNAMIC_DRAW);
gl.vertexAttribPointer(colorAttributeLocation, 3, gl.FLOAT, false, 0, 0);

const velocityBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, velocityBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(particles.flatMap(p => p.velocity)), gl.DYNAMIC_DRAW);
gl.vertexAttribPointer(velocityAttributeLocation, 2, gl.FLOAT, false, 0, 0);

// Simulation parameters
const gravity = [0, -0.0005];

// Rendering variables
let animationRequestId;
let previousTime = performance.now();

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  gl.viewport(0, 0, canvas.width, canvas.height);
}

function render(currentTime) {
  gl.clearColor(0, 0, 0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);

  const deltaTime = (currentTime - previousTime) / 1000;
  previousTime = currentTime;

  // Update particle positions based on physics simulation
  particles.forEach(particle => {
    particle.velocity[0] += gravity[0] * deltaTime;
    particle.velocity[1] += gravity[1] * deltaTime;
    particle.position[0] += particle.velocity[0] * deltaTime;
    particle.position[1] += particle.velocity[1] * deltaTime;

    // Apply boundary conditions (wrap around)
    particle.position[0] = (particle.position[0] + 1) % 2 - 1;
    particle.position[1] = (particle.position[1] + 1) % 2 - 1;
  });

  // Update buffers with new particle data
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferSubData(gl.ARRAY_BUFFER, 0, new Float32Array(particles.flatMap(p => p.position)));

  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  gl.bufferSubData(gl.ARRAY_BUFFER, 0, new Float32Array(particles.flatMap(p => p.color)));

  gl.bindBuffer(gl.ARRAY_BUFFER, velocityBuffer);
  gl.bufferSubData(gl.ARRAY_BUFFER, 0, new Float32Array(particles.flatMap(p => p.velocity)));

  // Set uniform values
  gl.uniform1f(deltaTimeUniformLocation, deltaTime);
  gl.uniform2fv(gravityUniformLocation, gravity);

  // Render particles
  gl.drawArrays(gl.POINTS, 0, particleCount);

  animationRequestId = requestAnimationFrame(render);
}

// Start the animation
function startAnimation() {
  stopAnimation();
  render(performance.now());
}

// Stop the animation
function stopAnimation() {
  cancelAnimationFrame(animationRequestId);
}

// Resize the canvas when the window is resized
window.addEventListener('resize', resizeCanvas);

// Initial call to resize the canvas
resizeCanvas();

// Start the animation
startAnimation();



// Utility functions to create shaders and program
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

function createProgram(gl, vertexShader, fragmentShader) {
  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Error linking program:', gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }

  return program;
}


// Utility functions to create shaders and program
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

function createProgram(gl, vertexShader, fragmentShader) {
  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Error linking program:', gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }

  return program;
}
