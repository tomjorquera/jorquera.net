var NB_BOIDS = 50;
var BOID_FOV = 50;
var BOID_SPEED = 2;
var BOID_INERTIA = 0.8;

var BOID_FLEE = 250;
var BOID_FLEE_RATIO = 0.66;

var SEP_COEFF = 1 * (1 - BOID_INERTIA);
var ALI_COEFF = 1 * (1 - BOID_INERTIA);
var COH_COEFF = 1 * (1 - BOID_INERTIA);

var BORDER_PADDING = 8;

// limit the magnitude of a vector without changing its direction
vec2.limit = function(out, a, n) {
  var x = a[0],
      y = a[1];
  var len = x*x + y*y;
  if (len > n * n) {
    len = n / Math.sqrt(len);
    out[0] = a[0] * len;
    out[1] = a[1] * len;
  }
  return out;
};

class Boid {
  constructor(width, height) {
    this.pos = vec2.fromValues(Math.random() * width,
                               Math.random() * height);
    var vx = -2 + 4 * Math.random();
    var vy = -2 + 4 * Math.random();

    // ensure acceptable min speed
    if(Math.abs(vx) < 0.5) vx = vx/Math.abs(vx) * 0.5;
    if(Math.abs(vy) < 0.5) vy = vy/Math.abs(vy) * 0.5;

    this.velocity = vec2.fromValues(vx, vy);
  }

  x() {
    return this.pos[0];
  }

  y() {
    return this.pos[1];
  }

  vx() {
    return this.velocity[0];
  }

  vy() {
    return this.velocity[1];
  }

  checkBorders(width, height) {
    var correction = vec2.create();

    if(this.pos[0] < BORDER_PADDING) {
      correction[0] = 1;
    } else if (this.pos[0] > width - BORDER_PADDING) {
      correction[0] = -1;
    }

    if(this.pos[1] < BORDER_PADDING) {
      correction[1] = 1;
    } else if (this.pos[1] > height - BORDER_PADDING) {
      correction[1] = -1;
    }

    // add corrections to steer the boid inside the borders
    vec2.add(this.velocity, this.velocity, correction);
    vec2.limit(this.velocity, this.velocity, BOID_SPEED);
  };

  step(swarm) {
    var nbNeighbors = 0;

    var separate = vec2.fromValues(0,0);
    var align = vec2.fromValues(0, 0);
    var cohere = vec2.fromValues(0,0);

    for(var i = 0; i < swarm.boids.length; i++) {

      var n = swarm.boids[i];

      var dist = vec2.distance(this.pos, n.pos);
      if(   dist <= BOID_FOV
            && this != n
        ) {

        nbNeighbors++;

        // separate (non-linear relation)
        var scaledSeparation = vec2.sub(vec2.create(),
                                        this.pos, n.pos);
        vec2.scale(scaledSeparation,
                   scaledSeparation,
                   1/(dist * dist));
        vec2.add(separate, separate, scaledSeparation);

        // align
        vec2.add(align, align, n.velocity);

        // cohere
        vec2.add(cohere, cohere, n.pos);
      }
    }

    if(nbNeighbors > 0) {

      vec2.scale(align, align, 1/nbNeighbors);
      vec2.normalize(align, align);

      vec2.scale(cohere, cohere, 1/nbNeighbors);
      vec2.sub(cohere, cohere, this.pos);
      vec2.normalize(cohere, cohere);

      vec2.scale(separate, separate, 1/nbNeighbors);
      vec2.normalize(separate, separate);

      if(nbNeighbors > swarm.boids.length * BOID_FLEE_RATIO && swarm.flee == 0) {
        // things getting too crowded here, better split up
        swarm.flee = BOID_FLEE;
        COH_COEFF *= -1;
      }
      // scale and apply forces
      vec2.scale(separate, separate, SEP_COEFF);
      vec2.scale(align, align, ALI_COEFF);
      vec2.scale(cohere, cohere, COH_COEFF);

      var acc = vec2.fromValues(0, 0);
      vec2.add(acc, acc, separate);
      vec2.add(acc, acc, align);
      vec2.add(acc, acc, cohere);

      // update velocity
      vec2.add(this.velocity, this.velocity, acc);
      vec2.limit(this.velocity, this.velocity, BOID_SPEED);
    }

    // move
    this.pos = vec2.add(vec2.create(), this.pos, this.velocity);

    this.checkBorders(swarm.width, swarm.height);
  };
}

export class Swarm {
  constructor(width, height) {
    // some margin for the scrollbar
    this.width = width;
    this.height = height;

    this.flee = 0;

    this.boids = []; // the boids
    for(var i = 0; i < NB_BOIDS; i++) {
      this.boids.push(new Boid(this.width, this.height));
    }
  }

  static new(width, height) {
    return new Swarm(width, height);
  }

  step(width, height) {
    this.width = width;
    this.height = height;

    var i, boid;

    // move boids
    for (i = 0; i < this.boids.length; i++) {
      boid = this.boids[i];
      boid.step(this);
    }

    if (this.flee > 0) {
      this.flee--;
      if (this.flee == 0) {
        COH_COEFF *= -1;
      }
    }
  };

  size() {
    return this.boids.length;
  }

  boid(index) {
    return this.boids[index];
  }
}
