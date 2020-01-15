class PlayerShip {
    constructor() {
        this.isPlayer = true;
        this.requreFire = false;
    }

    /** @param {Ship} ship */
    Control(ship, keys, ships, dt, isRareUpdate) {
        let dSpeed = 0;
        let angle = 0;
        this.requreFire = false;

        if (keys["UP"])
            dSpeed += 1;
        if (keys["DOWN"])
            dSpeed -= 1;
        if (keys["Q"])
            angle += 1;
        if (keys["E"])
            angle -= 1;
        if (keys["SPACE"])
            this.requreFire = true;

        ship.mover.dSpeed = dSpeed;
        ship.mover.deltaAngle = angle;
    }
}
