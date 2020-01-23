'use strict';

/** @type {App} */
let appGlobal = null;
const scaleGlobal = 4;
const tileGlobal = 16;
const scaledTileGlobal = scaleGlobal * tileGlobal;
const NoTeam = "";

/** @type {Object.<string, PartMeta>} */
const PartsMeta = {}

const Parts = {
    cabin: 0,
    cabin_e: 0,
    flip_turret_03: 0,
    turret_03: 0,
    bridge: 0,
    bridgeT: 0,
    engine: 0,
    engine_e: 0,
    hub: 0,
    hcube: 0,
    block: 0,
    bridge_cross: 0,
    flip_tilep_01: 0,
    tilep_01: 0,
    flip_wing02: 0,
    wing02: 0,
    flip_roundplate01: 0,
    roundplate01: 0,
    flip_tiler_01: 0,
    tiler_01: 0,
    flip_roundplate02: 0,
    roundplate02: 0,
    flip_tilep_02: 0,
    tilep_02: 0,
    flip_tiler_02: 0,
    tiler_02: 0,
    gyro_00: 0,
    laser: 0,
    turret_02: 0,
    canon: 0,
}

for (let i in Parts) {
    if (Parts.hasOwnProperty(i))
        Parts[i] = i;
}

/** @return {THREE.Sprite} */
function CastToSprite(a) {
    return a;
}

class App {
    constructor() {
        for (let i in Parts) {
            let meta = new PartMeta();
            PartsMeta[i] = meta;
        }

        this.sidorovichText = document.getElementById("sidorovichText");
        this.sidorovichContainer = document.getElementById("sidorovichContainer");
        this.infoBlock = document.getElementById("infoBlock");
        this.infoBlockTitle = document.getElementById("infoBlockTitle");
        this.infoBlockDescription = document.getElementById("infoBlockDescription");
        this.moneyToSpent = document.getElementById("moneyToSpent");
        this.nextMissionButton = document.getElementById("nextMissionButton");
        this.sidtalk = document.getElementById("sidtalk");
        this.sideye = document.getElementById("sideye");

        CreateMissions();

        this.rareUpdateCounter = 0;
        this.rareUpdateInterval = 0.06;

        this.sidtalkTime = 0;
        this.sideyeTime = 0;
        this.prevSidEye = 1;

        let width = window.innerWidth;
        let height = window.innerHeight;

        this.cameraBg = new THREE.OrthographicCamera(-width / 2, width / 2, height / 2, -height / 2, 0, 11);
        this.cameraBg.position.z = 1;

        this.camera = new THREE.OrthographicCamera(-width / 2, width / 2, height / 2, -height / 2, 0, 11);
        this.camera.position.z = 10;

        this.scene = new THREE.Scene();
        this.sceneBg = new THREE.Scene();

        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.autoClear = false; // To allow render overlay on top of sprited sphere

        this.groupLoot = new THREE.Group();
        this.scene.add(this.groupLoot);
        this.clock = new THREE.Clock();

        this.raycaster = new THREE.Raycaster();
        this.mouseVector = new THREE.Vector3();

        this.undermousePreview = null;
        this.undermouseLoot = null;

        this.keys = {};

        /** @type {Ship[]} */
        this.ships = [];

        /** @type {Rocket[]} */
        this.rockets = [];

        this.effects = [];

        /** @type {TextureAnimator[]} */
        this.animators = [];

        /** @type {SimpleSprite} */
        this.target = null;

        this.money = 0;
    }

    InitialSpawn() {
        this.bg = new THREE.Sprite(AppTextures.materials["back"]);
        this.bg.scale.set(512 * 6, 512 * 6, 1.0);
        this.bg.position.set(0, 0, 0);

        this.bg2 = new THREE.Sprite(AppTextures.materials["bg2"]);
        this.bg2.scale.set(512 * 8, 512 * 8, 1.0);
        this.bg2.position.set(0, 0, 0);

        this.bg3 = new THREE.Sprite(AppTextures.materials["bg3"]);
        this.bg3.scale.set(512 * 8, 512 * 8, 1.0);
        this.bg3.position.set(0, 0, 0);

        this.sceneBg.add(this.bg);
        this.sceneBg.add(this.bg2);
        this.sceneBg.add(this.bg3);

        this.currentTask = -1;
        this.currentReplic = -1;
        this.currentMission = '';
        this.replicTime = -1;
        this.startMission("Tutorial");
    }

