import { Plugin, WorkspaceItem, WorkspaceLeaf } from 'obsidian';
import { DEFAULT_SETTINGS, SettingTab, Settings } from './settings';
import { TabSelectorModal } from './modal';

export default class TabSelector extends Plugin {
	settings: Settings;
	settingTab: SettingTab;

	async onload() {
		await this.loadSettings();

		this.addRibbonIcon('files', 'Tab Selector', () => this.openTabSelectorModal());

		this.addCommand({
			id: 'open-tab-selector',
			name: 'Open tab selector',
			callback: () => this.openTabSelectorModal(),
		});

		this.settingTab = new SettingTab(this.app, this);
		this.addSettingTab(this.settingTab);
		this.settingTab.updateStyleSheet();
	}

	onunload() {
		this.settingTab.updateStyleSheet(true);
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	private openTabSelectorModal(): void {
		const rootLeafIds: string[] = [];
		this.app.workspace.iterateRootLeaves(leaf => {
			rootLeafIds.push((leaf as WorkspaceLeaf & { id: string }).id)
		});

		const targetLeaves: WorkspaceLeaf[] = [];
		const { id: rootId, type: rootType } = (this.app.workspace.getMostRecentLeaf()?.getRoot()) as WorkspaceItem & { id: string, type: string };
		this.app.workspace.iterateAllLeaves((leaf: WorkspaceLeaf & { id: string }) => {
			if (rootId !== (leaf.getRoot() as WorkspaceItem & { id: string }).id) {
				return;
			}
			if (rootLeafIds.includes(leaf.id) || rootType === 'floating') {
				targetLeaves.push(leaf);
			}
		});
		new TabSelectorModal(this.app, this.settings, targetLeaves).open();
	}
}
