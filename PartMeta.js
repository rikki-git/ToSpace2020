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
    }
}