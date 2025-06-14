import { App, Modal } from 'obsidian';
import { Settings, ShowTabShortcutsSettings } from './settings';
import { CustomWsLeaf } from './type';

type WindowItem = { id: string, window: Window, leaves: CustomWsLeaf[] };

export class TabShortcutsModal extends Modal {
	settings: Settings;
	leaves: CustomWsLeaf[] = [];
	chars: string[] = [];
	tabHeaderContainers: (HTMLDivElement | null | undefined)[] = [];
	windows: WindowItem[] = [];
	labelContainerMap: Map<string, HTMLElement> = new Map();
	eventListenerFunc: {
		keyup: (ev: KeyboardEvent) => void,
		resize: () => void,
		click: () => void,
	} = {
		keyup: () => {},
		resize: () => {},
		click: () => {},
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

	onOpen(): void {
		this.modalEl.addClasses(['tab-shortcuts-modal', 'tsh-modal']);

		this.eventListenerFunc.click = this.handlingClickEvent.bind(this);
		this.eventListenerFunc.keyup = this.handlingKeyupEvent.bind(this);
		this.eventListenerFunc.resize = this.handlingResizeEvent.bind(this);
		window.addEventListener('keyup', this.eventListenerFunc.keyup);
		window.addEventListener('resize', this.eventListenerFunc.resize);

		this.windows = this.generateWindows(this.leaves);
		this.showShortcutElements(this.windows);
		this.tabHeaderContainers.forEach(container => container?.addClass('tsh-header-container-inner'));
	}

	onClose(): void {
		this.windows.forEach(({ window }) => window.removeEventListener('click', this.eventListenerFunc.click));
		window.removeEventListener('keyup', this.eventListenerFunc.keyup);
		window.removeEventListener('resize', this.eventListenerFunc.resize);
		this.tabHeaderContainers.forEach(container => container?.removeClass('tsh-header-container-inner'));
		this.labelContainerMap.forEach(el => el.remove());
		this.contentEl.empty();
	}

	private generateWindows(leaves: CustomWsLeaf[]): WindowItem[] {
		return leaves.reduce((acc, cur) => {
			const win = acc.find(window => window.id === cur.parent?.id || '');
			if (win) {
				win.leaves = [...win.leaves, cur];
				return acc;
			} else {
				const newWindow = cur.containerEl?.ownerDocument.defaultView ?? window;
				newWindow.addEventListener('click', this.eventListenerFunc.click);
				return [...acc, { id: cur.parent?.id || '', window: newWindow, leaves: [cur] }];
			}
		}, [] as WindowItem[]);
	}

	private showShortcutElements(windows: WindowItem[]): void {
		windows.forEach(win => {
			const tabContainer = win.leaves[0]?.containerEl?.parentElement?.parentElement;
			this.tabHeaderContainers.push(tabContainer?.querySelector('.workspace-tab-header-container-inner'));
			const headers = tabContainer?.querySelectorAll('.workspace-tab-header-container-inner .workspace-tab-header');
			if (!headers) {
				return;
			}

			const container = createDiv('tab-shortcuts-container');
			win.window.document.body.append(container);
			this.labelContainerMap.set(win.id, container);

			win.leaves.forEach((leaf, idx) => {
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
					this.labelContainerMap.get(win.id)?.appendChild(el);
				});
			});
		});
	}

	private handlingClickEvent(): void {
		this.close();
	}

	private handlingKeyupEvent(ev: KeyboardEvent): void {
		if (this.chars.includes(ev.key)) {
			this.close();
			const leaf = this.leaves.find(leaf => leaf.name === ev.key);
			if (leaf) {
				this.app.workspace.setActiveLeaf(leaf, { focus: true });
			}
			ev.preventDefault();
			return;
		}
	}

	private handlingResizeEvent(): void {
		this.close();
	}
}
