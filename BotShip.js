class BotShip {
    constructor() {
        this.isPlayer = false;
        /** @type {Ship} */
        this.target = null;
        this.attackTime = 0;
        this.leaveTime = 0;
        this.leaveDir = 1;
        this.leaveAngleTime = 1;
        this.attackWait = Math.random() * 5 + 3;
        this.requreFire = false;
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

        for (let i = 0; i < ships.length; i++) {
            let c = ships[i];
            if (c.team == me.team)
                continue;
            if (c.isBroken)
                continue;
            allTargets.push(c);
        }

        this.target = allTargets[MathUtils.randomInt(0, allTargets.length - 1)];
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

        if (this.leaveTime > 0) {
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
            this.leaveTime = 10;
            this.leaveAngleTime = 1;
            this.leaveDir = Math.random() > 0.5 ? -1 : 1;
        }
        else {
            if (dist > 200) {
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
                this.attackTime += dt;
                this.requreFire = true;
            }
            else if (dist < 1500) {
                this.attackTime += dt * 0.5;
                me.mover.dSpeed = 0;
                this.requreFire = true;
            }
            else
                me.mover.dSpeed = 1;
        }
    }
}
