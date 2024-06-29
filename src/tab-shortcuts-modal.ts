import { App, MarkdownView, Modal } from 'obsidian';
import { Settings, ShowTabShortcutsSettings } from './settings';
import { CustomWsLeaf } from './type';

export class TabShortcutsModal extends Modal {
	settings: Settings;
	leaves: CustomWsLeaf[] = [];
	chars: string[] = [];
	tabHeaderContainer?: HTMLDivElement | null;
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
			if (idx < this.chars.length) {
				leaf.name = this.chars[idx];
			}
			return leaf;
		});
	}

	onOpen() {
		this.modalEl.addClasses(['tab-shortcuts-modal', 'tsh-modal']);

		this.labelsContainer = createDiv('tab-shortcuts-container');
		this.modalEl.parentElement?.append(this.labelsContainer);

		const headerContainer = this.leaves[0]?.containerEl?.parentElement?.parentElement;
		this.tabHeaderContainer = headerContainer?.querySelector('.workspace-tab-header-container-inner');
		this.tabHeaderContainer?.addClass('tsh-header-container-inner');
		const headers = headerContainer?.querySelectorAll('.workspace-tab-header-container-inner .workspace-tab-header');
		
		if (headers) {
			headers.forEach((header, idx) => {
				if (idx >= this.chars.length) {
					return;
				}
				const pos = header.getBoundingClientRect();
				createDiv('tsh-label', el => {
					el.setText(this.leaves[idx].name || '');
					el.setCssProps({
						top: `${pos.bottom}px`,
						left: `calc(${pos.left}px + 0.5rem)`,
					});
					this.labelsContainer.appendChild(el);
				});
			});
		}

		this.eventListenerFunc.keyup = this.handlingKeyupEvent.bind(this);
		this.eventListenerFunc.resize = this.handlingResizeEvent.bind(this);
		window.addEventListener('keyup', this.eventListenerFunc.keyup);
		window.addEventListener('resize', this.eventListenerFunc.resize);
	}

	onClose() {
		window.removeEventListener('keyup', this.eventListenerFunc.keyup);
		window.removeEventListener('resize', this.eventListenerFunc.resize);
		this.tabHeaderContainer?.removeClass('tsh-header-container-inner');
		this.contentEl.empty();
		this.labelsContainer.remove();
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
