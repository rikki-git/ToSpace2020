class SimpleSprite {
    constructor(scene, storage, x, y, texture, imageHeight) {
        this.tObject = new THREE.Sprite(AppTextures.materials[texture].clone());
        this.tObject.position.set(x, y, -1);
        this.tObject.scale.set(scaleGlobal * imageHeight, scaleGlobal * imageHeight, 1.0);
        if (storage != null)
            storage.push(this);
        scene.add(this.tObject);
    }

    Update(dt) {
    }

    Dispose() {
        this.tObject.material.dispose();
    }
}