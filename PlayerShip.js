class PlayerShip {
    constructor() {
        this.isPlayer = true;
    }

    /** @param {Ship} ship */
    Control(ship, keys, ships, dt) {
        let dSpeed = 0;
        let angle = 0;

        if (keys["UP"])
            dSpeed += 1;
        if (keys["DOWN"])
            dSpeed -= 1;
        if (keys["Q"])
            angle += 1;
        if (keys["E"])
            angle -= 1;

        ship.mover.dSpeed = dSpeed;
        ship.mover.deltaAngle = angle;
    }
}
