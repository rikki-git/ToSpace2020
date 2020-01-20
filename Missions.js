const TaskTypes = {
    None: "None",
    GoTo: "GoTo",
    Kill: "Kill",
    Complete: "Complete"
}

const Replics = {
    Ru: {
        TutorialStart1: "Приветствую, командир! Добро пожаловать в первую (и единственную) космобригаду планеты М",
        TutorialStart2: "Наш флот никогда не славился мощью, но всегда делал упор на профессионализм, поэтому займёмся подготовкой",
        TutorialStart3: "Твоя задача: подготовить корабль и достигнуть заданных точек",
        TutorialShoot1: "Отлично! Вижу курс манёвров ты усвоил как надо",
        TutorialShoot2: "Теперь посмотрим как ты стреляешь. У нас тут снова дроны нарушители. Вот на них и отработай стрельбу",
        TutorialComplete1: "Обстановка в галактике сейчас непростая, поэтому такой талантливый командир как ты нам сейчас очень пригодится.",
        TutorialComplete2: "А пока что отбой!"
    },

    Get: function (key) {
        return this.Ru[key]; //TODO
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
    */
    constructor(tasks, money, parts) {
        this.tasks = tasks;
        this.parts = parts;
        this.money = money;
    }
}

/** @type {Object.<string, Mission>} */
let Missions = {}

function CreateMissions() {
    Missions = {
        Editor: new Mission([], 0, []),
        Tutorial: new Mission(
            [
                MissionTask.GoTo(1000, 1000, ["TutorialStart1", "TutorialStart2", "TutorialStart3"]),
                MissionTask.GoTo(-1000, 2000, []),
                MissionTask.GoTo(1000, 3000, ["TutorialShoot1"]),
                MissionTask.Kill(4000, 3000, ["TutorialShoot2"], ["Drone"], 2),
                MissionTask.Complete(["TutorialComplete1", "TutorialComplete2"])
            ],
            100,
            [
                Parts.block, Parts.engine, Parts.gyro_00, Parts.turret_02
            ]),
    }
}