import { App, Modal, setIcon } from 'obsidian';
import { OpenTabSelectorSettings, Settings } from './settings';
import { CustomWsLeaf, CustomView } from './type';

export const UP_KEY = 'ArrowUp';
export const DOWN_KEY = 'ArrowDown';
export const LEFT_KEY = 'ArrowLeft';
export const RIGHT_KEY = 'ArrowRight';
export const BACKSPACE_KEY = 'Backspace';
export const DELETE_KEY = 'Delete';
export const FOOTER_ITEMS = [
	{ keys: '↑ | ↓', description: 'Move focus' },
	{ keys: '← | →', description: 'Switch pages' },
	{ keys: 'Enter | Space', description: 'Switch to focused tab' },
	{ keys: 'BS | Delete', description: 'Close focused tab' },
	{ keys: '', description: 'Quickly switch tab' },
	{ keys: '', description: 'Quickly close tab', modifier: true },
];

export class TabSelectorModal extends Modal {
	private _chars: string[] = [];
	private _leafButtonMap: Map<string, HTMLButtonElement> = new Map();
	private _closeButtonMap: Map<string, HTMLButtonElement> = new Map();
	private _focusPosition = 0;
	private _pagePosition = 0;
	private _buttonsViewEl: HTMLDivElement;
	private _pageCounterEl: HTMLSpanElement;
	private _eventListenerFunc: (ev: KeyboardEvent) => void;

	private get currentLeaves(): CustomWsLeaf[] {
		return this._leaves.slice(0 + this._pagePosition * this._chars.length, this._chars.length + this._pagePosition * this._chars.length);
	}

	private get modalSettings(): OpenTabSelectorSettings {
		return this._settings.openTabSelector;
	}

	constructor(app: App, private _settings: Settings, private _leaves: CustomWsLeaf[]) {
		super(app);

		this._leaves = this._leaves.map(leaf => {
			leaf.name = leaf.getDisplayText();

			const props = (leaf.view as CustomView)?.metadataEditor?.properties || [];
			leaf.aliases = props.filter(prop => prop.key === 'aliases').flatMap(prop => prop.value).filter(value => value != null);

			const { file } = leaf.getViewState().state;
			const fullPath = typeof file === 'string' ? file.split(leaf.getDisplayText())[0] || '/' : '-';
			const splitPaths = fullPath.split('/').map(path => path.length > 20 ? `${path.slice(0, 20)}...` : path);
			leaf.path = splitPaths.length > 3 ? `.../${splitPaths.at(-3)}/${splitPaths.at(-2)}/` : splitPaths.join('/');

			return leaf;
		});
		this._chars = [...this.modalSettings.characters];
	}

	onOpen() {
		this.modalEl.addClasses(['tab-selector-modal', 'ts-modal']);

		this.generateHeader(this.contentEl);
		this._buttonsViewEl = this.contentEl.createDiv('ts-buttons-view');
		this.generateContent(this._buttonsViewEl, this.currentLeaves);
		this.generateFooter(this.contentEl);

		this._eventListenerFunc = this.handlingKeyupEvent.bind(this);
		window.addEventListener('keyup', this._eventListenerFunc);
	}

	onClose(): void {
		window.removeEventListener('keyup', this._eventListenerFunc);
		this.contentEl.empty();
	}

	private generateHeader(contentEl: HTMLElement): void {
		contentEl.createDiv('ts-header', el => {
			this._pageCounterEl = el.createSpan('')
			this.updatePageCount();
			el.createSpan('').setText('/');
			el.createSpan('').setText(`${Math.ceil(this._leaves.length / this._chars.length)}`);
		});
	}

	private generateContent(contentEl: HTMLElement, leaves: CustomWsLeaf[]): void {
		this._focusPosition = 0;
		contentEl.empty();
		this.generateButtons(contentEl, leaves);
		this.generateDummyButtons(contentEl, leaves);
	}

