import { moduleID, lg } from "./fudge-any-roll.js";

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

        return data;
    }

    activateListeners([html]) {
        const createButton = html.querySelector('button');
        createButton.onclick = async () => {
            const id = Date.now();
            const user = html.querySelector('select.user-select').value;
            const type = html.querySelector('input[name="fudge-type"]:checked').value;
            const d = html.querySelector('input.die-input').value || 20;
            const operator = html.querySelector('select.operator-select').value;
            const value = html.querySelector('input.value-input').value;

            if (!d || !Number.isNumeric(value)) return ui.notifications.error('Invalid fudge rule.');

            const newFudge = { id, user, type, d, operator, value, active: true };
            const fudges = game.settings.get(moduleID, 'fudges');
            const conflictingFudges = fudges.filter(f => (f.user === user) && (f.d === d) && f.active);
            if (conflictingFudges.length) return ui.notifications.error('A conflicting fudge rule (same user and same die) is currently active.');

            fudges.push(newFudge);
            await game.settings.set(moduleID, 'fudges', fudges);
            return this.render(true);
        };

        const rightColumn = html.querySelector('div.right-column');
        rightColumn.onclick = async ev => {
            const { target } = ev;

            if (target.parentElement.classList.contains('delete-button')) {
                const confirm = await Dialog.confirm({
                    title: 'Delete Fudge Rule?'
                });
                if (!confirm) return;

                const fudgeID = Number(target.closest('tr').dataset.fudgeId);
                const fudges = game.settings.get(moduleID, 'fudges');
                const targetFudge = fudges.find(f => f.id === fudgeID);
                if (!targetFudge) return;

                const i = fudges.indexOf(targetFudge);
                fudges.splice(i, 1);
                await game.settings.set(moduleID, 'fudges', fudges);
                return this.render(true);
            }

            if (target.type === 'checkbox') {
                const fudgeID = Number(target.closest('tr').dataset.fudgeId);
                const fudges = game.settings.get(moduleID, 'fudges');
                const targetFudge = fudges.find(f => f.id === fudgeID);
                if (!targetFudge) return;

                const conflictingFudges = fudges.filter(f => (f.user === targetFudge.user) && (f.d === targetFudge.d) && f.active);
                if (conflictingFudges.length && target.checked) {
                    ui.notifications.error('A conflicting fudge rule (same user and same die) is currently active.');
                    return target.checked = false;
                }

                targetFudge.active = target.checked;
                await game.settings.set(moduleID, 'fudges', fudges);
                return this.render(true);
            }

        };
    }
}
