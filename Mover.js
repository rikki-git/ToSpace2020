class ShipMover {
    constructor() {
        this.speed = 0;
        this.acceleration = 300;
        this.minAcceleration = 35;
        this.rotateSpeed = 1.5;
        this.minRotateSpeed = 0.5;
        this.maxRotateSpeed = 2;
        this.dSpeed = 0;
        this.deltaAngle = 0;
        this.maxSpeed = 1000;
        this.slowdown = 300;
        this.mass = 1;
    }

    Move(target, dt) {

        let clampRotate = this.rotateSpeed / this.mass;
        if (clampRotate > this.maxRotateSpeed)
            clampRotate = this.maxRotateSpeed;
        if (clampRotate < this.minRotateSpeed)
            clampRotate = this.minRotateSpeed;
        let newAngle = target.tObject.rotation.z + this.deltaAngle * dt * clampRotate;

        if (target.tObject.rotation.z !== newAngle) {
            target.Rotate(newAngle);
        }

        if (this.dSpeed !== 0) {
            let acc = this.acceleration / this.mass;
            if (acc < this.minAcceleration)
                acc = this.minAcceleration;
            this.speed += this.dSpeed * dt * acc;
        }
        else {
            this.speed += -1 * dt * this.slowdown / this.mass;
        }

        if (this.speed > this.maxSpeed)
            this.speed = this.maxSpeed;
        if (this.speed < 0)
            this.speed = 0;

        if (target.parts != null) {
            for (let i = 0; i < target.parts.length; i++) {
                /** @type {Part} */
                let part = target.parts[i];
                part.moving = this.dSpeed > 0;
                part.UpdateMaterial();
            }
        }

        let mx = -this.speed * Math.sin(target.tObject.rotation.z) * dt;
        let my = this.speed * Math.cos(target.tObject.rotation.z) * dt;
        target.tObject.position.x += mx;
        target.tObject.position.y += my;
    }
}