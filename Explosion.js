const Explosions = {
    explosion: "explosion",
    laserHit: "laserHit",
    explosion64: "explosion64",
}

class ExplosionMeta {
    constructor() {
        this.framesAnimate = 0;
        this.framesTotal = 0;
    }
}

/** @type {Object.<string, ExplosionMeta>} */
const ExplosionsMetas = {
    [Explosions.explosion]: { framesAnimate: 7, framesTotal: 8 },
    [Explosions.laserHit]: { framesAnimate: 4, framesTotal: 4 },
    [Explosions.explosion64]: { framesAnimate: 9, framesTotal: 16 },
}

class Explosion {
    constructor(scene, storage, x, y, explosionType) {
        let meta = ExplosionsMetas[explosionType];
        let timePerFrame = 40;
        this.timer = timePerFrame * meta.framesAnimate / 1000;
        this.textureCopy = AppTextures.three[explosionType].clone();
        this.textureCopy.needsUpdate = true;
        this.tObject = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.textureCopy, color: 0xffffff, fog: false }));
        let imageHeight = this.tObject.material.map.image.height;
        this.tObject.position.set(x, y, 0);
        this.tObject.scale.set(scaleGlobal * imageHeight, scaleGlobal * imageHeight, 1.0);
        this.animator = new TextureAnimator(this.textureCopy, meta.framesTotal, 1, meta.framesAnimate, timePerFrame);
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