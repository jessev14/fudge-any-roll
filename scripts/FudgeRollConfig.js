import { moduleID } from "./fudge-any-roll.js";

export class FudgeRollConfig extends FormApplication {
    constructor(options = {}) {
        super(null, options);
    }

    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            id: 'fudge-any-roll-config',
            title: 'Configure Fudges',
            template: `modules/${moduleID}/templates/fudge-config.hbs`,
            height: 400,
            width: 600
        });
    }

    getData(options = {}) {
        const data = {};
        data.fudges = game.settings.get(moduleID, 'fudges');
        for (const fudge of data.fudges) {
            fudge.userName = game.users.get(fudge.user).name;
            fudge.rule = `d${fudge.d} ${fudge.operator} ${fudge.value}`;
        }
        data.users = game.users.contents;

        console.log({data})
        return data;
    }

    activateListeners([html]) {
        // delete fudges: get clicked fudge, get index in 'fudges' module setting, splice out, re-set 'fudges' setting

        // dis/activate fudges: checkbox onchange, get clicked fudge, get index in 'fudges' module setting, toggle active property, re-set 'fudges' setting

        // create fudges: build fudge object from inputs, get 'fudges' module setting, push new fudge object, re-set 'fudges' setting

        // cancel 
    }
}