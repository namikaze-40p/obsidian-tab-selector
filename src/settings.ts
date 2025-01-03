import { App, Platform, PluginSettingTab, Setting, setIcon } from 'obsidian';
import TabSelector from './main';
import { createStyles, deleteStyles, isValidSettings } from './util';

export const MODIFIER_KEY: Record<string, string> = {
	ctrl: 'Control',
	alt: 'Alt',
	meta: 'Meta',
	shift: 'Shift',
} as const;

const IS_APPLE = Platform.isMacOS || Platform.isIosApp;

const DISPLAY_MODIFIER_KEY: Record<string, string> = {
	ctrl: IS_APPLE ? '^' : 'Ctrl',
	alt: IS_APPLE ? '⌥' : 'Alt',
	meta: IS_APPLE ? '⌘' : 'Win',
	shift: IS_APPLE ? '⇧' : 'Shift',
} as const;

const ACTION_KEY: Record<string, string> = {
	tab: 'Tab',
	arrowUp: 'ArrowUp',
	arrowDown: 'ArrowDown',
	arrowLeft: 'ArrowLeft',
	arrowRight: 'ArrowRight',
} as const;

const DISPLAY_ACTION_KEY: Record<string, string> = {
	tab: 'Tab',
	arrowUp: '↑',
	arrowDown: '↓',
	arrowLeft: '←',
	arrowRight: '→',
} as const;

export const HOW_TO_NEXT_TAB: Record<string, string> = {
	useSubModifierKey: 'useSubModifierKey',
	useReverseActionKey: 'useReverseActionKey',
} as const;

const DISPLAY_HOW_TO_NEXT_TAB: Record<string, string> = {
	useSubModifierKey: 'Sub modifier key',
	useReverseActionKey: 'Reverse action key',
} as const;

const SETTING_TYPE = {
	goToPreviousNextTab: 'goToPreviousNextTab',
	openTabSelector: 'openTabSelector',
	showTabShortcuts: 'showTabShortcuts',
	searchTab: 'searchTab',
} as const;

export interface GoToPreviousNextTabSettings {
	enableMultiWIndow: boolean;
	focusColor: string;
	mainModifierKey: keyof typeof MODIFIER_KEY;
	subModifierKey: keyof typeof MODIFIER_KEY;
	actionKey: keyof typeof ACTION_KEY;
	reverseActionKey: keyof typeof ACTION_KEY;
	howToNextTab: keyof typeof HOW_TO_NEXT_TAB;	
}

export interface OpenTabSelectorSettings {
	enableMultiWIndow: boolean;
	showAliases: boolean;
	replaceToAliases: boolean;
	showPaths: boolean;
	showPaginationButtons: boolean;
	showLegends: boolean;
	focusColor: string;
	characters: string;
	enableClose: boolean;
}

export interface ShowTabShortcutsSettings {
	enableMultiWIndow: boolean;
	characters: string;
}

export interface SearchTabSettings {
	enableMultiWIndow: boolean;
	showAliases: boolean;
	includeAliases: boolean;
	showPaths: boolean;
	includePaths: boolean;
	showLegends: boolean;
	focusColor: string;
}

export interface Settings {
	[SETTING_TYPE.goToPreviousNextTab]: GoToPreviousNextTabSettings;
	[SETTING_TYPE.openTabSelector]: OpenTabSelectorSettings;
	[SETTING_TYPE.showTabShortcuts]: ShowTabShortcutsSettings;
	[SETTING_TYPE.searchTab]: SearchTabSettings;
}

