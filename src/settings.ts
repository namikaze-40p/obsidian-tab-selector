import { App, PluginSettingTab, Setting } from 'obsidian';
import TabSelector from './main';
import { createStyles, deleteStyles } from './util';

export interface Settings {
	showAliases: boolean;
	replaceToAliases: boolean;
	showPaths: boolean;
	showPaginationButtons: boolean;
	showLegends: boolean;
	focusColor: string;
	characters: string;
	enableClose: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
	showAliases: false,
	replaceToAliases: false,
	showPaths: false,
	showPaginationButtons: true,
	showLegends: true,
	focusColor: '#00b4e0',
	characters: 'asdfghjkl;',
	enableClose: true,
} as const;

export const CHAR_LENGTH = {
	min: 4,
	max: 10,
} as const;

export class SettingTab extends PluginSettingTab {
	plugin: TabSelector;

	constructor(app: App, plugin: TabSelector) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl('h2').setText('Tab Selector - Settings');

		new Setting(containerEl)
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

		new Setting(containerEl)
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

		new Setting(containerEl)
			.setName(`Show paths`)
			.setDesc(`When enabled, show file's paths on button.`)
			.addToggle(toggle => toggle.setValue(this.plugin.settings.showPaths)
				.onChange(async value => {
					this.plugin.settings.showPaths = value;
					await this.plugin.saveData(this.plugin.settings);
					this.updateStyleSheet();
				}),
			);
		
		new Setting(containerEl)
			.setName(`Show pagination buttons`)
			.setDesc('When enabled, show pagination buttons on modal.')
			.addToggle(toggle => toggle.setValue(this.plugin.settings.showPaginationButtons)
				.onChange(async value => {
					this.plugin.settings.showPaginationButtons = value;
					await this.plugin.saveData(this.plugin.settings);
				}),
			);
		
		new Setting(containerEl)
			.setName(`Show legends`)
			.setDesc('When enabled, show legends on modal.')
			.addToggle(toggle => toggle.setValue(this.plugin.settings.showLegends)
				.onChange(async value => {
					this.plugin.settings.showLegends = value;
					await this.plugin.saveData(this.plugin.settings);
				}),
			);
		
		new Setting(containerEl)
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

		new Setting(containerEl)
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

		new Setting(containerEl)
			.setName(`Enable tabs close`)
			.setDesc('When enabled, the operation of closing tabs is enabled.')
			.addToggle(toggle => toggle.setValue(this.plugin.settings.enableClose)
				.onChange(async value => {
					this.plugin.settings.enableClose = value;
					await this.plugin.saveData(this.plugin.settings);
				}),
			);
	}

	updateStyleSheet(isTeardown = false): void {
		deleteStyles();
		if (isTeardown) {
			return;
		}

		const { showAliases, replaceToAliases, showPaths, focusColor, characters } = this.plugin.settings;
		const aliasesHeight = showAliases && !replaceToAliases ? (showPaths ? 12 : 8) : 0;
		const pathHeight = showPaths ? 8 : 0;
		const buttonHeight = 32 + aliasesHeight + pathHeight;
		createStyles([
			// 8 is margin of between buttons.
			{ selector: '.ts-buttons-view', property: 'min-height', value: `${buttonHeight * characters.length + 8 * (characters.length - 1)}px` },
			{ selector: '.ts-leaf-name-btn:focus', property: 'outline', value: `2px solid ${focusColor}` },
		]);
	}

	private isDuplicateChars(chars: string[]): boolean {
		return chars.some((char, idx) => chars.slice(idx + 1).includes(char));
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
