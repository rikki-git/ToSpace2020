class PartMeta {
    constructor() {
        this.materialMove = null;
        this.materialIdle = null;
        /** @type {Connection[]} */
        this.connections = [];
        this.fireRate = 0;
        this.flipPartName = null;
        this.maxSpeedBoost = 0;
        this.acceleration = 0;
        this.rotateSpeed = 0;
        this.mass = 0.5;
    }

    AddAllConnections() {
        this.connections.push(new Connection(-1, 0));
        this.connections.push(new Connection(1, 0));
        this.connections.push(new Connection(0, -1));
        this.connections.push(new Connection(0, 1));
    }
}