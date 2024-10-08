import { App, Modal, Notice, setIcon } from 'obsidian';
import { CustomWsLeaf } from './type';
import { GoToPreviousNextTabSettings, HOW_TO_NEXT_TAB, MODIFIER_KEY, Settings } from './settings';
import { isValidSettings } from './util';

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
	closeButtonMap: Map<string, HTMLButtonElement> = new Map();
	focusPosition = 0;
	isEnabled = false;
	isPrevCommand = true;
	eventListenerFunc: {
		keydown: (ev: KeyboardEvent) => void,
		keyup: (ev: KeyboardEvent) => void,
	} = {
		keydown: () => {},
		keyup: () => {},
	};

	get modalSettings(): GoToPreviousNextTabSettings {
		return this.settings.goToPreviousNextTab;
	}

	constructor(app: App, settings: Settings, leaves: CustomWsLeaf[], isPrevCommand: boolean) {
		super(app);
		this.settings = settings;

		try {
			this.isEnabled = isValidSettings(app, this.modalSettings);
		} catch (e) {
			console.error(e);
		}

		this.isPrevCommand = isPrevCommand;
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

		const buttonsViewEl = this.contentEl.createDiv('th-leaves');
		this.generateButtons(buttonsViewEl, this.leaves);

		this.isPrevCommand ? this.focusToPreviousTab() : this.focusToNextTab();
	}

	onClose() {
		window.removeEventListener('keydown', this.eventListenerFunc.keydown);
		window.removeEventListener('keyup', this.eventListenerFunc.keyup);
		this.contentEl.empty();
	}

	private generateButtons(contentEl: HTMLElement, leaves: CustomWsLeaf[]): void {
		leaves.forEach(leaf => {
			contentEl.createDiv('th-leaf-row', el => {
				const leafBtnEl = el.createEl('button');
				leafBtnEl.addClass('th-leaf-name-btn');
				leafBtnEl.addEventListener('mouseup', (ev: MouseEvent) => (ev.preventDefault(), this.switchToFocusedTab(leaf)));
				leafBtnEl.addEventListener('touchend', (ev: MouseEvent) => (ev.preventDefault(), this.switchToFocusedTab(leaf)));

				const itemNameEl = leafBtnEl.createSpan('th-leaf-name');
				itemNameEl.setText(leaf.name || '');
	
				this.leafButtonMap.set(leaf.id || '', leafBtnEl);
				
				const closeBtnEl = leafBtnEl.createEl('button');
				setIcon(closeBtnEl, 'x');
				closeBtnEl.setAttr('tabIndex', -1);
				closeBtnEl.addClass('th-close-btn');
				closeBtnEl.addEventListener('mouseup', (ev: MouseEvent) => (ev.stopPropagation(), this.clickCloseLeafButton(leaf, el)));
				closeBtnEl.addEventListener('touchend', (ev: MouseEvent) => (ev.stopPropagation(), this.clickCloseLeafButton(leaf, el)));
				this.closeButtonMap.set(leaf.id || '', closeBtnEl);
			});
		});
	}

	private keydown(ev: KeyboardEvent): void {
		this.moveFocus(ev);
	}

	private keyup(ev: KeyboardEvent): void {
		if (ev.key === this.modalSettings.mainModifierKey) {
			const leaf = this.leaves[this.focusPosition];
			this.switchToFocusedTab(leaf);
		}
	}

	private moveFocus(ev: KeyboardEvent): void {
		if (this.modalSettings.howToNextTab === HOW_TO_NEXT_TAB.useSubModifierKey) {
			if (ev.key === this.modalSettings.actionKey) {
				if (this.isHoldDownSubModifierKey(ev, this.modalSettings.subModifierKey)) {
					this.focusToNextTab();
				} else {
					this.focusToPreviousTab();
				}
			}
		} 
		if (this.modalSettings.howToNextTab === HOW_TO_NEXT_TAB.useReverseActionKey) {
			if (ev.key === this.modalSettings.reverseActionKey) {
				this.focusToNextTab();
			} 
			if (ev.key === this.modalSettings.actionKey) {
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
		this.addMarkOfFocus();
	}

	private focusToPreviousTab(): void {
		if (this.focusPosition === this.leaves.length - 1) {
			(this.leafButtonMap.get(this.leaves.at(0)?.id || '') as HTMLElement).focus();
			this.focusPosition = 0;
		} else {
			(this.leafButtonMap.get(this.leaves[this.focusPosition + 1].id || '') as HTMLElement).focus();
			this.focusPosition += 1;
		}
		this.addMarkOfFocus();
	}

	private addMarkOfFocus(): void {
		this.leafButtonMap.forEach(leafButton => leafButton.removeClass('is-focus'));
		const focusLeafEl = (this.leafButtonMap.get(this.leaves[this.focusPosition]?.id || '') as HTMLElement);
		focusLeafEl.addClass('is-focus');
	}

	private switchToFocusedTab(leaf: CustomWsLeaf): void {
		this.app.workspace.setActiveLeaf(leaf, { focus: true });
		this.close();
	}

	private clickCloseLeafButton(leaf: CustomWsLeaf, divEl: HTMLDivElement) {
		const idx = this.leaves.findIndex(({ id }) => id === leaf.id);
		this.focusPosition = idx < this.focusPosition ? this.focusPosition - 1 : this.focusPosition;

		this.leafButtonMap.delete(leaf.id || '');
		this.leaves = this.leaves.filter(({ id }) => id !== leaf.id);
		divEl.remove();
		leaf.detach();
		this.addMarkOfFocus();

		if (!this.leaves.length) {
			this.close();
			return;
		}

		setTimeout(() => {
			const focusLeaf = this.leaves[this.focusPosition];
			(this.leafButtonMap.get(focusLeaf?.id || '') as HTMLElement).focus();
		}, 1);
	}
}
