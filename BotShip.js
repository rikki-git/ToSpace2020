class BotShip {
    constructor() {
        this.isPlayer = false;
        /** @type {Ship} */
        this.target = null;
        this.attackTime = 0;
        this.leaveTime = 0;
        this.leaveDir = 1;
        this.leaveAngleTime = 1;
        this.attackWait = Math.random() * 8 + 3;
        this.requreFire = false;
        this.canMove = true;
    }

    /**
    * @param {Ship} me
    * @param {Ship[]} ships
    */
    ValidateTarget(me, ships) {
        if (this.target != null && !this.target.isBroken)
            return;
        this.target = null;

        let allTargets = [];
        let minDist = -1;
        let minIndx = -1;

        for (let i = 0; i < ships.length; i++) {
            let c = ships[i];
            if (c.team == me.team)
                continue;
            if (c.isBroken)
                continue;
            allTargets.push(c);

            let dist = MathUtils.distSqr(c.tObject.position.x, c.tObject.position.y, me.tObject.position.x, me.tObject.position.y);

            if (minDist < 0 || dist < minDist) {
                minDist = dist;
                minIndx = allTargets.length - 1;
            }
        }

        if (minIndx >= 0)
            this.target = allTargets[minIndx];
    }

    /**
    * @param {Ship} me
    * @param {Ship[]} ships
    */
    Control(me, keys, ships, dt, isRareUpdate) {
        if (!isRareUpdate)
            return;

        this.requreFire = false;
        dt = appGlobal.rareUpdateInterval;

        this.ValidateTarget(me, ships);
        if (this.target == null)
            return;

        if (this.canMove && this.leaveTime > 0) {
            this.leaveTime -= dt;

            if (this.leaveAngleTime > 0) {
                this.leaveAngleTime -= dt;
                me.mover.deltaAngle = this.leaveDir;
            }
            else {
                me.mover.deltaAngle = 0;
            }

            me.mover.dSpeed = 1;
            this.target = null;
            return;
        }

        let dist = this.target.tObject.position.distanceTo(me.tObject.position);

        if (this.attackTime > this.attackWait) {
            this.attackTime = 0;
            this.leaveTime = 7;
            this.leaveAngleTime = 1;
            this.leaveDir = Math.random() > 0.5 ? -1 : 1;
        }
        else {
            if (!this.canMove || dist > 200) {
                let targetAngle = Math.atan2(this.target.tObject.position.y - me.tObject.position.y, this.target.tObject.position.x - me.tObject.position.x);
                targetAngle -= Math.PI * 0.5;
                targetAngle = targetAngle % (Math.PI * 2);

                let myAngle = me.tObject.rotation.z;
                myAngle = myAngle % (Math.PI * 2);

                let angleDelta = Math.abs(targetAngle - myAngle);
                if (angleDelta > Math.PI) {
                    if (myAngle > targetAngle) {
                        myAngle -= Math.PI * 2;
                    }
                    else {
                        myAngle += Math.PI * 2;
                    }
                }

                if (Math.abs(targetAngle - myAngle) > 0.1) {
                    if (targetAngle > myAngle)
                        me.mover.deltaAngle = 1;
                    else
                        me.mover.deltaAngle = -1;
                }
                else
                    me.mover.deltaAngle = 0;
            }
            else
                me.mover.deltaAngle = 0;

            if (dist < 1000) {
                if (this.canMove)
                    this.attackTime += dt;
                this.requreFire = true;
            }
            else if (dist < 1500) {
                if (this.canMove)
                    this.attackTime += dt * 0.2;
                me.mover.dSpeed = 0;
                this.requreFire = true;
            }
            else {
                if (this.canMove)
                    me.mover.dSpeed = 1;
            }
        }
    }
}
