import { FudgeRollConfig } from './FudgeRollConfig.js';

export const moduleID = 'fudge-any-roll';

const lg = x => console.log(x);


Hooks.once('init', () => {
    /**
     * fudge = {
     *  id: 'abc123',
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
    if (rolls.some(r => r.dice.length > 1)) return true;

    const fudges = game.settings.get(moduleID, 'fudges').filter(f => f.active && f.user === userID);
    if (!fudges.length) return true;

    fudgeRoll(chatData, options, fudges, rolls);
    return false;
});


async function fudgeRoll(chatData, options, fudges, rolls) {
    const newRolls = [];
    for (let roll of rolls) {
        const targetFudge = fudges.find(f => f.d === roll.dice[0].faces);
        let counter = 0;
        while (checkApplyFudge(targetFudge, targetFudge.type === 'total' ? roll.total : roll.dice[0].total)) {
            if (counter > 1000) break;

            roll = await roll.reroll();
        }
        if (counter > 1000) continue;

        newRolls.push(roll);
    }
    if (newRolls.length) chatData.rolls = newRolls;
    chatData.fudged = true;

    return ChatMessage.create(chatData, options);
}

function checkApplyFudge(fudge, res) {
    const { operator, value } = fudge;

    if (operator.includes('=') && res === value) return false;
    if (operator.includes('<') && res < value) return false;
    if (operator.includes('>') && res > value) return false;

    return true;
}
