import { App, Platform, PluginSettingTab, Setting } from 'obsidian';
import TabSelector from './main';
import { createStyles, deleteStyles } from './util';

export const MODIFIER_KEY: Record<string, string> = {
	ctrl: 'Control',
	alt: 'Alt',
	meta: 'Meta',
	shift: 'Shift',
} as const;

const DISPLAY_MODIFIER_KEY: Record<string, string> = {
	ctrl: Platform.isMacOS || Platform.isIosApp ? '^' : 'Ctrl',
	alt: Platform.isMacOS || Platform.isIosApp ? '⌥' : 'Alt',
	meta: Platform.isMacOS || Platform.isIosApp ? '⌘' : 'Win',
	shift: Platform.isMacOS || Platform.isIosApp ? '⇧' : 'Shift',
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

export const HOW_TO_PREVIOUS_TAB: Record<string, string> = {
	useSubModifierKey: 'useSubModifierKey',
	useBackActionKey: 'useBackActionKey',
} as const;

const DISPLAY_HOW_TO_PREVIOUS_TAB: Record<string, string> = {
	useSubModifierKey: 'Sub modifier key',
	useBackActionKey: 'Back action key',
} as const;

export interface Settings {
	// Settings for "Open tab selector" command
	showAliases: boolean;
	replaceToAliases: boolean;
	showPaths: boolean;
	showPaginationButtons: boolean;
	showLegends: boolean;
	focusColor: string;
	characters: string;
	enableClose: boolean;
	// Settings for "Go to next/previous tab" commands
	thFocusColor: string;
	mainModifierKey: keyof typeof MODIFIER_KEY;
	subModifierKey: keyof typeof MODIFIER_KEY;
	actionKey: keyof typeof ACTION_KEY;
	backActionKey: keyof typeof ACTION_KEY;
	howToPreviousTab: keyof typeof HOW_TO_PREVIOUS_TAB;
}

export const DEFAULT_SETTINGS: Settings = {
	// Settings for "Open tab selector" command
	showAliases: false,
	replaceToAliases: false,
	showPaths: false,
	showPaginationButtons: true,
	showLegends: true,
	focusColor: '#00b4e0',
	characters: 'asdfghjkl;',
	enableClose: true,
	// Settings for "Go to next/previous tab" commands
	thFocusColor: '#00b4e0',
	mainModifierKey: MODIFIER_KEY.ctrl,
	subModifierKey: MODIFIER_KEY.shift,
	actionKey: ACTION_KEY.tab,
	backActionKey: ACTION_KEY.arrowLeft,
	howToPreviousTab: HOW_TO_PREVIOUS_TAB.useSubModifierKey,
} as const;

export const CHAR_LENGTH = {
	min: 4,
	max: 10,
} as const;

export class SettingTab extends PluginSettingTab {
	plugin: TabSelector;
	isOpen = {
		firstDetails: true,
		secondDetails: true,
	};

	constructor(app: App, plugin: TabSelector) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.addClass('ts-settings');
		containerEl.createEl('h2').setText('Tab Selector - Settings');

		{
			const detailsEl = containerEl.createEl('details', '', el => {
				el.createEl('summary', '', summaryEl => {
					summaryEl.setText('For "Open tab selector" command');
				});
			});
			if (this.isOpen.firstDetails) {
				detailsEl.setAttr('open', true);
			}
			detailsEl.addEventListener("toggle", () => this.isOpen.firstDetails = detailsEl.open);
			this.setForOpenTabSelectorCommand(detailsEl);
		}

		{
			const detailsEl = containerEl.createEl('details', '', el => {
				el.createEl('summary', '', summaryEl => {
					summaryEl.setText('For "Go to next/previous tab" command');
				});
			});
			if (this.isOpen.secondDetails) {
				detailsEl.setAttr('open', true);
			}
			detailsEl.addEventListener("toggle", () => this.isOpen.secondDetails = detailsEl.open);
			this.setForGoToNextPrevTabCommands(detailsEl);
		}

	}

	updateStyleSheet(isTeardown = false): void {
		deleteStyles();
		if (isTeardown) {
			return;
		}

		const { showAliases, replaceToAliases, showPaths, focusColor, characters, thFocusColor } = this.plugin.settings;
		const aliasesHeight = showAliases && !replaceToAliases ? (showPaths ? 12 : 8) : 0;
		const pathHeight = showPaths ? 8 : 0;
		const buttonHeight = 32 + aliasesHeight + pathHeight;
		createStyles([
			// 8 is margin of between buttons.
			{ selector: '.ts-buttons-view', property: 'min-height', value: `${buttonHeight * characters.length + 8 * (characters.length - 1)}px` },
			{ selector: '.ts-leaf-name-btn:focus', property: 'outline', value: `2px solid ${focusColor}` },
			{ selector: '.th-leaf-name-btn:focus', property: 'outline', value: `2px solid ${thFocusColor}` },
		]);
	}

	private setForOpenTabSelectorCommand(detailsEl: HTMLDetailsElement): void {
		new Setting(detailsEl)
			.setName(`Show aliases`)
			.setDesc(`When enabled, show file's aliases on button.`)
			.addToggle(toggle => toggle.setValue(this.plugin.settings.showAliases)
				.onChange(async value => {
					this.plugin.settings.showAliases = value;
					this.plugin.settings.replaceToAliases = false;
					await this.plugin.saveData(this.plugin.settings);
					this.updateStyleSheet();
					this.display();
				}),
			);

		new Setting(detailsEl)
			.setName(`Replace the filename to aliases`)
			.setDesc(`When enabled, if aliases is set the file, replace the filename to aliases.`)
			.addToggle(toggle => toggle.setValue(this.plugin.settings.replaceToAliases)
				.onChange(async value => {
					this.plugin.settings.replaceToAliases = value;
					await this.plugin.saveData(this.plugin.settings);
					this.updateStyleSheet();
				}),
			)
			.setDisabled(!this.plugin.settings.showAliases);

		new Setting(detailsEl)
			.setName(`Show paths`)
			.setDesc(`When enabled, show file's paths on button.`)
			.addToggle(toggle => toggle.setValue(this.plugin.settings.showPaths)
				.onChange(async value => {
					this.plugin.settings.showPaths = value;
					await this.plugin.saveData(this.plugin.settings);
					this.updateStyleSheet();
				}),
			);
		
		new Setting(detailsEl)
			.setName(`Show pagination buttons`)
			.setDesc('When enabled, show pagination buttons on modal.')
			.addToggle(toggle => toggle.setValue(this.plugin.settings.showPaginationButtons)
				.onChange(async value => {
					this.plugin.settings.showPaginationButtons = value;
					await this.plugin.saveData(this.plugin.settings);
				}),
			);
		
		new Setting(detailsEl)
			.setName(`Show legends`)
			.setDesc('When enabled, show legends on modal.')
			.addToggle(toggle => toggle.setValue(this.plugin.settings.showLegends)
				.onChange(async value => {
					this.plugin.settings.showLegends = value;
					await this.plugin.saveData(this.plugin.settings);
				}),
			);
		
		new Setting(detailsEl)
			.setName('Color of button frame on focus')
			.setDesc('Choice your favorite color.')
			.addColorPicker(colorPicker => colorPicker.setValue(this.plugin.settings.focusColor)
				.onChange(async value => {
					this.plugin.settings.focusColor = value;
					await this.plugin.saveData(this.plugin.settings);
					this.updateStyleSheet();
				}),
			)
			.then(settingEl => this.addResetButton(settingEl, 'focusColor'));

		new Setting(detailsEl)
			.setName('Characters used for button hints')
			.setDesc(`Enter ${CHAR_LENGTH.min}~${CHAR_LENGTH.max} non-duplicate alphanumeric characters or symbols.`)
			.addText(text => {
				let orgCharacters = this.plugin.settings.characters;
				const textComponent = text
					.setPlaceholder('Enter characters')
					.setValue(this.plugin.settings.characters)
					.onChange(async value => {
						const { inputEl } = textComponent;
						if (!this.isDuplicateChars([...value]) && inputEl.validity.valid) {
							inputEl.removeClass('ts-setting-is-invalid');
							this.plugin.settings.characters = value;
							orgCharacters = value;
							await this.plugin.saveSettings();
						} else {
							inputEl.addClass('ts-setting-is-invalid');
							
						}
						this.updateStyleSheet();
					});
				
				textComponent.inputEl.addEventListener('blur', () => {
					if (this.isDuplicateChars([...textComponent.inputEl.value]) || !textComponent.inputEl.validity.valid) {
						this.plugin.settings.characters = orgCharacters;
					}
				});
				textComponent.inputEl.setAttrs({
					maxLength: CHAR_LENGTH.max,
					required: true,
					pattern: `[!-~]{${CHAR_LENGTH.min},${CHAR_LENGTH.max}}`
				});
				return textComponent;
			})
			.then(settingEl => this.addResetButton(settingEl, 'characters'));

		new Setting(detailsEl)
			.setName(`Enable tabs close`)
			.setDesc('When enabled, the operation of closing tabs is enabled.')
			.addToggle(toggle => toggle.setValue(this.plugin.settings.enableClose)
				.onChange(async value => {
					this.plugin.settings.enableClose = value;
					await this.plugin.saveData(this.plugin.settings);
				}),
			);
	}

	private setForGoToNextPrevTabCommands(detailsEl: HTMLDetailsElement): void {
		new Setting(detailsEl)
			.setName('Color of button frame on focus')
			.setDesc('Choose your favorite color.')
			.addColorPicker(colorPicker => colorPicker.setValue(this.plugin.settings.thFocusColor)
				.onChange(async value => {
					this.plugin.settings.thFocusColor = value;
					await this.plugin.saveData(this.plugin.settings);
					this.updateStyleSheet();
				}),
			)
			.then(settingEl => this.addResetButton(settingEl, 'thFocusColor'));

		new Setting(detailsEl)
			.setName('Main modifier key')
			.setDesc('Holding this key down keeps the modal open. When this key is released, it switches to the focused tab.')
			.addDropdown(item => item
				.addOptions(Object.keys(MODIFIER_KEY).reduce((obj, key) => (obj[key] = DISPLAY_MODIFIER_KEY[key], obj), {} as typeof MODIFIER_KEY))
				.setValue(this.convertToKey(this.plugin.settings.mainModifierKey, MODIFIER_KEY))
				.onChange(async value => {
					this.plugin.settings.mainModifierKey = this.convertToSettingValue(value, MODIFIER_KEY, DISPLAY_MODIFIER_KEY);
					await this.plugin.saveData(this.plugin.settings);
					this.display();
				}),
			)
			.then(settingEl => this.addResetButton(settingEl, 'mainModifierKey'));

		new Setting(detailsEl)
			.setName('Action key')
			.setDesc('Press this key while holding down the Main modifier key moves to the next tab.')
			.addDropdown(item => item
				.addOptions(Object.keys(ACTION_KEY).reduce((obj, key) => (obj[key] = DISPLAY_ACTION_KEY[key], obj), {} as typeof ACTION_KEY))
				.setValue(this.convertToKey(this.plugin.settings.actionKey, ACTION_KEY))
				.onChange(async value => {
					this.plugin.settings.actionKey = this.convertToSettingValue(value, ACTION_KEY, DISPLAY_ACTION_KEY);
					await this.plugin.saveData(this.plugin.settings);
					this.display();
				}),
			)
			.then(settingEl => this.addResetButton(settingEl, 'actionKey'));
		
		new Setting(detailsEl)
			.setName('Choose how to go to the previous tab')
			.setDesc(`
				When go to the previous tab, if you want to use the same key as the Action key, choose “Sub modifier key”.
				If you want to use a different key from the Action key, choose “Back action key".
			`)
			.addDropdown(item => item
				.addOptions(Object.keys(HOW_TO_PREVIOUS_TAB).reduce((obj, key) => (obj[key] = DISPLAY_HOW_TO_PREVIOUS_TAB[key], obj), {} as typeof HOW_TO_PREVIOUS_TAB))
				.setValue(this.convertToKey(this.plugin.settings.howToPreviousTab, HOW_TO_PREVIOUS_TAB))
				.onChange(async value => {
					this.plugin.settings.howToPreviousTab = value as keyof typeof HOW_TO_PREVIOUS_TAB;
					await this.plugin.saveData(this.plugin.settings);
					this.display();
				}),
			)
			.then(settingEl => this.addResetButton(settingEl, 'howToPreviousTab'));

		new Setting(detailsEl)
			.setName('Sub modifier key')
			.setDesc('Pressing the Action key while holding this key down moves to the previous tab.')
			.addDropdown(item => item
				.addOptions(Object.keys(MODIFIER_KEY).reduce((obj, key) => (obj[key] = DISPLAY_MODIFIER_KEY[key], obj), {} as typeof MODIFIER_KEY))
				.setValue(this.convertToKey(this.plugin.settings.subModifierKey, MODIFIER_KEY))
				.onChange(async value => {
					this.plugin.settings.subModifierKey = this.convertToSettingValue(value, MODIFIER_KEY, DISPLAY_MODIFIER_KEY);
					await this.plugin.saveData(this.plugin.settings);
					this.display();
				}),
			)
			.setDisabled(this.plugin.settings.howToPreviousTab !== HOW_TO_PREVIOUS_TAB.useSubModifierKey)
			.then(settingEl => {
				if (this.plugin.settings.howToPreviousTab === HOW_TO_PREVIOUS_TAB.useSubModifierKey) {
					this.addResetButton(settingEl, 'subModifierKey')
				}
			});


		new Setting(detailsEl)
			.setName('Back action key')
			.setDesc('Press this key while holding down the Main modifier key moves to the previous tab.')
			.addDropdown(item => item
				.addOptions(Object.keys(ACTION_KEY).reduce((obj, key) => (obj[key] = DISPLAY_ACTION_KEY[key], obj), {} as typeof ACTION_KEY))
				.setValue(this.convertToKey(this.plugin.settings.backActionKey, ACTION_KEY))
				.onChange(async value => {
					this.plugin.settings.backActionKey = this.convertToSettingValue(value, ACTION_KEY, DISPLAY_ACTION_KEY);
					await this.plugin.saveData(this.plugin.settings);
					this.display();
				}),
			)
			.setDisabled(this.plugin.settings.howToPreviousTab !== HOW_TO_PREVIOUS_TAB.useBackActionKey)
			.then(settingEl => {
				if (this.plugin.settings.howToPreviousTab === HOW_TO_PREVIOUS_TAB.useBackActionKey) {
					this.addResetButton(settingEl, 'backActionKey')
				}
			});

		detailsEl.createDiv('th-how-to-use', el => {
			el.createDiv('th-settings-description', divEl => {
				divEl.createSpan('th-description-title').setText('How to use');
				divEl.createSpan('').setText('1. Configure the above settings.');
				divEl.createSpan('').setText('2. Set the hotkeys for the following commands.');
			});

			const { mainModifierKey, subModifierKey, actionKey, backActionKey, howToPreviousTab } = this.plugin.settings;
			const mainModifier = this.convertToDisplayText(mainModifierKey, MODIFIER_KEY, DISPLAY_MODIFIER_KEY);
			const subModifier = this.convertToDisplayText(subModifierKey, MODIFIER_KEY, DISPLAY_MODIFIER_KEY);
			const action = this.convertToDisplayText(actionKey, ACTION_KEY, DISPLAY_ACTION_KEY);
			const backAction = this.convertToDisplayText(backActionKey, ACTION_KEY, DISPLAY_ACTION_KEY);
			const useSubModifier = howToPreviousTab === HOW_TO_PREVIOUS_TAB.useSubModifierKey;
			const isApple = Platform.isMacOS || Platform.isIosApp;

			el.createDiv('th-hotkey-preview', divEl => {
				divEl.createSpan('th-hotkey-preview-label').setText('"Tab Selector: Go to next tab": ');
				divEl.createSpan('th-hotkey-preview-value').setText([mainModifier, action].join(isApple ? '' : ' + '));
			});
			el.createDiv('th-hotkey-preview', divEl => {
				divEl.createSpan('th-hotkey-preview-label').setText('"Tab Selector: Go to previous tab": ');
				divEl.createSpan('th-hotkey-preview-value').setText((useSubModifier ? [mainModifier, subModifier, action] : [mainModifier, backAction]).join(isApple ? '' : ' + '));
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

	private isDuplicateChars(chars: string[]): boolean {
		return chars.some((char, idx) => chars.slice(idx + 1).includes(char));
	}

	private convertToKey(value: string, valueTexts: typeof MODIFIER_KEY | typeof ACTION_KEY | typeof HOW_TO_PREVIOUS_TAB): string {
		const modifier = Object.entries(valueTexts).find(([, val]) => val === value);
		return modifier ? modifier[0] : '';
	}

	private convertToSettingValue(
		value: string,
		valueTexts: typeof MODIFIER_KEY | typeof ACTION_KEY | typeof HOW_TO_PREVIOUS_TAB,
		displayTexts: typeof DISPLAY_MODIFIER_KEY | typeof DISPLAY_ACTION_KEY | typeof DISPLAY_HOW_TO_PREVIOUS_TAB,
	): string {
		const key = Object.keys(displayTexts).find(key => key === value);
		return key ? valueTexts[key] : '';
	}

	private convertToDisplayText(
		value: string,
		valueTexts: typeof MODIFIER_KEY | typeof ACTION_KEY | typeof HOW_TO_PREVIOUS_TAB,
		displayTexts: typeof DISPLAY_MODIFIER_KEY | typeof DISPLAY_ACTION_KEY | typeof DISPLAY_HOW_TO_PREVIOUS_TAB,
	): string {
		return displayTexts[this.convertToKey(value, valueTexts)];
	}

	private addResetButton(settingEl: Setting, settingKey: keyof typeof DEFAULT_SETTINGS, refreshView = true): void {
        settingEl
            .addExtraButton(button => button
				.setIcon('reset')
				.setTooltip('Reset to default')
				.onClick(async () => {
					const settingValue = DEFAULT_SETTINGS[settingKey];
					(this.plugin.settings[settingKey] as typeof settingValue) = settingValue;
					await this.plugin.saveSettings();
					this.updateStyleSheet();
					if (refreshView) {
						this.display();
					}
				}));
	}
}
