import { App, FuzzyMatch, FuzzySuggestModal, prepareFuzzySearch, setIcon } from 'obsidian';
import { CustomView, CustomWsLeaf } from './type';
import { SearchTabSettings, Settings } from './settings';

const FOOTER_ITEMS = [
	{ keys: '↑ | ↓', description: 'Move focus' },
	{ keys: 'Enter', description: 'Switch to focused tab' },
];

export class TabSearchModal extends FuzzySuggestModal<CustomWsLeaf> {
	private get modalSettings(): SearchTabSettings {
		return this._settings.searchTab;
	}

	constructor(app: App, private _settings: Settings, private _leaves: CustomWsLeaf[]) {
		super(app);

		this._leaves = this._leaves.map(leaf => {
			leaf.name = leaf.getDisplayText();

			const props = (leaf.view as CustomView)?.metadataEditor?.properties || [];
			leaf.aliases = props.filter(prop => prop.key === 'aliases').flatMap(prop => prop.value).filter(value => value != null);

			const { file } = leaf.getViewState().state;
			const fullPath = typeof file === 'string' ? file.split(leaf.getDisplayText())[0] || '/' : '-';
			leaf.path = fullPath;

			return leaf;
		});

		this.setPlaceholder('Search tabs');
		this.modalEl.addClasses(['tab-search-modal', 'tse-modal']);
		if (this.modalSettings.showLegends) {
			this.generateFooter(this.modalEl);
		}
	}

	getItems(): CustomWsLeaf[] {
		return this._leaves;
	}
  
	getItemText(leaf: CustomWsLeaf): string {
		return leaf.name || '';
	}

	getSuggestions(query: string): FuzzyMatch<CustomWsLeaf>[] {
		return this.getItems()
			.filter(item => this.getReferenceStrings(item).some(refString => prepareFuzzySearch(query)(refString)))
			.map((item) => ({ item, match: { score: 0, matches: [] } }));
	}
  
	onChooseItem(leaf: CustomWsLeaf): void {
		this.app.workspace.setActiveLeaf(leaf, { focus: true });
	}

	renderSuggestion(item: FuzzyMatch<CustomWsLeaf>, suggestionItemEl: HTMLElement): HTMLElement {
		suggestionItemEl.createDiv('tse-item-row', el => {
			el.setText(item.item.name || '');
		});
		if (this.modalSettings.showAliases) {			
			suggestionItemEl.createDiv('tse-item-row', el => {
				setIcon(el, 'corner-up-right');
				el.createEl('small').setText(item.item.aliases?.join(' | ') || '');
			});
		}
		if (this.modalSettings.showPaths) {
			suggestionItemEl.createDiv('tse-item-row', el => {
				setIcon(el, 'folder-closed');
				el.createEl('small').setText(item.item.path || '');
			});
		}
		return suggestionItemEl;
	}

	private getReferenceStrings(item: CustomWsLeaf): string[] {
		const name = item.name || '';
		const { showAliases, includeAliases, showPaths, includePaths} = this.modalSettings;
		const aliases = showAliases && includeAliases ? (item.aliases?.join(' ') || '') : '';
		const path = showPaths && includePaths ? item.path : '';

		const case1 = `${name} ${aliases} ${path}`
		const case2 = `${name} ${path} ${aliases}`
		const case3 = `${aliases} ${name} ${path}`
		const case4 = `${aliases} ${path} ${name}`
		const case5 = `${path} ${name} ${aliases}`
		const case6 = `${path} ${aliases} ${name}`
		return [case1, case2, case3, case4, case5, case6];
	}

	private generateFooter(contentEl: HTMLElement): void {
		contentEl.createDiv('tse-footer', el => {
			FOOTER_ITEMS.forEach(item => {
				el.createDiv('tse-legends', el => {
					el.createSpan('tse-keys').setText(item.keys);
					el.createSpan('tse-description').setText(item.description);
				});
			});
		});
	}
}
