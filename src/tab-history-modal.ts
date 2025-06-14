import { App, Modal, Notice, setIcon } from 'obsidian';
import { CustomWsLeaf } from './type';
import { GoToPreviousNextTabSettings, HOW_TO_NEXT_TAB, MODIFIER_KEY, Settings } from './settings';
import { isValidSettings } from './util';

const compareActiveTime = (a: CustomWsLeaf, b: CustomWsLeaf): number => {
	if (a.activeTime == null || b.activeTime == null) {
		return 0;
	}
	return a.activeTime > b.activeTime ? -1 : 1;
};

export class TabHistoryModal extends Modal {
	private _leafButtonMap: Map<string, HTMLButtonElement> = new Map();
	private _closeButtonMap: Map<string, HTMLButtonElement> = new Map();
	private _focusPosition = 0;
	private _isEnabled = false;
	private _eventListenerFunc: {
		keydown: (ev: KeyboardEvent) => void,
		keyup: (ev: KeyboardEvent) => void,
	} = {
		keydown: () => {},
		keyup: () => {},
	};

	private get modalSettings(): GoToPreviousNextTabSettings {
		return this._settings.goToPreviousNextTab;
	}

	constructor(app: App, private _settings: Settings, private _leaves: CustomWsLeaf[], private _isPrevCommand: boolean) {
		super(app);

		try {
			this._isEnabled = isValidSettings(app, this.modalSettings);
		} catch (e) {
			console.error(e);
		}

		this._leaves = this._leaves.map(leaf => {
			leaf.name = leaf.getDisplayText();
			return leaf;
		}).sort(compareActiveTime);

		this._eventListenerFunc.keydown = this.keydown.bind(this);
		window.addEventListener('keydown', this._eventListenerFunc.keydown);
		this._eventListenerFunc.keyup = this.keyup.bind(this);
		window.addEventListener('keyup', this._eventListenerFunc.keyup);
	}

	onOpen(): void {
		if (!this._isEnabled) {
			new Notice('"Tab Selector" plugin has incorrect settings. Please review the [For "Go to previous/next tab" command] settings.', 0);
			this.close();
			return;
		}

		this.modalEl.addClasses(['tab-history-modal', 'th-modal']);

		const buttonsViewEl = this.contentEl.createDiv('th-leaves');
		this.generateButtons(buttonsViewEl, this._leaves);

		this._isPrevCommand ? this.focusToPreviousTab() : this.focusToNextTab();
	}

	onClose(): void {
		window.removeEventListener('keydown', this._eventListenerFunc.keydown);
		window.removeEventListener('keyup', this._eventListenerFunc.keyup);
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
	
				this._leafButtonMap.set(leaf.id || '', leafBtnEl);
				
				const closeBtnEl = leafBtnEl.createEl('button');
				setIcon(closeBtnEl, 'x');
				closeBtnEl.setAttr('tabIndex', -1);
				closeBtnEl.addClass('th-close-btn');
				closeBtnEl.addEventListener('mouseup', (ev: MouseEvent) => (ev.stopPropagation(), this.clickCloseLeafButton(leaf, el)));
				closeBtnEl.addEventListener('touchend', (ev: MouseEvent) => (ev.stopPropagation(), this.clickCloseLeafButton(leaf, el)));
				this._closeButtonMap.set(leaf.id || '', closeBtnEl);
			});
		});
	}

	private keydown(ev: KeyboardEvent): void {
		this.moveFocus(ev);
	}

	private keyup(ev: KeyboardEvent): void {
		if (ev.key === this.modalSettings.mainModifierKey) {
			const leaf = this._leaves[this._focusPosition];
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
		if (this._focusPosition === 0) {
			(this._leafButtonMap.get(this._leaves.at(-1)?.id || '') as HTMLElement).focus();
			this._focusPosition = this._leaves.length - 1;
		} else {
			(this._leafButtonMap.get(this._leaves[this._focusPosition - 1].id || '') as HTMLElement).focus();
			this._focusPosition -= 1;
		}
		this.addMarkOfFocus();
	}

	private focusToPreviousTab(): void {
		if (this._focusPosition === this._leaves.length - 1) {
			(this._leafButtonMap.get(this._leaves.at(0)?.id || '') as HTMLElement).focus();
			this._focusPosition = 0;
		} else {
			(this._leafButtonMap.get(this._leaves[this._focusPosition + 1].id || '') as HTMLElement).focus();
			this._focusPosition += 1;
		}
		this.addMarkOfFocus();
	}

	private addMarkOfFocus(): void {
		this._leafButtonMap.forEach(leafButton => leafButton.removeClass('is-focus'));
		const focusLeafEl = (this._leafButtonMap.get(this._leaves[this._focusPosition]?.id || '') as HTMLElement);
		focusLeafEl.addClass('is-focus');
	}

	private switchToFocusedTab(leaf: CustomWsLeaf): void {
		this.app.workspace.setActiveLeaf(leaf, { focus: true });
		this.close();
	}

	private clickCloseLeafButton(leaf: CustomWsLeaf, divEl: HTMLDivElement): void {
		const idx = this._leaves.findIndex(({ id }) => id === leaf.id);
		this._focusPosition = idx < this._focusPosition ? this._focusPosition - 1 : this._focusPosition;

		this._leafButtonMap.delete(leaf.id || '');
		this._leaves = this._leaves.filter(({ id }) => id !== leaf.id);
		divEl.remove();
		leaf.detach();
		this.addMarkOfFocus();

		if (!this._leaves.length) {
			this.close();
			return;
		}

		setTimeout(() => {
			const focusLeaf = this._leaves[this._focusPosition];
			(this._leafButtonMap.get(focusLeaf?.id || '') as HTMLElement).focus();
		}, 1);
	}
}