    clean() {
        this.currentTask = -1;
        this.currentMission = '';
        this.currentReplic = -1;
        this.replicTime = -1;
        this.sidorovichContainer.style.display = "none";
        this.sidorovichText.innerHTML = "";
        this.infoBlock.style.display = "none";
        this.money = 0;
        this.nextMissionButton.style.display = "none";

        for (let i = this.ships.length - 1; i >= 0; i--) {
            let c = this.ships[i];
            this.scene.remove(c.tObject);
            this.ships.splice(i, 1);
            c.Dispose();
        }

        for (let i = this.rockets.length - 1; i >= 0; i--) {
            let c = this.rockets[i];
            this.applyDamage(c.tObject.position.x, c.tObject.position.y, c.damageRadius, c.team, c.damage);
            this.scene.remove(c.tObject);
            this.rockets.splice(i, 1);
            c.Dispose();
        }

        for (let i = this.effects.length - 1; i >= 0; i--) {
            let c = this.effects[i];
            this.scene.remove(c.tObject);
            this.effects.splice(i, 1);
            c.Dispose();
        }

        for (let i = this.groupLoot.children.length - 1; i >= 0; i--) {
            let c = this.groupLoot.children[i];
            let part = this.getPartFromTObject(c);
            part.Dispose(this.groupLoot);
            this.groupLoot.remove(c);
        }
    }

    updateMoneyToSpent() {
        if (this.money <= 0)
            this.moneyToSpent.style.display = "none";
        else {
            this.moneyToSpent.style.display = "block";
            this.moneyToSpent.innerHTML = Localization.Get("MoneyToSpent") + this.money + Localization.Get("PriceCurrency");
        }
    }

    nextMission() {
        let mission = Missions[this.currentMission];
        this.startMission(mission.nextMission);
    }

    /**
    * @param {string} mission
    */
    startMission(mission) {
        this.clean();
        this.currentMission = mission;

        if (mission == "Editor") {
            let partsArr = [];
            for (var i in Parts) {
                partsArr.push(i);
            }

            let row = 0;
            let column = 0;

            for (let i = 0; i < partsArr.length; i++) {

                column++;
                if (column > 8) {
                    column = 1;
                    row++;
                }

                let x = column * 100;
                let y = -row * 100 + 200;
                let partName = Parts[partsArr[i]];
                new Part(partName, this.groupLoot, x, y, 0, 0, false, true, NoTeam);
            }

            let player = new Ship(this.scene, this.ships, "team1", "Mini");
            player.controller = new PlayerShip();
        }
        else {
            let player = new Ship(this.scene, this.ships, "team1", "Cube");
            player.controller = new PlayerShip();
            let mission = Missions[this.currentMission];
            let spacing = 100;
            let offset = -mission.parts.length * spacing / 2 + spacing / 2;

            for (let i = 0; i < mission.parts.length; i++) {
                new Part(mission.parts[i], this.groupLoot, offset + i * spacing, 200, 0, 0, false, true, NoTeam);
            }
        }

        this.money = Missions[this.currentMission].money;
        this.updateMoneyToSpent();
        this.startNextTask();
    }

    startNextTask() {
        if (this.currentTask == 0) {
            for (let i = this.groupLoot.children.length - 1; i >= 0; i--) {
                let c = this.groupLoot.children[i];
                let part = this.getPartFromTObject(c);
                part.Dispose(this.groupLoot);
                this.groupLoot.remove(c);
            }
            this.money = 0;
            this.updateMoneyToSpent();
        }

        let nextTask = this.currentTask + 1;
        let mission = Missions[this.currentMission];
        this.currentReplic = -1;

        if (this.target != null) {
            this.scene.remove(this.target.tObject);
            this.target.Dispose();
            this.target = null;
        }

        if (mission.tasks.length <= nextTask)
            return;

        this.currentTask = nextTask;
        let task = mission.tasks[this.currentTask];

        if (task.type == TaskTypes.GoTo) {
            this.target = new SimpleSprite(this.scene, this.effects, task.x, task.y, "target", 128);
            let player = this.getPlayer();
            if (player != null)
                player.ArrowTo(task.x, task.y, "arrow");
        }
        else if (task.type == TaskTypes.Kill) {
            for (let i = 0; i < task.shipsCount; i++) {
                for (let j = 0; j < task.ships.length; j++) {
                    let name = task.ships[j];
                    let bot = new Ship(this.scene, this.ships, "team2", name);
                    bot.controller = new BotShip();
                    bot.tObject.position.x = task.x + i * 200;
                    bot.tObject.position.y = task.y + j * 200;
                }
            }
        }

        this.startNextReplic();
    }

