function Swarm(canvas, buffer) {

    var context = buffer.getContext('2d');

    // some margin for the scrollbar
    var width = window.innerWidth - 20;
    var height = window.innerHeight;

    var NB_BOIDS = 50;
    var BOID_FOV = 50;
    var BOID_SPEED = 2;
    var BOID_INERTIA = 0.8;

    var BOID_FLEE = 250;
    var BOID_FLEE_RATIO = 0.66;

    var flee = 0;

    var SEP_COEFF = 1 * (1 - BOID_INERTIA);
    var ALI_COEFF = 1 * (1 - BOID_INERTIA);
    var COH_COEFF = 1 * (1 - BOID_INERTIA);

    var BORDER_PADDING = 8;

    var radius = 6;
    var queueLength = radius * 2.5;

    var boids = []; // the boids
    for(var i = 0; i < NB_BOIDS; i++) {
        boids.push(new Boid());
    }

    function Boid() {
        this.pos = vec2.fromValues(Math.random() * width, Math.random() * height);
        var vx = -2 + 4 * Math.random();
        var vy = -2 + 4 * Math.random();

        // ensure acceptable min speed
        if(Math.abs(vx) < 0.5) vx = vx/Math.abs(vx) * 0.5;
        if(Math.abs(vy) < 0.5) vy = vy/Math.abs(vy) * 0.5;

        this.velocity = vec2.fromValues(vx, vy);
    }

    Boid.prototype.undraw = function(ctx) {
        // remove old boid
        ctx.fillStyle = 'white';
        ctx.strokeStyle = 'white';
        ctx.beginPath();
        // round coordinates to integer (huge speedup on canvas)
        ctx.arc((this.pos[0] + 0.5)|0,  (this.pos[1] + 0.5)|0, BOID_SPEED * queueLength + radius, 0, 2 * Math.PI);
        ctx.fill();
    }

    Boid.prototype.draw = function(ctx) {

        ctx.fillStyle = 'blue';
        ctx.strokeStyle = 'blue';

        var b = vec2.fromValues(-1* this.velocity[1], this.velocity[0]);
        vec2.scale(b, b, radius / Math.sqrt(b[0]*b[0] + b[1]*b[1]));
        var b0 = vec2.add(vec2.create(), this.pos, b);
        var b1 = vec2.sub(vec2.create(), this.pos, b);
        var queue = vec2.scale(vec2.create(), this.velocity, -1 * queueLength);

        if(vec2.length(queue) < queueLength) {
            // ensure the boid will not be too small
            vec2.scale(queue, vec2.normalize(queue, queue), queueLength);
        }

        //place the queue at the position of the boid
        vec2.add(queue, this.pos, queue);

        ctx.beginPath();
        ctx.moveTo(queue[0], queue[1]);
        ctx.lineTo(b0[0], b0[1]);
        ctx.lineTo(b1[0], b1[1]);
        ctx.fill();

    }

    Boid.prototype.checkBorders = function() {
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
    }

    Boid.prototype.step = function() {

        var nbNeighbors = 0;

        var separate = vec2.fromValues(0,0);
        var align = vec2.fromValues(0, 0);
        var cohere = vec2.fromValues(0,0);

        for(var i = 0; i < boids.length; i++) {

            var n = boids[i];

            var dist = vec2.distance(this.pos, n.pos);
            if(   dist <= BOID_FOV
                  && this != boids[i]
              ) {

                nbNeighbors++;

                // separate (non-linear relation)
                var scaledSeparation = vec2.sub(vec2.create(), this.pos, n.pos);
                vec2.scale(scaledSeparation, scaledSeparation, 1/(dist * dist));
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

            if(nbNeighbors > boids.length * BOID_FLEE_RATIO && flee == 0) {
                // things getting too crowded here, better split up
                flee = BOID_FLEE;
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

        this.checkBorders();
    }

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

    Swarm.prototype.step = function() {
        // adjust canvas if needed
        if (buffer.width != window.innerWidth || buffer.height != window.innerHeight){
            // some margin for the scrollbar
            width = window.innerWidth - 20;
            height = window.innerHeight;

            buffer.width = window.innerWidth;
            buffer.height = window.innerHeight;

            context.fillStyle = 'white';
            context.fillRect(0, 0, window.innerWidth, window.innerHeight);

            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }

        // remove old boids
        for (var i = 0; i < boids.length; i++) {
            var boid = boids[i];
            boid.undraw(context);
        }

        // move boids
        for (var i = 0; i < boids.length; i++) {
            var boid = boids[i];
            boid.step();
            boid.draw(context);
        }

        if (flee > 0) {
            flee--;
            if (flee == 0) {
                COH_COEFF *= -1;
            }
        }

        // draw buffer into canvas
        canvas.getContext('2d').drawImage(buffer,0,0);

    }

}
