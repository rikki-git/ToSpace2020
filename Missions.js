const TaskTypes = {
    None: "None",
    GoTo: "GoTo",
    Kill: "Kill",
    Complete: "Complete"
}

class MissionTask {
    /**
     * @param {string} type
     * @param {number} x
     * @param {number} y
     * @param {string[]} replics
     */
    constructor(type, x, y, replics) {
        this.type = type;
        this.replics = replics;
        this.x = x;
        this.y = y;
        /** @type {string[]} */
        this.ships = [];
        this.shipsCount = 0;
    }

    /**
    * @param {number} x
    * @param {number} y
    * @param {string[]} replics
    */
    static GoTo(x, y, replics) {
        return new MissionTask(TaskTypes.GoTo, x, y, replics);
    }

    /**
   * @param {number} x
   * @param {number} y
   * @param {string[]} replics
   * @param {string[]} shipTypes
   * @param {number} count
   */
    static Kill(x, y, replics, shipTypes, count) {
        let tasks = new MissionTask(TaskTypes.Kill, x, y, replics);
        tasks.ships = shipTypes;
        tasks.shipsCount = count;
        return tasks;
    }

    /**
    * @param {string[]} replics
    */
    static Complete(replics) {
        return new MissionTask(TaskTypes.Complete, 0, 0, replics);
    }
}

class Mission {
    /**
    * @param {MissionTask[]} tasks
    * @param {number} money
    * @param {any[]} parts
    * @param {string} nextMission
    */
    constructor(tasks, money, parts, nextMission) {
        this.tasks = tasks;
        this.parts = parts;
        this.money = money;
        this.nextMission = nextMission;
    }
}

/** @type {Object.<string, Mission>} */
let Missions = null;

function CreateMissions() {
    Missions = {
        Editor: new Mission([], 99999, [], "Editor"),
        Tutorial: new Mission(
            [
                MissionTask.GoTo(1000, 1000, ["TutorialStart1", "TutorialStart2", "TutorialStart3"]),
                MissionTask.GoTo(-1000, 2000, []),
                MissionTask.GoTo(1000, 3000, ["TutorialShoot1"]),
                MissionTask.Kill(4000, 3000, ["TutorialShoot2"], ["Drone"], 2),
                MissionTask.Complete(["TutorialComplete1", "TutorialComplete2"])
            ],
            200,
            [
                Parts.block, Parts.engine, Parts.gyro_00, Parts.turret_02
            ],
            "Mission1"),
        Mission1: new Mission(
            [
                MissionTask.GoTo(0, 1000, ["Mission1_1", "Mission1_2", "Mission1_3"]),
                MissionTask.Kill(0, 3000, [], ["NB-1"], 2),
                MissionTask.Kill(0, 6000, [], ["NB-2"], 3),
                MissionTask.Complete(["Mission1_4", "Mission1_5"])
            ],
            500,
            [Parts.block, Parts.engine, Parts.gyro_00, Parts.turret_02],
            "Editor")
    }
}