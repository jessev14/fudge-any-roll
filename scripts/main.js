import { Config } from './Config.js';

export const moduleID = 'too-many-faces';

export const lg = x => console.log(x);


Hooks.once('init', () => {
    /**
     * rule = {
     *  id: '20240221',
     *  d: 20,
     *  operator: '>=',
     *  value: 18,
     *  user: 'a1b2c3',
     *  active: true    
     * }
     */
    game.settings.register(moduleID, 'rules', {
        scope: 'world',
        type: Array,
        default: []
    });

    libWrapper.register(moduleID, 'Roll.prototype.evaluate', ruleRoll, 'WRAPPER');

    Handlebars.registerHelper('add', function (a, b) {
        return a + b;
    });

    game.socket.on(`module.${moduleID}`, rules => {
        if (game.user !== game.users.activeGM) return;

        return game.settings.set(moduleID, 'rules', rules);
    });
});


Hooks.on('renderChatLog', (app, [html], appData) => {
    if (!game.user.isGM) return;

    const chatControls = html.querySelector('#chat-controls');
    const ruleConfigButton = document.createElement('label');
    ruleConfigButton.classList.add('chat-control-icon');
    ruleConfigButton.innerHTML = `<a><i class="fas fa-poop"></i></a>`;
    ruleConfigButton.onclick = () => new Config().render(true);

    chatControls.prepend(ruleConfigButton);
});


async function ruleRoll(wrapped, ...args) {
    const res = await wrapped(...args);
    if (this.ruled) return res;

    this._evaluated = false;
    const rules = game.settings.get(moduleID, 'rules');
    for (const die of this.dice) {
        for (let i = 0; i < die.number; i++) {
            const targetRule = rules.find(r => r.active && (r.user === 'any' || r.user === game.user.id) && r.d === die.faces);
            if (!targetRule) break;

            let newDieRoll, counter = 0;
            while (!checkApplyRule(targetRule, die.results[i].result)) {
                if (counter > 1000) break;

                newDieRoll = new Roll(`1d${die.faces}`);
                newDieRoll.ruled = true;
                await newDieRoll.roll();
                die.results[i].result = newDieRoll.dice[0].results[0].result;
                counter++;
            }
            targetRule.active = false;
        }
    }

    if (game.user.isGM) await game.settings.set(moduleID, 'rules', rules);
    else game.socket.emit(`module.${moduleID}`, rules);

    this.ruled = true;
    return this.roll();
}

function checkApplyRule(rule, res) {
    const { operator, value } = rule;
    switch (operator) {
        case '>':
            return res > value;
        case '>=':
            return res >= value;
        case '<':
            return res < value;
        case '<=':
            return res <= value;
        case '=':
            return res === value;
    }
}
