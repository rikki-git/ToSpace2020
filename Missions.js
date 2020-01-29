const TaskTypes = {
    None: "None",
    GoTo: "GoTo",
    Kill: "Kill",
    Complete: "Complete"
}

const BotTypes = {
    None: "None",
    Default: "Default",
    Static: "Static",
}

class ShipData {
    /**
    * @param {string} name
    * @param {number} x
    * @param {number} y
    * @param {string} team
    * @param {string} botType
    */
    constructor(name, x, y, team, botType) {
        this.name = name;
        this.x = x;
        this.y = y;
        this.team = team;
        this.botType = botType;
    }
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
        /** @type {number[]} */
        this.shipsCount = [];

        /** @type {ShipData[]} */
        this.initialShips = [];
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
   * @param {number[]} count
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

const Mission1Start = MissionTask.GoTo(0, 1000, ["Mission1_1", "Mission1_3"]);
Mission1Start.initialShips.push(new ShipData("Fighter-1", -400, 0, playerTeam, BotTypes.Default));
Mission1Start.initialShips.push(new ShipData("Fighter-1", 400, 0, playerTeam, BotTypes.Default));

const Mision2_tasks = [
    MissionTask.GoTo(0, 5000, ["Mission2_1", "Mission2_2"]),
]

for (let i = 1; i < 4; i++) {
    const dist = 1200;

    let replics = [];

    if (i == 1)
        replics.push("Mission2_3")

    let task = MissionTask.GoTo(0, 5000 + i * dist, replics);

    if (i == 1) {
        task.initialShips.push(new ShipData("PRO-1", 600, 5000 + i * 1 * dist, playerTeam, BotTypes.Static));
        task.initialShips.push(new ShipData("PRO-1", 600, 5000 + i * 2 * dist, playerTeam, BotTypes.Static));
        task.initialShips.push(new ShipData("PRO-1", 600, 5000 + i * 3 * dist, playerTeam, BotTypes.Static));
    }

    Mision2_tasks.push(task);

    let task2 = MissionTask.Kill(0, 0, [], [], []);
    task2.initialShips.push(new ShipData("R-1", 5000, 5000 + i * dist, enemyTeam, BotTypes.Default));
    Mision2_tasks.push(task2);
}

// WAVE 1
const Mission2_wave1 = MissionTask.Kill(0, 0, ["Mission2_4"], [], []);
for (let i = 0; i < 3; i++) {
    const dist = 3000;
    Mission2_wave1.initialShips.push(new ShipData("R-1", 7000, 5000 + i * dist, enemyTeam, BotTypes.Default));
}
for (let i = 0; i < 2; i++) {
    const dist = 4000;
    Mission2_wave1.initialShips.push(new ShipData("NB-1", 10000, 5000 + i * dist, enemyTeam, BotTypes.Default));
}
Mision2_tasks.push(Mission2_wave1);

// WAVE 2
const Mission2_wave2 = MissionTask.Kill(0, 0, ["Mission2_5"], [], []);
for (let i = 0; i < 1; i++) {
    const dist = 2000;
    Mission2_wave2.initialShips.push(new ShipData("Red-1", 7000, 5000 + i * dist, enemyTeam, BotTypes.Default));
    Mission2_wave2.initialShips.push(new ShipData("Blue-1", -5000, 5000 + i * dist, playerTeam, BotTypes.Default));
}
for (let i = 0; i < 2; i++) {
    const dist = 2000;
    Mission2_wave2.initialShips.push(new ShipData("NB-1", 10000, 5000 + i * dist, enemyTeam, BotTypes.Default));
    Mission2_wave2.initialShips.push(new ShipData("Fighter-1", -8000, 5000 + i * dist, playerTeam, BotTypes.Default));
}
Mision2_tasks.push(Mission2_wave2);

// WAVE 3
const Mission2_wave3 = MissionTask.Kill(0, 0, [], [], []);
Mission2_wave3.initialShips.push(new ShipData("Red-1", 7000, 8000, enemyTeam, BotTypes.Default));
Mission2_wave3.initialShips.push(new ShipData("NB-2", 10000, 6000, enemyTeam, BotTypes.Default));
Mission2_wave3.initialShips.push(new ShipData("NB-2", 10000, 9000, enemyTeam, BotTypes.Default));
Mision2_tasks.push(Mission2_wave3);

// WAVE 4
const Mission2_wave4 = MissionTask.Kill(0, 0, [], [], []);
Mission2_wave4.initialShips.push(new ShipData("Red-1", 10000, 5000, enemyTeam, BotTypes.Default));
Mision2_tasks.push(Mission2_wave4);

Mision2_tasks.push(MissionTask.Complete(["Mission2_f"]));

function CreateMissions() {
    Missions = {
        Editor: new Mission([], 99999, [], "Editor"),
        Tutorial: new Mission(
            [
                MissionTask.GoTo(5000, 5000, ["TutorialStart1", "TutorialStart2", "TutorialStart3"]),
                MissionTask.GoTo(-1000, 5000, []),
                MissionTask.GoTo(1000, 3000, ["TutorialShoot1"]),
                MissionTask.Kill(4000, 3000, ["TutorialShoot2"], ["Drone"], [2]),
                MissionTask.Complete(["TutorialComplete1", "TutorialComplete2"])
            ],
            200,
            [
                Parts.block, Parts.engine, Parts.gyro_00, Parts.turret_02
            ],
            "Mission1"),
        Mission1: new Mission(
            [
                Mission1Start,
                MissionTask.Kill(0, 4000, [], ["NB-1"], [3]),
                MissionTask.Kill(0, 8000, ["Mission1_busHere"], ["NB-1", "Bus-1"], [3, 1]),
                MissionTask.Complete(["Mission1_4"])
            ],
            500,
            [
                Parts.block, Parts.engine, Parts.gyro_00, Parts.turret_02, Parts.turret_03, Parts.heal
            ],
            "Mission2"),
        Mission2: new Mission(
            Mision2_tasks,
            500,
            [
                Parts.block, Parts.engine, Parts.gyro_00, Parts.turret_02, Parts.canon, Parts.heal
            ],
            "Editor"
        )
    }
}