	private generateButtons(contentEl: HTMLElement, leaves: CustomWsLeaf[]): void {
		leaves.forEach((leaf, idx) => {
			contentEl.createDiv('ts-leaf-row', el => {
				const shortcutBtnEl = el.createEl('button', { text: this._chars.at(idx) });
				shortcutBtnEl.setAttr('tabIndex', -1);
				shortcutBtnEl.addClass('ts-shortcut-btn');
				shortcutBtnEl.addEventListener('click', () => this.clickLeafButton(leaf, shortcutBtnEl));
				
				const itemBtnEl = el.createEl('button');
				itemBtnEl.addClass('ts-leaf-name-btn');
				itemBtnEl.addEventListener('click', () => this.clickLeafButton(leaf, itemBtnEl));

				const itemNameEl = itemBtnEl.createSpan('ts-leaf-name');
				itemNameEl.setText(leaf.name || '');

				this.reflectOptions(leaf, el, itemBtnEl, itemNameEl);

				this._leafButtonMap.set(leaf.id || '', itemBtnEl);

				if (this.modalSettings.enableClose) {
					const closeBtnEl = el.createEl('button');
					setIcon(closeBtnEl, 'x');
					closeBtnEl.setAttr('tabIndex', -1);
					closeBtnEl.addClass('ts-close-btn');
					closeBtnEl.addEventListener('click', () => this.clickCloseLeafButton(leaf, el));
					this._closeButtonMap.set(leaf.id || '', closeBtnEl);

					el.addClass('ts-leaf-row-deletable');
					if (leaf.deleted) {
						el.addClass('deleted');
					}
				}
			});
		});
		
		(this._leafButtonMap.get(this.currentLeaves.at(0)?.id || '') as HTMLElement).focus();
		this.updatePageCount();
	}

	private generateDummyButtons(contentEl: HTMLElement, leaves: CustomWsLeaf[]): void {
		const dummyButtonCount = this._leaves.length > this._chars.length ? this._chars.length - leaves.length : 0;
		for (let i = 0; i < dummyButtonCount; i++) {			
			contentEl.createDiv('ts-leaf-row', el => {
				const itemBtnEl = el.createEl('button');
				itemBtnEl.addClass('ts-leaf-name-btn');
				itemBtnEl.setAttr('disabled', true);
				
				const itemNameEl = itemBtnEl.createSpan('ts-leaf-name');
				itemNameEl.setText('-');
				
				this.reflectOptions(null, el, itemBtnEl, itemNameEl);
			});
		}
	}

	private reflectOptions(leaf: CustomWsLeaf | null, el: HTMLDivElement, itemBtnEl: HTMLButtonElement, itemNameEl: HTMLSpanElement): void {
		if((this.modalSettings.showAliases && !this.modalSettings.replaceToAliases) || this.modalSettings.showPaths) {
			el.addClass('ts-leaf-row-added-options');
		}
		if (!leaf) {
			el.addClass('ts-leaf-row-invisible');
		}

		if (this.modalSettings.showAliases) {
			if (this.modalSettings.replaceToAliases) {
				this.replaceLeafName(leaf?.aliases || [], itemBtnEl, itemNameEl);
			} else {
				this.addAliasesEl(leaf?.aliases || [], itemBtnEl);
			}
		}

		if (this.modalSettings.showPaths) {
			this.addPathEl(leaf, itemBtnEl);
		}
	}

	private replaceLeafName(aliases: string[], itemBtnEl: HTMLButtonElement, itemNameEl: HTMLSpanElement): void {
		if (aliases.length) {
			itemNameEl.detach();
			const wrapperEl = itemBtnEl.createDiv('ts-option-wrapper');
			setIcon(wrapperEl, 'corner-up-right');
	
			wrapperEl.createSpan('ts-leaf-alias').setText(aliases.join(' | '));
		}
	}

	private addAliasesEl(aliases: string[], itemBtnEl: HTMLButtonElement): void {
		const wrapperEl = itemBtnEl.createDiv('ts-option-wrapper');
		setIcon(wrapperEl, 'corner-up-right');

		wrapperEl.createEl('small').setText(aliases.join(' | '));
	}

	private addPathEl(leaf: CustomWsLeaf | null, itemBtnEl: HTMLButtonElement): void {
		const wrapperEl = itemBtnEl.createDiv('ts-option-wrapper');
		setIcon(wrapperEl, 'folder-closed');
		wrapperEl.createEl('small').setText(leaf?.path || '');
	}

	private generateFooter(contentEl: HTMLElement): void {
		contentEl.createDiv('ts-footer', el => {
			if (this.modalSettings.showPaginationButtons && this._leaves.length > this._chars.length) {
				el.createDiv('ts-page-nav', navEl => {
					const prevBtnEl = navEl.createEl('button', { text: '←' });
					prevBtnEl.setAttr('tabIndex', -1);
					prevBtnEl.addClass('ts-nav-btn');
					prevBtnEl.addEventListener('click', () => this.keyupArrowKeys(LEFT_KEY));
		
					const nextBtnEl = navEl.createEl('button', { text: '→' });
					nextBtnEl.setAttr('tabIndex', -1);
					nextBtnEl.addClass('ts-nav-btn');
					nextBtnEl.addEventListener('click', () => this.keyupArrowKeys(RIGHT_KEY));
				});
			}

			if (this.modalSettings.showLegends) {
				FOOTER_ITEMS.forEach(item => {
					if (item.modifier && !this.modalSettings.enableClose) {
						return;
					}
					el.createDiv('ts-legends', el => {
						const text = item.keys || (
							item.modifier
								? `Ctrl + ${this._chars.slice(0, 2).join(' | ')} | ... | ${this._chars.slice(-2).join(' | ')}`
								: `${this._chars.slice(0, 2).join(' | ')} | ... | ${this._chars.slice(-2).join(' | ')}`
							);
						el.createSpan('ts-keys').setText(text);
						el.createSpan('ts-description').setText(item.description);
					});
				});
			}
		});
	}

