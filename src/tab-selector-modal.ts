import { App, MarkdownView, Modal, setIcon } from 'obsidian';
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
	settings: Settings;
	leaves: CustomWsLeaf[] = [];
	chars: string[] = [];
	leafButtonMap: Map<string, HTMLButtonElement> = new Map();
	closeButtonMap: Map<string, HTMLButtonElement> = new Map();
	focusPosition = 0;
	pagePosition = 0;
	buttonsViewEl: HTMLDivElement;
	pageCounterEl: HTMLSpanElement;
	eventListenerFunc: (ev: KeyboardEvent) => void;

	get currentLeaves(): CustomWsLeaf[] {
		return this.leaves.slice(0 + this.pagePosition * this.chars.length, this.chars.length + this.pagePosition * this.chars.length);
	}

	get modalSettings(): OpenTabSelectorSettings {
		return this.settings.openTabSelector;
	}

	constructor(app: App, settings: Settings, leaves: CustomWsLeaf[]) {
		super(app);
		this.settings = settings;
		this.leaves = leaves.map(leaf => {
			leaf.name = leaf.getDisplayText();

			const props = (leaf.view as CustomView)?.metadataEditor?.properties || [];
			leaf.aliases = props.filter(prop => prop.key === 'aliases').flatMap(prop => prop.value).filter(value => value != null);

			const { file } = leaf.getViewState().state;
			const fullPath = typeof file === 'string' ? file.split(leaf.getDisplayText())[0] || '/' : '-';
			const splitPaths = fullPath.split('/').map(path => path.length > 20 ? `${path.slice(0, 20)}...` : path);
			leaf.path = splitPaths.length > 3 ? `.../${splitPaths.at(-3)}/${splitPaths.at(-2)}/` : splitPaths.join('/');

			return leaf;
		});
		this.chars = [...this.modalSettings.characters];
	}

	onOpen() {
		this.modalEl.addClasses(['tab-selector-modal', 'ts-modal']);

		this.generateHeader(this.contentEl);
		this.buttonsViewEl = this.contentEl.createDiv('ts-buttons-view');
		this.generateButtons(this.buttonsViewEl, this.currentLeaves);
		this.generateFooter(this.contentEl);

		this.eventListenerFunc = this.handlingKeyupEvent.bind(this);
		window.addEventListener('keyup', this.eventListenerFunc);
	}

	onClose() {
		window.removeEventListener('keyup', this.eventListenerFunc);
		this.contentEl.empty();
	}

	private generateHeader(contentEl: HTMLElement): void {
		contentEl.createDiv('ts-header', el => {
			this.pageCounterEl = el.createSpan('')
			this.updatePageCount();
			el.createSpan('').setText('/');
			el.createSpan('').setText(`${Math.ceil(this.leaves.length / this.chars.length)}`);
		});
	}

	private generateButtons(contentEl: HTMLElement, leaves: CustomWsLeaf[]): void {
		this.focusPosition = 0;
		this.buttonsViewEl.empty();

		leaves.forEach((leaf, idx) => {
			contentEl.createDiv('ts-leaf-row', el => {
				const shortcutBtnEl = el.createEl('button', { text: this.chars.at(idx) });
				shortcutBtnEl.setAttr('tabIndex', -1);
				shortcutBtnEl.addClass('ts-shortcut-btn');
				shortcutBtnEl.addEventListener('click', () => this.clickLeafButton(leaf, shortcutBtnEl));
				
				const itemBtnEl = el.createEl('button');
				itemBtnEl.addClass('ts-leaf-name-btn');
				itemBtnEl.addEventListener('click', () => this.clickLeafButton(leaf, itemBtnEl));

				const itemNameEl = itemBtnEl.createSpan('ts-leaf-name');
				itemNameEl.setText(leaf.name || '');

				this.reflectOptions(leaf, el, itemBtnEl, itemNameEl);

				this.leafButtonMap.set(leaf.id || '', itemBtnEl);

				if (this.modalSettings.enableClose) {
					const closeBtnEl = el.createEl('button');
					setIcon(closeBtnEl, 'x');
					closeBtnEl.setAttr('tabIndex', -1);
					closeBtnEl.addClass('ts-close-btn');
					closeBtnEl.addEventListener('click', () => this.clickCloseLeafButton(leaf, el));
					this.closeButtonMap.set(leaf.id || '', closeBtnEl);

					el.addClass('ts-leaf-row-deletable');
					if (leaf.deleted) {
						el.addClass('deleted');
					}
				}
			});
		});

		(this.leafButtonMap.get(this.currentLeaves.at(0)?.id || '') as HTMLElement).focus();
		this.updatePageCount();
	}

	private reflectOptions(leaf: CustomWsLeaf, el: HTMLDivElement, itemBtnEl: HTMLButtonElement, itemNameEl: HTMLSpanElement): void {
		if((this.modalSettings.showAliases && !this.modalSettings.replaceToAliases) || this.modalSettings.showPaths) {
			el.addClass('ts-leaf-row-added-options');
		}

		if (this.modalSettings.showAliases) {
			if (this.modalSettings.replaceToAliases) {
				this.replaceLeafName(leaf.aliases || [], itemBtnEl, itemNameEl);
			} else {
				this.addAliasesEl(leaf.aliases || [], itemBtnEl);
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

	private addPathEl(leaf: CustomWsLeaf, itemBtnEl: HTMLButtonElement): void {
		const wrapperEl = itemBtnEl.createDiv('ts-option-wrapper');
		setIcon(wrapperEl, 'folder-closed');
		wrapperEl.createEl('small').setText(leaf.path || '');
	}


	private generateFooter(contentEl: HTMLElement): void {
		contentEl.createDiv('ts-footer', el => {
			if (this.modalSettings.showPaginationButtons && this.leaves.length > this.chars.length) {
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
								? `Ctrl + ${this.chars.slice(0, 2).join(' | ')} | ... | ${this.chars.slice(-2).join(' | ')}`
								: `${this.chars.slice(0, 2).join(' | ')} | ... | ${this.chars.slice(-2).join(' | ')}`
							);
						el.createSpan('ts-keys').setText(text);
						el.createSpan('ts-description').setText(item.description);
					});
				});
			}
		});
	}

	private updatePageCount(): void {
		this.pageCounterEl.setText(`${this.pagePosition + 1}`);
	}

	private clickLeafButton(leaf: CustomWsLeaf, itemBtnEl: HTMLButtonElement) {
		if (itemBtnEl.classList.contains('deleted')) {
			return;
		}
		this.close();
		this.app.workspace.setActiveLeaf(leaf);
		const view = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (view) {
			view.editor.focus();
		}
	}

	private clickCloseLeafButton(leaf: CustomWsLeaf, divEl: HTMLDivElement) {
		if (leaf.deleted) {
			return;
		}
		divEl.addClass('deleted');
		leaf.deleted = true;
		leaf.detach();
		const idx = this.currentLeaves.findIndex(({ id }) => id === leaf.id);
		this.focusPosition = idx >= 0 ? idx : 0;
		(this.leafButtonMap.get(leaf?.id || '') as HTMLElement).focus();
	}

	private handlingKeyupEvent(ev: KeyboardEvent): void {
		if (this.chars.includes(ev.key)) {
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
		const idx = this.chars.indexOf(key);
		if (isModifier) {
			this.keyUpCloseKeys(idx)
		} else {
			this.leafButtonMap.get(this.currentLeaves.at(idx)?.id || '')?.click();
		}
	}

	private keyUpCloseKeys(index?: number): void {
		if (index == null && !this.leaves.some(leaf => this.leafButtonMap.get(leaf.id || '') === document.activeElement)) {
			return;
		}
		const idx = index ?? this.focusPosition;
		this.closeButtonMap.get(this.currentLeaves.at(idx)?.id || '')?.click();
	}

	private keyupArrowKeys(key: string): void {
		switch (key) {
			case UP_KEY:
				if (this.focusPosition === 0) {
					(this.leafButtonMap.get(this.currentLeaves.at(-1)?.id || '') as HTMLElement).focus();
					this.focusPosition = this.currentLeaves.length - 1;
				} else {
					(this.leafButtonMap.get(this.currentLeaves[this.focusPosition - 1].id || '') as HTMLElement).focus();
					this.focusPosition -= 1;
				}
				break;
			case DOWN_KEY:
				if (this.focusPosition === this.currentLeaves.length - 1) {
					(this.leafButtonMap.get(this.currentLeaves.at(0)?.id || '') as HTMLElement).focus();
					this.focusPosition = 0;
				} else {
					(this.leafButtonMap.get(this.currentLeaves[this.focusPosition + 1].id || '') as HTMLElement).focus();
					this.focusPosition += 1;
				}
				break;
			case LEFT_KEY: {
				const pageSize = this.leaves.length / this.chars.length;
				if (Math.ceil(pageSize) === 1) {
					break;
				}
				if (this.pagePosition === 0) {
					this.pagePosition = this.leaves.length % this.chars.length === 0 ? Math.floor(pageSize) - 1 : Math.floor(pageSize);
				} else {
					this.pagePosition -= 1;
				}
				this.generateButtons(this.buttonsViewEl, this.currentLeaves);
				break;
			}
			case RIGHT_KEY: {
				const pageSize = this.leaves.length / this.chars.length;
				if (Math.ceil(pageSize) === 1) {
					break;
				}
				const lastPage = this.leaves.length % this.chars.length === 0 ? (pageSize) - 1 : Math.floor(pageSize);
				if (this.pagePosition === lastPage) {
					this.pagePosition = 0;
				} else {
					this.pagePosition += 1;
				}
				this.generateButtons(this.buttonsViewEl, this.currentLeaves);
				break;
			}
			default:
				// nop
				break;
		}
	}
}
