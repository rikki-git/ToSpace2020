class Part {
    constructor(partName, parent, x, y) {
        this.partMeta = PartsMeta[partName];
        this.partName = partName;
        this.isPreview = false;
        this.materialName = "";

        if (this.partMeta == null)
            throw new Error("meta not found: " + partName);

        let material = null;
        if (this.partMeta.materialIdle != null)
            this.materialName = this.partMeta.materialIdle;
        else
            this.materialName = partName;

        this.defaultMaterialName = this.materialName;

        if (AppTextures.materials[this.materialName] == null)
            throw new Error("Missing texture " + this.materialName);

        material = AppTextures.materials[this.materialName];
        let sprite = new THREE.Sprite(material.clone());
        sprite.position.set(x, y, 0);
        sprite.scale.set(scaledTileGlobal, scaledTileGlobal, 1.0);
        parent.add(sprite);
        this.tObject = sprite;

        this.tileX = 0;
        this.tileY = 0;

        this.fireTime = this.partMeta.fireRate;
        this.isBroken = false;
        this.moving = false;
    }

    Update(dt) {
        if (this.isPreview)
            return;

        if (this.isBroken)
            return;

        if (this.partMeta.fireRate > 0) {
            this.fireTime -= dt;

            if (this.fireTime <= 0) {
                this.fireTime = 0;
            }
        }
    }

    ApplyDamage() {
        if (this.isPreview)
            return;
        if (this.isBroken)
            return;
        this.tObject.material.color.set('#3F3F3F');
        this.isBroken = true;
    }

    UpdateMaterial() {
        if (this.isPreview)
            return;

        if (this.isBroken) {
            this.SetMaterial(this.defaultMaterialName);
            return;
        }

        if (this.partMeta.materialIdle != null && this.partMeta.materialMove != null) {
            if (this.moving)
                this.SetMaterial(this.partMeta.materialMove);
            else
                this.SetMaterial(this.partMeta.materialIdle);
        }
    }

    SetMaterial(newMaterialName) {
        if (this.materialName == newMaterialName)
            return;

        let matRotation = this.tObject.material.rotation;
        let matColor = this.tObject.material.color;

        if (AppTextures.materials[newMaterialName] == null)
            throw new Error("Missing texture " + newMaterialName);

        this.tObject.material.dispose();
        this.tObject.material = AppTextures.materials[newMaterialName].clone();
        this.materialName = this.partMeta.materialIdle;

        this.tObject.material.rotation = matRotation;
        this.tObject.material.color = matColor;

        this.materialName = newMaterialName;
    }

    Dispose() {
        this.tObject.material.dispose();
    }
}