export const DEFAULT_SETTINGS: Settings = {
	[SETTING_TYPE.goToPreviousNextTab]: {
		enableMultiWIndow: false,
		focusColor: '#00b4e0',
		mainModifierKey: MODIFIER_KEY.ctrl,
		subModifierKey: MODIFIER_KEY.shift,
		actionKey: ACTION_KEY.tab,
		reverseActionKey: ACTION_KEY.arrowLeft,
		howToNextTab: HOW_TO_NEXT_TAB.useSubModifierKey,	
	},
	[SETTING_TYPE.openTabSelector]: {
		enableMultiWIndow: false,
		showAliases: false,
		replaceToAliases: false,
		showPaths: false,
		showPaginationButtons: true,
		showLegends: true,
		focusColor: '#00b4e0',
		characters: 'asdfghjkl;',
		enableClose: true,
	},
	[SETTING_TYPE.showTabShortcuts]: {
		enableMultiWIndow: false,
		characters: 'asdfghjkl;qwertyuiopzxcvbnm,./'
	},
	[SETTING_TYPE.searchTab]: {
		enableMultiWIndow: false,
		showAliases: false,
		includeAliases: false,
		showPaths: false,
		includePaths: false,
		showLegends: true,
		focusColor: '#00b4e0',
	},
} as const;

export const CHAR_LENGTH = {
	min: 4,
	max: 10,
} as const;

export class SettingTab extends PluginSettingTab {
	plugin: TabSelector;
	isOpen = {
		firstDetails: false,
		secondDetails: false,
		thirdDetails: false,
		fourthDetails: false,
	};

	constructor(app: App, plugin: TabSelector) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.addClass('ts-settings');

		{
			const detailsEl = containerEl.createEl('details', '', el => {
				el.createEl('summary', '', summaryEl => {
					summaryEl.setText('For "Go to previous/next tab" command');
				});
			});
			if (this.isOpen.firstDetails) {
				detailsEl.setAttr('open', true);
			}
			detailsEl.addEventListener("toggle", () => this.isOpen.firstDetails = detailsEl.open);
			this.setForGoToPrevNextTabCommands(detailsEl);
		}

		{
			const detailsEl = containerEl.createEl('details', '', el => {
				el.createEl('summary', '', summaryEl => {
					summaryEl.setText('For "Open tab selector" command');
				});
			});
			if (this.isOpen.secondDetails) {
				detailsEl.setAttr('open', true);
			}
			detailsEl.addEventListener("toggle", () => this.isOpen.secondDetails = detailsEl.open);
			this.setForOpenTabSelectorCommand(detailsEl);
		}

		if (Platform.isDesktop || Platform.isTablet) {
			{
				const detailsEl = containerEl.createEl('details', '', el => {
					el.createEl('summary', '', summaryEl => {
						summaryEl.setText('For "Show tab shortcuts" command');
					});
				});
				if (this.isOpen.thirdDetails) {
					detailsEl.setAttr('open', true);
				}
				detailsEl.addEventListener("toggle", () => this.isOpen.thirdDetails = detailsEl.open);
				this.setForShowTabShortcutCommand(detailsEl);
			}
		}