    checkTaskComplete() {
        let mission = Missions[this.currentMission];
        if (mission.tasks.length <= this.currentTask || this.currentTask < 0)
            return;

        let task = mission.tasks[this.currentTask];
        if (task.type == TaskTypes.GoTo) {
            let player = this.getPlayer();
            if (player != null && !player.isBroken) {
                let dist = MathUtils.distSqr(task.x, task.y, player.tObject.position.x, player.tObject.position.y);
                if (dist < 128 ** 2) {
                    player.ArrowDispose();
                    this.startNextTask();
                }
            }
        }
        else if (task.type == TaskTypes.Kill) {
            let player = this.getPlayer();
            if (player != null) {
                let minDist = -1;
                let x = 0;
                let y = 0;

                for (let i = 0; i < this.ships.length; i++) {
                    let c = this.ships[i];
                    if (c.team == player.team || c.isBroken)
                        continue;

                    let dist = MathUtils.distSqr(c.tObject.position.x, c.tObject.position.y, player.tObject.position.x, player.tObject.position.y);

                    if (minDist == -1 || dist < minDist) {
                        minDist = dist;
                        x = c.tObject.position.x;
                        y = c.tObject.position.y;
                    }
                }

                if (minDist == -1) {
                    player.ArrowDispose();
                    this.startNextTask();
                }
                else {
                    player.ArrowTo(x, y, "arrowRed");
                }
            }
        } else if (task.type == TaskTypes.Complete) {
            this.nextMissionButton.style.display = "block";
        }
    }

    startNextReplic() {
        this.sidorovichText.innerHTML = "";
        this.sidorovichContainer.style.display = "none";
        this.replicTime = -1;

        let mission = Missions[this.currentMission];

        if (mission.tasks.length <= this.currentTask || this.currentTask < 0)
            return;

        let task = mission.tasks[this.currentTask];

        let nextReplic = this.currentReplic + 1;
        if (task.replics.length <= nextReplic)
            return;

        this.currentReplic = nextReplic;
        let replic = task.replics[this.currentReplic];
        let txt = Localization.Get(replic);
        this.replicTime = 7;
        this.sidorovichText.innerHTML = txt;
        this.sidorovichContainer.style.display = "block";
    }

    /** @returns {Ship} */
    getPlayer() {
        for (let i = 0; i < this.ships.length; i++) {
            let ship = this.ships[i];
            if (ship.controller != null && ship.controller.isPlayer)
                return ship;
        }

        return null;
    }

