import { Plugin } from 'obsidian';
import { DEFAULT_SETTINGS, SettingTab, Settings } from './settings';
import { TabSelectorModal } from './tab-selector-modal';
import { CustomWsItem, CustomWsLeaf } from './type';
import { TabHistoryModal } from './tab-history-modal';

export default class TabSelector extends Plugin {
	settings: Settings;
	settingTab: SettingTab;

	async onload() {
		await this.loadSettings();

		this.addRibbonIcon('file-check-2', 'Open tab selector', () => this.openTabSelectorModal());

		this.addCommand({
			id: 'open-tab-selector',
			name: 'Open tab selector',
			callback: () => this.openTabSelectorModal(),
		});

		this.addCommand({
			id: 'go-to-next-tab',
			name: 'Go to next tab',
			callback: () => this.openTabHistoryModal(),
		});

		this.addCommand({
			id: 'go-to-previous-tab',
			name: 'Go to previous tab',
			callback: () => this.openTabHistoryModal(),
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
		const leaves = this.generateLeaves();
		new TabSelectorModal(this.app, this.settings, leaves).open();
	}

	private openTabHistoryModal(): void {
		const leaves = this.generateLeaves();
		new TabHistoryModal(this.app, this.settings, leaves).open();
	}

	private generateLeaves(): CustomWsLeaf[] {
		const rootLeafIds: string[] = [];
		this.app.workspace.iterateRootLeaves((leaf: CustomWsLeaf) => {
			rootLeafIds.push(leaf?.id || '');
		});

		const targetLeaves: CustomWsLeaf[] = [];
		const { id: rootId, type: rootType } = (this.app.workspace.getMostRecentLeaf()?.getRoot()) as CustomWsItem;
		this.app.workspace.iterateAllLeaves((leaf: CustomWsLeaf) => {
			if (rootId !== (leaf.getRoot() as CustomWsItem).id) {
				return;
			}
			if ((leaf.id && rootLeafIds.includes(leaf.id)) || rootType === 'floating') {
				targetLeaves.push(leaf);
			}
		});
		return targetLeaves;
	}
}
