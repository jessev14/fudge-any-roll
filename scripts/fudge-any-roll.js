import { FudgeRollConfig } from './FudgeRollConfig.js';

export const moduleID = 'fudge-any-roll';

export const lg = x => console.log(x);


Hooks.once('init', () => {
    /**
     * fudge = {
     *  id: '20240221',
     *  type: 'total',
     *  d: 20,
     *  operator: '>=',
     *  value: 18,
     *  user: 'a1b2c3',
     *  active: true    
     * }
     */
    game.settings.register(moduleID, 'fudges', {
        scope: 'world',
        type: Array,
        default: []
    });

    libWrapper.register(moduleID, 'Roll.prototype.evaluate', fudgeRoll, 'WRAPPER');

    Handlebars.registerHelper('add', function (a, b) {
        return a + b;
    });
    
    game.socket.on(`module.${moduleID}`, fudges => {
        lg({fudges})
        if (game.user !== game.users.activeGM) return;
    
        return game.settings.set(moduleID, 'fudges', fudges);
    });
});


Hooks.on('renderChatLog', (app, [html], appData) => {
    if (!game.user.isGM) return;

    const chatControls = html.querySelector('#chat-controls');
    const fudgeConfigButton = document.createElement('label');
    fudgeConfigButton.classList.add('chat-control-icon');
    fudgeConfigButton.innerHTML = `<a><i class="fas fa-poop"></i></a>`;
    fudgeConfigButton.onclick = () => new FudgeRollConfig().render(true);

    chatControls.prepend(fudgeConfigButton);
});


async function fudgeRoll(wrapped, ...args) {
    const res = await wrapped(...args);
    if (this.fudged) return res;

    const fudges = game.settings.get(moduleID, 'fudges');
    this._evaluated = false;
    for (const die of this.dice) {
        for (let i = 0; i < die.number; i++) {
            const targetFudge = fudges.find(f => f.active && f.user === game.user.id && f.d === die.faces);
            if (!targetFudge) break;

            let newDieRoll, counter = 0;
            while (checkApplyFudge(targetFudge, die.results[i].result)) {
                if (counter > 1000) break;

                newDieRoll = new Roll(`1d${die.faces}`);
                newDieRoll.fudged = true;
                await newDieRoll.roll();
                const res = newDieRoll.dice[0].results[0].result;
                die.results[i].result = res;
            }
            targetFudge.active = false;
        }
    }

    if (game.user.isGM) await game.settings.set(moduleID, 'fudges', fudges);
    else game.socket.emit(`module.${moduleID}`, fudges);

    this.fudged = true;
    return this.roll();
}

function checkApplyFudge(fudge, res) {
    const { operator, value } = fudge;

    if (operator.includes('=') && res === value) return false;
    if (operator.includes('<') && res < value) return false;
    if (operator.includes('>') && res > value) return false;

    return true;
}

