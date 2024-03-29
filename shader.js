const canvas = document.getElementById('canvas1');
const gl = canvas.getContext('webgl');

// Vertex shader
const vertexShaderSource = `
attribute vec2 position;
attribute vec3 color;
attribute vec2 velocity;
attribute float life;

uniform float deltaTime;
uniform vec2 gravity;
uniform float maxLife;

varying vec3 vColor;
varying float vAlpha; // Added varying variable for alpha value

void main() {
  vec2 newPosition = position + velocity * deltaTime + 0.5 * gravity * deltaTime * deltaTime;
  vec2 clampedPosition = vec2(clamp(newPosition.x, -1.0, 1.0), clamp(newPosition.y, -1.0, 1.0));
  vec2 velocityReflection = vec2(sign(newPosition.x - clampedPosition.x), sign(newPosition.y - clampedPosition.y)) * abs(velocity);
  vec2 velocityDamping = vec2(0.98, 0.98); // Damping factor to reduce velocity over time
  vec2 newVelocity = velocityReflection * velocityDamping;
  float newLife = life + deltaTime;

  if (newLife >= maxLife) {
    newLife = 0.0;
    newVelocity = vec2(0.0, 0.0); // Stop the particle at the explosion center
  }

  gl_Position = vec4(clampedPosition, 0.0, 1.0);
  gl_PointSize = 2.0;

  // Apply alpha based on particle life
  vAlpha = 1.0 - (newLife / maxLife);

  vColor = color;
}
`;

// Fragment shader
const fragmentShaderSource = `
precision mediump float;

varying vec3 vColor;
varying float vAlpha;

void main() {
  // Apply alpha to fragment color
  gl_FragColor = vec4(vColor, vAlpha);
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
const lifeAttributeLocation = gl.getAttribLocation(program, 'life');
const deltaTimeUniformLocation = gl.getUniformLocation(program, 'deltaTime');
const gravityUniformLocation = gl.getUniformLocation(program, 'gravity');
const maxLifeUniformLocation = gl.getUniformLocation(program, 'maxLife');
gl.enableVertexAttribArray(positionAttributeLocation);
gl.enableVertexAttribArray(colorAttributeLocation);
gl.enableVertexAttribArray(velocityAttributeLocation);
gl.enableVertexAttribArray(lifeAttributeLocation);

// Create particle data
const particleCount = 10000;
const particles = [];

for (let i = 0; i < particleCount; i++) {
  const position = [Math.random() * 2 - 1, Math.random() * 2 - 1];
  const color = i < particleCount / 2 ? [1, 0, 0] : [0, 0, 1];
  const velocity = [Math.random() * 0.01 - 0.005, Math.random() * 0.01 - 0.005];
  const life = 0.0;
  particles.push({
    position,
    color,
    velocity,
    life,
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

const lifeBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, lifeBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(particles.flatMap(p => p.life)), gl.DYNAMIC_DRAW);
gl.vertexAttribPointer(lifeAttributeLocation, 1, gl.FLOAT, false, 0, 0);

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
    particle.life += deltaTime;

    // Apply boundary conditions (bounce on edges)
    if (particle.position[0] < -1 || particle.position[0] > 1) {
      particle.velocity[0] *= -1;
    }
    if (particle.position[1] < -1 || particle.position[1] > 1) {
      particle.velocity[1] *= -1;
    }
  });

  // Update buffers with new particle data
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferSubData(gl.ARRAY_BUFFER, 0, new Float32Array(particles.flatMap(p => p.position)));

  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  gl.bufferSubData(gl.ARRAY_BUFFER, 0, new Float32Array(particles.flatMap(p => p.color)));

  gl.bindBuffer(gl.ARRAY_BUFFER, velocityBuffer);
  gl.bufferSubData(gl.ARRAY_BUFFER, 0, new Float32Array(particles.flatMap(p => p.velocity)));

  gl.bindBuffer(gl.ARRAY_BUFFER, lifeBuffer);
  gl.bufferSubData(gl.ARRAY_BUFFER, 0, new Float32Array(particles.flatMap(p => p.life)));

  // Set uniform values
  gl.uniform1f(deltaTimeUniformLocation, deltaTime);
  gl.uniform2fv(gravityUniformLocation, gravity);
  gl.uniform1f(maxLifeUniformLocation, 3.0); // Max life span of particles before reset

  // Render particles
  gl.drawArrays(gl.POINTS, 0, particleCount);

  animationRequestId = requestAnimationFrame(render);
}

function triggerExplosion() {
  particles.forEach(particle => {
    particle.position = [0, 0];

    // Generate random angle and speed for particle
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 0.04 + 0.01; // Adjust the speed range here

    // Calculate velocity based on angle and speed
    const velocity = [Math.cos(angle) * speed, Math.sin(angle) * speed];

    particle.velocity = velocity;
    particle.life = 0.0;
  });
}

function handleMouseClick(event) {
  const rect = canvas.getBoundingClientRect();
  const clickX = event.clientX - rect.left;
  const clickY = canvas.height - (event.clientY - rect.top);

  // Check if the click is within the canvas boundaries
  if (clickX >= 0 && clickX <= canvas.width && clickY >= 0 && clickY <= canvas.height) {
    triggerExplosion();
  }
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

canvas.addEventListener('click', handleMouseClick);

// Initial call to resize the canvas
resizeCanvas();

// Start the animation
startAnimation();
