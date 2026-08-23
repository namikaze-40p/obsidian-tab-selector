import {
  App,
  Platform,
  PluginSettingTab,
  Setting,
  SettingDefinitionItem,
  SettingGroupItem,
  setIcon,
} from 'obsidian';
import TabSelector from './main';
import { isValidSettings } from './util';

export const MODIFIER_KEY = {
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

const ACTION_KEY = {
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

export const HOW_TO_NEXT_TAB = {
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
  mainModifierKey: (typeof MODIFIER_KEY)[keyof typeof MODIFIER_KEY];
  subModifierKey: (typeof MODIFIER_KEY)[keyof typeof MODIFIER_KEY];
  actionKey: (typeof ACTION_KEY)[keyof typeof ACTION_KEY];
  reverseActionKey: (typeof ACTION_KEY)[keyof typeof ACTION_KEY];
  howToNextTab: (typeof HOW_TO_NEXT_TAB)[keyof typeof HOW_TO_NEXT_TAB];
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
    characters: 'asdfghjkl;qwertyuiopzxcvbnm,./',
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
  private _isOpen = {
    firstDetails: false,
    secondDetails: false,
    thirdDetails: false,
    fourthDetails: false,
  };

  // Tracks which of `display()` (pre-1.13.0) or `getSettingDefinitions()`
  // (1.13.0+) rendered the currently visible UI, so that shared setting logic
  // can refresh the correct one via `refreshSettingsView()`.
  private _renderMode: 'imperative' | 'declarative' = 'imperative';

  constructor(
    app: App,
    private _plugin: TabSelector,
  ) {
    super(app, _plugin);
    // Applied here (not just in `display()`) because Obsidian 1.13.0+ renders
    // from `getSettingDefinitions()` without ever calling `display()`.
    this.containerEl.addClass('ts-settings');
  }

  display(): void {
    this._renderMode = 'imperative';
    const { containerEl } = this;
    containerEl.empty();

    {
      const detailsEl = containerEl.createEl('details', '', (el) => {
        el.createEl('summary', '', (summaryEl) => {
          summaryEl.setText('For "Go to previous/next tab" command');
        });
      });
      if (this._isOpen.firstDetails) {
        detailsEl.setAttr('open', true);
      }
      detailsEl.addEventListener('toggle', () => (this._isOpen.firstDetails = detailsEl.open));
      this.setForGoToPrevNextTabCommands(detailsEl);
    }

    {
      const detailsEl = containerEl.createEl('details', '', (el) => {
        el.createEl('summary', '', (summaryEl) => {
          summaryEl.setText('For "Browse tabs" command');
        });
      });
      if (this._isOpen.secondDetails) {
        detailsEl.setAttr('open', true);
      }
      detailsEl.addEventListener('toggle', () => (this._isOpen.secondDetails = detailsEl.open));
      this.setForOpenTabSelectorCommand(detailsEl);
    }

    if (Platform.isDesktop || Platform.isTablet) {
      {
        const detailsEl = containerEl.createEl('details', '', (el) => {
          el.createEl('summary', '', (summaryEl) => {
            summaryEl.setText('For "Show tab shortcuts" command');
          });
        });
        if (this._isOpen.thirdDetails) {
          detailsEl.setAttr('open', true);
        }
        detailsEl.addEventListener('toggle', () => (this._isOpen.thirdDetails = detailsEl.open));
        this.setForShowTabShortcutCommand(detailsEl);
      }
    }

    {
      const detailsEl = containerEl.createEl('details', '', (el) => {
        el.createEl('summary', '', (summaryEl) => {
          summaryEl.setText('For "Search tabs" command');
        });
      });
      if (this._isOpen.fourthDetails) {
        detailsEl.setAttr('open', true);
      }
      detailsEl.addEventListener('toggle', () => (this._isOpen.fourthDetails = detailsEl.open));
      this.setForSearchTabCommand(detailsEl);
    }
  }

  /**
   * Declarative counterpart of `display()`, used by Obsidian 1.13.0+ to make
   * these settings appear in the settings search. `display()` is kept as a
   * fallback for older Obsidian versions (it is not called once this method
   * returns a non-empty array).
   */
  getSettingDefinitions(): SettingDefinitionItem[] {
    this._renderMode = 'declarative';
    return [
      {
        type: 'group',
        heading: 'For "Go to previous/next tab" command',
        items: this.getGoToPrevNextTabCommandsDefinitions(),
      },
      {
        type: 'group',
        heading: 'For "Browse tabs" command',
        items: this.getOpenTabSelectorCommandDefinitions(),
      },
      {
        type: 'group',
        heading: 'For "Show tab shortcuts" command',
        visible: () => Platform.isDesktop || Platform.isTablet,
        items: this.getShowTabShortcutCommandDefinitions(),
      },
      {
        type: 'group',
        heading: 'For "Search tabs" command',
        items: this.getSearchTabCommandDefinitions(),
      },
    ];
  }

  private setForGoToPrevNextTabCommands(detailsEl: HTMLDetailsElement): void {
    this.renderDefinitionsInto(detailsEl, this.getGoToPrevNextTabCommandsDefinitions());
  }

  private renderGoToPrevNextTabHowToUse(
    el: HTMLElement,
    settings: GoToPreviousNextTabSettings,
  ): void {
    el.createDiv('th-settings-description', (divEl) => {
      divEl.createSpan('th-description-title').setText('How to use');
      divEl.createSpan('').setText('1. Configure the above settings.');
      divEl.createSpan('').setText('2. Set the hotkeys to match for the following commands.');
    });

    const { mainModifierKey, subModifierKey, actionKey, reverseActionKey, howToNextTab } = settings;
    const mainModifier = this.convertToDisplayText(
      mainModifierKey,
      MODIFIER_KEY,
      DISPLAY_MODIFIER_KEY,
    );
    const subModifier = this.convertToDisplayText(
      subModifierKey,
      MODIFIER_KEY,
      DISPLAY_MODIFIER_KEY,
    );
    const action = this.convertToDisplayText(actionKey, ACTION_KEY, DISPLAY_ACTION_KEY);
    const reverseAction = this.convertToDisplayText(
      reverseActionKey,
      ACTION_KEY,
      DISPLAY_ACTION_KEY,
    );
    const useSubModifier = howToNextTab === HOW_TO_NEXT_TAB.useSubModifierKey;

    el.createDiv('th-hotkey-preview', (divEl) => {
      divEl.createSpan('th-hotkey-preview-label').setText('"Tab Selector: Go to next tab": ');
      divEl
        .createSpan('th-hotkey-preview-value')
        .setText(
          (useSubModifier
            ? [mainModifier, subModifier, action]
            : [mainModifier, reverseAction]
          ).join(IS_APPLE ? '' : ' + '),
        );
    });
    el.createDiv('th-hotkey-preview', (divEl) => {
      divEl.createSpan('th-hotkey-preview-label').setText('"Tab Selector: Go to previous tab": ');
      divEl
        .createSpan('th-hotkey-preview-value')
        .setText([mainModifier, action].join(IS_APPLE ? '' : ' + '));
    });

    el.createDiv('th-match-state', (divEl) => {
      const isMatchKeys = isValidSettings(this.app, settings, false);
      divEl.addClass(isMatchKeys ? 'is-match' : 'is-mismatch');
      divEl.createSpan('th-match-icon', (spanEl) => setIcon(spanEl, isMatchKeys ? 'check' : 'x'));
      divEl
        .createSpan('')
        .setText(`Currently hotkeys ${isMatchKeys ? 'match' : 'mismatch'} the above commands.`);
    });

    el.createDiv('th-settings-caution', (divEl) => {
      divEl.createSpan('th-settings-caution-title').setText('Caution');
      divEl.createSpan('').setText(`
					Don't use shortcut keys reserved by the OS.
					OS shortcut keys take precedence and don't work properly.
				`);
    });
  }

  /**
   * Renders a `getSettingDefinitions()`-style item list imperatively into a
   * container, so `display()` (pre-1.13.0 fallback) can reuse the same
   * per-setting logic as the declarative API instead of duplicating it.
   * Only handles the `render`-type items this plugin actually produces.
   */
  private renderDefinitionsInto(containerEl: HTMLElement, items: SettingGroupItem[]): void {
    for (const item of items) {
      if (!('render' in item) || typeof item.render !== 'function') {
        continue;
      }
      const isVisible =
        typeof item.visible === 'function' ? item.visible() : (item.visible ?? true);
      if (!isVisible) {
        continue;
      }
      const setting = new Setting(containerEl).setName(item.name);
      if (item.desc) {
        setting.setDesc(item.desc);
      }
      (item.render as (setting: Setting) => void | (() => void))(setting);
    }
  }

  private getGoToPrevNextTabCommandsDefinitions(): SettingGroupItem[] {
    const settingType = SETTING_TYPE.goToPreviousNextTab;
    const settings = this._plugin.settings[settingType];

    return [
      {
        name: 'Enable multiple window',
        desc: `When enabled, all window's tabs is selectable. When disabled, only active window's tabs is selectable.`,
        visible: () => Platform.isDesktop,
        render: (setting) => {
          setting.addToggle((toggle) =>
            toggle.setValue(settings.enableMultiWIndow).onChange(async (value) => {
              settings.enableMultiWIndow = value;
              await this._plugin.saveData(this._plugin.settings);
            }),
          );
        },
      },
      {
        name: 'Color of button frame on focus',
        desc: 'Choose your favorite color.',
        render: (setting) => {
          setting.addColorPicker((colorPicker) =>
            colorPicker.setValue(settings.focusColor).onChange(async (value) => {
              settings.focusColor = value;
              await this._plugin.saveData(this._plugin.settings);
            }),
          );
          const setDefaultValue = () =>
            (settings.focusColor = DEFAULT_SETTINGS[settingType].focusColor);
          this.addResetButton(setting, setDefaultValue);
        },
      },
      {
        name: 'Main modifier key',
        desc: 'Holding this key down keeps the modal open. When this key is released, it switches to the focused tab.',
        render: (setting) => {
          setting.addDropdown((item) =>
            item
              .addOptions(this.buildDropdownOptions(MODIFIER_KEY, DISPLAY_MODIFIER_KEY))
              .setValue(this.convertToKey(settings.mainModifierKey, MODIFIER_KEY))
              .onChange(async (value) => {
                settings.mainModifierKey = this.convertToSettingValue(
                  value,
                  MODIFIER_KEY,
                  DISPLAY_MODIFIER_KEY,
                );
                await this._plugin.saveData(this._plugin.settings);
                this.refreshSettingsView();
              }),
          );
          const setDefaultValue = () =>
            (settings.mainModifierKey = DEFAULT_SETTINGS[settingType].mainModifierKey);
          this.addResetButton(setting, setDefaultValue);
        },
      },
      {
        name: 'Action key',
        desc: 'Press this key while holding down the Main modifier key moves to the previous tab.',
        render: (setting) => {
          setting.addDropdown((item) =>
            item
              .addOptions(this.buildDropdownOptions(ACTION_KEY, DISPLAY_ACTION_KEY))
              .setValue(this.convertToKey(settings.actionKey, ACTION_KEY))
              .onChange(async (value) => {
                settings.actionKey = this.convertToSettingValue(
                  value,
                  ACTION_KEY,
                  DISPLAY_ACTION_KEY,
                );
                await this._plugin.saveData(this._plugin.settings);
                this.refreshSettingsView();
              }),
          );
          const setDefaultValue = () =>
            (settings.actionKey = DEFAULT_SETTINGS[settingType].actionKey);
          this.addResetButton(setting, setDefaultValue);
        },
      },
      {
        name: 'Choose how to go to the next tab',
        desc: `
					When go to the next tab, if you want to use the same key as the Action key, choose “Sub modifier key”.
					If you want to use a different key from the Action key, choose “Reverse action key".
				`,
        render: (setting) => {
          setting.addDropdown((item) =>
            item
              .addOptions(this.buildDropdownOptions(HOW_TO_NEXT_TAB, DISPLAY_HOW_TO_NEXT_TAB))
              .setValue(this.convertToKey(settings.howToNextTab, HOW_TO_NEXT_TAB))
              .onChange(async (value) => {
                settings.howToNextTab = HOW_TO_NEXT_TAB[value as keyof typeof HOW_TO_NEXT_TAB];
                await this._plugin.saveData(this._plugin.settings);
                this.refreshSettingsView();
              }),
          );
          const setDefaultValue = () =>
            (settings.howToNextTab = DEFAULT_SETTINGS[settingType].howToNextTab);
          this.addResetButton(setting, setDefaultValue);
        },
      },
      {
        name: 'Sub modifier key',
        desc: 'Pressing the Action key while holding this key down moves to the next tab.',
        render: (setting) => {
          setting
            .addDropdown((item) =>
              item
                .addOptions(this.buildDropdownOptions(MODIFIER_KEY, DISPLAY_MODIFIER_KEY))
                .setValue(this.convertToKey(settings.subModifierKey, MODIFIER_KEY))
                .onChange(async (value) => {
                  settings.subModifierKey = this.convertToSettingValue(
                    value,
                    MODIFIER_KEY,
                    DISPLAY_MODIFIER_KEY,
                  );
                  await this._plugin.saveData(this._plugin.settings);
                  this.refreshSettingsView();
                }),
            )
            .setDisabled(settings.howToNextTab !== HOW_TO_NEXT_TAB.useSubModifierKey);
          if (settings.howToNextTab === HOW_TO_NEXT_TAB.useSubModifierKey) {
            const setDefaultValue = () =>
              (settings.subModifierKey = DEFAULT_SETTINGS[settingType].subModifierKey);
            this.addResetButton(setting, setDefaultValue);
          }
        },
      },
      {
        name: 'Reverse action key',
        desc: 'Press this key while holding down the Main modifier key moves to the next tab.',
        render: (setting) => {
          setting
            .addDropdown((item) =>
              item
                .addOptions(this.buildDropdownOptions(ACTION_KEY, DISPLAY_ACTION_KEY))
                .setValue(this.convertToKey(settings.reverseActionKey, ACTION_KEY))
                .onChange(async (value) => {
                  settings.reverseActionKey = this.convertToSettingValue(
                    value,
                    ACTION_KEY,
                    DISPLAY_ACTION_KEY,
                  );
                  await this._plugin.saveData(this._plugin.settings);
                  this.refreshSettingsView();
                }),
            )
            .setDisabled(settings.howToNextTab !== HOW_TO_NEXT_TAB.useReverseActionKey);
          if (settings.howToNextTab === HOW_TO_NEXT_TAB.useSubModifierKey) {
            const setDefaultValue = () =>
              (settings.reverseActionKey = DEFAULT_SETTINGS[settingType].reverseActionKey);
            this.addResetButton(setting, setDefaultValue);
          }
        },
      },
      {
        name: 'How to use',
        searchable: false,
        render: (setting) => {
          setting.settingEl.empty();
          setting.settingEl.addClass('th-how-to-use');
          this.renderGoToPrevNextTabHowToUse(setting.settingEl, settings);
        },
      },
    ];
  }

  private setForOpenTabSelectorCommand(detailsEl: HTMLDetailsElement): void {
    this.renderDefinitionsInto(detailsEl, this.getOpenTabSelectorCommandDefinitions());
  }

  private getOpenTabSelectorCommandDefinitions(): SettingGroupItem[] {
    const settingType = SETTING_TYPE.openTabSelector;
    const settings = this._plugin.settings[settingType];

    return [
      {
        name: 'Enable multiple window',
        desc: `When enabled, all window's tabs is selectable. When disabled, only active window's tabs is selectable.`,
        visible: () => Platform.isDesktop,
        render: (setting) => {
          setting.addToggle((toggle) =>
            toggle.setValue(settings.enableMultiWIndow).onChange(async (value) => {
              settings.enableMultiWIndow = value;
              await this._plugin.saveData(this._plugin.settings);
            }),
          );
        },
      },
      {
        name: 'Show aliases',
        desc: `When enabled, show file's aliases on button.`,
        render: (setting) => {
          setting.addToggle((toggle) =>
            toggle.setValue(settings.showAliases).onChange(async (value) => {
              settings.showAliases = value;
              settings.replaceToAliases = false;
              await this._plugin.saveData(this._plugin.settings);
              this.refreshSettingsView();
            }),
          );
        },
      },
      {
        name: 'Replace the filename to aliases',
        desc: `When enabled, if aliases is set the file, replace the filename to aliases.`,
        render: (setting) => {
          setting
            .addToggle((toggle) =>
              toggle.setValue(settings.replaceToAliases).onChange(async (value) => {
                settings.replaceToAliases = value;
                await this._plugin.saveData(this._plugin.settings);
              }),
            )
            .setDisabled(!settings.showAliases);
        },
      },
      {
        name: 'Show paths',
        desc: `When enabled, show file's paths on button.`,
        render: (setting) => {
          setting.addToggle((toggle) =>
            toggle.setValue(settings.showPaths).onChange(async (value) => {
              settings.showPaths = value;
              await this._plugin.saveData(this._plugin.settings);
            }),
          );
        },
      },
      {
        name: 'Show pagination buttons',
        desc: 'When enabled, show pagination buttons on modal.',
        render: (setting) => {
          setting.addToggle((toggle) =>
            toggle.setValue(settings.showPaginationButtons).onChange(async (value) => {
              settings.showPaginationButtons = value;
              await this._plugin.saveData(this._plugin.settings);
            }),
          );
        },
      },
      {
        name: 'Show legends',
        desc: 'When enabled, show legends on modal.',
        render: (setting) => {
          setting.addToggle((toggle) =>
            toggle.setValue(settings.showLegends).onChange(async (value) => {
              settings.showLegends = value;
              await this._plugin.saveData(this._plugin.settings);
            }),
          );
        },
      },
      {
        name: 'Color of button frame on focus',
        desc: 'Choice your favorite color.',
        render: (setting) => {
          setting.addColorPicker((colorPicker) =>
            colorPicker.setValue(settings.focusColor).onChange(async (value) => {
              settings.focusColor = value;
              await this._plugin.saveData(this._plugin.settings);
            }),
          );
          const setDefaultValue = () =>
            (settings.focusColor = DEFAULT_SETTINGS[settingType].focusColor);
          this.addResetButton(setting, setDefaultValue);
        },
      },
      {
        name: 'Characters used for button hints',
        desc: `Enter ${CHAR_LENGTH.min}~${CHAR_LENGTH.max} non-duplicate alphanumeric characters or symbols.`,
        render: (setting) => {
          this.applyCharactersTextControl(setting, settings, {
            maxLength: CHAR_LENGTH.max,
            pattern: `[!-~]{${CHAR_LENGTH.min},${CHAR_LENGTH.max}}`,
          });
          const setDefaultValue = () =>
            (settings.characters = DEFAULT_SETTINGS[settingType].characters);
          this.addResetButton(setting, setDefaultValue);
        },
      },
      {
        name: 'Enable tabs close',
        desc: 'When enabled, the operation of closing tabs is enabled.',
        render: (setting) => {
          setting.addToggle((toggle) =>
            toggle.setValue(settings.enableClose).onChange(async (value) => {
              settings.enableClose = value;
              await this._plugin.saveData(this._plugin.settings);
            }),
          );
        },
      },
    ];
  }

  private setForShowTabShortcutCommand(detailsEl: HTMLDetailsElement): void {
    this.renderDefinitionsInto(detailsEl, this.getShowTabShortcutCommandDefinitions());
  }

  private getShowTabShortcutCommandDefinitions(): SettingGroupItem[] {
    const settingType = SETTING_TYPE.showTabShortcuts;
    const settings = this._plugin.settings[settingType];

    return [
      {
        name: 'Enable multiple window',
        desc: `When enabled, all window's tabs is selectable. When disabled, only active window's tabs is selectable.`,
        visible: () => Platform.isDesktop,
        render: (setting) => {
          setting.addToggle((toggle) =>
            toggle.setValue(settings.enableMultiWIndow).onChange(async (value) => {
              settings.enableMultiWIndow = value;
              await this._plugin.saveData(this._plugin.settings);
            }),
          );
        },
      },
      {
        name: 'Characters used for shortcut hints',
        desc: `Enter non-duplicate alphanumeric characters or symbols.`,
        render: (setting) => {
          this.applyCharactersTextControl(setting, settings, { pattern: `[!-~]{1,}` });
          const setDefaultValue = () =>
            (settings.characters = DEFAULT_SETTINGS[settingType].characters);
          this.addResetButton(setting, setDefaultValue);
        },
      },
    ];
  }

  private setForSearchTabCommand(detailsEl: HTMLDetailsElement): void {
    this.renderDefinitionsInto(detailsEl, this.getSearchTabCommandDefinitions());
  }

  private getSearchTabCommandDefinitions(): SettingGroupItem[] {
    const settingType = SETTING_TYPE.searchTab;
    const settings = this._plugin.settings[settingType];

    return [
      {
        name: 'Enable multiple window',
        desc: `When enabled, all window's tabs is selectable. When disabled, only active window's tabs is selectable.`,
        visible: () => Platform.isDesktop,
        render: (setting) => {
          setting.addToggle((toggle) =>
            toggle.setValue(settings.enableMultiWIndow).onChange(async (value) => {
              settings.enableMultiWIndow = value;
              await this._plugin.saveData(this._plugin.settings);
            }),
          );
        },
      },
      {
        name: 'Show aliases',
        desc: `When enabled, show file's aliases on list item.`,
        render: (setting) => {
          setting.addToggle((toggle) =>
            toggle.setValue(settings.showAliases).onChange(async (value) => {
              settings.showAliases = value;
              await this._plugin.saveData(this._plugin.settings);
              this.refreshSettingsView();
            }),
          );
        },
      },
      {
        name: 'Include aliases in the search',
        desc: `When enabled, include aliases in the search. This setting is valid when "Show aliases" is enabled.`,
        render: (setting) => {
          setting.setDisabled(!settings.showAliases).addToggle((toggle) =>
            toggle.setValue(settings.includeAliases).onChange(async (value) => {
              settings.includeAliases = value;
              await this._plugin.saveData(this._plugin.settings);
            }),
          );
        },
      },
      {
        name: 'Show paths',
        desc: `When enabled, show file's paths on list item.`,
        render: (setting) => {
          setting.addToggle((toggle) =>
            toggle.setValue(settings.showPaths).onChange(async (value) => {
              settings.showPaths = value;
              await this._plugin.saveData(this._plugin.settings);
              this.refreshSettingsView();
            }),
          );
        },
      },
      {
        name: 'Include paths in the search',
        desc: `When enabled, include paths in the search. This setting is valid when "Show paths" is enabled.`,
        render: (setting) => {
          setting.setDisabled(!settings.showPaths).addToggle((toggle) =>
            toggle.setValue(settings.includePaths).onChange(async (value) => {
              settings.includePaths = value;
              await this._plugin.saveData(this._plugin.settings);
            }),
          );
        },
      },
      {
        name: 'Show legends',
        desc: 'When enabled, show legends on modal.',
        render: (setting) => {
          setting.addToggle((toggle) =>
            toggle.setValue(settings.showLegends).onChange(async (value) => {
              settings.showLegends = value;
              await this._plugin.saveData(this._plugin.settings);
            }),
          );
        },
      },
      {
        name: 'Color of button frame on focus',
        desc: 'Choice your favorite color.',
        render: (setting) => {
          setting.addColorPicker((colorPicker) =>
            colorPicker.setValue(settings.focusColor).onChange(async (value) => {
              settings.focusColor = value;
              await this._plugin.saveData(this._plugin.settings);
            }),
          );
          const setDefaultValue = () =>
            (settings.focusColor = DEFAULT_SETTINGS[settingType].focusColor);
          this.addResetButton(setting, setDefaultValue);
        },
      },
    ];
  }

  private isDuplicateChars(chars: string[]): boolean {
    return chars.some((char, idx) => chars.slice(idx + 1).includes(char));
  }

  private applyCharactersTextControl(
    setting: Setting,
    settings: { characters: string },
    attrs: { maxLength?: number; pattern: string },
  ): Setting {
    return setting.addText((text) => {
      let orgCharacters = settings.characters;
      const textComponent = text
        .setPlaceholder('Enter characters')
        .setValue(settings.characters)
        .onChange(async (value) => {
          const { inputEl } = textComponent;
          if (!this.isDuplicateChars([...value]) && inputEl.validity.valid) {
            inputEl.removeClass('ts-setting-is-invalid');
            settings.characters = value;
            orgCharacters = value;
            await this._plugin.saveSettings();
          } else {
            inputEl.addClass('ts-setting-is-invalid');
          }
        });

      textComponent.inputEl.addEventListener('blur', () => {
        if (
          this.isDuplicateChars([...textComponent.inputEl.value]) ||
          !textComponent.inputEl.validity.valid
        ) {
          settings.characters = orgCharacters;
        }
      });
      textComponent.inputEl.setAttrs({
        ...(attrs.maxLength !== undefined ? { maxLength: attrs.maxLength } : {}),
        required: true,
        pattern: attrs.pattern,
      });
      return textComponent;
    });
  }

  private buildDropdownOptions(
    valueTexts: Record<string, string>,
    displayTexts: Record<string, string>,
  ): Record<string, string> {
    return Object.keys(valueTexts).reduce(
      (obj, key) => ((obj[key] = displayTexts[key]), obj),
      {} as Record<string, string>,
    );
  }

  private convertToKey(value: string, valueTexts: Record<string, string>): string {
    const modifier = Object.entries(valueTexts).find(([, val]) => val === value);
    return modifier ? modifier[0] : '';
  }

  private convertToSettingValue<T extends Record<string, string>>(
    value: string,
    valueTexts: T,
    displayTexts: Record<string, string>,
  ): T[keyof T] {
    const key = Object.keys(displayTexts).find((key) => key === value);
    return (key ? (valueTexts as Record<string, string>)[key] : '') as T[keyof T];
  }

  private convertToDisplayText(
    value: string,
    valueTexts: Record<string, string>,
    displayTexts: Record<string, string>,
  ): string {
    return displayTexts[this.convertToKey(value, valueTexts)];
  }

  private addResetButton(settingEl: Setting, setDefaultValue: () => void): void {
    settingEl.addExtraButton((button) =>
      button
        .setIcon('reset')
        .setTooltip('Reset to default')
        .onClick(async () => {
          setDefaultValue();
          await this._plugin.saveSettings();
          this.refreshSettingsView();
        }),
    );
  }

  /**
   * Re-renders whichever of `display()` / `getSettingDefinitions()` produced
   * the currently visible settings UI. Setting-control logic is shared
   * between both render paths (see `renderDefinitionsInto`) and should call
   * this instead of `display()` or `update()` directly.
   */
  private refreshSettingsView(): void {
    if (this._renderMode === 'declarative') {
      this.update();
    } else {
      this.display();
    }
  }
}
