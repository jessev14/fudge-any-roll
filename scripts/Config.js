import { moduleID, lg } from "./main.js";

export class Config extends FormApplication {
    constructor(options = {}) {
        super(null, options);
    }

    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            id: 'too-many-faces-config',
            title: 'Configure Rules',
            template: `modules/${moduleID}/templates/config.hbs`,
            height: 400,
            width: 800
        });
    }

    getData() {
        const data = {};
        data.rules = game.settings.get(moduleID, 'rules');
        for (const rule of data.rules) {
            rule.userName = game.users.get(rule.user)?.name || 'Any User';
            rule.rule = `d${rule.d} ${rule.operator} ${rule.value}`;
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
            const value = Number(html.querySelector('input.value-input').value);

            if (!d || !Number.isNumeric(value)) return ui.notifications.error('Invalid rule.');

            const newRule = { id, user, d, operator, value, active: true };
            const rules = game.settings.get(moduleID, 'rules');

            rules.push(newRule);
            await game.settings.set(moduleID, 'rules', rules);
            return this.render(true);
        };

        const rightColumn = html.querySelector('div.right-column');
        rightColumn.onclick = async ev => {
            const { target } = ev;

            if (target.parentElement.classList.contains('delete-button')) {
                const confirm = await Dialog.confirm({
                    title: 'Delete Rule?'
                });
                if (!confirm) return;

                const ruleID = Number(target.closest('tr').dataset.ruleId);
                const rules = game.settings.get(moduleID, 'rules');
                const targetRule = rules.find(f => f.id === ruleID);
                if (!targetRule) return;

                const i = rules.indexOf(targetRule);
                rules.splice(i, 1);
                await game.settings.set(moduleID, 'rules', rules);
                return this.render(true);
            }

            if (target.parentElement.classList.contains('move')) {
                const ruleID = Number(target.closest('tr').dataset.ruleId);
                const rules = game.settings.get(moduleID, 'rules');
                const targetRule = rules.find(f => f.id === ruleID);
                if (!targetRule) return;

                const direction = target.parentElement.classList.contains('up') ? -1 : 1;
                const index = rules.indexOf(targetRule);
                const newIndex = index + direction;
                if (newIndex < 0 || newIndex > rules.length - 1) return;

                rules.splice(index, 1);
                rules.splice(newIndex, 0, targetRule);
                await game.settings.set(moduleID, 'rules', rules);
                return this.render(true);
            }

            if (target.type === 'checkbox') {
                const ruleID = Number(target.closest('tr').dataset.ruleId);
                const rules = game.settings.get(moduleID, 'rules');
                const targetRule = rules.find(f => f.id === ruleID);
                if (!targetRule) return;

                targetRule.active = target.checked;
                await game.settings.set(moduleID, 'rules', rules);
                return this.render(true);
            }
        };
    }
}
