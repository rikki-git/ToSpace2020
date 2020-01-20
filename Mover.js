class ShipMover {
    constructor() {
        this.speedVector = new THREE.Vector2();

        this.acceleration = 300;
        this.minAcceleration = 10;
        this.minSlowdown = 0.01;
        this.rotateSpeed = 1.5;
        this.minRotateSpeed = 0.5;
        this.maxRotateSpeed = 2;
        this.dSpeed = 0;
        this.deltaAngle = 0;
        this.maxSpeed = 1000;
        this.mass = 1;
    }

    Move(target, dt) {

        if (target.parts != null) {
            for (let i = 0; i < target.parts.length; i++) {
                /** @type {Part} */
                let part = target.parts[i];
                part.moving = this.dSpeed > 0;
                part.UpdateMaterial();
            }
        }

        let clampRotate = this.rotateSpeed / this.mass;
        if (clampRotate > this.maxRotateSpeed)
            clampRotate = this.maxRotateSpeed;
        if (clampRotate < this.minRotateSpeed)
            clampRotate = this.minRotateSpeed;
        let newAngle = target.tObject.rotation.z + this.deltaAngle * dt * clampRotate;

        if (target.tObject.rotation.z !== newAngle) {
            target.Rotate(newAngle);
        }

        if (this.dSpeed > 0) {
            let delta = dt * this.acceleration / this.mass;
            if (delta < this.minAcceleration)
                delta = this.minAcceleration;

            this.speedVector.x += -delta * Math.sin(target.tObject.rotation.z) * dt;
            this.speedVector.y += delta * Math.cos(target.tObject.rotation.z) * dt;
        }
        else {
            let delta = dt * (this.acceleration * 0.4) / this.mass;
            if (delta < this.minSlowdown)
                delta = this.minSlowdown;

            let l = this.speedVector.length() - delta;
            if (l < 0)
                l = 0;
            this.speedVector.setLength(l);
        }

        this.speedVector.clampLength(0, this.maxSpeed);

        target.tObject.position.x += this.speedVector.x;
        target.tObject.position.y += this.speedVector.y;
    }
}