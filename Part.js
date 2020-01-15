class Part {
    /** @param {number} tileX */
    /** @param {number} tileY */
    /** @param {boolean} isPreview */
    /** @param {boolean} isLoot */
    constructor(partName, parent, x, y, tileX, tileY, isPreview, isLoot) {
        this.partMeta = PartsMeta[partName];
        this.partName = partName;
        this.isPreview = isPreview;
        this.isLoot = isLoot;
        this.materialName = "";
        /** @type {THREE.Sprite[]} */
        this.effects = [];

        if (this.partMeta == null)
            throw new Error("partMeta not found: " + partName);

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

        this.tileX = tileX;
        this.tileY = tileY;

        this.fireTime = this.partMeta.fireRate * Math.random();

        this.isBroken = false;
        this.moving = false;

        if (!this.isPreview && !this.isLoot) {
            for (let i = 0; i < this.partMeta.effects.length; i++) {
                let fx = this.partMeta.effects[i];
                let fxSprite = new THREE.Sprite(AppTextures.materials[fx.textureName].clone());
                parent.add(fxSprite);
                fxSprite.position.set(x + fx.dx, y + fx.dy, 0);
                fxSprite.scale.set(scaledTileGlobal, scaledTileGlobal, 1.0);
                fxSprite["hideOnIdle"] = fx.hideOnIdle;
                if (fx.hideOnIdle)
                    fxSprite.visible = false;
                this.effects.push(fxSprite);
            }
        }
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

        this.isBroken = true;
        for (let i = 0; i < this.effects.length; i++) {
            let fx = this.effects[i];
            fx.visible = false;
        }

        this.UpdateMaterial();
    }

    UpdateMaterial() {
        if (this.isPreview)
            return;

        if (this.isBroken) {
            let damagedMaterial = this.defaultMaterialName + "_d";
            if (AppTextures.materials[damagedMaterial] != null) {
                this.SetMaterial(damagedMaterial);
                this.tObject.material.color.set('#969696');
            }
            else {
                this.SetMaterial(this.defaultMaterialName);
                this.tObject.material.color.set('#3F3F3F');
            }
            return;
        }

        for (let i = 0; i < this.effects.length; i++) {
            let fx = this.effects[i];
            let hideOnIdle = fx["hideOnIdle"];
            if (hideOnIdle) {
                fx.visible = !this.isBroken && this.moving;
            }
        }

        if (this.partMeta.materialIdle != null && this.partMeta.materialMove != null) {
            let stateChanged = false;
            if (this.moving)
                stateChanged = this.SetMaterial(this.partMeta.materialMove);
            else
                stateChanged = this.SetMaterial(this.partMeta.materialIdle);
        }
    }

    SetMaterial(newMaterialName) {
        if (this.materialName == newMaterialName)
            return false;

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
        return true;
    }

    Dispose(parent) {
        this.tObject.material.dispose();
        for (let i = 0; i < this.effects.length; i++) {
            let fx = this.effects[i];
            parent.remove(fx);
            fx.material.dispose();
        }
    }
}