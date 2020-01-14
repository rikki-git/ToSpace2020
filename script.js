'use strict';

/** @type {App} */
let appGlobal = null;
const scaleGlobal = 4;
const tileGlobal = 16;
const scaledTileGlobal = scaleGlobal * tileGlobal;

/** @type {Object.<string, PartMeta>} */
const PartsMeta = {}

const Parts = {
    cabin: "cabin",
    turretSideLeft: "turretSideLeft",
    turretSideRight: "turretSideRight",
    bridge: "bridge",
    bridgeT: "bridgeT",
    engine: "engine",
    hub: "hub",
    bridge_cross: "bridge_cross",
    tilep_00: "tilep_00",
    tilep_01: "tilep_01"
}

class App {
    constructor() {
        for (let i in Parts) {
            let meta = new PartMeta();
            PartsMeta[i] = meta;
        }

        let width = window.innerWidth;
        let height = window.innerHeight;
        this.camera = new THREE.OrthographicCamera(- width / 2, width / 2, height / 2, - height / 2, 0, 10);// new THREE.PerspectiveCamera(60, width / height, 1, 2100);
        this.camera.position.z = 10;
        this.cameraOrtho = new THREE.OrthographicCamera(- width / 2, width / 2, height / 2, - height / 2, 0, 10);
        this.cameraOrtho.position.z = 10;

        this.scene = new THREE.Scene();
        this.sceneOrtho = new THREE.Scene();

        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.autoClear = false; // To allow render overlay on top of sprited sphere

        this.groupLoot = new THREE.Group();
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
    }

    InitialSpawn() {
        const amount = 100;
        const radius = 5000;

        let partsArr = [];
        for (var i in Parts)
            partsArr.push(i);

        for (let a = 0; a < amount; a++) {
            let x = Math.random() - 0.5;
            let y = Math.random() - 0.5;

            let partName = Parts.hub;
            let random = MathUtils.randomInt(0, partsArr.length - 1);
            partName = Parts[partsArr[random]];

            let part = new Part(partName, this.groupLoot, x, y);
            part.tObject.position.normalize();
            part.tObject.position.multiplyScalar(Math.random() * radius);

            part.isLoot = true;
            part.tObject.part = part;
        }

        this.scene.add(this.groupLoot);

        let player = new Ship(this.scene, this.ships);
        player.controller = new PlayerShip();
        //player.tObject.position.z = 1;

        new Ship(this.scene, this.ships);

        //let test = new THREE.Sprite(AppTextures.materials.explosion.clone());
        //let imageWidth = test.material.map.image.width;
        //let imageHeight = test.material.map.image.height;
        //test.scale.set(scaleGlobal * imageHeight, scaleGlobal * imageHeight, 1.0);
        //this.scene.add(test);
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

    createHUDSprites(texture) {
        this.updateHUDSprites();
    }

    updateHUDSprites() {
    }

    onWindowResize() {
        let width = window.innerWidth;
        let height = window.innerHeight;

        this.camera.left = - width / 2;
        this.camera.right = width / 2;
        this.camera.top = height / 2;
        this.camera.bottom = - height / 2;
        this.camera.updateProjectionMatrix();

        this.cameraOrtho.left = - width / 2;
        this.cameraOrtho.right = width / 2;
        this.cameraOrtho.top = height / 2;
        this.cameraOrtho.bottom = - height / 2;
        this.cameraOrtho.updateProjectionMatrix();

        this.updateHUDSprites();
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
            let sprite = this.groupLoot.children[i];
            let material = sprite.material;
            let scale = Math.sin(time * 2) * 0.4 + scaleGlobal;
            let imageWidth = 1;
            let imageHeight = 1;
            if (material.map && material.map.image && material.map.image.width) {
                imageWidth = material.map.image.width;
                imageHeight = material.map.image.height;
            }
            sprite.scale.set(scale * imageWidth, scale * imageHeight, 1.0);

            if (sprite == this.undermouseLoot)
                material.color.set('#f00');
            else
                material.color.set('#fff');
        }

        this.renderer.setClearColor(0x160428, 1);
        this.renderer.clear(true);
        this.renderer.render(this.scene, this.camera);
        this.renderer.clearDepth();
        this.renderer.render(this.sceneOrtho, this.cameraOrtho);
    }

