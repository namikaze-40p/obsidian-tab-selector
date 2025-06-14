import { App, Modal } from 'obsidian';
import { Settings, ShowTabShortcutsSettings } from './settings';
import { CustomWsLeaf } from './type';

type WindowItem = { id: string, window: Window, leaves: CustomWsLeaf[] };

export class TabShortcutsModal extends Modal {
	private _chars: string[] = [];
	private _tabHeaderContainers: (HTMLDivElement | null | undefined)[] = [];
	private _windows: WindowItem[] = [];
	private _labelContainerMap: Map<string, HTMLElement> = new Map();
	private _eventListenerFunc: {
		keyup: (ev: KeyboardEvent) => void,
		resize: () => void,
		click: () => void,
	} = {
		keyup: () => {},
		resize: () => {},
		click: () => {},
	};

	private get modalSettings(): ShowTabShortcutsSettings {
		return this._settings.showTabShortcuts;
	}

	constructor(app: App, private _settings: Settings, private _leaves: CustomWsLeaf[]) {
		super(app);

		this._chars = [...this.modalSettings.characters];
		this._leaves = this._leaves.map((leaf, idx) => {
			leaf.name = idx < this._chars.length ? this._chars[idx] : '';
			return leaf;
		});
	}

	onOpen(): void {
		this.modalEl.addClasses(['tab-shortcuts-modal', 'tsh-modal']);

		this._eventListenerFunc.click = this.handlingClickEvent.bind(this);
		this._eventListenerFunc.keyup = this.handlingKeyupEvent.bind(this);
		this._eventListenerFunc.resize = this.handlingResizeEvent.bind(this);
		window.addEventListener('keyup', this._eventListenerFunc.keyup);
		window.addEventListener('resize', this._eventListenerFunc.resize);

		this._windows = this.generateWindows(this._leaves);
		this.showShortcutElements(this._windows);
		this._tabHeaderContainers.forEach(container => container?.addClass('tsh-header-container-inner'));
	}

	onClose(): void {
		this._windows.forEach(({ window }) => window.removeEventListener('click', this._eventListenerFunc.click));
		window.removeEventListener('keyup', this._eventListenerFunc.keyup);
		window.removeEventListener('resize', this._eventListenerFunc.resize);
		this._tabHeaderContainers.forEach(container => container?.removeClass('tsh-header-container-inner'));
		this._labelContainerMap.forEach(el => el.remove());
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
				newWindow.addEventListener('click', this._eventListenerFunc.click);
				return [...acc, { id: cur.parent?.id || '', window: newWindow, leaves: [cur] }];
			}
		}, [] as WindowItem[]);
	}

	private showShortcutElements(windows: WindowItem[]): void {
		windows.forEach(win => {
			const tabContainer = win.leaves[0]?.containerEl?.parentElement?.parentElement;
			this._tabHeaderContainers.push(tabContainer?.querySelector('.workspace-tab-header-container-inner'));
			const headers = tabContainer?.querySelectorAll('.workspace-tab-header-container-inner .workspace-tab-header');
			if (!headers) {
				return;
			}

			const container = createDiv('tab-shortcuts-container');
			win.window.document.body.append(container);
			this._labelContainerMap.set(win.id, container);

			win.leaves.forEach((leaf, idx) => {
				if (!this._chars.length) {
					return;
				}
				const pos = headers[idx].getBoundingClientRect();
				createDiv('tsh-label', el => {
					el.setText(leaf.name || '');
					el.setCssProps({
						top: `${pos.bottom}px`,
						left: `calc(${pos.left}px + 0.5rem)`,
					});
					this._labelContainerMap.get(win.id)?.appendChild(el);
				});
			});
		});
	}

	private handlingClickEvent(): void {
		this.close();
	}

	private handlingKeyupEvent(ev: KeyboardEvent): void {
		if (this._chars.includes(ev.key)) {
			this.close();
			const leaf = this._leaves.find(leaf => leaf.name === ev.key);
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
