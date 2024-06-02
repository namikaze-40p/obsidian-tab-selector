import { App, MarkdownView, Modal, Notice } from 'obsidian';
import { CustomWsLeaf, CustomApp } from './type';
import { HOW_TO_NEXT_TAB, MODIFIER_KEY, Settings } from './settings';

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
			new Notice('"Tab Selector" plugin has incorrect settings. Please review the [For "Go to previous/next tab" command] settings.', 0);
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
		const toPrevHotkeys = customKeys && customKeys['tab-selector:go-to-previous-tab'] || [];
		const toNextHotkeys = customKeys && customKeys['tab-selector:go-to-next-tab'] || [];

		if (!toPrevHotkeys[0] || !toNextHotkeys[0] || toPrevHotkeys.length > 1 || toNextHotkeys.length > 1) {
			return false;
		}

		const toPrevHotkey = toPrevHotkeys[0];
		const toNextHotkey = toNextHotkeys[0];
		const { mainModifierKey, subModifierKey, actionKey, reverseActionKey, howToNextTab } = this.settings;
		const mainModKey = this.convertToHotkeyModifier(mainModifierKey);
		const subModKey = this.convertToHotkeyModifier(subModifierKey);
		const useSubModifier = howToNextTab === HOW_TO_NEXT_TAB.useSubModifierKey;

		if (toPrevHotkey.modifiers[0] !== mainModKey) {
			return false;
		}
		if (useSubModifier) {
			if (toPrevHotkey.key !== actionKey || toNextHotkey.key !== actionKey) {
				return false;
			}
			if (toNextHotkey.modifiers.filter(modifier => modifier === subModKey).length !== 1) {
				return false;
			}
		} else {
			if (toPrevHotkey.key !== actionKey || toNextHotkey.key !== reverseActionKey) {
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
		if (this.settings.howToNextTab === HOW_TO_NEXT_TAB.useSubModifierKey) {
			if (ev.key === this.settings.actionKey) {
				if (this.isHoldDownSubModifierKey(ev, this.settings.subModifierKey)) {
					this.focusToNextTab();
				} else {
					this.focusToPreviousTab();
				}
			}
		} 
		if (this.settings.howToNextTab === HOW_TO_NEXT_TAB.useReverseActionKey) {
			if (ev.key === this.settings.reverseActionKey) {
				this.focusToNextTab();
			} 
			if (ev.key === this.settings.actionKey) {
				this.focusToPreviousTab();
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

	private focusToNextTab(): void {
		if (this.focusPosition === 0) {
			(this.leafButtonMap.get(this.leaves.at(-1)?.id || '') as HTMLElement).focus();
			this.focusPosition = this.leaves.length - 1;
		} else {
			(this.leafButtonMap.get(this.leaves[this.focusPosition - 1].id || '') as HTMLElement).focus();
			this.focusPosition -= 1;
		}
	}

	private focusToPreviousTab(): void {
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