    onWindowResize() {
        let width = window.innerWidth;
        let height = window.innerHeight;

        this.camera.left = -width / 2;
        this.camera.right = width / 2;
        this.camera.top = height / 2;
        this.camera.bottom = -height / 2;
        this.camera.updateProjectionMatrix();

        this.cameraBg.left = -width / 2;
        this.cameraBg.right = width / 2;
        this.cameraBg.top = height / 2;
        this.cameraBg.bottom = -height / 2;
        this.cameraBg.updateProjectionMatrix();

        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    onDocumentMouseMove(event) {
        event.preventDefault();
        let x = (event.layerX / window.innerWidth) * 2 - 1;
        let y = -(event.layerY / window.innerHeight) * 2 + 1;
        this.mouseVector.set(x, y, 0.5);
    }

    getIntersects(target) {
        this.raycaster.setFromCamera(this.mouseVector, this.camera);
        return this.raycaster.intersectObject(target, true);
    }

    render() {
        let time = Date.now() / 1000;

        for (let i = 0; i < this.groupLoot.children.length; i++) {
            let sprite = CastToSprite(this.groupLoot.children[i]);
            let material = sprite.material;
            let scale = (Math.sin(time * 2) * 0.2 + 1) * scaledTileGlobal;
            sprite.scale.set(scale, scale, 1.0);

            if (sprite == this.undermouseLoot)
                material.color.set('#f00');
            else
                material.color.set('#fff');
        }

        this.renderer.render(this.sceneBg, this.cameraBg);
        this.renderer.clearDepth();
        this.renderer.render(this.scene, this.camera);
    }

    update() {
        let dt = this.clock.getDelta();

        if (this.replicTime > 0) {
            this.replicTime -= dt;
            if (this.replicTime <= 0)
                this.startNextReplic();
        }

        if (this.sidorovichContainer.style.display == "block") {
            if (this.replicTime > 4) {
                this.sidtalkTime -= dt;
                if (this.sidtalkTime < 0) {
                    this.sidtalk.setAttribute("src", "images/sidtalk" + MathUtils.randomInt(1, 4) + ".png");
                    this.sidtalkTime = 0.1;
                }
            }
            else
                this.sidtalk.setAttribute("src", "images/sidtalk1.png");

            this.sideyeTime -= dt;
            if (this.sideyeTime < 0) {
                if (this.prevSidEye == 1) {
                    this.prevSidEye = MathUtils.randomInt(2, 3);
                    this.sideyeTime = 2 + Math.random() * 2;
                }
                else {
                    this.prevSidEye = 1;
                    this.sideyeTime = 0.1;
                }

                this.sideye.setAttribute("src", "images/sideye" + this.prevSidEye + ".png");
            }
        }

        let rareUpdate = false;

        this.rareUpdateCounter += dt;
        if (this.rareUpdateCounter > this.rareUpdateInterval) {
            this.rareUpdateCounter -= this.rareUpdateInterval;
            rareUpdate = true;
        }

        for (let i = 0; i < this.animators.length; i++) {
            let animator = this.animators[i];
            animator.update(1000 * dt);
        }

        this.undermousePreview = null;
        this.undermouseLoot = null;

        let player = this.getPlayer();
        if (player != null) {
            let intersects = this.getIntersects(player.tPartsPreview);
            if (intersects.length > 0) {
                let res = intersects.filter(function (res) {
                    return res && res.object;
                })[0];
                if (res && res.object) {
                    this.undermousePreview = res.object;
                }
            }
        }

        if (player != null && player.tPartsPreview.children.length == 0 && this.undermousePreview == null) {
            let intersects = this.getIntersects(this.groupLoot);

            if (intersects.length > 0) {
                let res = intersects.filter(function (res) {
                    return res && res.object;
                })[0];
                if (res && res.object) {
                    this.undermouseLoot = res.object;
                    let part = this.getPartFromTObject(this.undermouseLoot);
                    this.showInfoBlock(part);
                }
            }
        }

        if (this.undermouseLoot == null)
            this.hideInfoBlock();

        for (let i = this.ships.length - 1; i >= 0; i--) {
            let c = this.ships[i];

            c.Update(dt, rareUpdate);
            c.Control(this.keys, this.ships, dt, rareUpdate);

            if (c.controller != null && c.controller.isPlayer === true) {
                this.camera.position.x = c.tObject.position.x;
                this.camera.position.y = c.tObject.position.y;
                this.bg.material.map.offset.x = c.tObject.position.x / 1400;
                this.bg.material.map.offset.y = c.tObject.position.y / 1400;
                this.bg3.material.map.offset.x = c.tObject.position.x / 1300;
                this.bg3.material.map.offset.y = c.tObject.position.y / 1300;
                this.bg2.material.map.offset.x = c.tObject.position.x / 1000;
                this.bg2.material.map.offset.y = c.tObject.position.y / 1000;

                if (rareUpdate)
                    this.checkTaskComplete();
            }

            if (c.waitDestroy) {
                this.scene.remove(c.tObject);
                this.ships.splice(i, 1);
                c.Dispose();
            }
        }

        for (let i = this.rockets.length - 1; i >= 0; i--) {
            let c = this.rockets[i];
            c.Update(dt);

            if (rareUpdate) {
                this.raycaster.set(c.tObject.position, new THREE.Vector3(0, 0, -1));
                let intersects = this.raycaster.intersectObject(this.scene, true);
                if (intersects.length > 0) {
                    let part = this.getPartFromTObject(intersects[0].object);
                    if (part != null && !part.isBroken && !part.isPreview && c.team != part.team && !part.isLoot) {
                        c.waitDestroy = true;
                    }
                }
            }

            if (c.waitDestroy) {
                if (c.rocketType == RocketTypes.rocket)
                    new Explosion(this.scene, this.effects, c.tObject.position.x, c.tObject.position.y, Explosions.explosion);
                else
                    new Explosion(this.scene, this.effects, c.tObject.position.x, c.tObject.position.y, Explosions.laserHit);
                this.applyDamage(c.tObject.position.x, c.tObject.position.y, c.damageRadius, c.team, c.damage);
                this.scene.remove(c.tObject);
                this.rockets.splice(i, 1);
                c.Dispose();
            }
        }

        for (let i = this.effects.length - 1; i >= 0; i--) {
            let c = this.effects[i];
            c.Update(dt);

            if (c.waitDestroy) {
                this.scene.remove(c.tObject);
                this.effects.splice(i, 1);
                c.Dispose();
            }
        }
    }

    applyDamage(x, y, radius, team, damage) {
        for (let i = 0; i < this.ships.length; i++) {
            let c = this.ships[i];
            if (c.team == team)
                continue;
            c.ApplyDamage(x, y, radius * scaleGlobal, damage);
        }
    }

    getKeyById(code) {
        let key;

        switch (code) {
            case 13:
                key = "ENTER"; break;
            case 32:
                key = "SPACE"; break;
            case 65:
            case 37:
                key = "LEFT"; break;
            case 38:
            case 87:
                key = "UP"; break;
            case 39:
            case 68:
                key = "RIGHT"; break;
            case 40:
            case 83:
                key = "DOWN"; break;
            default:
                key = String.fromCharCode(code).toUpperCase();
        }

        return key;
    }

    handleKey(e, status) {

        if (document.getElementById("shipsBrowser").style.display == "block")
            return;

        let code = e.keyCode;

        // F5
        if (code === 116)
            return;
        // F12
        if (code === 123)
            return;

        let key = this.getKeyById(code);
        e.preventDefault();

        this.keys[key] = status;
    }

    handleClick(e) {
        let player = this.getPlayer();

        if (player != null && player.tPartsPreview.children.length != 0 && this.undermousePreview == null) {
            player.DisposePlaceables();
        }

        if (this.undermousePreview != null) {
            if (player != null) {
                let part = this.getPartFromTObject(this.undermousePreview);
                this.money -= part.partMeta.price;
                this.updateMoneyToSpent();
                player.ApplyPreview(this.undermousePreview);
                this.undermousePreview = null;
            }
        }

        if (this.undermouseLoot != null) {
            let part = this.getPartFromTObject(this.undermouseLoot);
            const partName = part.partName;
            this.undermouseLoot = null;
            if (player != null && part.partMeta.price <= this.money)
                player.ShowPlaceable(partName);
        }
    }

    hideInfoBlock() {
        this.infoBlock.style.display = "none";
    }

    /** 
     * @param {Part} part
     */
    showInfoBlock(part) {
        this.infoBlock.style.display = "block";
        let title = part.partName;
        let keyTitle = "PartName_" + part.partName;
        if (Localization.HasKey(keyTitle))
            title = Localization.Get(keyTitle);
        this.infoBlockTitle.innerHTML = "<b>" + title + "</b>";

        let descr = Localization.Get("Price") + part.partMeta.price.toString() + Localization.Get("PriceCurrency");
        descr += "<hr>";

        let keyDescription = "PartDescr_" + part.partName;
        if (Localization.HasKey(keyDescription))
            descr += Localization.Get(keyDescription);

        if (part.partMeta.canFireNearBlocksOnBreak)
            descr += "<br>" + Localization.Get("CanFireNearBlocksOnBreak");

        this.infoBlockDescription.innerHTML = descr;
    }

    /**
     *
     * @param {THREE.Object3D} tObject
     * @returns {Part}
     */
    getPartFromTObject(tObject) {
        if (tObject == null)
            return null;
        return tObject["part"];
    }

    handleWheel(e) {
        var ev = window.event || e;
        var delta = Math.max(-1, Math.min(1, (ev.wheelDelta || -ev.detail)));

        if (delta === 1)
            this.camera.zoom *= 1.5;
        else
            this.camera.zoom /= 1.5;

        this.camera.updateProjectionMatrix();
    }

    handleBlur(e) {
        this.keys = {};
    }

    getShipLocalStorage() {
        let storage = localStorage["ships"];
        if (storage == null)
            storage = DefaultLocalStorage.Ships;
        else {
            try {
                storage = JSON.parse(storage);
            } catch (err) {
                storage = null;
                console.error(err);
            }
            if (storage == null)
                storage = DefaultLocalStorage.Ships;

            let haveShips = false;
            for (let i in storage) {
                if (storage.hasOwnProperty(i)) {
                    haveShips = true;
                    break;
                }
            }

            if (!haveShips) {
                storage = DefaultLocalStorage.Ships;
            }
        }

        return storage;
    }

    deleteShipFromLocalStorage(name) {
        let storage = this.getShipLocalStorage();
        delete storage[name];
        localStorage["ships"] = JSON.stringify(storage);
        this.createShipsBrowserPanels();
    }

    spawnShipPlayerFromLocalStorage(name) {
        let p = appGlobal.getPlayer();
        if (p != null) {
            p.controller = null;
            p.waitDestroy = true;
        }

        let player = new Ship(appGlobal.scene, appGlobal.ships, "team1", name);
        player.controller = new PlayerShip();

        document.getElementById('shipsBrowser').style.display = 'none';
    }

    spawnShipBotFromLocalStorage(name) {
        let bot = new Ship(appGlobal.scene, appGlobal.ships, "team2", name);
        bot.controller = new BotShip();
        bot.tObject.position.y = 1000;
        return bot;
    }

    spawnShipFromLocalStorage(name) {
        let p = appGlobal.getPlayer();
        if (p == null)
            return;

        let bot = new Ship(appGlobal.scene, appGlobal.ships, "team3", name);
        bot.tObject.position.x = p.tObject.position.x;
        bot.tObject.position.y = p.tObject.position.y;
        bot.Rotate(p.tObject.rotation.z);

        return bot;
    }

    savePlayerShipToLocalStorage() {
        /** @type {any} */
        let t = document.getElementById("saveShipInput")
        let name = t.value;
        if (name == "")
            return;
        appGlobal.getPlayer().Save(name);
        this.createShipsBrowserPanels();
    }

    createShipsBrowserPanels() {
        /** @type {any} */
        let container = document.getElementById("shipsBrowserPanelsContainer");
        container.innerHTML = "";

        let prefab = document.getElementById("shipsBrowserPanelPrefab");
        let storage = this.getShipLocalStorage();

        for (let i in storage) {
            /** @type {any} */
            let p = prefab.cloneNode(true);
            p.style.display = "block";
            p.children[4].innerHTML = i;
            p.children[0].onclick = function (e) { appGlobal.spawnShipBotFromLocalStorage(e.target.parentNode.children[4].innerHTML) }
            p.children[1].onclick = function (e) { appGlobal.spawnShipPlayerFromLocalStorage(e.target.parentNode.children[4].innerHTML) }
            p.children[2].onclick = function (e) { appGlobal.spawnShipFromLocalStorage(e.target.parentNode.children[4].innerHTML) }
            p.children[3].onclick = function (e) { appGlobal.deleteShipFromLocalStorage(e.target.parentNode.children[4].innerHTML) }
            container.appendChild(p);
        }
    }
}

window.onload = function () {
    let app = new App();
    appGlobal = app;

    let domElement = app.renderer.domElement;
    document.body.appendChild(domElement);

    domElement.addEventListener("mousewheel", function (e) { e.preventDefault(); app.handleWheel(e); }, false);
    domElement.addEventListener("DOMMouseScroll", function (e) { e.preventDefault(); app.handleWheel(e); }, false);
    document.addEventListener('keydown', function (e) { app.handleKey(e, true); });
    document.addEventListener('keyup', function (e) { app.handleKey(e, false); });
    window.addEventListener('blur', function (e) { app.handleBlur(e); });
    domElement.oncontextmenu = function (e) { e.preventDefault(); return false; };
    domElement.onclick = function (e) {
        if (document.getElementById("shipsBrowser").style.display == "block")
            return;
        e.preventDefault(); app.handleClick(e); return false;
    };

    AppTextures.callbacks.engineMove = function (t) {
        app.animators.push(new TextureAnimator(t, 8, 1, 5, 100));
    }

    AppTextures.callbacks.rocket = function (t) {
        app.animators.push(new TextureAnimator(t, 4, 1, 4, 100));
    }

    AppTextures.callbacks.gyro_00 = function (t) {
        app.animators.push(new TextureAnimator(t, 16, 1, 16, 100));
    }

    AppTextures.callbacks.engineFire = function (t) {
        app.animators.push(new TextureAnimator(t, 4, 1, 4, 100));
    }

    AppTextures.callbacks.fire = function (t) {
        app.animators.push(new TextureAnimator(t, 4, 1, 4, 100));
    }

    AppTextures.callbacks.back = function (t) {
        t.repeat.set(8, 8);
        t.wrapS = t.wrapT = THREE.RepeatWrapping;
    }

    AppTextures.callbacks.bg2 = function (t) {
        t.repeat.set(8, 8);
        t.wrapS = t.wrapT = THREE.RepeatWrapping;
    }

    AppTextures.callbacks.bg3 = function (t) {
        t.repeat.set(8, 8);
        t.wrapS = t.wrapT = THREE.RepeatWrapping;
    }

    AppTextures.Load();

    PartsMeta[Parts.cabin].connections.push(new Connection(0, -1));
    PartsMeta[Parts.cabin_e].connections.push(new Connection(0, -1));

    PartsMeta[Parts.flip_tilep_01].flipPartName = Parts.tilep_01;
    PartsMeta[Parts.flip_tilep_01].connections.push(new Connection(1, 0));
    PartsMeta[Parts.flip_tilep_01].connections.push(new Connection(0, -1));

    PartsMeta[Parts.tilep_01].flipPartName = Parts.flip_tilep_01;
    PartsMeta[Parts.tilep_01].connections.push(new Connection(-1, 0));
    PartsMeta[Parts.tilep_01].connections.push(new Connection(0, -1));

    PartsMeta[Parts.flip_wing02].flipPartName = Parts.wing02;
    PartsMeta[Parts.flip_wing02].connections.push(new Connection(1, 0));
    PartsMeta[Parts.flip_wing02].connections.push(new Connection(0, -1));

    PartsMeta[Parts.wing02].flipPartName = Parts.flip_wing02;
    PartsMeta[Parts.wing02].connections.push(new Connection(-1, 0));
    PartsMeta[Parts.wing02].connections.push(new Connection(0, -1));

    PartsMeta[Parts.flip_roundplate01].flipPartName = Parts.roundplate01;
    PartsMeta[Parts.flip_roundplate01].connections.push(new Connection(1, 0));
    PartsMeta[Parts.flip_roundplate01].connections.push(new Connection(0, -1));

    PartsMeta[Parts.roundplate01].flipPartName = Parts.flip_roundplate01;
    PartsMeta[Parts.roundplate01].connections.push(new Connection(-1, 0));
    PartsMeta[Parts.roundplate01].connections.push(new Connection(0, -1));

    PartsMeta[Parts.flip_tiler_01].flipPartName = Parts.tiler_01;
    PartsMeta[Parts.flip_tiler_01].connections.push(new Connection(1, 0));
    PartsMeta[Parts.flip_tiler_01].connections.push(new Connection(0, -1));

    PartsMeta[Parts.tiler_01].flipPartName = Parts.flip_tiler_01;
    PartsMeta[Parts.tiler_01].connections.push(new Connection(-1, 0));
    PartsMeta[Parts.tiler_01].connections.push(new Connection(0, -1));

    PartsMeta[Parts.roundplate02].flipPartName = Parts.flip_roundplate02;
    PartsMeta[Parts.roundplate02].connections.push(new Connection(-1, 0));
    PartsMeta[Parts.roundplate02].connections.push(new Connection(0, 1));

    PartsMeta[Parts.flip_roundplate02].flipPartName = Parts.roundplate02;
    PartsMeta[Parts.flip_roundplate02].connections.push(new Connection(1, 0));
    PartsMeta[Parts.flip_roundplate02].connections.push(new Connection(0, 1));

    PartsMeta[Parts.tilep_02].flipPartName = Parts.flip_tilep_02;
    PartsMeta[Parts.tilep_02].connections.push(new Connection(-1, 0));
    PartsMeta[Parts.tilep_02].connections.push(new Connection(0, 1));

    PartsMeta[Parts.flip_tilep_02].flipPartName = Parts.tilep_02;
    PartsMeta[Parts.flip_tilep_02].connections.push(new Connection(1, 0));
    PartsMeta[Parts.flip_tilep_02].connections.push(new Connection(0, 1));

    PartsMeta[Parts.tiler_02].flipPartName = Parts.flip_tiler_02;
    PartsMeta[Parts.tiler_02].connections.push(new Connection(-1, 0));
    PartsMeta[Parts.tiler_02].connections.push(new Connection(0, 1));

    PartsMeta[Parts.flip_tiler_02].flipPartName = Parts.tiler_02;
    PartsMeta[Parts.flip_tiler_02].connections.push(new Connection(1, 0));
    PartsMeta[Parts.flip_tiler_02].connections.push(new Connection(0, 1));

    PartsMeta[Parts.turret_03].connections.push(new Connection(-1, 0));
    PartsMeta[Parts.turret_03].fireRate = 0.3;
    PartsMeta[Parts.turret_03].flipPartName = Parts.flip_turret_03;
    PartsMeta[Parts.turret_03].price = 40;

    PartsMeta[Parts.flip_turret_03].connections.push(new Connection(1, 0));
    PartsMeta[Parts.flip_turret_03].fireRate = 0.3;
    PartsMeta[Parts.flip_turret_03].flipPartName = Parts.turret_03;

    PartsMeta[Parts.turret_02].connections.push(new Connection(0, -1));
    PartsMeta[Parts.turret_02].fireRate = 0.3;
    PartsMeta[Parts.turret_02].price = 40;

    PartsMeta[Parts.bridge].connections.push(new Connection(0, -1));
    PartsMeta[Parts.bridge].connections.push(new Connection(0, 1));

    PartsMeta[Parts.bridgeT].connections.push(new Connection(0, 1));
    PartsMeta[Parts.bridgeT].connections.push(new Connection(-1, 0));
    PartsMeta[Parts.bridgeT].connections.push(new Connection(1, 0));

    PartsMeta[Parts.engine].connections.push(new Connection(0, 1));
    PartsMeta[Parts.engine].acceleration = 20;
    PartsMeta[Parts.engine].effects.push(new PartEffect(0, -scaledTileGlobal, "engineFire"));
    PartsMeta[Parts.engine].blockConnections.push(new Connection(0, -1));
    PartsMeta[Parts.engine].canFireNearBlocksOnBreak = true;
    PartsMeta[Parts.engine].price = 50;

    PartsMeta[Parts.engine_e].connections.push(new Connection(0, 1));
    PartsMeta[Parts.engine_e].acceleration = 20;
    PartsMeta[Parts.engine_e].effects.push(new PartEffect(0, -scaledTileGlobal, "engineFire"));
    PartsMeta[Parts.engine_e].blockConnections.push(new Connection(0, -1));
    PartsMeta[Parts.engine_e].canFireNearBlocksOnBreak = true;
    PartsMeta[Parts.engine_e].price = 50;

    PartsMeta[Parts.hub].AddAllConnections();
    PartsMeta[Parts.hcube].AddAllConnections();
    PartsMeta[Parts.block].AddAllConnections();
    PartsMeta[Parts.bridge_cross].AddAllConnections();

    PartsMeta[Parts.gyro_00].AddAllConnections();
    PartsMeta[Parts.gyro_00].rotateSpeed = 7;
    PartsMeta[Parts.gyro_00].canFireNearBlocksOnBreak = true;
    PartsMeta[Parts.gyro_00].price = 30;

    PartsMeta[Parts.canon].AddAllConnections();
    PartsMeta[Parts.canon].fireRate = 5;
    PartsMeta[Parts.canon].fireMiniCount = 3;
    PartsMeta[Parts.canon].fireMiniDelay = 0.2;
    PartsMeta[Parts.canon].fireRocketType = RocketTypes.rocket;
    PartsMeta[Parts.canon].canFireNearBlocksOnBreak = true;

    PartsMeta[Parts.laser].AddAllConnections();
    PartsMeta[Parts.laser].canFireNearBlocksOnBreak = true;

    app.InitialSpawn();

    window.addEventListener("resize", function () { app.onWindowResize() }, false);
    window.addEventListener("mousemove", function (e) { app.onDocumentMouseMove(e); }, false);

    let stats = Stats();
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.top = '0';
    document.body.appendChild(stats.domElement);

    // let ctx = domElement.getContext('2d');
    // ctx.imageSmoothingEnabled = false;

    let animationFrame;
    animationFrame = function animationFrame() {
        requestAnimationFrame(animationFrame);
        stats.update();
        app.update();
        app.render();
    }
    animationFrame();

    appGlobal.createShipsBrowserPanels();
}