	private updatePageCount(): void {
		this._pageCounterEl.setText(`${this._pagePosition + 1}`);
	}

	private clickLeafButton(leaf: CustomWsLeaf, itemBtnEl: HTMLButtonElement): void {
		if (itemBtnEl.classList.contains('deleted')) {
			return;
		}
		this.close();
		this.app.workspace.setActiveLeaf(leaf, { focus: true });
	}

	private clickCloseLeafButton(leaf: CustomWsLeaf, divEl: HTMLDivElement): void {
		if (leaf.deleted) {
			return;
		}
		divEl.addClass('deleted');
		leaf.deleted = true;
		leaf.detach();
		const idx = this.currentLeaves.findIndex(({ id }) => id === leaf.id);
		this._focusPosition = idx >= 0 ? idx : 0;
		(this._leafButtonMap.get(leaf?.id || '') as HTMLElement).focus();
	}

	private handlingKeyupEvent(ev: KeyboardEvent): void {
		if (this._chars.includes(ev.key)) {
			this.keyupShortcutKeys(ev.key, ev.ctrlKey);
			ev.preventDefault();
			return;
		}

		if ([BACKSPACE_KEY, DELETE_KEY].includes(ev.key)) {
			this.keyUpCloseKeys();
			ev.preventDefault();
			return;
		}

		if ([UP_KEY, DOWN_KEY, LEFT_KEY, RIGHT_KEY].includes(ev.key)) {
			this.keyupArrowKeys(ev.key);
			ev.preventDefault();
			return;
		}
	}

	private keyupShortcutKeys(key: string, isModifier: boolean): void {
		const idx = this._chars.indexOf(key);
		if (isModifier) {
			this.keyUpCloseKeys(idx)
		} else {
			this._leafButtonMap.get(this.currentLeaves.at(idx)?.id || '')?.click();
		}
	}

	private keyUpCloseKeys(index?: number): void {
		if (index == null && !this._leaves.some(leaf => this._leafButtonMap.get(leaf.id || '') === document.activeElement)) {
			return;
		}
		const idx = index ?? this._focusPosition;
		this._closeButtonMap.get(this.currentLeaves.at(idx)?.id || '')?.click();
	}

	private keyupArrowKeys(key: string): void {
		switch (key) {
			case UP_KEY:
				if (this._focusPosition === 0) {
					(this._leafButtonMap.get(this.currentLeaves.at(-1)?.id || '') as HTMLElement).focus();
					this._focusPosition = this.currentLeaves.length - 1;
				} else {
					(this._leafButtonMap.get(this.currentLeaves[this._focusPosition - 1].id || '') as HTMLElement).focus();
					this._focusPosition -= 1;
				}
				break;
			case DOWN_KEY:
				if (this._focusPosition === this.currentLeaves.length - 1) {
					(this._leafButtonMap.get(this.currentLeaves.at(0)?.id || '') as HTMLElement).focus();
					this._focusPosition = 0;
				} else {
					(this._leafButtonMap.get(this.currentLeaves[this._focusPosition + 1].id || '') as HTMLElement).focus();
					this._focusPosition += 1;
				}
				break;
			case LEFT_KEY: {
				const pageSize = this._leaves.length / this._chars.length;
				if (Math.ceil(pageSize) === 1) {
					break;
				}
				if (this._pagePosition === 0) {
					this._pagePosition = this._leaves.length % this._chars.length === 0 ? Math.floor(pageSize) - 1 : Math.floor(pageSize);
				} else {
					this._pagePosition -= 1;
				}
				this.generateContent(this._buttonsViewEl, this.currentLeaves);
				break;
			}
			case RIGHT_KEY: {
				const pageSize = this._leaves.length / this._chars.length;
				if (Math.ceil(pageSize) === 1) {
					break;
				}
				const lastPage = this._leaves.length % this._chars.length === 0 ? (pageSize) - 1 : Math.floor(pageSize);
				if (this._pagePosition === lastPage) {
					this._pagePosition = 0;
				} else {
					this._pagePosition += 1;
				}
				this.generateContent(this._buttonsViewEl, this.currentLeaves);
				break;
			}
			default:
				// nop
				break;
		}
	}
}
