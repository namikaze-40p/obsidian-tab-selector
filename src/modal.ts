import { App, MarkdownView, Modal, View, WorkspaceLeaf, setIcon } from 'obsidian';
import { Settings } from './settings';

export const UP_KEY = 'ArrowUp';
export const DOWN_KEY = 'ArrowDown';
export const LEFT_KEY = 'ArrowLeft';
export const RIGHT_KEY = 'ArrowRight';
export const FOOTER_ITEMS = [
	{ keys: '↑ | ↓', description: 'Move focus' },
	{ keys: '← | →', description: 'Switch pages' },
	{ keys: 'Enter | Space', description: 'Switch to focused tab' },
	{ keys: '', description: 'Quickly switch tab' },
];

type Property = {
	key: string,
	type: string,
	value: string | string[],
}
type CustomView = View & {
	metadataEditor?: {
		properties?: Property[],
	},
}

export class TabSelectorModal extends Modal {
	settings: Settings;
	leaves: (WorkspaceLeaf & { id?: string })[] = [];
	chars: string[] = [];
	buttonMap: Map<string, HTMLButtonElement> = new Map();
	focusPosition = 0;
	pagePosition = 0;
	buttonsViewEl: HTMLDivElement;
	pageCounterEl: HTMLSpanElement;
	eventListenerFunc: (ev: KeyboardEvent) => void;

	get currentLeaves(): (WorkspaceLeaf & { id?: string })[] {
		return this.leaves.slice(0 + this.pagePosition * this.chars.length, this.chars.length + this.pagePosition * this.chars.length);
	}

	constructor(app: App, settings: Settings, leaves: WorkspaceLeaf[]) {
		super(app);
		this.settings = settings;
		this.leaves = leaves;
		this.chars = [...this.settings.characters];
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

	private generateButtons(contentEl: HTMLElement, leaves: (WorkspaceLeaf & { id?: string })[]): void {
		this.focusPosition = 0;
		this.buttonsViewEl.empty();

		leaves.forEach((leaf, idx) => {
			contentEl.createDiv('ts-leaf-row', el => {
				const shortcutBtnEl = el.createEl('button', { text: this.chars.at(idx) });
				shortcutBtnEl.setAttr('tabIndex', -1);
				shortcutBtnEl.addClass('ts-shortcut-btn');
				shortcutBtnEl.addEventListener('click', () => this.clickLeafButton(leaf));

				const itemBtnEl = el.createEl('button');
				itemBtnEl.addClass('ts-leaf-name-btn');
				itemBtnEl.addEventListener('click', () => this.clickLeafButton(leaf));

				const itemNameEl = itemBtnEl.createSpan('ts-leaf-name');
				itemNameEl.setText(leaf.getDisplayText());

				this.reflectOptions(leaf, el, itemBtnEl, itemNameEl);

				this.buttonMap.set(leaf.id || '', itemBtnEl);
			});
		});

		(this.buttonMap.get(this.currentLeaves.at(0)?.id || '') as HTMLElement).focus();
		this.updatePageCount();
	}

	private reflectOptions(leaf: WorkspaceLeaf, el: HTMLDivElement, itemBtnEl: HTMLButtonElement, itemNameEl: HTMLSpanElement): void {
		if((this.settings.showAliases && !this.settings.replaceToAliases) || this.settings.showPaths) {
			el.addClass('ts-leaf-row-added-options');
		}

		if (this.settings.showAliases) {
			const props = (leaf.view as CustomView)?.metadataEditor?.properties || [];
			const aliases = props.filter(prop => prop.key === 'aliases').flatMap(prop => prop.value).filter(value => value != null);
	
			if (this.settings.replaceToAliases) {
				this.replaceLeafName(aliases, itemBtnEl, itemNameEl);
			} else {
				this.addAliasesEl(aliases, itemBtnEl);
			}
		}

		if (this.settings.showPaths) {
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

	private addPathEl(leaf: WorkspaceLeaf, itemBtnEl: HTMLButtonElement): void {
		const wrapperEl = itemBtnEl.createDiv('ts-option-wrapper');
		setIcon(wrapperEl, 'folder-closed');

		const { file } = leaf.getViewState().state;
		const fullPath = typeof file === 'string' ? file.split(leaf.getDisplayText())[0] || '/' : '-';
		const splitPaths = fullPath.split('/').map(path => path.length > 20 ? `${path.slice(0, 20)}...` : path);
		const displayPath = splitPaths.length > 3 ? `.../${splitPaths.at(-3)}/${splitPaths.at(-2)}/` : splitPaths.join('/');

		wrapperEl.createEl('small').setText(displayPath);
	}


	private generateFooter(contentEl: HTMLElement): void {
		contentEl.createDiv('ts-footer', el => {
			if (this.settings.showPaginationButtons && this.leaves.length > this.chars.length) {
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

			if (this.settings.showLegends) {
				FOOTER_ITEMS.forEach(item => {
					el.createDiv('ts-legends', el => {
						el.createSpan('ts-keys').setText(item.keys || `${this.chars.slice(0, 2).join(' | ')} | ... | ${this.chars.slice(-2).join(' | ')}`);
						el.createSpan('ts-description').setText(item.description);
					});
				});
			}
		});
	}

	private updatePageCount(): void {
		this.pageCounterEl.setText(`${this.pagePosition + 1}`);
	}

	private clickLeafButton(leaf: WorkspaceLeaf) {
		this.close();
		this.app.workspace.setActiveLeaf(leaf);
		const view = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (view) {
			view.editor.focus();
		}
	}

	private handlingKeyupEvent(ev: KeyboardEvent): void {
		if (this.chars.includes(ev.key)) {
			this.keyupShortcutKeys(ev.key);
			ev.preventDefault();
			return;
		}

		if ([UP_KEY, DOWN_KEY, LEFT_KEY, RIGHT_KEY].includes(ev.key)) {
			this.keyupArrowKeys(ev.key);
			ev.preventDefault();
			return;
		}
	}

	private keyupShortcutKeys(key: string): void {
		const idx = this.chars.indexOf(key);
		this.buttonMap.get(this.currentLeaves.at(idx)?.id || '')?.click();
	}

	private keyupArrowKeys(key: string): void {
		switch (key) {
			case UP_KEY:
				if (this.focusPosition === 0) {
					(this.buttonMap.get(this.currentLeaves.at(-1)?.id || '') as HTMLElement).focus();
					this.focusPosition = this.currentLeaves.length - 1;
				} else {
					(this.buttonMap.get(this.currentLeaves[this.focusPosition - 1].id || '') as HTMLElement).focus();
					this.focusPosition -= 1;
				}
				break;
			case DOWN_KEY:
				if (this.focusPosition === this.currentLeaves.length - 1) {
					(this.buttonMap.get(this.currentLeaves.at(0)?.id || '') as HTMLElement).focus();
					this.focusPosition = 0;
				} else {
					(this.buttonMap.get(this.currentLeaves[this.focusPosition + 1].id || '') as HTMLElement).focus();
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
