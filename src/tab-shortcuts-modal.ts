import { App, MarkdownView, Modal } from 'obsidian';
import { Settings, ShowTabShortcutsSettings } from './settings';
import { CustomWsLeaf } from './type';

type Tab = { id: string, leaves: CustomWsLeaf[] };

export class TabShortcutsModal extends Modal {
	settings: Settings;
	leaves: CustomWsLeaf[] = [];
	chars: string[] = [];
	tabHeaderContainers: (HTMLDivElement | null | undefined)[] = [];
	labelsContainer: HTMLDivElement;
	eventListenerFunc: {
		keyup: (ev: KeyboardEvent) => void,
		resize: () => void,
	} = {
		keyup: () => {},
		resize: () => {},
	};

	get modalSettings(): ShowTabShortcutsSettings {
		return this.settings.showTabShortcuts;
	}

	constructor(app: App, settings: Settings, leaves: CustomWsLeaf[]) {
		super(app);
		this.settings = settings;
		this.chars = [...this.modalSettings.characters];
		this.leaves = leaves.map((leaf, idx) => {
			leaf.name = idx < this.chars.length ? this.chars[idx] : '';
			return leaf;
		});
	}

	onOpen() {
		this.modalEl.addClasses(['tab-shortcuts-modal', 'tsh-modal']);

		this.labelsContainer = createDiv('tab-shortcuts-container');
		this.modalEl.parentElement?.append(this.labelsContainer);

		const tabs = this.generateTabs(this.leaves);
		this.showShortcutElements(tabs);
		this.tabHeaderContainers.forEach(container => container?.addClass('tsh-header-container-inner'));

		this.eventListenerFunc.keyup = this.handlingKeyupEvent.bind(this);
		this.eventListenerFunc.resize = this.handlingResizeEvent.bind(this);
		window.addEventListener('keyup', this.eventListenerFunc.keyup);
		window.addEventListener('resize', this.eventListenerFunc.resize);
	}

	onClose() {
		window.removeEventListener('keyup', this.eventListenerFunc.keyup);
		window.removeEventListener('resize', this.eventListenerFunc.resize);
		this.tabHeaderContainers.forEach(container => container?.removeClass('tsh-header-container-inner'));
		this.contentEl.empty();
		this.labelsContainer.remove();
	}

	private generateTabs(leaves: CustomWsLeaf[]): Tab[] {
		return leaves.reduce((acc, cur) => {
			const tab = acc.find(tab => tab.id === cur.parent?.id || '');
			if (tab) {
				tab.leaves = [...tab.leaves, cur];
				return acc;
			} else {
				return [...acc, { id: cur.parent?.id || '', leaves: [cur] }];
			}
		}, [] as Tab[]);
	}

	private showShortcutElements(tabs: Tab[]): void {
		tabs.forEach(tab => {
			const tabContainer = tab.leaves[0]?.containerEl?.parentElement?.parentElement;
			this.tabHeaderContainers.push(tabContainer?.querySelector('.workspace-tab-header-container-inner'));
			const headers = tabContainer?.querySelectorAll('.workspace-tab-header-container-inner .workspace-tab-header');
			if (!headers) {
				return;
			}
			tab.leaves.forEach((leaf, idx) => {
				if (!this.chars.length) {
					return;
				}
				const pos = headers[idx].getBoundingClientRect();
				createDiv('tsh-label', el => {
					el.setText(leaf.name || '');
					el.setCssProps({
						top: `${pos.bottom}px`,
						left: `calc(${pos.left}px + 0.5rem)`,
					});
					this.labelsContainer.appendChild(el);
				});
			});
		});

	}

	private handlingKeyupEvent(ev: KeyboardEvent): void {
		if (this.chars.includes(ev.key)) {
			this.close();
			const leaf = this.leaves.find(leaf => leaf.name === ev.key);
			if (leaf) {
				this.app.workspace.setActiveLeaf(leaf);
				const view = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (view) {
					view.editor.focus();
				}
			}
			ev.preventDefault();
			return;
		}
	}

	private handlingResizeEvent(): void {
		this.close();
	}
}
