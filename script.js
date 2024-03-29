const track = document.querySelector(".track");
const trackRect = track.getBoundingClientRect();
const trackWidth = trackRect.width;
const trackHeight = trackRect.height;

let car = document.querySelector(".car");
let velocity = { x: 0, y: 0 };
let angle = 0;
const maxSpeed = 5;
const accelerationRate = 0.2;
const decelerationRate = 0.1;
const rotationRate = 4;
const sideFriction = 0.05;
const forwardAccelerationRate = 0.2;
const sideAccelerationRate = 0.1;

let keysPressed = {};


document.addEventListener("keydown", (event) => {
  keysPressed[event.key.toLowerCase()] = true;
});

document.addEventListener("keyup", (event) => {
  delete keysPressed[event.key.toLowerCase()];
});


function moveCar() {
  const radians = (angle * Math.PI) / 180;

  if (keysPressed["w"]) {
    accelerate(radians);
  } else if (keysPressed["s"]) {
    reverse(radians);
  } else {
    decelerate();
  }

  if (keysPressed["a"]) {
    turnLeft();
  } else if (keysPressed["d"]) {
    turnRight();
  }

  applyFriction();

  const left = parseInt(car.style.left) || 0;
  const top = parseInt(car.style.top) || 0;

  const newLeft = left + velocity.x;
  const newTop = top + velocity.y;

  if (newLeft >= 0 && newLeft <= trackWidth) {
    car.style.left = newLeft + "px";
  }

  if (newTop >= 0 && newTop <= trackHeight) {
    car.style.top = newTop + "px";
  }

  car.style.transform = `rotate(${angle}deg)`;

  requestAnimationFrame(moveCar);
}

function accelerate(radians) {
  const forwardAcceleration = Math.cos(radians) * accelerationRate;
  const sideAcceleration = Math.sin(radians) * accelerationRate;
  velocity.x += sideAcceleration;
  velocity.y -= forwardAcceleration;

  const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
  const maxSpeed = car.drifting ? 2 * Math.abs(sideAcceleration) : car.maxSpeed;
  if (speed > maxSpeed) {
    const ratio = maxSpeed / speed;
    velocity.x *= ratio;
    velocity.y *= ratio;
  }
}

function reverse(radians) {
  const forwardAcceleration = Math.cos(radians) * accelerationRate;
  const sideAcceleration = Math.sin(radians) * accelerationRate;
  velocity.x -= sideAcceleration;
  velocity.y += forwardAcceleration;

  const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
  const maxSpeed = car.drifting ? 2 * Math.abs(sideAcceleration) : car.maxSpeed;
  if (speed > maxSpeed) {
    const ratio = maxSpeed / speed;
    velocity.x *= ratio;
    velocity.y *= ratio;
  }
}



function decelerate() {
  const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
  if (speed > 0.1) {
    const ratio = (speed - decelerationRate) / speed;
    velocity.x *= ratio;
    velocity.y *= ratio;
  } else {
    velocity.x = 0;
    velocity.y = 0;
  }
}

function turnLeft() {
  if (keysPressed["Shift"]) {
    car.drifting = true;
    angle -= rotationRate * 1.5;
  } else {
    car.drifting = false;
    angle -= rotationRate;
  }
}

function turnRight() {
  if (keysPressed["Shift"]) {
    car.drifting = true;
    angle += rotationRate * 1.5;
  } else {
    car.drifting = false;
    angle += rotationRate;
  }
}

function applyFriction() {
  const sideVelocity = velocity.x;
  const friction = car.drifting ? sideFriction * 2 : sideFriction;
  velocity.x -= sideVelocity * friction;

  const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
  if (speed < 0.1) {
    velocity.x = 0;
    velocity.y = 0;
  }
}

requestAnimationFrame(moveCar);



