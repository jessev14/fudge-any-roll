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
        type: Array
    });

    Handlebars.registerHelper('add', function(a, b) {
        return a + b;
    } )
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


Hooks.on('preCreateChatMessage', (chatMessage, chatData, options, userID) => {
    if (chatData.fudged) return true;

    const { rolls } = chatMessage;
    if (!rolls.length) return true;

    const fudges = game.settings.get(moduleID, 'fudges').filter(f => f.active && f.user === userID);
    if (!fudges.length) return true;

    fudgeRoll(chatData, options, rolls, userID);
    return false;
});


async function fudgeRoll(chatData, options, rolls, userID) {
    const fudges = game.settings.get(moduleID, 'fudges');
    for (const roll of rolls) {
        roll._evaluated = false;
        for (const die of roll.dice) {
            for (let i = 0; i < die.number; i++) {
                const targetFudge = fudges.find(f => f.active && f.user === userID && f.d === die.faces);
                if (!targetFudge) break;

                let newDieRoll, counter = 0;
                while (checkApplyFudge(targetFudge, die.results[i].result)) {
                    if (counter > 1000) break;

                    newDieRoll = await new Roll(`1d${die.faces}`).roll();
                    const res = newDieRoll.dice[0].results[0].result;
                    die.results[i].result = res;
                }
                targetFudge.active = false;
            }
        }
        await roll.roll();
    }
    chatData.rolls = rolls;
    chatData.fudged = true;

    await game.settings.set(moduleID, 'fudges', fudges);
    return ChatMessage.create(chatData, options);
}

function checkApplyFudge(fudge, res) {
    const { operator, value } = fudge;

    if (operator.includes('=') && res === value) return false;
    if (operator.includes('<') && res < value) return false;
    if (operator.includes('>') && res > value) return false;

    return true;
}
