import { App, View, WorkspaceItem, WorkspaceLeaf, WorkspaceTabs } from 'obsidian';

export type CustomKey = {
		key: string,
		modifiers: string[]
};

export type CustomApp = App & {
	hotkeyManager?: {
		customKeys: {
			[key: string]: CustomKey[],
		},
	},
};

type Property = {
	key: string,
	type: string,
	value: string | string[],
};

export type CustomView = View & {
	metadataEditor?: {
		properties?: Property[],
	},
};

export type CustomWsItem = WorkspaceItem & {
	id: string,
	type: string,
	containerEl: HTMLElement,
};

export type CustomWsLeaf = WorkspaceLeaf & {
	id?: string,
	name?: string,
	activeTime?: number,
	aliases?: string[],
	path?: string,
	deleted?: boolean,
	containerEl?: Element,
	parent?: WorkspaceTabs & { id: string },
};