    update() {
        let dt = this.clock.getDelta();

        if (this.engineAnimator != null)
            this.engineAnimator.update(1000 * dt);

        if (this.rocketAnimator != null)
            this.rocketAnimator.update(1000 * dt);

        if (this.testAnimator != null)
            this.testAnimator.update(1000 * dt);

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
                }
            }
        }

        for (let i = 0; i < this.ships.length; i++) {
            let c = this.ships[i];

            c.Update(dt);
            c.Control(this.keys);

            if (c.controller != null && c.controller.isPlayer === true) {
                this.camera.position.x = c.tObject.position.x;
                this.camera.position.y = c.tObject.position.y;
            }
        }

        for (let i = this.rockets.length - 1; i >= 0; i--) {
            let c = this.rockets[i];
            c.Update(dt);

            if (c.waitDestroy) {
                new Explosion(this.scene, this.effects, c.tObject.position.x, c.tObject.position.y);
                this.applyDamage(c.tObject.position.x, c.tObject.position.y, 14);
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

    applyDamage(x, y, radius) {
        for (let i = 0; i < this.ships.length; i++) {
            let c = this.ships[i];
            c.ApplyDamage(x, y, radius * scaleGlobal);
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
                player.ApplyPreview(this.undermousePreview);
                this.undermousePreview = null;
            }
        }

        if (this.undermouseLoot != null) {
            const partName = this.undermouseLoot.part.partName;
            this.groupLoot.remove(this.undermouseLoot);
            this.undermouseLoot.part.Dispose();
            this.undermouseLoot = null;

            if (player != null)
                player.ShowPlaceable(partName);
        }
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
    domElement.onclick = function (e) { e.preventDefault(); app.handleClick(e); return false; };

    AppTextures.callbacks.sprite0 = function (t) {
        app.createHUDSprites(t);
    }

    AppTextures.callbacks.engineMove = function (t) {
        app.engineAnimator = new TextureAnimator(t, 8, 1, 5, 100);
    }

    AppTextures.callbacks.rocket = function (t) {
        app.rocketAnimator = new TextureAnimator(t, 4, 1, 4, 100);
    }

    AppTextures.callbacks.explosion = function (t) {
        //app.testAnimator = new TextureAnimator(AppTextures.three.explosion, 8, 1, 7, 40);
    }

    AppTextures.Load();

    PartsMeta[Parts.cabin].connections.push(new Connection(0, -1));

    PartsMeta[Parts.tilep_00].flipPartName = Parts.tilep_01;
    PartsMeta[Parts.tilep_00].connections.push(new Connection(1, 0));
    PartsMeta[Parts.tilep_00].connections.push(new Connection(0, -1));

    PartsMeta[Parts.tilep_01].flipPartName = Parts.tilep_00;
    PartsMeta[Parts.tilep_01].connections.push(new Connection(-1, 0));
    PartsMeta[Parts.tilep_01].connections.push(new Connection(0, -1));

    PartsMeta[Parts.turretSideLeft].connections.push(new Connection(1, 0));
    PartsMeta[Parts.turretSideLeft].fireRate = 1;
    PartsMeta[Parts.turretSideLeft].flipPartName = Parts.turretSideRight;

    PartsMeta[Parts.turretSideRight].connections.push(new Connection(-1, 0));
    PartsMeta[Parts.turretSideRight].fireRate = 1;
    PartsMeta[Parts.turretSideRight].flipPartName = Parts.turretSideLeft;

    PartsMeta[Parts.bridge].connections.push(new Connection(0, -1));
    PartsMeta[Parts.bridge].connections.push(new Connection(0, 1));

    PartsMeta[Parts.bridgeT].connections.push(new Connection(0, 1));
    PartsMeta[Parts.bridgeT].connections.push(new Connection(-1, 0));
    PartsMeta[Parts.bridgeT].connections.push(new Connection(1, 0));

    PartsMeta[Parts.engine].connections.push(new Connection(0, 1));
    PartsMeta[Parts.engine].materialIdle = "engineIdle";
    PartsMeta[Parts.engine].materialMove = "engineIdle";
    PartsMeta[Parts.engine].maxSpeedBoost = 200;
    PartsMeta[Parts.engine].acceleration = 500;

    PartsMeta[Parts.hub].connections.push(new Connection(-1, 0));
    PartsMeta[Parts.hub].connections.push(new Connection(1, 0));
    PartsMeta[Parts.hub].connections.push(new Connection(0, -1));
    PartsMeta[Parts.hub].connections.push(new Connection(0, 1));

    PartsMeta[Parts.bridge_cross].connections.push(new Connection(-1, 0));
    PartsMeta[Parts.bridge_cross].connections.push(new Connection(1, 0));
    PartsMeta[Parts.bridge_cross].connections.push(new Connection(0, -1));
    PartsMeta[Parts.bridge_cross].connections.push(new Connection(0, 1));

    app.InitialSpawn();

    window.addEventListener("resize", function () { app.onWindowResize() }, false);
    window.addEventListener("mousemove", function (e) { app.onDocumentMouseMove(e); }, false);

    let stats = new Stats();
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.top = '0';
    stats.domElement.style.zIndex = 100;
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
}