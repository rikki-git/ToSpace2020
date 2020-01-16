const RocketTypes = {
    rocket: "rocket",
    laserBullet: "laserBullet",
}

class Rocket {
    constructor(scene, storage, x, y, angle, initialSpeed, team, rocketType) {
        this.rocketType = rocketType;
        this.tObject = new THREE.Sprite(AppTextures.materials[this.rocketType].clone());
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
        this.timer = 2 + Math.random() / 4;
        this.damageRadius = 24;
        this.damage = 80;

        if (this.rocketType == RocketTypes.laserBullet) {
            this.gapAngleSpeed = 0;
            this.mover.maxSpeed = initialSpeed + 2000;
            this.timer = 1;
            this.damageRadius = 10;
            this.damage = 40;
        }


        this.initialTimer = this.timer;
        this.initialScaleY = this.tObject.scale.x;
        this.team = team;

        this.Rotate(angle);
        scene.add(this.tObject);
        storage.push(this);

        this.waitDestroy = false;
    }

    Update(dt) {
        this.timer -= dt;
        if (this.timer < 0) {
            this.timer = 0;
            this.waitDestroy = true;
            return;
        }

        if (this.rocketType == RocketTypes.laserBullet) {
            let newScale = this.timer / this.initialTimer * this.initialScaleY;
            if (newScale < 0.1)
                newScale = 0.1;
            this.tObject.scale.y = newScale;
        }

        if (this.gapAngleSpeed != 0) {
            this.Rotate(this.tObject.rotation.z + this.gapAngleSpeed);
            this.gapAngle += this.gapAngleSpeed;
            if (this.gapAngle > this.maxGapAngle || this.gapAngle < -this.maxGapAngle)
                this.gapAngleSpeed = -this.gapAngleSpeed;
        }

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