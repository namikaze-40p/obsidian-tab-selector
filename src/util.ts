const STYLES_ID = 'tab-selector-styles';

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