		{
			const detailsEl = containerEl.createEl('details', '', el => {
				el.createEl('summary', '', summaryEl => {
					summaryEl.setText('For "Search tabs" command');
				});
			});
			if (this.isOpen.fourthDetails) {
				detailsEl.setAttr('open', true);
			}
			detailsEl.addEventListener("toggle", () => this.isOpen.fourthDetails = detailsEl.open);
			this.setForSearchTabCommand(detailsEl);
		}

	}

	updateStyleSheet(isTeardown = false): void {
		deleteStyles();
		if (isTeardown) {
			return;
		}

		const { goToPreviousNextTab, openTabSelector, searchTab } = this.plugin.settings;
		const { focusColor } = openTabSelector;
		const { focusColor: thFocusColor } = goToPreviousNextTab;
		const { focusColor: tseFocusColor } = searchTab;
		createStyles([
			{ selector: '.ts-leaf-name-btn:focus', property: 'outline', value: `2px solid ${focusColor}` },
			{ selector: '.th-leaf-name-btn.is-focus', property: 'outline', value: `2px solid ${thFocusColor}` },
			{ selector: '.tab-search-modal .suggestion-item.is-selected',  property: 'outline', value: `2px solid ${tseFocusColor}` },
		]);
	}

	private setForGoToPrevNextTabCommands(detailsEl: HTMLDetailsElement): void {
		const settingType = SETTING_TYPE.goToPreviousNextTab;
		const settings = this.plugin.settings[settingType];

		if (Platform.isDesktop) {
			new Setting(detailsEl)
				.setName(`Enable multiple window`)
				.setDesc(`When enabled, all window's tabs is selectable. When disabled, only active window's tabs is selectable.`)
				.addToggle(toggle => toggle.setValue(settings.enableMultiWIndow)
				.onChange(async value => {
					settings.enableMultiWIndow = value;
					await this.plugin.saveData(this.plugin.settings);
				}),
			);
		}

		new Setting(detailsEl)
			.setName('Color of button frame on focus')
			.setDesc('Choose your favorite color.')
			.addColorPicker(colorPicker => colorPicker.setValue(settings.focusColor)
				.onChange(async value => {
					settings.focusColor = value;
					await this.plugin.saveData(this.plugin.settings);
					this.updateStyleSheet();
				}),
			)
			.then(settingEl => {
				const setDefaultValue = () => settings.focusColor = DEFAULT_SETTINGS[settingType].focusColor;
				this.addResetButton(settingEl, setDefaultValue);
			});

		new Setting(detailsEl)
			.setName('Main modifier key')
			.setDesc('Holding this key down keeps the modal open. When this key is released, it switches to the focused tab.')
			.addDropdown(item => item
				.addOptions(Object.keys(MODIFIER_KEY).reduce((obj, key) => (obj[key] = DISPLAY_MODIFIER_KEY[key], obj), {} as typeof MODIFIER_KEY))
				.setValue(this.convertToKey(settings.mainModifierKey, MODIFIER_KEY))
				.onChange(async value => {
					settings.mainModifierKey = this.convertToSettingValue(value, MODIFIER_KEY, DISPLAY_MODIFIER_KEY);
					await this.plugin.saveData(this.plugin.settings);
					this.display();
				}),
			)
			.then(settingEl => {
				const setDefaultValue = () => settings.mainModifierKey = DEFAULT_SETTINGS[settingType].mainModifierKey;
				this.addResetButton(settingEl, setDefaultValue);
			});

		new Setting(detailsEl)
			.setName('Action key')
			.setDesc('Press this key while holding down the Main modifier key moves to the previous tab.')
			.addDropdown(item => item
				.addOptions(Object.keys(ACTION_KEY).reduce((obj, key) => (obj[key] = DISPLAY_ACTION_KEY[key], obj), {} as typeof ACTION_KEY))
				.setValue(this.convertToKey(settings.actionKey, ACTION_KEY))
				.onChange(async value => {
					settings.actionKey = this.convertToSettingValue(value, ACTION_KEY, DISPLAY_ACTION_KEY);
					await this.plugin.saveData(this.plugin.settings);
					this.display();
				}),
			)
			.then(settingEl => {
				const setDefaultValue = () => settings.actionKey = DEFAULT_SETTINGS[settingType].actionKey;
				this.addResetButton(settingEl, setDefaultValue);
			});
		
		new Setting(detailsEl)
			.setName('Choose how to go to the next tab')
			.setDesc(`
				When go to the next tab, if you want to use the same key as the Action key, choose “Sub modifier key”.
				If you want to use a different key from the Action key, choose “Reverse action key".
			`)
			.addDropdown(item => item
				.addOptions(Object.keys(HOW_TO_NEXT_TAB).reduce((obj, key) => (obj[key] = DISPLAY_HOW_TO_NEXT_TAB[key], obj), {} as typeof HOW_TO_NEXT_TAB))
				.setValue(this.convertToKey(settings.howToNextTab, HOW_TO_NEXT_TAB))
				.onChange(async value => {
					settings.howToNextTab = value as keyof typeof HOW_TO_NEXT_TAB;
					await this.plugin.saveData(this.plugin.settings);
					this.display();
				}),
			)
			.then(settingEl => {
				const setDefaultValue = () => settings.howToNextTab = DEFAULT_SETTINGS[settingType].howToNextTab;
				this.addResetButton(settingEl, setDefaultValue);
			});

		new Setting(detailsEl)
			.setName('Sub modifier key')
			.setDesc('Pressing the Action key while holding this key down moves to the next tab.')
			.addDropdown(item => item
				.addOptions(Object.keys(MODIFIER_KEY).reduce((obj, key) => (obj[key] = DISPLAY_MODIFIER_KEY[key], obj), {} as typeof MODIFIER_KEY))
				.setValue(this.convertToKey(settings.subModifierKey, MODIFIER_KEY))
				.onChange(async value => {
					settings.subModifierKey = this.convertToSettingValue(value, MODIFIER_KEY, DISPLAY_MODIFIER_KEY);
					await this.plugin.saveData(this.plugin.settings);
					this.display();
				}),
			)
			.setDisabled(settings.howToNextTab !== HOW_TO_NEXT_TAB.useSubModifierKey)
			.then(settingEl => {
				if (settings.howToNextTab === HOW_TO_NEXT_TAB.useSubModifierKey) {
					const setDefaultValue = () => settings.subModifierKey = DEFAULT_SETTINGS[settingType].subModifierKey;
					this.addResetButton(settingEl, setDefaultValue);
				}
			});

		new Setting(detailsEl)
			.setName('Reverse action key')
			.setDesc('Press this key while holding down the Main modifier key moves to the next tab.')
			.addDropdown(item => item
				.addOptions(Object.keys(ACTION_KEY).reduce((obj, key) => (obj[key] = DISPLAY_ACTION_KEY[key], obj), {} as typeof ACTION_KEY))
				.setValue(this.convertToKey(settings.reverseActionKey, ACTION_KEY))
				.onChange(async value => {
					settings.reverseActionKey = this.convertToSettingValue(value, ACTION_KEY, DISPLAY_ACTION_KEY);
					await this.plugin.saveData(this.plugin.settings);
					this.display();
				}),
			)
			.setDisabled(settings.howToNextTab !== HOW_TO_NEXT_TAB.useReverseActionKey)
			.then(settingEl => {
				if (settings.howToNextTab === HOW_TO_NEXT_TAB.useSubModifierKey) {
					const setDefaultValue = () => settings.reverseActionKey = DEFAULT_SETTINGS[settingType].reverseActionKey;
					this.addResetButton(settingEl, setDefaultValue);
				}
			});

		detailsEl.createDiv('th-how-to-use', el => {
			el.createDiv('th-settings-description', divEl => {
				divEl.createSpan('th-description-title').setText('How to use');
				divEl.createSpan('').setText('1. Configure the above settings.');
				divEl.createSpan('').setText('2. Set the hotkeys to match for the following commands.');
			});

			const { mainModifierKey, subModifierKey, actionKey, reverseActionKey, howToNextTab } = settings;
			const mainModifier = this.convertToDisplayText(mainModifierKey, MODIFIER_KEY, DISPLAY_MODIFIER_KEY);
			const subModifier = this.convertToDisplayText(subModifierKey, MODIFIER_KEY, DISPLAY_MODIFIER_KEY);
			const action = this.convertToDisplayText(actionKey, ACTION_KEY, DISPLAY_ACTION_KEY);
			const reverseAction = this.convertToDisplayText(reverseActionKey, ACTION_KEY, DISPLAY_ACTION_KEY);
			const useSubModifier = howToNextTab === HOW_TO_NEXT_TAB.useSubModifierKey;

			el.createDiv('th-hotkey-preview', divEl => {
				divEl.createSpan('th-hotkey-preview-label').setText('"Tab Selector: Go to next tab": ');
				divEl.createSpan('th-hotkey-preview-value').setText((useSubModifier ? [mainModifier, subModifier, action] : [mainModifier, reverseAction]).join(IS_APPLE ? '' : ' + '));
			});
			el.createDiv('th-hotkey-preview', divEl => {
				divEl.createSpan('th-hotkey-preview-label').setText('"Tab Selector: Go to previous tab": ');
				divEl.createSpan('th-hotkey-preview-value').setText([mainModifier, action].join(IS_APPLE ? '' : ' + '));
			});

			el.createDiv('th-match-state', divEl => {
				const isMatchKeys = isValidSettings(this.app, settings, false);
				divEl.addClass(isMatchKeys ? 'is-match' : 'is-mismatch');
				divEl.createSpan('th-match-icon', spanEl => setIcon(spanEl, isMatchKeys ? 'check' : 'x'));
				divEl.createSpan('').setText(`Currently hotkeys ${isMatchKeys ? 'match' : 'mismatch'} the above commands.`);
			});

			el.createDiv('th-settings-caution', divEl => {
				divEl.createSpan('th-settings-caution-title').setText('Caution');
				divEl.createSpan('').setText(`
					Don't use shortcut keys reserved by the OS.
					OS shortcut keys take precedence and don't work properly.
				`);
			});
		});
	}

	private setForOpenTabSelectorCommand(detailsEl: HTMLDetailsElement): void {
		const settingType = SETTING_TYPE.openTabSelector;
		const settings = this.plugin.settings[settingType];

		if (Platform.isDesktop) {
			new Setting(detailsEl)
				.setName(`Enable multiple window`)
				.setDesc(`When enabled, all window's tabs is selectable. When disabled, only active window's tabs is selectable.`)
				.addToggle(toggle => toggle.setValue(settings.enableMultiWIndow)
					.onChange(async value => {
						settings.enableMultiWIndow = value;
						await this.plugin.saveData(this.plugin.settings);
					}),
				);
		}

		new Setting(detailsEl)
			.setName(`Show aliases`)
			.setDesc(`When enabled, show file's aliases on button.`)
			.addToggle(toggle => toggle.setValue(settings.showAliases)
				.onChange(async value => {
					settings.showAliases = value;
					settings.replaceToAliases = false;
					await this.plugin.saveData(this.plugin.settings);
					this.updateStyleSheet();
					this.display();
				}),
			);

		new Setting(detailsEl)
			.setName(`Replace the filename to aliases`)
			.setDesc(`When enabled, if aliases is set the file, replace the filename to aliases.`)
			.addToggle(toggle => toggle.setValue(settings.replaceToAliases)
				.onChange(async value => {
					settings.replaceToAliases = value;
					await this.plugin.saveData(this.plugin.settings);
					this.updateStyleSheet();
				}),
			)
			.setDisabled(!settings.showAliases);

		new Setting(detailsEl)
			.setName(`Show paths`)
			.setDesc(`When enabled, show file's paths on button.`)
			.addToggle(toggle => toggle.setValue(settings.showPaths)
				.onChange(async value => {
					settings.showPaths = value;
					await this.plugin.saveData(this.plugin.settings);
					this.updateStyleSheet();
				}),
			);
		
		new Setting(detailsEl)
			.setName(`Show pagination buttons`)
			.setDesc('When enabled, show pagination buttons on modal.')
			.addToggle(toggle => toggle.setValue(settings.showPaginationButtons)
				.onChange(async value => {
					settings.showPaginationButtons = value;
					await this.plugin.saveData(this.plugin.settings);
				}),
			);
		
		new Setting(detailsEl)
			.setName(`Show legends`)
			.setDesc('When enabled, show legends on modal.')
			.addToggle(toggle => toggle.setValue(settings.showLegends)
				.onChange(async value => {
					settings.showLegends = value;
					await this.plugin.saveData(this.plugin.settings);
				}),
			);
		
		new Setting(detailsEl)
			.setName('Color of button frame on focus')
			.setDesc('Choice your favorite color.')
			.addColorPicker(colorPicker => colorPicker.setValue(settings.focusColor)
				.onChange(async value => {
					settings.focusColor = value;
					await this.plugin.saveData(this.plugin.settings);
					this.updateStyleSheet();
				}),
			)
			.then(settingEl => {
				const setDefaultValue = () => settings.focusColor = DEFAULT_SETTINGS[settingType].focusColor;
				this.addResetButton(settingEl, setDefaultValue);
			});

		new Setting(detailsEl)
			.setName('Characters used for button hints')
			.setDesc(`Enter ${CHAR_LENGTH.min}~${CHAR_LENGTH.max} non-duplicate alphanumeric characters or symbols.`)
			.addText(text => {
				let orgCharacters = settings.characters;
				const textComponent = text
					.setPlaceholder('Enter characters')
					.setValue(settings.characters)
					.onChange(async value => {
						const { inputEl } = textComponent;
						if (!this.isDuplicateChars([...value]) && inputEl.validity.valid) {
							inputEl.removeClass('ts-setting-is-invalid');
							settings.characters = value;
							orgCharacters = value;
							await this.plugin.saveSettings();
						} else {
							inputEl.addClass('ts-setting-is-invalid');
							
						}
						this.updateStyleSheet();
					});
				
				textComponent.inputEl.addEventListener('blur', () => {
					if (this.isDuplicateChars([...textComponent.inputEl.value]) || !textComponent.inputEl.validity.valid) {
						settings.characters = orgCharacters;
					}
				});
				textComponent.inputEl.setAttrs({
					maxLength: CHAR_LENGTH.max,
					required: true,
					pattern: `[!-~]{${CHAR_LENGTH.min},${CHAR_LENGTH.max}}`
				});
				return textComponent;
			})
			.then(settingEl => {
				const setDefaultValue = () => settings.characters = DEFAULT_SETTINGS[settingType].characters;
				this.addResetButton(settingEl, setDefaultValue);
			});

		new Setting(detailsEl)
			.setName(`Enable tabs close`)
			.setDesc('When enabled, the operation of closing tabs is enabled.')
			.addToggle(toggle => toggle.setValue(settings.enableClose)
				.onChange(async value => {
					settings.enableClose = value;
					await this.plugin.saveData(this.plugin.settings);
				}),
			);
	}

	private setForShowTabShortcutCommand(detailsEl: HTMLDetailsElement): void {
		const settingType = SETTING_TYPE.showTabShortcuts;
		const settings = this.plugin.settings[settingType];

		if (Platform.isDesktop) {
			new Setting(detailsEl)
				.setName(`Enable multiple window`)
				.setDesc(`When enabled, all window's tabs is selectable. When disabled, only active window's tabs is selectable.`)
				.addToggle(toggle => toggle.setValue(settings.enableMultiWIndow)
					.onChange(async value => {
						settings.enableMultiWIndow = value;
						await this.plugin.saveData(this.plugin.settings);
					}),
				);
		}

		new Setting(detailsEl)
			.setName('Characters used for shortcut hints')
			.setDesc(`Enter non-duplicate alphanumeric characters or symbols.`)
			.addText(text => {
				let orgCharacters = settings.characters;
				const textComponent = text
					.setPlaceholder('Enter characters')
					.setValue(settings.characters)
					.onChange(async value => {
						const { inputEl } = textComponent;
						if (!this.isDuplicateChars([...value]) && inputEl.validity.valid) {
							inputEl.removeClass('ts-setting-is-invalid');
							settings.characters = value;
							orgCharacters = value;
							await this.plugin.saveSettings();
						} else {
							inputEl.addClass('ts-setting-is-invalid');
							
						}
						this.updateStyleSheet();
					});
				
				textComponent.inputEl.addEventListener('blur', () => {
					if (this.isDuplicateChars([...textComponent.inputEl.value]) || !textComponent.inputEl.validity.valid) {
						settings.characters = orgCharacters;
					}
				});
				textComponent.inputEl.setAttrs({
					required: true,
					pattern: `[!-~]{1,}`
				});
				return textComponent;
			})
			.then(settingEl => {
				const setDefaultValue = () => settings.characters = DEFAULT_SETTINGS[settingType].characters;
				this.addResetButton(settingEl, setDefaultValue);
			});
	}

	private setForSearchTabCommand(detailsEl: HTMLDetailsElement): void {
		const settingType = SETTING_TYPE.searchTab;
		const settings = this.plugin.settings[settingType];

		if (Platform.isDesktop) {
			new Setting(detailsEl)
				.setName(`Enable multiple window`)
				.setDesc(`When enabled, all window's tabs is selectable. When disabled, only active window's tabs is selectable.`)
				.addToggle(toggle => toggle.setValue(settings.enableMultiWIndow)
					.onChange(async value => {
						settings.enableMultiWIndow = value;
						await this.plugin.saveData(this.plugin.settings);
					}),
				);
		}

		new Setting(detailsEl)
			.setName(`Show aliases`)
			.setDesc(`When enabled, show file's aliases on list item.`)
			.addToggle(toggle => toggle.setValue(settings.showAliases)
				.onChange(async value => {
					settings.showAliases = value;
					await this.plugin.saveData(this.plugin.settings);
					this.display();
				}),
			);

		new Setting(detailsEl)
			.setDisabled(!settings.showAliases)
			.setName(`Include aliases in the search`)
			.setDesc(`When enabled, include aliases in the search. This setting is valid when "Show aliases" is enabled.`)
			.addToggle(toggle => toggle.setValue(settings.includeAliases)
				.onChange(async value => {
					settings.includeAliases = value;
					await this.plugin.saveData(this.plugin.settings);
				}),
			);

		new Setting(detailsEl)
			.setName(`Show paths`)
			.setDesc(`When enabled, show file's paths on list item.`)
			.addToggle(toggle => toggle.setValue(settings.showPaths)
				.onChange(async value => {
					settings.showPaths = value;
					await this.plugin.saveData(this.plugin.settings);
					this.display();
				}),
			);

		new Setting(detailsEl)
			.setDisabled(!settings.showPaths)
			.setName(`Include paths in the search`)
			.setDesc(`When enabled, include paths in the search. This setting is valid when "Show paths" is enabled.`)
			.addToggle(toggle => toggle.setValue(settings.includePaths)
				.onChange(async value => {
					settings.includePaths = value;
					await this.plugin.saveData(this.plugin.settings);
				}),
			);

		new Setting(detailsEl)
			.setName(`Show legends`)
			.setDesc('When enabled, show legends on modal.')
			.addToggle(toggle => toggle.setValue(settings.showLegends)
				.onChange(async value => {
					settings.showLegends = value;
					await this.plugin.saveData(this.plugin.settings);
				}),
			);

				
		new Setting(detailsEl)
			.setName('Color of button frame on focus')
			.setDesc('Choice your favorite color.')
			.addColorPicker(colorPicker => colorPicker.setValue(settings.focusColor)
				.onChange(async value => {
					settings.focusColor = value;
					await this.plugin.saveData(this.plugin.settings);
					this.updateStyleSheet();
				}),
			)
			.then(settingEl => {
				const setDefaultValue = () => settings.focusColor = DEFAULT_SETTINGS[settingType].focusColor;
				this.addResetButton(settingEl, setDefaultValue);
			});
	}


	private isDuplicateChars(chars: string[]): boolean {
		return chars.some((char, idx) => chars.slice(idx + 1).includes(char));
	}

	private convertToKey(value: string, valueTexts: typeof MODIFIER_KEY | typeof ACTION_KEY | typeof HOW_TO_NEXT_TAB): string {
		const modifier = Object.entries(valueTexts).find(([, val]) => val === value);
		return modifier ? modifier[0] : '';
	}

	private convertToSettingValue(
		value: string,
		valueTexts: typeof MODIFIER_KEY | typeof ACTION_KEY | typeof HOW_TO_NEXT_TAB,
		displayTexts: typeof DISPLAY_MODIFIER_KEY | typeof DISPLAY_ACTION_KEY | typeof DISPLAY_HOW_TO_NEXT_TAB,
	): string {
		const key = Object.keys(displayTexts).find(key => key === value);
		return key ? valueTexts[key] : '';
	}

	private convertToDisplayText(
		value: string,
		valueTexts: typeof MODIFIER_KEY | typeof ACTION_KEY | typeof HOW_TO_NEXT_TAB,
		displayTexts: typeof DISPLAY_MODIFIER_KEY | typeof DISPLAY_ACTION_KEY | typeof DISPLAY_HOW_TO_NEXT_TAB,
	): string {
		return displayTexts[this.convertToKey(value, valueTexts)];
	}

	private addResetButton(settingEl: Setting, setDefaultValue: () => void, refreshView = true): void {
        settingEl
            .addExtraButton(button => button
				.setIcon('reset')
				.setTooltip('Reset to default')
				.onClick(async () => {
					setDefaultValue();
					await this.plugin.saveSettings();
					this.updateStyleSheet();
					if (refreshView) {
						this.display();
					}
				}));
	}
}
