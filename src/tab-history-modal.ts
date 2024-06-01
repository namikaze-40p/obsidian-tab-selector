import { App, MarkdownView, Modal, Notice } from 'obsidian';
import { CustomWsLeaf, CustomApp } from './type';
import { HOW_TO_PREVIOUS_TAB, MODIFIER_KEY, Settings } from './settings';

const compareActiveTime = (a: CustomWsLeaf, b: CustomWsLeaf) => {
	if (a.activeTime == null || b.activeTime == null) {
		return 0;
	}
	return a.activeTime > b.activeTime ? -1 : 1;
};

export class TabHistoryModal extends Modal {
	settings: Settings;
	leaves: CustomWsLeaf[] = [];
	leafButtonMap: Map<string, HTMLButtonElement> = new Map();
	focusPosition = 0;
	isEnabled = false;
	isInitialAct = true;
	eventListenerFunc: {
		keydown: (ev: KeyboardEvent) => void,
		keyup: (ev: KeyboardEvent) => void,
	} = {
		keydown: () => {},
		keyup: () => {},
	};

	constructor(app: App, settings: Settings, leaves: CustomWsLeaf[]) {
		super(app);
		this.settings = settings;
		this.isEnabled = this.isValidSetting();

		this.leaves = leaves.map(leaf => {
			leaf.name = leaf.getDisplayText();
			return leaf;
		}).sort(compareActiveTime);

		this.eventListenerFunc.keydown = this.keydown.bind(this);
		window.addEventListener('keydown', this.eventListenerFunc.keydown);
		this.eventListenerFunc.keyup = this.keyup.bind(this);
		window.addEventListener('keyup', this.eventListenerFunc.keyup);
	}

	onOpen() {
		if (!this.isEnabled) {
			new Notice('"Tab Selector" plugin has incorrect settings. Please review the [For "Go to next/previous tab" command] settings.', 0);
			this.close();
			return;
		}

		this.modalEl.addClasses(['tab-history-modal', 'th-modal']);

		const divEl = this.contentEl.createDiv('th-leaves');

		this.leaves.forEach(leaf => {
			const btnEl = divEl.createEl('button');
			btnEl.addClass('th-leaf-name-btn');

			const itemNameEl = btnEl.createSpan('th-leaf-name');
			itemNameEl.setText(leaf.name || '');

			this.leafButtonMap.set(leaf.id || '', btnEl);
		});
	}

	onClose() {
		window.removeEventListener('keydown', this.eventListenerFunc.keydown);
		window.removeEventListener('keyup', this.eventListenerFunc.keyup);
		this.contentEl.empty();
	}

	private isValidSetting(): boolean {
		const customKeys = (this.app as CustomApp).hotkeyManager?.customKeys;
		const toNextHotkeys = customKeys && customKeys['tab-selector:go-to-next-tab'] || [];
		const toPrevHotkeys = customKeys && customKeys['tab-selector:go-to-previous-tab'] || [];

		if (!toNextHotkeys[0] || !toPrevHotkeys[0] || toNextHotkeys.length > 1 || toPrevHotkeys.length > 1) {
			return false;
		}

		const toNextHotkey = toNextHotkeys[0];
		const toPrevHotkey = toPrevHotkeys[0];
		const { mainModifierKey, subModifierKey, actionKey, backActionKey, howToPreviousTab } = this.settings;
		const mainModKey = this.convertToHotkeyModifier(mainModifierKey);
		const subModKey = this.convertToHotkeyModifier(subModifierKey);
		const useSubModifier = howToPreviousTab === HOW_TO_PREVIOUS_TAB.useSubModifierKey;

		if (toNextHotkey.modifiers[0] !== mainModKey) {
			return false;
		}
		if (useSubModifier) {
			if (toNextHotkey.key !== actionKey || toPrevHotkey.key !== actionKey) {
				return false;
			}
			if (toPrevHotkey.modifiers.filter(modifier => modifier === subModKey).length !== 1) {
				return false;
			}
		} else {
			if (toNextHotkey.key !== actionKey || toPrevHotkey.key !== backActionKey) {
				return false;
			}
		}
		return true;
	}

	private convertToHotkeyModifier(key: string): string {
		switch (key) {
			case MODIFIER_KEY.ctrl:
				return 'Ctrl';
			case MODIFIER_KEY.meta:
				return 'Mod';
			case MODIFIER_KEY.alt:
			case MODIFIER_KEY.shift:
			default:
				return key;
		}
	}

	private keydown(ev: KeyboardEvent): void {
		this.moveFocus(ev);
	}

	private keyup(ev: KeyboardEvent): void {
		if (this.isInitialAct) {
			this.moveFocus(ev);
			this.isInitialAct = false;
		}
		if (ev.key === this.settings.mainModifierKey) {
			const leaf = this.leaves[this.focusPosition];
			this.switchToFocusedTab(leaf);
			this.close();
		}
	}

	private moveFocus(ev: KeyboardEvent): void {
		if (this.settings.howToPreviousTab === HOW_TO_PREVIOUS_TAB.useSubModifierKey) {
			if (ev.key === this.settings.actionKey) {
				if (this.isHoldDownSubModifierKey(ev, this.settings.subModifierKey)) {
					this.focusToPreviousTab();
				} else {
					this.focusToNextTab();
				}
			}
		} 
		if (this.settings.howToPreviousTab === HOW_TO_PREVIOUS_TAB.useBackActionKey) {
			if (ev.key === this.settings.backActionKey) {
				this.focusToPreviousTab();
			} 
			if (ev.key === this.settings.actionKey) {
				this.focusToNextTab();
			}
		}
	}

	private isHoldDownSubModifierKey(ev: KeyboardEvent, subModifierKey: string): boolean {
		switch (subModifierKey) {
			case MODIFIER_KEY.ctrl:
				return ev.ctrlKey;
			case MODIFIER_KEY.alt:
				return ev.altKey;
			case MODIFIER_KEY.meta:
				return ev.metaKey;
			case MODIFIER_KEY.shift:
				return ev.shiftKey;
			default:
				return false;
		}
	}

	private focusToPreviousTab(): void {
		if (this.focusPosition === 0) {
			(this.leafButtonMap.get(this.leaves.at(-1)?.id || '') as HTMLElement).focus();
			this.focusPosition = this.leaves.length - 1;
		} else {
			(this.leafButtonMap.get(this.leaves[this.focusPosition - 1].id || '') as HTMLElement).focus();
			this.focusPosition -= 1;
		}
	}

	private focusToNextTab(): void {
		if (this.focusPosition === this.leaves.length - 1) {
			(this.leafButtonMap.get(this.leaves.at(0)?.id || '') as HTMLElement).focus();
			this.focusPosition = 0;
		} else {
			(this.leafButtonMap.get(this.leaves[this.focusPosition + 1].id || '') as HTMLElement).focus();
			this.focusPosition += 1;
		}
	}

	private switchToFocusedTab(leaf: CustomWsLeaf): void {
		this.app.workspace.setActiveLeaf(leaf);
		const view = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (view) {
			view.editor.focus();
		}
	}
}
