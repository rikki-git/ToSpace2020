class Explosion {
    constructor(scene, storage, x, y) {
        this.timer = 40 * 7 / 1000;
        this.textureCopy = AppTextures.three.explosion.clone();
        this.textureCopy.needsUpdate = true;
        this.tObject = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.textureCopy, color: 0xffffff, fog: false }));
        let imageHeight = this.tObject.material.map.image.height;
        this.tObject.position.set(x, y, 0);
        this.tObject.scale.set(scaleGlobal * imageHeight, scaleGlobal * imageHeight, 1.0);
        this.animator = new TextureAnimator(this.textureCopy, 8, 1, 7, 40);
        storage.push(this);
        scene.add(this.tObject);
    }

    Update(dt) {
        this.timer -= dt;
        if (this.timer < 0) {
            this.timer = 0;
            this.waitDestroy = true;
        }
        else {
            this.animator.update(1000 * dt);
        }
    }

    Dispose() {
        this.textureCopy.dispose();
        this.tObject.material.dispose();
    }
}