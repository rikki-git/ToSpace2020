class Rocket {
    constructor(scene, storage, x, y, angle, initialSpeed) {
        this.tObject = new THREE.Sprite(AppTextures.materials.rocket.clone());
        this.tObject.position.set(x, y, 0);
        this.tObject.scale.set(scaledTileGlobal, scaledTileGlobal, 1.0);
        this.mover = new ShipMover();
        this.mover.dSpeed = 1;
        this.mover.maxSpeed = initialSpeed + 1200;
        this.mover.acceleration = 10000;
        this.mover.speed = initialSpeed;

        this.maxGapAngle = 0.15;
        this.gapAngle = (Math.random() - 0.5) * this.maxGapAngle;
        this.gapAngleSpeed = 0.02;

        this.Rotate(angle);
        scene.add(this.tObject);
        storage.push(this);

        this.timer = 0.9 + Math.random() / 4;
        this.waitDestroy = false;
    }

    Update(dt) {
        this.timer -= dt;
        if (this.timer < 0) {
            this.timer = 0;
            this.waitDestroy = true;
        }

        this.Rotate(this.tObject.rotation.z + this.gapAngleSpeed);
        this.gapAngle += this.gapAngleSpeed;
        if (this.gapAngle > this.maxGapAngle || this.gapAngle < -this.maxGapAngle)
            this.gapAngleSpeed = -this.gapAngleSpeed;

        if (this.mover != null)
            this.mover.Move(this, dt);
    }

    Rotate(angle) {
        this.tObject.material.rotation = angle;
        this.tObject.rotation.z = angle;
    }

    Dispose() {
        this.tObject.material.dispose();
    }
}