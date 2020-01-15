class Ship {
    /** @param {string} team */
    constructor(scene, ships, team) {
        this.team = team;
        this.tObject = new THREE.Object3D();
        this.tPartsPreview = new THREE.Group();
        this.tObject.add(this.tPartsPreview);
        /** @type {Part[]} */
        this.parts = [];
        this.partsHash = {};

        this.CreatePart(Parts.cabin, 0, 2, false);
        this.CreatePart(Parts.hub, 0, 1, false);
        this.CreatePart(Parts.hcube, 0, 0, false);
        this.CreatePart(Parts.block, -1, 0, false);
        this.CreatePart(Parts.block, 1, 0, false);
        this.CreatePart(Parts.turret_04, -2, 0, false);
        this.CreatePart(Parts.turret_03, 2, 0, false);
        this.CreatePart(Parts.gyro_00, -1, -1, false);
        this.CreatePart(Parts.gyro_00, 1, -1, false);
        this.CreatePart(Parts.tilep_00, -2, -1, false);
        this.CreatePart(Parts.tilep_01, 2, -1, false);
        this.CreatePart(Parts.tilep_00, -1, 1, false);
        this.CreatePart(Parts.tilep_01, 1, 1, false);
        this.CreatePart(Parts.rocketLauncher, 0, -1, false);
        this.CreatePart(Parts.engine, 0, -2, false);
        this.CreatePart(Parts.engine, -1, -2, false);
        this.CreatePart(Parts.engine, 1, -2, false);

        this.mover = new ShipMover();
        this.controller = null;
        this.Rotate(0);
        scene.add(this.tObject);
        ships.push(this);
        this.isBroken = false;
        this.UpdateShipStats();

        //this.mover.speed = 100;
        //this.ApplyDamage(0, 0, 1000, 1000);
    }

    UpdateShipStats() {
        let mass = 0;
        let maxSpeed = 350;
        let acceleration = 50;
        let rotateSpeed = 0.8;
        let hasLivingParts = false;

        for (let i = 0; i < this.parts.length; i++) {
            let part = this.parts[i];
            let meta = part.partMeta;
            mass += meta.mass;

            if (part.isBroken)
                continue;

            hasLivingParts = true;

            acceleration += meta.acceleration;

            if (meta.acceleration > 0)
                maxSpeed = 550;

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
                part.tObject.position.x += (Math.random() - 0.5) * 20;
                part.tObject.position.y += (Math.random() - 0.5) * 20;
                part.tObject.material.rotation += (Math.random() - 0.5) * 10;

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

        if (this.isBroken) {
            for (let i = 0; i < this.parts.length; i++) {
                let part = this.parts[i];
                let mx = -this.mover.speed * 0.2 * Math.sin(part.tObject.material.rotation) * dt;
                let my = this.mover.speed * 0.2 * Math.cos(part.tObject.material.rotation) * dt;
                part.tObject.position.x += mx;
                part.tObject.position.y += my;
            }
            return;
        }

        for (let i = 0; i < this.parts.length; i++) {
            let part = this.parts[i];

            if (part.isBroken)
                continue;

            let pos = new THREE.Vector3();
            part.tObject.getWorldPosition(pos);

            // TODO: do not search already known part
            if (part.isBurning) {
                part.burnDamageTime -= dt;
                if (part.burnDamageTime < 0) {
                    part.burnDamageTime = part.burnDamageCooldown;
                    this.ApplyDamage(pos.x, pos.y, 10, 999);
                }
            }

            let updateFireRate = true;

            if (this.controller != null) {
                updateFireRate = this.controller.requreFire;
            }

            part.Update(dt);

            if (part.fireMiniCount == 0 && part.partMeta.fireRate > 0) {
                if (part.fireTime <= 0) {
                    part.fireTime = part.partMeta.fireRate;
                    part.fireMiniCount = part.partMeta.fireMiniCount;
                    part.fireMiniTime = part.partMeta.fireMiniDelay;
                }
            }

            if (updateFireRate) {
                if (part.fireMiniCount > 0) {
                    if (part.fireMiniTime <= 0) {
                        part.fireMiniCount--;
                        part.fireMiniTime = part.partMeta.fireMiniDelay;
                        new Rocket(appGlobal.scene, appGlobal.rockets, pos.x, pos.y, this.tObject.rotation.z, this.mover.speed, this.team, part.partMeta.fireRocketType);
                    }
                }
            }
        }
    }

    Control(keys, ships, dt, isRareUpdate) {
        if (this.controller != null && !this.isBroken)
            this.controller.Control(this, keys, ships, dt, isRareUpdate);
    }

    ApplyDamage(x, y, radius, damage) {
        let haveBrokenParts = false;
        let fireTargets = {};

        for (let i = 0; i < this.parts.length; i++) {
            let part = this.parts[i];
            let pos = new THREE.Vector3();
            part.tObject.getWorldPosition(pos);
            let isHit = MathUtils.isInCircle(pos.x, pos.y, x, y, radius);
            if (isHit && !part.isBroken) {
                part.ApplyDamage(damage);
                if (part.isBroken) {
                    haveBrokenParts = true;
                    if (part.partMeta.canFireNearBlocksOnBreak) {
                        for (var j = 0; j < part.partMeta.connections.length; j++) {
                            let connection = part.partMeta.connections[j];
                            let x = part.tileX + connection.dx;
                            let y = part.tileY + connection.dy;
                            let indx = x + "_" + y;
                            fireTargets[indx] = 1;
                        }
                    }
                }
            }
        }

        if (haveBrokenParts) {
            this.UpdateShipStats();

            for (let t in fireTargets) {
                if (this.partsHash.hasOwnProperty(t)) {
                    /** @type {Part} */
                    let p = this.partsHash[t];
                    if (!p.isBroken && !p.isPreview) {
                        p.Burn();
                    }
                }
            }
        }
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
        this.UpdateShipStats();
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
            }
        }

        for (let i in places) {
            let place = places[i];

            if (place.block)
                continue;

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