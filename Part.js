class Part {
    /**
    * @param {number} tileX
    * @param {number} tileY
    * @param {boolean} isPreview
    * @param {boolean} isLoot
    * @param {string} team
    */
    constructor(partName, parent, x, y, tileX, tileY, isPreview, isLoot, team) {
        this.parent = parent;
        this.team = team;
        this.partMeta = PartsMeta[partName];
        this.partName = partName;
        this.isPreview = isPreview;
        this.isLoot = isLoot;
        this.materialName = "";
        this.hp = this.partMeta.hp;
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
        this.tObject["part"] = this;

        this.tileX = tileX;
        this.tileY = tileY;

        this.fireTime = this.partMeta.fireRate;
        this.UpdateReadyToFire();

        this.fireMiniTime = 0;
        this.fireMiniCount = 0;

        this.isBroken = false;
        this.moving = false;
        this.isBurning = false;

        this.burnDamageCooldown = 3;
        this.burnDamageTime = this.burnDamageCooldown;

        this.lineMaterial = null;
        this.line = null;
        this.lineGeometry = null;

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

    Fire(speed, angle) {
        let pos = new THREE.Vector3();
        this.tObject.getWorldPosition(pos);
        new Rocket(appGlobal.scene, appGlobal.rockets, pos.x, pos.y, angle, speed, this.team, this.partMeta.fireRocketType);
    }

    Burn() {
        if (this.isBurning)
            return;
        this.isBurning = true;

        let fxSprite = new THREE.Sprite(AppTextures.materials.fire.clone());
        this.parent.add(fxSprite);
        fxSprite.position.set(this.tObject.position.x, this.tObject.position.y, 0);
        fxSprite.scale.set(scaledTileGlobal, scaledTileGlobal, 1.0);
        this.effects.push(fxSprite);
    }

    UpdateReadyToFire() {
        if (this.partName != Parts.canon) {
            return;
        }

        if (this.isPreview || this.isBroken || this.isLoot)
            return;

        let open = this.fireMiniCount > 0 && this.fireMiniTime <= 0.1;

        if (open)
            this.SetMaterial(this.defaultMaterialName);
        else
            this.SetMaterial("canonClosed");
    }

    Update(dt, rareUpdate) {
        if (this.isPreview)
            return;

        if (this.isBroken)
            return;

        if (this.fireMiniCount > 0) {
            this.fireMiniTime -= dt;
            if (this.fireMiniTime <= 0) {
                this.fireMiniTime = 0;
            }
        }
        else {
            if (this.partMeta.fireRate > 0) {
                this.fireTime -= dt;

                if (this.fireTime <= 0) {
                    this.fireTime = 0;
                }
            }
        }

        this.UpdateReadyToFire();

        if (this.partName == Parts.laser) {

            let target = null;
            let minDist = 0;
            let x1 = 0;
            let y1 = 0;
            let x2 = 0;
            let y2 = 0;

            for (let i = 0; i < appGlobal.rockets.length; i++) {
                let rocket = appGlobal.rockets[i];

                if (rocket.team == this.team)
                    continue;

                if (rocket.rocketType != RocketTypes.rocket)
                    continue;

                let tx1 = this.tObject.position.x;
                let ty1 = this.tObject.position.y + 3.5 * scaleGlobal;
                let rocketLocal = new THREE.Vector3(rocket.tObject.position.x, rocket.tObject.position.y, 0);
                this.parent.worldToLocal(rocketLocal);
                let tx2 = rocketLocal.x;
                let ty2 = rocketLocal.y;

                let dist = MathUtils.distSqr(tx1, ty1, tx2, ty2);

                if (dist > 1000 * 1000)
                    continue;

                if (target == null || dist < minDist) {
                    target = rocket;
                    minDist = dist;
                    x1 = tx1;
                    x2 = tx2;
                    y1 = ty1;
                    y2 = ty2;
                }
            }

            if (target == null) {
                if (this.line != null) {
                    this.line.visible = false;
                }
            }
            else {

                target.timer -= dt * 6;

                if (this.line == null) {
                    this.lineMaterial = new THREE.LineBasicMaterial({ color: 0xBDFFCA });
                    this.lineGeometry = new THREE.Geometry();

                    for (let i = -1 * scaleGlobal; i <= 1 * scaleGlobal; i++) {
                        this.lineGeometry.vertices.push(new THREE.Vector3(x1 + i, y1, 1));
                        this.lineGeometry.vertices.push(new THREE.Vector3(x2, y2, 1));
                    }

                    this.line = new THREE.Line(this.lineGeometry, this.lineMaterial);
                    this.parent.add(this.line);
                }
                else {
                    this.line.visible = true;
                    for (let i = 1; i < this.lineGeometry.vertices.length; i += 2) {
                        this.lineGeometry.vertices[i].x = x2;
                        this.lineGeometry.vertices[i].y = y2;
                        this.lineGeometry.verticesNeedUpdate = true;
                    }
                }
            }
        }
    }

    ApplyDamage(damage) {
        if (this.isPreview)
            return;
        if (this.isBroken)
            return;

        this.hp -= damage;
        if (this.hp <= 0) {
            let pos = new THREE.Vector3();
            this.tObject.getWorldPosition(pos);
            new Explosion(appGlobal.scene, appGlobal.effects, pos.x, pos.y, Explosions.explosion64);
            this.hp = 0;
            this.isBroken = true;
            for (let i = 0; i < this.effects.length; i++) {
                let fx = this.effects[i];
                fx.visible = false;
            }
            if (this.line != null)
                this.line.visible = false;
            this.UpdateMaterial();
        }
    }

    UpdateMaterial() {
        if (this.isPreview)
            return;

        if (this.isBroken) {
            let damagedMaterial = this.defaultMaterialName + "_d";
            if (AppTextures.materials[damagedMaterial] != null) {
                this.SetMaterial(damagedMaterial);
                this.tObject.material.color.set('#9E9E9E');
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
        if (this.line != null) {
            this.parent.remove(this.line);
            this.line = null;
        }

        if (this.lineMaterial != null) {
            this.lineMaterial.dispose();
            this.lineMaterial = null;
        }

        if (this.lineGeometry != null) {
            this.lineGeometry.dispose();
            this.lineGeometry = null;
        }

        this.tObject.material.dispose();
        for (let i = 0; i < this.effects.length; i++) {
            let fx = this.effects[i];
            parent.remove(fx);
            fx.material.dispose();
        }
    }
}