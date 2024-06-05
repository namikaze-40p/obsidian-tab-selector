import { App, Platform } from 'obsidian';
import { CustomApp } from './type';
import { HOW_TO_NEXT_TAB, MODIFIER_KEY, Settings } from './settings';
import { KeySettingsError } from './error';

const STYLES_ID = 'tab-selector-styles';

export const isValidSettings = (app: App, settings: Settings, isThrowError = true): boolean => {
	const customKeys = (app as CustomApp).hotkeyManager?.customKeys;
	const toPrevHotkeys = (customKeys && customKeys['tab-selector:go-to-previous-tab'] || []);
	const toNextHotkeys = customKeys && customKeys['tab-selector:go-to-next-tab'] || [];
	const details = { settings, toPrevHotkeys, toNextHotkeys };

	if (!toPrevHotkeys[0] || !toNextHotkeys[0] || toPrevHotkeys.length > 1 || toNextHotkeys.length > 1) {
		if (isThrowError) {
			throw new KeySettingsError('Invalid settings: Case1', details);
		}
		return false;
	}

	const toPrevHotkey = toPrevHotkeys[0];
	const toNextHotkey = toNextHotkeys[0];
	const { mainModifierKey, subModifierKey, actionKey, reverseActionKey, howToNextTab } = settings;
	const useSubModifier = howToNextTab === HOW_TO_NEXT_TAB.useSubModifierKey;

	let errCaseNo = 0;

	if (convertModifierKey(toPrevHotkey.modifiers[0]) !== mainModifierKey) {
		errCaseNo = errCaseNo || 2
	}
	if (useSubModifier) {
		if (toPrevHotkey.key !== actionKey || toNextHotkey.key !== actionKey) {
			errCaseNo = errCaseNo || toPrevHotkey.key !== actionKey ? 3 : 4;
		}
		if (toNextHotkey.modifiers.filter(modifier => convertModifierKey(modifier) === subModifierKey).length !== 1) {
			errCaseNo = errCaseNo || 5;
		}
	} else {
		if (toPrevHotkey.key !== actionKey || toNextHotkey.key !== reverseActionKey) {
			errCaseNo = errCaseNo || toPrevHotkey.key !== actionKey ? 6 : 7;
		}
	}
	if (errCaseNo > 0 && isThrowError) {
		throw new KeySettingsError(`Invalid settings: Case${errCaseNo}`, details);
	}
	return errCaseNo === 0;
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

export const deleteStyles = () => {
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
