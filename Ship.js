class Ship {
    /** @param {string} team */
    constructor(scene, ships, team, shipToLoad) {
        this.team = team;
        this.tObject = new THREE.Object3D();
        this.tPartsPreview = new THREE.Group();
        this.tObject.add(this.tPartsPreview);
        /** @type {Part[]} */
        this.parts = [];
        this.partsHash = {};
        this.mover = new ShipMover();

        if (shipToLoad == null)
            this.CreatePart(Parts.hcube, 0, 0, false);
        else
            this.Load(shipToLoad);

        this.controller = null;

        this.arrow = null;
        this.arrowName = null;
        this.arrowToX = 0;
        this.arrowToY = 0;
        this.healValue = 0;

        this.Rotate(0);
        scene.add(this.tObject);
        ships.push(this);
        this.isBroken = false;
        this.waitDestroy = false;
        this.requireUpdateStats = true;
        this.hasLivingHeal = false;
    }

    ArrowTo(x, y, sprite) {
        if (this.arrow == null || this.arrowName != sprite) {
            this.ArrowDispose();
            this.arrow = new SimpleSprite(this.tObject, null, 0, 0, sprite, 32);
        }

        this.arrowName = sprite;
        this.arrowToX = x;
        this.arrowToY = y;
    }

    ArrowDispose() {
        if (this.arrow != null) {
            this.tObject.remove(this.arrow.tObject);
            this.arrow.Dispose();
            this.arrow = null;
            this.arrowName = null;
        }
    }

    Save(name) {
        let savedata = [];
        for (let i = 0; i < this.parts.length; i++) {
            let part = this.parts[i];
            let partData = { name: part.partName, x: part.tileX, y: part.tileY };
            savedata.push(partData);
        }

        let storage = appGlobal.getShipLocalStorage();
        storage[name] = savedata;
        localStorage["ships"] = JSON.stringify(storage);
        console.log("Saved " + name);
    }

    Load(name) {
        let storage = appGlobal.getShipLocalStorage();
        let savedata = storage[name];
        if (savedata == null)
            savedata = [];

        if (savedata.length < 1)
            savedata.push({ name: Parts.hcube, x: 0, y: 0 });

        for (let i = 0; i < savedata.length; i++) {
            let partData = savedata[i];
            this.CreatePart(partData.name, partData.x, partData.y, false);
        }

        this.Rotate(this.tObject.rotation.z);
        this.requireUpdateStats = true;
    }

    UpdateShipStats() {
        this.requireUpdateStats = false;

        let mass = 0;
        let maxSpeed = 3;
        let acceleration = 0;
        let rotateSpeed = 0;
        let hasLivingParts = false;
        this.hasLivingHeal = false;

        for (let i = 0; i < this.parts.length; i++) {
            let part = this.parts[i];
            let meta = part.partMeta;
            mass += meta.mass;

            if (part.isBroken)
                continue;

            hasLivingParts = true;

            if (meta.healTime > 0)
                this.hasLivingHeal = true;

            acceleration += meta.acceleration;

            if (meta.acceleration > 0)
                maxSpeed = 5;

            rotateSpeed += meta.rotateSpeed;
        }

        this.mover.maxSpeed = maxSpeed;
        this.mover.acceleration = acceleration;
        this.mover.mass = mass;
        this.mover.rotateSpeed = rotateSpeed;

        if (!hasLivingParts) {
            this.mover.dSpeed = 0;
            this.mover.deltaAngle = 0;
            this.isBroken = true;
            this.DisposePlaceables();
            let explosions = 3;

            for (let i = 0; i < this.parts.length; i++) {
                let part = this.parts[i];
                part.tObject.position.x += (Math.random() - 0.5) * 15;
                part.tObject.position.y += (Math.random() - 0.5) * 15;
                part.tObject.material.rotation += (Math.random() - 0.5) * 15;

                if (Math.random() < 0.3 && explosions > 0) {
                    explosions--;
                    let pos = new THREE.Vector3();
                    this.tObject.getWorldPosition(pos);
                    new Explosion(appGlobal.scene, appGlobal.effects, pos.x, pos.y, Explosions.explosion64);
                }
            }
        }
    }

    /** @returns {Part} */
    CreatePart(partName, tileX, tileY, isPreview) {
        let parent = this.tObject;
        if (isPreview)
            parent = this.tPartsPreview;

        let part = new Part(partName, parent, tileX * scaledTileGlobal, tileY * scaledTileGlobal, tileX, tileY, isPreview, false, this.team);
        part.isPreview = isPreview;
        this.parts.push(part);
        if (!isPreview)
            this.partsHash[tileX + "_" + tileY] = part;
        return part;
    }

    /**
     * @param {number} tileX
     * @param {number} tileY
     */
    GetPart(tileX, tileY) {
        for (let i = 0; i < this.parts.length; i++) {
            let part = this.parts[i];
            if (part.tileX == tileX && part.tileY == tileY)
                return part;
        }

        return null;
    }

    Rotate(angle) {
        this.tObject.rotation.z = angle;
        for (let i = 0; i < this.tObject.children.length; i++) {
            /** @type {any} */
            let c = this.tObject.children[i];
            if (c.material != null)
                c.material.rotation = angle;
        }

        for (let i = 0; i < this.tPartsPreview.children.length; i++) {
            /** @type {any} */
            let c = this.tPartsPreview.children[i];
            if (c.material != null)
                c.material.rotation = angle;
        }
    }

    Update(dt, rareUpdate) {
        this.mover.Move(this, dt);

        // if (this.mover.speedVector.x > 5) {
        //     this.ApplyDamage(this.tObject.position.x, this.tObject.position.y, 1000, 1000);
        // }

        if (this.arrow != null) {
            let dist = MathUtils.distSqr(this.arrowToX, this.arrowToY, this.tObject.position.x, this.tObject.position.y);
            if (dist < 500 ** 2)
                this.arrow.tObject.visible = false;
            else {
                let targetAngle = Math.atan2(this.arrowToY - this.tObject.position.y, this.arrowToX - this.tObject.position.x);
                targetAngle -= Math.PI * 0.5 - this.tObject.rotation.z + this.tObject.rotation.z;
                this.arrow.tObject.position.x = -Math.sin(targetAngle - this.tObject.rotation.z) * 300;
                this.arrow.tObject.position.y = Math.cos(targetAngle - this.tObject.rotation.z) * 300;
                this.arrow.tObject.material.rotation = targetAngle;
                this.arrow.tObject.visible = true;
            }
        }

        if (this.isBroken) {
            for (let i = 0; i < this.parts.length; i++) {
                let part = this.parts[i];
                let mx = -7 * Math.sin(part.tObject.material.rotation) * 20 * dt;
                let my = 7 * Math.cos(part.tObject.material.rotation) * 20 * dt;
                part.tObject.position.x += mx;
                part.tObject.position.y += my;

                let newOpacity = 0;
                if (part.tObject.material.opacity > 0)
                    newOpacity = part.tObject.material.opacity - dt * 0.1;
                if (newOpacity < 0.01) {
                    newOpacity = 0.01;
                    this.waitDestroy = true;
                }
                part.tObject.material.opacity = newOpacity;
            }
            return;
        }

        for (let i = 0; i < this.parts.length; i++) {
            let part = this.parts[i];

            if (part.isBroken) {
                if (this.healValue > 0) {
                    this.healValue = part.Heal(this.healValue);
                    if (!part.isBroken)
                        this.requireUpdateStats = true;
                }
                else {
                    if (!this.hasLivingHeal) {
                        if (part.healFx != null)
                            part.healFx.visible = false;
                    }
                    continue;
                }
            }

            let pos = new THREE.Vector3();
            part.tObject.getWorldPosition(pos);

            if (part.isBurning) {
                part.burnDamageTime -= dt;
                if (part.burnDamageTime < 0) {
                    part.burnDamageTime = part.burnDamageCooldown;
                    this.ApplyDamageToPart(part, 99999);
                    if (part.isBroken)
                        this.requireUpdateStats = true;
                }
            }

            let updateFireRate = false;

            if (this.controller != null) {
                updateFireRate = this.controller.requreFire;
            }

            part.Update(dt, rareUpdate);

            if (part.timeToHeal && this.healValue < 1) {
                this.healValue += part.partMeta.healValue;
                part.timeToHeal = false;
                part.healTimer = part.partMeta.healTime;
            }

            if (part.fireMiniCount == 0 && part.partMeta.fireRate > 0) {
                if (part.fireTime <= 0) {
                    part.fireTime = part.partMeta.fireRate + (Math.random() - 0.5) * 0.2;
                    part.fireMiniCount = part.partMeta.fireMiniCount;
                    part.fireMiniTime = part.partMeta.fireMiniDelay;
                }
            }

            if (updateFireRate) {
                if (part.fireMiniCount > 0) {
                    if (part.fireMiniTime <= 0) {
                        part.fireMiniCount--;
                        part.fireMiniTime = part.partMeta.fireMiniDelay;
                        part.Fire(this.mover.speedVector.clone(), this.tObject.rotation.z);
                    }
                }
            }
        }
    }

    Control(keys, ships, dt, isRareUpdate) {
        if (this.controller != null && !this.isBroken)
            this.controller.Control(this, keys, ships, dt, isRareUpdate);
    }

    /**
    * @param {Part} part
    */
    ApplyFireByPartBroke(part) {
        if (part.partMeta.canFireNearBlocksOnBreak) {
            for (var j = 0; j < part.partMeta.connections.length; j++) {
                let connection = part.partMeta.connections[j];
                let x = part.tileX + connection.dx;
                let y = part.tileY + connection.dy;
                let indx = x + "_" + y;

                if (this.partsHash.hasOwnProperty(indx)) {
                    /** @type {Part} */
                    let p = this.partsHash[indx];
                    if (!p.isBroken && !p.isPreview && !p.isBurning) {
                        p.Burn();
                    }
                }
            }
        }
    }

    /**
     * 
     * @param {Part} part 
     * @param {number} damage 
     */
    ApplyDamageToPart(part, damage) {
        part.ApplyDamage(damage);
        if (part.isBroken)
            this.ApplyFireByPartBroke(part);
    }

    ApplyDamage(x, y, radius, damage) {
        let haveBrokenParts = false;

        for (let i = 0; i < this.parts.length; i++) {
            let part = this.parts[i];
            let pos = new THREE.Vector3();
            part.tObject.getWorldPosition(pos);
            let isHit = MathUtils.isInCircle(pos.x, pos.y, x, y, radius);
            if (isHit && !part.isBroken) {
                part.ApplyDamage(damage);
                if (part.isBroken) {
                    haveBrokenParts = true;
                    this.ApplyFireByPartBroke(part);
                }
            }
        }

        if (haveBrokenParts)
            this.requireUpdateStats = true;
    }

    ApplyPreview(preview) {
        let part = preview.part;
        this.CreatePart(part.partName, part.tileX, part.tileY, false);
        this.DisposePlaceables();

        if (part.tileX != 0) {
            let flipName = part.partName;
            if (part.partMeta.flipPartName != null)
                flipName = part.partMeta.flipPartName;

            this.CreatePart(flipName, -part.tileX, part.tileY, false);
        }

        this.Rotate(this.tObject.rotation.z);
        this.requireUpdateStats = true;
    }

    Dispose() {
        this.ArrowDispose();
        this.DisposePlaceables();
        let disposeParts = [];
        for (let i = this.parts.length - 1; i >= 0; i--) {
            let part = this.parts[i];
            disposeParts.push(part);
            this.parts.splice(i, 1);
        }

        for (let i = 0; i < disposeParts.length; i++) {
            let part = disposeParts[i];
            this.tObject.remove(part.tObject);
            part.Dispose(this.tObject);
        }
    }

    DisposePlaceables() {
        let disposeParts = [];
        for (let i = this.parts.length - 1; i >= 0; i--) {
            let part = this.parts[i];
            if (part.isPreview) {
                disposeParts.push(part);
                this.parts.splice(i, 1);
            }
        }

        for (let i = 0; i < disposeParts.length; i++) {
            let part = disposeParts[i];
            this.tPartsPreview.remove(part.tObject);
            part.Dispose(this.tPartsPreview);
        }
    }

    ShowPlaceable(partName) {

        this.DisposePlaceables();

        if (this.isBroken)
            return;

        let places = {};

        for (let i = 0; i < this.parts.length; i++) {
            let part = this.parts[i];
            if (part.tileX < 0)
                continue;

            for (let j = 0; j < part.partMeta.connections.length; j++) {
                let c = part.partMeta.connections[j];
                let x = part.tileX + c.dx;
                let y = part.tileY + c.dy;
                let indx = x + "_" + y;
                if (places[indx] == null)
                    places[indx] = { x: x, y: y, connectionSources: {}, block: false };
                else if (places[indx].block)
                    continue;

                let sourceIndx = (-c.dx) + "_" + (-c.dy);
                places[indx].connectionSources[sourceIndx] = 1;
            }

            for (let j = 0; j < part.partMeta.blockConnections.length; j++) {
                let c = part.partMeta.blockConnections[j];
                let x = part.tileX + c.dx;
                let y = part.tileY + c.dy;
                let indx = x + "_" + y;
                places[indx] = { x: x, y: y, connectionSources: {}, block: true };
                if (x > 0) {
                    let x2 = -x;
                    let indx2 = x2 + "_" + y;
                    places[indx2] = { x: x2, y: y, connectionSources: {}, block: true };
                }
            }
        }

        for (let i in places) {
            let place = places[i];

            if (place.block) {
                continue;
            }

            let oldPart = this.GetPart(place.x, place.y);
            if (oldPart == null) {
                let newPartMeta = PartsMeta[partName];

                for (let j = 0; j < newPartMeta.connections.length; j++) {
                    let c = newPartMeta.connections[j];
                    let indx = c.dx + "_" + c.dy;

                    if (newPartMeta.flipPartName != null && place.x == 0)
                        continue;

                    if (place.connectionSources[indx] != null) {
                        let part = this.CreatePart(partName, place.x, place.y, true);
                        part.tObject.material.opacity = 0.3;
                        part.isPreview = true;
                        /** @type {any} */
                        let partAny = part;
                        partAny.tObject.part = part;

                        if (place.x != 0) {
                            let flipName = part.partName;
                            if (part.partMeta.flipPartName != null)
                                flipName = part.partMeta.flipPartName;

                            let partFlip = this.CreatePart(flipName, -place.x, place.y, true);
                            partFlip.tObject.material.opacity = 0.3;
                            partFlip.isPreview = true;
                            /** @type {any} */
                            let partFlipAny = partFlip;
                            partFlipAny.tObject.part = part;
                        }

                        break;
                    }
                }
            }
        }

        this.Rotate(this.tObject.rotation.z);
    }
}