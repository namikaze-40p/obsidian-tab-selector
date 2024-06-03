import { App } from 'obsidian';
import { CustomApp } from './type';
import { HOW_TO_NEXT_TAB, MODIFIER_KEY, Settings } from './settings';

const STYLES_ID = 'tab-selector-styles';

export const isValidSetting = (app: App, settings: Settings): boolean => {
	const customKeys = (app as CustomApp).hotkeyManager?.customKeys;
	const toPrevHotkeys = customKeys && customKeys['tab-selector:go-to-previous-tab'] || [];
	const toNextHotkeys = customKeys && customKeys['tab-selector:go-to-next-tab'] || [];

	if (!toPrevHotkeys[0] || !toNextHotkeys[0] || toPrevHotkeys.length > 1 || toNextHotkeys.length > 1) {
		return false;
	}

	const toPrevHotkey = toPrevHotkeys[0];
	const toNextHotkey = toNextHotkeys[0];
	const { mainModifierKey, subModifierKey, actionKey, reverseActionKey, howToNextTab } = settings;
	const mainModKey = convertToHotkeyModifier(mainModifierKey);
	const subModKey = convertToHotkeyModifier(subModifierKey);
	const useSubModifier = howToNextTab === HOW_TO_NEXT_TAB.useSubModifierKey;

	if (toPrevHotkey.modifiers[0] !== mainModKey) {
		console.error(`Hotkey's modifier key and main modifier key mismatch.`);
		console.table({ hotkeyModifier: toPrevHotkey.modifiers[0], mainModifierKey, mainModKey });
		return false;
	}
	if (useSubModifier) {
		if (toPrevHotkey.key !== actionKey || toNextHotkey.key !== actionKey) {
			if (toPrevHotkey.key !== actionKey) {
				console.error(`In case "Use sub modifier" | Hotkey's action key and action key mismatch.`);
				console.table({ hotkeyAction: toPrevHotkey.key, actionKey });
			}
			if (toNextHotkey.key !== actionKey) {
				console.error(`In case "Use sub modifier" | Hotkey's reverse action key and action key mismatch.`);
				console.table({ hotkeyAction: toNextHotkey.key, actionKey });
			}
			return false;
		}
		if (toNextHotkey.modifiers.filter(modifier => modifier === subModKey).length !== 1) {
			console.error(`In case "Use sub modifier" | Hotkey's modifier keys are unexpected.`);
			console.table({ hotkeyModifiers: toNextHotkey.modifiers, subModKey });
			return false;
		}
	} else {
		if (toPrevHotkey.key !== actionKey || toNextHotkey.key !== reverseActionKey) {
			if (toPrevHotkey.key !== actionKey) {
				console.error(`In case "Use reverse action key" | Hotkey's action key and action key mismatch.`);
				console.table({ hotkeyAction: toPrevHotkey.key, actionKey });
			}
			if (toNextHotkey.key !== reverseActionKey) {
				console.error(`In case "Use reverse action key" | Hotkey's reverse action key and reverse action key mismatch.`);
				console.table({ hotkeyAction: toNextHotkey.key, reverseActionKey });
			}
			return false;
		}
	}
	return true;
}

const convertToHotkeyModifier = (key: string): string => {
	switch (key) {
		case MODIFIER_KEY.ctrl:
			return 'Ctrl';
		case MODIFIER_KEY.meta:
			return 'Mod';
		case MODIFIER_KEY.alt:
		case MODIFIER_KEY.shift:
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
