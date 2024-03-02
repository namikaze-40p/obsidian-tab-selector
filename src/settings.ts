import { App, PluginSettingTab, Setting } from 'obsidian';
import TabSelector from './main';
import { createStyles, deleteStyles } from './util';

export interface Settings {
	showPaginationButton: boolean;
	showLegend: boolean;
	focusColor: string;
	characters: string;
}

export const DEFAULT_SETTINGS: Settings = {
	showPaginationButton: true,
	showLegend: true,
	focusColor: '#00b4e0',
	characters: 'asdfghjkl;'
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

		new Setting(containerEl)
			.setName(`Show pagination button`)
			.setDesc('When enabled, show pagination button on modal.')
			.addToggle(toggle => toggle.setValue(this.plugin.settings.showPaginationButton)
				.onChange(async value => {
					this.plugin.settings.showPaginationButton = value;
					await this.plugin.saveData(this.plugin.settings);
				}),
			);
		
		new Setting(containerEl)
			.setName(`Show legend`)
			.setDesc('When enabled, show legend on modal.')
			.addToggle(toggle => toggle.setValue(this.plugin.settings.showLegend)
				.onChange(async value => {
					this.plugin.settings.showLegend = value;
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
	}

	updateStyleSheet(isTeardown = false): void {
		deleteStyles();
		if (isTeardown) {
			return;
		}

		const { characters, focusColor } = this.plugin.settings;
		createStyles([
			// 30 is button's height. 8 is margin of between buttons.
			{ selector: '.ts-buttons-view', property: 'min-height', value: `${30 * characters.length + 8 * (characters.length - 1)}px` },
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
