import { Platform, Plugin } from 'obsidian';
import { DEFAULT_SETTINGS, SettingTab, Settings } from './settings';
import { TabSelectorModal } from './tab-selector-modal';
import { CustomWsItem, CustomWsLeaf } from './type';
import { TabHistoryModal } from './tab-history-modal';
import { TabShortcutsModal } from './tab-shortcuts-modal';

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
			id: 'go-to-previous-tab',
			name: 'Go to previous tab',
			callback: () => this.openTabHistoryModal(true),
		});

		this.addCommand({
			id: 'go-to-next-tab',
			name: 'Go to next tab',
			callback: () => this.openTabHistoryModal(false),
		});

		if (Platform.isDesktop || Platform.isTablet) {
			this.addCommand({
				id: 'show-tab-shortcuts',
				name: 'Show tab shortcuts',
				callback: () => this.showTabShortcutsModal(),
			});
		}

		this.settingTab = new SettingTab(this.app, this);
		this.addSettingTab(this.settingTab);
		this.settingTab.updateStyleSheet();
	}

	onunload() {
		this.settingTab.updateStyleSheet(true);
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
		this.migrateSettingValues();
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	private openTabSelectorModal(): void {
		const leaves = this.generateLeaves();
		new TabSelectorModal(this.app, this.settings, leaves).open();
	}

	private openTabHistoryModal(isPrevCommand: boolean): void {
		const leaves = this.generateLeaves();
		new TabHistoryModal(this.app, this.settings, leaves, isPrevCommand).open();
	}

	private showTabShortcutsModal(): void {
		const leaves = this.generateLeaves();
		new TabShortcutsModal(this.app, this.settings, leaves).open();
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

	private async migrateSettingValues(): Promise<void> {
		type OldSettings = {
			// Open tab selector command
			showAliases?: boolean;
			replaceToAliases?: boolean;
			showPaths?: boolean;
			showPaginationButtons?: boolean;
			showLegends?: boolean;
			focusColor?: string;
			characters?: string;
			enableClose?: true,
			// Go to previous/next tab command
			thFocusColor?: string;
			mainModifierKey?: string;
			subModifierKey?: string;
			actionKey?: string;
			howToNextTab?: string;
			reverseActionKey?: string;
			// Show tab shortcuts command
			tshCharacters?: string;
			// Other unnecessary items
			backActionKey?: string;
			howToPreviousTab?: boolean;
			showPaginationButton?: boolean;
			showLegend?: boolean;
		};

		const oldSettings = (this.settings as any) as OldSettings;
		{
			const settings = this.settings.openTabSelector;
			if (typeof oldSettings.showAliases === 'boolean') {
				settings.showAliases = oldSettings.showAliases;
				delete oldSettings.showAliases;
			}
			if (typeof oldSettings.replaceToAliases === 'boolean') {
				settings.replaceToAliases = oldSettings.replaceToAliases;
				delete oldSettings.replaceToAliases;
			}
			if (typeof oldSettings.showPaths === 'boolean') {
				settings.showPaths = oldSettings.showPaths;
				delete oldSettings.showPaths;
			}
			if (typeof oldSettings.showPaginationButtons === 'boolean') {
				settings.showPaginationButtons = oldSettings.showPaginationButtons;
				delete oldSettings.showPaginationButtons;
			}
			if (typeof oldSettings.showLegends === 'boolean') {
				settings.showLegends = oldSettings.showLegends;
				delete oldSettings.showLegends;
			}
			if (typeof oldSettings.focusColor === 'string') {
				settings.focusColor = oldSettings.focusColor;
				delete oldSettings.focusColor;
			}
			if (typeof oldSettings.characters === 'string') {
				settings.characters = oldSettings.characters;
				delete oldSettings.characters;
			}
			if (typeof oldSettings.enableClose === 'boolean') {
				settings.enableClose = oldSettings.enableClose;
				delete oldSettings.enableClose;
			}
		}
		{
			const settings = this.settings.goToPreviousNextTab;
			if (typeof oldSettings.thFocusColor === 'string') {
				settings.focusColor = oldSettings.thFocusColor;
				delete oldSettings.thFocusColor;
			}
			if (typeof oldSettings.mainModifierKey === 'string') {
				settings.mainModifierKey = oldSettings.mainModifierKey;
				delete oldSettings.mainModifierKey;
			}
			if (typeof oldSettings.subModifierKey === 'string') {
				settings.subModifierKey = oldSettings.subModifierKey;
				delete oldSettings.subModifierKey;
			}
			if (typeof oldSettings.actionKey === 'string') {
				settings.actionKey = oldSettings.actionKey;
				delete oldSettings.actionKey;
			}
			if (typeof oldSettings.howToNextTab === 'string') {
				settings.howToNextTab = oldSettings.howToNextTab;
				delete oldSettings.howToNextTab;
			}
			if (typeof oldSettings.reverseActionKey === 'string') {
				settings.reverseActionKey = oldSettings.reverseActionKey;
				delete oldSettings.reverseActionKey;
			}
		}
		{
			const settings = this.settings.showTabShortcuts;
			if (typeof oldSettings.tshCharacters === 'string') {
				settings.characters = oldSettings.tshCharacters;
				delete oldSettings.tshCharacters;
			}
		}
		{
			if (typeof oldSettings.backActionKey === 'string') {
				delete oldSettings.backActionKey;
			}
			if (typeof oldSettings.howToPreviousTab === 'string') {
				delete oldSettings.howToPreviousTab;
			}
			if (typeof oldSettings.showPaginationButton === 'boolean') {
				delete oldSettings.showPaginationButton;
			}
			if (typeof oldSettings.showLegend === 'boolean') {
				delete oldSettings.showLegend;
			}
		}
		await this.saveSettings();
	}
}
