class Ship {
    constructor(scene, ships) {
        this.tObject = new THREE.Object3D();
        this.tPartsPreview = new THREE.Group();
        this.tObject.add(this.tPartsPreview);
        /** @type {Part[]} */
        this.parts = [];
        this.CreatePart(Parts.cabin, 0, 1, false);
        this.CreatePart(Parts.hub, 0, 0, false);
        //this.CreatePart(Parts.turret, -1, 0, false);
        //this.CreatePart(Parts.turret, 1, 0, false);
        this.CreatePart(Parts.engine, 0, -1, false);
        this.mover = new ShipMover();
        this.controller = null;
        this.Rotate(0);
        scene.add(this.tObject);
        ships.push(this);

        this.UpdateShipStats();
    }

    UpdateShipStats() {
        let mass = 0;
        let maxSpeed = 100;
        let acceleration = 25;

        for (let i = 0; i < this.parts.length; i++) {
            /** @type {} */
            let part = this.parts[i];

            if (part.isBroken)
                continue;

            let meta = part.partMeta;
            mass += 1;
            maxSpeed += meta.maxSpeedBoost;
            acceleration += meta.acceleration;
        }

        this.mover.maxSpeed = maxSpeed;
        this.mover.acceleration = acceleration;
        this.mover.mass = mass;
    }

    /** @returns {Part} */
    CreatePart(partName, tileX, tileY, isPreview) {
        let parent = this.tObject;
        if (isPreview)
            parent = this.tPartsPreview;

        let part = new Part(partName, parent, tileX * scaledTileGlobal, tileY * scaledTileGlobal);
        part.tileX = tileX;
        part.tileY = tileY;
        part.isPreview = isPreview;
        this.parts.push(part);
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

    Update(dt) {
        if (this.mover != null)
            this.mover.Move(this, dt);

        for (let i = 0; i < this.parts.length; i++) {
            let part = this.parts[i];

            if (part.isBroken)
                continue;

            part.Update(dt);

            if (part.partMeta.fireRate > 0) {
                if (part.fireTime <= 0) {
                    let pos = new THREE.Vector3();
                    part.tObject.getWorldPosition(pos);
                    new Rocket(appGlobal.scene, appGlobal.rockets, pos.x, pos.y, this.tObject.rotation.z, this.mover.speed);
                    part.fireTime = part.partMeta.fireRate;
                }
            }
        }
    }

    Control(keys) {
        if (this.controller != null)
            this.controller.Control(this, keys);
    }

    ApplyDamage(x, y, radius) {
        for (let i = 0; i < this.parts.length; i++) {
            let part = this.parts[i];
            let pos = new THREE.Vector3();
            part.tObject.getWorldPosition(pos);
            let isHit = MathUtils.isInCircle(pos.x, pos.y, x, y, radius);
            if (isHit && !part.isBroken) {
                part.ApplyDamage();
                if (part.isBroken)
                    this.UpdateShipStats();
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
            part.Dispose();
        }
    }

    ShowPlaceable(partName) {

        this.DisposePlaceables();

        let places = {};

        for (let i = 0; i < this.parts.length; i++) {
            let part = this.parts[i];
            for (let j = 0; j < part.partMeta.connections.length; j++) {
                let c = part.partMeta.connections[j];
                let x = part.tileX + c.dx;
                let y = part.tileY + c.dy;

                if (part.tileX < 0)
                    continue;

                let indx = x + "_" + y;
                if (places[indx] == null)
                    places[indx] = { x: x, y: y, connectionSources: {} };

                let sourceIndx = (-c.dx) + "_" + (-c.dy);
                places[indx].connectionSources[sourceIndx] = 1;
            }
        }

        for (let i in places) {
            let place = places[i];
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