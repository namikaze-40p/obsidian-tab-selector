import { App, Platform } from 'obsidian';
import { CustomApp } from './type';
import { GoToPreviousNextTabSettings, HOW_TO_NEXT_TAB, MODIFIER_KEY } from './settings';
import { KeySettingsError } from './error';

const STYLES_ID = 'tab-selector-styles';

const INVALID_SETTING = {
	notOnlyOneHotkey: 'Not only one hotkey.',
	mismatchMainModifierKey: 'Mismatch main modifier key.',
	mismatchActionKey: 'Mismatch action key.',
	mismatchSubModifierKey: 'Mismatch sub modifier key.',
	useDuplicateModifierKey: 'Use duplicate modifier key.',	
	useDuplicateActionKey: 'Use duplicate action key.',	
} as const;

export const isValidSettings = (app: App, settings: GoToPreviousNextTabSettings, isThrowError = true): boolean => {
	const customKeys = (app as CustomApp).hotkeyManager?.customKeys;
	const toPrevHotkeys = (customKeys && customKeys['tab-selector:go-to-previous-tab'] || []);
	const toNextHotkeys = customKeys && customKeys['tab-selector:go-to-next-tab'] || [];
	const details = { settings, toPrevHotkeys, toNextHotkeys };

	if (!toPrevHotkeys[0] || !toNextHotkeys[0] || toPrevHotkeys.length > 1 || toNextHotkeys.length > 1) {
		if (isThrowError) {
			throw new KeySettingsError(`Invalid settings: ${INVALID_SETTING.notOnlyOneHotkey}`, details);
		}
		return false;
	}

	const toPrevHotkey = toPrevHotkeys[0];
	const toNextHotkey = toNextHotkeys[0];
	const { mainModifierKey, subModifierKey, actionKey, reverseActionKey, howToNextTab } = settings;
	const useSubModifier = howToNextTab === HOW_TO_NEXT_TAB.useSubModifierKey;

	let errCase = '';

	if (convertModifierKey(toPrevHotkey.modifiers[0]) !== mainModifierKey) {
		errCase = errCase || INVALID_SETTING.mismatchMainModifierKey;
	}
	if (useSubModifier) {
		if (toPrevHotkey.key !== actionKey || toNextHotkey.key !== actionKey) {
			errCase = errCase || INVALID_SETTING.mismatchActionKey;
		}
		if (toNextHotkey.modifiers.filter(modifier => convertModifierKey(modifier) === subModifierKey).length !== 1) {
			errCase = errCase || INVALID_SETTING.mismatchSubModifierKey;
		}
		if (mainModifierKey === subModifierKey) {
			errCase = errCase || INVALID_SETTING.useDuplicateModifierKey;
		}
	} else {
		if (toPrevHotkey.key !== actionKey || toNextHotkey.key !== reverseActionKey) {
			errCase = errCase || INVALID_SETTING.useDuplicateActionKey;
		}
	}
	if (errCase && isThrowError) {
		throw new KeySettingsError(`Invalid settings: ${errCase}`, details);
	}
	return !errCase;
}

const convertModifierKey = (key: string): string => {
	switch (key) {
		case 'Mod':
			return Platform.isMacOS || Platform.isIosApp ? MODIFIER_KEY.meta : MODIFIER_KEY.ctrl;
		case 'Ctrl':
			return MODIFIER_KEY.ctrl
		case 'Meta':
		case 'Shift':
		case 'Alt':
		default:
			return key;
	}
}

export const deleteStyles = (): void => {
	const styleElm = document.getElementById(STYLES_ID);
	if (styleElm) {
		document.getElementsByTagName('HEAD')[0].removeChild(styleElm);
	}
};

export const createStyles = (styles: { selector: string, property: string, value: string }[]): void => {
	const styleSheet = document.createElement('style');
	setAttributes(styleSheet, { type: 'text/css', id: STYLES_ID });

	const header = document.getElementsByTagName('HEAD')[0];
	header.appendChild(styleSheet);

	styles.forEach(({ selector, property, value }) => {
		addNewStyle(selector, `${property}: ${value}`, styleSheet);
	});
};

const setAttributes = (element: HTMLElement, attributes: { [key: string]: string }): void => {
	for (const key in attributes) {
		element.setAttribute(key, attributes[key]);
	}
};

const addNewStyle = (selector: string, style: string, sheet: HTMLElement): void => {
	sheet.textContent += selector + `{${style}}`;
};
