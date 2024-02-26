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
            width: 800
        });
    }

    getData() {
        const data = {};
        data.fudges = game.settings.get(moduleID, 'fudges');
        for (const fudge of data.fudges) {
            fudge.userName = game.users.get(fudge.user).name;
            fudge.rule = `d${fudge.d} ${fudge.operator} ${fudge.value}`;
        }
        data.users = game.users.contents;
        data.users.push({
            id: 'any',
            name: 'Any User'
        });

        return data;
    }

    activateListeners([html]) {
        const createButton = html.querySelector('button');
        createButton.onclick = async () => {
            const id = Date.now();
            const user = html.querySelector('select.user-select').value;
            const d = Number(html.querySelector('input.die-input').value || 20);
            const operator = html.querySelector('select.operator-select').value;
            const value = html.querySelector('input.value-input').value;

            if (!d || !Number.isNumeric(value)) return ui.notifications.error('Invalid fudge rule.');

            const newFudge = { id, user, d, operator, value, active: true };
            const fudges = game.settings.get(moduleID, 'fudges');

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

            if (target.parentElement.classList.contains('move')) {
                const fudgeID = Number(target.closest('tr').dataset.fudgeId);
                const fudges = game.settings.get(moduleID, 'fudges');
                const targetFudge = fudges.find(f => f.id === fudgeID);
                if (!targetFudge) return;

                const direction = target.parentElement.classList.contains('up') ? -1 : 1;
                const index = fudges.indexOf(targetFudge);
                const newIndex = index + direction;
                if (newIndex < 0 || newIndex > fudges.length - 1) return;

                fudges.splice(index, 1);
                fudges.splice(newIndex, 0, targetFudge);
                await game.settings.set(moduleID, 'fudges', fudges);
                return this.render(true);
            }

            if (target.type === 'checkbox') {
                const fudgeID = Number(target.closest('tr').dataset.fudgeId);
                const fudges = game.settings.get(moduleID, 'fudges');
                const targetFudge = fudges.find(f => f.id === fudgeID);
                if (!targetFudge) return;

                targetFudge.active = target.checked;
                await game.settings.set(moduleID, 'fudges', fudges);
                return this.render(true);
            }
        };
    }
}
